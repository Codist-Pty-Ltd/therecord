import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { buildPaginationMeta } from '../common/dto/pagination-meta.dto';
import {
  Commission,
} from '../entities/commission.entity';
import {
  CommissionLawSection,
  CommissionLawSectionUsage,
} from '../entities/commission_law_section.entity';
import {
  CommissionPerson,
  CommissionPersonRole,
} from '../entities/commission_person.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { CommissionQueryDto } from './dto/commission-query.dto';
import {
  CommissionCompareQueryDto,
  CommissionCompareResponseDto,
  CommissionCompareSideDto,
} from './dto/commission-compare.dto';
import {
  CommissionDetailResponseDto,
  CommissionLawSectionBriefDto,
  CommissionListResponseDto,
  CommissionPersonBriefDto,
  CommissionStoryBriefDto,
  CommissionSummaryDto,
  CommissionTimelineEventDto,
  LawSectionsByUsageDto,
} from './dto/commission-response.dto';

interface StoryWithLatest {
  id: string;
  title: string;
  slug: string;
  domain: string;
  status: string;
  summary: string | null;
  latest_event_date: string | null;
}

interface CommissionStoryCountRow {
  commission_id: string;
  story_count: string;
}

@Injectable()
export class CommissionsService {
  constructor(
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
    @InjectRepository(CommissionPerson)
    private readonly commissionPersonRepo: Repository<CommissionPerson>,
    @InjectRepository(CommissionLawSection)
    private readonly commissionLawRepo: Repository<CommissionLawSection>,
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    @InjectRepository(TimelineEvent)
    private readonly timelineRepo: Repository<TimelineEvent>,
  ) {}

  /* ---------------------------------------------------------------- list */

