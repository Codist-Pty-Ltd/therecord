import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { AdhocCommittee } from '../entities/adhoc_committee.entity';
import { Article } from '../entities/article.entity';
import { EventLegalReference } from '../entities/event_legal_reference.entity';
import { SiuProclamation } from '../entities/siu_proclamation.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import {
  mapArticle,
  mapLegalReference,
  mapTimelineEvent,
} from './mappers';
import { ArticleType } from './types/article.type';
import { EventType } from './types/event.type';
import { LegalReferenceType } from './types/legal-reference.type';

@Injectable()
export class GraphqlDataService {
  constructor(
    @InjectRepository(TimelineEvent)
    private readonly timelineRepo: Repository<TimelineEvent>,
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    @InjectRepository(EventLegalReference)
    private readonly legalRefRepo: Repository<EventLegalReference>,
    @InjectRepository(SiuProclamation)
    private readonly siuRepo: Repository<SiuProclamation>,
    @InjectRepository(AdhocCommittee)
    private readonly adhocRepo: Repository<AdhocCommittee>,
  ) {}

  async findEventsByCommissionIds(
    commissionIds: readonly string[],
  ): Promise<EventType[]> {
    if (commissionIds.length === 0) return [];

    const stories = await this.storyRepo.find({
      where: { commission_id: In([...commissionIds]) },
      select: ['id', 'commission_id'],
    });
    if (stories.length === 0) return [];

    const storyToCommission = new Map(
      stories.map((s) => [s.id, s.commission_id] as const),
    );
    const storyIds = stories.map((s) => s.id);

    const events = await this.timelineRepo.find({
      where: { story_id: In(storyIds) },
      order: { event_date: 'ASC', created_at: 'ASC' },
    });

    return events.map((e) => {
      const commissionId = storyToCommission.get(e.story_id) ?? '';
      return mapTimelineEvent(e, commissionId);
    });
  }

  async findArticlesByCommissionIds(
    commissionIds: readonly string[],
  ): Promise<ArticleType[]> {
    if (commissionIds.length === 0) return [];

    const rows = await this.articleRepo
      .createQueryBuilder('a')
      .innerJoin('stories', 's', 's.id = a.story_id')
      .select('a.id', 'id')
      .addSelect('a.story_id', 'story_id')
      .addSelect('a.source_name', 'source_name')
      .addSelect('a.source_url', 'source_url')
      .addSelect('a.headline', 'headline')
      .addSelect('a.published_at', 'published_at')
      .addSelect('s.commission_id', 'commission_id')
      .where('s.commission_id IN (:...ids)', { ids: [...commissionIds] })
      .orderBy('a.published_at', 'DESC')
      .getRawMany<{
        id: string;
        story_id: string;
        source_name: string;
        source_url: string;
        headline: string;
        published_at: Date;
        commission_id: string;
      }>();

    return rows.map((row) =>
      mapArticle(
        {
          id: row.id,
          story_id: row.story_id,
          source_name: row.source_name,
          source_url: row.source_url,
          headline: row.headline,
          published_at: row.published_at,
        } as Article,
        row.commission_id,
      ),
    );
  }

  async findLegalReferencesByEventIds(
    eventIds: readonly string[],
  ): Promise<LegalReferenceType[]> {
    if (eventIds.length === 0) return [];

    const refs = await this.legalRefRepo.find({
      where: { event_id: In([...eventIds]) },
      relations: [
        'law_section',
        'law_section.law',
        'constitution_section',
      ],
    });

    return refs.map((ref) => mapLegalReference(ref, ref.event_id));
  }

  async findSiuProclamations(limit = 20): Promise<SiuProclamation[]> {
    return this.siuRepo.find({
      order: { signed_date: 'DESC', created_at: 'DESC' },
      take: limit,
    });
  }

  async findSiuProclamationById(id: string): Promise<SiuProclamation | null> {
    return this.siuRepo.findOne({ where: { id } });
  }

  async findAdhocCommittees(limit = 20): Promise<AdhocCommittee[]> {
    return this.adhocRepo.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findAdhocCommitteeById(id: string): Promise<AdhocCommittee | null> {
    return this.adhocRepo.findOne({ where: { id } });
  }
}
