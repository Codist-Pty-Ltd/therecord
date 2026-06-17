import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Commission } from '../entities/commission.entity';
import { SiuProclamation } from '../entities/siu_proclamation.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import type { RagCitationResult } from './dto/intelligence.dto';

export type EnrichedRagCitation = RagCitationResult & {
  slug: string | null;
};

/**
 * Resolves web slugs for RAG citations so the Ask UI can link to story,
 * commission, and SIU pages. Person citations use UUID paths and skip slug lookup.
 */
@Injectable()
export class IntelligenceCitationService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
    @InjectRepository(SiuProclamation)
    private readonly siuRepo: Repository<SiuProclamation>,
    @InjectRepository(TimelineEvent)
    private readonly eventRepo: Repository<TimelineEvent>,
  ) {}

  async resolveSlug(
    sourceType: string,
    sourceId: string,
  ): Promise<string | null> {
    switch (sourceType) {
      case 'person':
        return null;
      case 'story': {
        const row = await this.storyRepo.findOne({
          where: { id: sourceId },
          select: { slug: true },
        });
        return row?.slug ?? null;
      }
      case 'commission': {
        const row = await this.commissionRepo.findOne({
          where: { id: sourceId },
          select: { slug: true },
        });
        return row?.slug ?? null;
      }
      case 'siu': {
        const row = await this.siuRepo.findOne({
          where: { id: sourceId },
          select: { slug: true },
        });
        return row?.slug ?? null;
      }
      case 'timeline_event': {
        const event = await this.eventRepo.findOne({
          where: { id: sourceId },
          relations: { story: true },
        });
        return event?.story?.slug ?? null;
      }
      default:
        return null;
    }
  }

  async enrichCitations(
    citations: RagCitationResult[],
  ): Promise<EnrichedRagCitation[]> {
    const unique = new Map<string, Promise<string | null>>();
    for (const c of citations) {
      const key = `${c.source_type}:${c.source_id}`;
      if (!unique.has(key)) {
        unique.set(key, this.resolveSlug(c.source_type, c.source_id));
      }
    }
    const resolved = new Map<string, string | null>();
    await Promise.all(
      [...unique.entries()].map(async ([key, promise]) => {
        resolved.set(key, await promise);
      }),
    );
    return citations.map((c) => ({
      ...c,
      slug: resolved.get(`${c.source_type}:${c.source_id}`) ?? null,
    }));
  }
}
