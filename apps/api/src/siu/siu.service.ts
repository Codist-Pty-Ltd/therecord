import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { buildPaginationMeta } from '../common/dto/pagination-meta.dto';
import { AdhocCommittee } from '../entities/adhoc_committee.entity';
import { Commission, CommissionDomain } from '../entities/commission.entity';
import { SiuBody } from '../entities/siu_body.entity';
import {
  ProclamationStatus,
  SiuProclamation,
} from '../entities/siu_proclamation.entity';
import { SiuInvestigationOutcome } from '../entities/siu_investigation_outcome.entity';
import { SiuProclamationPerson } from '../entities/siu_proclamation_person.entity';
import { SiuProclamationStory } from '../entities/siu_proclamation_story.entity';
import { SpecialTribunal } from '../entities/special_tribunal.entity';
import { SpecialTribunalCase } from '../entities/special_tribunal_case.entity';
import { Law } from '../entities/law.entity';
import {
  SiuProclamationLawSection,
  SiuLawSectionUsage,
} from '../entities/siu_proclamation_law_section.entity';
import { Story } from '../entities/story.entity';
import { LawResponseDto } from '../legal/dto/legal-response.dto';
import { SiuProclamationQueryDto } from './dto/siu-proclamation-query.dto';
import {
  SiuBodyDto,
  SiuInvestigationOutcomeDto,
  SiuOverviewResponseDto,
  SiuProclamationDetailResponseDto,
  SiuProclamationLawSectionItemDto,
  SiuProclamationLawSectionsByUsageDto,
  SiuProclamationListResponseDto,
  SiuProclamationPersonBriefDto,
  SiuProclamationStoryBriefDto,
  SiuProclamationSummaryDto,
  SiuRelatedAdhocCommitteeDto,
  SiuRelatedCommissionDto,
  SiuStatsDto,
  SpecialTribunalCaseBriefDto,
  SpecialTribunalCaseDetailResponseDto,
  SpecialTribunalDto,
  SpecialTribunalOverviewResponseDto,
} from './dto/siu-response.dto';
import { TribunalCaseQueryDto } from './dto/tribunal-case-query.dto';

interface ProclamationFilters {
  readonly status?: ProclamationStatus;
  readonly domain?: CommissionDomain;
  readonly president_who_signed?: string;
}

interface ProclamationStoryRow {
  id: string;
  title: string;
  slug: string;
  domain: string;
  status: string;
  summary: string | null;
  latest_event_date: string | null;
}

interface ProclamationStoryCountRow {
  proclamation_id: string;
  story_count: string;
}

interface ProclamationOutcomeAggregateRow {
  proclamation_id: string;
  recovered_rands: string | null;
  investigated_rands: string | null;
  npa_referrals: string | null;
  department_referrals: string | null;
  tribunal_cases_filed: string | null;
}

/**
 * The shape that {@link SiuService.loadOutcomeAggregates} surfaces for each
 * proclamation in a list view. Mirrors the optional outcome-derived fields
 * on {@link SiuProclamationSummaryDto}; counts are coerced to numbers but
 * Rand values stay string-encoded to preserve bigint precision.
 */
interface ProclamationOutcomeAggregate {
  recovered_rands: string | null;
  investigated_rands: string | null;
  npa_referrals: number;
  department_referrals: number;
  tribunal_cases_filed: number;
}

const ZERO_OUTCOME_AGGREGATE: ProclamationOutcomeAggregate = {
  recovered_rands: null,
  investigated_rands: null,
  npa_referrals: 0,
  department_referrals: 0,
  tribunal_cases_filed: 0,
};

/**
 * Aggregate row shape returned by the stats query. Postgres `SUM(bigint)`
 * returns `numeric` — typed as string to preserve precision over the wire.
 */
interface SiuStatsRow {
  total_proclamations: string;
  active_proclamations_count: string;
  concluded_proclamations_count: string;
  total_investigated_rands: string | null;
  total_recovered_rands: string | null;
  total_prevented_rands: string | null;
  total_civil_litigation_rands: string | null;
  total_npa_referrals: string | null;
  total_hawks_referrals: string | null;
  total_department_referrals: string | null;
  total_employees_dismissed: string | null;
  total_tribunal_cases: string;
}

