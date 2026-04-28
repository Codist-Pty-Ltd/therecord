import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdhocCommittee } from '../entities/adhoc_committee.entity';
import { AdhocCommitteeLawSection } from '../entities/adhoc_committee_law_section.entity';
import { Commission } from '../entities/commission.entity';
import { CommissionLawSection } from '../entities/commission_law_section.entity';
import { ConstitutionSection } from '../entities/constitution_section.entity';
import { EventLegalReference } from '../entities/event_legal_reference.entity';
import { LawSection } from '../entities/law_section.entity';
import { Law } from '../entities/law.entity';
import { SiuProclamationLawSection } from '../entities/siu_proclamation_law_section.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import {
  AdhocCommitteeUsingLawSectionDto,
  CommissionUsingLawSectionDto,
  ConstitutionSectionDetailResponseDto,
  ConstitutionSectionResponseDto,
  LawResponseDto,
  LawSectionDetailResponseDto,
  LawSectionResponseDto,
  LawWithSectionsResponseDto,
  SiuProclamationBriefForLawDto,
  SiuProclamationUsingLawSectionDto,
  StoryReferencingLawSectionDto,
} from './dto/legal-response.dto';

@Injectable()
export class LegalService {
  constructor(
    @InjectRepository(Law) private readonly lawRepo: Repository<Law>,
    @InjectRepository(LawSection)
    private readonly lawSectionRepo: Repository<LawSection>,
    @InjectRepository(ConstitutionSection)
    private readonly constitutionRepo: Repository<ConstitutionSection>,
    @InjectRepository(CommissionLawSection)
    private readonly commissionLawSectionRepo: Repository<CommissionLawSection>,
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
    @InjectRepository(AdhocCommitteeLawSection)
    private readonly adhocCommitteeLawSectionRepo: Repository<AdhocCommitteeLawSection>,
    @InjectRepository(AdhocCommittee)
    private readonly adhocCommitteeRepo: Repository<AdhocCommittee>,
    @InjectRepository(EventLegalReference)
    private readonly eventLegalRefRepo: Repository<EventLegalReference>,
    @InjectRepository(TimelineEvent)
    private readonly timelineEventRepo: Repository<TimelineEvent>,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    @InjectRepository(SiuProclamationLawSection)
    private readonly siuProclamationLawSectionRepo: Repository<SiuProclamationLawSection>,
  ) {}

  /* ----------------------------------------------------------------- laws */

  async findAllLaws(): Promise<LawResponseDto[]> {
    const laws = await this.lawRepo.find({
      order: { category: 'ASC', short_name: 'ASC' },
    });
    return laws.map((l) => this.mapLaw(l));
  }

  async findLawById(id: string): Promise<LawWithSectionsResponseDto> {
    const law = await this.lawRepo.findOne({ where: { id } });
    if (!law) {
      throw new NotFoundException(`Law ${id} not found.`);
    }

    const sections = await this.lawSectionRepo.find({
      where: { law_id: id },
      order: { section_number: 'ASC' },
    });

    return {
      ...this.mapLaw(law),
      sections: sections.map((s) => this.mapLawSection(s)),
    };
  }

  /**
   * Section detail + reverse cross-links.
   *
   * Validates the `law_id` is the section's actual parent so that callers
   * can't fabricate URLs that pair an unrelated law with a real section.
   * The four parallel queries are bounded — `Promise.all` is safe here
   * because none of them depend on each other's output.
   *
   * `siu_proclamations[]` is populated from `siu_proclamation_law_sections`.
   */
  async findLawSectionById(
    lawId: string,
    sectionId: string,
  ): Promise<LawSectionDetailResponseDto> {
    const section = await this.lawSectionRepo.findOne({
      where: { id: sectionId },
    });
    if (!section || section.law_id !== lawId) {
      throw new NotFoundException(
        `Law section ${sectionId} not found under law ${lawId}.`,
      );
    }

    const law = await this.lawRepo.findOne({ where: { id: lawId } });
    if (!law) {
      // Defensive — a section with `law_id = X` but no row at X means
      // the FK was broken outside an ORM transaction. 404 is the right
      // user-facing response.
      throw new NotFoundException(`Law ${lawId} not found.`);
    }

    const [commissions, adhocCommittees, stories, siuProclamations] =
      await Promise.all([
        this.loadCommissionsUsingSection(sectionId),
        this.loadAdhocCommitteesUsingSection(sectionId),
        this.loadStoriesReferencingSection(sectionId),
        this.loadSiuProclamationsForLawSection(sectionId),
      ]);

    return {
      ...this.mapLawSection(section),
      law: this.mapLaw(law),
      commissions,
      adhoc_committees: adhocCommittees,
      stories,
      siu_proclamations: siuProclamations,
    };
  }

