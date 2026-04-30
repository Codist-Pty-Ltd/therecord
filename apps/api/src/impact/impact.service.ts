import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { bigIntStringToNumber } from '../common/utils/money.util';
import { CommissionImpactSector } from '../entities/commission-impact-sector.entity';
import { ImpactSector } from '../entities/impact-sector.entity';
import { PublicExpenditureRecord } from '../entities/public-expenditure-record.entity';
import { Story } from '../entities/story.entity';
import { ImpactSeverity, StoryImpactSector } from '../entities/story-impact-sector.entity';
import {
  ImpactConnectionDto,
  ImpactLinkedCommissionDto,
  ImpactLinkedStoryBriefDto,
  ImpactSectorDetailDto,
  ImpactSectorListItemDto,
  ImpactSeverityDistributionDto,
  ImpactStoryExpenditureBriefDto,
  ImpactStorySectorImpactDto,
  ImpactStorySummaryResponseDto,
  ImpactWebResponseDto,
  ImpactWebSectorNodeDto,
  MoneyToRealityResponseDto,
  NationalStatsDto,
} from './dto/impact-response.dto';

const EXP_JOIN = `per.is_primary_record = true AND per.amount_rands IS NOT NULL AND per.amount_rands > 0`;

/** Per (impact sector, story): sum of counter-eligible expenditure on that story. */
const SECTOR_STORY_SPEND_SQL = `
  SELECT sis.sector_id,
         sis.story_id,
         COALESCE(SUM(per.amount_rands::numeric), 0) AS story_total
    FROM story_impact_sectors sis
    INNER JOIN public_expenditure_records per
      ON per.story_id = sis.story_id AND ${EXP_JOIN}
   GROUP BY sis.sector_id, sis.story_id`;

const IMPACT_SEVERITY_ORDER: Record<ImpactSeverity, number> = {
  [ImpactSeverity.CRITICAL]: 0,
  [ImpactSeverity.HIGH]: 1,
  [ImpactSeverity.MEDIUM]: 2,
  [ImpactSeverity.LOW]: 3,
};

/** Editorial bridge copy for sector pairs (sorted `a|b` slug keys). */
const CONNECTION_NOTES: Record<string, string> = {
  'education|food':
    'Hunger and grant instability make it harder for children to stay in school and learn.',
  'education|health':
    'Sick children miss class; under-resourced clinics cannot catch developmental harm early.',
  'education|jobs':
    'Weak Grade 10→matric throughput narrows who can access decent work later.',
  'education|safety':
    'Gang pressure and unsafe routes stop learners — especially girls — attending regularly.',
  'education|transport':
    'Broken rail and expensive taxis price poor learners out of reaching better schools.',
  'education|water':
    'No reliable water at schools means undignified sanitation and lost teaching time.',
  'food|health':
    'When grants are stolen or delayed, clinics see more malnutrition and stress-related illness.',
  'food|housing':
    'Overcrowded shacks make storing food and cooking safely much harder for poor households.',
  'food|jobs':
    'Without income security, grants are the last line — fraud hits nutrition directly.',
  'food|safety':
    'Extortion and violence at payout or shop-floor level can disrupt grant access.',
  'food|transport':
    'Long expensive commutes eat the same budget families use to buy food.',
  'food|water':
    'No clean water ruins cooking, hygiene and small food gardens for the poorest.',
  'health|housing':
    'Crowded informal homes accelerate TB and other communicable disease spread.',
  'health|jobs':
    'Ill health removes breadwinners from work; lost output feeds deeper poverty.',
  'health|safety':
    'Trauma care overload and fear of crime delay ordinary families seeking care.',
  'health|transport':
    'Patients miss appointments when trains fail and night taxi travel is unsafe.',
  'health|water':
    'Contaminated water drives cholera, typhoid and chronic clinic demand.',
  'housing|jobs':
    'Far-from-work informal housing raises transport costs and kills job options.',
  'housing|safety':
    'Housing corruption financed by violence — officials and residents are killed to control tenders.',
  'housing|transport':
    'Badly built or missing roads strand new housing on the urban edge from jobs.',
  'housing|water':
    'Informal settlements often wait longest for piped water and sanitation.',
  'jobs|safety':
    'Crime and extortion close firms and scare away infrastructure investment.',
  'jobs|transport':
    'Collapsing commuter rail pushed millions into unaffordable minibus taxis.',
  'jobs|water':
    'Farms and factories cannot run reliably without dependable bulk water.',
  'safety|transport':
    'Commuting through high-crime corridors raises risk; policing is uneven.',
  'safety|water':
    'Service-delivery protests and water shut-offs can spark conflict with police.',
  'transport|water':
    'Logistics depend on both — port and rail bottlenecks slow food and medicine.',
};

