import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { buildPaginationMeta } from '../common/dto/pagination-meta.dto';
import { ImpactSector } from '../entities/impact-sector.entity';
import { Story } from '../entities/story.entity';
import { StoryImpactSector } from '../entities/story-impact-sector.entity';
import {
  StateEntity,
} from '../entities/state-entity.entity';
import { StateEntityCommissionLink } from '../entities/state-entity-commission-link.entity';
import { StateEntityTimeline } from '../entities/state-entity-timeline.entity';
import { StateEntityListQueryDto } from './dto/state-entity-query.dto';

/** Editorial companion figure: AG / oversight scale (Eskom + Transnet-class irregulars headline). */
const IRREGULAR_EXPENDITURE_HIGHLIGHT_RANDS = 57_000_000_000;

@Injectable()
export class StateEntitiesService {
  constructor(
    @InjectRepository(StateEntity)
    private readonly entityRepo: Repository<StateEntity>,
    @InjectRepository(StateEntityTimeline)
    private readonly timelineRepo: Repository<StateEntityTimeline>,
    @InjectRepository(StateEntityCommissionLink)
    private readonly linkRepo: Repository<StateEntityCommissionLink>,
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    @InjectRepository(ImpactSector)
    private readonly sectorRepo: Repository<ImpactSector>,
    @InjectRepository(StoryImpactSector)
    private readonly storyImpactRepo: Repository<StoryImpactSector>,
  ) {}

  /* -------------------------------------------------------------- helpers */

  private mapToStateEntity(e: StateEntity) {
    return {
      id: e.id,
      name: e.name,
      popular_name: e.popular_name,
      abbreviation: e.abbreviation,
      slug: e.slug,
      sector: e.sector,
      pfma_schedule: e.pfma_schedule,
      status: e.status,
      established_year: e.established_year,
      established_by: e.established_by,
      purpose_original: e.purpose_original,
      purpose_plain_english: e.purpose_plain_english,
      why_it_matters_to_ordinary_people: e.why_it_matters_to_ordinary_people,
      current_mandate_summary: e.current_mandate_summary,
      current_ceo: e.current_ceo,
      supervising_ministry: e.supervising_ministry,
      government_ownership_percentage: e.government_ownership_percentage,
      latest_annual_loss_rands: e.latest_annual_loss_rands,
      total_debt_rands: e.total_debt_rands,
      total_bailouts_received_rands: e.total_bailouts_received_rands,
      annual_budget_rands: e.annual_budget_rands,
      financial_health: e.financial_health,
      financial_health_year: e.financial_health_year,
      health_score: e.health_score,
      health_score_rationale: e.health_score_rationale,
      is_in_crisis: e.is_in_crisis,
      crisis_summary: e.crisis_summary,
      privatisation_debate: e.privatisation_debate,
      privatisation_status: e.privatisation_status,
      primary_impact_sector_slug: e.primary_impact_sector_slug,
      created_at: e.created_at.toISOString(),
      updated_at: e.updated_at.toISOString(),
    };
  }

  private async loadStoryCounts(entityIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (entityIds.length === 0) return map;
    const rows = await this.storyRepo
      .createQueryBuilder('s')
      .select('s.state_entity_id', 'eid')
      .addSelect('COUNT(*)', 'cnt')
      .where('s.state_entity_id IN (:...ids)', { ids: entityIds })
      .groupBy('s.state_entity_id')
      .getRawMany<{ eid: string; cnt: string }>();
    for (const r of rows) {
      map.set(r.eid, Number(r.cnt));
    }
    return map;
  }

