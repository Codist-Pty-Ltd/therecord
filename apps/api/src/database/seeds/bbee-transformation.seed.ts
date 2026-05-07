/* eslint-disable no-console */

/**
 * B-BBEE transformation policy + story thread.
 * Depends: impact-sectors, cape-town (malusi-booi), new-stories-2026 (tembisa), commissions/siu (Ramaphosa person).
 *
 *   npm run build && npm run seed:bbee
 *   or via `npm run seed:all`
 */

import 'reflect-metadata';

import { IsNull, type EntityManager } from 'typeorm';

import { ConstitutionSection } from '../../entities/constitution_section.entity';
import { EventLegalReference } from '../../entities/event_legal_reference.entity';
import { ImpactSector } from '../../entities/impact-sector.entity';
import { Law, LawCategory } from '../../entities/law.entity';
import { LawSection } from '../../entities/law_section.entity';
import { Person, PersonStatus } from '../../entities/person.entity';
import { SimilarityReason } from '../../entities/similar-story.entity';
import {
  Story,
  StoryCategory,
  StoryDomain,
  StoryStatus,
} from '../../entities/story.entity';
import { StoryImpactSector, ImpactSeverity } from '../../entities/story-impact-sector.entity';
import { StoryPerson } from '../../entities/story_person.entity';
import {
  EventSignificance,
  EventType,
  TimelineEvent,
} from '../../entities/timeline_event.entity';
import {
  TransformationPolicy,
  TransformationPolicyStatus,
} from '../../entities/transformation-policy.entity';
import { AppDataSource } from '../data-source';
import { upsertSimilarPair } from './cape-town-stories.seed';
import {
  BBEE_ARGUMENTS_AGAINST,
  BBEE_ARGUMENTS_FOR,
  BBEE_CURRENT_LEGAL,
  BBEE_HISTORICAL_CONTEXT,
  BBEE_IMPACT_ORDINARY,
  BBEE_PLAIN_CHILD,
  BBEE_PLAIN_LAY,
  BBEE_PLAIN_LEGAL,
  BBEE_PURPOSE_SUMMARY,
  BBEE_STORY_SUMMARY,
} from './bbee-transformation.seed-data';

const POLICY_SLUG = 'broad-based-black-economic-empowerment';
const STORY_SLUG = 'bbee-transformation-south-africa';
const TEMBISA_SLUG = 'tembisa-hospital-r2bn-corruption';
const MALUSI_SLUG = 'malusi-booi-housing-tender-fraud-2023';

type EventLegalLink =
  | {
      kind: 'law';
      law_short_name: string;
      section_number: string;
      relevance: string;
      alleged_violation: boolean;
    }
  | {
      kind: 'constitution';
      section_number: number;
      relevance: string;
      alleged_violation: boolean;
    };

interface TimelineSeedRow {
  event_date: string;
  event_type: EventType;
  title: string;
  description: string;
  plain_english: string;
  significance: EventSignificance;
  legal_links: EventLegalLink[];
}

async function requireImpactSectors(
  m: EntityManager,
  slugs: string[],
): Promise<Map<string, ImpactSector>> {
  const repo = m.getRepository(ImpactSector);
  const map = new Map<string, ImpactSector>();
  for (const slug of slugs) {
    const row = await repo.findOne({ where: { slug } });
    if (!row) {
      throw new Error(
        `bbee-transformation: impact sector "${slug}" missing — run impact-sectors seed first`,
      );
    }
    map.set(slug, row);
  }
  return map;
}

async function ensureConstitutionSection9(m: EntityManager): Promise<void> {
  const repo = m.getRepository(ConstitutionSection);
  const payload = {
    chapter_number: 2,
    section_number: 9,
    section_title: 'Section 9 — Equality (including subsection (2) affirmative action)',
    plain_english:
      'The Constitution says everyone is equal before the law. Subsection (2) also allows laws and measures that protect and advance people disadvantaged by unfair discrimination — so equality can become real in society, not only on paper. That head of powers is central to legislation such as B-BBEE.',
    full_text: null as string | null,
  };
  let row = await repo.findOne({ where: { section_number: 9 } });
  if (!row) {
    row = repo.create(payload);
    await repo.save(row);
    console.log('  + Constitution section 9 (equality / remedial measures)');
  } else {
    Object.assign(row, payload);
    await repo.save(row);
    console.log('  · Constitution section 9 updated');
  }
}