@Injectable()
export class SiuService {
  constructor(
    @InjectRepository(SiuBody)
    private readonly bodyRepo: Repository<SiuBody>,
    @InjectRepository(SiuProclamation)
    private readonly proclamationRepo: Repository<SiuProclamation>,
    @InjectRepository(SiuInvestigationOutcome)
    private readonly outcomeRepo: Repository<SiuInvestigationOutcome>,
    @InjectRepository(SiuProclamationPerson)
    private readonly proclamationPersonRepo: Repository<SiuProclamationPerson>,
    @InjectRepository(SiuProclamationStory)
    private readonly proclamationStoryRepo: Repository<SiuProclamationStory>,
    @InjectRepository(SpecialTribunal)
    private readonly tribunalRepo: Repository<SpecialTribunal>,
    @InjectRepository(SpecialTribunalCase)
    private readonly tribunalCaseRepo: Repository<SpecialTribunalCase>,
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
    @InjectRepository(AdhocCommittee)
    private readonly adhocRepo: Repository<AdhocCommittee>,
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    @InjectRepository(SiuProclamationLawSection)
    private readonly siuProclamationLawSectionRepo: Repository<SiuProclamationLawSection>,
  ) {}

  /* ============================================================ overview */

  /**
   * `GET /siu` — singleton body row + headline stats. The first time the
   * endpoint is hit on a fresh database (no `siu_body` row exists yet)
   * we 404 cleanly rather than fabricating a placeholder, so the
   * frontend can show an explicit "data not yet seeded" state.
   */
  async getOverview(): Promise<SiuOverviewResponseDto> {
    const body = await this.bodyRepo
      .createQueryBuilder('body')
      .orderBy('body.created_at', 'ASC')
      .limit(1)
      .getOne();

    if (!body) {
      throw new NotFoundException(
        'SIU body has not been seeded. Run the SIU seed before querying /siu.',
      );
    }

    const stats = await this.computeStats();
    return { body: this.mapBody(body), stats };
  }

  async getStats(): Promise<SiuStatsDto> {
    return this.computeStats();
  }

  /* ===================================================== proclamations */

