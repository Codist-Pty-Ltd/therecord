/* eslint-disable no-console */

/**
 * siu.seed.ts
 *
 * Seeds the Special Investigating Unit (SIU) corpus:
 *   1. The {@link SiuBody} singleton (institutional metadata).
 *   2. The {@link SpecialTribunal} singleton (the SIU's dedicated court).
 *   3. Nine major Presidential Proclamations covering COVID-19 PPE, VBS,
 *      Transnet, SASSA, Eskom, PRASA, Gauteng schools, ACSA and SABC.
 *   4. The associated {@link SiuInvestigationOutcome} (financial recovery
 *      figures, referrals, narrative outcome) for each proclamation.
 *   5. Headline {@link SpecialTribunalCase} rows for the proclamations
 *      that have public Tribunal matters.
 *   6. {@link SiuProclamationPerson} links for SIU-implicated individuals.
 *   7. Cross-links back to {@link Commission} (Zondo) and
 *      {@link AdhocCommittee} (SABC Board Inquiry) where they exist.
 *
 * Safe to run repeatedly — every write is an upsert keyed on a stable
 * natural identifier:
 *   • SiuBody        / SpecialTribunal — singleton check (skip if a row exists)
 *   • SiuProclamation — keyed on `proclamation_number`
 *   • SiuInvestigationOutcome — keyed on `proclamation_id` (1:1)
 *   • SpecialTribunalCase — keyed on `case_number`
 *   • SiuProclamationPerson — keyed on (`proclamation_id`, `person_id`, `role`)
 *
 * Dependency order INSIDE this seed:
 *   1. People        (referenced by siu_proclamation_people)
 *   2. SiuBody       (singleton, no FKs)
 *   3. SpecialTribunal (singleton, no FKs)
 *   4. SiuProclamations (resolves related_commission / related_adhoc IDs)
 *   5. SiuInvestigationOutcomes (1:1 with proclamations)
 *   6. SpecialTribunalCases    (M:1 with proclamations)
 *   7. SiuProclamationPeople   (M:M between proclamations and people)
 *
 * Relationship to OTHER seeds:
 *   • commissions-master.seed.ts — should run BEFORE this seed so the
 *     Zondo Commission exists for Transnet, Eskom and ACSA proclamations
 *     to back-link to. If Zondo is missing the seed leaves
 *     `related_commission_id` null and logs a deferred warning.
 *
 *   • adhoc-committees.seed.ts — should run BEFORE this seed so the
 *     SABC Board Inquiry committee (`adhoc-sabc-board-2017`) exists for
 *     the Hlaudi Motsoeneng proclamation to back-link to.
 *
 *   • Several SIU-implicated individuals (Hlaudi Motsoeneng, Lucky
 *     Montana, Tshifhiwa Matodzi, Floyd Shivambu) are NOT seeded by any
 *     other seed. This seed owns them and creates them with `PersonStatus`
 *     values that reflect their actual status as of the seed date.
 *     Cyril Ramaphosa and Jacob Zuma overlap with commissions-master and
 *     adhoc-committees seeds; the upsert on `full_name` keeps the rows
 *     consistent regardless of which seed ran last.
 *
 * Run with (inside apps/api):
 *   npm run seed:siu
 */

import 'reflect-metadata';

import { In, type EntityManager } from 'typeorm';

import { AdhocCommittee } from '../../entities/adhoc_committee.entity';
import { Commission, CommissionDomain } from '../../entities/commission.entity';
import { ConstitutionSection } from '../../entities/constitution_section.entity';
import { Law, LawCategory } from '../../entities/law.entity';
import { LawSection } from '../../entities/law_section.entity';
import { Person, PersonStatus } from '../../entities/person.entity';
import { SiuBody } from '../../entities/siu_body.entity';
import { SiuInvestigationOutcome } from '../../entities/siu_investigation_outcome.entity';
import {
  ProclamationStatus,
  SiuProclamation,
} from '../../entities/siu_proclamation.entity';
import {
  SiuLawSectionUsage,
  SiuProclamationLawSection,
} from '../../entities/siu_proclamation_law_section.entity';
import {
  SiuPersonRole,
  SiuProclamationPerson,
} from '../../entities/siu_proclamation_person.entity';
import { SpecialTribunal } from '../../entities/special_tribunal.entity';
import {
  SpecialTribunalCase,
  TribunalCaseStatus,
} from '../../entities/special_tribunal_case.entity';
import { AppDataSource } from '../data-source';

// ═══════════════════════════════════════════════════════════════════════════════
// Singletons
// ═══════════════════════════════════════════════════════════════════════════════

const SIU_BODY_SEED = {
  name: 'Special Investigating Unit',
  abbreviation: 'SIU',
  enabling_legislation:
    'Special Investigating Units and Special Tribunals Act 74 of 1996',
  established_date: '1997-07-14',
  headquarters:
    'Rentmeester Building, 74 Watermeyer Street, Meyerspark, Pretoria',
  hotline: '0800 037 774',
  current_head: 'Adv Andy Mothibi (transitioning to NDPP role, 2026)',
  website_url: 'https://www.siu.org.za',
  mandate_summary:
    'To investigate serious malpractice, maladministration and corruption in state institutions, recover financial losses suffered by the state through civil litigation, and refer criminal evidence to the NPA and Hawks for prosecution. Activated by Presidential Proclamation. Operates as a forensic investigation and civil litigation agency — not a police unit.',
  plain_english_summary:
    "The SIU is a permanent government team that investigates when government money has been stolen or wasted. Unlike the police, they do not arrest people. Instead, they go to a special court to get the stolen money back. They also tell the NPA when someone has committed a crime so that person can be prosecuted. Think of them as the government's financial detectives — their job is to find the money and get it back.",
} as const;