async function ensureBbeeLaws(m: EntityManager): Promise<void> {
  const lawRepo = m.getRepository(Law);
  const secRepo = m.getRepository(LawSection);

  const laws: Array<{
    short_name: string;
    name: string;
    act_number: string;
    category: LawCategory;
    plain_english: string;
    full_text_url: string | null;
    sections: Array<{ section_number: string; section_title: string; plain_english: string }>;
  }> = [
    {
      short_name: 'Employment Equity Act',
      name: 'Employment Equity Act',
      act_number: '55 of 1998',
      category: LawCategory.OTHER,
      plain_english:
        'Bans unfair discrimination at work and requires designated employers to plan for equitable representation — a companion to B-BBEE but focused on employment rather than ownership.',
      full_text_url: 'https://www.gov.za/documents/employment-equity-act',
      sections: [
        {
          section_number: 'Section 1',
          section_title: 'Definitions and interpretation',
          plain_english:
            'Sets out what the Employment Equity Act covers — workplace fairness, designated employers, and the duty to eliminate unfair discrimination.',
        },
      ],
    },
    {
      short_name: 'B-BBEE Act',
      name: 'Broad-Based Black Economic Empowerment Act',
      act_number: '53 of 2003',
      category: LawCategory.OTHER,
      plain_english:
        'Founding statute for broad-based empowerment scorecards, sector codes, and transformation planning for public and private procurement relationships.',
      full_text_url: 'https://www.gov.za/documents/broad-based-black-economic-empowerment-act',
      sections: [
        {
          section_number: 'Section 1',
          section_title: 'Definitions and interpretation',
          plain_english:
            'Defines key terms for B-BBEE and frames the objects of broad-based empowerment under the Act.',
        },
        {
          section_number: 'Section 12',
          section_title: 'Sector codes',
          plain_english:
            'Empowers ministers to publish sector-specific transformation codes — including the Legal Sector Code contested in 2026 litigation.',
        },
      ],
    },
    {
      short_name: 'B-BBEE Amendment Act',
      name: 'Broad-Based Black Economic Empowerment Amendment Act',
      act_number: '46 of 2013',
      category: LawCategory.OTHER,
      plain_english:
        'Introduced fronting as a criminal offence, B-BBEE Commission complaint pathways, and verification-agency registration rules.',
      full_text_url: 'https://www.gov.za/documents/b-bbee-amendment-act',
      sections: [
        {
          section_number: 'Section 26B',
          section_title: 'Offence of fronting',
          plain_english:
            'Criminalises misrepresenting black ownership or undue influence arrangements that defeat genuine empowerment.',
        },
      ],
    },
  ];

  for (const seed of laws) {
    let law = await lawRepo.findOne({ where: { short_name: seed.short_name } });
    if (!law) {
      law = lawRepo.create({
        short_name: seed.short_name,
        name: seed.name,
        act_number: seed.act_number,
        category: seed.category,
        plain_english: seed.plain_english,
        full_text_url: seed.full_text_url,
      });
      law = await lawRepo.save(law);
      console.log(`  + Law: ${seed.short_name}`);
    } else {
      Object.assign(law, {
        name: seed.name,
        act_number: seed.act_number,
        category: seed.category,
        plain_english: seed.plain_english,
        full_text_url: seed.full_text_url ?? law.full_text_url,
      });
      await lawRepo.save(law);
    }

    for (const s of seed.sections) {
      let sec = await secRepo.findOne({
        where: { law_id: law.id, section_number: s.section_number },
      });
      if (!sec) {
        sec = secRepo.create({
          law_id: law.id,
          section_number: s.section_number,
          section_title: s.section_title,
          plain_english: s.plain_english,
          full_text: null,
        });
        await secRepo.save(sec);
        console.log(`  + Law section: ${seed.short_name}::${s.section_number}`);
      } else {
        Object.assign(sec, {
          section_title: s.section_title,
          plain_english: s.plain_english,
        });
        await secRepo.save(sec);
      }
    }
  }
}

