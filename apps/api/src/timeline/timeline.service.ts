import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventLegalReference } from '../entities/event_legal_reference.entity';
import { Story } from '../entities/story.entity';
import {
  EventSignificance,
  TimelineEvent,
} from '../entities/timeline_event.entity';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import {
  TimelineEventResponseDto,
  TimelineLegalReferenceDto,
} from './dto/timeline-event-response.dto';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(TimelineEvent)
    private readonly eventRepo: Repository<TimelineEvent>,
    @InjectRepository(EventLegalReference)
    private readonly refRepo: Repository<EventLegalReference>,
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /* ------------------------------------------------------------- read */

  async findByStory(storyId: string): Promise<TimelineEventResponseDto[]> {
    const story = await this.storyRepo.findOne({ where: { id: storyId } });
    if (!story) {
      throw new NotFoundException(`Story ${storyId} not found.`);
    }

    const events = await this.eventRepo.find({
      where: { story_id: storyId },
      order: { event_date: 'ASC', created_at: 'ASC' },
    });

    return this.attachLegalReferences(events);
  }

  async findOne(id: string): Promise<TimelineEventResponseDto> {
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Timeline event ${id} not found.`);
    }

    const [withRefs] = await this.attachLegalReferences([event]);
    return withRefs;
  }

  /* ----------------------------------------------------------- create */

  async create(dto: CreateTimelineEventDto): Promise<TimelineEventResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const storyRepo = manager.getRepository(Story);
      const eventRepo = manager.getRepository(TimelineEvent);
      const refRepo = manager.getRepository(EventLegalReference);

      const story = await storyRepo.findOne({ where: { id: dto.story_id } });
      if (!story) {
        throw new NotFoundException(`Story ${dto.story_id} not found.`);
      }

      const event = eventRepo.create({
        story_id: dto.story_id,
        event_date: dto.event_date,
        event_type: dto.event_type,
        title: dto.title,
        description: dto.description,
        plain_english: dto.plain_english,
        significance: dto.significance ?? EventSignificance.MEDIUM,
        source_urls: dto.source_urls ?? [],
      });
      const saved = await eventRepo.save(event);

      const refs = this.buildLegalReferences(saved.id, dto);
      if (refs.length > 0) {
        await refRepo.save(refs);
      }

      const storedRefs = refs.length
        ? await refRepo.find({ where: { event_id: saved.id } })
        : [];

      return this.mapToDto(saved, storedRefs);
    });
  }

  /* ----------------------------------------------------------- update */

  async update(
    id: string,
    dto: Partial<CreateTimelineEventDto>,
  ): Promise<TimelineEventResponseDto> {
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Timeline event ${id} not found.`);
    }

    if (dto.event_date !== undefined) event.event_date = dto.event_date;
    if (dto.event_type !== undefined) event.event_type = dto.event_type;
    if (dto.title !== undefined) event.title = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.plain_english !== undefined) event.plain_english = dto.plain_english;
    if (dto.significance !== undefined) event.significance = dto.significance;
    if (dto.source_urls !== undefined) event.source_urls = dto.source_urls;

    await this.eventRepo.save(event);
    return this.findOne(event.id);
  }

  /* ----------------------------------------------------------- remove */

  async remove(id: string): Promise<void> {
    const result = await this.eventRepo.delete({ id });
    if (!result.affected) {
      throw new NotFoundException(`Timeline event ${id} not found.`);
    }
  }

  /* ----------------------------------------------------------- helpers */

  private buildLegalReferences(
    eventId: string,
    dto: CreateTimelineEventDto,
  ): EventLegalReference[] {
    const refs: EventLegalReference[] = [];
    const relevance = dto.legal_relevance ?? '';
    const allegedViolation = dto.alleged_violation ?? false;

    for (const lsId of dto.law_section_ids ?? []) {
      refs.push(
        this.refRepo.create({
          event_id: eventId,
          law_section_id: lsId,
          constitution_section_id: null,
          relevance,
          alleged_violation: allegedViolation,
        }),
      );
    }

    for (const csId of dto.constitution_section_ids ?? []) {
      refs.push(
        this.refRepo.create({
          event_id: eventId,
          law_section_id: null,
          constitution_section_id: csId,
          relevance,
          alleged_violation: allegedViolation,
        }),
      );
    }

    return refs;
  }

  private async attachLegalReferences(
    events: TimelineEvent[],
  ): Promise<TimelineEventResponseDto[]> {
    if (events.length === 0) return [];

    const refs = await this.refRepo
      .createQueryBuilder('ref')
      .where('ref.event_id IN (:...ids)', { ids: events.map((e) => e.id) })
      .getMany();

    const grouped = new Map<string, EventLegalReference[]>();
    for (const ref of refs) {
      const list = grouped.get(ref.event_id) ?? [];
      list.push(ref);
      grouped.set(ref.event_id, list);
    }

    return events.map((e) => this.mapToDto(e, grouped.get(e.id) ?? []));
  }

  private mapToDto(
    event: TimelineEvent,
    refs: EventLegalReference[],
  ): TimelineEventResponseDto {
    return {
      id: event.id,
      story_id: event.story_id,
      event_date: event.event_date,
      event_type: event.event_type,
      title: event.title,
      description: event.description,
      plain_english: event.plain_english,
      significance: event.significance,
      source_urls: event.source_urls,
      legal_references: refs.map((r) => this.mapRef(r)),
      created_at: event.created_at.toISOString(),
    };
  }

  private mapRef(ref: EventLegalReference): TimelineLegalReferenceDto {
    return {
      id: ref.id,
      law_section_id: ref.law_section_id,
      constitution_section_id: ref.constitution_section_id,
      relevance: ref.relevance,
      alleged_violation: ref.alleged_violation,
    };
  }
}
