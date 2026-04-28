import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { buildPaginationMeta } from '../common/dto/pagination-meta.dto';
import { slugify } from '../common/utils/slug.util';
import { Article } from '../entities/article.entity';
import { EventLegalReference } from '../entities/event_legal_reference.entity';
import { Investigation } from '../entities/investigation.entity';
import { LawSection } from '../entities/law_section.entity';
import { Person } from '../entities/person.entity';
import { Story, StoryDomain, StoryStatus } from '../entities/story.entity';
import { StoryPerson } from '../entities/story_person.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import {
  ArticleBriefDto,
  InvestigationBriefDto,
  LawSectionBriefDto,
  LegalReferenceBriefDto,
  PersonBriefDto,
  StoryDetailResponseDto,
  StoryListItemDto,
  StoryListResponseDto,
  StoryPersonBriefDto,
  TimelineEventBriefDto,
} from './dto/story-response.dto';

const MAX_ARTICLES_IN_DETAIL = 50;
const MAX_SLUG_COLLISIONS = 1000;

interface StoryWithLatestEvent extends Story {
  commission_id: string | null;
  latest_event_date: string | null;
}

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    @InjectRepository(TimelineEvent)
    private readonly timelineRepo: Repository<TimelineEvent>,
    @InjectRepository(StoryPerson)
    private readonly storyPersonRepo: Repository<StoryPerson>,
    @InjectRepository(Investigation)
    private readonly investigationRepo: Repository<Investigation>,
    @InjectRepository(Article) private readonly articleRepo: Repository<Article>,
    @InjectRepository(EventLegalReference)
    private readonly eventLegalRefRepo: Repository<EventLegalReference>,
  ) {}

  /* ---------------------------------------------------------------- list */

  async findAll(
    page: number,
    limit: number,
    domain?: StoryDomain,
  ): Promise<StoryListResponseDto> {
    const offset = (page - 1) * limit;

    const listQb = this.storyRepo
      .createQueryBuilder('story')
      .leftJoin('timeline_events', 'te', 'te.story_id = story.id')
      .select([
        'story.id AS id',
        'story.title AS title',
        'story.slug AS slug',
        'story.domain AS domain',
        'story.status AS status',
        'story.summary AS summary',
        'story.plain_english_summary AS plain_english_summary',
        'story.commission_id AS commission_id',
        'story.created_at AS created_at',
        'story.updated_at AS updated_at',
      ])
      .addSelect('MAX(te.event_date)', 'latest_event_date')
      .where('story.status = :status', { status: StoryStatus.ACTIVE });

    if (domain) {
      listQb.andWhere('story.domain = :domain', { domain });
    }

    const rows = await listQb
      .groupBy('story.id')
      .orderBy('MAX(te.event_date)', 'DESC', 'NULLS LAST')
      .addOrderBy('story.created_at', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<StoryWithLatestEvent>();

    const countQb = this.storyRepo
      .createQueryBuilder('story')
      .where('story.status = :status', { status: StoryStatus.ACTIVE });
    if (domain) {
      countQb.andWhere('story.domain = :domain', { domain });
    }
    const total = await countQb.getCount();

    return {
      data: rows.map((row) => this.mapRawRowToListItem(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  /* ---------------------------------------------------------------- slug */

  async findBySlug(slug: string): Promise<StoryDetailResponseDto> {
    const story = await this.storyRepo.findOne({ where: { slug } });
    if (!story) {
      throw new NotFoundException(`Story with slug "${slug}" not found.`);
    }

    const [timelineEvents, storyPeople, investigations, articles] = await Promise.all([
      this.timelineRepo.find({
        where: { story_id: story.id },
        order: { event_date: 'ASC', created_at: 'ASC' },
      }),
      this.storyPersonRepo.find({
        where: { story_id: story.id },
        relations: ['person'],
      }),
      this.investigationRepo.find({
        where: { story_id: story.id },
        order: { started_at: 'ASC' },
      }),
      this.articleRepo.find({
        where: { story_id: story.id },
        order: { published_at: 'DESC' },
        take: MAX_ARTICLES_IN_DETAIL,
      }),
    ]);

    const eventIds = timelineEvents.map((e) => e.id);
    const [legalRefsByEvent, lawSectionsForSidebar] = await Promise.all([
      this.loadLegalReferencesByEvent(eventIds),
      this.loadRelatedLawSections(eventIds),
    ]);

    const latestEventDate = timelineEvents.length
      ? timelineEvents[timelineEvents.length - 1].event_date
      : null;

    return {
      ...this.mapEntityToListItem(story, latestEventDate),
      timeline_events: timelineEvents.map((e) =>
        this.mapTimelineEvent(e, legalRefsByEvent.get(e.id) ?? []),
      ),
      people: storyPeople.map((sp) => this.mapStoryPerson(sp)),
      investigations: investigations.map((i) => this.mapInvestigation(i)),
      articles: articles.map((a) => this.mapArticle(a)),
      law_sections: lawSectionsForSidebar,
    };
  }

  /* -------------------------------------------------------------- create */

  async create(dto: CreateStoryDto): Promise<StoryListItemDto> {
    const slug = dto.slug
      ? this.validateSlug(dto.slug)
      : await this.generateUniqueSlug(dto.title);

    const existing = await this.storyRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`A story with slug "${slug}" already exists.`);
    }

    const story = this.storyRepo.create({
      title: dto.title,
      slug,
      domain: dto.domain,
      status: dto.status ?? StoryStatus.ACTIVE,
      summary: dto.summary ?? null,
      plain_english_summary: dto.plain_english_summary ?? null,
    });

    const saved = await this.storyRepo.save(story);
    return this.mapEntityToListItem(saved, null);
  }

  /* --------------------------------------------------------------- util */

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    if (!base) {
      throw new BadRequestException(
        'Title cannot be converted into a valid slug. Provide an explicit slug.',
      );
    }

    let candidate = base;
    let suffix = 2;
    while (await this.storyRepo.findOne({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix++}`;
      if (suffix > MAX_SLUG_COLLISIONS) {
        throw new ConflictException(
          `Unable to generate a unique slug from "${title}" after ${MAX_SLUG_COLLISIONS} attempts.`,
        );
      }
    }
    return candidate;
  }

  private validateSlug(slug: string): string {
    const cleaned = slugify(slug);
    if (!cleaned) {
      throw new BadRequestException('Provided slug is invalid.');
    }
    return cleaned;
  }

  /**
   * Load every `event_legal_references` row for a set of events, joined with
   * the underlying law_section (→ law) / constitution_section. Returns a map
   * keyed by `event_id` so the caller can attach the flattened references
   * to the right event in one pass.
   */
  private async loadLegalReferencesByEvent(
    eventIds: string[],
  ): Promise<Map<string, LegalReferenceBriefDto[]>> {
    if (eventIds.length === 0) return new Map();

    const refs = await this.eventLegalRefRepo.find({
      where: { event_id: In(eventIds) },
      relations: ['law_section', 'law_section.law', 'constitution_section'],
    });

    const byEvent = new Map<string, LegalReferenceBriefDto[]>();
    for (const ref of refs) {
      const flat = this.flattenLegalReference(ref);
      if (!flat) continue;
      const existing = byEvent.get(ref.event_id);
      if (existing) {
        existing.push(flat);
      } else {
        byEvent.set(ref.event_id, [flat]);
      }
    }
    return byEvent;
  }

  private flattenLegalReference(
    ref: EventLegalReference,
  ): LegalReferenceBriefDto | null {
    if (ref.law_section && ref.law_section.law) {
      const { law, section_number, plain_english } = ref.law_section;
      return {
        act_name: law.name,
        short_name: law.short_name,
        section: section_number,
        relevance: ref.relevance,
        is_constitutional: false,
        act_number: law.act_number,
        plain_english: plain_english,
      };
    }

    if (ref.constitution_section) {
      const cs = ref.constitution_section;
      return {
        act_name: 'Constitution of the Republic of South Africa, 1996',
        short_name: 'Constitution',
        section: `Section ${cs.section_number}`,
        relevance: ref.relevance,
        is_constitutional: true,
        act_number: '108 of 1996',
        plain_english: cs.plain_english,
      };
    }

    // Orphaned reference — section was deleted (ON DELETE SET NULL). Skip it
    // rather than returning a partially-populated row.
    return null;
  }

  private async loadRelatedLawSections(eventIds: string[]): Promise<LawSectionBriefDto[]> {
    if (eventIds.length === 0) return [];

    const refs = await this.eventLegalRefRepo.find({
      where: {
        event_id: In(eventIds),
        law_section_id: Not(IsNull()),
      },
      relations: ['law_section', 'law_section.law'],
    });

    const deduped = new Map<string, LawSection>();
    for (const ref of refs) {
      if (ref.law_section) {
        deduped.set(ref.law_section.id, ref.law_section);
      }
    }

    return Array.from(deduped.values()).map((section) => ({
      id: section.id,
      section_number: section.section_number,
      section_title: section.section_title,
      plain_english: section.plain_english,
      law_name: section.law.name,
      law_short_name: section.law.short_name,
      law_category: section.law.category,
    }));
  }

  /* ----------------------------------------------------------- mappers */

  private mapEntityToListItem(story: Story, latestEventDate: string | null): StoryListItemDto {
    return {
      id: story.id,
      title: story.title,
      slug: story.slug,
      domain: story.domain,
      status: story.status,
      summary: story.summary,
      plain_english_summary: story.plain_english_summary,
      commission_id: story.commission_id,
      latest_event_date: latestEventDate,
      created_at: story.created_at.toISOString(),
      updated_at: story.updated_at.toISOString(),
    };
  }

  private mapRawRowToListItem(row: StoryWithLatestEvent): StoryListItemDto {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      domain: row.domain,
      status: row.status,
      summary: row.summary,
      plain_english_summary: row.plain_english_summary,
      commission_id: row.commission_id,
      latest_event_date: row.latest_event_date,
      created_at: new Date(row.created_at as unknown as string).toISOString(),
      updated_at: new Date(row.updated_at as unknown as string).toISOString(),
    };
  }

  private mapTimelineEvent(
    e: TimelineEvent,
    legalReferences: LegalReferenceBriefDto[],
  ): TimelineEventBriefDto {
    return {
      id: e.id,
      story_id: e.story_id,
      event_date: e.event_date,
      event_type: e.event_type,
      title: e.title,
      description: e.description,
      plain_english: e.plain_english,
      significance: e.significance,
      source_urls: e.source_urls,
      created_at: e.created_at.toISOString(),
      legal_references: legalReferences,
    };
  }

  private mapStoryPerson(sp: StoryPerson): StoryPersonBriefDto {
    return {
      id: sp.id,
      story_id: sp.story_id,
      person_id: sp.person_id,
      role_in_story: sp.role_in_story,
      is_key_figure: sp.is_key_figure,
      person: this.mapPerson(sp.person),
    };
  }

  private mapPerson(p: Person): PersonBriefDto {
    return {
      id: p.id,
      full_name: p.full_name,
      aliases: p.aliases,
      current_role: p.current_role,
      organisation: p.organisation,
      status: p.status,
      profile_summary: p.profile_summary,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
    };
  }

  private mapInvestigation(i: Investigation): InvestigationBriefDto {
    return {
      id: i.id,
      story_id: i.story_id,
      name: i.name,
      investigation_type: i.investigation_type,
      established_by: i.established_by,
      legal_basis: i.legal_basis,
      chair_name: i.chair_name,
      status: i.status,
      official_url: i.official_url,
      started_at: i.started_at,
      concluded_at: i.concluded_at,
    };
  }

  private mapArticle(a: Article): ArticleBriefDto {
    return {
      id: a.id,
      story_id: a.story_id,
      source_name: a.source_name,
      source_url: a.source_url,
      headline: a.headline,
      published_at: a.published_at.toISOString(),
      content_snippet: a.content_snippet,
      ai_processed: a.ai_processed,
      created_at: a.created_at.toISOString(),
    };
  }
}