async function buildLawSectionMap(m: EntityManager): Promise<Map<string, LawSection>> {
  const sections = await m.getRepository(LawSection).find({ relations: ['law'] });
  const map = new Map<string, LawSection>();
  for (const s of sections) {
    map.set(`${s.law.short_name}::${s.section_number}`, s);
  }
  return map;
}

async function buildConstitutionMap(
  m: EntityManager,
): Promise<Map<number, ConstitutionSection>> {
  const rows = await m.getRepository(ConstitutionSection).find();
  const map = new Map<number, ConstitutionSection>();
  for (const r of rows) {
    map.set(r.section_number, r);
  }
  return map;
}

async function upsertTransformationPolicy(m: EntityManager): Promise<TransformationPolicy> {
  const repo = m.getRepository(TransformationPolicy);
  const payload = {
    name: 'Broad-Based Black Economic Empowerment',
    abbreviation: 'B-BBEE',
    slug: POLICY_SLUG,
    enabling_act:
      'Broad-Based Black Economic Empowerment Act 53 of 2003; B-BBEE Amendment Act 46 of 2013',
    status: TransformationPolicyStatus.CHALLENGED,
    purpose_summary: BBEE_PURPOSE_SUMMARY,
    plain_english_child: BBEE_PLAIN_CHILD,
    plain_english_layperson: BBEE_PLAIN_LAY,
    plain_english_legal: BBEE_PLAIN_LEGAL,
    historical_context: BBEE_HISTORICAL_CONTEXT,
    arguments_for: BBEE_ARGUMENTS_FOR,
    arguments_against: BBEE_ARGUMENTS_AGAINST,
    current_legal_challenges: BBEE_CURRENT_LEGAL,
    impact_on_ordinary_people: BBEE_IMPACT_ORDINARY,
  };

  let row = await repo.findOne({ where: { slug: POLICY_SLUG } });
  if (!row) {
    row = repo.create(payload);
    row = await repo.save(row);
    console.log(`  + Transformation policy: ${POLICY_SLUG}`);
  } else {
    Object.assign(row, payload);
    row = await repo.save(row);
    console.log(`  · Transformation policy: ${POLICY_SLUG}`);
  }
  return row;
}

async function upsertBbeeStory(
  m: EntityManager,
  policyId: string,
  jobsSectorId: string,
): Promise<Story> {
  const repo = m.getRepository(Story);
  const payload = {
    title: "B-BBEE: South Africa's Transformation Law — History, Impact, and Debate",
    slug: STORY_SLUG,
    domain: StoryDomain.POLITICS,
    status: StoryStatus.ACTIVE,
    summary: BBEE_STORY_SUMMARY,
    plain_english_summary: BBEE_PURPOSE_SUMMARY,
    commission_id: null as string | null,
    adhoc_committee_id: null as string | null,
    siu_proclamation_id: null as string | null,
    accountability_body_id: null as string | null,
    primary_impact_sector_id: jobsSectorId,
    state_entity_id: null as string | null,
    province_id: null as string | null,
    municipality_id: null as string | null,
    story_category: StoryCategory.OTHER,
    total_amount_rands: null as string | null,
    transformation_policy_id: policyId,
  };

  let row = await repo.findOne({ where: { slug: STORY_SLUG } });
  if (!row) {
    row = repo.create(payload);
    row = await repo.save(row);
    console.log(`  + Story: ${STORY_SLUG}`);
  } else {
    Object.assign(row, payload);
    row = await repo.save(row);
    console.log(`  · Story: ${STORY_SLUG}`);
  }
  return row;
}

