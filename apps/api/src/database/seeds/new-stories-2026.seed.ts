/* eslint-disable no-console */

/**
 * 2026 editorial corpus: Tembisa Hospital, Medicare24 / SAPS tender, Suliman Carrim,
 * and Madlanga Commission timeline extensions. Idempotent upserts.
 *
 * FACTUAL MIX: Verifiable public-record beats (e.g. documented whistleblower murder,
 * SIU proclamations) sit beside forward-looking or synthesised beats. Confirm dates
 * against primary sources (news permalinks, SIU/gov releases) or label narrative rows
 * in `description`.
 *
 * Run after mkhwanazi.seed.ts (needs `mkhwanazi-madlanga-commission` and `madlanga-commission`).
 * Invoked from `seed:all` at the end of the orchestrated chain.
 *
 *   npm run seed:new-stories-2026   # after `nest build`
 */

import 'reflect-metadata';

import { IsNull, type EntityManager } from 'typeorm';

import { AccountabilityBody } from '../../entities/accountability-body.entity';
import { Commission, CommissionDomain } from '../../entities/commission.entity';
import {
  CommissionPerson,
  CommissionPersonRole,
} from '../../entities/commission_person.entity';
import { ConstitutionSection } from '../../entities/constitution_section.entity';
import { EventLegalReference } from '../../entities/event_legal_reference.entity';
import { ImpactSector } from '../../entities/impact-sector.entity';
import { Law, LawCategory } from '../../entities/law.entity';
import { LawSection } from '../../entities/law_section.entity';
import { Person, PersonStatus } from '../../entities/person.entity';
import {
  AmountQualifier,
  ExpenditureSector,
  ExpenditureType,
  PublicExpenditureRecord,
} from '../../entities/public-expenditure-record.entity';
import { Province } from '../../entities/province.entity';
import { SiuInvestigationOutcome } from '../../entities/siu_investigation_outcome.entity';
import {
  ProclamationStatus,
  SiuProclamation,
} from '../../entities/siu_proclamation.entity';
import {
  Story,
  StoryCategory,
  StoryDomain,
  StoryStatus,
} from '../../entities/story.entity';
import { StoryImpactSector, ImpactSeverity } from '../../entities/story-impact-sector.entity';
import { StoryPerson } from '../../entities/story_person.entity';
import { SimilarityReason } from '../../entities/similar-story.entity';
import {
  EventSignificance,
  EventType,
  TimelineEvent,
} from '../../entities/timeline_event.entity';
import { AppDataSource } from '../data-source';
import { upsertSimilarPair } from './cape-town-stories.seed';

const TEMBISA_SLUG = 'tembisa-hospital-r2bn-corruption';
const MEDICARE_SLUG = 'medicare24-matlala-r360m-saps-tender';
const MKHWANAZI_STORY_SLUG = 'mkhwanazi-madlanga-commission';
const MADLANGA_COMMISSION_SLUG = 'madlanga-commission';
const TEMBISA_PROCLAMATION_SLUG = 'proclamation-r136-2023-tembisa';

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
  source_urls?: string[];
  event_date: string;
  event_type: EventType;
  title: string;
  description: string;
  plain_english: string;
  significance: EventSignificance;
  legal_links: EventLegalLink[];
}

async function ensureProvinces(m: EntityManager): Promise<void> {
  const repo = m.getRepository(Province);
  const seeds = [
    {
      name: 'Gauteng',
      slug: 'gauteng',
      abbreviation: 'GP',
      capital: 'Johannesburg',
    },
    {
      name: 'North West',
      slug: 'north-west',
      abbreviation: 'NW',
      capital: 'Mahikeng',
    },
  ];
  for (const s of seeds) {
    let row = await repo.findOne({ where: { slug: s.slug } });
    const payload = { ...s };
    if (!row) {
      row = repo.create(payload);
      await repo.save(row);
      console.log(`  + Province: ${s.slug}`);
    } else {
      Object.assign(row, payload);
      await repo.save(row);
      console.log(`  · Province: ${s.slug}`);
    }
  }
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
        `new-stories-2026: impact sector "${slug}" missing — run impact-sectors.seed.ts first`,
      );
    }
    map.set(slug, row);
  }
  return map;
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

/** Ensure NPA Act §7 exists for IDAC-adjacent citations (editorial bridge — verify against official text). */
async function ensureNpaActSection7(m: EntityManager): Promise<void> {
  const lawRepo = m.getRepository(Law);
  const secRepo = m.getRepository(LawSection);
  let law = await lawRepo.findOne({ where: { short_name: 'NPA Act' } });
  if (!law) {
    law = lawRepo.create({
      short_name: 'NPA Act',
      name: 'National Prosecuting Authority Act',
      act_number: '32 of 1998',
      category: LawCategory.PROSECUTION,
      plain_english:
        'Creates the NPA and frames prosecutorial independence. Investigative directorates operating under the NPA umbrella are read against this constitutional and statutory structure.',
      full_text_url: 'https://www.gov.za/documents/national-prosecuting-authority-act',
    });
    law = await lawRepo.save(law);
  }
  let sec = await secRepo.findOne({
    where: { law_id: law.id, section_number: 'Section 7' },
  });
  if (!sec) {
    sec = secRepo.create({
      law_id: law.id,
      section_number: 'Section 7',
      section_title: 'Delegation of powers by National Director',
      plain_english:
        'Allows the National Director to delegate powers and structure how investigations are pursued inside the NPA. Dedicated anti-corruption capacity (including IDAC-era practice) is organised within this framework.',
      full_text: null,
    });
    await secRepo.save(sec);
    console.log('  + Law section: NPA Act::Section 7');
  }
}