const NATIONAL_STATS: NationalStatsDto = {
  poverty_headcount: 23_200_000,
  unemployment_expanded: 42.4,
  housing_backlog: 2_400_000,
  without_water: 8_500_000,
  water_loss_rands_annual: 19_000_000_000,
};

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function connectionNoteFor(slugA: string, slugB: string): string {
  const k = pairKey(slugA, slugB);
  return (
    CONNECTION_NOTES[k] ??
    `Stories on The Record connect “${slugA}” and “${slugB}” — follow the threads for the full causal chain.`
  );
}

function emptySeverityDistribution(): ImpactSeverityDistributionDto {
  return {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
}

@Injectable()
export class ImpactService {
  constructor(
    @InjectRepository(ImpactSector) private readonly sectorRepo: Repository<ImpactSector>,
    @InjectRepository(StoryImpactSector)
    private readonly storyImpactRepo: Repository<StoryImpactSector>,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    @InjectRepository(PublicExpenditureRecord)
    private readonly expRepo: Repository<PublicExpenditureRecord>,
    @InjectRepository(CommissionImpactSector)
    private readonly commissionImpactRepo: Repository<CommissionImpactSector>,
  ) {}

  async listSectors(): Promise<ImpactSectorListItemDto[]> {
    const rows = await this.sectorRepo.manager.query<
      {
        id: string;
        slug: string;
        name: string;
        icon: string | null;
        constitutional_right: string | null;
        stat_headline: string | null;
        stat_value: string | null;
        stat_label: string | null;
        story_count: string;
        total_amount: string;
      }[]
    >(
      `WITH sector_story_spend AS (${SECTOR_STORY_SPEND_SQL})
       SELECT isc.id,
              isc.slug,
              isc.name,
              isc.icon,
              isc.constitutional_right,
              isc.stat_headline,
              isc.stat_value,
              isc.stat_label,
              COUNT(DISTINCT sis.story_id)::text AS story_count,
              COALESCE(SUM(css.story_total), 0)::text AS total_amount
         FROM impact_sectors isc
         LEFT JOIN story_impact_sectors sis ON sis.sector_id = isc.id
         LEFT JOIN sector_story_spend css
           ON css.sector_id = isc.id AND css.story_id = sis.story_id
        GROUP BY isc.id, isc.slug, isc.name, isc.icon, isc.constitutional_right,
                 isc.stat_headline, isc.stat_value, isc.stat_label
        ORDER BY isc.slug`,
    );

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      icon: r.icon,
      constitutional_right: r.constitutional_right,
      stat_headline: r.stat_headline,
      stat_value: r.stat_value,
      stat_label: r.stat_label,
      story_count: Number(r.story_count),
      total_amount_affected_rands: bigIntStringToNumber(r.total_amount),
    }));
  }

  async getSectorBySlug(slug: string): Promise<ImpactSectorDetailDto> {
    const sector = await this.sectorRepo.findOne({ where: { slug } });
    if (!sector) {
      throw new NotFoundException(`Impact sector "${slug}" not found.`);
    }

    const aggRows = await this.sectorRepo.manager.query<
      { story_count: string; total_amount: string }[]
    >(
      `WITH sector_story_spend AS (${SECTOR_STORY_SPEND_SQL})
       SELECT COUNT(DISTINCT sis.story_id)::text AS story_count,
              COALESCE(SUM(css.story_total), 0)::text AS total_amount
         FROM story_impact_sectors sis
         LEFT JOIN sector_story_spend css
           ON css.sector_id = sis.sector_id AND css.story_id = sis.story_id
        WHERE sis.sector_id = $1`,
      [sector.id],
    );
    const agg = aggRows[0];

    const links = await this.storyImpactRepo.find({
      where: { sector_id: sector.id },
      relations: ['story'],
    });

    links.sort(
      (a, b) =>
        IMPACT_SEVERITY_ORDER[a.impact_severity] - IMPACT_SEVERITY_ORDER[b.impact_severity],
    );

    const linked_stories: ImpactLinkedStoryBriefDto[] = links.map((l) => ({
      id: l.story.id,
      title: l.story.title,
      slug: l.story.slug,
      impact_chain: l.impact_chain,
      impact_severity: l.impact_severity,
      amount_diverted_rands: l.amount_diverted_rands,
      people_affected_estimate: l.people_affected_estimate,
      plain_english_impact: l.plain_english_impact,
    }));

    const commissionRows = await this.commissionImpactRepo.find({
      where: { sector_id: sector.id },
      relations: ['commission'],
    });

    const linked_commissions: ImpactLinkedCommissionDto[] = commissionRows.map((c) => ({
      id: c.commission.id,
      slug: c.commission.slug,
      popular_name: c.commission.popular_name,
      impact_summary: c.impact_summary,
    }));

    const storyIds = [...new Set(links.map((l) => l.story_id))];
    let whatLines: string[] = [];
    if (storyIds.length > 0) {
      const expRows = await this.expRepo
        .createQueryBuilder('per')
        .where('per.story_id IN (:...ids)', { ids: storyIds })
        .andWhere('per.what_it_should_have_funded IS NOT NULL')
        .andWhere("TRIM(per.what_it_should_have_funded) <> ''")
        .getMany();
      whatLines = [...new Set(expRows.map((e) => e.what_it_should_have_funded as string))];
    }

    const listBase = await this.listSectors();
    const listRow = listBase.find((s) => s.slug === slug)!;

    return {
      ...listRow,
      what_was_promised: sector.what_was_promised,
      ground_reality: sector.ground_reality,
      plain_english_child: sector.plain_english_child,
      stat_source: sector.stat_source,
      stat_year: sector.stat_year,
      linked_stories,
      linked_commissions,
      total_money_tracked_rands: bigIntStringToNumber(agg?.total_amount),
      what_it_should_have_funded_lines: whatLines,
      what_it_should_have_funded_combined: whatLines.join('\n\n'),
    };
  }

  async getWeb(): Promise<ImpactWebResponseDto> {
    const sectorsBase = await this.listSectors();
    const sectors: ImpactWebSectorNodeDto[] = [];

    const sevRows = await this.storyImpactRepo.manager.query<
      { slug: string; impact_severity: string; c: string }[]
    >(
      `SELECT isc.slug,
              sis.impact_severity::text AS impact_severity,
              COUNT(*)::text AS c
         FROM story_impact_sectors sis
         INNER JOIN impact_sectors isc ON isc.id = sis.sector_id
        GROUP BY isc.slug, sis.impact_severity`,
    );

    const sevBySlug = new Map<string, ImpactSeverityDistributionDto>();
    for (const s of sectorsBase) {
      sevBySlug.set(s.slug, emptySeverityDistribution());
    }
    for (const r of sevRows) {
      const slug = r.slug;
      const dist = sevBySlug.get(slug);
      if (!dist) continue;
      const k = r.impact_severity as keyof ImpactSeverityDistributionDto;
      if (k in dist) {
        dist[k] = Number(r.c);
      }
    }

    for (const s of sectorsBase) {
      sectors.push({
        slug: s.slug,
        name: s.name,
        icon: s.icon,
        stat_value: s.stat_value,
        stat_label: s.stat_label,
        story_count: s.story_count,
        total_rands_affected: s.total_amount_affected_rands,
        severity_distribution: sevBySlug.get(s.slug) ?? emptySeverityDistribution(),
      });
    }

    const peopleRows = await this.storyImpactRepo.manager.query<
      { sum: string }[]
    >(`SELECT COALESCE(SUM(people_affected_estimate), 0)::text AS sum FROM story_impact_sectors`);
    const peopleRow = peopleRows[0];

    const storySectors = await this.storyImpactRepo.manager.query<
      { story_id: string; slug: string }[]
    >(
      `SELECT sis.story_id, isc.slug
         FROM story_impact_sectors sis
         INNER JOIN impact_sectors isc ON isc.id = sis.sector_id`,
    );

    const byStory = new Map<string, string[]>();
    for (const row of storySectors) {
      const cur = byStory.get(row.story_id);
      if (cur) {
        cur.push(row.slug);
      } else {
        byStory.set(row.story_id, [row.slug]);
      }
    }

    const pairCounts = new Map<string, number>();
    for (const slugs of byStory.values()) {
      const unique = [...new Set(slugs)].sort();
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const pk = pairKey(unique[i], unique[j]);
          pairCounts.set(pk, (pairCounts.get(pk) ?? 0) + 1);
        }
      }
    }

    const connections: ImpactConnectionDto[] = [...pairCounts.entries()]
      .map(([pk, story_count]) => {
        const [from_sector, to_sector] = pk.split('|') as [string, string];
        return {
          from_sector,
          to_sector,
          story_count,
          connection_note: connectionNoteFor(from_sector, to_sector),
        };
      })
      .filter((c) => c.story_count > 0)
      .sort((a, b) => b.story_count - a.story_count);

    return {
      sectors,
      connections,
      total_people_affected_estimate: bigIntStringToNumber(peopleRow?.sum),
      national_stats: NATIONAL_STATS,
    };
  }

  async getStoryImpacts(storyId: string): Promise<ImpactStorySummaryResponseDto> {
    const story = await this.storyRepo.findOne({ where: { id: storyId } });
    if (!story) {
      throw new NotFoundException(`Story ${storyId} not found.`);
    }

    const links = await this.storyImpactRepo.find({
      where: { story_id: storyId },
      relations: ['sector'],
    });

    links.sort(
      (a, b) =>
        IMPACT_SEVERITY_ORDER[a.impact_severity] - IMPACT_SEVERITY_ORDER[b.impact_severity],
    );

    const impacts: ImpactStorySectorImpactDto[] = links.map((l) => ({
      slug: l.sector.slug,
      name: l.sector.name,
      icon: l.sector.icon,
      impact_chain: l.impact_chain,
      impact_severity: l.impact_severity,
      amount_diverted_rands: l.amount_diverted_rands,
      people_affected_estimate: l.people_affected_estimate,
      plain_english_impact: l.plain_english_impact,
    }));

    const expendituresRaw = await this.expRepo.find({
      where: { story_id: storyId },
      order: { amount_rands: 'DESC' },
      select: ['id', 'amount_rands', 'what_it_should_have_funded'],
    });

    const expenditures: ImpactStoryExpenditureBriefDto[] = expendituresRaw.map((e) => ({
      id: e.id,
      amount_rands: e.amount_rands,
      what_it_should_have_funded: e.what_it_should_have_funded,
    }));

    return { story_id: storyId, impacts, expenditures };
  }

  moneyToReality(randsInput: string): MoneyToRealityResponseDto {
    const trimmed = randsInput?.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      throw new BadRequestException('Query "rands" must be a positive integer string (whole rands).');
    }
    const n = bigIntStringToNumber(trimmed);
    if (!Number.isFinite(n) || n <= 0) {
      throw new BadRequestException('Amount must be a positive finite value.');
    }

    const floorDiv = (amount: number, unit: number): number =>
      unit <= 0 ? 0 : Math.floor(amount / unit);

    return {
      rdp_houses: floorDiv(n, 250_000),
      school_repairs: floorDiv(n, 5_000_000),
      water_connections: floorDiv(n, 50_000),
      child_support_grants: floorDiv(n, 6_360),
      old_age_grants: floorDiv(n, 26_400),
      hospital_beds: floorDiv(n, 1_000_000),
      teachers_per_year: floorDiv(n, 300_000),
    };
  }
}