  /* ------------------------------------------------- reverse cross-links */

  private async loadCommissionsUsingSection(
    sectionId: string,
  ): Promise<CommissionUsingLawSectionDto[]> {
    const links = await this.commissionLawSectionRepo.find({
      where: { law_section_id: sectionId },
    });
    if (links.length === 0) return [];

    const commissionIds = Array.from(new Set(links.map((l) => l.commission_id)));
    const commissions = await this.commissionRepo.find({
      where: { id: In(commissionIds) },
    });
    const byId = new Map(commissions.map((c) => [c.id, c]));

    // A commission can relate to a section in multiple capacities — surface
    // every (commission, usage_type) pairing so the UI can render distinct
    // chips for "enabling" vs "investigated", etc.
    return links
      .map((link): CommissionUsingLawSectionDto | null => {
        const c = byId.get(link.commission_id);
        if (!c) return null;
        return {
          id: c.id,
          popular_name: c.popular_name,
          slug: c.slug,
          domain: c.domain,
          status: c.status,
          chair_name: c.chair_name ?? null,
          announced_date: c.announced_date,
          concluded_date: c.concluded_date,
          era_year: pickEraYear([
            c.announced_date,
            c.hearings_started,
            c.report_released_date,
            c.concluded_date,
          ]),
          usage_type: link.usage_type,
        };
      })
      .filter((row): row is CommissionUsingLawSectionDto => row !== null)
      .sort((a, b) => a.popular_name.localeCompare(b.popular_name));
  }

  private async loadAdhocCommitteesUsingSection(
    sectionId: string,
  ): Promise<AdhocCommitteeUsingLawSectionDto[]> {
    const links = await this.adhocCommitteeLawSectionRepo.find({
      where: { law_section_id: sectionId },
    });
    if (links.length === 0) return [];

    const committeeIds = Array.from(
      new Set(links.map((l) => l.adhoc_committee_id)),
    );
    const committees = await this.adhocCommitteeRepo.find({
      where: { id: In(committeeIds) },
    });
    const byId = new Map(committees.map((c) => [c.id, c]));

    return links
      .map((link): AdhocCommitteeUsingLawSectionDto | null => {
        const c = byId.get(link.adhoc_committee_id);
        if (!c) return null;
        return {
          id: c.id,
          popular_name: c.popular_name,
          slug: c.slug,
          category: c.category,
          status: c.status,
          parliament_term: c.parliament_term,
          parliament_years: c.parliament_years,
          announced_date: c.announced_date,
          concluded_date: c.concluded_date,
          era_year: pickEraYear([
            c.announced_date,
            c.first_meeting_date,
            c.report_adopted_date,
            c.concluded_date,
          ]),
          usage_type: link.usage_type,
        };
      })
      .filter((row): row is AdhocCommitteeUsingLawSectionDto => row !== null)
      .sort((a, b) => a.popular_name.localeCompare(b.popular_name));
  }