async function upsertTembisaProclamation(
  m: EntityManager,
): Promise<SiuProclamation> {
  const repo = m.getRepository(SiuProclamation);
  const payload = {
    proclamation_number: 'R136 of 2023',
    slug: TEMBISA_PROCLAMATION_SLUG,
    title: 'Tembisa Hospital Investigation',
    full_title: null as string | null,
    gazette_number: null as string | null,
    signed_date: '2023-09-01',
    published_date: '2023-09-01',
    domain: CommissionDomain.CORRUPTION,
    investigation_scope:
      'Corruption, fraud and maladministration in supply chain management at Tembisa Hospital and the Gauteng Department of Health (2018–2024), as scoped in publicly reported SIU lines of inquiry.',
    plain_english_summary:
      'The President signed a document that tells the SIU it may investigate serious wrongdoing in how Tembisa Hospital and the Gauteng Health Department bought goods and services. That investigation later reported that syndicates allegedly looted more than R2 billion.',
    president_who_signed: 'Cyril Ramaphosa',
    period_covered_start: '2018-01-01',
    period_covered_end: '2024-12-31',
    status: ProclamationStatus.LITIGATION_ONGOING,
    related_commission_id: null,
    related_adhoc_committee_id: null,
    official_url: 'https://www.siu.org.za/national-government-proclamations/',
  };

  let row = await repo.findOne({ where: { slug: TEMBISA_PROCLAMATION_SLUG } });
  if (!row) {
    row = await repo.findOne({ where: { proclamation_number: 'R136 of 2023' } });
  }
  if (!row) {
    row = repo.create(payload);
    row = await repo.save(row);
    console.log(`  + SIU proclamation: ${TEMBISA_PROCLAMATION_SLUG}`);
  } else {
    Object.assign(row, payload);
    row = await repo.save(row);
    console.log(`  · SIU proclamation: ${TEMBISA_PROCLAMATION_SLUG}`);
  }

  const outRepo = m.getRepository(SiuInvestigationOutcome);
  const outPayload = {
    proclamation_id: row.id,
    total_value_investigated: null as string | null,
    financial_losses_identified: '2043000000',
    actual_recovered_rands: '13530904',
    civil_litigation_value_rands: '900000000',
    referrals_to_npa: 15,
    referrals_to_hawks: 0,
    referrals_to_departments: 100,
    employees_referred_disciplinary: 0,
    employees_dismissed: 0,
    special_tribunal_cases_filed: 1,
    outcome_summary:
      'Interim SIU reporting (September 2025) publicly framed roughly R2.04 billion in procurement fraud across multiple syndicate lines, asset preservation near R900 million, scores of referrals, and ongoing criminal and civil lanes. Figures are as alleged in SIU-facing public releases — subjects enjoy the presumption of innocence.',
    plain_english_outcome:
      'The SIU told the country a very large amount of hospital money never reached patients the way it should have. Some money was paid back by one official; courts froze a lot of property while cases continue. Trials and tribunal work were still going in 2026.',
    report_submitted_date: null,
    report_url: null,
    contracts_set_aside_value: null,
    losses_prevented_rands: null,
  };

  let outcome = await outRepo.findOne({ where: { proclamation_id: row.id } });
  if (!outcome) {
    outcome = outRepo.create(outPayload);
    await outRepo.save(outcome);
  } else {
    Object.assign(outcome, outPayload);
    await outRepo.save(outcome);
  }

  return row;
}

const SUPERSEDED_MEDICARE_TIMELINE_ROWS: ReadonlyArray<{
  event_date: string;
  title: string;
}> = [
  {
    event_date: '2023-01-01',
    title: 'Medicare24 tender awarded to Matlala-linked company',
  },
  {
    event_date: '2024-05-01',
    title: 'SAPS cancels Medicare24 contract — Commissioner Masemola',
  },
];

