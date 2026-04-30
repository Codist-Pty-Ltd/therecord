import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Commission } from '../entities/commission.entity';
import {
  AccountabilityBody,
  AccountabilityBodyStatus,
} from '../entities/accountability-body.entity';
import {
  AccountabilityBodyCase,
} from '../entities/accountability-body-case.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import {
  AccountabilityBodiesCompareQueryDto,
  AccountabilityBodyCaseResponseDto,
  AccountabilityBodyCasesListResponseDto,
  AccountabilityBodyCasesQueryDto,
  AccountabilityBodyCompareResponseDto,
  AccountabilityBodyCompareRowDto,
  AccountabilityBodyComparisonContextDto,
  AccountabilityBodyDetailDto,
  AccountabilityBodyEmbedDto,
  AccountabilityBodyLinkedStoryDto,
  AccountabilityBodyListQueryDto,
  AccountabilityBodyRelatedCommissionDto,
  AccountabilityBodyResponseDto,
  AccountabilityBodyTimelineEventDto,
  AccountabilityBodyTimelineResponseDto,
} from './dto/accountability-body.dto';

@Injectable()
export class AccountabilityBodiesService {
  constructor(
    @InjectRepository(AccountabilityBody)
    private readonly bodyRepo: Repository<AccountabilityBody>,
    @InjectRepository(AccountabilityBodyCase)
    private readonly caseRepo: Repository<AccountabilityBodyCase>,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    @InjectRepository(TimelineEvent)
    private readonly timelineRepo: Repository<TimelineEvent>,
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
  ) {}

  async findAll(query: AccountabilityBodyListQueryDto): Promise<AccountabilityBodyResponseDto[]> {
    const qb = this.bodyRepo.createQueryBuilder('b').orderBy('b.established_date', 'ASC');
    if (query.status != null) {
      qb.andWhere('b.status = :status', { status: query.status });
    }
    if (query.body_type != null) {
      qb.andWhere('b.body_type = :body_type', { body_type: query.body_type });
    }
    const rows = await qb.getMany();
    return rows.map((r) => this.mapBody(r));
  }

  async findBySlug(slug: string): Promise<AccountabilityBodyDetailDto> {
    const body = await this.bodyRepo.findOne({ where: { slug } });
    if (!body) {
      throw new NotFoundException(`Accountability body with slug "${slug}" not found.`);
    }

    const [cases, relatedCommissions, linkedStories, comparison] = await Promise.all([
      this.caseRepo.find({
        where: { body_id: body.id },
        order: { case_year_start: 'ASC', case_name: 'ASC' },
      }),
      this.loadRelatedCommissions(body.id),
      this.loadLinkedStories(body.id),
      this.buildComparisonContext(body),
    ]);

    return {
      ...this.mapBody(body),
      cases: cases.map((c) => this.mapCase(c)),
      related_commissions: relatedCommissions,
      linked_stories: linkedStories,
      comparison,
    };
  }

  async findCasesForSlug(
    slug: string,
    query: AccountabilityBodyCasesQueryDto,
  ): Promise<AccountabilityBodyCasesListResponseDto> {
    const body = await this.bodyRepo.findOne({ where: { slug } });
    if (!body) {
      throw new NotFoundException(`Accountability body with slug "${slug}" not found.`);
    }

    const qb = this.caseRepo
      .createQueryBuilder('c')
      .where('c.body_id = :bid', { bid: body.id });

    if (query.outcome != null) {
      qb.andWhere('c.outcome = :outcome', { outcome: query.outcome });
    }
    if (query.significance != null) {
      qb.andWhere('c.significance = :sig', { sig: query.significance });
    }

    const sort = query.sort ?? 'case_year_start_asc';
    if (sort === 'value_rands_desc') {
      qb.orderBy('c.value_rands', 'DESC', 'NULLS LAST').addOrderBy('c.case_year_start', 'ASC');
    } else {
      qb.orderBy('c.case_year_start', 'ASC').addOrderBy('c.case_name', 'ASC');
    }

    const rows = await qb.getMany();
    return { data: rows.map((r) => this.mapCase(r)) };
  }

