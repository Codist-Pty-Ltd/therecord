/* eslint-disable no-console */

/**
 * Accountability bodies: Scorpions (DSO), Hawks (DPCI), IDAC.
 * Notable Scorpions cases, Khampepe commission link, Scorpions timeline story.
 *
 * Idempotent upserts. Requires migrations (accountability_bodies tables) and
 * prior seeds: commissions-master (Khampepe), mkhwanazi (unchanged).
 *
 * Run:
 *   npm run seed:accountability-bodies   (after `nest build`)
 *   or via `npm run seed:all`
 */

import 'reflect-metadata';

import type { EntityManager } from 'typeorm';

import {
  AccountabilityBody,
  AccountabilityBodyStatus,
  AccountabilityBodyType,
} from '../../entities/accountability-body.entity';
import {
  AccountabilityBodyCase,
  AccountabilityBodyCaseOutcome,
  AccountabilityBodyCaseSignificance,
} from '../../entities/accountability-body-case.entity';
import { Commission } from '../../entities/commission.entity';
import { EventLegalReference } from '../../entities/event_legal_reference.entity';
import { Law, LawCategory } from '../../entities/law.entity';
import { LawSection } from '../../entities/law_section.entity';
import {
  Story,
  StoryCategory,
  StoryDomain,
  StoryStatus,
} from '../../entities/story.entity';
import {
  EventSignificance,
  EventType,
  TimelineEvent,
} from '../../entities/timeline_event.entity';
import { AppDataSource } from '../data-source';

const SCORPIONS_SLUG = 'scorpions-dso';
const STORY_SLUG = 'scorpions-dso-rise-and-fall';
const MKHWANAZI_SLUG = 'mkhwanazi-madlanga-commission';
const KHAMPEPE_SLUG = 'khampepe-commission-scorpions';