  async findAllProclamations(
    query: SiuProclamationQueryDto,
  ): Promise<SiuProclamationListResponseDto> {
    const { page, limit, ...rest } = query;
    const filters: ProclamationFilters = rest;
    const offset = (page - 1) * limit;

    const qb = this.applyProclamationFilters(
      this.proclamationRepo.createQueryBuilder('p'),
      filters,
    );

    qb.orderBy('p.signed_date', 'DESC', 'NULLS LAST')
      .addOrderBy('p.created_at', 'DESC')
      .offset(offset)
      .limit(limit);

    const [proclamations, total] = await Promise.all([
      qb.getMany(),
      this.countProclamations(filters),
    ]);

    const ids = proclamations.map((p) => p.id);
    const [storyCounts, aggregates] = await Promise.all([
      this.loadStoryCounts(ids),
      this.loadOutcomeAggregates(ids),
    ]);

    return {
      data: proclamations.map((p) =>
        this.mapProclamationSummary(
          p,
          storyCounts.get(p.id) ?? 0,
          aggregates.get(p.id) ?? ZERO_OUTCOME_AGGREGATE,
        ),
      ),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findProclamationBySlug(
    slug: string,
  ): Promise<SiuProclamationDetailResponseDto> {
    const proclamation = await this.proclamationRepo.findOne({ where: { slug } });
    if (!proclamation) {
      throw new NotFoundException(
        `SIU proclamation with slug "${slug}" not found.`,
      );
    }

    const [
      outcome,
      tribunalCases,
      stories,
      people,
      relCommission,
      relAdhoc,
      lawSectionsByUsage,
    ] = await Promise.all([
      this.loadOutcome(proclamation.id),
      this.loadTribunalCasesForProclamation(proclamation.id),
      this.loadLinkedStories(proclamation.id),
      this.loadPeople(proclamation.id),
      this.loadRelatedCommission(proclamation.related_commission_id),
      this.loadRelatedAdhocCommittee(proclamation.related_adhoc_committee_id),
      this.loadProclamationLawSectionsGrouped(proclamation.id),
    ]);

    return {
      ...this.mapProclamationSummary(
        proclamation,
        stories.length,
        this.outcomeToAggregate(outcome),
      ),
      outcome: outcome ? this.mapOutcome(outcome) : null,
      tribunal_cases: tribunalCases.map((c) => this.mapTribunalCaseBrief(c)),
      stories,
      people,
      related_commission: relCommission,
      related_adhoc_committee: relAdhoc,
      law_sections_by_usage: lawSectionsByUsage,
    };
  }

  /* ========================================================== tribunal */

  async getTribunalOverview(
    query: TribunalCaseQueryDto,
  ): Promise<SpecialTribunalOverviewResponseDto> {
    const tribunal = await this.tribunalRepo
      .createQueryBuilder('t')
      .orderBy('t.created_at', 'ASC')
      .limit(1)
      .getOne();

    if (!tribunal) {
      throw new NotFoundException(
        'Special Tribunal has not been seeded. Run the SIU seed before querying /siu/tribunal.',
      );
    }

    const qb = this.tribunalCaseRepo.createQueryBuilder('c');
    if (query.status) {
      qb.where('c.status = :status', { status: query.status });
    }
    qb.orderBy('c.value_rands', 'DESC', 'NULLS LAST')
      .addOrderBy('c.filed_date', 'DESC', 'NULLS LAST')
      .addOrderBy('c.created_at', 'DESC');

    const cases = await qb.getMany();

    return {
      tribunal: this.mapTribunal(tribunal),
      cases: cases.map((c) => this.mapTribunalCaseBrief(c)),
      total: cases.length,
    };
  }

  /**
   * Tribunal case numbers contain a literal `/` (e.g. `GP01/2021`), which
   * makes them awkward path parameters. Accept either form:
   *   • the canonical form (URL-encoded `%2F`), which Express auto-decodes
   *   • a slug-style form (`gp01-2021`), which we normalise here by
   *     uppercasing and converting the LAST `-` to `/`
   * Whichever form arrives, we resolve to the canonical case number and
   * look it up exactly.
   */
  async findTribunalCaseByNumber(
    raw: string,
  ): Promise<SpecialTribunalCaseDetailResponseDto> {
    const candidates = this.expandCaseNumberCandidates(raw);

    const found = await this.tribunalCaseRepo
      .createQueryBuilder('c')
      .where('c.case_number IN (:...candidates)', { candidates })
      .getOne();

    if (!found) {
      throw new NotFoundException(
        `Special Tribunal case "${raw}" not found.`,
      );
    }

    const proclamation = await this.proclamationRepo.findOne({
      where: { id: found.proclamation_id },
    });
    if (!proclamation) {
      throw new NotFoundException(
        `Parent proclamation for case "${found.case_number}" not found.`,
      );
    }

    const [storyCount, outcome] = await Promise.all([
      this.loadStoryCounts([proclamation.id]),
      this.loadOutcome(proclamation.id),
    ]);

    return {
      ...this.mapTribunalCaseBrief(found),
      proclamation: this.mapProclamationSummary(
        proclamation,
        storyCount.get(proclamation.id) ?? 0,
        this.outcomeToAggregate(outcome),
      ),
    };
  }

  /* ============================================================ filters */

  private applyProclamationFilters(
    qb: SelectQueryBuilder<SiuProclamation>,
    f: ProclamationFilters,
  ): SelectQueryBuilder<SiuProclamation> {
    if (f.status) qb.andWhere('p.status = :status', { status: f.status });
    if (f.domain) qb.andWhere('p.domain = :domain', { domain: f.domain });
    if (f.president_who_signed)
      qb.andWhere('p.president_who_signed = :pres', {
        pres: f.president_who_signed,
      });
    return qb;
  }

  private countProclamations(f: ProclamationFilters): Promise<number> {
    return this.applyProclamationFilters(
      this.proclamationRepo.createQueryBuilder('p'),
      f,
    ).getCount();
  }

  /* ============================================================ loaders */

  private async loadStoryCounts(
    proclamationIds: string[],
  ): Promise<Map<string, number>> {
    if (proclamationIds.length === 0) return new Map();

    const rows = await this.proclamationStoryRepo
      .createQueryBuilder('ps')
      .select('ps.proclamation_id', 'proclamation_id')
      .addSelect('COUNT(ps.story_id)', 'story_count')
      .where('ps.proclamation_id IN (:...ids)', { ids: proclamationIds })
      .groupBy('ps.proclamation_id')
      .getRawMany<ProclamationStoryCountRow>();

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.proclamation_id, parseInt(row.story_count, 10));
    }
    return map;
  }

