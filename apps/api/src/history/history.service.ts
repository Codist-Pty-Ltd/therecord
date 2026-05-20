import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoricalEra } from '../entities/historical-era.entity';
import {
  HistoricalEvent,
  HistoricalEventType,
} from '../entities/historical-event.entity';
import { HistoricalLaw } from '../entities/historical-law.entity';
import { HistoricalStatistic } from '../entities/historical-statistic.entity';
import { Law } from '../entities/law.entity';

export interface HistoricalEventDto {
  id: string;
  era_id: string;
  year: number;
  year_display: string | null;
  event_type: HistoricalEventType;
  title: string;
  description: string;
  plain_english_child: string;
  significance: string;
  is_verified: boolean;
  source_attribution: string | null;
  related_law_id: string | null;
  related_historical_law_id: string | null;
  related_commission_id: string | null;
  related_commission_slug: string | null;
  related_person_id: string | null;
  related_story_id: string | null;
  created_at: string;
}

export interface HistoricalLawDto {
  id: string;
  era_id: string;
  year_enacted: number;
  year_repealed: number | null;
  name: string;
  full_name: string | null;
  act_number: string | null;
  slug: string;
  category: string;
  status: string;
  replaced_by: string | null;
  what_it_did: string;
  plain_english_child: string;
  plain_english_layperson: string;
  impact_summary: string;
  constitutional_violation: string | null;
  is_foundational: boolean;
  created_at: string;
}

export interface HistoricalStatisticDto {
  id: string;
  era_id: string;
  stat_type: string;
  label: string;
  value: string;
  value_context: string;
  year_or_period: string | null;
  source: string;
  plain_english_child: string;
  created_at: string;
}

export interface HistoricalEraDetailDto {
  id: string;
  slug: string;
  name: string;
  period: string;
  order_index: number;
  summary: string;
  plain_english_child: string;
  plain_english_layperson: string;
  plain_english_legal: string;
  key_theme: string | null;
  icon: string | null;
  created_at: string;
  events: HistoricalEventDto[];
  laws: HistoricalLawDto[];
  statistics: HistoricalStatisticDto[];
  event_counts_by_type: Record<string, number>;
}

