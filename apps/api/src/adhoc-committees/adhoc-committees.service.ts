import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { buildPaginationMeta } from '../common/dto/pagination-meta.dto';
import {
  AdhocCommittee,
  AdhocCommitteeCategory,
  AdhocCommitteeStatus,
} from '../entities/adhoc_committee.entity';
import {
  AdhocCommitteeLawSection,
  AdhocCommitteeLawSectionUsage,
} from '../entities/adhoc_committee_law_section.entity';
import {
  AdhocCommitteePerson,
  AdhocCommitteePersonRole,
} from '../entities/adhoc_committee_person.entity';
import { Commission, CommissionDomain } from '../entities/commission.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { AdhocCommitteeQueryDto } from './dto/adhoc-committee-query.dto';
import {
  AdhocCommitteeDetailResponseDto,
  AdhocCommitteeLawSectionBriefDto,
  AdhocCommitteeLawSectionsByUsageDto,
  AdhocCommitteeListResponseDto,
  AdhocCommitteePeopleByRoleDto,
  AdhocCommitteePersonBriefDto,
  AdhocCommitteeRelatedCommissionDto,
  AdhocCommitteeStoryBriefDto,
  AdhocCommitteeSummaryDto,
  AdhocCommitteeTimelineEventDto,
  AdhocCommitteesByParliamentResponseDto,
} from './dto/adhoc-committee-response.dto';

interface StoryWithLatest {
  id: string;
  title: string;
  slug: string;
  domain: string;
  status: string;
  summary: string | null;
  latest_event_date: string | null;
}

interface AdhocCommitteeStoryCountRow {
  adhoc_committee_id: string;
  story_count: string;
}

/**
 * Query filters for the list endpoint. Keeping a separate type (rather than
 * re-using {@link AdhocCommitteeQueryDto}) means list & count use the same
 * shape without needing the pagination fields.
 */
interface AdhocCommitteeFilters {
  readonly domain?: CommissionDomain;
  readonly status?: AdhocCommitteeStatus;
  readonly category?: AdhocCommitteeCategory;
  readonly parliament_term?: string;
  readonly is_joint_committee?: boolean;
}

@Injectable()
export class AdhocCommitteesService {
  constructor(
    @InjectRepository(AdhocCommittee)
    private readonly committeeRepo: Repository<AdhocCommittee>,
    @InjectRepository(AdhocCommitteePerson)
    private readonly committeePersonRepo: Repository<AdhocCommitteePerson>,
    @InjectRepository(AdhocCommitteeLawSection)
    private readonly committeeLawRepo: Repository<AdhocCommitteeLawSection>,
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    @InjectRepository(TimelineEvent)
    private readonly timelineRepo: Repository<TimelineEvent>,
  ) {}

  /* ---------------------------------------------------------------- list */