  private async loadStoriesReferencingSection(
    sectionId: string,
  ): Promise<StoryReferencingLawSectionDto[]> {
    // 1. Every event that cites this section.
    const refs = await this.eventLegalRefRepo.find({
      where: { law_section_id: sectionId },
    });
    if (refs.length === 0) return [];

    const eventIds = Array.from(new Set(refs.map((r) => r.event_id)));

    // 2. Resolve those events to their parent stories + dates.
    const events = await this.timelineEventRepo.find({
      where: { id: In(eventIds) },
      select: ['id', 'story_id', 'event_date'],
    });
    if (events.length === 0) return [];

    // 3. Aggregate per story: event_count, latest_event_date, alleged_violation.
    const refByEventId = new Map(refs.map((r) => [r.event_id, r]));

    interface StoryAggregate {
      event_count: number;
      latest_event_date: string | null;
      alleged_violation: boolean;
    }
    const aggByStory = new Map<string, StoryAggregate>();

    for (const ev of events) {
      const ref = refByEventId.get(ev.id);
      const existing = aggByStory.get(ev.story_id) ?? {
        event_count: 0,
        latest_event_date: null,
        alleged_violation: false,
      };
      existing.event_count += 1;
      if (
        ev.event_date &&
        (!existing.latest_event_date ||
          ev.event_date > existing.latest_event_date)
      ) {
        existing.latest_event_date = ev.event_date;
      }
      if (ref?.alleged_violation) {
        existing.alleged_violation = true;
      }
      aggByStory.set(ev.story_id, existing);
    }

    const storyIds = Array.from(aggByStory.keys());
    if (storyIds.length === 0) return [];

    const stories = await this.storyRepo.find({
      where: { id: In(storyIds) },
    });

    return stories
      .map((s): StoryReferencingLawSectionDto | null => {
        const agg = aggByStory.get(s.id);
        if (!agg) return null;
        return {
          id: s.id,
          title: s.title,
          slug: s.slug,
          domain: s.domain,
          status: s.status,
          summary: s.summary,
          latest_event_date: agg.latest_event_date,
          event_count: agg.event_count,
          alleged_violation: agg.alleged_violation,
        };
      })
      .filter((row): row is StoryReferencingLawSectionDto => row !== null)
      // Most recently active stories lead — this is the editorial signal
      // readers care about most.
      .sort((a, b) => {
        const aDate = a.latest_event_date ?? '';
        const bDate = b.latest_event_date ?? '';
        if (aDate !== bDate) return bDate.localeCompare(aDate);
        return a.title.localeCompare(b.title);
      });
  }

  private async loadSiuProclamationsForLawSection(
    lawSectionId: string,
  ): Promise<SiuProclamationUsingLawSectionDto[]> {
    const links = await this.siuProclamationLawSectionRepo.find({
      where: { law_section_id: lawSectionId },
      relations: ['proclamation'],
      order: { created_at: 'ASC' },
    });
    return this.mapSiuProclamationLinks(links);
  }

  private async loadSiuProclamationsForConstitutionSection(
    constitutionSectionId: string,
  ): Promise<SiuProclamationUsingLawSectionDto[]> {
    const links = await this.siuProclamationLawSectionRepo.find({
      where: { constitution_section_id: constitutionSectionId },
      relations: ['proclamation'],
      order: { created_at: 'ASC' },
    });
    return this.mapSiuProclamationLinks(links);
  }

  private mapSiuProclamationLinks(
    links: SiuProclamationLawSection[],
  ): SiuProclamationUsingLawSectionDto[] {
    return links
      .map((link): SiuProclamationUsingLawSectionDto | null => {
        const p = link.proclamation;
        if (!p) return null;
        const proclamation: SiuProclamationBriefForLawDto = {
          id: p.id,
          proclamation_number: p.proclamation_number,
          slug: p.slug,
          title: p.title,
          domain: p.domain,
          status: p.status,
          signed_date: p.signed_date,
        };
        return {
          id: link.id,
          usage_type: link.usage_type,
          relevance: link.relevance,
          proclamation,
        };
      })
      .filter((row): row is SiuProclamationUsingLawSectionDto => row !== null)
      .sort((a, b) => {
        const n = a.proclamation.proclamation_number.localeCompare(
          b.proclamation.proclamation_number,
        );
        if (n !== 0) return n;
        return a.proclamation.title.localeCompare(b.proclamation.title);
      });
  }