  /**
   * Pull the outcome aggregates needed by the list view in one batched
   * query — recovered + investigated Rand values plus the three referral
   * counts ({@link ProclamationOutcomeAggregate}). Avoids the N+1 fan-out
   * the editorial proclamation row would otherwise force.
   */
  private async loadOutcomeAggregates(
    proclamationIds: string[],
  ): Promise<Map<string, ProclamationOutcomeAggregate>> {
    if (proclamationIds.length === 0) return new Map();

    const rows = await this.outcomeRepo
      .createQueryBuilder('o')
      .select('o.proclamation_id', 'proclamation_id')
      .addSelect('o.actual_recovered_rands', 'recovered_rands')
      .addSelect('o.total_value_investigated', 'investigated_rands')
      .addSelect('o.referrals_to_npa', 'npa_referrals')
      .addSelect('o.referrals_to_departments', 'department_referrals')
      .addSelect('o.special_tribunal_cases_filed', 'tribunal_cases_filed')
      .where('o.proclamation_id IN (:...ids)', { ids: proclamationIds })
      .getRawMany<ProclamationOutcomeAggregateRow>();

    const map = new Map<string, ProclamationOutcomeAggregate>();
    for (const row of rows) {
      map.set(row.proclamation_id, {
        recovered_rands: row.recovered_rands,
        investigated_rands: row.investigated_rands,
        npa_referrals: parseInt(row.npa_referrals ?? '0', 10),
        department_referrals: parseInt(row.department_referrals ?? '0', 10),
        tribunal_cases_filed: parseInt(row.tribunal_cases_filed ?? '0', 10),
      });
    }
    return map;
  }

  /**
   * Single-row analogue used on the detail/lookup paths. Folds an entity
   * (or null) into the same shape {@link loadOutcomeAggregates} returns
   * so {@link mapProclamationSummary} has one input contract.
   */
  private outcomeToAggregate(
    outcome: SiuInvestigationOutcome | null,
  ): ProclamationOutcomeAggregate {
    if (!outcome) return ZERO_OUTCOME_AGGREGATE;
    return {
      recovered_rands: outcome.actual_recovered_rands,
      investigated_rands: outcome.total_value_investigated,
      npa_referrals: outcome.referrals_to_npa,
      department_referrals: outcome.referrals_to_departments,
      tribunal_cases_filed: outcome.special_tribunal_cases_filed,
    };
  }

  private async loadOutcome(
    proclamationId: string,
  ): Promise<SiuInvestigationOutcome | null> {
    return this.outcomeRepo.findOne({
      where: { proclamation_id: proclamationId },
    });
  }

  private async loadTribunalCasesForProclamation(
    proclamationId: string,
  ): Promise<SpecialTribunalCase[]> {
    return this.tribunalCaseRepo.find({
      where: { proclamation_id: proclamationId },
      order: { value_rands: 'DESC', filed_date: 'DESC' },
    });
  }