async function linkStoryPersonRow(
  m: EntityManager,
  storyId: string,
  personId: string,
  role_in_story: string,
  is_key_figure: boolean,
): Promise<void> {
  const repo = m.getRepository(StoryPerson);
  let link = await repo.findOne({
    where: { story_id: storyId, person_id: personId },
  });
  const payload = {
    story_id: storyId,
    person_id: personId,
    role_in_story,
    is_key_figure,
  };
  if (!link) {
    link = repo.create(payload);
    await repo.save(link);
  } else {
    Object.assign(link, payload);
    await repo.save(link);
  }
}

async function upsertTimelineRows(
  m: EntityManager,
  storyId: string,
  rows: readonly TimelineSeedRow[],
  lawSections: Map<string, LawSection>,
  constitutionSections: Map<number, ConstitutionSection>,
): Promise<void> {
  const eventRepo = m.getRepository(TimelineEvent);
  const refRepo = m.getRepository(EventLegalReference);

  for (const seed of rows) {
    const payload = {
      story_id: storyId,
      event_date: seed.event_date,
      event_type: seed.event_type,
      title: seed.title,
      description: seed.description,
      plain_english: seed.plain_english,
      significance: seed.significance,
      source_urls: [] as string[],
    };

    let event = await eventRepo.findOne({
      where: {
        story_id: storyId,
        event_date: seed.event_date,
        title: seed.title,
      },
    });

    if (!event) {
      event = eventRepo.create(payload);
      event = await eventRepo.save(event);
    } else {
      Object.assign(event, payload);
      event = await eventRepo.save(event);
    }

    for (const link of seed.legal_links) {
      let lawSectionId: string | null = null;
      let constitutionSectionId: string | null = null;

      if (link.kind === 'law') {
        const key = `${link.law_short_name}::${link.section_number}`;
        const section = lawSections.get(key);
        if (!section) {
          throw new Error(`bbee: missing law section "${key}" for "${seed.title}"`);
        }
        lawSectionId = section.id;
      } else {
        const section = constitutionSections.get(link.section_number);
        if (!section) {
          throw new Error(
            `bbee: missing constitution section ${link.section_number} for "${seed.title}"`,
          );
        }
        constitutionSectionId = section.id;
      }

      let existing = await refRepo.findOne({
        where: {
          event_id: event.id,
          law_section_id: lawSectionId ?? IsNull(),
          constitution_section_id: constitutionSectionId ?? IsNull(),
        },
      });

      const refPayload = {
        event_id: event.id,
        law_section_id: lawSectionId,
        constitution_section_id: constitutionSectionId,
        relevance: link.relevance,
        alleged_violation: link.alleged_violation,
      };

      if (!existing) {
        existing = refRepo.create(refPayload);
        await refRepo.save(existing);
      } else {
        Object.assign(existing, refPayload);
        await refRepo.save(existing);
      }
    }
  }
}

async function upsertStoryImpactLinks(
  m: EntityManager,
  storyId: string,
  links: Array<{ sectorId: string; chain: string[]; severity: ImpactSeverity }>,
): Promise<void> {
  const repo = m.getRepository(StoryImpactSector);
  for (const link of links) {
    let row = await repo.findOne({
      where: { story_id: storyId, sector_id: link.sectorId },
    });
    const payload = {
      story_id: storyId,
      sector_id: link.sectorId,
      impact_chain: link.chain,
      impact_severity: link.severity,
      amount_diverted_rands: null as string | null,
      people_affected_estimate: null as string | null,
      plain_english_impact: null as string | null,
    };
    if (!row) {
      row = repo.create(payload);
      await repo.save(row);
    } else {
      Object.assign(row, payload);
      await repo.save(row);
    }
  }
}

async function upsertPerson(
  m: EntityManager,
  data: {
    full_name: string;
    aliases: string[];
    current_role: string | null;
    organisation: string | null;
    status: PersonStatus;
    profile_summary: string;
  },
): Promise<Person> {
  const repo = m.getRepository(Person);
  let row = await repo.findOne({ where: { full_name: data.full_name } });
  if (!row) {
    row = repo.create({
      full_name: data.full_name,
      aliases: data.aliases,
      current_role: data.current_role,
      organisation: data.organisation,
      status: data.status,
      profile_summary: data.profile_summary,
    });
    row = await repo.save(row);
    console.log(`  + Person: ${data.full_name}`);
  } else {
    Object.assign(row, data);
    row = await repo.save(row);
    console.log(`  · Person: ${data.full_name}`);
  }
  return row;
}