export interface HistoryCompareResponse {
  income_gap_apartheid: string;
  income_gap_post: string;
  land_black_apartheid: string;
  land_redistributed_post: string;
  unemployment_post: string;
  poverty_post: string;
  sources: Record<string, string>;
}

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoricalEra)
    private readonly eraRepo: Repository<HistoricalEra>,
    @InjectRepository(HistoricalEvent)
    private readonly eventRepo: Repository<HistoricalEvent>,
    @InjectRepository(HistoricalLaw)
    private readonly historicalLawRepo: Repository<HistoricalLaw>,
    @InjectRepository(HistoricalStatistic)
    private readonly statisticRepo: Repository<HistoricalStatistic>,
    @InjectRepository(Law)
    private readonly lawRepo: Repository<Law>,
  ) {}

  async listEras(): Promise<HistoricalEraDetailDto[]> {
    const eras = await this.eraRepo.find({ order: { order_index: 'ASC' } });
    return Promise.all(eras.map((e) => this.buildEraDetail(e)));
  }

  async getEraBySlug(slug: string): Promise<HistoricalEraDetailDto> {
    const era = await this.eraRepo.findOne({ where: { slug } });
    if (!era) {
      throw new NotFoundException(`Historical era not found: ${slug}`);
    }
    return this.buildEraDetail(era);
  }

  async listLaws(filters: {
    category?: string;
    status?: string;
    era_slug?: string;
    is_foundational?: boolean;
  }): Promise<HistoricalLawDto[]> {
    const qb = this.historicalLawRepo
      .createQueryBuilder('l')
      .leftJoin('l.era', 'era')
      .orderBy('l.year_enacted', 'ASC')
      .addOrderBy('l.name', 'ASC');

    if (filters.category) {
      qb.andWhere('l.category = :category', { category: filters.category });
    }
    if (filters.status) {
      qb.andWhere('l.status = :status', { status: filters.status });
    }
    if (filters.era_slug) {
      qb.andWhere('era.slug = :eraSlug', { eraSlug: filters.era_slug });
    }
    if (filters.is_foundational === true || filters.is_foundational === false) {
      qb.andWhere('l.is_foundational = :isF', { isF: filters.is_foundational });
    }

    const rows = await qb.getMany();
    return rows.map((l) => this.toLawDto(l));
  }

  async getLawBySlug(slug: string): Promise<{
    law: HistoricalLawDto;
    era: Pick<
      HistoricalEraDetailDto,
      'id' | 'slug' | 'name' | 'period' | 'icon' | 'key_theme'
    >;
    related_current_law: {
      id: string;
      name: string;
      short_name: string;
      act_number: string;
    } | null;
    constitutional_violation: string | null;
  }> {
    const law = await this.historicalLawRepo.findOne({
      where: { slug },
      relations: ['era'],
    });
    if (!law) {
      throw new NotFoundException(`Historical law not found: ${slug}`);
    }

    let relatedCurrent: {
      id: string;
      name: string;
      short_name: string;
      act_number: string;
    } | null = null;

    if (law.replaced_by) {
      const needle = law.replaced_by.trim();
      const match = await this.lawRepo.findOne({
        where: [{ name: needle }, { short_name: needle }],
      });
      if (match) {
        relatedCurrent = {
          id: match.id,
          name: match.name,
          short_name: match.short_name,
          act_number: match.act_number,
        };
      }
    }

    const era = law.era;
    return {
      law: this.toLawDto(law),
      era: {
        id: era.id,
        slug: era.slug,
        name: era.name,
        period: era.period,
        icon: era.icon,
        key_theme: era.key_theme,
      },
      related_current_law: relatedCurrent,
      constitutional_violation: law.constitutional_violation,
    };
  }

  async getTimeline(filters: {
    era?: string;
    type?: string;
  }): Promise<HistoricalEventDto[]> {
    const qb = this.eventRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.related_commission', 'c')
      .orderBy('e.year', 'ASC')
      .addOrderBy('e.title', 'ASC');

    if (filters.era) {
      qb.leftJoin('e.era', 'era').andWhere('era.slug = :eraSlug', {
        eraSlug: filters.era,
      });
    }
    if (filters.type) {
      qb.andWhere('e.event_type = :etype', { etype: filters.type });
    }

    const events = await qb.getMany();
    return events.map((ev) => this.toEventDto(ev));
  }

  getCompare(): HistoryCompareResponse {
    return {
      income_gap_apartheid: '15:1',
      income_gap_post: '9.3:1',
      land_black_apartheid: '13%',
      land_redistributed_post: '~10%',
      unemployment_post: '42.4%',
      poverty_post: '23.2 million (37.9%)',
      sources: {
        income_gap_apartheid:
          'World Inequality Database / Czajka and Gethin (2024) — early 1970s white-to-black per capita income ratio',
        income_gap_post:
          'World Inequality Database / Czajka and Gethin — 2019 ratio',
        land_black_apartheid:
          'Native Trust and Land Act 1936 reserve expansion; general references (e.g. Britannica) — contextual band 70–80% population',
        land_redistributed_post: 'BBC (2018); PLAAS research — ~10% by 2018',
        unemployment_post: 'Stats SA QLFS — expanded unemployment Q3 2025 (editorial figure; verify latest release)',
        poverty_post:
          'Stats SA — population below lower-bound poverty line 2025 (editorial figure; verify latest release)',
      },
    };
  }

  private async buildEraDetail(era: HistoricalEra): Promise<HistoricalEraDetailDto> {
    const [events, laws, statistics] = await Promise.all([
      this.eventRepo.find({
        where: { era_id: era.id },
        order: { year: 'ASC', title: 'ASC' },
        relations: ['related_commission'],
      }),
      this.historicalLawRepo.find({
        where: { era_id: era.id },
        order: { year_enacted: 'ASC', name: 'ASC' },
      }),
      this.statisticRepo.find({
        where: { era_id: era.id },
        order: { label: 'ASC' },
      }),
    ]);

    const eventCounts: Record<string, number> = {};
    for (const ev of events) {
      const k = ev.event_type;
      eventCounts[k] = (eventCounts[k] ?? 0) + 1;
    }

    return {
      id: era.id,
      slug: era.slug,
      name: era.name,
      period: era.period,
      order_index: era.order_index,
      summary: era.summary,
      plain_english_child: era.plain_english_child,
      plain_english_layperson: era.plain_english_layperson,
      plain_english_legal: era.plain_english_legal,
      key_theme: era.key_theme,
      icon: era.icon,
      created_at: era.created_at.toISOString(),
      events: events.map((e) => this.toEventDto(e)),
      laws: laws.map((l) => this.toLawDto(l)),
      statistics: statistics.map((s) => this.toStatisticDto(s)),
      event_counts_by_type: eventCounts,
    };
  }

  private toEventDto(ev: HistoricalEvent): HistoricalEventDto {
    return {
      id: ev.id,
      era_id: ev.era_id,
      year: ev.year,
      year_display: ev.year_display,
      event_type: ev.event_type,
      title: ev.title,
      description: ev.description,
      plain_english_child: ev.plain_english_child,
      significance: ev.significance,
      is_verified: ev.is_verified,
      source_attribution: ev.source_attribution,
      related_law_id: ev.related_law_id,
      related_historical_law_id: ev.related_historical_law_id,
      related_commission_id: ev.related_commission_id,
      related_commission_slug: ev.related_commission?.slug ?? null,
      related_person_id: ev.related_person_id,
      related_story_id: ev.related_story_id,
      created_at: ev.created_at.toISOString(),
    };
  }

  private toLawDto(l: HistoricalLaw): HistoricalLawDto {
    return {
      id: l.id,
      era_id: l.era_id,
      year_enacted: l.year_enacted,
      year_repealed: l.year_repealed,
      name: l.name,
      full_name: l.full_name,
      act_number: l.act_number,
      slug: l.slug,
      category: l.category,
      status: l.status,
      replaced_by: l.replaced_by,
      what_it_did: l.what_it_did,
      plain_english_child: l.plain_english_child,
      plain_english_layperson: l.plain_english_layperson,
      impact_summary: l.impact_summary,
      constitutional_violation: l.constitutional_violation,
      is_foundational: l.is_foundational,
      created_at: l.created_at.toISOString(),
    };
  }

  private toStatisticDto(s: HistoricalStatistic): HistoricalStatisticDto {
    return {
      id: s.id,
      era_id: s.era_id,
      stat_type: s.stat_type,
      label: s.label,
      value: s.value,
      value_context: s.value_context,
      year_or_period: s.year_or_period,
      source: s.source,
      plain_english_child: s.plain_english_child,
      created_at: s.created_at.toISOString(),
    };
  }
}
