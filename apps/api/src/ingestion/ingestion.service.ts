import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { slugify } from '../common/utils/slug.util';
import { Article } from '../entities/article.entity';
import { LawSection } from '../entities/law_section.entity';
import { Person, PersonStatus } from '../entities/person.entity';
import { Story, StoryDomain, StoryStatus } from '../entities/story.entity';
import { StoryPerson } from '../entities/story_person.entity';
import { IntelligenceClient } from '../intelligence/intelligence.client';
import type {
  ExtractEntitiesResult,
  LegalReferenceResult,
  SimplifyResult,
  StoryCandidate,
} from '../intelligence/dto/intelligence.dto';
import { IngestArticleDto } from './dto/ingest-article.dto';
import type {
  IngestedPersonDto,
  IngestionResultDto,
  IngestionStoryDecisionDto,
  SimplifyLawSectionResultDto,
} from './dto/ingestion-result.dto';

const MAX_SLUG_COLLISIONS = 1000;
const MAX_STORY_CANDIDATES = 100;
const DEFAULT_ROLE_IN_STORY = 'mentioned';

/**
 * Honorifics we strip before matching a NER-extracted name against an
 * existing Person row. spaCy tends to include the military / civilian title
 * as part of a PERSON span ("Lt Gen Nhlanhla Mkhwanazi"), which would
 * otherwise cause us to create duplicate profiles for the same human.
 *
 * The list is deliberately SA-focussed. Ordered by length so the longest
 * prefix is stripped first ("Lieutenant General" before "Lieutenant").
 */