  /**
   * Linked stories pulled through the join table, with `latest_event_date`
   * computed via a left join onto `timeline_events` so the list can be
   * sorted chronologically without a second round-trip.
   */
  private async loadLinkedStories(
    proclamationId: string,
  ): Promise<SiuProclamationStoryBriefDto[]> {
    const rows = await this.storyRepo
      .createQueryBuilder('story')
      .innerJoin(
        'siu_proclamation_stories',
        'sps',
        'sps.story_id = story.id',
      )
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
      .where('sps.proclamation_id = :proclamationId', { proclamationId })
      .groupBy('story.id')
      .orderBy('MAX(te.event_date)', 'ASC', 'NULLS LAST')
      .addOrderBy('story.created_at', 'ASC')
      .getRawMany<ProclamationStoryRow>();

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
    proclamationId: string,
  ): Promise<SiuProclamationPersonBriefDto[]> {
    const rows = await this.proclamationPersonRepo.find({
      where: { proclamation_id: proclamationId },
      relations: ['person'],
    });

    return rows.map((row) => ({
      id: row.id,
      proclamation_id: row.proclamation_id,
      person_id: row.person_id,
      full_name: row.person.full_name,
      current_role: row.person.current_role,
      organisation: row.person.organisation,
      person_status: row.person.status,
      role: row.role,
      summary: row.summary,
    }));
  }