  async compare(query: AccountabilityBodiesCompareQueryDto): Promise<AccountabilityBodyCompareResponseDto> {
    const rawSlugs = query.bodies
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const slugs = [...new Set(rawSlugs)];
    if (slugs.length === 0) {
      throw new BadRequestException('Provide at least one body slug.');
    }
    if (slugs.length > 10) {
      throw new BadRequestException('At most 10 bodies can be compared at once.');
    }

    const bodies: AccountabilityBody[] = [];
    for (const slug of slugs) {
      const b = await this.bodyRepo.findOne({ where: { slug } });
      if (!b) {
        throw new NotFoundException(`Accountability body with slug "${slug}" not found.`);
      }
      bodies.push(b);
    }

    const rows: AccountabilityBodyCompareRowDto[] = bodies.map((b) => ({
      name: b.popular_name,
      abbreviation: b.abbreviation,
      status: b.status,
      conviction_rate_percentage: b.conviction_rate_percentage,
      total_investigations: b.total_investigations,
      total_convictions: b.total_convictions,
      assets_seized_rands: b.assets_seized_rands,
      parent_organisation: b.parent_organisation,
      years_active: this.computeYearsActive(b),
      was_political_disbanding: b.was_political_disbanding,
    }));

    return { bodies: rows };
  }

  async timeline(slug: string): Promise<AccountabilityBodyTimelineResponseDto> {
    const body = await this.bodyRepo.findOne({ where: { slug } });
    if (!body) {
      throw new NotFoundException(`Accountability body with slug "${slug}" not found.`);
    }

    const events = await this.timelineRepo
      .createQueryBuilder('te')
      .innerJoinAndSelect('te.story', 's')
      .where('s.accountability_body_id = :bid', { bid: body.id })
      .orderBy('te.event_date', 'ASC')
      .addOrderBy('te.created_at', 'ASC')
      .getMany();

    const dtos: AccountabilityBodyTimelineEventDto[] = events.map((te) => ({
      id: te.id,
      story_id: te.story_id,
      story_title: te.story.title,
      story_slug: te.story.slug,
      event_date: te.event_date,
      event_type: te.event_type,
      title: te.title,
      description: te.description,
      plain_english: te.plain_english,
      significance: te.significance,
    }));

    return { events: dtos };
  }