  private async loadStoriesReferencingConstitutionSection(
    constitutionSectionId: string,
  ): Promise<StoryReferencingLawSectionDto[]> {
    const refs = await this.eventLegalRefRepo.find({
      where: { constitution_section_id: constitutionSectionId },
    });
    if (refs.length === 0) return [];

    const eventIds = Array.from(new Set(refs.map((r) => r.event_id)));
    const events = await this.timelineEventRepo.find({
      where: { id: In(eventIds) },
      select: ['id', 'story_id', 'event_date'],
    });
    if (events.length === 0) return [];

    const refByEventId = new Map(refs.map((r) => [r.event_id, r]));

    interface StoryAggregate {
      event_count: number;
      latest_event_date: string | null;
      alleged_violation: boolean;
    }
    const aggByStory = new Map<string, StoryAggregate>();

    for (const ev of events) {
      const ref = refByEventId.get(ev.id);
      const existing = aggByStory.get(ev.story_id) ?? {
        event_count: 0,
        latest_event_date: null,
        alleged_violation: false,
      };
      existing.event_count += 1;
      if (
        ev.event_date &&
        (!existing.latest_event_date ||
          ev.event_date > existing.latest_event_date)
      ) {
        existing.latest_event_date = ev.event_date;
      }
      if (ref?.alleged_violation) {
        existing.alleged_violation = true;
      }
      aggByStory.set(ev.story_id, existing);
    }

    const storyIds = Array.from(aggByStory.keys());
    if (storyIds.length === 0) return [];

    const stories = await this.storyRepo.find({
      where: { id: In(storyIds) },
    });

    return stories
      .map((s): StoryReferencingLawSectionDto | null => {
        const agg = aggByStory.get(s.id);
        if (!agg) return null;
        return {
          id: s.id,
          title: s.title,
          slug: s.slug,
          domain: s.domain,
          status: s.status,
          summary: s.summary,
          latest_event_date: agg.latest_event_date,
          event_count: agg.event_count,
          alleged_violation: agg.alleged_violation,
        };
      })
      .filter((row): row is StoryReferencingLawSectionDto => row !== null)
      .sort((a, b) => {
        const aDate = a.latest_event_date ?? '';
        const bDate = b.latest_event_date ?? '';
        if (aDate !== bDate) return bDate.localeCompare(aDate);
        return a.title.localeCompare(b.title);
      });
  }

  /* --------------------------------------------------------- constitution */

  async findAllConstitutionSections(): Promise<ConstitutionSectionResponseDto[]> {
    const sections = await this.constitutionRepo.find({
      order: { section_number: 'ASC' },
    });
    return sections.map((s) => this.mapConstitutionSection(s));
  }

  async findConstitutionSectionByNumber(
    sectionNumber: number,
  ): Promise<ConstitutionSectionResponseDto> {
    const section = await this.constitutionRepo.findOne({
      where: { section_number: sectionNumber },
    });
    if (!section) {
      throw new NotFoundException(`Constitution section ${sectionNumber} not found.`);
    }
    return this.mapConstitutionSection(section);
  }

  /**
   * Constitution section detail + the same cross-link shape as
   * {@link findLawSectionById}. There are no commission/adhoc join tables
   * for constitutional sections — those arrays are always empty; SIU and
   * story links are populated.
   */
  async findConstitutionSectionDetailByNumber(
    sectionNumber: number,
  ): Promise<ConstitutionSectionDetailResponseDto> {
    const section = await this.constitutionRepo.findOne({
      where: { section_number: sectionNumber },
    });
    if (!section) {
      throw new NotFoundException(`Constitution section ${sectionNumber} not found.`);
    }

    const [stories, siu] = await Promise.all([
      this.loadStoriesReferencingConstitutionSection(section.id),
      this.loadSiuProclamationsForConstitutionSection(section.id),
    ]);

    return {
      ...this.mapConstitutionSection(section),
      commissions: [],
      adhoc_committees: [],
      stories,
      siu_proclamations: siu,
    };
  }

  /* -------------------------------------------------------------- mappers */

  private mapLaw(l: Law): LawResponseDto {
    return {
      id: l.id,
      name: l.name,
      short_name: l.short_name,
      act_number: l.act_number,
      category: l.category,
      plain_english: l.plain_english,
      full_text_url: l.full_text_url,
    };
  }

  private mapLawSection(s: LawSection): LawSectionResponseDto {
    return {
      id: s.id,
      law_id: s.law_id,
      section_number: s.section_number,
      section_title: s.section_title,
      plain_english: s.plain_english,
      full_text: s.full_text,
    };
  }

  private mapConstitutionSection(
    s: ConstitutionSection,
  ): ConstitutionSectionResponseDto {
    return {
      id: s.id,
      chapter_number: s.chapter_number,
      section_number: s.section_number,
      section_title: s.section_title,
      plain_english: s.plain_english,
      full_text: s.full_text,
    };
  }
}

/**
 * Pick the most editorially representative year from a list of ISO date
 * candidates (announced → started → reported → concluded). Returns null
 * when every candidate is missing or unparseable.
 */
function pickEraYear(candidates: Array<string | null | undefined>): string | null {
  for (const c of candidates) {
    if (!c) continue;
    const m = c.match(/^(\d{4})/);
    if (m) return m[1];
  }
  return null;
}
