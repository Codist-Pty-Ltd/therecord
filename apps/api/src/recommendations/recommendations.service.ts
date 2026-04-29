import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission } from '../entities/commission.entity';
import {
  Recommendation,
  RecommendationCategory,
  RecommendationImplementationStatus,
} from '../entities/recommendation.entity';
import {
  CommissionRecommendationBundleDto,
  CommissionRecommendationsQueryDto,
  CommissionRecommendationsResponseDto,
  GlobalRecommendationStatsDto,
  RecommendationDto,
  RecommendationStatusCountsDto,
  RecommendationsByCategoryDto,
} from './dto/recommendation.dto';

const EMPTY_STATUS_COUNTS: RecommendationStatusCountsDto = {
  implemented: 0,
  partially_implemented: 0,
  not_implemented: 0,
  in_progress: 0,
  rejected: 0,
  unknown: 0,
};

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Recommendation)
    private readonly recommendationRepo: Repository<Recommendation>,
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
  ) {}

  mapToDto(r: Recommendation): RecommendationDto {
    return {
      id: r.id,
      commission_id: r.commission_id,
      adhoc_committee_id: r.adhoc_committee_id,
      reference_number: r.reference_number,
      title: r.title,
      full_text: r.full_text,
      plain_english: r.plain_english,
      plain_english_child: r.plain_english_child,
      category: r.category,
      directed_at: r.directed_at,
      persons_named: r.persons_named,
      implementation_status: r.implementation_status,
      implementation_notes: r.implementation_notes,
      implementation_date: r.implementation_date,
      implementation_source_url: r.implementation_source_url,
      volume_reference: r.volume_reference,
      is_verified: r.is_verified,
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
    };
  }

  countByStatus(rows: RecommendationDto[]): RecommendationStatusCountsDto {
    const c = { ...EMPTY_STATUS_COUNTS };
    for (const r of rows) {
      switch (r.implementation_status) {
        case RecommendationImplementationStatus.IMPLEMENTED:
          c.implemented++;
          break;
        case RecommendationImplementationStatus.PARTIALLY_IMPLEMENTED:
          c.partially_implemented++;
          break;
        case RecommendationImplementationStatus.NOT_IMPLEMENTED:
          c.not_implemented++;
          break;
        case RecommendationImplementationStatus.IN_PROGRESS:
          c.in_progress++;
          break;
        case RecommendationImplementationStatus.REJECTED:
          c.rejected++;
          break;
        case RecommendationImplementationStatus.UNKNOWN:
          c.unknown++;
          break;
      }
    }
    return c;
  }

  private sortRecommendations(a: RecommendationDto, b: RecommendationDto): number {
    const ra = a.reference_number ?? '';
    const rb = b.reference_number ?? '';
    if (ra !== rb) return ra.localeCompare(rb, undefined, { numeric: true });
    return a.title.localeCompare(b.title);
  }

  groupByCategory(rows: RecommendationDto[]): RecommendationsByCategoryDto {
    const empty: RecommendationsByCategoryDto = {
      prosecution: [],
      legislation: [],
      policy: [],
      institutional: [],
      disciplinary: [],
      further_investigation: [],
      compensation: [],
      appointment: [],
      other: [],
    };
    for (const r of rows) {
      switch (r.category) {
        case RecommendationCategory.PROSECUTION:
          empty.prosecution.push(r);
          break;
        case RecommendationCategory.LEGISLATION:
          empty.legislation.push(r);
          break;
        case RecommendationCategory.POLICY:
          empty.policy.push(r);
          break;
        case RecommendationCategory.INSTITUTIONAL:
          empty.institutional.push(r);
          break;
        case RecommendationCategory.DISCIPLINARY:
          empty.disciplinary.push(r);
          break;
        case RecommendationCategory.FURTHER_INVESTIGATION:
          empty.further_investigation.push(r);
          break;
        case RecommendationCategory.COMPENSATION:
          empty.compensation.push(r);
          break;
        case RecommendationCategory.APPOINTMENT:
          empty.appointment.push(r);
          break;
        case RecommendationCategory.OTHER:
          empty.other.push(r);
          break;
      }
    }
    for (const k of Object.keys(empty) as (keyof RecommendationsByCategoryDto)[]) {
      empty[k].sort((a, b) => this.sortRecommendations(a, b));
    }
    return empty;
  }

  async loadForCommission(commissionId: string): Promise<Recommendation[]> {
    return this.recommendationRepo
      .createQueryBuilder('r')
      .where('r.commission_id = :id', { id: commissionId })
      .orderBy('r.reference_number', 'ASC', 'NULLS LAST')
      .addOrderBy('r.title', 'ASC')
      .getMany();
  }

  /**
   * Bundle for embedding in commission detail: grouped + status histogram.
   */
  async getBundleForCommission(commissionId: string): Promise<CommissionRecommendationBundleDto> {
    const rows = await this.loadForCommission(commissionId);
    const dtos = rows.map((r) => this.mapToDto(r));
    return {
      by_category: this.groupByCategory(dtos),
      status_counts: this.countByStatus(dtos),
    };
  }

  async findForCommissionBySlug(
    slug: string,
    query: CommissionRecommendationsQueryDto,
  ): Promise<CommissionRecommendationsResponseDto> {
    const commission = await this.commissionRepo.findOne({ where: { slug } });
    if (!commission) {
      throw new NotFoundException(`Commission with slug "${slug}" not found.`);
    }

    const all = await this.loadForCommission(commission.id);
    const allDtos = all.map((r) => this.mapToDto(r));
    const status_counts = this.countByStatus(allDtos);

    let filtered = allDtos;
    if (query.category) {
      filtered = filtered.filter((r) => r.category === query.category);
    }
    if (query.status) {
      filtered = filtered.filter((r) => r.implementation_status === query.status);
    }
    if (query.directed_at?.trim()) {
      const q = query.directed_at.trim().toLowerCase();
      filtered = filtered.filter(
        (r) => r.directed_at != null && r.directed_at.toLowerCase().includes(q),
      );
    }

    filtered.sort((a, b) => this.sortRecommendations(a, b));

    return {
      slug: commission.slug,
      recommendations: filtered,
      status_counts,
    };
  }

  async getGlobalStats(): Promise<GlobalRecommendationStatsDto> {
    const rows = await this.recommendationRepo.find();
    const dtos = rows.map((r) => this.mapToDto(r));
    const by_status = this.countByStatus(dtos);

    const by_category: Record<string, number> = {};
    for (const cat of Object.values(RecommendationCategory)) {
      by_category[cat] = 0;
    }
    for (const r of dtos) {
      by_category[r.category] = (by_category[r.category] ?? 0) + 1;
    }

    const total = dtos.length;
    const implementation_rate =
      total === 0
        ? 0
        : Math.round((by_status.implemented / total) * 1000) / 10;

    return {
      total,
      by_status,
      by_category,
      implementation_rate,
    };
  }
}