  private assignEventDates(rows: StateEntityTimeline[]): Array<
    StateEntityTimeline & { event_date: string }
  > {
    const sorted = [...rows].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.created_at.getTime() - b.created_at.getTime();
    });
    let lastYear = -1;
    let seq = 0;
    return sorted.map((t) => {
      if (t.year !== lastYear) {
        lastYear = t.year;
        seq = 0;
      }
      seq += 1;
      const month = Math.min(12, seq);
      const event_date = `${t.year}-${String(month).padStart(2, '0')}-15`;
      return { ...t, event_date };
    });
  }

  private serializeTimelineRows(rows: StateEntityTimeline[]) {
    const dated = this.assignEventDates(rows);
    return dated.map((t) => ({
      id: t.id,
      state_entity_id: t.state_entity_id,
      year: t.year,
      event_type: t.event_type,
      title: t.title,
      description: t.description,
      plain_english: t.plain_english,
      amount_rands: t.amount_rands,
      source_url: t.source_url,
      significance: t.significance,
      related_commission_slug: t.related_commission_slug,
      related_siu_proclamation_slug: t.related_siu_proclamation_slug,
      related_story_slug: t.related_story_slug,
      created_at: t.created_at.toISOString(),
      event_date: t.event_date,
    }));
  }

  /* ---------------------------------------------------------------- list */

  async findAll(query: StateEntityListQueryDto) {
    const { page, limit, sector, status, financial_health, is_in_crisis } = query;
    const offset = (page - 1) * limit;

    const qb = this.entityRepo.createQueryBuilder('e');
    if (sector) qb.andWhere('e.sector = :sector', { sector });
    if (status) qb.andWhere('e.status = :status', { status });
    if (financial_health)
      qb.andWhere('e.financial_health = :financial_health', { financial_health });
    if (is_in_crisis === true) qb.andWhere('e.is_in_crisis = true');
    if (is_in_crisis === false) qb.andWhere('e.is_in_crisis = false');

    qb.orderBy('e.health_score', 'ASC', 'NULLS LAST').addOrderBy('e.name', 'ASC');

    const total = await qb.getCount();

    const rows = await qb.offset(offset).limit(limit).getMany();
    const counts = await this.loadStoryCounts(rows.map((r) => r.id));

    return {
      data: rows.map((e) => ({
        name: e.name,
        popular_name: e.popular_name,
        slug: e.slug,
        sector: e.sector,
        status: e.status,
        health_score: e.health_score,
        is_in_crisis: e.is_in_crisis,
        latest_annual_loss_rands: e.latest_annual_loss_rands,
        total_bailouts_received_rands: e.total_bailouts_received_rands,
        primary_impact_sector_slug: e.primary_impact_sector_slug,
        related_story_count: counts.get(e.id) ?? 0,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  /* --------------------------------------------------------------- stats */

  async getStats() {
    const all = await this.entityRepo.find();
    const total_entities = all.length;
    const in_crisis = all.filter((e) => e.is_in_crisis).length;

    let total_bailouts = 0n;
    let total_debt = 0n;
    let healthSum = 0;
    let healthN = 0;
    for (const e of all) {
      if (e.total_bailouts_received_rands) {
        total_bailouts += BigInt(e.total_bailouts_received_rands);
      }
      if (e.total_debt_rands) {
        total_debt += BigInt(e.total_debt_rands);
      }
      if (e.health_score != null) {
        healthSum += e.health_score;
        healthN += 1;
      }
    }

    const bySectorRaw = await this.entityRepo
      .createQueryBuilder('e')
      .select('e.sector', 'sector')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(e.health_score)', 'avg_health')
      .groupBy('e.sector')
      .getRawMany<{ sector: StateEntity['sector']; count: string; avg_health: string | null }>();

    const by_sector = bySectorRaw.map((r) => ({
      sector: r.sector,
      count: Number(r.count),
      avg_health:
        r.avg_health != null && r.avg_health !== ''
          ? Math.round(Number(r.avg_health) * 10) / 10
          : null,
    }));

    const worstRows = await this.entityRepo
      .createQueryBuilder('e')
      .where('e.health_score IS NOT NULL')
      .orderBy('e.health_score', 'ASC')
      .addOrderBy('e.name', 'ASC')
      .take(3)
      .getMany();

    return {
      total_entities,
      in_crisis,
      total_bailouts_rands: Number(total_bailouts),
      total_debt_rands: Number(total_debt),
      average_health_score: healthN > 0 ? Math.round((healthSum / healthN) * 10) / 10 : null,
      irregular_expenditure_highlight_rands: IRREGULAR_EXPENDITURE_HIGHLIGHT_RANDS,
      by_sector,
      worst_performers: worstRows.map((e) => this.mapToStateEntity(e)),
    };
  }

  /* ------------------------------------------------------------- detail */

  async findBySlug(slug: string) {
    const entity = await this.entityRepo.findOne({ where: { slug } });
    if (!entity) throw new NotFoundException(`State entity not found: ${slug}`);

    const timelineRows = await this.timelineRepo.find({
      where: { state_entity_id: entity.id },
      order: { year: 'ASC', created_at: 'ASC' },
    });
    const withDates = this.serializeTimelineRows(timelineRows);

    const linksRaw = await this.linkRepo.find({
      where: { state_entity_id: entity.id },
      relations: ['commission', 'adhoc_committee', 'siu_proclamation', 'accountability_body'],
      order: { created_at: 'ASC' },
    });

    const accountability_links = linksRaw.map((l) => ({
      id: l.id,
      relationship_type: l.relationship_type,
      summary: l.summary,
      commission: l.commission
        ? {
            id: l.commission.id,
            slug: l.commission.slug,
            popular_name: l.commission.popular_name,
          }
        : null,
      adhoc_committee: l.adhoc_committee
        ? {
            id: l.adhoc_committee.id,
            slug: l.adhoc_committee.slug,
            popular_name: l.adhoc_committee.popular_name,
          }
        : null,
      siu_proclamation: l.siu_proclamation
        ? {
            id: l.siu_proclamation.id,
            slug: l.siu_proclamation.slug,
            title: l.siu_proclamation.title,
            proclamation_number: l.siu_proclamation.proclamation_number,
          }
        : null,
      accountability_body: l.accountability_body
        ? {
            id: l.accountability_body.id,
            slug: l.accountability_body.slug,
            name: l.accountability_body.name,
          }
        : null,
    }));

    const stories = await this.storyRepo.find({
      where: { state_entity_id: entity.id },
      order: { updated_at: 'DESC' },
      take: 100,
    });

    const linked_stories = stories.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      domain: s.domain,
      status: s.status,
      summary: s.summary,
      total_amount_rands: s.total_amount_rands,
      updated_at: s.updated_at.toISOString(),
    }));

    const storyIds = stories.map((s) => s.id);
    const sectorIds = new Set<string>();
    const primary = await this.sectorRepo.findOne({
      where: { slug: entity.primary_impact_sector_slug },
    });
    if (primary) sectorIds.add(primary.id);

    if (storyIds.length > 0) {
      const sis = await this.storyImpactRepo.find({
        where: { story_id: In(storyIds) },
        select: ['sector_id'],
      });
      for (const r of sis) sectorIds.add(r.sector_id);
    }

    const sectors =
      sectorIds.size > 0
        ? await this.sectorRepo.find({ where: { id: In([...sectorIds]) } })
        : [];

    const linked_impact_sectors = sectors
      .map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        icon: s.icon,
        constitutional_right: s.constitutional_right,
        what_was_promised: s.what_was_promised,
        ground_reality: s.ground_reality,
        plain_english_child: s.plain_english_child,
        stat_headline: s.stat_headline,
        stat_value: s.stat_value,
        stat_label: s.stat_label,
        stat_source: s.stat_source,
        stat_year: s.stat_year,
        created_at: s.created_at.toISOString(),
        updated_at: s.updated_at.toISOString(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      ...this.mapToStateEntity(entity),
      timeline: withDates,
      accountability_links,
      linked_stories,
      linked_impact_sectors,
    };
  }

  async findTimelineBySlug(slug: string) {
    const entity = await this.entityRepo.findOne({ where: { slug } });
    if (!entity) throw new NotFoundException(`State entity not found: ${slug}`);

    const timelineRows = await this.timelineRepo.find({
      where: { state_entity_id: entity.id },
      order: { year: 'ASC', created_at: 'ASC' },
    });
    const withDates = this.serializeTimelineRows(timelineRows);

    return { slug: entity.slug, popular_name: entity.popular_name, timeline: withDates };
  }
}