async function ensureNpaActSection7(m: EntityManager): Promise<LawSection | null> {
  const lawRepo = m.getRepository(Law);
  const sectionRepo = m.getRepository(LawSection);

  let law = await lawRepo.findOne({ where: { short_name: 'NPA Act' } });
  if (!law) {
    law = lawRepo.create({
      short_name: 'NPA Act',
      name: 'National Prosecuting Authority Act',
      act_number: '32 of 1998',
      category: LawCategory.PROSECUTION,
      plain_english:
        'The law that creates the National Prosecuting Authority, says how prosecutors are appointed, and guarantees they can decide who to charge independently of politicians.',
      full_text_url: 'https://www.gov.za/documents/national-prosecuting-authority-act',
    });
    law = await lawRepo.save(law);
  }

  let section = await sectionRepo.findOne({
    where: { law_id: law.id, section_number: 'Section 7' },
  });
  if (!section) {
    section = sectionRepo.create({
      law_id: law.id,
      section_number: 'Section 7',
      section_title: 'Investigating directorate and other specialised units',
      plain_english:
        'Allows the National Prosecuting Authority to establish investigative directorates and combine prosecutors, investigators and analysts to tackle serious organised crime and corruption.',
      full_text: null,
    });
    section = await sectionRepo.save(section);
  }

  return section;
}

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized
    ? AppDataSource
    : await AppDataSource.initialize();

  console.log('\n── Seeding: Accountability bodies (Scorpions, Hawks, IDAC) ──');

  try {
    await dataSource.transaction(async (m) => {
      const bodyRepo = m.getRepository(AccountabilityBody);
      const caseRepo = m.getRepository(AccountabilityBodyCase);
      const commissionRepo = m.getRepository(Commission);
      const storyRepo = m.getRepository(Story);
      const eventRepo = m.getRepository(TimelineEvent);
      const refRepo = m.getRepository(EventLegalReference);

      // ── Bodies ──────────────────────────────────────────────────────────

      const scorpionsData: Partial<AccountabilityBody> = {
        name: 'Directorate of Special Operations',
        popular_name: 'The Scorpions',
        abbreviation: 'DSO',
        slug: SCORPIONS_SLUG,
        body_type: AccountabilityBodyType.HYBRID,
        parent_organisation: 'National Prosecuting Authority',
        enabling_legislation:
          'National Prosecuting Authority Act 32 of 1998, Section 7',
        constitution_section: 'Section 179(1)',
        status: AccountabilityBodyStatus.DISBANDED,
        established_date: '1999-09-01',
        announced_date: '1999-06-01',
        operational_date: '2001-01-12',
        disbanded_date: '2009-01-01',
        replaced_by: 'Directorate for Priority Crime Investigation (Hawks)',
        disbanded_reason:
          'The ANC resolved at its 52nd National Conference at Polokwane in December 2007 to disband the Scorpions and move their functions to SAPS. Parliament passed the amendments on 23 October 2008 (252 votes to 63). President Kgalema Motlanthe signed them into law in January 2009. The move was widely criticised as politically motivated — the Scorpions were at the time investigating Jacob Zuma and his allies over the Arms Deal. The last raid the Scorpions ever conducted was on BAE Systems offices in November 2008, linked to the Arms Deal probe.',
        mandate_summary:
          'To investigate and prosecute serious organised crime and high-level corruption using an integrated "troika" approach combining prosecutors, criminal investigators, and forensic analysts in one team. Unlike SAPS, the Scorpions sat within the NPA — enabling prosecution-led investigations where prosecutors directed evidence collection from the start.',
        plain_english_summary:
          "The Scorpions were South Africa's most powerful anti-corruption unit. They combined the skills of detectives, forensic accountants, and prosecutors into one team — meaning they could investigate AND prosecute the same case. They were known for raiding the homes of very powerful politicians. They had a conviction rate of over 90%. They were disbanded in 2009 after the ANC conference in Polokwane voted to shut them down — a decision many believe was made to protect politicians being investigated.",
        plain_english_child:
          'Imagine a special school squad whose job was to catch cheaters at the very top. They had detectives, maths experts (forensic accountants), and the teachers who decide punishment (prosecutors) — all working together. They caught nearly everyone they went after. Then the school leaders voted to shut them down. Many people believe it was because the squad was getting too close to catching the school leaders themselves.',
        tactics:
          'The "troika model" or "prosecution-led" approach: criminal investigators collected evidence, forensic analysts examined it, and prosecutors directed both — building legally airtight cases from day one. Known for dramatic search-and-seizure operations using black Golf GTIs. First unit in South Africa to achieve money-laundering and racketeering convictions. Worked internationally with UK and US agencies.',
        distinguishing_features:
          'Sat within the NPA (not SAPS) — giving it prosecutorial independence. Could both investigate AND prosecute the same case. Had the power to arrest (unlike commissions and the SIU). Had subpoena powers. Was not subject to the Police Commissioner (who at the time was being investigated by the Scorpions themselves). This independence is what made it effective — and what made it a target.',
        leadership_history: [
          {
            name: 'Frank Dutton',
            title: 'Deputy Director: Investigations',
            period_start: '1999',
            period_end: '2001',
          },
          {
            name: 'Percy Sonn',
            title: 'Deputy NDPP: DSO',
            period_start: '2001',
            period_end: '2003',
          },
          {
            name: 'Leonard McCarthy',
            title: 'Deputy NDPP: DSO',
            period_start: '2003',
            period_end: '2008',
          },
        ],
        total_investigations: 641,
        total_prosecutions: 594,
        total_convictions: 549,
        conviction_rate_percentage: '93.10',
        total_arrests: 617,
        assets_seized_rands: '2000000000',
        financial_losses_recovered_rands: null,
        cases_transferred_on_dissolution: 287,
        staff_count_at_peak: 536,
        annual_budget_rands: '429000000',
        legacy_summary:
          'The 287 cases transferred to the Hawks produced 38 convictions from 261 arrests — a dramatic drop in outcomes. ANC stalwart and former Limpopo Premier Stanley Mathabatha later admitted: "The mistake was to destroy the good structures that we had established... I still believe it was a fundamental mistake to do away with the Scorpions." Former Zondo Commission chair Raymond Zondo also criticised the disbanding. In 2024 Parliament amended the NPA Act to create IDAC — widely seen as a partial attempt to restore Scorpions-style capabilities.',
        cases_outcome_after_transfer:
          "287 cases transferred to Hawks/SAPS in 2008. 164 transferred to Commercial Crime units. 48 to Organised Crime units. 17 to OCPI approach. 55 ready for closure. 261 arrests from these cases produced only 38 convictions — compared to the Scorpions' 93.1% rate. The Arms Deal investigation, which the Scorpions had been actively pursuing including the BAE Systems raid in November 2008, was quietly shut down by the Hawks after the transfer.",
        was_political_disbanding: true,
        political_disbanding_evidence:
          '1. The ANC Polokwane conference vote coincided with Jacob Zuma — who was being investigated by the Scorpions — winning the ANC presidency. 2. The Scorpions had reinstated corruption charges against Zuma at the time of disbanding. 3. Their last investigation was into BAE Systems in the Arms Deal — directly linked to Zuma. 4. The Hawks subsequently dropped the Arms Deal investigation. 5. The Constitutional Court later ruled in the Glenister cases that the Hawks lacked sufficient independence and were open to political interference. 6. ANC leaders have since publicly admitted disbanding the Scorpions was a mistake.',
      };

      let scorpions = await bodyRepo.findOne({ where: { slug: SCORPIONS_SLUG } });
      if (!scorpions) {
        scorpions = bodyRepo.create(scorpionsData as AccountabilityBody);
      } else {
        Object.assign(scorpions, scorpionsData);
      }
      scorpions = await bodyRepo.save(scorpions);
      console.log(`  · Upserted body: ${scorpions.popular_name} (${scorpions.id})`);

      const hawksData: Partial<AccountabilityBody> = {
        name: 'Directorate for Priority Crime Investigation',
        popular_name: 'The Hawks',
        abbreviation: 'DPCI',
        slug: 'hawks-dpci',
        body_type: AccountabilityBodyType.INVESTIGATIVE_UNIT,
        parent_organisation: 'South African Police Service',
        enabling_legislation: 'South African Police Service Amendment Act 57 of 2008',
        constitution_section: null,
        status: AccountabilityBodyStatus.ACTIVE,
        established_date: '2009-01-01',
        announced_date: null,
        operational_date: '2009-07-01',
        disbanded_date: null,
        replaced_by: null,
        disbanded_reason: null,
        mandate_summary:
          'To investigate national priority crimes including serious organised crime, serious commercial crime, serious corruption, and crimes against the state. Operates within SAPS — unlike the Scorpions which was within the NPA.',
        plain_english_summary:
          'The Hawks replaced the Scorpions in 2009. They investigate serious corruption and organised crime — but unlike the Scorpions, they cannot prosecute. They are part of the police, not the NPA. Critics say this makes them more vulnerable to political interference. The Constitutional Court ruled twice (2011 and 2014) that the Hawks lacked sufficient independence and ordered Parliament to fix this. Their conviction rate is significantly lower than the Scorpions.',
        plain_english_child:
          'The Hawks are like the replacement squad after the Scorpions were shut down. They investigate, but they cannot arrest AND prosecute like the Scorpions could. Critics say they are not as independent or as effective.',
        tactics: null,
        distinguishing_features:
          'Falls under SAPS (not NPA). Cannot prosecute — must refer to NPA for prosecution. Subject to Police Commissioner oversight. Constitutional Court found twice that it lacked sufficient independence. Detection rate approximately 50%; court-ready case percentage 35% (25.6% for commercial crimes) — far below Scorpions standards.',
        leadership_history: null,
        total_investigations: null,
        total_prosecutions: null,
        total_convictions: null,
        conviction_rate_percentage: '50.00',
        total_arrests: null,
        assets_seized_rands: null,
        financial_losses_recovered_rands: null,
        cases_transferred_on_dissolution: null,
        staff_count_at_peak: null,
        annual_budget_rands: null,
        legacy_summary: null,
        cases_outcome_after_transfer: null,
        was_political_disbanding: false,
        political_disbanding_evidence: null,
      };

      let hawks = await bodyRepo.findOne({ where: { slug: 'hawks-dpci' } });
      if (!hawks) {
        hawks = bodyRepo.create(hawksData as AccountabilityBody);
      } else {
        Object.assign(hawks, hawksData);
      }
      hawks = await bodyRepo.save(hawks);
      console.log(`  · Upserted body: ${hawks.popular_name} (${hawks.id})`);

      const idacData: Partial<AccountabilityBody> = {
        name: 'Investigating Directorate Against Corruption',
        popular_name: 'IDAC',
        abbreviation: 'IDAC',
        slug: 'idac',
        body_type: AccountabilityBodyType.INVESTIGATIVE_UNIT,
        parent_organisation: 'National Prosecuting Authority',
        enabling_legislation: 'National Prosecuting Authority Amendment Act 10 of 2024',
        constitution_section: 'Section 179(1)',
        status: AccountabilityBodyStatus.ACTIVE,
        established_date: '2024-04-22',
        announced_date: '2022-04-22',
        operational_date: '2024-04-22',
        disbanded_date: null,
        replaced_by: null,
        disbanded_reason: null,
        mandate_summary:
          'To investigate serious corruption, including state capture matters identified by the Zondo Commission. Operates within the NPA — returning the anti-corruption investigative function to its pre-2009 home. Does not yet have full Scorpions-equivalent powers — cannot appoint investigators with full police powers under current legislation.',
        plain_english_summary:
          'IDAC is the newest attempt to create a Scorpions-like unit. It sits within the NPA, not the police — like the Scorpions. It was made permanent in 2024 after operating as a temporary Investigating Directorate since 2019. Critics say it still lacks the full powers the Scorpions had — particularly the ability to appoint investigators with full police powers. The NPA has called for legislative amendments to give IDAC these powers.',
        plain_english_child:
          'IDAC is the new version of the Scorpions. It is trying to do what the Scorpions did. But some people say it does not yet have enough power to do the job properly.',
        tactics: null,
        distinguishing_features:
          'Permanently established by Act of Parliament in 2024. Sits within NPA (like Scorpions, unlike Hawks). Focuses specifically on state capture and Zondo Commission referrals. Does not yet have prosecution-led investigative powers equivalent to Scorpions. NPA has publicly called for legislative amendments to restore full powers.',
        leadership_history: null,
        total_investigations: null,
        total_prosecutions: null,
        total_convictions: null,
        conviction_rate_percentage: null,
        total_arrests: null,
        assets_seized_rands: null,
        financial_losses_recovered_rands: null,
        cases_transferred_on_dissolution: null,
        staff_count_at_peak: null,
        annual_budget_rands: null,
        legacy_summary: null,
        cases_outcome_after_transfer: null,
        was_political_disbanding: false,
        political_disbanding_evidence: null,
      };

      let idac = await bodyRepo.findOne({ where: { slug: 'idac' } });
      if (!idac) {
        idac = bodyRepo.create(idacData as AccountabilityBody);
      } else {
        Object.assign(idac, idacData);
      }
      idac = await bodyRepo.save(idac);
      console.log(`  · Upserted body: ${idac.popular_name} (${idac.id})`);

      // ── Scorpions cases ─────────────────────────────────────────────────

      const caseSeeds: Array<Partial<AccountabilityBodyCase>> = [
        {
          case_name: 'State v Schabir Shaik — Arms Deal Corruption',
          accused_names: ['Schabir Shaik'],
          charge_summary:
            'Corruption — paying bribes to Jacob Zuma for political protection in connection with the Arms Deal',
          case_year_start: 2001,
          case_year_end: 2005,
          outcome: AccountabilityBodyCaseOutcome.CONVICTED,
          outcome_detail:
            'Convicted 8 June 2005. Sentenced to 15 years. Released on medical parole in 2009 after serving 2 years — the parole decision was itself controversial. Medical parole later revoked but not implemented. Shaik played golf and attended public events while officially on medical parole.',
          significance: AccountabilityBodyCaseSignificance.LANDMARK,
          value_rands: '1200000000',
          plain_english:
            'The man who paid bribes to Jacob Zuma was convicted. He went to prison but was released early, supposedly because he was very sick. He was then photographed playing golf.',
          law_sections_applied: ['PRECCA Section 3', 'NPA Act Section 7'],
        },
        {
          case_name: 'State v Tony Yengeni — Arms Deal Fraud',
          accused_names: ['Tony Yengeni'],
          charge_summary:
            'Fraud — failing to disclose a discount on a luxury 4x4 vehicle received as a benefit from EADS, an Arms Deal supplier',
          case_year_start: 2001,
          case_year_end: 2006,
          outcome: AccountabilityBodyCaseOutcome.CONVICTED,
          outcome_detail:
            'Convicted 2006. Sentenced to 4 years. Served less than a year before parole. Returned to ANC leadership after release. He was Chief Whip of the ANC in Parliament at the time of the offence.',
          significance: AccountabilityBodyCaseSignificance.LANDMARK,
          value_rands: null,
          plain_english:
            'An ANC leader accepted a discounted luxury car from a company that was trying to win a government weapons contract. He was convicted and jailed but released early. He returned to politics after his release.',
          law_sections_applied: [],
        },
        {
          case_name: 'State v Jackie Selebi — Corruption',
          accused_names: ['Jackie Selebi', 'Glenn Agliotti'],
          charge_summary:
            'Corruption — accepting bribes from convicted drug trafficker and murder suspect Glenn Agliotti while serving as National Police Commissioner',
          case_year_start: 2006,
          case_year_end: 2010,
          outcome: AccountabilityBodyCaseOutcome.CONVICTED,
          outcome_detail:
            'Selebi convicted July 2010 — AFTER the Scorpions had been disbanded. The case was begun by the Scorpions but concluded by the NPA. Sentenced to 15 years. Released on medical parole. During the case, chief prosecutor Gerrie Nel of the Scorpions was himself briefly arrested in what was widely seen as an attempt to derail the prosecution. NPA head Vusi Pikoli was suspended while the case was active — also widely seen as interference.',
          significance: AccountabilityBodyCaseSignificance.LANDMARK,
          value_rands: null,
          plain_english:
            'The head of the entire South African police — the top cop — was convicted of taking bribes from a drug dealer. This happened while the Scorpions were already investigating corruption within the police. The prosecutor on the case was briefly arrested in what many believed was an attempt to stop the case.',
          law_sections_applied: ['PRECCA Section 3', 'POCA Section 4'],
        },
        {
          case_name: 'State v Multiple MPs — Travelgate Parliamentary Fraud',
          accused_names: ['Bathabile Dlamini', '50+ ANC MPs and staff'],
          charge_summary:
            'Fraud — misuse of parliamentary travel vouchers worth approximately R35 million',
          case_year_start: 2005,
          case_year_end: 2006,
          outcome: AccountabilityBodyCaseOutcome.CONVICTED,
          outcome_detail:
            'Over 30 MPs including Bathabile Dlamini convicted on fraud or related charges. 38 cases concluded. Many repaid the money. The Scorpions were the first to prosecute MPs for fraud in the history of South African democracy.',
          significance: AccountabilityBodyCaseSignificance.HIGH,
          value_rands: '35000000',
          plain_english: null,
          law_sections_applied: [],
        },
        {
          case_name: 'Investigation into Jacob Zuma — Arms Deal Corruption',
          accused_names: ['Jacob Zuma'],
          charge_summary:
            'Corruption and fraud — 780+ charges relating to accepting bribes through Schabir Shaik in connection with the Strategic Defence Package (Arms Deal)',
          case_year_start: 2001,
          case_year_end: 2009,
          outcome: AccountabilityBodyCaseOutcome.TRANSFERRED_TO_NPA,
          outcome_detail:
            'The Scorpions investigated Zuma and reinstated charges against him at the time of their dissolution. The case was transferred when the Scorpions were disbanded. Charges were subsequently dropped by the NPA in 2009 in a controversial decision — later found by courts to have been improperly made. The case was reinstated in 2018 and remains before court as of 2025 with no verdict.',
          significance: AccountabilityBodyCaseSignificance.LANDMARK,
          value_rands: '70000000000',
          plain_english:
            'The Scorpions were closing in on Jacob Zuma when they were shut down. The charges were dropped after the Scorpions were disbanded. 16 years later, the case is still in court. No verdict has been reached.',
          law_sections_applied: ['PRECCA Section 3', 'Racketeering Act'],
        },
        {
          case_name: 'State v Mark Thatcher — Mercenary Activity',
          accused_names: ['Mark Thatcher'],
          charge_summary:
            'Financing a mercenary operation — coup attempt in Equatorial Guinea',
          case_year_start: 2004,
          case_year_end: 2004,
          outcome: AccountabilityBodyCaseOutcome.PLEA_DEAL,
          outcome_detail:
            'Arrested at his Cape Town home August 2004. Pleaded guilty in the Cape Town High Court. Fined R3 million and given a suspended sentence. Deported from South Africa. Son of former UK Prime Minister Margaret Thatcher.',
          significance: AccountabilityBodyCaseSignificance.HIGH,
          value_rands: '3000000',
          plain_english: null,
          law_sections_applied: [],
        },
        {
          case_name: 'BAE Systems Arms Deal Investigation',
          accused_names: ['BAE Systems', 'Multiple executives'],
          charge_summary:
            'Bribery in connection with the Strategic Defence Package — the Arms Deal',
          case_year_start: 2001,
          case_year_end: 2009,
          outcome: AccountabilityBodyCaseOutcome.TRANSFERRED_TO_HAWKS,
          outcome_detail:
            "The Scorpions' final ever operation was a raid on BAE Systems offices in Pretoria and Cape Town in November 2008 — two months before the Scorpions were disbanded. The case was transferred to the Hawks. BAE later settled with UK/US authorities for £280m in 2010 but faced no South African prosecution.",
          significance: AccountabilityBodyCaseSignificance.LANDMARK,
          value_rands: '70000000000',
          plain_english: null,
          law_sections_applied: [],
        },
      ];

      for (const cs of caseSeeds) {
        let row = await caseRepo.findOne({
          where: { body_id: scorpions.id, case_name: cs.case_name as string },
        });
        const payload: Partial<AccountabilityBodyCase> = {
          body_id: scorpions.id,
          story_id: null,
          case_name: cs.case_name,
          accused_names: cs.accused_names ?? [],
          charge_summary: cs.charge_summary ?? null,
          case_year_start: cs.case_year_start as number,
          case_year_end: cs.case_year_end ?? null,
          outcome: cs.outcome as AccountabilityBodyCaseOutcome,
          outcome_detail: cs.outcome_detail ?? null,
          significance: cs.significance ?? AccountabilityBodyCaseSignificance.MEDIUM,
          value_rands: cs.value_rands ?? null,
          plain_english: cs.plain_english ?? null,
          law_sections_applied: cs.law_sections_applied ?? [],
        };
        if (!row) {
          row = caseRepo.create(payload as AccountabilityBodyCase);
        } else {
          Object.assign(row, payload);
        }
        await caseRepo.save(row);
      }
      console.log(`  · Upserted ${caseSeeds.length} Scorpions cases`);

      // ── Khampepe commission → subject_body ─────────────────────────────

      const khampepe = await commissionRepo.findOne({ where: { slug: KHAMPEPE_SLUG } });
      if (khampepe) {
        khampepe.subject_body_id = scorpions.id;
        await commissionRepo.save(khampepe);
        console.log(`  · Linked commission ${KHAMPEPE_SLUG} → Scorpions (subject_body)`);
      } else {
        console.warn(`  · Commission ${KHAMPEPE_SLUG} not found — skip subject_body link`);
      }

      // ── Mkhwanazi story: do not link to Scorpions (explicit) ────────────

      const mkhwanazi = await storyRepo.findOne({ where: { slug: MKHWANAZI_SLUG } });
      if (mkhwanazi && mkhwanazi.accountability_body_id != null) {
        mkhwanazi.accountability_body_id = null;
        await storyRepo.save(mkhwanazi);
        console.log(`  · Cleared accountability_body on ${MKHWANAZI_SLUG} (SAPS story)`);
      } else if (mkhwanazi) {
        console.log(`  · ${MKHWANAZI_SLUG} has no Scorpions link (ok)`);
      } else {
        console.warn(`  · Story ${MKHWANAZI_SLUG} not found`);
      }

      // ── Scorpions arc story + timeline ─────────────────────────────────

      const storySummary =
        "How the NPA's Scorpions unit achieved industry-leading conviction rates, investigated the Arms Deal and top politicians, and was disbanded after a 2007 ANC resolution — with lasting consequences for accountability.";

      const lay =
        "South Africa had the most effective corruption-busting unit in the country's history. It had a conviction rate of over 90%. It was investigating the most powerful politicians in the country. And then it was voted out of existence by the people it was investigating.";
      const child =
        'The best crime-catching squad in the country was shut down by the people they were catching. It is like if the best teacher who caught cheaters was fired by the cheaters.';

      let arcStory = await storyRepo.findOne({ where: { slug: STORY_SLUG } });
      const storyPayload: Partial<Story> = {
        title: 'The Scorpions: Rise, Success, and Political Destruction',
        slug: STORY_SLUG,
        domain: StoryDomain.CRIMINAL_JUSTICE,
        story_category: StoryCategory.OTHER,
        status: StoryStatus.RESOLVED,
        accountability_body_id: scorpions.id,
        summary: storySummary,
        plain_english_summary: `${lay}\n\n${child}`,
      };

      if (!arcStory) {
        arcStory = storyRepo.create(storyPayload as Story);
      } else {
        Object.assign(arcStory, storyPayload);
      }
      arcStory = await storyRepo.save(arcStory);
      console.log(`  · Upserted story: ${STORY_SLUG}`);

      const npaS7 = await ensureNpaActSection7(m);

      type EvSpec = {
        event_date: string;
        event_type: EventType;
        title: string;
        description: string;
        plain_english: string;
        significance: EventSignificance;
        law_ref?: boolean;
      };

      const eventSpecs: EvSpec[] = [
        {
          event_date: '1999-06-01',
          event_type: EventType.STATEMENT,
          title: 'Mbeki announces the Scorpions',
          description:
            'President Thabo Mbeki publicly announces the creation of the Directorate of Special Operations within the National Prosecuting Authority — a new unit to tackle organised crime and corruption with prosecutors working alongside investigators.',
          plain_english:
            'The President told the country that a new, very serious police-and-lawyers team would be formed to catch big criminals and corrupt powerful people.',
          significance: EventSignificance.HIGH,
        },
        {
          event_date: '2001-01-01',
          event_type: EventType.INCIDENT,
          title: 'Scorpions launch Arms Deal investigation',
          description:
            'The Scorpions open investigations into corruption and fraud surrounding the Strategic Defence Package (Arms Deal), including relationships between officials, middlemen and arms manufacturers.',
          plain_english:
            'The new unit started looking into the massive government weapons purchase — who got money and whether anyone was bribed.',
          significance: EventSignificance.HIGH,
        },
        {
          event_date: '2001-01-12',
          event_type: EventType.INCIDENT,
          title: 'Scorpions become legally operational',
          description:
            'The Directorate of Special Operations takes up its formal powers under the NPA Act — investigators, analysts and prosecutors begin operating as one team nationwide.',
          plain_english:
            'The Scorpions were now officially allowed to search, arrest and prosecute as one combined team.',
          significance: EventSignificance.MEDIUM,
        },
        {
          event_date: '2003-01-01',
          event_type: EventType.HEARING,
          title: 'Winnie Madikizela-Mandela prosecuted for fraud',
          description:
            'The Scorpions prosecute Winnie Madikizela-Mandela on fraud charges related to misuse of letters on official letterheads — part of their early high-profile fraud work.',
          plain_english:
            'A famous political figure faced fraud charges brought by the Scorpions.',
          significance: EventSignificance.MEDIUM,
        },
        {
          event_date: '2004-08-01',
          event_type: EventType.ARREST,
          title: 'Mark Thatcher arrested in Cape Town',
          description:
            'Sir Mark Thatcher is arrested at his Cape Town home over financing linked to an alleged coup plot in Equatorial Guinea — a high-profile Scorpions case with international dimensions.',
          plain_english:
            'The son of a British Prime Minister was arrested in South Africa over money linked to an alleged plot to overthrow another country’s government.',
          significance: EventSignificance.HIGH,
        },
        {
          event_date: '2005-04-01',
          event_type: EventType.COMMISSION_ESTABLISHED,
          title: 'Khampepe Commission begins',
          description:
            'President Mbeki appoints Justice Khampepe to review operations of the Scorpions and related NPA powers — amid political tension over prosecutorial independence and high-profile investigations.',
          plain_english:
            'A judge was asked to review whether the Scorpions were working properly and whether their powers were fair.',
          significance: EventSignificance.HIGH,
        },
        {
          event_date: '2005-06-08',
          event_type: EventType.JUDGMENT,
          title: 'Schabir Shaik convicted — Zuma next in line',
          description:
            'The Durban High Court convicts Schabir Shaik on corruption counts tied to payments benefitting Jacob Zuma — a landmark Scorpions prosecution in the Arms Deal saga.',
          plain_english:
            'The businessman who paid money to help Zuma was found guilty — and attention turned to whether Zuma himself would face trial.',
          significance: EventSignificance.CRITICAL,
        },
        {
          event_date: '2005-08-18',
          event_type: EventType.INCIDENT,
          title: 'Scorpions raid Jacob Zuma’s home',
          description:
            'The Scorpions execute search-and-seizure operations at the home of then-ANC deputy president Jacob Zuma as part of ongoing Arms Deal corruption investigations.',
          plain_english:
            'The anti-corruption unit searched the house of a man who was about to become one of the country’s most powerful politicians.',
          significance: EventSignificance.CRITICAL,
        },
        {
          event_date: '2006-01-01',
          event_type: EventType.INCIDENT,
          title: 'Selebi investigation begins',
          description:
            'The Scorpions open an investigation into National Police Commissioner Jackie Selebi over alleged links to convicted drug figure Glenn Agliotti.',
          plain_english:
            'The unit started investigating whether the country’s top police officer was taking money from a criminal.',
          significance: EventSignificance.HIGH,
        },
        {
          event_date: '2006-06-01',
          event_type: EventType.JUDGMENT,
          title: 'Khampepe Commission recommends keeping the Scorpions',
          description:
            "Justice Khampepe’s report is finalised, recommending that the Scorpions retain investigative and prosecutorial capacity within the NPA framework — advice later overtaken by the ANC’s Polokwane resolution.",
          plain_english:
            'The review said the Scorpions should stay — but politicians chose a different path not long afterwards.',
          significance: EventSignificance.HIGH,
        },
        {
          event_date: '2006-11-01',
          event_type: EventType.JUDGMENT,
          title: 'Tony Yengeni convicted',
          description:
            'Tony Yengeni is convicted on fraud-related charges over an undisclosed discount on a luxury vehicle linked to an Arms Deal supplier.',
          plain_english:
            'A senior ANC MP was convicted for not declaring a cheap car deal tied to the weapons purchase.',
          significance: EventSignificance.HIGH,
        },
        {
          event_date: '2007-12-01',
          event_type: EventType.INCIDENT,
          title: 'ANC Polokwane conference votes to disband the Scorpions',
          description:
            'At the ANC’s 52nd national conference in Polokwane, delegates resolve to dissolve the Scorpions and transfer their functions to the South African Police Service — a structural shift away from NPA-led investigations.',
          plain_english:
            'At the ANC conference where Jacob Zuma became ANC president, the party also voted to shut down the unit investigating him.',
          significance: EventSignificance.CRITICAL,
          law_ref: true,
        },
        {
          event_date: '2008-10-23',
          event_type: EventType.JUDGMENT,
          title: 'Parliament votes 252–63 to abolish the Scorpions',
          description:
            'The National Assembly passes legislation to repeal the Scorpions’ standalone NPA structure — implementing the Polokwane political resolution with a large majority.',
          plain_english:
            'MPs voted to change the law so the Scorpions would cease to exist as they were.',
          significance: EventSignificance.CRITICAL,
        },
        {
          event_date: '2008-11-01',
          event_type: EventType.INCIDENT,
          title: 'Final Scorpions raid — BAE Systems',
          description:
            'In one of their last major operations, the Scorpions raid BAE Systems premises linked to Arms Deal bribery allegations — weeks before the unit is formally dismantled.',
          plain_english:
            'The unit raided a major arms company’s offices just before being shut down.',
          significance: EventSignificance.CRITICAL,
        },
        {
          event_date: '2009-01-01',
          event_type: EventType.INCIDENT,
          title: 'Scorpions officially disbanded — Hawks activated',
          description:
            'The DSO is dissolved and investigative mandates move toward the new Hawks structure under SAPS; 287 matters are transferred, with widely reported drops in prosecution outcomes compared to Scorpions-era performance.',
          plain_english:
            'The best anti-corruption unit in SA history ceased to exist. 287 cases were transferred. The Arms Deal investigation was dropped.',
          significance: EventSignificance.CRITICAL,
        },
        {
          event_date: '2010-07-01',
          event_type: EventType.JUDGMENT,
          title: 'Jackie Selebi convicted (case begun by Scorpions)',
          description:
            'Jackie Selebi is convicted on corruption charges — proceedings that began under the Scorpions but concluded after the unit’s dissolution under NPA prosecution.',
          plain_english:
            'The top cop was finally convicted — but the unit that started the case was already gone.',
          significance: EventSignificance.CRITICAL,
        },
        {
          event_date: '2011-09-01',
          event_type: EventType.JUDGMENT,
          title: 'Constitutional Court: Hawks lack independence (Glenister I)',
          description:
            'In Glenister v President of the Republic of South Africa, the Constitutional Court finds the Hawks structure insufficiently independent to combat corruption effectively and orders Parliament to redesign a more independent anti-corruption body.',
          plain_english:
            'The highest court said the replacement for the Scorpions was still too easy for politicians to control.',
          significance: EventSignificance.HIGH,
        },
        {
          event_date: '2024-04-22',
          event_type: EventType.INCIDENT,
          title: 'IDAC permanently established — partial Scorpions revival',
          description:
            'Parliament passes the NPA Amendment Act establishing the Investigating Directorate Against Corruption (IDAC) as a permanent NPA corruption-fighting unit — widely described as a step toward restoring capabilities lost when the Scorpions were abolished.',
          plain_english:
            'A new permanent corruption-fighting team inside the NPA was created — similar in some ways to what the Scorpions were.',
          significance: EventSignificance.HIGH,
        },
      ];

      // Remove existing timeline events for this story (idempotent re-run)
      const existingEventIds = (
        await eventRepo.find({ where: { story_id: arcStory.id }, select: ['id'] })
      ).map((e) => e.id);
      if (existingEventIds.length > 0) {
        await refRepo
          .createQueryBuilder()
          .delete()
          .from(EventLegalReference)
          .where('event_id IN (:...ids)', { ids: existingEventIds })
          .execute();
        await eventRepo
          .createQueryBuilder()
          .delete()
          .from(TimelineEvent)
          .where('id IN (:...ids)', { ids: existingEventIds })
          .execute();
      }

      for (const spec of eventSpecs) {
        let ev = eventRepo.create({
          story_id: arcStory.id,
          event_date: spec.event_date,
          event_type: spec.event_type,
          title: spec.title,
          description: spec.description,
          plain_english: spec.plain_english,
          significance: spec.significance,
          source_urls: [],
        });
        ev = await eventRepo.save(ev);

        if (spec.law_ref && npaS7) {
          const ref = refRepo.create({
            event_id: ev.id,
            law_section_id: npaS7.id,
            constitution_section_id: null,
            relevance:
              'The conference resolution targeted the NPA’s dedicated investigative directorate created under the NPA Act — the statutory home of the Scorpions’ troika model.',
            alleged_violation: false,
          });
          await refRepo.save(ref);
        }
      }

      console.log(`  · Upserted ${eventSpecs.length} timeline events on ${STORY_SLUG}`);

      console.log('──────────────────────────────────────────────');
      console.log('✓ Accountability bodies seed complete.\n');
    });
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
