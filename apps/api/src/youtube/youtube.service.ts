import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdhocCommittee, AdhocCommitteeStatus } from '../entities/adhoc_committee.entity';
import { Commission, CommissionStatus } from '../entities/commission.entity';
import { SiuProclamation } from '../entities/siu_proclamation.entity';
import { Story } from '../entities/story.entity';
import {
  YoutubeVideo,
  YoutubeVideoReviewStatus,
  YoutubeVideoType,
} from '../entities/youtube-video.entity';
import { IntelligenceClient } from '../intelligence/intelligence.client';
import type { YoutubeApproveDto } from './dto/youtube.dto';

const MADLANGA_SLUG = 'madlanga-commission';

export interface DiscoverResultDto {
  discovered: number;
  queued_for_review: number;
  already_known: number;
}

export interface YoutubeReviewQueueItemDto {
  id: string;
  youtube_id: string;
  title: string;
  channel_name: string | null;
  thumbnail_url: string | null;
  relevance_score: number;
  relevance_reason: string | null;
  published_at: string | null;
  duration_seconds: number | null;
  view_count: string | null;
  entity_context: string | null;
  commission_id: string | null;
  adhoc_committee_id: string | null;
  story_id: string | null;
  siu_proclamation_id: string | null;
}

export interface YoutubeStatsDto {
  pending: number;
  approved: number;
  rejected: number;
  total_discovered: number;
}

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);

  constructor(
    private readonly intelligence: IntelligenceClient,
    @InjectRepository(YoutubeVideo)
    private readonly ytRepo: Repository<YoutubeVideo>,
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
    @InjectRepository(AdhocCommittee)
    private readonly adhocRepo: Repository<AdhocCommittee>,
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    @InjectRepository(SiuProclamation)
    private readonly siuRepo: Repository<SiuProclamation>,
  ) {}

  private domainToken(domain: string): string {
    return domain.replace(/_/g, ' ');
  }

  private commissionSearchQueries(c: Commission): string[] {
    const year =
      c.announced_date && c.announced_date.length >= 4
        ? c.announced_date.slice(0, 4)
        : '';
    const q: string[] = [
      `"${c.popular_name}" South Africa`,
      `"${c.chair_name}" commission testimony`,
      `${this.domainToken(c.domain)} commission South Africa${year ? ` ${year}` : ''}`,
    ];
    if (c.slug === MADLANGA_SLUG || /madlanga/i.test(c.popular_name)) {
      q.push(
        'Madlanga Commission hearing testimony',
        'Mkhwanazi commission evidence',
        'SAPS corruption commission South Africa 2025',
      );
    }
    return q;
  }

  private adhocSearchQueries(a: AdhocCommittee): string[] {
    const chair = a.chair_name ?? '';
    const year =
      a.announced_date && a.announced_date.length >= 4
        ? a.announced_date.slice(0, 4)
        : '';
    return [
      `"${a.popular_name}" South Africa`,
      ...(chair ? [`"${chair}" committee testimony`] : []),
      `${this.domainToken(a.domain)} parliamentary committee South Africa${year ? ` ${year}` : ''}`,
    ];
  }

  private storySearchQueries(s: Story): string[] {
    return [
      `"${s.title}" South Africa`,
      `${s.slug.replace(/-/g, ' ')} news`,
      `South Africa ${this.domainToken(s.domain)} ${s.title.split(' ').slice(0, 4).join(' ')}`,
    ];
  }

  private siuSearchQueries(p: SiuProclamation): string[] {
    const y =
      p.signed_date && p.signed_date.length >= 4
        ? p.signed_date.slice(0, 4)
        : '';
    return [
      `"${p.title}" SIU`,
      `${p.proclamation_number} South Africa investigation`,
      `SIU ${this.domainToken(p.domain)}${y ? ` ${y}` : ''}`,
    ];
  }

  async discoverEntity(
    entityType: string,
    entityId: string,
    maxResultsPerQuery = 10,
  ): Promise<DiscoverResultDto> {
    let search_queries: string[] = [];
    let entity_name = '';
    let chair_name: string | undefined;
    let domain_keyword: string | undefined;
    let announced_year: string | undefined;
    let commission_key: string | undefined;

    if (entityType === 'commission') {
      const c = await this.commissionRepo.findOne({ where: { id: entityId } });
      if (!c) throw new NotFoundException('Commission not found');
      entity_name = c.popular_name;
      commission_key = c.popular_name;
      chair_name = c.chair_name;
      domain_keyword = this.domainToken(c.domain);
      announced_year =
        c.announced_date && c.announced_date.length >= 4
          ? c.announced_date.slice(0, 4)
          : undefined;
      search_queries = this.commissionSearchQueries(c);
    } else if (entityType === 'adhoc_committee') {
      const a = await this.adhocRepo.findOne({ where: { id: entityId } });
      if (!a) throw new NotFoundException('Ad hoc committee not found');
      entity_name = a.popular_name;
      commission_key = a.popular_name;
      chair_name = a.chair_name ?? undefined;
      domain_keyword = this.domainToken(a.domain);
      announced_year =
        a.announced_date && a.announced_date.length >= 4
          ? a.announced_date.slice(0, 4)
          : undefined;
      search_queries = this.adhocSearchQueries(a);
    } else if (entityType === 'story') {
      const s = await this.storyRepo.findOne({ where: { id: entityId } });
      if (!s) throw new NotFoundException('Story not found');
      entity_name = s.title;
      domain_keyword = this.domainToken(s.domain);
      search_queries = this.storySearchQueries(s);
    } else if (entityType === 'siu_proclamation') {
      const p = await this.siuRepo.findOne({ where: { id: entityId } });
      if (!p) throw new NotFoundException('SIU proclamation not found');
      entity_name = p.title;
      domain_keyword = this.domainToken(p.domain);
      announced_year =
        p.signed_date && p.signed_date.length >= 4
          ? p.signed_date.slice(0, 4)
          : undefined;
      search_queries = this.siuSearchQueries(p);
    } else {
      throw new BadRequestException(
        'entityType must be commission | adhoc_committee | story | siu_proclamation',
      );
    }

    const scored = await this.intelligence.discoverYoutube({
      entity_type: entityType,
      entity_id: entityId,
      entity_name,
      search_queries,
      max_results_per_query: maxResultsPerQuery,
      commission_key,
      chair_name,
      domain_keyword,
      announced_year,
    });

    let queued = 0;
    let known = 0;

    for (const v of scored) {
      if (v.relevance_score < 0.4) continue;
      const existing = await this.ytRepo.findOne({
        where: { youtube_id: v.youtube_id },
      });
      if (existing) {
        known += 1;
        continue;
      }

      const row = this.ytRepo.create({
        youtube_id: v.youtube_id,
        title: v.title,
        channel_name: v.channel_name ?? null,
        channel_id: v.channel_id ?? null,
        description: v.description ?? null,
        published_at: v.published_at ? new Date(v.published_at) : null,
        duration_seconds: v.duration_seconds ?? null,
        thumbnail_url: v.thumbnail_url ?? null,
        view_count:
          v.view_count != null ? String(v.view_count) : null,
        relevance_score: v.relevance_score.toFixed(2),
        relevance_reason: v.relevance_reason ?? null,
        status: YoutubeVideoReviewStatus.PENDING,
        video_type: YoutubeVideoType.OTHER,
        language: 'en',
        commission_id: entityType === 'commission' ? entityId : null,
        adhoc_committee_id: entityType === 'adhoc_committee' ? entityId : null,
        story_id: entityType === 'story' ? entityId : null,
        siu_proclamation_id: entityType === 'siu_proclamation' ? entityId : null,
      });
      await this.ytRepo.save(row);
      queued += 1;
    }

    return {
      discovered: scored.length,
      queued_for_review: queued,
      already_known: known,
    };
  }

  async getReviewQueue(): Promise<YoutubeReviewQueueItemDto[]> {
    const rows = await this.ytRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.commission', 'commission')
      .leftJoinAndSelect('v.adhoc_committee', 'adhoc_committee')
      .leftJoinAndSelect('v.story', 'story')
      .leftJoinAndSelect('v.siu_proclamation', 'siu_proclamation')
      .where('v.status = :s', { s: YoutubeVideoReviewStatus.PENDING })
      .orderBy('v.relevance_score', 'DESC')
      .getMany();

    return rows.map((v) => ({
      id: v.id,
      youtube_id: v.youtube_id,
      title: v.title,
      channel_name: v.channel_name,
      thumbnail_url: v.thumbnail_url,
      relevance_score: Number(v.relevance_score),
      relevance_reason: v.relevance_reason,
      published_at: v.published_at?.toISOString() ?? null,
      duration_seconds: v.duration_seconds,
      view_count: v.view_count,
      commission_id: v.commission_id,
      adhoc_committee_id: v.adhoc_committee_id,
      story_id: v.story_id,
      siu_proclamation_id: v.siu_proclamation_id,
      entity_context:
        v.commission?.popular_name ??
        v.adhoc_committee?.popular_name ??
        v.story?.title ??
        v.siu_proclamation?.title ??
        null,
    }));
  }

  async approve(id: string, body: YoutubeApproveDto): Promise<void> {
    const row = await this.ytRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Video not found');
    const vt = body.video_type as YoutubeVideoType;
    if (!Object.values(YoutubeVideoType).includes(vt)) {
      throw new BadRequestException('Invalid video_type');
    }
    row.status = YoutubeVideoReviewStatus.APPROVED;
    row.video_type = vt;
    row.reviewed_by = body.reviewed_by;
    row.reviewed_at = new Date();
    row.rejection_reason = null;
    await this.ytRepo.save(row);
  }

  async reject(id: string, reason: string, reviewedBy: string): Promise<void> {
    const row = await this.ytRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Video not found');
    row.status = YoutubeVideoReviewStatus.REJECTED;
    row.rejection_reason = reason.slice(0, 500);
    row.reviewed_by = reviewedBy;
    row.reviewed_at = new Date();
    await this.ytRepo.save(row);
  }

  async listApprovedForCommission(commissionId: string): Promise<YoutubeVideo[]> {
    return this.ytRepo
      .createQueryBuilder('v')
      .where('v.commission_id = :cid', { cid: commissionId })
      .andWhere('v.status = :st', {
        st: YoutubeVideoReviewStatus.APPROVED,
      })
      .orderBy(
        `CASE v.video_type
          WHEN 'commission_hearing' THEN 1
          WHEN 'parliamentary' THEN 2
          WHEN 'news_report' THEN 3
          WHEN 'documentary' THEN 4
          WHEN 'analysis' THEN 5
          WHEN 'interview' THEN 6
          ELSE 7 END`,
        'ASC',
      )
      .addOrderBy('v.published_at', 'DESC', 'NULLS LAST')
      .getMany();
  }

  async listApprovedForAdhoc(committeeId: string): Promise<YoutubeVideo[]> {
    return this.ytRepo
      .createQueryBuilder('v')
      .where('v.adhoc_committee_id = :aid', { aid: committeeId })
      .andWhere('v.status = :st', {
        st: YoutubeVideoReviewStatus.APPROVED,
      })
      .orderBy(
        `CASE v.video_type
          WHEN 'commission_hearing' THEN 1
          WHEN 'parliamentary' THEN 2
          WHEN 'news_report' THEN 3
          WHEN 'documentary' THEN 4
          WHEN 'analysis' THEN 5
          WHEN 'interview' THEN 6
          ELSE 7 END`,
        'ASC',
      )
      .addOrderBy('v.published_at', 'DESC', 'NULLS LAST')
      .getMany();
  }

  async listApprovedForStory(storyId: string): Promise<YoutubeVideo[]> {
    return this.ytRepo
      .createQueryBuilder('v')
      .where('v.story_id = :sid', { sid: storyId })
      .andWhere('v.status = :st', {
        st: YoutubeVideoReviewStatus.APPROVED,
      })
      .orderBy(
        `CASE v.video_type
          WHEN 'commission_hearing' THEN 1
          WHEN 'parliamentary' THEN 2
          WHEN 'news_report' THEN 3
          WHEN 'documentary' THEN 4
          WHEN 'analysis' THEN 5
          WHEN 'interview' THEN 6
          ELSE 7 END`,
        'ASC',
      )
      .addOrderBy('v.published_at', 'DESC', 'NULLS LAST')
      .getMany();
  }

  async getStats(): Promise<YoutubeStatsDto> {
    const [pending, approved, rejected, total] = await Promise.all([
      this.ytRepo.count({
        where: { status: YoutubeVideoReviewStatus.PENDING },
      }),
      this.ytRepo.count({
        where: { status: YoutubeVideoReviewStatus.APPROVED },
      }),
      this.ytRepo.count({
        where: { status: YoutubeVideoReviewStatus.REJECTED },
      }),
      this.ytRepo.count(),
    ]);
    return { pending, approved, rejected, total_discovered: total };
  }

  /** Weekly: active commissions + active ad hoc committees. */
  async runWeeklyDiscovery(): Promise<void> {
    const [commissions, adhocs] = await Promise.all([
      this.commissionRepo.find({
        where: { status: CommissionStatus.ACTIVE },
        select: ['id'],
      }),
      this.adhocRepo.find({
        where: { status: AdhocCommitteeStatus.ACTIVE },
        select: ['id'],
      }),
    ]);

    for (const c of commissions) {
      try {
        const r = await this.discoverEntity('commission', c.id, 10);
        this.logger.log(
          `YouTube weekly: commission ${c.id} → queued ${r.queued_for_review} (known ${r.already_known})`,
        );
      } catch (err) {
        this.logger.warn(
          `YouTube weekly: commission ${c.id} failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    for (const a of adhocs) {
      try {
        const r = await this.discoverEntity('adhoc_committee', a.id, 10);
        this.logger.log(
          `YouTube weekly: adhoc ${a.id} → queued ${r.queued_for_review} (known ${r.already_known})`,
        );
      } catch (err) {
        this.logger.warn(
          `YouTube weekly: adhoc ${a.id} failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  /** Monthly: concluded commissions announced after 2010. */
  async runMonthlyConcludedDiscovery(): Promise<void> {
    const rows = await this.commissionRepo.find({
      where: { status: CommissionStatus.CONCLUDED },
      select: ['id', 'announced_date'],
    });
    const filtered = rows.filter((c) => {
      if (!c.announced_date || c.announced_date.length < 4) return false;
      const y = Number(c.announced_date.slice(0, 4));
      return Number.isFinite(y) && y > 2010;
    });

    for (const c of filtered) {
      try {
        const r = await this.discoverEntity('commission', c.id, 10);
        this.logger.log(
          `YouTube monthly concluded: commission ${c.id} → queued ${r.queued_for_review}`,
        );
      } catch (err) {
        this.logger.warn(
          `YouTube monthly: commission ${c.id} failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}