  private async loadRelatedCommissions(bodyId: string): Promise<AccountabilityBodyRelatedCommissionDto[]> {
    const rows = await this.commissionRepo.find({
      where: { subject_body_id: bodyId },
      order: { announced_date: 'DESC', created_at: 'DESC' },
    });
    return rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      popular_name: c.popular_name,
      full_name: c.full_name,
      status: c.status,
    }));
  }

  private async loadLinkedStories(bodyId: string): Promise<AccountabilityBodyLinkedStoryDto[]> {
    const rows = await this.storyRepo.find({
      where: { accountability_body_id: bodyId },
      order: { updated_at: 'DESC' },
    });
    return rows.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      domain: s.domain,
      status: s.status,
      summary: s.summary,
    }));
  }

  private async buildComparisonContext(
    body: AccountabilityBody,
  ): Promise<AccountabilityBodyComparisonContextDto> {
    const peer_slugs: string[] = [];
    let successor: AccountabilityBody | null = null;
    let predecessor: AccountabilityBody | null = null;

    if (body.slug === 'scorpions-dso') {
      successor = await this.bodyRepo.findOne({ where: { slug: 'hawks-dpci' } });
      peer_slugs.push('hawks-dpci', 'idac');
    } else if (body.slug === 'hawks-dpci') {
      predecessor = await this.bodyRepo.findOne({ where: { slug: 'scorpions-dso' } });
      peer_slugs.push('scorpions-dso', 'idac');
    } else if (body.slug === 'idac') {
      peer_slugs.push('scorpions-dso', 'hawks-dpci');
    } else {
      const others = await this.bodyRepo.find({
        order: { established_date: 'ASC' },
        take: 5,
      });
      for (const o of others) {
        if (o.id !== body.id) peer_slugs.push(o.slug);
      }
    }

    return {
      successor: successor ? this.mapEmbed(successor) : null,
      predecessor: predecessor ? this.mapEmbed(predecessor) : null,
      peer_slugs,
    };
  }

  private computeYearsActive(body: AccountabilityBody): number | null {
    const start = body.operational_date ?? body.established_date;
    if (!start) return null;

    let endStr: string | null = body.disbanded_date;
    if (endStr == null && body.status === AccountabilityBodyStatus.ACTIVE) {
      endStr = new Date().toISOString().slice(0, 10);
    }
    if (endStr == null) return null;

    const t0 = Date.parse(start);
    const t1 = Date.parse(endStr);
    if (Number.isNaN(t0) || Number.isNaN(t1) || t1 < t0) return null;
    return Math.round(((t1 - t0) / (86_400_000 * 365.25)) * 10) / 10;
  }

  mapEmbed(b: AccountabilityBody): AccountabilityBodyEmbedDto {
    return {
      id: b.id,
      slug: b.slug,
      popular_name: b.popular_name,
      abbreviation: b.abbreviation,
      name: b.name,
      body_type: b.body_type,
      status: b.status,
    };
  }

  mapBody(b: AccountabilityBody): AccountabilityBodyResponseDto {
    return {
      id: b.id,
      name: b.name,
      popular_name: b.popular_name,
      abbreviation: b.abbreviation,
      slug: b.slug,
      body_type: b.body_type,
      parent_organisation: b.parent_organisation,
      enabling_legislation: b.enabling_legislation,
      constitution_section: b.constitution_section,
      status: b.status,
      established_date: b.established_date,
      announced_date: b.announced_date,
      operational_date: b.operational_date,
      disbanded_date: b.disbanded_date,
      replaced_by: b.replaced_by,
      disbanded_reason: b.disbanded_reason,
      mandate_summary: b.mandate_summary,
      plain_english_summary: b.plain_english_summary,
      plain_english_child: b.plain_english_child,
      tactics: b.tactics,
      distinguishing_features: b.distinguishing_features,
      leadership_history: b.leadership_history,
      total_investigations: b.total_investigations,
      total_prosecutions: b.total_prosecutions,
      total_convictions: b.total_convictions,
      conviction_rate_percentage: b.conviction_rate_percentage,
      total_arrests: b.total_arrests,
      assets_seized_rands: b.assets_seized_rands,
      financial_losses_recovered_rands: b.financial_losses_recovered_rands,
      cases_transferred_on_dissolution: b.cases_transferred_on_dissolution,
      staff_count_at_peak: b.staff_count_at_peak,
      annual_budget_rands: b.annual_budget_rands,
      legacy_summary: b.legacy_summary,
      cases_outcome_after_transfer: b.cases_outcome_after_transfer,
      was_political_disbanding: b.was_political_disbanding,
      political_disbanding_evidence: b.political_disbanding_evidence,
      created_at: b.created_at.toISOString(),
      updated_at: b.updated_at.toISOString(),
    };
  }

  private mapCase(c: AccountabilityBodyCase): AccountabilityBodyCaseResponseDto {
    return {
      id: c.id,
      body_id: c.body_id,
      story_id: c.story_id,
      case_name: c.case_name,
      accused_names: c.accused_names,
      charge_summary: c.charge_summary,
      case_year_start: c.case_year_start,
      case_year_end: c.case_year_end,
      outcome: c.outcome,
      outcome_detail: c.outcome_detail,
      significance: c.significance,
      value_rands: c.value_rands,
      plain_english: c.plain_english,
      law_sections_applied: c.law_sections_applied,
      created_at: c.created_at.toISOString(),
    };
  }
}