const SPECIAL_TRIBUNAL_SEED = {
  name: 'Special Tribunal',
  established_date: '2019-04-05',
  enabling_legislation:
    'Special Investigating Units and Special Tribunals Act 74 of 1996 Section 2',
  plain_english_summary:
    'Before 2019, when the SIU wanted to get stolen money back, it had to use the normal High Courts — which are very slow and very expensive. The Special Tribunal was created just for SIU cases. It works faster and costs less. Since 2019, it has become the main weapon the SIU uses to cancel bad contracts and recover stolen money.',
  address:
    '5th floor, 266 Centre Walk Building (West Tower), cnr Thabo Sehume and Pretorius Streets, Pretoria, 0001',
  website_url: 'https://www.justice.gov.za/tribunal/',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// People
// ═══════════════════════════════════════════════════════════════════════════════
//
// Upserted by `full_name`. Overlaps with commissions-master + adhoc seeds
// (Cyril Ramaphosa, Jacob Zuma) are intentional and idempotent; the
// later-running seed wins, and both ends hold compatible data.

interface PersonSeed {
  full_name: string;
  aliases: string[];
  current_role: string | null;
  organisation: string | null;
  status: PersonStatus;
  profile_summary: string;
}

const PEOPLE_SEED: readonly PersonSeed[] = [
  {
    full_name: 'Cyril Ramaphosa',
    aliases: ['Ramaphosa', 'President Ramaphosa'],
    current_role: 'President of the Republic of South Africa',
    organisation: 'African National Congress',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Fifth President of the Republic since February 2018. Signed every modern SIU Proclamation including R23 of 2020 (PPE), R27 of 2019 (Transnet), R29 of 2019 (Eskom), R28 of 2018 (VBS) and R228 of 2024 (ACSA). Each Proclamation activates the SIU on a specific corpus of contracts under section 2(1) of the SIU Act 74 of 1996.',
  },
  {
    full_name: 'Jacob Zuma',
    aliases: ['Zuma', 'JZ', 'President Zuma'],
    current_role: 'Former President of South Africa',
    organisation: 'uMkhonto we Sizwe Party (formerly ANC)',
    status: PersonStatus.CHARGED,
    profile_summary:
      'Fourth President of the Republic (2009–2018). Signed Proclamation R23 of 2017 (SASSA) and Proclamation R25 of 2015 (PRASA). The state-capture commission he established under judicial pressure subsequently triggered three further SIU proclamations after he left office. Faces ongoing arms-deal corruption charges. Presumed innocent until proven guilty.',
  },
  {
    full_name: 'Andy Mothibi',
    aliases: ['Mothibi', 'Adv Andy Mothibi', 'Advocate Mothibi'],
    current_role: 'Head of the Special Investigating Unit',
    organisation: 'Special Investigating Unit',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Head of the SIU since 2016. Reappointed by President Ramaphosa. Has overseen the largest expansion of SIU caseload in its history, including the COVID-19 PPE investigation under Proclamation R23 of 2020 and the R64.8bn Transnet civil litigation enrolled in the Special Tribunal. Reported in 2026 to be transitioning into the National Director of Public Prosecutions role.',
  },
  {
    full_name: 'Tshifhiwa Matodzi',
    aliases: ['Matodzi', 'TT Matodzi'],
    current_role: 'Convicted — serving 15-year sentence',
    organisation: 'Vele Investments (former); VBS Mutual Bank (former chairperson)',
    status: PersonStatus.CHARGED,
    profile_summary:
      'Former chairperson of VBS Mutual Bank and head of Vele Investments. The principal beneficiary of the VBS looting that took down the bank in 2018. Sentenced in July 2024 to an effective 15 years\' imprisonment after pleading guilty to 33 charges including racketeering, fraud, theft, money laundering and corruption — the longest sentence handed down for state-linked banking fraud in democratic South African history. Implicated in Proclamation R28 of 2018.',
  },
  {
    full_name: 'Floyd Shivambu',
    aliases: ['Shivambu', 'Floyd Nyiko Shivambu'],
    current_role: 'Member of Parliament — uMkhonto we Sizwe Party',
    organisation: 'uMkhonto we Sizwe Party (formerly EFF deputy president)',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Former deputy president of the EFF (2014–2024) and current MK Party MP. Named in evidence as a beneficiary of money flowing out of VBS Mutual Bank via his brother Brian Shivambu. The SIU report and the Motau "VBS — The Great Bank Heist" forensic investigation reference him among the politically exposed individuals investigated under the VBS Proclamation. He has consistently denied wrongdoing; no criminal charges have been laid against him at the time of writing.',
  },
  {
    full_name: 'George Hlaudi Motsoeneng',
    aliases: ['Hlaudi Motsoeneng', 'Motsoeneng', 'Hlaudi'],
    current_role: 'Former SABC Chief Operations Officer',
    organisation: 'South African Broadcasting Corporation (former)',
    status: PersonStatus.CHARGED,
    profile_summary:
      'Chief Operations Officer of the SABC from 2014 to 2017 under President Zuma. Found by the Public Protector to have abused his power, awarded himself unlawful pay rises and dismissed senior journalists for editorial reasons. Subject of the SABC Board Inquiry parliamentary committee (2017) and subsequently of SIU Proclamation R01 of 2019 and Special Tribunal case GP01/2021, in which the Tribunal ordered him to repay millions in irregular bonuses.',
  },
  {
    full_name: 'Lucky Montana',
    aliases: ['Montana', 'Tshepo Lucky Montana'],
    current_role: 'Former Group CEO of PRASA',
    organisation: 'Passenger Rail Agency of South Africa (former)',
    status: PersonStatus.CHARGED,
    profile_summary:
      'Group Chief Executive Officer of the Passenger Rail Agency of South Africa from 2010 to 2015. Subject of SIU Proclamation R25 of 2015 into PRASA procurement, and a Public Protector report ("Derailed") which found multiple irregular contracts under his tenure. Charged in 2024 in connection with PRASA-era corruption matters; matters ongoing before the courts. Presumed innocent until proven guilty.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Proclamations
// ═══════════════════════════════════════════════════════════════════════════════

interface OutcomeSeed {
  total_value_investigated?: string | null;
  financial_losses_identified?: string | null;
  actual_recovered_rands?: string | null;
  losses_prevented_rands?: string | null;
  civil_litigation_value_rands?: string | null;
  contracts_set_aside_value?: string | null;
  referrals_to_npa?: number;
  referrals_to_hawks?: number;
  referrals_to_departments?: number;
  employees_referred_disciplinary?: number;
  employees_dismissed?: number;
  special_tribunal_cases_filed?: number;
  outcome_summary?: string | null;
  plain_english_outcome?: string | null;
  report_submitted_date?: string | null;
  report_url?: string | null;
}

interface TribunalCaseSeed {
  case_number: string;
  case_title: string;
  value_rands?: string | null;
  respondents: string[];
  nature_of_claim: string;
  status: TribunalCaseStatus;
  filed_date?: string | null;
  judgment_date?: string | null;
  amount_recovered_rands?: string | null;
  outcome_summary?: string | null;
  plain_english_outcome?: string | null;
  judgment_url?: string | null;
}

interface ProclamationPersonLink {
  full_name: string;
  role: SiuPersonRole;
  summary: string | null;
}

interface ProclamationSeed {
  proclamation_number: string;
  slug: string;
  title: string;
  full_title: string | null;
  gazette_number: string | null;
  signed_date: string | null;
  published_date: string | null;
  domain: CommissionDomain;
  president_who_signed: string;
  period_covered_start: string | null;
  period_covered_end: string | null;
  status: ProclamationStatus;
  investigation_scope: string;
  plain_english_summary: string;
  official_url: string | null;
  /** Slug of the related commission, or null. Resolved at insert time. */
  related_commission_slug: string | null;
  /** Slug of the related ad hoc committee, or null. Resolved at insert time. */
  related_adhoc_committee_slug: string | null;
  outcome: OutcomeSeed | null;
  tribunal_cases: TribunalCaseSeed[];
  person_links: ProclamationPersonLink[];
}

const PROCLAMATIONS_SEED: readonly ProclamationSeed[] = [
  // ── 1 ────────────────────────────────────────────────────────────────────
  {
    proclamation_number: 'R23 of 2020',
    slug: 'proclamation-r23-2020-ppe-covid',
    title: 'COVID-19 PPE Procurement Investigation',
    full_title:
      'Investigation into allegations of corruption, maladministration, malpractice, and irregular payments by State institutions relating to COVID-19 PPE procurement and the conduct of State employees',
    gazette_number: 'GG 43546',
    signed_date: '2020-07-23',
    published_date: '2020-07-23',
    domain: CommissionDomain.CORRUPTION,
    president_who_signed: 'Cyril Ramaphosa',
    period_covered_start: '2020-03-01',
    period_covered_end: '2021-12-31',
    status: ProclamationStatus.LITIGATION_ONGOING,
    investigation_scope:
      'All national departments, provincial departments, municipalities, and state entities involved in procuring personal protective equipment (PPE) during the COVID-19 pandemic. Covers gloves, masks, gowns, sanitisers, and related items across all 9 provinces.',
    plain_english_summary:
      "When COVID-19 hit in 2020, the government had to quickly buy millions of masks, gloves and other protective equipment for health workers. This was an emergency, so the normal rules about competitive bidding were relaxed. Many politically connected people used this gap to steal from the government — some supplied nothing, some charged five times the real price. This SIU investigation looked at all of it.",
    official_url: 'https://www.siu.org.za/national-government-proclamations/',
    related_commission_slug: null,
    related_adhoc_committee_slug: null,
    outcome: {
      total_value_investigated: '14200000000',
      financial_losses_identified: '2800000000',
      actual_recovered_rands: '389000000',
      losses_prevented_rands: '2100000000',
      civil_litigation_value_rands: '2200000000',
      contracts_set_aside_value: '300000000',
      referrals_to_npa: 87,
      referrals_to_hawks: 34,
      referrals_to_departments: 156,
      employees_referred_disciplinary: 156,
      employees_dismissed: 44,
      special_tribunal_cases_filed: 35,
      outcome_summary:
        'The largest SIU investigation in history. Covered procurement across all 9 provinces. Found systemic corruption, price gouging, and ghost suppliers. SIU seized R52.6 million in assets in Mpumalanga alone — 29 properties, 31 vehicles, and a boat trailer. Investigations ongoing in the Special Tribunal.',
      plain_english_outcome:
        'Of the billions spent on PPE, the SIU found that much of it was stolen or wasted. They went to court to get money back. They sent 87 cases to the NPA so those people could be prosecuted. 44 government officials lost their jobs. The investigation is still going — some court cases are still running.',
      report_submitted_date: '2021-12-01',
      report_url: null,
    },
    tribunal_cases: [
      {
        case_number: 'MP03/2021',
        case_title:
          'SIU v Zeelwa Trading and Mpumalanga Department of Social Development',
        value_rands: '15000000',
        respondents: [
          'Zeelwa Trading PTY LTD',
          'Mpumalanga Department of Social Development',
        ],
        nature_of_claim:
          'Recovery of R15 million paid for PPE not delivered, and setting aside of the underlying procurement decision.',
        status: TribunalCaseStatus.JUDGMENT_DELIVERED,
        filed_date: '2021-03-01',
        judgment_date: '2022-10-13',
        amount_recovered_rands: '15000000',
        outcome_summary:
          'Tribunal ordered Zeelwa Trading to repay R15 million plus interest. Among the first PPE judgments delivered.',
        plain_english_outcome:
          'The court agreed the government was cheated out of R15 million for PPE that was never delivered, and ordered the company to pay it back.',
        judgment_url: null,
      },
      {
        case_number: 'GP04/2020',
        case_title: 'SIU v Systems Applications Products SA (Pty) Ltd',
        value_rands: '180000000',
        respondents: ['Systems Applications Products (SA) Pty Ltd'],
        nature_of_claim:
          'Setting aside of an irregular SAP software contract concluded outside of supply-chain rules; consequential repayment of contract proceeds.',
        status: TribunalCaseStatus.SETTLED,
        filed_date: '2020-11-01',
        judgment_date: '2022-09-29',
        amount_recovered_rands: '180000000',
        outcome_summary:
          'Settled by SAP for the full R180 million claim value plus contribution to costs.',
        plain_english_outcome:
          'A big global software company paid back R180 million it was paid for software contracts that were not awarded according to the rules.',
        judgment_url: null,
      },
    ],
    person_links: [
      {
        full_name: 'Cyril Ramaphosa',
        role: SiuPersonRole.WHISTLEBLOWER,
        summary:
          'As President, signed Proclamation R23 of 2020 activating the investigation after public outrage at COVID procurement abuses.',
      },
    ],
  },

  // ── 2 ────────────────────────────────────────────────────────────────────
  {
    proclamation_number: 'R28 of 2018',
    slug: 'proclamation-r28-2018-vbs-municipal',
    title: 'VBS Mutual Bank Municipal Deposits Investigation',
    full_title:
      'Investigation into the affairs of municipalities that deposited public funds into VBS Mutual Bank in contravention of the Municipal Finance Management Act, and the conduct of officials who facilitated those deposits',
    gazette_number: 'GG 42049',
    signed_date: '2018-12-01',
    published_date: '2018-12-01',
    domain: CommissionDomain.FINANCIAL,
    president_who_signed: 'Cyril Ramaphosa',
    period_covered_start: '2014-01-01',
    period_covered_end: '2018-12-01',
    status: ProclamationStatus.CONCLUDED,
    investigation_scope:
      'Municipalities that illegally deposited public funds into VBS Mutual Bank in contravention of the Municipal Finance Management Act, and officials who facilitated these illegal deposits.',
    plain_english_summary:
      'VBS Mutual Bank was a small bank in Limpopo that was trusted by many community savings clubs and burial societies. But secretly, the bank was being looted from the inside. Politicians also arranged for municipalities to deposit public money into VBS illegally — money meant for community services. When VBS collapsed, ordinary people lost their savings and municipalities lost public funds.',
    official_url: 'https://www.siu.org.za/national-government-proclamations/',
    related_commission_slug: null,
    related_adhoc_committee_slug: null,
    outcome: {
      financial_losses_identified: '1900000000',
      referrals_to_npa: 12,
      referrals_to_departments: 28,
      outcome_summary:
        'Found multiple municipalities had illegally deposited over R1.9 billion in public funds into VBS. Officials referred for disciplinary action and criminal prosecution. The NPA separately charged 8 VBS-linked individuals on 47 counts of theft, fraud, corruption and POCA violations. In July 2024, VBS chairperson Tshifhiwa Matodzi was sentenced to 15 years.',
      plain_english_outcome:
        "The SIU found who helped the politicians illegally move public money into VBS. The NPA charged the bank's leaders. In 2024 — six years later — the main person responsible was sentenced to 15 years in prison. Some money has been recovered. Many ordinary people who lost savings never got anything back.",
    },
    tribunal_cases: [],
    person_links: [
      {
        full_name: 'Tshifhiwa Matodzi',
        role: SiuPersonRole.CONVICTED,
        summary:
          'Former VBS chairperson. Pleaded guilty to 33 charges in July 2024 and was sentenced to an effective 15 years\' imprisonment — the principal individual outcome of the VBS investigation chain.',
      },
      {
        full_name: 'Floyd Shivambu',
        role: SiuPersonRole.INVESTIGATED,
        summary:
          'Named in evidence in connection with funds flowing from VBS to associated parties. Has denied wrongdoing; no criminal charges laid against him as of the seed date.',
      },
    ],
  },

  // ── 3 ────────────────────────────────────────────────────────────────────
  {
    proclamation_number: 'R27 of 2019',
    slug: 'proclamation-r27-2019-transnet-locomotives',
    title: 'Transnet Locomotive Procurement Investigation',
    full_title:
      'Investigation into the affairs of Transnet SOC Limited relating to the procurement of locomotives and related contracts, and the conduct of employees and parties contracting with Transnet in respect thereof',
    gazette_number: 'GG 42769',
    signed_date: '2019-10-01',
    published_date: '2019-10-01',
    domain: CommissionDomain.CORRUPTION,
    president_who_signed: 'Cyril Ramaphosa',
    period_covered_start: '2012-01-01',
    period_covered_end: '2019-12-31',
    status: ProclamationStatus.LITIGATION_ONGOING,
    investigation_scope:
      'Transnet SOC Ltd locomotive procurement contracts, including the R54 billion contract for 1,064 locomotives awarded to entities linked to the Gupta network and involving Salim Essa.',
    plain_english_summary:
      "Transnet — the company that runs South Africa's trains and ports — was supposed to buy new locomotives (train engines). Instead of a fair process, the contracts were given to companies connected to the Guptas and their associates. The country paid billions more than it should have. Some of that money was paid as bribes. This SIU investigation worked alongside the Zondo Commission findings.",
    official_url: 'https://www.siu.org.za/national-government-proclamations/',
    related_commission_slug: 'zondo-commission-state-capture',
    related_adhoc_committee_slug: null,
    outcome: {
      total_value_investigated: '54000000000',
      civil_litigation_value_rands: '64800000000',
      referrals_to_npa: 16,
      special_tribunal_cases_filed: 8,
      outcome_summary:
        'The single largest matter enrolled in the Special Tribunal — R64.8 billion. Linked directly to Zondo Commission findings on state capture. Civil litigation ongoing. NPA separately pursuing criminal charges against Gupta-linked individuals.',
      plain_english_outcome:
        'The SIU found billions were stolen through the locomotive deal. They are trying to get the money back through the Special Tribunal. This is the biggest civil case in South African history. It will take years to resolve.',
    },
    tribunal_cases: [],
    person_links: [],
  },

  // ── 4 ────────────────────────────────────────────────────────────────────
  {
    proclamation_number: 'R23 of 2017',
    slug: 'proclamation-r23-2017-sassa',
    title: 'SASSA Social Grants Administration Investigation',
    full_title:
      'Investigation into the affairs of the South African Social Security Agency relating to the procurement and administration of social grants, including the contract awarded to Cash Paymaster Services',
    gazette_number: 'GG 41058',
    signed_date: '2017-08-01',
    published_date: '2017-08-01',
    domain: CommissionDomain.CORRUPTION,
    president_who_signed: 'Jacob Zuma',
    period_covered_start: '2012-01-01',
    period_covered_end: '2017-08-01',
    status: ProclamationStatus.CONCLUDED,
    investigation_scope:
      'South African Social Security Agency procurement and administration of social grants, including the contract awarded to Cash Paymaster Services (CPS) owned by Net1 UEPS Technologies.',
    plain_english_summary:
      "Millions of South Africa's poorest people receive government grants — for children, the elderly, and people with disabilities. The contract to pay out these grants was given to a private company called CPS. The Constitutional Court declared the contract invalid. The SIU investigated whether public money was stolen or wasted in the process.",
    official_url: 'https://www.siu.org.za/national-government-proclamations/',
    related_commission_slug: null,
    related_adhoc_committee_slug: null,
    outcome: {
      referrals_to_npa: 8,
      outcome_summary:
        'Found irregular procurement in the CPS grant payment contract. Referred matters to NPA. The Constitutional Court had already declared the contract invalid in 2017. SASSA subsequently brought the grant payment function in-house through the South African Post Office.',
      plain_english_outcome:
        'The SIU agreed with what the courts had already said: the contract to pay grants was given to the wrong company in the wrong way. Some matters were sent to the NPA. The work has now been moved to the Post Office.',
    },
    tribunal_cases: [],
    person_links: [],
  },

  // ── 5 ────────────────────────────────────────────────────────────────────
  {
    proclamation_number: 'R29 of 2019',
    slug: 'proclamation-r29-2019-eskom',
    title: 'Eskom State Capture Investigation',
    full_title:
      'Investigation into the affairs of Eskom Holdings SOC Limited relating to procurement, contracts and the conduct of employees, with particular reference to contracts linked to the Gupta network, McKinsey, Trillian and related entities',
    gazette_number: 'GG 42825',
    signed_date: '2019-11-01',
    published_date: '2019-11-01',
    domain: CommissionDomain.CORRUPTION,
    president_who_signed: 'Cyril Ramaphosa',
    period_covered_start: '2010-01-01',
    period_covered_end: '2019-12-31',
    status: ProclamationStatus.LITIGATION_ONGOING,
    investigation_scope:
      'Eskom SOC Ltd procurement, contracts, and conduct of employees — specifically contracts linked to the Gupta network, McKinsey, Trillian, and related entities.',
    plain_english_summary:
      'Eskom is the company that supplies electricity to South Africa. During state capture, billions of rands were stolen through Eskom contracts. Companies connected to the Guptas — and a consulting firm called McKinsey — were paid enormous amounts for work they either did not do or did not do properly. The SIU investigated all of this alongside the Zondo Commission.',
    official_url: 'https://www.siu.org.za/national-government-proclamations/',
    related_commission_slug: 'zondo-commission-state-capture',
    related_adhoc_committee_slug: null,
    outcome: {
      total_value_investigated: '33000000000',
      actual_recovered_rands: '3500000000',
      referrals_to_npa: 22,
      referrals_to_departments: 31,
      special_tribunal_cases_filed: 12,
      outcome_summary:
        'Found widespread corruption in Eskom procurement. ABB (a Swiss engineering company) settled for R2.5 billion in 2024 — one of the largest corruption settlements in South African history. McKinsey repaid R1 billion to Eskom in 2020. Multiple cases in the Special Tribunal.',
      plain_english_outcome:
        'Some of the stolen money was paid back. A Swiss company paid R2.5 billion. McKinsey paid back R1 billion. But most of the senior South Africans involved have not yet been convicted of any crime.',
    },
    tribunal_cases: [],
    person_links: [],
  },

  // ── 6 ────────────────────────────────────────────────────────────────────
  {
    proclamation_number: 'R25 of 2015',
    slug: 'proclamation-r25-2015-prasa',
    title: 'PRASA Procurement Investigation',
    full_title:
      'Investigation into the affairs of the Passenger Rail Agency of South Africa relating to procurement, contracts and the conduct of employees, including locomotive and rolling stock procurement',
    gazette_number: 'GG 39146',
    signed_date: '2015-09-01',
    published_date: '2015-09-01',
    domain: CommissionDomain.CORRUPTION,
    president_who_signed: 'Jacob Zuma',
    period_covered_start: '2009-01-01',
    period_covered_end: '2015-12-31',
    status: ProclamationStatus.CONCLUDED,
    investigation_scope:
      'Passenger Rail Agency of South Africa procurement, contracts, and conduct of employees — including locomotive and rolling stock procurement under CEO Lucky Montana.',
    plain_english_summary:
      'PRASA runs the commuter trains that millions of working South Africans depend on every day. Its CEO Lucky Montana was accused of awarding billions in irregular contracts. Some locomotives bought were too tall for the South African rail network. The SIU investigated this total collapse of governance.',
    official_url: 'https://www.siu.org.za/national-government-proclamations/',
    related_commission_slug: null,
    related_adhoc_committee_slug: null,
    outcome: {
      financial_losses_identified: '4300000000',
      referrals_to_npa: 19,
      referrals_to_departments: 22,
      outcome_summary:
        "Found systemic corruption in PRASA procurement. Lucky Montana referred for criminal investigation. Multiple contracts set aside. PRASA's fleet and service continued to deteriorate — over 80% of its rolling stock was out of service by 2022.",
      plain_english_outcome:
        "The SIU found the trains were a disaster because the people running PRASA gave contracts to the wrong companies. The CEO was sent for prosecution. The trains kept getting worse — by 2022, most of them were not running.",
    },
    tribunal_cases: [],
    person_links: [
      {
        full_name: 'Lucky Montana',
        role: SiuPersonRole.REFERRED_TO_NPA,
        summary:
          'Former PRASA Group CEO. Referred to the NPA in connection with multiple irregular procurement decisions during his tenure (2010–2015). Charged in 2024; matters ongoing before the courts. Presumed innocent until proven guilty.',
      },
    ],
  },

  // ── 7 ────────────────────────────────────────────────────────────────────
  {
    proclamation_number: 'R23 of 2020 — Gauteng Education sub-matter',
    slug: 'proclamation-r23-2020-gauteng-schools',
    title: 'Gauteng Department of Education Schools Decontamination',
    full_title:
      'Investigation under Proclamation R23 of 2020 into R431 million in contracts for decontamination, disinfection, deep cleaning and sanitisation of Gauteng schools during COVID-19',
    gazette_number: 'GG 43546',
    signed_date: '2020-07-23',
    published_date: '2020-07-23',
    domain: CommissionDomain.CORRUPTION,
    president_who_signed: 'Cyril Ramaphosa',
    period_covered_start: '2020-03-01',
    period_covered_end: '2021-06-30',
    status: ProclamationStatus.LITIGATION_ONGOING,
    investigation_scope:
      'R431 million in contracts for decontamination, disinfection, deep cleaning and sanitisation of Gauteng schools during COVID-19. A sub-matter of the broader R23 of 2020 PPE proclamation, ring-fenced because of the discrete contract universe.',
    plain_english_summary:
      "When schools had to be cleaned and made safe from COVID-19, Gauteng's education department paid R431 million for this work. The SIU investigated whether the money was spent properly and whether the work was actually done.",
    official_url: 'https://www.siu.org.za/national-government-proclamations/',
    related_commission_slug: null,
    related_adhoc_committee_slug: null,
    outcome: {
      total_value_investigated: '431000000',
      financial_losses_identified: '180000000',
      special_tribunal_cases_filed: 1,
      outcome_summary:
        'The Special Tribunal heard arguments in November 2021 over the R431 million schools decontamination contracts. Multiple service providers found to have been overpaid or had done no work. Review application ongoing.',
      plain_english_outcome:
        'The SIU said about R180 million of the schools cleaning money was wasted or stolen. They are in court trying to get it back. Some of the companies that were paid did very little or no work.',
    },
    tribunal_cases: [
      {
        case_number: 'GP13/2021',
        case_title:
          'SIU v Gauteng Department of Education Schools Decontamination Contracts',
        value_rands: '431000000',
        respondents: ['Multiple Gauteng decontamination contractors'],
        nature_of_claim:
          'Review and setting aside of the R431m schools decontamination procurement, plus repayment of amounts paid for work not properly performed.',
        status: TribunalCaseStatus.HEARING,
        filed_date: '2021-06-01',
        judgment_date: null,
        amount_recovered_rands: null,
        outcome_summary:
          'Heard in November 2021. Multiple respondents. Judgment outstanding at the time of writing.',
        plain_english_outcome: null,
        judgment_url: null,
      },
    ],
    person_links: [],
  },

  // ── 8 ────────────────────────────────────────────────────────────────────
  {
    proclamation_number: 'R228 of 2024',
    slug: 'proclamation-r228-2024-acsa',
    title: 'ACSA Interest Rate Swap Agreements Investigation',
    full_title:
      'Investigation into Airports Company of South Africa Interest Rate Swap Agreements with various banks, as highlighted in the Zondo Commission State Capture Report',
    gazette_number: 'GG 50128',
    signed_date: '2024-02-19',
    published_date: '2024-02-19',
    domain: CommissionDomain.FINANCIAL,
    president_who_signed: 'Cyril Ramaphosa',
    period_covered_start: '2000-01-01',
    period_covered_end: '2024-11-22',
    status: ProclamationStatus.ACTIVE,
    investigation_scope:
      'Airports Company of South Africa (ACSA) Interest Rate Swap Agreements with various banks, as highlighted in the Zondo Commission State Capture Report.',
    plain_english_summary:
      "ACSA runs South Africa's major airports — OR Tambo, Cape Town International, and others. The Zondo Commission found that ACSA had entered into complex financial agreements with banks that may have cost the company billions unnecessarily. The SIU was asked to investigate whether this was corruption or just very bad financial management.",
    official_url: 'https://www.siu.org.za/national-government-proclamations/',
    related_commission_slug: 'zondo-commission-state-capture',
    related_adhoc_committee_slug: null,
    outcome: null,
    tribunal_cases: [],
    person_links: [],
  },

  // ── 9 ────────────────────────────────────────────────────────────────────
  {
    proclamation_number: 'R01 of 2019',
    slug: 'proclamation-r01-2019-sabc-hlaudi',
    title: 'SABC Irregular Appointments and Contracts Investigation',
    full_title:
      'Investigation into the affairs of the South African Broadcasting Corporation relating to irregular appointments, contracts, and expenditure under Chief Operations Officer George Hlaudi Motsoeneng',
    gazette_number: 'GG 42163',
    signed_date: '2019-01-01',
    published_date: '2019-01-01',
    // Spec said `domain: 'accountability'`; mapped to corruption (irregular
    // payments + criminal referrals). `accountability` is not a valid
    // CommissionDomain value (it's an AdhocCommitteeCategory).
    domain: CommissionDomain.CORRUPTION,
    president_who_signed: 'Cyril Ramaphosa',
    period_covered_start: '2014-01-01',
    period_covered_end: '2017-12-31',
    status: ProclamationStatus.LITIGATION_ONGOING,
    investigation_scope:
      'SABC irregular appointments, contracts, and expenditure under COO George Hlaudi Motsoeneng.',
    plain_english_summary:
      'Hlaudi Motsoeneng was the Chief Operations Officer of the SABC — the public broadcaster. He was accused of giving people jobs and contracts they did not deserve, wasting public money, and using his position to silence criticism. The Ad Hoc Committee found the SABC board unfit. The SIU then investigated the financial damage.',
    official_url: 'https://www.siu.org.za/national-government-proclamations/',
    related_commission_slug: null,
    related_adhoc_committee_slug: 'adhoc-sabc-board-2017',
    outcome: {
      referrals_to_npa: 4,
      special_tribunal_cases_filed: 1,
      outcome_summary:
        'SIU brought a case against Hlaudi Motsoeneng in the Special Tribunal to recover irregular payments made during his tenure.',
      plain_english_outcome:
        'The SIU went to court to make Hlaudi Motsoeneng pay back the money he was paid in bonuses and irregular salary increases at the SABC.',
    },
    tribunal_cases: [
      {
        case_number: 'GP01/2021',
        case_title: 'SABC and SIU v George Hlaudi Motsoeneng',
        value_rands: '25000000',
        respondents: ['George Hlaudi Motsoeneng'],
        nature_of_claim:
          'Recovery of irregular payments and bonuses paid to Motsoeneng and others during his tenure as COO of the SABC.',
        status: TribunalCaseStatus.JUDGMENT_DELIVERED,
        filed_date: '2021-01-01',
        judgment_date: '2022-10-18',
        amount_recovered_rands: null,
        outcome_summary:
          'Tribunal granted relief in favour of the SIU and SABC ordering repayment of irregular bonuses and salary increases. Subsequent execution of the order has been the subject of further proceedings.',
        plain_english_outcome:
          'The court agreed with the SIU and ordered Motsoeneng to pay the money back. Whether he has actually paid is a separate fight that is still happening.',
        judgment_url: null,
      },
    ],
    person_links: [
      {
        full_name: 'George Hlaudi Motsoeneng',
        role: SiuPersonRole.IMPLICATED,
        summary:
          'Former SABC COO. Subject of the GP01/2021 Special Tribunal action to recover irregular bonuses and salary increases.',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Upsert helpers
// ═══════════════════════════════════════════════════════════════════════════════

async function upsertSiuBody(m: EntityManager): Promise<SiuBody> {
  const repo = m.getRepository(SiuBody);
  const existing = await repo.find({ take: 1 });
  if (existing.length > 0) {
    const row = existing[0];
    Object.assign(row, SIU_BODY_SEED);
    const saved = await repo.save(row);
    console.log(`  · SIU body row updated in place (singleton).`);
    return saved;
  }
  const fresh = repo.create(SIU_BODY_SEED);
  const saved = await repo.save(fresh);
  console.log(`  · SIU body row inserted (singleton).`);
  return saved;
}

async function upsertSpecialTribunal(m: EntityManager): Promise<SpecialTribunal> {
  const repo = m.getRepository(SpecialTribunal);
  const existing = await repo.find({ take: 1 });
  if (existing.length > 0) {
    const row = existing[0];
    Object.assign(row, SPECIAL_TRIBUNAL_SEED);
    const saved = await repo.save(row);
    console.log(`  · Special Tribunal row updated in place (singleton).`);
    return saved;
  }
  const fresh = repo.create(SPECIAL_TRIBUNAL_SEED);
  const saved = await repo.save(fresh);
  console.log(`  · Special Tribunal row inserted (singleton).`);
  return saved;
}

async function upsertPeople(m: EntityManager): Promise<Map<string, Person>> {
  const repo = m.getRepository(Person);
  const byName = new Map<string, Person>();

  for (const seed of PEOPLE_SEED) {
    const payload = {
      full_name: seed.full_name,
      aliases: seed.aliases,
      current_role: seed.current_role,
      organisation: seed.organisation,
      status: seed.status,
      profile_summary: seed.profile_summary,
    };
    let person = await repo.findOne({ where: { full_name: seed.full_name } });
    if (!person) {
      person = repo.create(payload);
      person = await repo.save(person);
    } else {
      Object.assign(person, payload);
      person = await repo.save(person);
    }
    byName.set(seed.full_name, person);
  }

  console.log(`  · People upserted in this seed: ${byName.size}`);
  return byName;
}

async function resolveExistingPerson(
  m: EntityManager,
  fullName: string,
): Promise<Person> {
  const repo = m.getRepository(Person);
  const person = await repo.findOne({ where: { full_name: fullName } });
  if (!person) {
    throw new Error(
      `Person "${fullName}" was referenced by a proclamation but is not seeded anywhere. ` +
        `Add them to PEOPLE_SEED in this file or to commissions-master.seed.ts.`,
    );
  }
  return person;
}

async function upsertProclamations(
  m: EntityManager,
): Promise<Map<string, SiuProclamation>> {
  const repo = m.getRepository(SiuProclamation);
  const commissionRepo = m.getRepository(Commission);
  const adhocRepo = m.getRepository(AdhocCommittee);
  const bySlug = new Map<string, SiuProclamation>();

  let linkedCommission = 0;
  let deferredCommission = 0;
  let linkedAdhoc = 0;
  let deferredAdhoc = 0;

  for (const seed of PROCLAMATIONS_SEED) {
    let relatedCommissionId: string | null = null;
    if (seed.related_commission_slug) {
      const c = await commissionRepo.findOne({
        where: { slug: seed.related_commission_slug },
      });
      if (c) {
        relatedCommissionId = c.id;
        linkedCommission++;
      } else {
        deferredCommission++;
        console.log(
          `  ! Related commission "${seed.related_commission_slug}" not found ` +
            `when seeding proclamation "${seed.slug}". Leaving related_commission_id null. ` +
            `Re-run after commissions-master.seed.ts to back-fill.`,
        );
      }
    }

    let relatedAdhocId: string | null = null;
    if (seed.related_adhoc_committee_slug) {
      const a = await adhocRepo.findOne({
        where: { slug: seed.related_adhoc_committee_slug },
      });
      if (a) {
        relatedAdhocId = a.id;
        linkedAdhoc++;
      } else {
        deferredAdhoc++;
        console.log(
          `  ! Related ad hoc committee "${seed.related_adhoc_committee_slug}" not found ` +
            `when seeding proclamation "${seed.slug}". Leaving related_adhoc_committee_id null. ` +
            `Re-run after adhoc-committees.seed.ts to back-fill.`,
        );
      }
    }

    const payload = {
      proclamation_number: seed.proclamation_number,
      slug: seed.slug,
      title: seed.title,
      full_title: seed.full_title,
      gazette_number: seed.gazette_number,
      signed_date: seed.signed_date,
      published_date: seed.published_date,
      domain: seed.domain,
      investigation_scope: seed.investigation_scope,
      plain_english_summary: seed.plain_english_summary,
      president_who_signed: seed.president_who_signed,
      period_covered_start: seed.period_covered_start,
      period_covered_end: seed.period_covered_end,
      status: seed.status,
      related_commission_id: relatedCommissionId,
      related_adhoc_committee_id: relatedAdhocId,
      official_url: seed.official_url,
    };

    // Look up by slug first (the column with a UNIQUE constraint), then
    // fall back to proclamation_number for older rows that may have been
    // inserted under a different slug. The slug is the canonical natural
    // key for this seed.
    let row = await repo.findOne({ where: { slug: seed.slug } });
    if (!row) {
      row = await repo.findOne({
        where: { proclamation_number: seed.proclamation_number },
      });
    }
    if (!row) {
      row = repo.create(payload);
      row = await repo.save(row);
    } else {
      Object.assign(row, payload);
      row = await repo.save(row);
    }
    bySlug.set(seed.slug, row);
  }

  console.log(
    `  · Proclamations: ${bySlug.size} ` +
      `(commission links resolved: ${linkedCommission}, deferred: ${deferredCommission}; ` +
      `ad hoc links resolved: ${linkedAdhoc}, deferred: ${deferredAdhoc})`,
  );
  return bySlug;
}

async function upsertOutcomes(
  m: EntityManager,
  proclamations: Map<string, SiuProclamation>,
): Promise<void> {
  const repo = m.getRepository(SiuInvestigationOutcome);
  let count = 0;

  for (const seed of PROCLAMATIONS_SEED) {
    if (!seed.outcome) continue;
    const proc = proclamations.get(seed.slug);
    if (!proc) continue;

    const o = seed.outcome;
    const payload = {
      proclamation_id: proc.id,
      total_value_investigated: o.total_value_investigated ?? null,
      financial_losses_identified: o.financial_losses_identified ?? null,
      actual_recovered_rands: o.actual_recovered_rands ?? null,
      losses_prevented_rands: o.losses_prevented_rands ?? null,
      civil_litigation_value_rands: o.civil_litigation_value_rands ?? null,
      contracts_set_aside_value: o.contracts_set_aside_value ?? null,
      referrals_to_npa: o.referrals_to_npa ?? 0,
      referrals_to_hawks: o.referrals_to_hawks ?? 0,
      referrals_to_departments: o.referrals_to_departments ?? 0,
      employees_referred_disciplinary: o.employees_referred_disciplinary ?? 0,
      employees_dismissed: o.employees_dismissed ?? 0,
      special_tribunal_cases_filed: o.special_tribunal_cases_filed ?? 0,
      outcome_summary: o.outcome_summary ?? null,
      plain_english_outcome: o.plain_english_outcome ?? null,
      report_submitted_date: o.report_submitted_date ?? null,
      report_url: o.report_url ?? null,
    };

    let existing = await repo.findOne({
      where: { proclamation_id: proc.id },
    });
    if (!existing) {
      existing = repo.create(payload);
      await repo.save(existing);
    } else {
      Object.assign(existing, payload);
      await repo.save(existing);
    }
    count++;
  }

  console.log(`  · Investigation outcomes: ${count}`);
}

async function upsertTribunalCases(
  m: EntityManager,
  proclamations: Map<string, SiuProclamation>,
): Promise<void> {
  const repo = m.getRepository(SpecialTribunalCase);
  let count = 0;

  for (const seed of PROCLAMATIONS_SEED) {
    if (seed.tribunal_cases.length === 0) continue;
    const proc = proclamations.get(seed.slug);
    if (!proc) continue;

    for (const caseSeed of seed.tribunal_cases) {
      const payload = {
        proclamation_id: proc.id,
        case_number: caseSeed.case_number,
        case_title: caseSeed.case_title,
        value_rands: caseSeed.value_rands ?? null,
        respondents: caseSeed.respondents,
        nature_of_claim: caseSeed.nature_of_claim,
        filed_date: caseSeed.filed_date ?? null,
        status: caseSeed.status,
        outcome_summary: caseSeed.outcome_summary ?? null,
        amount_recovered_rands: caseSeed.amount_recovered_rands ?? null,
        judgment_date: caseSeed.judgment_date ?? null,
        judgment_url: caseSeed.judgment_url ?? null,
        plain_english_outcome: caseSeed.plain_english_outcome ?? null,
      };

      let existing = await repo.findOne({
        where: { case_number: caseSeed.case_number },
      });
      if (!existing) {
        existing = repo.create(payload);
        await repo.save(existing);
      } else {
        Object.assign(existing, payload);
        await repo.save(existing);
      }
      count++;
    }
  }

  console.log(`  · Special Tribunal cases: ${count}`);
}

async function linkProclamationPeople(
  m: EntityManager,
  proclamations: Map<string, SiuProclamation>,
  people: Map<string, Person>,
): Promise<void> {
  const repo = m.getRepository(SiuProclamationPerson);
  let count = 0;

  for (const seed of PROCLAMATIONS_SEED) {
    if (seed.person_links.length === 0) continue;
    const proc = proclamations.get(seed.slug);
    if (!proc) continue;

    for (const link of seed.person_links) {
      let person = people.get(link.full_name);
      if (!person) {
        person = await resolveExistingPerson(m, link.full_name);
      }

      const payload = {
        proclamation_id: proc.id,
        person_id: person.id,
        role: link.role,
        summary: link.summary,
      };

      let existing = await repo.findOne({
        where: {
          proclamation_id: proc.id,
          person_id: person.id,
          role: link.role,
        },
      });
      if (!existing) {
        existing = repo.create(payload);
        await repo.save(existing);
      } else {
        Object.assign(existing, payload);
        await repo.save(existing);
      }
      count++;
    }
  }

  console.log(`  · Proclamation → person links: ${count}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// siu_proclamation_law_sections (invoked after all proclamation rows exist)
// ═══════════════════════════════════════════════════════════════════════════════

interface LawUpsert {
  short_name: string;
  name: string;
  act_number: string;
  category: LawCategory;
  plain_english: string;
  full_text_url: string | null;
}

const SIU_LAWS_TO_UPSERT: readonly LawUpsert[] = [
  {
    short_name: 'SIU Act',
    name: 'Special Investigating Units and Special Tribunals Act',
    act_number: '74 of 1996',
    category: LawCategory.CONSTITUTIONAL,
    plain_english:
      "The Act that created the SIU and the Special Tribunal. Section 2 is how the President tells the SIU to investigate a specific matter — a Presidential Proclamation under this section is the on-switch for every case.",
    full_text_url: 'https://www.gov.za/documents/special-investigating-units-and-special-tribunals-act-0',
  },
  {
    short_name: 'MFMA',
    name: 'Municipal Finance Management Act',
    act_number: '56 of 2003',
    category: LawCategory.OTHER,
    plain_english:
      'The law that tells municipalities how to budget, bank and report on public money. It prohibits unsafe investments — the reason municipalities were not allowed to place deposits in VBS the way they did.',
    full_text_url: 'https://www.gov.za/documents/municipal-finance-management-act',
  },
  {
    short_name: 'Banks Act',
    name: 'Banks Act',
    act_number: '94 of 1990',
    category: LawCategory.OTHER,
    plain_english:
      'The statute that governs the registration, supervision and capital adequacy of banks. VBS failed the prudential standards the Act is meant to enforce.',
    full_text_url: 'https://www.gov.za/documents/banks-act',
  },
  {
    short_name: 'Social Assistance Act',
    name: 'Social Assistance Act',
    act_number: '13 of 2004',
    category: LawCategory.OTHER,
    plain_english:
      'Governs the payment of social grants. The Act places duties on the Minister to ensure money reaches the right people — a lens the SIU used when it examined the SASSA / CPS contract.',
    full_text_url: 'https://www.gov.za/documents/social-assistance-act',
  },
];

interface LawSectionUpsert {
  law_short: string;
  section_number: string;
  section_title: string;
  plain_english: string;
}

const SIU_LAW_SECTIONS_TO_UPSERT: readonly LawSectionUpsert[] = [
  {
    law_short: 'SIU Act',
    section_number: 'Section 2',
    section_title: 'Investigation of serious malpractices, improper conduct, corruption or maladministration',
    plain_english:
      "This is the section the President used when he signed a Proclamation — it tells the SIU exactly which institutions, contracts, or time periods to investigate, and the SIU can subpoena and seize evidence in that space.",
  },
  {
    law_short: 'POCA',
    section_number: 'Section 4',
    section_title: 'Money-laundering offences and related',
    plain_english:
      'Criminalises hiding the proceeds of crime. The PPE and Eskom lines of inquiry examined layered payments and front companies where kickbacks may have been laundered.',
  },
  {
    law_short: 'PFMA',
    section_number: 'Section 50',
    section_title: 'Duties of the accounting authority of a public entity',
    plain_english:
      'Obligates a board to maintain effective internal controls and to prevent irregular expenditure. ACSA and other entity investigations lean on the duties of the accounting authority.',
  },
  {
    law_short: 'PFMA',
    section_number: 'Section 54',
    section_title: 'Fiduciary duties of a person in a position to influence policy',
    plain_english:
      'Obligates the board and the chief executive in an SOE to act with fidelity, care and in the best interests of the public entity. Eskom procurement failures are often framed as breaches here.',
  },
  {
    law_short: 'PFMA',
    section_number: 'Section 76',
    section_title: 'Procurement in terms of a system that is fair, transparent and competitive',
    plain_english:
      'Binds national departments to supply-chain rules that are fair, transparent and cost-effective. Transnet’s locomotive contracts were probed for failures against this test.',
  },
  {
    law_short: 'PFMA',
    section_number: 'Section 86',
    section_title: 'Unauthorised, irregular or fruitless and wasteful expenditure',
    plain_english:
      'Makes the accounting officer personally responsible to prevent fruitless and wasteful spending. The PPE, PRASA and Gauteng-schools investigations treated ghost deliveries and overpricing as possible breaches here.',
  },
  {
    law_short: 'MFMA',
    section_number: 'Section 7',
    section_title: 'Receiving of moneys by municipalities and municipal entities',
    plain_english:
      'Governs the banking and safe-keeping of municipal cash — a core line of inquiry when VBS accepted illegal municipal deposits.',
  },
  {
    law_short: 'Banks Act',
    section_number: 'Section 11',
    section_title: 'Minimum prudential requirements and enforcement',
    plain_english:
      'Gives the regulator tools to act when a bank is under-capitalised or unsafe — part of the legal backdrop when VBS was placed under curatorship.',
  },
  {
    law_short: 'Social Assistance Act',
    section_number: 'Section 4',
    section_title: "Minister’s powers and performance of the Agency",
    plain_english:
      'The Minister and SASSA must ensure social grants are actually paid. The investigation into the payment channel contract is read against that duty of delivery.',
  },
];

interface ConstSectionUpsert {
  section_number: number;
  chapter_number: number;
  section_title: string;
  plain_english: string;
}

const SIU_CONSTITUTION_SECTIONS: readonly ConstSectionUpsert[] = [
  {
    section_number: 27,
    chapter_number: 2,
    section_title: 'Right to have access to social security',
    plain_english:
      'The Bill of Rights says everyone has the right to access social security, including, if they are unable to support themselves, appropriate social assistance. The SASSA / CPS case was about whether the state was putting that right at risk.',
  },
  {
    section_number: 84,
    chapter_number: 5,
    section_title: 'Powers and functions of President (including 84(2)(f) commissions)',
    plain_english:
      'Powers the President can exercise without needing Parliament first — including (2)(f) the power to appoint a commission of inquiry, and, when read with the SIU Act, the line under which a Presidential Proclamation is signed to activate the SIU.',
  },
  {
    section_number: 217,
    chapter_number: 13,
    section_title: 'Procurement in public sector must be fair, transparent and competitive',
    plain_english:
      "Section 217 requires organs of state to contract in a way that is fair, equitable, transparent, competitive and cost-effective. State-capture cases often allege the opposite happened — including Transnet and Eskom.",
  },
];

type ProclamationLinkRow =
  | {
      proclamation_slug: string;
      usage: SiuLawSectionUsage;
      law_short: string;
      section: string;
      relevance: string;
    }
  | {
      proclamation_slug: string;
      usage: SiuLawSectionUsage;
      constitution_section_number: number;
      relevance: string;
    };

const SIU_PROCLAMATION_LAW_LINKS: readonly ProclamationLinkRow[] = [
  // R23/2020 PPE
  {
    proclamation_slug: 'proclamation-r23-2020-ppe-covid',
    law_short: 'SIU Act',
    section: 'Section 2',
    usage: SiuLawSectionUsage.ENABLING,
    relevance:
      'Presidential proclamation authority to investigate state institutions under the SIU Act — the on-switch for the PPE investigation.',
  },
  {
    proclamation_slug: 'proclamation-r23-2020-ppe-covid',
    constitution_section_number: 84,
    usage: SiuLawSectionUsage.ENABLING,
    relevance:
      'The President signed the proclamation under the constitutional and statutory power to activate the SIU; s84(2)(f) is the well-known line for other presidential commissions.',
  },
  {
    proclamation_slug: 'proclamation-r23-2020-ppe-covid',
    law_short: 'PRECCA',
    section: 'Section 3',
    usage: SiuLawSectionUsage.INVESTIGATED,
    relevance:
      'General corruption offence — gratification where PPE was never delivered or was wildly over-priced.',
  },
  {
    proclamation_slug: 'proclamation-r23-2020-ppe-covid',
    law_short: 'PRECCA',
    section: 'Section 34',
    usage: SiuLawSectionUsage.INVESTIGATED,
    relevance: 'Duty to report — officials who knew of corruption and did not report.',
  },
  {
    proclamation_slug: 'proclamation-r23-2020-ppe-covid',
    law_short: 'PFMA',
    section: 'Section 86',
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Fruitless and wasteful expenditure on PPE that was not delivered or was grossly over-priced.',
  },
  {
    proclamation_slug: 'proclamation-r23-2020-ppe-covid',
    law_short: 'POCA',
    section: 'Section 4',
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Money laundering and layering — kickbacks through third parties on emergency contracts.',
  },
  {
    proclamation_slug: 'proclamation-r23-2020-ppe-covid',
    law_short: 'POCA',
    section: 'Section 2',
    usage: SiuLawSectionUsage.RECOVERED_UNDER,
    relevance:
      'Civil and criminal asset-forfeiture tools the state uses to claw back the proceeds and instruments of crime.',
  },
  // VBS R28/2018
  {
    proclamation_slug: 'proclamation-r28-2018-vbs-municipal',
    law_short: 'SIU Act',
    section: 'Section 2',
    usage: SiuLawSectionUsage.ENABLING,
    relevance: 'Proclamation power activating the VBS / municipal-deposit line of investigation.',
  },
  {
    proclamation_slug: 'proclamation-r28-2018-vbs-municipal',
    law_short: 'MFMA',
    section: 'Section 7',
    usage: SiuLawSectionUsage.INVESTIGATED,
    relevance:
      'Municipalities were prohibited from parking deposits with VBS without National Treasury’s approval; illegal deposits were the core of the SIU brief.',
  },
  {
    proclamation_slug: 'proclamation-r28-2018-vbs-municipal',
    law_short: 'PRECCA',
    section: 'Section 3',
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Corruption in the movement of public funds for political benefit.',
  },
  {
    proclamation_slug: 'proclamation-r28-2018-vbs-municipal',
    law_short: 'Banks Act',
    section: 'Section 11',
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'VBS operated with inadequate capital; leadership faced criminal and regulatory consequences.',
  },
  // Transnet R27/2019
  {
    proclamation_slug: 'proclamation-r27-2019-transnet-locomotives',
    law_short: 'SIU Act',
    section: 'Section 2',
    usage: SiuLawSectionUsage.ENABLING,
    relevance: 'Activation of the locomotive and supply-chain leg of the investigation.',
  },
  {
    proclamation_slug: 'proclamation-r27-2019-transnet-locomotives',
    constitution_section_number: 84,
    usage: SiuLawSectionUsage.ENABLING,
    relevance: 'The President’s instrument activating the SIU in parallel with the broader state-capture work.',
  },
  {
    proclamation_slug: 'proclamation-r27-2019-transnet-locomotives',
    law_short: 'PRECCA',
    section: 'Section 3',
    usage: SiuLawSectionUsage.INVESTIGATED,
    relevance: 'Bribery and corruption in the R54 billion locomotive programme.',
  },
  {
    proclamation_slug: 'proclamation-r27-2019-transnet-locomotives',
    law_short: 'PFMA',
    section: 'Section 76',
    usage: SiuLawSectionUsage.INVESTIGATED,
    relevance: 'Procurement in national departments and SOEs under PFMA must be fair, competitive and cost-effective.',
  },
  {
    proclamation_slug: 'proclamation-r27-2019-transnet-locomotives',
    law_short: 'POCA',
    section: 'Section 2',
    usage: SiuLawSectionUsage.RECOVERED_UNDER,
    relevance: 'Civil RICO-style and forfeiture routes used in Tribunal and High Court recovery.',
  },
  {
    proclamation_slug: 'proclamation-r27-2019-transnet-locomotives',
    constitution_section_number: 217,
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Alleged breach of the constitutional / s217 procurement values on the locomotive deals.',
  },
  // SASSA R23/2017
  {
    proclamation_slug: 'proclamation-r23-2017-sassa',
    law_short: 'SIU Act',
    section: 'Section 2',
    usage: SiuLawSectionUsage.ENABLING,
    relevance: 'Proclamation power for the grants-payment-channel investigation.',
  },
  {
    proclamation_slug: 'proclamation-r23-2017-sassa',
    law_short: 'PRECCA',
    section: 'Section 3',
    usage: SiuLawSectionUsage.INVESTIGATED,
    relevance: 'Alleged corruption in the payment architecture surrounding grant distribution.',
  },
  {
    proclamation_slug: 'proclamation-r23-2017-sassa',
    law_short: 'Social Assistance Act',
    section: 'Section 4',
    usage: SiuLawSectionUsage.INVESTIGATED,
    relevance:
      'The Minister and Agency must perform so grants reach beneficiaries; an irregular contract endangered that legal duty.',
  },
  {
    proclamation_slug: 'proclamation-r23-2017-sassa',
    constitution_section_number: 27,
    usage: SiuLawSectionUsage.INVESTIGATED,
    relevance: 'The constitutional right to social security in tension with an irregular CPS contract.',
  },
  // Eskom R29/2019
  {
    proclamation_slug: 'proclamation-r29-2019-eskom',
    law_short: 'SIU Act',
    section: 'Section 2',
    usage: SiuLawSectionUsage.ENABLING,
    relevance: 'Activation of the Eskom leg of the state-capture / procurement investigations.',
  },
  {
    proclamation_slug: 'proclamation-r29-2019-eskom',
    law_short: 'PRECCA',
    section: 'Section 3',
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Alleged corruption in coal, engineering and other contracts.',
  },
  {
    proclamation_slug: 'proclamation-r29-2019-eskom',
    law_short: 'PFMA',
    section: 'Section 54',
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'The board and accounting authority must stop material irregular expenditure.',
  },
  {
    proclamation_slug: 'proclamation-r29-2019-eskom',
    constitution_section_number: 217,
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Value-for-money, transparency and competition failures in public-sector procurement at Eskom.',
  },
  {
    proclamation_slug: 'proclamation-r29-2019-eskom',
    law_short: 'POCA',
    section: 'Section 4',
    usage: SiuLawSectionUsage.RECOVERED_UNDER,
    relevance: 'Civil and criminal money-laundering and forfeiture tools in recovery work.',
  },
  // PRASA R25/2015
  {
    proclamation_slug: 'proclamation-r25-2015-prasa',
    law_short: 'SIU Act',
    section: 'Section 2',
    usage: SiuLawSectionUsage.ENABLING,
    relevance: 'Activation of the Swifambo / locomotive and related contract investigations at PRASA.',
  },
  {
    proclamation_slug: 'proclamation-r25-2015-prasa',
    law_short: 'PRECCA',
    section: 'Section 3',
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Corruption in rolling-stock and related services procurement.',
  },
  {
    proclamation_slug: 'proclamation-r25-2015-prasa',
    law_short: 'PFMA',
    section: 'Section 86',
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Fruitless and wasteful and irregular spending on ill-suited locos and consultancy.',
  },
  {
    proclamation_slug: 'proclamation-r25-2015-prasa',
    constitution_section_number: 217,
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Procurement must be fair, equitable, transparent, competitive and cost-effective.',
  },
  // SABC R01/2019
  {
    proclamation_slug: 'proclamation-r01-2019-sabc-hlaudi',
    law_short: 'SIU Act',
    section: 'Section 2',
    usage: SiuLawSectionUsage.ENABLING,
    relevance: 'The SIU sweep through contracts and conduct at the public broadcaster.',
  },
  {
    proclamation_slug: 'proclamation-r01-2019-sabc-hlaudi',
    law_short: 'PRECCA',
    section: 'Section 3',
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Corruption in multi-year deals and the alleged capture of the newsroom and procurement office.',
  },
  {
    proclamation_slug: 'proclamation-r01-2019-sabc-hlaudi',
    law_short: 'Broadcasting Act',
    section: 'Section 13',
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Fiduciary duties of the board; operating outside the legal governance framework.',
  },
  // Gauteng schools R23/2020 (sub-matter)
  {
    proclamation_slug: 'proclamation-r23-2020-gauteng-schools',
    law_short: 'SIU Act',
    section: 'Section 2',
    usage: SiuLawSectionUsage.ENABLING,
    relevance: 'Investigation of provincial education-department and school-related procurement in Gauteng.',
  },
  {
    proclamation_slug: 'proclamation-r23-2020-gauteng-schools',
    law_short: 'PRECCA',
    section: 'Section 3',
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Alleged corruption in school-sanitation and related infrastructure projects.',
  },
  {
    proclamation_slug: 'proclamation-r23-2020-gauteng-schools',
    law_short: 'PFMA',
    section: 'Section 86',
    usage: SiuLawSectionUsage.VIOLATED,
    relevance: 'Irregular, fruitless and wasteful use of the provincial education budget.',
  },
  // ACSA R228/2024
  {
    proclamation_slug: 'proclamation-r228-2024-acsa',
    law_short: 'SIU Act',
    section: 'Section 2',
    usage: SiuLawSectionUsage.ENABLING,
    relevance: 'Activation of the Airports Company procurement review.',
  },
  {
    proclamation_slug: 'proclamation-r228-2024-acsa',
    constitution_section_number: 84,
    usage: SiuLawSectionUsage.ENABLING,
    relevance: 'Presidential proclamation route used to open the airport-procurement leg.',
  },
  {
    proclamation_slug: 'proclamation-r228-2024-acsa',
    law_short: 'PFMA',
    section: 'Section 50',
    usage: SiuLawSectionUsage.INVESTIGATED,
    relevance: 'Duties of the accounting authority — the board must act in the best interests of the entity.',
  },
  {
    proclamation_slug: 'proclamation-r228-2024-acsa',
    constitution_section_number: 217,
    usage: SiuLawSectionUsage.INVESTIGATED,
    relevance:
      'Procurement in public-sector entities must be fair, transparent and competitive (Chapter 13).',
  },
];

async function ensureSiuCorpusLaws(m: EntityManager): Promise<void> {
  const lawRepo = m.getRepository(Law);
  for (const row of SIU_LAWS_TO_UPSERT) {
    const existing = await lawRepo.findOne({ where: { short_name: row.short_name } });
    if (existing) continue;
    await lawRepo.save(
      lawRepo.create({
        name: row.name,
        short_name: row.short_name,
        act_number: row.act_number,
        category: row.category,
        plain_english: row.plain_english,
        full_text_url: row.full_text_url,
      }),
    );
  }
}

async function ensureSiuLawSections(m: EntityManager): Promise<void> {
  const lawRepo = m.getRepository(Law);
  const sectionRepo = m.getRepository(LawSection);
  for (const row of SIU_LAW_SECTIONS_TO_UPSERT) {
    const law = await lawRepo.findOne({ where: { short_name: row.law_short } });
    if (!law) {
      throw new Error(
        `[siu seed] Law "${row.law_short}" not found for section ${row.section_number}`,
      );
    }
    const existing = await sectionRepo.findOne({
      where: { law_id: law.id, section_number: row.section_number },
    });
    if (existing) continue;
    await sectionRepo.save(
      sectionRepo.create({
        law_id: law.id,
        section_number: row.section_number,
        section_title: row.section_title,
        plain_english: row.plain_english,
        full_text: null,
      }),
    );
  }
}

async function ensureSiuConstitutionSections(m: EntityManager): Promise<void> {
  const repo = m.getRepository(ConstitutionSection);
  for (const row of SIU_CONSTITUTION_SECTIONS) {
    const existing = await repo.findOne({
      where: { section_number: row.section_number },
    });
    if (existing) continue;
    await repo.save(
      repo.create({
        chapter_number: row.chapter_number,
        section_number: row.section_number,
        section_title: row.section_title,
        plain_english: row.plain_english,
        full_text: null,
      }),
    );
  }
}

function isLawLink(
  r: ProclamationLinkRow,
): r is Extract<ProclamationLinkRow, { law_short: string; section: string }> {
  return 'law_short' in r;
}

async function upsertSiuProclamationLawSections(
  m: EntityManager,
  proclamations: Map<string, SiuProclamation>,
): Promise<void> {
  await ensureSiuCorpusLaws(m);
  await ensureSiuLawSections(m);
  await ensureSiuConstitutionSections(m);

  const linkRepo = m.getRepository(SiuProclamationLawSection);
  const lawRepo = m.getRepository(Law);
  const lawSectionRepo = m.getRepository(LawSection);
  const constRepo = m.getRepository(ConstitutionSection);

  const targetedSlugs = new Set(
    SIU_PROCLAMATION_LAW_LINKS.map((r) => r.proclamation_slug),
  );
  const ids: string[] = [];
  for (const s of targetedSlugs) {
    const p = proclamations.get(s);
    if (p) ids.push(p.id);
  }
  if (ids.length > 0) {
    await linkRepo.delete({ proclamation_id: In(ids) });
  }

  let inserted = 0;
  for (const row of SIU_PROCLAMATION_LAW_LINKS) {
    const proc = proclamations.get(row.proclamation_slug);
    if (!proc) {
      console.warn(
        `  · siu_proclamation_law_sections: skip unknown proclamation "${row.proclamation_slug}"`,
      );
      continue;
    }

    if (isLawLink(row)) {
      const law = await lawRepo.findOne({ where: { short_name: row.law_short } });
      if (!law) {
        throw new Error(
          `[siu seed] Law "${row.law_short}" not found (link ${row.proclamation_slug})`,
        );
      }
      const sec = await lawSectionRepo.findOne({
        where: { law_id: law.id, section_number: row.section },
      });
      if (!sec) {
        throw new Error(
          `[siu seed] Section "${row.section}" for law "${row.law_short}" not found`,
        );
      }
      await linkRepo.save(
        linkRepo.create({
          proclamation_id: proc.id,
          law_section_id: sec.id,
          constitution_section_id: null,
          usage_type: row.usage,
          relevance: row.relevance,
        }),
      );
      inserted++;
    } else {
      const csec = await constRepo.findOne({
        where: { section_number: row.constitution_section_number },
      });
      if (!csec) {
        throw new Error(
          `[siu seed] Constitution section ${row.constitution_section_number} not found`,
        );
      }
      await linkRepo.save(
        linkRepo.create({
          proclamation_id: proc.id,
          law_section_id: null,
          constitution_section_id: csec.id,
          usage_type: row.usage,
          relevance: row.relevance,
        }),
      );
      inserted++;
    }
  }

  console.log(`  · siu_proclamation_law_sections: ${inserted}`);
}

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized
    ? AppDataSource
    : await AppDataSource.initialize();

  console.log('\n── Seeding: SIU corpus ──');

  try {
    await dataSource.transaction(async (m) => {
      await upsertSiuBody(m);
      await upsertSpecialTribunal(m);
      const people = await upsertPeople(m);
      const proclamations = await upsertProclamations(m);
      await upsertOutcomes(m, proclamations);
      await upsertTribunalCases(m, proclamations);
      await linkProclamationPeople(m, proclamations, people);
      await upsertSiuProclamationLawSections(m, proclamations);
    });

    console.log('─────────────────────────────────');
    console.log('✓ SIU seed complete.\n');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  run().catch((err: unknown) => {
    console.error('\n✗ SIU seed failed:', err);
    process.exit(1);
  });
}