  async findAll(query: CommissionQueryDto): Promise<CommissionListResponseDto> {
    const { page, limit, domain, status } = query;
    const offset = (page - 1) * limit;

    const qb = this.commissionRepo.createQueryBuilder('c');
    if (domain) qb.andWhere('c.domain = :domain', { domain });
    if (status) qb.andWhere('c.status = :status', { status });

    qb.orderBy('c.announced_date', 'DESC', 'NULLS LAST')
      .addOrderBy('c.created_at', 'DESC')
      .offset(offset)
      .limit(limit);

    const [commissions, total] = await Promise.all([
      qb.getMany(),
      this.countMatching(domain, status),
    ]);

    const storyCounts = await this.loadStoryCounts(commissions.map((c) => c.id));

    return {
      data: commissions.map((c) =>
        this.mapCommissionSummary(c, storyCounts.get(c.id) ?? 0),
      ),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  private async countMatching(
    domain: CommissionQueryDto['domain'],
    status: CommissionQueryDto['status'],
  ): Promise<number> {
    const qb = this.commissionRepo.createQueryBuilder('c');
    if (domain) qb.andWhere('c.domain = :domain', { domain });
    if (status) qb.andWhere('c.status = :status', { status });
    return qb.getCount();
  }

  /* -------------------------------------------------------------- detail */

  async findBySlug(slug: string): Promise<CommissionDetailResponseDto> {
    const commission = await this.commissionRepo.findOne({ where: { slug } });
    if (!commission) {
      throw new NotFoundException(`Commission with slug "${slug}" not found.`);
    }

    const [stories, people, lawSections] = await Promise.all([
      this.loadLinkedStories(commission.id),
      this.loadPeople(commission.id),
      this.loadLawSections(commission.id),
    ]);

    const storyIds = stories.map((s) => s.id);
    const timeline = await this.loadTimelineForStories(storyIds);

    return {
      ...this.mapCommissionSummary(commission, stories.length),
      stories,
      people,
      law_sections: this.groupLawSectionsByUsage(lawSections),
      timeline,
    };
  }

  /* ------------------------------------------------------------- compare */

  async compare(
    query: CommissionCompareQueryDto,
  ): Promise<CommissionCompareResponseDto> {
    if (query.left === query.right) {
      throw new BadRequestException(
        'Cannot compare a commission with itself — provide two different slugs.',
      );
    }

    const [leftCommission, rightCommission] = await Promise.all([
      this.commissionRepo.findOne({ where: { slug: query.left } }),
      this.commissionRepo.findOne({ where: { slug: query.right } }),
    ]);

    if (!leftCommission) {
      throw new NotFoundException(`Commission with slug "${query.left}" not found.`);
    }
    if (!rightCommission) {
      throw new NotFoundException(`Commission with slug "${query.right}" not found.`);
    }

    const [left, right] = await Promise.all([
      this.buildCompareSide(leftCommission),
      this.buildCompareSide(rightCommission),
    ]);

    return {
      left,
      right,
      delta: {
        duration_delta_days: this.diffNullableInt(left.duration_days, right.duration_days),
        cost_delta_rands: this.diffNullableBigInt(left.cost_rands, right.cost_rands),
        hearing_days_delta: this.diffNullableInt(
          left.total_hearing_days,
          right.total_hearing_days,
        ),
        prosecutions_winner: this.compareProsecutions(
          left.produced_prosecutions,
          right.produced_prosecutions,
        ),
      },
      implicated_role: CommissionPersonRole.IMPLICATED,
    };
  }

  /* -------------------------------------------------------------- loaders */

  private async loadLinkedStories(
    commissionId: string,
  ): Promise<CommissionStoryBriefDto[]> {
    const rows = await this.storyRepo
      .createQueryBuilder('story')
      .leftJoin('timeline_events', 'te', 'te.story_id = story.id')
      .select([
        'story.id AS id',
        'story.title AS title',
        'story.slug AS slug',
        'story.domain AS domain',
        'story.status AS status',
        'story.summary AS summary',
      ])
      .addSelect('MAX(te.event_date)', 'latest_event_date')
      .where('story.commission_id = :commissionId', { commissionId })
      .groupBy('story.id')
      .orderBy('MAX(te.event_date)', 'ASC', 'NULLS LAST')
      .addOrderBy('story.created_at', 'ASC')
      .getRawMany<StoryWithLatest>();

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      domain: r.domain,
      status: r.status,
      summary: r.summary,
      latest_event_date: r.latest_event_date,
    }));
  }

  private async loadPeople(commissionId: string): Promise<CommissionPersonBriefDto[]> {
    const rows = await this.commissionPersonRepo.find({
      where: { commission_id: commissionId },
      relations: ['person'],
    });

    return rows.map((cp) => ({
      id: cp.id,
      commission_id: cp.commission_id,
      person_id: cp.person_id,
      full_name: cp.person.full_name,
      current_role: cp.person.current_role,
      organisation: cp.person.organisation,
      person_status: cp.person.status,
      role: cp.role,
      summary: cp.summary,
    }));
  }

  private async loadLawSections(
    commissionId: string,
  ): Promise<CommissionLawSectionBriefDto[]> {
    const rows = await this.commissionLawRepo.find({
      where: { commission_id: commissionId },
      relations: ['law_section', 'law_section.law'],
    });

    return rows.map((row) => ({
      id: row.id,
      commission_id: row.commission_id,
      law_section_id: row.law_section_id,
      usage_type: row.usage_type,
      section_number: row.law_section.section_number,
      section_title: row.law_section.section_title,
      plain_english: row.law_section.plain_english,
      law_name: row.law_section.law.name,
      law_short_name: row.law_section.law.short_name,
    }));
  }

  private async loadTimelineForStories(
    storyIds: string[],
  ): Promise<CommissionTimelineEventDto[]> {
    if (storyIds.length === 0) return [];

    const events = await this.timelineRepo.find({
      where: { story_id: In(storyIds) },
      relations: ['story'],
      order: { event_date: 'ASC', created_at: 'ASC' },
    });

    return events.map((e) => ({
      id: e.id,
      story_id: e.story_id,
      story_title: e.story?.title ?? '',
      story_slug: e.story?.slug ?? '',
      event_date: e.event_date,
      event_type: e.event_type,
      title: e.title,
      description: e.description,
      plain_english: e.plain_english,
      significance: e.significance,
    }));
  }

  private async loadStoryCounts(
    commissionIds: string[],
  ): Promise<Map<string, number>> {
    if (commissionIds.length === 0) return new Map();

    const rows = await this.storyRepo
      .createQueryBuilder('story')
      .select('story.commission_id', 'commission_id')
      .addSelect('COUNT(story.id)', 'story_count')
      .where('story.commission_id IN (:...ids)', { ids: commissionIds })
      .groupBy('story.commission_id')
      .getRawMany<CommissionStoryCountRow>();

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.commission_id, parseInt(row.story_count, 10));
    }
    return map;
  }

  /* -------------------------------------------------------------- helpers */

  private async buildCompareSide(
    commission: Commission,
  ): Promise<CommissionCompareSideDto> {
    const [people, lawSections, storyCount] = await Promise.all([
      this.loadPeople(commission.id),
      this.loadLawSections(commission.id),
      this.countStoriesFor(commission.id),
    ]);

    const implicated = people
      .filter((p) => p.role === CommissionPersonRole.IMPLICATED)
      .map((p) => p.full_name);

    const lawsInvoked = Array.from(
      new Set(
        lawSections.map((ls) => `${ls.law_short_name} — ${ls.section_number}`),
      ),
    );

    return {
      id: commission.id,
      popular_name: commission.popular_name,
      slug: commission.slug,
      domain: commission.domain,
      status: commission.status,
      chair_name: commission.chair_name,
      president_who_established: commission.president_who_established,
      announced_date: commission.announced_date,
      hearings_started: commission.hearings_started,
      concluded_date: commission.concluded_date,
      report_released_date: commission.report_released_date,
      duration_days: this.computeDurationDays(
        commission.hearings_started,
        commission.concluded_date,
      ),
      cost_rands: commission.cost_rands,
      total_hearing_days: commission.total_hearing_days,
      produced_prosecutions: commission.produced_prosecutions,
      laws_invoked: lawsInvoked,
      people_implicated: implicated,
      story_count: storyCount,
    };
  }

  private async countStoriesFor(commissionId: string): Promise<number> {
    return this.storyRepo.count({ where: { commission_id: commissionId } });
  }

  private computeDurationDays(
    start: string | null,
    end: string | null,
  ): number | null {
    if (!start || !end) return null;
    const startMs = Date.parse(start);
    const endMs = Date.parse(end);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
    return Math.max(0, Math.round((endMs - startMs) / 86_400_000));
  }

  private diffNullableInt(a: number | null, b: number | null): number | null {
    if (a === null || b === null) return null;
    return b - a;
  }

  /**
   * bigint diff without losing precision for cost figures.
   * TypeORM serialises `bigint` as a JS `string`. We promote to native BigInt
   * for the subtraction, then back to string for transport.
   */
  private diffNullableBigInt(a: string | null, b: string | null): string | null {
    if (a === null || b === null) return null;
    try {
      return (BigInt(b) - BigInt(a)).toString();
    } catch {
      return null;
    }
  }

  private compareProsecutions(
    left: boolean | null,
    right: boolean | null,
  ): 'left' | 'right' | 'both' | 'neither' | 'unknown' {
    if (left === null || right === null) return 'unknown';
    if (left && right) return 'both';
    if (!left && !right) return 'neither';
    return left ? 'left' : 'right';
  }

  private groupLawSectionsByUsage(
    sections: CommissionLawSectionBriefDto[],
  ): LawSectionsByUsageDto {
    const grouped: LawSectionsByUsageDto = {
      enabling: [],
      investigated: [],
      violated: [],
      recommended: [],
    };
    for (const section of sections) {
      switch (section.usage_type) {
        case CommissionLawSectionUsage.ENABLING:
          grouped.enabling.push(section);
          break;
        case CommissionLawSectionUsage.INVESTIGATED:
          grouped.investigated.push(section);
          break;
        case CommissionLawSectionUsage.VIOLATED:
          grouped.violated.push(section);
          break;
        case CommissionLawSectionUsage.RECOMMENDED:
          grouped.recommended.push(section);
          break;
      }
    }
    return grouped;
  }

  /* -------------------------------------------------------------- mapping */

  private mapCommissionSummary(
    c: Commission,
    storyCount: number,
  ): CommissionSummaryDto {
    return {
      id: c.id,
      popular_name: c.popular_name,
      full_name: c.full_name,
      slug: c.slug,
      domain: c.domain,
      enabling_legislation: c.enabling_legislation,
      constitution_section_invoked: c.constitution_section_invoked,
      reason_summary: c.reason_summary,
      plain_english_summary: c.plain_english_summary,
      chair_name: c.chair_name,
      announced_date: c.announced_date,
      hearings_started: c.hearings_started,
      concluded_date: c.concluded_date,
      report_released_date: c.report_released_date,
      status: c.status,
      official_url: c.official_url,
      report_url: c.report_url,
      cost_rands: c.cost_rands,
      total_hearing_days: c.total_hearing_days,
      outcome_summary: c.outcome_summary,
      produced_prosecutions: c.produced_prosecutions,
      president_who_established: c.president_who_established,
      created_at: c.created_at.toISOString(),
      updated_at: c.updated_at.toISOString(),
      story_count: storyCount,
    };
  }
}