const HONORIFICS: ReadonlyArray<string> = [
  'lieutenant general',
  'lt gen',
  'lt-gen',
  'major general',
  'maj gen',
  'maj-gen',
  'brigadier',
  'general',
  'gen',
  'colonel',
  'col',
  'lt col',
  'captain',
  'capt',
  'commander',
  'cmdr',
  'sergeant',
  'sgt',
  'constable',
  'const',
  'advocate',
  'adv',
  'professor',
  'prof',
  'doctor',
  'dr',
  'justice',
  'judge',
  'minister',
  'mr',
  'mrs',
  'ms',
  'mx',
];

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly intelligence: IntelligenceClient,
    private readonly dataSource: DataSource,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    @InjectRepository(Article) private readonly articleRepo: Repository<Article>,
    @InjectRepository(Person) private readonly personRepo: Repository<Person>,
    @InjectRepository(StoryPerson)
    private readonly storyPersonRepo: Repository<StoryPerson>,
    @InjectRepository(LawSection)
    private readonly lawSectionRepo: Repository<LawSection>,
  ) {}

  /**
   * Ingest one article end-to-end:
   *   1. NER over `full_text` — people, orgs, events, crimes, locations.
   *   2. Legal mapping — crimes → South African statutes (best-effort).
   *   3. Story resolution — either a caller-supplied `story_id_hint`,
   *      a cluster match against active stories, or a newly-created story.
   *   4. Person upsert + `story_people` linking.
   *   5. `articles` insert with `ai_processed = true`.
   *   6. Optional Claude simplify of the snippet → cached on the story's
   *      `plain_english_summary` column when it's still null.
   *
   * Writes are done inside a single TypeORM transaction so a mid-pipeline
   * failure can't leave a story with no article (or an article pointing at
   * a story that never got saved).
   */
  async ingestArticle(dto: IngestArticleDto): Promise<IngestionResultDto> {
    const warnings: string[] = [];

    const entities = await this.intelligence.extractEntities(dto.full_text);
    const legalReferences = await this.safeMapLegal(
      entities.crimes_alleged,
      warnings,
    );

    return await this.dataSource.transaction(async (manager) => {
      const storyRepo = manager.getRepository(Story);
      const articleRepo = manager.getRepository(Article);
      const personRepo = manager.getRepository(Person);
      const storyPersonRepo = manager.getRepository(StoryPerson);

      const storyDecision = await this.resolveStory(
        dto,
        entities,
        warnings,
        storyRepo,
      );

      const ingestedPeople = await this.linkPeople(
        storyDecision.story_id,
        entities,
        personRepo,
        storyPersonRepo,
      );

      const snippet = dto.content_snippet.slice(0, 500);
      const trimmedFeed = dto.source_rss_feed?.trim();
      const article = articleRepo.create({
        story_id: storyDecision.story_id,
        source_name: dto.source_name,
        source_url: dto.source_url,
        headline: dto.headline,
        published_at: new Date(dto.published_at),
        content_snippet: snippet,
        fetched_at: new Date(),
        snippet_char_count: snippet.length,
        full_text_stored: false,
        source_rss_feed:
          trimmedFeed && trimmedFeed.length > 0 ? trimmedFeed.slice(0, 500) : null,
        ai_processed: true,
      });
      const savedArticle = await articleRepo.save(article);

      const simplify = await this.maybeSimplifyStorySummary(
        dto,
        storyDecision,
        storyRepo,
        warnings,
      );

      this.logger.log(
        `Ingested article "${dto.headline}" → story=${storyDecision.story_slug} ` +
          `(created=${storyDecision.was_created}, people=${ingestedPeople.length}, ` +
          `legal_refs=${legalReferences.length})`,
      );

      return {
        article_id: savedArticle.id,
        story: storyDecision,
        entities,
        legal_references: legalReferences,
        people: ingestedPeople,
        simplify,
        warnings,
      };
    });
  }

  /**
   * Populate (or overwrite) a LawSection's `plain_english` column with a
   * Claude-simplified version of its `full_text`. Reading level is fixed
   * at "child" — the product rule is that every legal reference must be
   * explainable to a 10-year-old.
   */
  async simplifyLawSection(
    id: string,
    overwrite = false,
  ): Promise<SimplifyLawSectionResultDto> {
    const section = await this.lawSectionRepo.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException(`LawSection ${id} not found.`);
    }

    const source = section.full_text?.trim() || section.section_title;
    if (!source) {
      throw new BadRequestException(
        `LawSection ${id} has no full_text or section_title to simplify.`,
      );
    }

    if (
      !overwrite &&
      section.plain_english &&
      section.plain_english.trim().length > 0
    ) {
      throw new ConflictException(
        `LawSection ${id} already has a plain_english value. Pass overwrite=true to replace it.`,
      );
    }

    const previous = section.plain_english;
    const result = await this.intelligence.simplify(source, 'child');

    section.plain_english = result.simplified;
    await this.lawSectionRepo.save(section);

    return {
      law_section_id: section.id,
      previous_plain_english: previous,
      simplified: result.simplified,
      reading_level: result.reading_level,
    };
  }

  /* ------------------------------------------------------- steps */

  private async safeMapLegal(
    crimesAlleged: string[],
    warnings: string[],
  ): Promise<LegalReferenceResult[]> {
    if (crimesAlleged.length === 0) return [];
    try {
      const result = await this.intelligence.mapLegal(crimesAlleged);
      return result.references;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warnings.push(`legal_map_skipped: ${message}`);
      return [];
    }
  }

  private async resolveStory(
    dto: IngestArticleDto,
    entities: ExtractEntitiesResult,
    warnings: string[],
    storyRepo: Repository<Story>,
  ): Promise<IngestionStoryDecisionDto> {
    // Caller knows the thread — skip clustering entirely.
    if (dto.story_id_hint) {
      const existing = await storyRepo.findOne({
        where: { id: dto.story_id_hint },
      });
      if (!existing) {
        throw new NotFoundException(
          `story_id_hint ${dto.story_id_hint} does not match any existing story.`,
        );
      }
      return {
        story_id: existing.id,
        story_slug: existing.slug,
        story_title: existing.title,
        story_domain: existing.domain,
        story_status: existing.status,
        was_created: false,
        cluster: null,
      };
    }

    const candidates = await this.loadCandidateStories(storyRepo);
    const clusterResult = await this.intelligence.clusterMatch(
      dto.headline,
      dto.full_text,
      candidates,
    );

    if (clusterResult.matched_story_id) {
      const matched = await storyRepo.findOne({
        where: { id: clusterResult.matched_story_id },
      });
      if (matched) {
        return {
          story_id: matched.id,
          story_slug: matched.slug,
          story_title: matched.title,
          story_domain: matched.domain,
          story_status: matched.status,
          was_created: false,
          cluster: clusterResult,
        };
      }
      // Rare: clustering returned an ID that no longer exists. Fall through
      // to creation and flag it so a human can review.
      warnings.push(
        `cluster_matched_missing_story: id=${clusterResult.matched_story_id}`,
      );
    }

    const created = await this.createStoryFromArticle(
      dto,
      entities,
      storyRepo,
    );
    return {
      story_id: created.id,
      story_slug: created.slug,
      story_title: created.title,
      story_domain: created.domain,
      story_status: created.status,
      was_created: true,
      cluster: clusterResult,
    };
  }

  private async loadCandidateStories(
    storyRepo: Repository<Story>,
  ): Promise<StoryCandidate[]> {
    // Only active stories are candidates for clustering — resolved/dormant
    // threads should not absorb new articles without human intervention.
    const rows = await storyRepo.find({
      where: { status: StoryStatus.ACTIVE },
      order: { updated_at: 'DESC' },
      take: MAX_STORY_CANDIDATES,
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      plain_english_summary: row.plain_english_summary,
    }));
  }

  private async createStoryFromArticle(
    dto: IngestArticleDto,
    entities: ExtractEntitiesResult,
    storyRepo: Repository<Story>,
  ): Promise<Story> {
    const domain = dto.default_domain ?? this.inferDomain(entities);
    const slug = await this.generateUniqueSlug(dto.headline, storyRepo);

    const story = storyRepo.create({
      title: dto.headline.slice(0, 500),
      slug,
      domain,
      status: StoryStatus.ACTIVE,
      summary: dto.content_snippet,
      plain_english_summary: null,
      commission_id: null,
    });
    return storyRepo.save(story);
  }

  /**
   * Cheap heuristic. The intelligence service doesn't classify domains yet,
   * so we pick a sensible default: any detected crime → criminal_justice;
   * otherwise fall back to politics (the workhorse domain). This is always
   * overridable via `default_domain` on the ingest payload.
   */
  private inferDomain(entities: ExtractEntitiesResult): StoryDomain {
    if (entities.crimes_alleged.length > 0) {
      return StoryDomain.CRIMINAL_JUSTICE;
    }
    return StoryDomain.POLITICS;
  }

  private async generateUniqueSlug(
    title: string,
    storyRepo: Repository<Story>,
  ): Promise<string> {
    const base = slugify(title);
    if (!base) {
      throw new BadRequestException(
        'Headline cannot be converted into a valid slug.',
      );
    }

    let candidate = base;
    let suffix = 2;
    while (await storyRepo.findOne({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix++}`;
      if (suffix > MAX_SLUG_COLLISIONS) {
        throw new ConflictException(
          `Unable to generate a unique slug from "${title}" after ${MAX_SLUG_COLLISIONS} attempts.`,
        );
      }
    }
    return candidate;
  }

  private async linkPeople(
    storyId: string,
    entities: ExtractEntitiesResult,
    personRepo: Repository<Person>,
    storyPersonRepo: Repository<StoryPerson>,
  ): Promise<IngestedPersonDto[]> {
    // NER routinely surfaces the same human under several spellings
    // ("Nhlanhla Mkhwanazi", "Mkhwanazi", "Lt Gen Mkhwanazi"). We resolve
    // each spelling to a Person row, then collapse the response by
    // person_id so the caller gets one entry per distinct human with
    // every observed spelling attached.
    const accumulator = new Map<string, IngestedPersonDto & { _seen: Set<string> }>();

    for (const entity of entities.people) {
      const name = entity.name.trim();
      if (!name) continue;

      const { person, wasCreated } = await this.findOrCreatePerson(
        name,
        personRepo,
      );

      let entry = accumulator.get(person.id);
      if (!entry) {
        // `story_people` has a (story_id, person_id) unique index — only
        // the first spelling of each person triggers a link check.
        const existingLink = await storyPersonRepo.findOne({
          where: { story_id: storyId, person_id: person.id },
        });
        let wasLinked = false;
        if (!existingLink) {
          const link = storyPersonRepo.create({
            story_id: storyId,
            person_id: person.id,
            role_in_story: DEFAULT_ROLE_IN_STORY,
            is_key_figure: false,
          });
          await storyPersonRepo.save(link);
          wasLinked = true;
        }

        entry = {
          person_id: person.id,
          full_name: person.full_name,
          seen_as: [],
          was_created: wasCreated,
          was_linked_to_story: wasLinked,
          _seen: new Set<string>(),
        };
        accumulator.set(person.id, entry);
      }

      if (!entry._seen.has(name.toLowerCase())) {
        entry._seen.add(name.toLowerCase());
        entry.seen_as.push(name);
      }
    }

    return Array.from(accumulator.values()).map(({ _seen: _discard, ...rest }) => {
      void _discard;
      return rest;
    });
  }

  /**
   * Resolve a NER-extracted name to a Person row.
   *
   * Tried in order:
   *   1. Exact case-insensitive match on `full_name`.
   *   2. Honorific-stripped variant ("Lt Gen Nhlanhla Mkhwanazi" →
   *      "Nhlanhla Mkhwanazi") against `full_name`.
   *   3. The raw name against the `aliases` array.
   *   4. The honorific-stripped variant against the `aliases` array.
   *
   * If nothing matches, create the profile with status=UNKNOWN so an
   * editor can review and enrich it later.
   */
  private async findOrCreatePerson(
    name: string,
    personRepo: Repository<Person>,
  ): Promise<{ person: Person; wasCreated: boolean }> {
    const canonical = stripHonorifics(name);

    const byName = await personRepo
      .createQueryBuilder('p')
      .where('LOWER(p.full_name) = LOWER(:name)', { name })
      .getOne();
    if (byName) return { person: byName, wasCreated: false };

    if (canonical !== name) {
      const byCanonical = await personRepo
        .createQueryBuilder('p')
        .where('LOWER(p.full_name) = LOWER(:name)', { name: canonical })
        .getOne();
      if (byCanonical) return { person: byCanonical, wasCreated: false };
    }

    // Arrays will get a GIN index in a later migration; a linear scan is
    // fine at current volumes.
    const byAlias = await personRepo
      .createQueryBuilder('p')
      .where(':name ILIKE ANY (p.aliases)', { name })
      .getOne();
    if (byAlias) return { person: byAlias, wasCreated: false };

    if (canonical !== name) {
      const byCanonicalAlias = await personRepo
        .createQueryBuilder('p')
        .where(':name ILIKE ANY (p.aliases)', { name: canonical })
        .getOne();
      if (byCanonicalAlias) return { person: byCanonicalAlias, wasCreated: false };
    }

    const created = personRepo.create({
      full_name: canonical,
      // Preserve the honorific'd spelling as an alias so re-ingest of the
      // same string short-circuits through path (3) above.
      aliases: canonical !== name ? [name] : [],
      current_role: null,
      organisation: null,
      status: PersonStatus.UNKNOWN,
      profile_summary: null,
    });
    const saved = await personRepo.save(created);
    return { person: saved, wasCreated: true };
  }

  /**
   * When requested and the story has no cached plain-English summary, call
   * Claude to generate one. We only ever *populate* an empty value from
   * ingest — never overwrite an editor's work. Overwrite is reserved for
   * the explicit backfill endpoint on `/simplify/law-section/:id`.
   */
  private async maybeSimplifyStorySummary(
    dto: IngestArticleDto,
    decision: IngestionStoryDecisionDto,
    storyRepo: Repository<Story>,
    warnings: string[],
  ): Promise<SimplifyResult | null> {
    if (!dto.simplify_summary) return null;

    const story = await storyRepo.findOne({ where: { id: decision.story_id } });
    if (!story) return null;

    if (story.plain_english_summary && story.plain_english_summary.trim()) {
      warnings.push('simplify_skipped: story already has plain_english_summary');
      return null;
    }

    try {
      const result = await this.intelligence.simplify(
        dto.content_snippet,
        'child',
      );
      story.plain_english_summary = result.simplified;
      await storyRepo.save(story);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warnings.push(`simplify_failed: ${message}`);
      return null;
    }
  }
}

/**
 * Strip a leading honorific from a NER-extracted name. Idempotent. Trims
 * trailing / leading whitespace. Returns the original if no honorific is
 * found or if stripping would leave an empty string (defensive).
 */
function stripHonorifics(name: string): string {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  for (const honorific of HONORIFICS) {
    if (
      lower.startsWith(`${honorific} `) ||
      lower.startsWith(`${honorific}. `) ||
      lower === honorific
    ) {
      const prefixLen = lower[honorific.length] === '.'
        ? honorific.length + 2
        : honorific.length + 1;
      const rest = trimmed.slice(prefixLen).trim();
      return rest.length > 0 ? rest : trimmed;
    }
  }
  return trimmed;
}