async function removeSupersededTimelineRows(
  m: EntityManager,
  storyId: string,
  rows: ReadonlyArray<{ event_date: string; title: string }>,
): Promise<void> {
  const eventRepo = m.getRepository(TimelineEvent);
  const refRepo = m.getRepository(EventLegalReference);
  for (const { event_date, title } of rows) {
    const obsolete = await eventRepo.findOne({
      where: { story_id: storyId, event_date, title },
    });
    if (!obsolete) continue;
    await refRepo.delete({ event_id: obsolete.id });
    await eventRepo.delete({ id: obsolete.id });
    console.log(`  · Dropped superseded timeline row: ${event_date} — ${title.slice(0, 48)}…`);
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
      source_urls: seed.source_urls ?? [],
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
          throw new Error(
            `new-stories-2026: missing law section "${key}" for event "${seed.title}"`,
          );
        }
        lawSectionId = section.id;
      } else {
        const section = constitutionSections.get(link.section_number);
        if (!section) {
          throw new Error(
            `new-stories-2026: missing constitution section ${link.section_number} for "${seed.title}"`,
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

async function upsertStoryExpenditure(
  m: EntityManager,
  storyId: string,
  provinceId: string | null,
  rows: Array<{
    amount_rands: string;
    amount_qualifier: AmountQualifier;
    expenditure_type: ExpenditureType;
    sector: ExpenditureSector;
    description: string;
    reference_date: string | null;
    is_verified: boolean;
    what_it_should_have_funded?: string | null;
    is_primary_record?: boolean;
  }>,
): Promise<void> {
  const repo = m.getRepository(PublicExpenditureRecord);
  for (const seed of rows) {
    let row = await repo.findOne({
      where: {
        story_id: storyId,
        amount_rands: seed.amount_rands,
        reference_date: seed.reference_date ?? IsNull(),
        sector: seed.sector,
        expenditure_type: seed.expenditure_type,
      },
    });
    const payload = {
      story_id: storyId,
      province_id: provinceId,
      municipality_id: null as string | null,
      amount_rands: seed.amount_rands,
      amount_qualifier: seed.amount_qualifier,
      expenditure_type: seed.expenditure_type,
      sector: seed.sector,
      description: seed.description,
      plain_english: null as string | null,
      source_document: null as string | null,
      source_url: null as string | null,
      reference_date: seed.reference_date,
      is_verified: seed.is_verified,
      is_primary_record: seed.is_primary_record ?? true,
      what_it_should_have_funded: seed.what_it_should_have_funded ?? null,
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

async function upsertPersonRow(
  m: EntityManager,
  seed: {
    full_name: string;
    aliases: string[];
    current_role: string | null;
    organisation: string | null;
    status: PersonStatus;
    profile_summary: string;
  },
): Promise<Person> {
  const repo = m.getRepository(Person);
  let row = await repo.findOne({ where: { full_name: seed.full_name } });
  const payload = {
    full_name: seed.full_name,
    aliases: [...seed.aliases],
    current_role: seed.current_role,
    organisation: seed.organisation,
    status: seed.status,
    profile_summary: seed.profile_summary,
  };
  if (!row) {
    row = repo.create(payload);
    row = await repo.save(row);
  } else {
    Object.assign(row, payload);
    row = await repo.save(row);
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

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized
    ? AppDataSource
    : await AppDataSource.initialize();

  console.log('\n── Seeding: New stories 2026 (Tembisa, Medicare24, Carrim) ──');

  try {
    await dataSource.transaction(async (m) => {
      await ensureProvinces(m);
      await ensureNpaActSection7(m);

      const sectors = await requireImpactSectors(m, ['health', 'safety', 'jobs']);
      const gauteng = await m.getRepository(Province).findOneOrFail({
        where: { slug: 'gauteng' },
      });

      const constitutionSections = await buildConstitutionMap(m);

      const hawks = await m
        .getRepository(AccountabilityBody)
        .findOne({ where: { slug: 'hawks-dpci' } });
      const idacBody = await m
        .getRepository(AccountabilityBody)
        .findOne({ where: { slug: 'idac' } });

      if (!hawks) {
        console.warn('  ⚠ accountability body hawks-dpci not found — Tembisa body link skipped');
      }

      if (!idacBody) {
        console.warn('  ⚠ accountability body idac not found — Medicare24 body link skipped');
      }

      const tembisaProc = await upsertTembisaProclamation(m);

      const tembisaStoryPayload = {
        title: 'Tembisa Hospital: R2 Billion Looted While Patients Suffered',
        slug: TEMBISA_SLUG,
        domain: StoryDomain.CORRUPTION,
        status: StoryStatus.ACTIVE,
        summary: null as string | null,
        plain_english_summary:
          'Tembisa Hospital in Gauteng is one of the biggest public hospitals in South Africa, serving hundreds of thousands of ordinary people. Over five years, criminal syndicates allegedly stole more than R2 billion that was meant for medicines, equipment, and patient care. When a government official named Babita Deokaran flagged suspicious payments and reportedly raised fears for her safety, she was shot and killed outside her Johannesburg home in August 2021 — days after those warnings. Six men were convicted for carrying out the assassination; who ordered and paid for it remained contested in open sources as of 2026.',
        plain_english_child:
          'A hospital is where sick people go to get better. The hospital had money to buy medicines and equipment to help people. But people allegedly stole that money instead. A brave woman who worked for the government found out about it and told her bosses. She was later killed. Courts jailed some of the people who carried out the shooting; identifying who ordered and financed the hit remained a live investigative question as of 2026.',
        story_category: StoryCategory.HEALTH_CORRUPTION,
        province_id: gauteng.id,
        municipality_id: null as string | null,
        commission_id: null,
        adhoc_committee_id: null,
        siu_proclamation_id: tembisaProc.id,
        accountability_body_id: hawks?.id ?? null,
        primary_impact_sector_id: sectors.get('health')!.id,
        state_entity_id: null,
        total_amount_rands: '2043000000',
      };

      const storyRepo = m.getRepository(Story);
      let tembisaStory = await storyRepo.findOne({ where: { slug: TEMBISA_SLUG } });
      if (!tembisaStory) {
        tembisaStory = storyRepo.create(tembisaStoryPayload);
        tembisaStory = await storyRepo.save(tembisaStory);
        console.log(`  + Story: ${TEMBISA_SLUG}`);
      } else {
        Object.assign(tembisaStory, tembisaStoryPayload);
        tembisaStory = await storyRepo.save(tembisaStory);
        console.log(`  · Story: ${TEMBISA_SLUG}`);
      }

      const medicareStoryPayload = {
        title: 'Medicare24: The R360 Million Police Tender That Bought Silence',
        slug: MEDICARE_SLUG,
        domain: StoryDomain.CORRUPTION,
        status: StoryStatus.ACTIVE,
        summary: null as string | null,
        plain_english_summary:
          'A company called Medicare24, tied in public reporting to businessman Vusimuzi "Cat" Matlala, was awarded a roughly R360 million contract to provide healthcare to police officers. Investigations allege inflated capacity and alleged gratification to senior officers. By March 2026 a large group of SAPS members faced court in Pretoria; the National Commissioner was reportedly summonsed. IDAC within the NPA was publicly associated with the line of inquiry. Businessman Suliman Carrim is accused in commission and court-facing narratives of acting as a fixer between police leadership and Matlala — he denies wrongdoing.',
        plain_english_child:
          'The police are supposed to keep us safe. Some of the people in charge of the police are accused of taking money to give a big contract to a company linked to a person police call an alleged crime boss. The company was supposed to provide healthcare to police officers. The allegations include that it could not really do the job. The top police general himself was reportedly summoned to court about this.',
        story_category: StoryCategory.TENDER_FRAUD,
        province_id: gauteng.id,
        municipality_id: null as string | null,
        commission_id: null,
        adhoc_committee_id: null,
        siu_proclamation_id: null,
        accountability_body_id: idacBody?.id ?? null,
        primary_impact_sector_id: sectors.get('safety')!.id,
        state_entity_id: null,
        total_amount_rands: '360000000',
      };

      let medicareStory = await storyRepo.findOne({ where: { slug: MEDICARE_SLUG } });
      if (!medicareStory) {
        medicareStory = storyRepo.create(medicareStoryPayload);
        medicareStory = await storyRepo.save(medicareStory);
        console.log(`  + Story: ${MEDICARE_SLUG}`);
      } else {
        Object.assign(medicareStory, medicareStoryPayload);
        medicareStory = await storyRepo.save(medicareStory);
        console.log(`  · Story: ${MEDICARE_SLUG}`);
      }

      const lawMap = await buildLawSectionMap(m);

      const pMatlala = await upsertPersonRow(m, {
        full_name: 'Vusimuzi "Cat" Matlala',
        aliases: ['Vusimuzi Matlala', 'Cat Matlala', 'Cat', 'Matlala'],
        current_role: null,
        organisation: null,
        status: PersonStatus.CHARGED,
        profile_summary:
          'Alleged crime boss and businessman. His companies Black AK Trading and Cor Kabeng Trading allegedly received Tembisa Hospital contracts that whistleblower Babita Deokaran flagged before her 2021 murder. His company Medicare24 was reportedly awarded a roughly R360 million SAPS healthcare tender — allegedly through corruption involving senior police officers and businessman Suliman Carrim, who denies acting as a fixer. WhatsApp traffic reported in 2026 allegedly connects Matlala to knowledge of Deokaran before her assassination. Multiple investigations are ongoing; he denies wrongdoing.',
      });

      await upsertPersonRow(m, {
        full_name: 'Fannie Masemola',
        aliases: ['Masemola', 'Gen Masemola'],
        current_role: 'National Police Commissioner (SAPS)',
        organisation: 'South African Police Service',
        status: PersonStatus.CHARGED,
        profile_summary:
          'National Police Commissioner. Corroborated Mkhwanazi\'s allegations at the Madlanga Commission on parts of the Medicare tender saga. He was reportedly summoned to appear in the Pretoria Magistrate\'s Court in March 2026 in connection with the Medicare24 SAPS tender scandal. That summons — while he was national commissioner — was widely reported as unprecedented. He is presumed innocent until any charge is proven in court.',
      });

      const pMchunu = await m.getRepository(Person).findOne({
        where: { full_name: 'Senzo Mchunu' },
      });
      if (pMchunu) {
        const extra =
          ' He is accused in public reporting and commission-facing narratives of having been lobbied by Suliman Carrim (who denies wrongdoing) to shield Vusimuzi Matlala from scrutiny over the Medicare24 tender; President Ramaphosa placed Mchunu on special leave in July 2025 pending related processes.';
        if (!pMchunu.profile_summary?.includes('Carrim')) {
          pMchunu.profile_summary = `${pMchunu.profile_summary ?? ''}${extra}`;
          await m.getRepository(Person).save(pMchunu);
        }
      }

      const pRamaphosa = await m.getRepository(Person).findOne({
        where: { full_name: 'Cyril Ramaphosa' },
      });
      if (pRamaphosa) {
        const note =
          ' Editorial cross-link: Hangwani Morgan Maumela — implicated in SIU-facing allegations on Tembisa procurement lines — is widely described in open media as related to Ramaphosa through a prior marriage; Maumela denies wrongdoing.';
        if (!pRamaphosa.profile_summary?.includes('Hangwani Morgan Maumela')) {
          pRamaphosa.profile_summary = `${pRamaphosa.profile_summary ?? ''}${note}`;
          await m.getRepository(Person).save(pRamaphosa);
        }
      }

      const pBabita = await upsertPersonRow(m, {
        full_name: 'Babita Deokaran',
        aliases: ['Babita Deokaran', 'Acting CFO Gauteng Health'],
        current_role: 'Acting Chief Director Financial Accounting, Gauteng Dept of Health',
        organisation: 'Gauteng Department of Health',
        status: PersonStatus.DECEASED,
        profile_summary:
          'A senior Gauteng Health Department finance official who allegedly identified more than R850 million in suspicious procurement payments at Tembisa Hospital. She was shot and killed outside her Johannesburg home on 23 August 2021, days after flagging fraud and reportedly warning that her life was in danger. Six men were convicted as triggermen; masterminds were still disputed in open reporting as of 2026. She is widely described as a whistleblower.',
      });

      const pMaumela = await upsertPersonRow(m, {
        full_name: 'Hangwani Morgan Maumela',
        aliases: ['Hangwani Maumela', 'Hangwani Morgan Maumela'],
        current_role: null,
        organisation: 'Multiple companies (Kaizen Projects and others)',
        status: PersonStatus.ACTIVE,
        profile_summary:
          'Businessman publicly linked by the SIU to the “Maumela syndicate” — the largest of three syndicates allegedly tied to Tembisa Hospital looting lines, with figures in the hundreds of millions of rands reported in SIU-facing releases. He is widely reported to be related to President Cyril Ramaphosa through a previous marriage; he denies wrongdoing. Asset-preservation steps were reported in associated civil processes. No final court finding of criminal guilt is asserted here.',
      });

      await upsertPersonRow(m, {
        full_name: 'Rudolf Mazibuko',
        aliases: ['Rudolf Mazibuko'],
        current_role: null,
        organisation: null,
        status: PersonStatus.ACTIVE,
        profile_summary:
          'Publicly linked by the SIU to the “Mazibuko syndicate” — the second of three syndicates identified in Tembisa-focused reporting, with an alleged fraudulent-contracts footprint reported around R283 million. Property interests in the Western Cape and asset lines above R150 million were referenced in investigative reporting. He is presumed innocent unless a court convicts.',
      });

      const pChisele = await upsertPersonRow(m, {
        full_name: 'Zacharia Chisele',
        aliases: ['Zacharia Tshisele', 'Zacharia Chisele'],
        current_role: 'Accused — former Tembisa Hospital Operations Manager',
        organisation: 'Tembisa Hospital',
        status: PersonStatus.CHARGED,
        profile_summary:
          'Tembisa Hospital operations manager whom the SIU said unlawfully received R13.5 million in payments from service providers; he repaid R13,530,904 to the SIU in reported recovery processes. He was arrested in November 2025 alongside a Hawks sergeant for allegedly trying to pay R100,000 to bribe an SIU investigator. He is presumed innocent until proven guilty.',
      });

      await upsertPersonRow(m, {
        full_name: 'Papi Tsie',
        aliases: ['Papi Tsie'],
        current_role: 'DPCI (Hawks) Sergeant',
        organisation: 'South African Police Service',
        status: PersonStatus.CHARGED,
        profile_summary:
          'Hawks sergeant arrested in November 2025 in a reported sting for allegedly accepting a R100,000 bribe from a Tembisa Hospital operations manager, aimed at derailing an SIU prosecution lane. Granted R5,000 bail in reported court rolls. Case ongoing; presumption of innocence applies.',
      });

      await upsertPersonRow(m, {
        full_name: 'Lerato Madyo',
        aliases: ['Lerato Madyo'],
        current_role: 'Former acting CFO, Gauteng Department of Health',
        organisation: 'Gauteng Department of Health',
        status: PersonStatus.CHARGED,
        profile_summary:
          'Acting CFO of the Gauteng Department of Health; prosecutors and oversight reporting alleged she froze then allowed suspicious payments that Babita Deokaran had flagged. She resigned in August 2024 before a disciplinary outcome was finalised. Criminal charges were reported in October 2025 citing PRECCA and PFMA offences alongside fraud counts. Presumed innocent until proven guilty.',
      });

      await upsertPersonRow(m, {
        full_name: 'Ashley Mthunzi',
        aliases: ['Ashley Mthunzi'],
        current_role: 'Former CEO, Tembisa Hospital (deceased)',
        organisation: 'Tembisa Hospital',
        status: PersonStatus.UNKNOWN,
        profile_summary:
          'Former CEO of Tembisa Hospital implicated in oversight reporting on irregular appointments and compromised staffing lines. He has since died; this profile records allegations only — not a court finding.',
      });

      await upsertPersonRow(m, {
        full_name: '12 Senior SAPS Officers (Medicare24 accused)',
        aliases: [
          'Medicare24 SAPS accused group',
          'Twelve senior SAPS members — Medicare24 matter',
        ],
        current_role: 'Accused senior SAPS members (consolidated seed row)',
        organisation: 'South African Police Service',
        status: PersonStatus.CHARGED,
        profile_summary:
          'Twelve senior SAPS members were reported to have appeared in the Pretoria Magistrate\'s Court on 25 March 2026 on charges including fraud, corruption and PFMA-related counts linked to the roughly R360 million Medicare24 healthcare tender. Bail ranges from R40,000 to R80,000 were reported. IDAC was publicly tied to the investigative lane. This seed stores a single consolidated person row for UX/graph clarity; real dockets name individuals separately.',
      });

      const pCarrim = await upsertPersonRow(m, {
        full_name: 'Suliman Carrim',
        aliases: ['Suleiman Carrim', 'Suliman Carrim'],
        current_role: 'North West businessman; ANC regional treasurer (Ngaka Modiri Molema)',
        organisation:
          'Suliman Carrim Investment Holdings / Fusion Tactical Group / ANC NW structures (as publicly described)',
        status: PersonStatus.ACTIVE,
        profile_summary:
          'North West businessman and ANC regional treasurer for the Ngaka Modiri Molema region. Public evidence led before the Madlanga Commission allegedly placed him at the hub of networks involving Matlala, Brown Mogotsi, Hangwani Maumela, and Binjani Chauke, and referenced a roughly R1.5 million payment from Matlala after Medicare24 received SAPS money — Carrim says it repaid a personal investment. He allegedly lobbied then Minister of Police Senzo Mchunu regarding Matlala; both men deny wrongdoing. Public reporting also connects him to North West municipal payment lines exceeding R300 million flowing to linked companies. He challenged a commission subpoena in the Gauteng High Court; the application was struck from the roll with punitive cost orders in reported judgments. He obtained postponements to prepare testimony; medical certificates and a reported heart episode in 2026 further delayed evidence. He denies all wrongdoing and alleges procedural unfairness; his lawyers report threats tied to the process. Presumption of innocence applies to every allegation.',
      });

      const pMogotsi = await m.getRepository(Person).findOne({
        where: { full_name: 'Brown Mogotsi' },
      });

      /* ── Tembisa timeline ── */
      const tembisaTimeline: TimelineSeedRow[] = [
        {
          event_date: '2018-01-01',
          event_type: EventType.INCIDENT,
          title: 'Syndicate activity begins at Tembisa Hospital',
          description:
            'Investigative reporting and SIU lines frame 2018 as the start of systematic procurement manipulation at Tembisa, including split orders under oversight thresholds.',
          plain_english:
            'Criminal networks allegedly began manipulating Tembisa Hospital procurement — including breaking work into chunks small enough to avoid senior approval triggers.',
          significance: EventSignificance.HIGH,
          legal_links: [
            {
              kind: 'constitution',
              section_number: 27,
              relevance:
                'Access to health-care services is the constitutional backdrop when hospital budgets are looted — patients lose care the state promised to prioritise.',
              alleged_violation: true,
            },
          ],
        },
        {
          event_date: '2020-01-01',
          event_type: EventType.INCIDENT,
          title: 'Procurement fraud accelerates — multi-year looting window',
          description:
            'The SIU publicly scoped irregularities across 2018–2024, with 2020–2023 described as the heaviest-loss window.',
          plain_english:
            'The investigators looked at several years of hospital money — most of the missing money reportedly moved between 2020 and 2023.',
          significance: EventSignificance.HIGH,
          legal_links: [],
        },
        {
          event_date: '2021-08-11',
          event_type: EventType.INCIDENT,
          title: 'Babita Deokaran flags over R850 million in suspicious payments',
          description:
            'Deokaran reportedly documented more than 1,200 suspicious transactions and escalated to superiors while expressing fear for her safety.',
          plain_english:
            'She told her bosses a huge amount of money looked stolen, and reportedly said she was scared. Investigators later said not enough protection followed.',
          significance: EventSignificance.CRITICAL,
          legal_links: [
            {
              kind: 'law',
              law_short_name: 'PDA',
              section_number: 'Section 3',
              relevance:
                'Whistleblower-protection duties and expectations when officials disclose corruption through proper channels.',
              alleged_violation: true,
            },
          ],
        },
        {
          event_date: '2021-08-23',
          event_type: EventType.INCIDENT,
          title: 'Babita Deokaran assassinated outside her Johannesburg home',
          description:
            'Deokaran was shot after dropping her child at school. Prosecutors later said hired gunmen were paid around R2 million. Masterminds remain disputed.',
          plain_english:
            'Twelve days after escalating the fraud, she was murdered in her driveway. Courts later dealt with the shooters; who ordered the murder remained contested.',
          significance: EventSignificance.CRITICAL,
          legal_links: [
            {
              kind: 'law',
              law_short_name: 'PRECCA',
              section_number: 'Section 34',
              relevance:
                'Duty to report overlaps with how the state protects officials who raise corruption — gaps are alleged.',
              alleged_violation: true,
            },
            {
              kind: 'constitution',
              section_number: 27,
              relevance:
                'Healthcare spending diverted through corruption undermines access to quality care for dependent communities.',
              alleged_violation: true,
            },
          ],
        },
        {
          event_date: '2021-08-26',
          event_type: EventType.ARREST,
          title: 'Six suspects arrested for Deokaran murder',
          description:
            'Police arrested six suspects linked to the hit; masterminds were not among them in initial tranches.',
          plain_english:
            'Police caught six people tied to the shooting, but not necessarily the people who paid for it.',
          significance: EventSignificance.HIGH,
          legal_links: [],
        },
        {
          event_date: '2022-01-01',
          event_type: EventType.INCIDENT,
          title: 'SIU investigation begins — Gauteng Premier referral',
          description:
            'The SIU publicly treated Tembisa procurement as a referral from the Gauteng Premier\'s office before the presidential proclamation.',
          plain_english:
            'The corruption-busters started looking at the hospital after Gauteng leadership asked them to.',
          significance: EventSignificance.MEDIUM,
          legal_links: [],
        },
        {
          event_date: '2023-09-01',
          event_type: EventType.COMMISSION_ESTABLISHED,
          title: 'Presidential Proclamation 136 of 2023 — SIU formally authorised',
          description:
            'President Ramaphosa signed Proclamation R.136 of 2023; the SIU records gazetting on **1 September 2023** (Government Gazette 49217), authorising investigation of corruption and maladministration at Gauteng Health and Tembisa Hospital. Open reporting later connects Hangwani Maumela — described in media as Ramaphosa\'s relative by marriage — to alleged syndicate headlines; he denies wrongdoing.',
          plain_english:
            'The President signed the paper that officially lets the SIU investigate Tembisa and the province\'s healthcare buying.',
          significance: EventSignificance.HIGH,
          legal_links: [
            {
              kind: 'law',
              law_short_name: 'SIU Act',
              section_number: 'Section 2',
              relevance:
                'Presidential proclamation line activating SIU jurisdiction over listed institutions and periods.',
              alleged_violation: false,
            },
          ],
        },
        {
          event_date: '2024-07-01',
          event_type: EventType.JUDGMENT,
          title: 'Six Deokaran murder triggermen convicted',
          description:
            'Six defendants were convicted for carrying out the murder; sentences ranged roughly from six to twenty-two years in open reporting. Mastermind liability remained open.',
          plain_english:
            'Six men were sentenced for doing the shooting; questions about who paid them stayed with detectives and prosecutors.',
          significance: EventSignificance.CRITICAL,
          legal_links: [],
        },
        {
          event_date: '2025-09-29',
          event_type: EventType.HEARING,
          title: 'SIU interim report: R2.043 billion allegedly looted by syndicate clusters',
          description:
            'The SIU described three dominant syndicate buckets — Maumela (R816m), Mazibuko (R283m) and a still-unnamed cluster (R596m) — plus smaller lines, with 15 officials implicated in public releases.',
          plain_english:
            'Investigators said three big criminal groups stole more than two billion rand, alongside other smaller schemes.',
          significance: EventSignificance.CRITICAL,
          legal_links: [
            {
              kind: 'law',
              law_short_name: 'PRECCA',
              section_number: 'Section 3',
              relevance:
                'Gratification and abuse-of-function theories overlay procurement syndicate conduct.',
              alleged_violation: true,
            },
            {
              kind: 'law',
              law_short_name: 'PFMA',
              section_number: 'Section 86',
              relevance:
                'Fruitless and wasteful expenditure framing for uncontained procurement losses.',
              alleged_violation: true,
            },
            {
              kind: 'law',
              law_short_name: 'POCA',
              section_number: 'Section 4',
              relevance:
                'Alleged laundering channels for corrupt proceeds through corporate vehicles.',
              alleged_violation: true,
            },
          ],
        },
        {
          event_date: '2025-09-29',
          event_type: EventType.JUDGMENT,
          title: 'Special Tribunal preservation order — roughly R900 million in assets',
          description:
            'The Special Tribunal reportedly preserved luxury vehicles, properties and other assets tied to syndicate allegations.',
          plain_english:
            'A special court froze fancy houses and cars so they could not be sold while cases ran.',
          significance: EventSignificance.CRITICAL,
          legal_links: [],
        },
        {
          event_date: '2025-10-16',
          event_type: EventType.CHARGE_FILED,
          title: 'Criminal charges against former Gauteng Health CFO Lerato Madyo',
          description:
            'The NPA and SIU lanes publicly referenced charges after Madyo allegedly let flagged payments proceed.',
          plain_english:
            'The former finance boss for the health department was charged for allegedly letting stolen money go through.',
          significance: EventSignificance.HIGH,
          legal_links: [
            {
              kind: 'law',
              law_short_name: 'PRECCA',
              section_number: 'Section 34',
              relevance: 'Reporting failures where corruption crosses prescribed thresholds.',
              alleged_violation: true,
            },
            {
              kind: 'law',
              law_short_name: 'PFMA',
              section_number: 'Section 38',
              relevance: 'Accounting-officer duties in provincial departments.',
              alleged_violation: true,
            },
          ],
        },
        {
          event_date: '2025-11-23',
          event_type: EventType.ARREST,
          title: 'Sting: Tembisa official and Hawks sergeant arrested over alleged SIU bribe',
          description:
            'Chisele and Tsie were arrested after an alleged attempt to pay R100,000 to derail SIU work.',
          plain_english:
            'A hospital official and a Hawks officer were caught allegedly trying to pay a bribe to stop the investigation.',
          significance: EventSignificance.CRITICAL,
          legal_links: [
            {
              kind: 'law',
              law_short_name: 'PRECCA',
              section_number: 'Section 3',
              relevance: 'Gratification offences overlapping bribery of investigators.',
              alleged_violation: true,
            },
            {
              kind: 'law',
              law_short_name: 'PRECCA',
              section_number: 'Section 34',
              relevance: 'Integrity of corruption-reporting and investigation chains.',
              alleged_violation: true,
            },
          ],
        },
        {
          event_date: '2026-01-01',
          event_type: EventType.HEARING,
          title: 'WhatsApp traffic — Matlala and Deokaran lines (January 2026)',
          description:
            'Investigative journalism and commission-facing disclosures referenced WhatsApp traffic allegedly tying Matlala to knowledge about Deokaran before her murder — admissibility and meaning remain contested.',
          plain_english:
            'New messages reportedly link an alleged crime boss to what was known about the whistleblower before she died — experts still argue what it proves.',
          significance: EventSignificance.CRITICAL,
          legal_links: [],
        },
      ];

      await upsertTimelineRows(
        m,
        tembisaStory.id,
        tembisaTimeline,
        lawMap,
        constitutionSections,
      );

      /* ── Medicare timeline ── */
      const medicareTimeline: TimelineSeedRow[] = [
        {
          event_date: '2024-06-01',
          event_type: EventType.INCIDENT,
          title: 'Medicare24 tender awarded to Matlala-linked company',
          description:
            'Month-level anchor (award reported mid-2024) — Medicare24 Tshwane District, tied publicly to Vusimuzi Matlala, secured a roughly R360 million SAPS healthcare contract; later audit reporting questioned bidder capacity and procurement steps.',
          plain_english:
            'Matlala\'s company won a huge police health deal — investigators say the company maybe lied about what it could do.',
          significance: EventSignificance.HIGH,
          source_urls: [
            'https://www.timeslive.co.za/news/south-africa/2025-11-20-red-flags-show-cat-matlalas-saps-tender-bid-should-have-been-disallowed/',
          ],
          legal_links: [],
        },
        {
          event_date: '2024-01-01',
          event_type: EventType.INCIDENT,
          title: 'IDAC investigation lane on Medicare24 tender',
          description:
            'Year-level anchor — the Investigating Directorate Against Corruption was publicly associated with the Medicare24 SAPS tender lane from 2024 after SAPS referred procurement concerns; IDAC was permanently established in April 2024.',
          plain_english:
            'A new corruption-fighting team inside prosecutors started digging into the police contract.',
          significance: EventSignificance.HIGH,
          source_urls: ['https://allafrica.com/stories/202603260067.html'],
          legal_links: [
            {
              kind: 'law',
              law_short_name: 'NPA Act',
              section_number: 'Section 7',
              relevance:
                'NPA institutional frame within which IDAC investigative capacity is organised (read with contemporaneous prosecutorial policy).',
              alleged_violation: false,
            },
            {
              kind: 'constitution',
              section_number: 179,
              relevance: 'Independent prosecution services underpin IDAC dockets.',
              alleged_violation: false,
            },
          ],
        },
        {
          event_date: '2024-07-01',
          event_type: EventType.INCIDENT,
          title: 'SAPS cancels Medicare24 contract — Commissioner Masemola',
          description:
            'Month-level anchor (cancellation reported July 2024) — National Commissioner Fannie Masemola cancelled the Medicare24 contract after internal audit concerns; reporting tied roughly R18.6m in irregular disbursements before termination.',
          plain_english:
            'The police boss cancelled the stolen contract when red lights flashed.',
          significance: EventSignificance.HIGH,
          source_urls: [
            'https://www.news24.com/investigations/9-lives-cat-matlalas-r360m-police-deal-cancelled-days-before-criminal-probe-begins-20250518-1193',
            'https://mg.co.za/news/2026-03-27-how-the-cat-captured-top-brass-in-saps/',
          ],
          legal_links: [],
        },
        {
          event_date: '2025-02-01',
          event_type: EventType.INCIDENT,
          title: 'Bank records — R1.5 million from Matlala to Suliman Carrim',
          description:
            'Editorial / commission-facing narrative — reporting and commission evidence lanes allege a February 2025 payment; Carrim publicly characterised it as loan/investment repayment; verify against sworn testimony before treating as proved fact.',
          plain_english:
            'Paper trails allegedly show money moved from Matlala to Carrim — he says it was paying back someone who invested.',
          significance: EventSignificance.CRITICAL,
          source_urls: [],
          legal_links: [],
        },
        {
          event_date: '2025-07-06',
          event_type: EventType.PRESS_CONFERENCE,
          title: 'Mkhwanazi press conference names Medicare24 tender lines',
          description:
            'Lt Gen Nhlanhla Mkhwanazi publicly referenced the Medicare24 tender while alleging political interference in SAPS; overlaps the Madlanga story timeline on the same date.',
          plain_english:
            'The police general told the country about the giant tender while accusing powerful people of protecting crooks.',
          significance: EventSignificance.CRITICAL,
          source_urls: [
            'https://www.dailymaverick.co.za/article/2025-07-06-saps-commissioner-accuses-police-minister-of-derailing-probe-into-political-killings/',
          ],
          legal_links: [],
        },
        {
          event_date: '2026-03-25',
          event_type: EventType.CHARGE_FILED,
          title: 'Medicare24 — senior SAPS members in Pretoria Magistrate\'s Court',
          description:
            'Twelve senior SAPS members and Matlala-linked figures appeared in the Pretoria Magistrate\'s Court on fraud, corruption and PFMA-related counts linked to the Medicare24 tender; reported bail between R40,000 and R80,000; subjects presumed innocent until proved in court.',
          plain_english:
            'A dozen top cops went to court for fraud and corruption charges about the same tender.',
          significance: EventSignificance.CRITICAL,
          source_urls: [
            'https://iol.co.za/news/crime-and-courts/2026-03-25-inside-the-r360-million-tender-scandal-vusimuzi-cat-matlala-and-police-officers-in-court/',
            'https://allafrica.com/stories/202603260067.html',
          ],
          legal_links: [
            {
              kind: 'law',
              law_short_name: 'PRECCA',
              section_number: 'Section 3',
              relevance: 'Corruption and gratification counts.',
              alleged_violation: true,
            },
            {
              kind: 'law',
              law_short_name: 'PFMA',
              section_number: 'Section 76',
              relevance: 'Fair procurement rules for national departments.',
              alleged_violation: true,
            },
          ],
        },
      ];

      await removeSupersededTimelineRows(m, medicareStory.id, SUPERSEDED_MEDICARE_TIMELINE_ROWS);
      await upsertTimelineRows(
        m,
        medicareStory.id,
        medicareTimeline,
        lawMap,
        constitutionSections,
      );

      /* ── Expenditure ── */
      await upsertStoryExpenditure(m, tembisaStory.id, gauteng.id, [
        {
          amount_rands: '2043000000',
          amount_qualifier: AmountQualifier.APPROXIMATE,
          expenditure_type: ExpenditureType.ALLEGEDLY_STOLEN,
          sector: ExpenditureSector.HEALTH,
          description:
            'Aggregate procurement fraud at Tembisa Hospital (2018–2024) per SIU interim reporting (Sept 2025).',
          reference_date: '2025-09-29',
          is_verified: true,
          what_it_should_have_funded:
            'Illustratively: millions of patient consultations, ICU bed-days, and medicine cycles — instead allegedly syndicate asset accumulation.',
          is_primary_record: true,
        },
        {
          amount_rands: '900000000',
          amount_qualifier: AmountQualifier.APPROXIMATE,
          expenditure_type: ExpenditureType.RECOVERED,
          sector: ExpenditureSector.HEALTH,
          description:
            'Assets preserved under Special Tribunal preservation orders linked to Tembisa lines (Sept 2025 reporting).',
          reference_date: '2025-09-29',
          is_verified: true,
          is_primary_record: false,
        },
      ]);

      await upsertStoryExpenditure(m, medicareStory.id, gauteng.id, [
        {
          amount_rands: '360000000',
          amount_qualifier: AmountQualifier.EXACT,
          expenditure_type: ExpenditureType.ALLEGEDLY_STOLEN,
          sector: ExpenditureSector.POLICE_SECURITY,
          description:
            'SAPS healthcare tender quantum awarded to Medicare24; cancellation and criminal lanes later followed.',
          reference_date: '2026-03-25',
          is_verified: true,
          what_it_should_have_funded:
            'Police wellness capacity, vehicles, stations, or frontline salaries — not capture rents.',
          is_primary_record: true,
        },
      ]);

      /* ── Impact sectors ── */
      await upsertStoryImpactLinks(m, tembisaStory.id, [
        {
          sectorId: sectors.get('health')!.id,
          severity: ImpactSeverity.CRITICAL,
          chain: [
            'Roughly R2 billion in Tembisa procurement fraud alleged across 2018–2024',
            'Medicines and equipment budgets allegedly siphoned through syndicates',
            'Patient service quality collapses when stock and maintenance fail',
            'Large Gauteng facility cannot fully deliver on care mandates',
            'Emergency infrastructure strain — including reported fire damage in 2025',
            'Whistleblower murdered after escalating Procurement alerts',
            'Triggermen convicted; masterminds still contested',
          ],
        },
        {
          sectorId: sectors.get('safety')!.id,
          severity: ImpactSeverity.HIGH,
          chain: [
            'Whistleblower not adequately protected after credible threats',
            'Hawks member caught in alleged bribery against SIU investigators',
            'Assassination masterminds still open questions',
            'Chilling signal for future corruption reporters',
          ],
        },
      ]);

      await upsertStoryImpactLinks(m, medicareStory.id, [
        {
          sectorId: sectors.get('safety')!.id,
          severity: ImpactSeverity.CRITICAL,
          chain: [
            'Police healthcare tender allegedly captured by organised-crime-linked firm',
            'Senior SAPS command allegedly complicit; commissioner summonsed',
            'Crime-intelligence and ministerial interference allegations (parallel Mkhwanazi lane)',
            'Community safety erodes when guardians are compromised',
          ],
        },
      ]);

      /* ── Story ↔ people ── */
      await linkStoryPersonRow(
        m,
        tembisaStory.id,
        pBabita.id,
        'Whistleblower · Assassinated 2021',
        true,
      );
      await linkStoryPersonRow(
        m,
        tembisaStory.id,
        pMaumela.id,
        'alleged syndicate leader (Maumela cluster)',
        true,
      );
      await linkStoryPersonRow(
        m,
        tembisaStory.id,
        (
          await m.getRepository(Person).findOneOrFail({
            where: { full_name: 'Rudolf Mazibuko' },
          })
        ).id,
        'alleged syndicate leader (Mazibuko cluster)',
        true,
      );
      await linkStoryPersonRow(m, tembisaStory.id, pChisele.id, 'accused official', true);
      await linkStoryPersonRow(
        m,
        tembisaStory.id,
        (await m.getRepository(Person).findOneOrFail({ where: { full_name: 'Papi Tsie' } }))
          .id,
        'accused Hawks sergeant',
        false,
      );
      await linkStoryPersonRow(
        m,
        tembisaStory.id,
        (await m.getRepository(Person).findOneOrFail({ where: { full_name: 'Lerato Madyo' } }))
          .id,
        'accused former CFO',
        true,
      );
      await linkStoryPersonRow(
        m,
        tembisaStory.id,
        (await m.getRepository(Person).findOneOrFail({ where: { full_name: 'Ashley Mthunzi' } }))
          .id,
        'implicated former CEO (deceased)',
        false,
      );
      await linkStoryPersonRow(
        m,
        tembisaStory.id,
        pMatlala.id,
        'alleged syndicate nexus across hospital and police tender lines',
        true,
      );

      const p12 = await m.getRepository(Person).findOneOrFail({
        where: { full_name: '12 Senior SAPS Officers (Medicare24 accused)' },
      });

      await linkStoryPersonRow(m, medicareStory.id, pMatlala.id, 'accused company principal', true);
      await linkStoryPersonRow(
        m,
        medicareStory.id,
        (
          await m.getRepository(Person).findOneOrFail({
            where: { full_name: 'Fannie Masemola' },
          })
        ).id,
        'summonsed National Commissioner',
        true,
      );
      if (pMchunu) {
        await linkStoryPersonRow(
          m,
          medicareStory.id,
          pMchunu.id,
          'Minister of Police (special leave) — alleged political shielding narratives',
          true,
        );
      }
      await linkStoryPersonRow(
        m,
        medicareStory.id,
        pCarrim.id,
        'accused fixer / enabler (denies)',
        true,
      );
      await linkStoryPersonRow(m, medicareStory.id, p12.id, 'accused SAPS command cluster', false);
      if (pMogotsi) {
        await linkStoryPersonRow(
          m,
          medicareStory.id,
          pMogotsi.id,
          'businessman tied to ministerial office comms (public reporting)',
          false,
        );
      }
      await linkStoryPersonRow(
        m,
        medicareStory.id,
        pMaumela.id,
        'alleged Tembisa syndicate figure — network cross-reference',
        false,
      );

      /* ── Madlanga commission ↔ Carrim ── */
      const madlanga = await m.getRepository(Commission).findOne({
        where: { slug: MADLANGA_COMMISSION_SLUG },
      });
      if (!madlanga) {
        throw new Error(`Commission ${MADLANGA_COMMISSION_SLUG} missing — run mkhwanazi seed first`);
      }
      const cpRepo = m.getRepository(CommissionPerson);
      let cp = await cpRepo.findOne({
        where: {
          commission_id: madlanga.id,
          person_id: pCarrim.id,
          role: CommissionPersonRole.WITNESS,
        },
      });
      const cpPayload = {
        commission_id: madlanga.id,
        person_id: pCarrim.id,
        role: CommissionPersonRole.WITNESS,
        summary:
          'Implicated in testimony strands referencing alleged links between Matlala, Mogotsi, Minister Mchunu and SAPS payment lines; R1.5m payment after SAPS deposits; subpoena litigation; medical postponements (2026). Denies wrongdoing.',
      };
      if (!cp) {
        cp = cpRepo.create(cpPayload);
        await cpRepo.save(cp);
      } else {
        Object.assign(cp, cpPayload);
        await cpRepo.save(cp);
      }

      /* ── Mkhwanazi story additions ── */
      const mkStory = await storyRepo.findOne({ where: { slug: MKHWANAZI_STORY_SLUG } });
      if (!mkStory) {
        throw new Error(`Story ${MKHWANAZI_STORY_SLUG} missing — run mkhwanazi seed first`);
      }

      await linkStoryPersonRow(
        m,
        mkStory.id,
        pCarrim.id,
        'witness (implicated — commission subpoena)',
        true,
      );

      const mkExtra: TimelineSeedRow[] = [
        {
          event_date: '2025-10-01',
          event_type: EventType.INCIDENT,
          title: 'Madlanga Commission: Carrim evidence framework outlined',
          description:
            'The commission publicly framed Carrim\'s expected evidence areas — ties to Matlala, Mchunu, Sibiya and Mogotsi.',
          plain_english:
            'The judge-led inquiry said it wanted Carrim to explain his alleged links to police leaders and businessmen.',
          significance: EventSignificance.MEDIUM,
          legal_links: [],
        },
        {
          event_date: '2026-01-01',
          event_type: EventType.INCIDENT,
          title: 'WhatsApp disclosures — Matlala and Deokaran investigation overlap',
          description:
            'Reporting referenced WhatsApp threads between Matlala and a senior Hawks figure that investigators said could touch Deokaran before her murder — meaning is disputed.',
          plain_english:
            'Leaked chats may tie an alleged crime boss to knowledge about a dead whistleblower — lawyers still fight over what it means.',
          significance: EventSignificance.CRITICAL,
          legal_links: [],
        },
        {
          event_date: '2026-02-05',
          event_type: EventType.JUDGMENT,
          title: 'Carrim High Court bid struck from roll — punitive costs',
          description:
            'A Gauteng High Court judge struck Carrim\'s attempt to block commission testimony, citing procedural rush and abuse angling.',
          plain_english:
            'A judge said Carrim tried the wrong shortcut to dodge the commission and made him pay extra legal costs.',
          significance: EventSignificance.HIGH,
          legal_links: [],
        },
        {
          event_date: '2026-02-06',
          event_type: EventType.HEARING,
          title: 'Carrim postponement — March 2026 hearing window noted',
          description:
            'Commission secretariat granted preparation time after litigation folded.',
          plain_english:
            'Carrim got more time to prepare after the court loss.',
          significance: EventSignificance.MEDIUM,
          legal_links: [],
        },
        {
          event_date: '2026-03-25',
          event_type: EventType.HEARING,
          title: 'Medicare24 SAPS prosecutions — first major criminal court roll (Pretoria)',
          description:
            '12 members plus representative charges on the Medicare24 tender migrated from oversight headlines into the criminal roll.',
          plain_english:
            'The Medicare tender story Mkhwanazi shouted about moved into open court.',
          significance: EventSignificance.CRITICAL,
          legal_links: [],
        },
        {
          event_date: '2026-04-28',
          event_type: EventType.HEARING,
          title: 'Carrim medical certificate — commission testimony deferred again',
          description:
            'After a reported medical emergency, Carrim remained absent; commission leadership discussed whether to withdraw his subpoena.',
          plain_english:
            'He got sick and could not testify; commissioners debated what to do next.',
          significance: EventSignificance.MEDIUM,
          legal_links: [],
        },
      ];

      await upsertTimelineRows(m, mkStory.id, mkExtra, lawMap, constitutionSections);

      /* ── Similar stories ── */
      await upsertSimilarPair(
        m,
        TEMBISA_SLUG,
        MKHWANAZI_STORY_SLUG,
        SimilarityReason.SAME_PATTERN,
        'Both involve Matlala-network allegations and 2026 WhatsApp reporting tying him to Deokaran knowledge lines.',
      );
      await upsertSimilarPair(
        m,
        TEMBISA_SLUG,
        'gauteng-sassa-r260m-fraud-2025',
        SimilarityReason.SAME_PROVINCE,
        'Both Gauteng public-sector money-laundering and grants/health procurement stress lines.',
      );
      await upsertSimilarPair(
        m,
        MEDICARE_SLUG,
        MKHWANAZI_STORY_SLUG,
        SimilarityReason.SAME_ACCUSED,
        'Matlala and the Medicare tender are central to both threads.',
      );
      await upsertSimilarPair(
        m,
        TEMBISA_SLUG,
        MEDICARE_SLUG,
        SimilarityReason.SAME_ACCUSED,
        'Matlala-linked corporate vehicles appear in both hospital and police procurement allegations.',
      );
      await upsertSimilarPair(
        m,
        MEDICARE_SLUG,
        'cape-town-r1-6bn-tender-fraud-2025',
        SimilarityReason.SAME_CATEGORY,
        'Both are large municipal/procurement tender-fraud accountability arcs.',
      );

      console.log('  ✓ new-stories-2026 seed complete');
    });

    console.log('──────────────────────────────────────────────');
    console.log('✓ New stories 2026 complete.\n');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  run().catch((err: unknown) => {
    console.error('\n✗ Seed failed:', err);
    process.exit(1);
  });
}