  private async loadRelatedCommission(
    commissionId: string | null,
  ): Promise<SiuRelatedCommissionDto | null> {
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

  private async loadRelatedAdhocCommittee(
    committeeId: string | null,
  ): Promise<SiuRelatedAdhocCommitteeDto | null> {
    if (!committeeId) return null;

    const committee = await this.adhocRepo.findOne({ where: { id: committeeId } });
    if (!committee) return null;

    return {
      id: committee.id,
      popular_name: committee.popular_name,
      slug: committee.slug,
      domain: committee.domain,
      status: committee.status,
      category: committee.category,
      chair_name: committee.chair_name,
      parliament_term: committee.parliament_term,
      announced_date: committee.announced_date,
    };
  }

  private async loadProclamationLawSectionsGrouped(
    proclamationId: string,
  ): Promise<SiuProclamationLawSectionsByUsageDto> {
    const links = await this.siuProclamationLawSectionRepo.find({
      where: { proclamation_id: proclamationId },
      relations: ['law_section', 'law_section.law', 'constitution_section'],
      order: { created_at: 'ASC' },
    });

    const grouped: SiuProclamationLawSectionsByUsageDto = {
      enabling: [],
      investigated: [],
      violated: [],
      recovered_under: [],
    };

    for (const link of links) {
      const item = this.mapProclamationLawSectionItem(link);
      switch (link.usage_type) {
        case SiuLawSectionUsage.ENABLING:
          grouped.enabling.push(item);
          break;
        case SiuLawSectionUsage.INVESTIGATED:
          grouped.investigated.push(item);
          break;
        case SiuLawSectionUsage.VIOLATED:
          grouped.violated.push(item);
          break;
        case SiuLawSectionUsage.RECOVERED_UNDER:
          grouped.recovered_under.push(item);
          break;
        default:
          break;
      }
    }

    return grouped;
  }

  private mapProclamationLawSectionItem(
    link: SiuProclamationLawSection,
  ): SiuProclamationLawSectionItemDto {
    const ls = link.law_section;
    const lawParent = ls?.law;
    const law_section =
      ls && lawParent
        ? {
            id: ls.id,
            law_id: ls.law_id,
            section_number: ls.section_number,
            section_title: ls.section_title,
            plain_english: ls.plain_english,
            full_text: ls.full_text,
            law: this.mapLawRow(lawParent),
          }
        : null;

    const c = link.constitution_section;
    const constitution_section = c
      ? {
          id: c.id,
          chapter_number: c.chapter_number,
          section_number: c.section_number,
          section_title: c.section_title,
          plain_english: c.plain_english,
          full_text: c.full_text,
        }
      : null;

    return {
      id: link.id,
      usage_type: link.usage_type,
      relevance: link.relevance,
      law_section,
      constitution_section,
    };
  }

  private mapLawRow(l: Law): LawResponseDto {
    return {
      id: l.id,
      name: l.name,
      short_name: l.short_name,
      act_number: l.act_number,
      category: l.category,
      plain_english: l.plain_english,
      full_text_url: l.full_text_url,
    };
  }

  /* ============================================================== stats */

  /**
   * Single round-trip aggregate query. We deliberately keep the bigint
   * sums as strings (Postgres returns them as `numeric` strings) — they
   * frequently exceed `Number.MAX_SAFE_INTEGER` (R64 billion = 6.4e10
   * is fine; cumulative figures across decades will not be).
   */
  private async computeStats(): Promise<SiuStatsDto> {
    const procRow = await this.proclamationRepo
      .createQueryBuilder('p')
      .select('COUNT(p.id)', 'total_proclamations')
      .addSelect(
        `COUNT(p.id) FILTER (WHERE p.status = 'active')`,
        'active_proclamations_count',
      )
      .addSelect(
        `COUNT(p.id) FILTER (WHERE p.status IN ('concluded', 'report_submitted', 'litigation_ongoing'))`,
        'concluded_proclamations_count',
      )
      .getRawOne<Pick<
        SiuStatsRow,
        | 'total_proclamations'
        | 'active_proclamations_count'
        | 'concluded_proclamations_count'
      >>();

    const outcomeRow = await this.outcomeRepo
      .createQueryBuilder('o')
      .select('SUM(o.total_value_investigated)', 'total_investigated_rands')
      .addSelect('SUM(o.actual_recovered_rands)', 'total_recovered_rands')
      .addSelect('SUM(o.losses_prevented_rands)', 'total_prevented_rands')
      .addSelect(
        'SUM(o.civil_litigation_value_rands)',
        'total_civil_litigation_rands',
      )
      .addSelect('SUM(o.referrals_to_npa)', 'total_npa_referrals')
      .addSelect('SUM(o.referrals_to_hawks)', 'total_hawks_referrals')
      .addSelect(
        'SUM(o.referrals_to_departments)',
        'total_department_referrals',
      )
      .addSelect('SUM(o.employees_dismissed)', 'total_employees_dismissed')
      .getRawOne<
        Pick<
          SiuStatsRow,
          | 'total_investigated_rands'
          | 'total_recovered_rands'
          | 'total_prevented_rands'
          | 'total_civil_litigation_rands'
          | 'total_npa_referrals'
          | 'total_hawks_referrals'
          | 'total_department_referrals'
          | 'total_employees_dismissed'
        >
      >();

    const caseRow = await this.tribunalCaseRepo
      .createQueryBuilder('c')
      .select('COUNT(c.id)', 'total_tribunal_cases')
      .getRawOne<Pick<SiuStatsRow, 'total_tribunal_cases'>>();

    return {
      total_proclamations: parseInt(procRow?.total_proclamations ?? '0', 10),
      active_proclamations_count: parseInt(
        procRow?.active_proclamations_count ?? '0',
        10,
      ),
      concluded_proclamations_count: parseInt(
        procRow?.concluded_proclamations_count ?? '0',
        10,
      ),
      total_investigated_rands: outcomeRow?.total_investigated_rands ?? '0',
      total_recovered_rands: outcomeRow?.total_recovered_rands ?? '0',
      total_prevented_rands: outcomeRow?.total_prevented_rands ?? '0',
      total_civil_litigation_rands:
        outcomeRow?.total_civil_litigation_rands ?? '0',
      total_npa_referrals: parseInt(outcomeRow?.total_npa_referrals ?? '0', 10),
      total_hawks_referrals: parseInt(
        outcomeRow?.total_hawks_referrals ?? '0',
        10,
      ),
      total_department_referrals: parseInt(
        outcomeRow?.total_department_referrals ?? '0',
        10,
      ),
      total_employees_dismissed: parseInt(
        outcomeRow?.total_employees_dismissed ?? '0',
        10,
      ),
      total_tribunal_cases: parseInt(caseRow?.total_tribunal_cases ?? '0', 10),
    };
  }

  /* ============================================================ helpers */

  /**
   * Generate the set of canonical case-number forms to look up for a
   * given path-parameter value. Always include the input verbatim;
   * additionally generate uppercase, last-`-`-to-`/`, and a combined
   * variant. Order is irrelevant — we use `IN (...)` so any match wins.
   */
  private expandCaseNumberCandidates(raw: string): string[] {
    const decoded = decodeURIComponent(raw).trim();
    const candidates = new Set<string>();
    candidates.add(decoded);
    candidates.add(decoded.toUpperCase());

    const lastDash = decoded.lastIndexOf('-');
    if (lastDash > 0) {
      const swapped =
        decoded.slice(0, lastDash) + '/' + decoded.slice(lastDash + 1);
      candidates.add(swapped);
      candidates.add(swapped.toUpperCase());
    }

    return Array.from(candidates);
  }

  /* ============================================================ mapping */

  private mapBody(body: SiuBody): SiuBodyDto {
    return {
      id: body.id,
      name: body.name,
      abbreviation: body.abbreviation,
      enabling_legislation: body.enabling_legislation,
      established_date: body.established_date,
      headquarters: body.headquarters,
      hotline: body.hotline,
      current_head: body.current_head,
      website_url: body.website_url,
      mandate_summary: body.mandate_summary,
      plain_english_summary: body.plain_english_summary,
      created_at: body.created_at.toISOString(),
    };
  }

  private mapTribunal(t: SpecialTribunal): SpecialTribunalDto {
    return {
      id: t.id,
      name: t.name,
      established_date: t.established_date,
      enabling_legislation: t.enabling_legislation,
      plain_english_summary: t.plain_english_summary,
      address: t.address,
      website_url: t.website_url,
      created_at: t.created_at.toISOString(),
    };
  }

  private mapProclamationSummary(
    p: SiuProclamation,
    storyCount: number,
    aggregate: ProclamationOutcomeAggregate,
  ): SiuProclamationSummaryDto {
    return {
      id: p.id,
      proclamation_number: p.proclamation_number,
      slug: p.slug,
      title: p.title,
      full_title: p.full_title,
      gazette_number: p.gazette_number,
      signed_date: p.signed_date,
      published_date: p.published_date,
      domain: p.domain,
      investigation_scope: p.investigation_scope,
      plain_english_summary: p.plain_english_summary,
      president_who_signed: p.president_who_signed,
      period_covered_start: p.period_covered_start,
      period_covered_end: p.period_covered_end,
      status: p.status,
      related_commission_id: p.related_commission_id,
      related_adhoc_committee_id: p.related_adhoc_committee_id,
      official_url: p.official_url,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
      story_count: storyCount,
      recovered_rands: aggregate.recovered_rands,
      investigated_rands: aggregate.investigated_rands,
      npa_referrals: aggregate.npa_referrals,
      department_referrals: aggregate.department_referrals,
      tribunal_cases_filed: aggregate.tribunal_cases_filed,
    };
  }

  private mapOutcome(o: SiuInvestigationOutcome): SiuInvestigationOutcomeDto {
    return {
      id: o.id,
      proclamation_id: o.proclamation_id,
      total_value_investigated: o.total_value_investigated,
      financial_losses_identified: o.financial_losses_identified,
      actual_recovered_rands: o.actual_recovered_rands,
      losses_prevented_rands: o.losses_prevented_rands,
      civil_litigation_value_rands: o.civil_litigation_value_rands,
      contracts_set_aside_value: o.contracts_set_aside_value,
      referrals_to_npa: o.referrals_to_npa,
      referrals_to_hawks: o.referrals_to_hawks,
      referrals_to_departments: o.referrals_to_departments,
      employees_referred_disciplinary: o.employees_referred_disciplinary,
      employees_dismissed: o.employees_dismissed,
      special_tribunal_cases_filed: o.special_tribunal_cases_filed,
      outcome_summary: o.outcome_summary,
      plain_english_outcome: o.plain_english_outcome,
      report_submitted_date: o.report_submitted_date,
      report_url: o.report_url,
      created_at: o.created_at.toISOString(),
      updated_at: o.updated_at.toISOString(),
    };
  }

  private mapTribunalCaseBrief(
    c: SpecialTribunalCase,
  ): SpecialTribunalCaseBriefDto {
    return {
      id: c.id,
      proclamation_id: c.proclamation_id,
      case_number: c.case_number,
      case_title: c.case_title,
      value_rands: c.value_rands,
      respondents: c.respondents ?? [],
      nature_of_claim: c.nature_of_claim,
      filed_date: c.filed_date,
      status: c.status,
      outcome_summary: c.outcome_summary,
      amount_recovered_rands: c.amount_recovered_rands,
      judgment_date: c.judgment_date,
      judgment_url: c.judgment_url,
      plain_english_outcome: c.plain_english_outcome,
    };
  }
}
