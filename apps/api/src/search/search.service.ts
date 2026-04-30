import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AdhocCommittee } from '../entities/adhoc_committee.entity';
import { Commission } from '../entities/commission.entity';
import { Law } from '../entities/law.entity';
import { LawSection } from '../entities/law_section.entity';
import { Municipality } from '../entities/municipality.entity';
import { Person } from '../entities/person.entity';
import { Province } from '../entities/province.entity';
import { SiuProclamation } from '../entities/siu_proclamation.entity';
import { Story } from '../entities/story.entity';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseDto, SearchResultDto } from './dto/search-result.dto';

/** Max rows fetched per entity type so one domain cannot dominate the blend. */
const PER_TYPE_LIMIT = 5;

const ALL_TYPE_KEYS = [
  'stories',
  'people',
  'commissions',
  'committees',
  'siu',
  'laws',
  'law_sections',
  'province',
  'municipality',
] as const;

type TypeKey = (typeof ALL_TYPE_KEYS)[number];

interface InternalHit {
  result: SearchResultDto;
  sortAt: number;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    @InjectRepository(Person) private readonly personRepo: Repository<Person>,
    @InjectRepository(Commission) private readonly commissionRepo: Repository<Commission>,
    @InjectRepository(AdhocCommittee) private readonly adhocRepo: Repository<AdhocCommittee>,
    @InjectRepository(SiuProclamation) private readonly siuRepo: Repository<SiuProclamation>,
    @InjectRepository(Law) private readonly lawRepo: Repository<Law>,
    @InjectRepository(LawSection) private readonly lawSectionRepo: Repository<LawSection>,
    @InjectRepository(Province) private readonly provinceRepo: Repository<Province>,
    @InjectRepository(Municipality) private readonly municipalityRepo: Repository<Municipality>,
  ) {}

  async search(dto: SearchQueryDto): Promise<SearchResponseDto> {
    const q = dto.q;
    const pat = this.likeParam(q);
    const activeTypes = this.parseTypes(dto.types);
    const limit = Math.min(30, Math.max(1, dto.limit != null ? dto.limit : 10));
    const page = Math.max(1, dto.page != null ? dto.page : 1);

    const tasks: Promise<InternalHit[]>[] = [];

    if (activeTypes.has('stories')) {
      tasks.push(this.searchStories(pat));
    }
    if (activeTypes.has('people')) {
      tasks.push(this.searchPeople(pat));
    }
    if (activeTypes.has('commissions')) {
      tasks.push(this.searchCommissions(pat));
    }
    if (activeTypes.has('committees')) {
      tasks.push(this.searchCommittees(pat));
    }
    if (activeTypes.has('siu')) {
      tasks.push(this.searchSiu(pat));
    }
    if (activeTypes.has('laws')) {
      tasks.push(this.searchLaws(pat));
    }
    if (activeTypes.has('law_sections')) {
      tasks.push(this.searchLawSections(pat));
    }
    if (activeTypes.has('province')) {
      tasks.push(this.searchProvinces(pat));
    }
    if (activeTypes.has('municipality')) {
      tasks.push(this.searchMunicipalities(pat));
    }

    const chunks = await Promise.all(tasks);
    const merged = chunks.flat();

    merged.sort((a, b) => {
      if (b.sortAt !== a.sortAt) return b.sortAt - a.sortAt;
      return a.result.name.localeCompare(b.result.name);
    });

    const total = merged.length;
    const offset = (page - 1) * limit;
    const pageRows = merged.slice(offset, offset + limit).map((h) => h.result);

    return {
      query: q,
      total,
      results: pageRows,
    };
  }

  private parseTypes(raw: string | undefined): Set<TypeKey> {
    if (raw == null || raw.trim() === '') {
      return new Set(ALL_TYPE_KEYS);
    }
    const set = new Set<TypeKey>();
    for (const part of raw.split(',')) {
      const t = part.trim().toLowerCase() as TypeKey;
      if (ALL_TYPE_KEYS.includes(t)) {
        set.add(t);
      }
    }
    return set.size > 0 ? set : new Set(ALL_TYPE_KEYS);
  }

  /**
   * Builds a LIKE pattern: trim, strip LIKE metacharacters for safety, wrap in %.
   */
  private likeParam(q: string): string {
    const safe = q.trim().replace(/[%_\\]/g, '');
    return `%${safe}%`;
  }

  private async searchStories(pat: string): Promise<InternalHit[]> {
    const rows = await this.storyRepo
      .createQueryBuilder('s')
      .select([
        's.id',
        's.title',
        's.slug',
        's.status',
        's.domain',
        's.plain_english_summary',
        's.updated_at',
      ])
      .where('(s.title ILIKE :pat OR s.plain_english_summary ILIKE :pat)', { pat })
      .orderBy('s.updated_at', 'DESC')
      .take(PER_TYPE_LIMIT)
      .getMany();

    return rows.map((s) => ({
      sortAt: s.updated_at.getTime(),
      result: {
        type: 'story' as const,
        id: s.id,
        name: s.title,
        subtitle: String(s.domain).replace(/_/g, ' '),
        slug: s.slug,
        status: String(s.status),
        domain: String(s.domain),
        url: `/story/${s.slug}`,
        plain_english: this.oneLine(s.plain_english_summary),
      },
    }));
  }

  private async searchPeople(pat: string): Promise<InternalHit[]> {
    const rows = await this.personRepo
      .createQueryBuilder('p')
      .select([
        'p.id',
        'p.full_name',
        'p.current_role',
        'p.organisation',
        'p.status',
        'p.updated_at',
      ])
      .where(
        '(p.full_name ILIKE :pat OR p.current_role ILIKE :pat OR p.aliases::text ILIKE :pat)',
        { pat },
      )
      .orderBy('p.updated_at', 'DESC')
      .take(PER_TYPE_LIMIT)
      .getMany();

    return rows.map((p) => {
      const subtitle = [p.current_role, p.organisation].filter(Boolean).join(' · ') || 'Person';
      return {
        sortAt: p.updated_at.getTime(),
        result: {
          type: 'person' as const,
          id: p.id,
          name: p.full_name,
          subtitle,
          status: String(p.status),
          url: `/person/${p.id}`,
        },
      };
    });
  }

  private async searchCommissions(pat: string): Promise<InternalHit[]> {
    const rows = await this.commissionRepo
      .createQueryBuilder('c')
      .select([
        'c.id',
        'c.popular_name',
        'c.slug',
        'c.chair_name',
        'c.status',
        'c.domain',
        'c.announced_date',
        'c.reason_summary',
        'c.updated_at',
      ])
      .where(
        '(c.popular_name ILIKE :pat OR c.full_name ILIKE :pat OR c.chair_name ILIKE :pat OR c.reason_summary ILIKE :pat)',
        { pat },
      )
      .orderBy('c.updated_at', 'DESC')
      .take(PER_TYPE_LIMIT)
      .getMany();

    return rows.map((c) => ({
      sortAt: c.updated_at.getTime(),
      result: {
        type: 'commission' as const,
        id: c.id,
        name: c.popular_name,
        subtitle: [c.chair_name, String(c.domain).replace(/_/g, ' ')].filter(Boolean).join(' · '),
        slug: c.slug,
        status: String(c.status),
        domain: String(c.domain),
        url: `/commissions/${c.slug}`,
        plain_english: this.oneLine(c.reason_summary),
      },
    }));
  }

  private async searchCommittees(pat: string): Promise<InternalHit[]> {
    const rows = await this.adhocRepo
      .createQueryBuilder('a')
      .select([
        'a.id',
        'a.popular_name',
        'a.slug',
        'a.category',
        'a.status',
        'a.parliament_term',
        'a.mandate_summary',
        'a.updated_at',
      ])
      .where(
        '(a.popular_name ILIKE :pat OR a.full_name ILIKE :pat OR a.mandate_summary ILIKE :pat)',
        { pat },
      )
      .orderBy('a.updated_at', 'DESC')
      .take(PER_TYPE_LIMIT)
      .getMany();

    return rows.map((a) => ({
      sortAt: a.updated_at.getTime(),
      result: {
        type: 'committee' as const,
        id: a.id,
        name: a.popular_name,
        subtitle: [String(a.category).replace(/_/g, ' '), a.parliament_term ?? ''].filter(Boolean).join(' · '),
        slug: a.slug,
        status: String(a.status),
        url: `/adhoc-committees/${a.slug}`,
        plain_english: this.oneLine(a.mandate_summary),
      },
    }));
  }

  private async searchSiu(pat: string): Promise<InternalHit[]> {
    const rows = await this.siuRepo
      .createQueryBuilder('sp')
      .select([
        'sp.id',
        'sp.proclamation_number',
        'sp.slug',
        'sp.title',
        'sp.status',
        'sp.domain',
        'sp.investigation_scope',
        'sp.plain_english_summary',
        'sp.updated_at',
      ])
      .where(
        '(sp.title ILIKE :pat OR sp.proclamation_number ILIKE :pat OR sp.investigation_scope ILIKE :pat)',
        { pat },
      )
      .orderBy('sp.updated_at', 'DESC')
      .take(PER_TYPE_LIMIT)
      .getMany();

    return rows.map((sp) => ({
      sortAt: sp.updated_at.getTime(),
      result: {
        type: 'siu' as const,
        id: sp.id,
        name: sp.title,
        subtitle: [sp.proclamation_number, String(sp.domain).replace(/_/g, ' ')].join(' · '),
        slug: sp.slug,
        status: String(sp.status),
        domain: String(sp.domain),
        url: `/siu/proclamations/${sp.slug}`,
        plain_english: this.oneLine(sp.plain_english_summary),
      },
    }));
  }

  private async searchLaws(pat: string): Promise<InternalHit[]> {
    const rows = await this.lawRepo
      .createQueryBuilder('l')
      .select(['l.id', 'l.name', 'l.short_name', 'l.act_number', 'l.category', 'l.plain_english'])
      .where(
        '(l.name ILIKE :pat OR l.short_name ILIKE :pat OR l.plain_english ILIKE :pat OR l.act_number ILIKE :pat)',
        { pat },
      )
      .orderBy('l.short_name', 'ASC')
      .take(PER_TYPE_LIMIT)
      .getMany();

    return rows.map((l) => ({
      sortAt: 0,
      result: {
        type: 'law' as const,
        id: l.id,
        name: l.name,
        subtitle: `${l.short_name} · ${l.act_number}`,
        url: `/laws#${l.id}`,
        plain_english: this.oneLine(l.plain_english),
      },
    }));
  }

  private async searchLawSections(pat: string): Promise<InternalHit[]> {
    const rows = await this.lawSectionRepo
      .createQueryBuilder('ls')
      .innerJoinAndSelect('ls.law', 'law')
      .where(
        '(ls.section_title ILIKE :pat OR ls.plain_english ILIKE :pat OR ls.section_number ILIKE :pat)',
        { pat },
      )
      .orderBy('law.short_name', 'ASC')
      .addOrderBy('ls.section_number', 'ASC')
      .take(PER_TYPE_LIMIT)
      .getMany();

    return rows.map((ls) => {
      const law = ls.law;
      const lawName = law?.short_name ?? law?.name ?? 'Statute';
      return {
        sortAt: 0,
        result: {
          type: 'law_section' as const,
          id: ls.id,
          name: `${lawName} — ${ls.section_number} ${ls.section_title}`.trim(),
          subtitle: lawName,
          url: `/laws/${law?.id ?? ls.law_id}/${ls.id}`,
          plain_english: this.oneLine(ls.plain_english),
        },
      };
    });
  }

  private async searchProvinces(pat: string): Promise<InternalHit[]> {
    const rows = await this.provinceRepo
      .createQueryBuilder('pr')
      .where('(pr.name ILIKE :pat OR pr.abbreviation ILIKE :pat)', { pat })
      .orderBy('pr.name', 'ASC')
      .take(PER_TYPE_LIMIT)
      .getMany();

    return rows.map((pr) => ({
      sortAt: pr.created_at.getTime(),
      result: {
        type: 'province' as const,
        id: pr.id,
        name: pr.name,
        subtitle: [pr.abbreviation, pr.capital].filter(Boolean).join(' · ') || 'Province',
        slug: pr.slug,
        url: `/province/${pr.slug}`,
      },
    }));
  }

  private async searchMunicipalities(pat: string): Promise<InternalHit[]> {
    const rows = await this.municipalityRepo
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.province', 'p')
      .where('(m.name ILIKE :pat OR m.short_name ILIKE :pat)', { pat })
      .orderBy('m.name', 'ASC')
      .take(PER_TYPE_LIMIT)
      .getMany();

    return rows.map((m) => ({
      sortAt: m.updated_at.getTime(),
      result: {
        type: 'municipality' as const,
        id: m.id,
        name: m.name,
        subtitle: [m.short_name, m.province?.name].filter(Boolean).join(' · ') || 'Municipality',
        slug: m.slug,
        url: `/municipality/${m.slug}`,
      },
    }));
  }

  private oneLine(text: string | null | undefined, max = 200): string | undefined {
    if (text == null || text === '') return undefined;
    const t = text.replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1)}…`;
  }
}