const TIMELINE: TimelineSeedRow[] = [
  {
    event_date: '1913-06-19',
    event_type: EventType.INCIDENT,
    title: 'Natives Land Act — Black South Africans confined to 7% of the land',
    description:
      'The Natives Land Act restricted land ownership and rental for black South Africans outside scheduled areas, entrenching rural dispossession and limiting property-based wealth accumulation.',
    plain_english:
      'The law that started everything. Black people were forbidden from owning or renting land outside of small designated areas. This meant they could not farm for themselves, could not build wealth through property, and could not accumulate assets that would pass to their children. This single law created the foundation of the racial wealth gap that exists today.',
    significance: EventSignificance.CRITICAL,
    legal_links: [],
  },
  {
    event_date: '1948-05-26',
    event_type: EventType.INCIDENT,
    title: 'National Party elected — apartheid formally implemented',
    description:
      'The National Party won power and extended statutory racial segregation across public life, consolidating legal barriers to economic participation.',
    plain_english:
      'The National Party won the election on a platform of "apart-ness". From this year, racial segregation became the formal law of the country — in education, housing, work, and every aspect of daily life.',
    significance: EventSignificance.CRITICAL,
    legal_links: [],
  },
  {
    event_date: '1953-06-17',
    event_type: EventType.INCIDENT,
    title: 'Bantu Education Act — deliberately inferior schools for black children',
    description:
      'Legislated separate and unequal schooling, with substantially lower per-pupil investment for black learners — with intergenerational effects on skills and earnings.',
    plain_english:
      'The minister who designed this law said black children should only be educated enough to be workers for white people. Less money was spent per black pupil. Fewer qualified teachers. Worse facilities. The education gap created in 1953 is still visible in school results today.',
    significance: EventSignificance.CRITICAL,
    legal_links: [],
  },
  {
    event_date: '1973-01-25',
    event_type: EventType.INCIDENT,
    title: 'Black workers allowed into skilled urban jobs — only because of labour shortages',
    description:
      'Industrial training and urban labour-market rules were partially relaxed amid skills shortages — after decades of statutory exclusion from skilled urban employment.',
    plain_english:
      'For 60 years, black people were legally barred from skilled city jobs. This was only changed in 1973 — and only because white businesses were running out of workers.',
    significance: EventSignificance.MEDIUM,
    legal_links: [],
  },
  {
    event_date: '1994-04-27',
    event_type: EventType.INCIDENT,
    title: 'First democratic election — economy still owned by minority',
    description:
      'Universal franchise arrived in 1994; patterns of corporate ownership, asset concentration, and labour-market segmentation substantially persisted.',
    plain_english:
      'On 27 April 1994, every South African voted for the first time. But economic freedom did not come with political freedom. The same companies, same banks, same law firms, same farms still belonged to the same people. Political liberation without economic liberation is half a freedom.',
    significance: EventSignificance.CRITICAL,
    legal_links: [],
  },
  {
    event_date: '1998-10-19',
    event_type: EventType.INCIDENT,
    title: 'Employment Equity Act — first legislative step toward transformation',
    description:
      'Employment Equity Act 55 of 1998 criminalises unfair discrimination in employment and requires designated employers to pursue equitable representation through plans and reporting.',
    plain_english:
      'The first major post-apartheid law addressing workplace inequality. It banned unfair discrimination in employment and required employers with more than 50 staff to have employment equity plans. But it lacked the ownership and economic empowerment dimension that BEE would later address.',
    significance: EventSignificance.HIGH,
    legal_links: [
      {
        kind: 'law',
        law_short_name: 'Employment Equity Act',
        section_number: 'Section 1',
        relevance: 'Framework and definitions for workplace equity duties that parallel (but do not replace) empowerment ownership scorecards.',
        alleged_violation: false,
      },
    ],
  },
  {
    event_date: '2000-11-15',
    event_type: EventType.STATEMENT,
    title: 'BEE Commission releases Andile Mngxitama report',
    description:
      'Editorial seed note: a presidentially-led BEE commission reported slow voluntary transformation and recommended legislative scaffolding; details vary by published source.',
    plain_english:
      'The BEE Commission, chaired by Cyril Ramaphosa, released a report finding that economic transformation had been far too slow. The private sector had not voluntarily transformed. The report recommended legislation.',
    significance: EventSignificance.MEDIUM,
    legal_links: [],
  },
  {
    event_date: '2003-11-09',
    event_type: EventType.COMMISSION_ESTABLISHED,
    title: 'Broad-Based Black Economic Empowerment Act 53 of 2003 signed into law',
    description:
      'The B-BBEE Act creates a statutory empowerment framework — later operationalised through generic codes and sector codes.',
    plain_english:
      'The BEE Act created the legal framework for transformation for the first time. The word "Broad-Based" was important: the earlier approach had enriched a small black elite through individual deals. This law required transformation to benefit a broader community — through skills, suppliers, and social development, not just ownership.',
    significance: EventSignificance.CRITICAL,
    legal_links: [
      {
        kind: 'law',
        law_short_name: 'B-BBEE Act',
        section_number: 'Section 1',
        relevance: 'Founding definitions and objects of the empowerment framework.',
        alleged_violation: false,
      },
      {
        kind: 'constitution',
        section_number: 9,
        relevance:
          'Section 9(2) is frequently cited as constitutional authority for remedial measures that advance disadvantaged persons — the doctrinal backdrop for empowerment legislation challenged and defended in court.',
        alleged_violation: false,
      },
    ],
  },
  {
    event_date: '2007-02-09',
    event_type: EventType.INCIDENT,
    title: 'Codes of Good Practice — the scoring system introduced',
    description:
      'Generic Codes of Good Practice under the B-BBEE Act introduce measurable elements and recognition levels used in procurement and licensing contexts.',
    plain_english:
      'The government published detailed rules for how companies would be scored on seven elements of transformation. Companies are given a level from 1 to 8. Level 1 is the highest — most transformed. Level 8 or non-compliant means a company cannot easily do government work.',
    significance: EventSignificance.HIGH,
    legal_links: [],
  },
  {
    event_date: '2013-10-31',
    event_type: EventType.INCIDENT,
    title: 'B-BBEE Amendment Act — "fronting" becomes a criminal offence',
    description:
      'Amendments strengthen enforcement pathways, criminalise fronting, and establish institutional machinery for complaints and verification oversight.',
    plain_english:
      'Fronting is when a company gives the appearance of black ownership without genuine empowerment — a black person is listed as a shareholder but has no real power or benefit. The 2013 Act made fronting a criminal offence. The B-BBEE Commission was created to investigate complaints.',
    significance: EventSignificance.HIGH,
    legal_links: [
      {
        kind: 'law',
        law_short_name: 'B-BBEE Amendment Act',
        section_number: 'Section 26B',
        relevance: 'Criminalisation of fronting practices used to game empowerment metrics.',
        alleged_violation: false,
      },
    ],
  },
  {
    event_date: '2022-03-30',
    event_type: EventType.STATEMENT,
    title: 'World Bank: South Africa is the most unequal country on Earth',
    description:
      'World Bank reporting and commentary widely cited South Africa as extremely unequal by international comparators; exact headline metrics evolve year to year.',
    plain_english:
      'The World Bank ranked South Africa as the most economically unequal country on the planet. 30 years after apartheid ended, the racial wealth gap had barely closed at the median level. The top 10% — still disproportionately white — owned 86% of all wealth. The median black household had 5% of the wealth of the median white household.',
    significance: EventSignificance.HIGH,
    legal_links: [],
  },
  {
    event_date: '2024-09-20',
    event_type: EventType.OTHER,
    title: 'Legal Sector Code gazetted — major firms to achieve 50% black ownership',
    description:
      'A sector code for large law firms sets transformational targets and recognises mechanisms; immediately controversial and later challenged in the High Court.',
    plain_english:
      'The minister publishes a specific set of rules for law firms. Large firms must achieve 50% black ownership within 5 years, with 25% being black women. The code removes some existing transformation mechanisms that had been working.',
    significance: EventSignificance.HIGH,
    legal_links: [
      {
        kind: 'law',
        law_short_name: 'B-BBEE Act',
        section_number: 'Section 12',
        relevance: 'Statutory basis for sector codes issued by the responsible minister.',
        alleged_violation: false,
      },
    ],
  },
  {
    event_date: '2025-08-01',
    event_type: EventType.JUDGMENT,
    title: 'Pretoria High Court: Sakeliga wins against Air Services Licensing Council',
    description:
      'High Court litigation concerning whether an air-services licence may be conditioned on empowerment criteria; outcome described publicly as favourable to challengers.',
    plain_english:
      'A court rules that the aviation regulator cannot make a BEE score a condition of getting an air service licence. Anti-BEE groups celebrate. Transformation advocates say it is a narrow procedural ruling, not a verdict on BEE itself.',
    significance: EventSignificance.HIGH,
    legal_links: [],
  },
  {
    event_date: '2026-05-04',
    event_type: EventType.HEARING,
    title: 'Landmark Legal Sector Code challenge — Gauteng High Court, Week 1',
    description:
      'Constitutional and administrative review of the Legal Sector Code: parties dispute rationality, fairness, and rights alignment of ownership targets and recognition rules.',
    plain_english:
      "Four of South Africa's largest law firms go to court to challenge the Legal Sector Code. The public gallery is packed. The hearing lasts the entire week. Both sides present their best arguments. The court is asked: is this code constitutional?",
    significance: EventSignificance.CRITICAL,
    legal_links: [
      {
        kind: 'constitution',
        section_number: 22,
        relevance:
          'Child-readable frame: the Constitution protects freedom of trade, occupation and profession. Challengers argue mandatory ownership pathways trench on professional practice; defenders argue lawful transformation within the Constitution’s overall scheme (including section 9(2)).',
        alleged_violation: false,
      },
    ],
  },
  {
    event_date: '2026-05-07',
    event_type: EventType.HEARING,
    title: 'Defenders tell court: "This is about survival for black professionals"',
    description:
      'Respondents in the Legal Sector Code review emphasise bar transformation history and practical barriers faced by black practitioners in large-firm practice.',
    plain_english:
      'Lawyers defending the Legal Sector Code tell the court that the case is about whether black professionals can survive in the legal field. The Black Lawyers Association, Advocates for Transformation, and the Legal Practice Council all oppose the challenge.',
    significance: EventSignificance.CRITICAL,
    legal_links: [],
  },
];

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized
    ? AppDataSource
    : await AppDataSource.initialize();

  console.log('\n── Seeding: B-BBEE transformation policy + story ──');

  try {
    await dataSource.transaction(async (m) => {
      await ensureConstitutionSection9(m);
      await ensureBbeeLaws(m);

      const sectors = await requireImpactSectors(m, ['jobs', 'education']);
      const lawSections = await buildLawSectionMap(m);
      const constitutionSections = await buildConstitutionMap(m);

      const policy = await upsertTransformationPolicy(m);
      const story = await upsertBbeeStory(m, policy.id, sectors.get('jobs')!.id);

      const tembeka = await upsertPerson(m, {
        full_name: 'Tembeka Ngcukaitobi SC',
        aliases: ['Tembeka Ngcukaitobi', 'Ngcukaitobi SC'],
        current_role: 'Senior Counsel',
        organisation: 'Johannesburg Bar',
        status: PersonStatus.ACTIVE,
        profile_summary:
          'Prominent South African advocate and author of "The Land is Ours" — a landmark work on land dispossession. Representing Bowmans, Webber Wentzel, and Werksmans in the Legal Sector Code challenge (May 2026). Noted for his scholarship on constitutional law and economic justice.',
      });

      const norman = await upsertPerson(m, {
        full_name: 'Norman Arendse SC',
        aliases: ['Norman Arendse'],
        current_role: 'Senior Counsel',
        organisation: 'Cape Bar',
        status: PersonStatus.ACTIVE,
        profile_summary:
          'Senior Counsel appearing on behalf of parties defending the Legal Sector Code in the May 2026 Gauteng High Court challenge. Evidence leader in the Parliamentary Ad Hoc Committee on the Mkhwanazi allegations.',
      });

      const parks = await upsertPerson(m, {
        full_name: 'Parks Tau',
        aliases: ['Parks Tau', 'Minister Tau'],
        current_role: 'Minister of Trade, Industry and Competition',
        organisation: 'Government of South Africa',
        status: PersonStatus.ACTIVE,
        profile_summary:
          'Gazetted the B-BBEE Legal Sector Code on 20 September 2024. Respondent in the Legal Sector Code challenge.',
      });

      const ramaphosa = await m.getRepository(Person).findOne({
        where: { full_name: 'Cyril Ramaphosa' },
      });
      if (!ramaphosa) {
        console.warn('  ⚠ Cyril Ramaphosa not found — run commissions/siu seeds first');
      } else {
        await linkStoryPersonRow(
          m,
          story.id,
          ramaphosa.id,
          'BEE Commission chair 2000 / President / champion of BEE',
          true,
        );
      }

      await linkStoryPersonRow(
        m,
        story.id,
        tembeka.id,
        'legal representative — appearing for law firms challenging LSC',
        true,
      );
      await linkStoryPersonRow(
        m,
        story.id,
        norman.id,
        'legal representative — defending the Legal Sector Code',
        true,
      );
      await linkStoryPersonRow(m, story.id, parks.id, 'minister — gazetted Legal Sector Code (2024)', true);

      await upsertTimelineRows(m, story.id, TIMELINE, lawSections, constitutionSections);

      await upsertStoryImpactLinks(m, story.id, [
        {
          sectorId: sectors.get('jobs')!.id,
          severity: ImpactSeverity.CRITICAL,
          chain: [
            'Apartheid legally confined black workers to unskilled labour',
            'Networks of white professional advantage persisted after 1994',
            '"If they cannot pronounce your name they will not make you a manager" — lived reality',
            'B-BBEE creates structural pressure to break informal exclusion networks',
            'But fronting means black names appear on shares without real economic power',
            'The wealth gap at the median level barely changed in 30 years',
            'The law is the floor — but the market sets the ceiling',
          ],
        },
        {
          sectorId: sectors.get('education')!.id,
          severity: ImpactSeverity.HIGH,
          chain: [
            'Bantu Education deliberately underfunded black schools',
            'BEE bursaries and skills development requirements create pathways',
            'Legal Sector Code challenge seeks to remove bursary recognition',
            'If bursaries for black students are not counted as transformation — fewer bursaries',
          ],
        },
      ]);

      await upsertSimilarPair(
        m,
        STORY_SLUG,
        TEMBISA_SLUG,
        SimilarityReason.SAME_PATTERN,
        'Fronting of BEE deals and tender corruption often appear together — both involve the gap between formal compliance and genuine transformation',
      );
      await upsertSimilarPair(
        m,
        TEMBISA_SLUG,
        STORY_SLUG,
        SimilarityReason.SAME_PATTERN,
        'Fronting of BEE deals and tender corruption often appear together — both involve the gap between formal compliance and genuine transformation',
      );
      await upsertSimilarPair(
        m,
        STORY_SLUG,
        MALUSI_SLUG,
        SimilarityReason.SAME_PATTERN,
        'Housing tender fraud involves black-owned companies on paper that are fronts for criminal enterprises — the perversion of what BEE was designed to achieve',
      );
      await upsertSimilarPair(
        m,
        MALUSI_SLUG,
        STORY_SLUG,
        SimilarityReason.SAME_PATTERN,
        'Housing tender fraud involves black-owned companies on paper that are fronts for criminal enterprises — the perversion of what BEE was designed to achieve',
      );
    });

    console.log('  ✓ B-BBEE seed complete.\n');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  run().catch((err: unknown) => {
    console.error('\n✗ bbee-transformation seed failed:', err);
    process.exit(1);
  });
}
