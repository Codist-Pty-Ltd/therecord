import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContentQueueItem,
  ContentQueueStatus,
} from '../entities/content-queue-item.entity';
import { StoriesService } from '../stories/stories.service';
import { StoryDomain, StoryStatus } from '../entities/story.entity';
import { UpdateContentQueueItemDto } from './dto/update-queue-item.dto';

@Injectable()
export class ContentQueueService {
  constructor(
    @InjectRepository(ContentQueueItem)
    private readonly queueRepo: Repository<ContentQueueItem>,
    private readonly stories: StoriesService,
  ) {}

  async list(filter?: {
    status?: string;
    source?: string;
  }): Promise<ContentQueueItem[]> {
    const qb = this.queueRepo.createQueryBuilder('q').orderBy('q.created_at', 'DESC');

    if (filter?.status) {
      qb.andWhere('q.status = :status', { status: filter.status });
    }
    if (filter?.source) {
      qb.andWhere('q.source = :source', { source: filter.source });
    }

    return qb.getMany();
  }

  async getStats(): Promise<{
    pending: number;
    this_week: number;
    total_processed: number;
  }> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [pending, thisWeek, totalProcessed] = await Promise.all([
      this.queueRepo.count({ where: { status: ContentQueueStatus.PENDING } }),
      this.queueRepo
        .createQueryBuilder('q')
        .where('q.created_at >= :since', { since: weekAgo })
        .getCount(),
      this.queueRepo
        .createQueryBuilder('q')
        .where('q.status != :pending', { pending: ContentQueueStatus.PENDING })
        .getCount(),
    ]);

    return { pending, this_week: thisWeek, total_processed: totalProcessed };
  }

  async update(id: string, dto: UpdateContentQueueItemDto): Promise<ContentQueueItem> {
    const item = await this.queueRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Queue item ${id} not found.`);
    }

    if (dto.status) {
      item.status = dto.status;
      if (dto.status !== ContentQueueStatus.PENDING) {
        item.reviewed_at = new Date();
      }
    }
    if (dto.reviewed_by) {
      item.reviewed_by = dto.reviewed_by;
    }

    return this.queueRepo.save(item);
  }

  async ignore(id: string, reviewedBy?: string): Promise<ContentQueueItem> {
    return this.update(id, {
      status: ContentQueueStatus.IGNORED,
      reviewed_by: reviewedBy,
    });
  }

  async createStoryFromItem(
    id: string,
    reviewedBy?: string,
  ): Promise<{ story_id: string; slug: string; title: string }> {
    const item = await this.queueRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Queue item ${id} not found.`);
    }

    const created = await this.stories.create({
      title: item.title.slice(0, 500),
      domain: StoryDomain.CORRUPTION,
      status: StoryStatus.ACTIVE,
      summary: item.summary ?? undefined,
    });

    item.status = ContentQueueStatus.PUBLISHED;
    item.story_id = created.id;
    item.reviewed_at = new Date();
    item.reviewed_by = reviewedBy ?? item.reviewed_by;
    await this.queueRepo.save(item);

    return {
      story_id: created.id,
      slug: created.slug,
      title: created.title,
    };
  }
}