  async findAll(
    query: AdhocCommitteeQueryDto,
  ): Promise<AdhocCommitteeListResponseDto> {
    const { page, limit, ...rest } = query;
    const filters: AdhocCommitteeFilters = rest;
    const offset = (page - 1) * limit;

    const qb = this.applyFilters(
      this.committeeRepo.createQueryBuilder('ac'),
      filters,
    );

    qb.orderBy('ac.announced_date', 'DESC', 'NULLS LAST')
      .addOrderBy('ac.created_at', 'DESC')
      .offset(offset)
      .limit(limit);

    const [committees, total] = await Promise.all([
      qb.getMany(),
      this.countMatching(filters),
    ]);

    const storyCounts = await this.loadStoryCounts(committees.map((c) => c.id));

    return {
      data: committees.map((c) =>
        this.mapCommitteeSummary(c, storyCounts.get(c.id) ?? 0),
      ),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  /* -------------------------------------------------------------- detail */

  async findBySlug(slug: string): Promise<AdhocCommitteeDetailResponseDto> {
    const committee = await this.committeeRepo.findOne({ where: { slug } });
    if (!committee) {
      throw new NotFoundException(
        `Ad hoc committee with slug "${slug}" not found.`,
      );
    }

    const [stories, people, lawSections, relatedCommission] = await Promise.all([
      this.loadLinkedStories(committee.id),
      this.loadPeople(committee.id),
      this.loadLawSections(committee.id),
      this.loadRelatedCommission(committee.related_commission_id),
    ]);

    const storyIds = stories.map((s) => s.id);
    const timeline = await this.loadTimelineForStories(storyIds);

    return {
      ...this.mapCommitteeSummary(committee, stories.length),
      stories,
      people: this.groupPeopleByRole(people),
      law_sections: this.groupLawSectionsByUsage(lawSections),
      related_commission: relatedCommission,
      timeline,
    };
  }

  /* -------------------------------------------------------------- by-term */

  /**
   * `/adhoc-committees/by-parliament/:term` accepts either the canonical
   * form ("7th Parliament") or a URL-safe slug variant ("7th-parliament").
   * We normalise to the canonical form before filtering so either URL
   * shape resolves to the same record set.
   */
  async findByParliament(
    term: string,
  ): Promise<AdhocCommitteesByParliamentResponseDto> {
    const normalised = this.normaliseParliamentTerm(term);

    const committees = await this.committeeRepo
      .createQueryBuilder('ac')
      .where('ac.parliament_term = :term', { term: normalised })
      .orderBy('ac.announced_date', 'DESC', 'NULLS LAST')
      .addOrderBy('ac.created_at', 'DESC')
      .getMany();

    if (committees.length === 0) {
      return {
        parliament_term: normalised,
        data: [],
        total: 0,
      };
    }

    const storyCounts = await this.loadStoryCounts(committees.map((c) => c.id));

    return {
      parliament_term: normalised,
      data: committees.map((c) =>
        this.mapCommitteeSummary(c, storyCounts.get(c.id) ?? 0),
      ),
      total: committees.length,
    };
  }

  /* -------------------------------------------------------------- loaders */

  private async countMatching(filters: AdhocCommitteeFilters): Promise<number> {
    return this.applyFilters(
      this.committeeRepo.createQueryBuilder('ac'),
      filters,
    ).getCount();
  }

  private applyFilters(
    qb: SelectQueryBuilder<AdhocCommittee>,
    f: AdhocCommitteeFilters,
  ): SelectQueryBuilder<AdhocCommittee> {
    if (f.domain) qb.andWhere('ac.domain = :domain', { domain: f.domain });
    if (f.status) qb.andWhere('ac.status = :status', { status: f.status });
    if (f.category) qb.andWhere('ac.category = :category', { category: f.category });
    if (f.parliament_term)
      qb.andWhere('ac.parliament_term = :term', { term: f.parliament_term });
    if (f.is_joint_committee !== undefined)
      qb.andWhere('ac.is_joint_committee = :joint', { joint: f.is_joint_committee });
    return qb;
  }

  private async loadLinkedStories(
    committeeId: string,
  ): Promise<AdhocCommitteeStoryBriefDto[]> {
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
      .where('story.adhoc_committee_id = :committeeId', { committeeId })
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

  private async loadPeople(
    committeeId: string,
  ): Promise<AdhocCommitteePersonBriefDto[]> {
    const rows = await this.committeePersonRepo.find({
      where: { adhoc_committee_id: committeeId },
      relations: ['person'],
    });

    return rows.map((cp) => ({
      id: cp.id,
      adhoc_committee_id: cp.adhoc_committee_id,
      person_id: cp.person_id,
      full_name: cp.person.full_name,
      current_role: cp.person.current_role,
      organisation: cp.person.organisation,
      person_status: cp.person.status,
      role: cp.role,
      party_affiliation: cp.party_affiliation,
      summary: cp.summary,
    }));
  }

  private async loadLawSections(
    committeeId: string,
  ): Promise<AdhocCommitteeLawSectionBriefDto[]> {
    const rows = await this.committeeLawRepo.find({
      where: { adhoc_committee_id: committeeId },
      relations: ['law_section', 'law_section.law'],
    });

    return rows.map((row) => ({
      id: row.id,
      adhoc_committee_id: row.adhoc_committee_id,
      law_section_id: row.law_section_id,
      usage_type: row.usage_type,
      section_number: row.law_section.section_number,
      section_title: row.law_section.section_title,
      plain_english: row.law_section.plain_english,
      law_name: row.law_section.law.name,
      law_short_name: row.law_section.law.short_name,
    }));
  }

  private async loadRelatedCommission(
    commissionId: string | null,
  ): Promise<AdhocCommitteeRelatedCommissionDto | null> {
    if (!commissionId) return null;

    const commission = await this.commissionRepo.findOne({
      where: { id: commissionId },
    });
    if (!commission) return null;

    return {
      id: commission.id,
      popular_name: commission.popular_name,
      slug: commission.slug,
      domain: commission.domain,
      status: commission.status,
      chair_name: commission.chair_name,
      produced_prosecutions: commission.produced_prosecutions,
      announced_date: commission.announced_date,
      concluded_date: commission.concluded_date,
    };
  }

  private async loadTimelineForStories(
    storyIds: string[],
  ): Promise<AdhocCommitteeTimelineEventDto[]> {
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
    committeeIds: string[],
  ): Promise<Map<string, number>> {
    if (committeeIds.length === 0) return new Map();

    const rows = await this.storyRepo
      .createQueryBuilder('story')
      .select('story.adhoc_committee_id', 'adhoc_committee_id')
      .addSelect('COUNT(story.id)', 'story_count')
      .where('story.adhoc_committee_id IN (:...ids)', { ids: committeeIds })
      .groupBy('story.adhoc_committee_id')
      .getRawMany<AdhocCommitteeStoryCountRow>();

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.adhoc_committee_id, parseInt(row.story_count, 10));
    }
    return map;
  }

  /* -------------------------------------------------------------- helpers */

  private groupPeopleByRole(
    people: AdhocCommitteePersonBriefDto[],
  ): AdhocCommitteePeopleByRoleDto {
    const grouped: AdhocCommitteePeopleByRoleDto = {
      chair: [],
      member: [],
      witness: [],
      implicated: [],
      legal_rep: [],
      secretary: [],
    };
    for (const person of people) {
      switch (person.role) {
        case AdhocCommitteePersonRole.CHAIR:
          grouped.chair.push(person);
          break;
        case AdhocCommitteePersonRole.MEMBER:
          grouped.member.push(person);
          break;
        case AdhocCommitteePersonRole.WITNESS:
          grouped.witness.push(person);
          break;
        case AdhocCommitteePersonRole.IMPLICATED:
          grouped.implicated.push(person);
          break;
        case AdhocCommitteePersonRole.LEGAL_REP:
          grouped.legal_rep.push(person);
          break;
        case AdhocCommitteePersonRole.SECRETARY:
          grouped.secretary.push(person);
          break;
      }
    }
    return grouped;
  }

  private groupLawSectionsByUsage(
    sections: AdhocCommitteeLawSectionBriefDto[],
  ): AdhocCommitteeLawSectionsByUsageDto {
    const grouped: AdhocCommitteeLawSectionsByUsageDto = {
      enabling: [],
      investigated: [],
      amended: [],
      being_processed: [],
    };
    for (const section of sections) {
      switch (section.usage_type) {
        case AdhocCommitteeLawSectionUsage.ENABLING:
          grouped.enabling.push(section);
          break;
        case AdhocCommitteeLawSectionUsage.INVESTIGATED:
          grouped.investigated.push(section);
          break;
        case AdhocCommitteeLawSectionUsage.AMENDED:
          grouped.amended.push(section);
          break;
        case AdhocCommitteeLawSectionUsage.BEING_PROCESSED:
          grouped.being_processed.push(section);
          break;
      }
    }
    return grouped;
  }

  /**
   * Accepts either "7th Parliament" or "7th-parliament" / "7th_parliament"
   * and returns the canonical form stored in the database.
   */
  private normaliseParliamentTerm(term: string): string {
    const trimmed = term.trim();
    if (/\bparliament\b/i.test(trimmed) && /\s/.test(trimmed)) {
      const parts = trimmed.split(/\s+/).filter(Boolean);
      const ordinal = parts[0].toLowerCase();
      return `${ordinal} Parliament`;
    }

    const slugParts = trimmed.split(/[-_\s]+/).filter(Boolean);
    if (slugParts.length >= 2 && /parliament/i.test(slugParts[slugParts.length - 1])) {
      const ordinal = slugParts[0].toLowerCase();
      return `${ordinal} Parliament`;
    }

    return trimmed;
  }

  /* -------------------------------------------------------------- mapping */

  private mapCommitteeSummary(
    c: AdhocCommittee,
    storyCount: number,
  ): AdhocCommitteeSummaryDto {
    return {
      id: c.id,
      popular_name: c.popular_name,
      full_name: c.full_name,
      slug: c.slug,
      parliament_term: c.parliament_term,
      parliament_years: c.parliament_years,
      domain: c.domain,
      category: c.category,
      established_by: c.established_by,
      enabling_provision: c.enabling_provision,
      is_joint_committee: c.is_joint_committee,
      chair_name: c.chair_name,
      mandate_summary: c.mandate_summary,
      plain_english_summary: c.plain_english_summary,
      announced_date: c.announced_date,
      first_meeting_date: c.first_meeting_date,
      concluded_date: c.concluded_date,
      report_adopted_date: c.report_adopted_date,
      status: c.status,
      outcome_summary: c.outcome_summary,
      produced_legislative_change: c.produced_legislative_change,
      produced_accountability_action: c.produced_accountability_action,
      report_url: c.report_url,
      parliament_url: c.parliament_url,
      related_commission_id: c.related_commission_id,
      created_at: c.created_at.toISOString(),
      updated_at: c.updated_at.toISOString(),
      story_count: storyCount,
    };
  }
}
