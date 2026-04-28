/* eslint-disable no-console */

/**
 * adhoc-committees.seed.ts
 *
 * Seeds all ten notable Parliamentary Ad Hoc Committees (1998–2026) as
 * first-class {@link AdhocCommittee} entities, with join rows for people
 * and law sections and a back-link to any paired commission of inquiry.
 *
 * Safe to run repeatedly — every write is an upsert keyed on a stable
 * natural identifier (committee.slug, law.short_name + section_number,
 * person.full_name). The whole operation runs inside one transaction.
 *
 * Dependency order INSIDE this seed:
 *   1. Laws / LawSections         (referenced by adhoc_committee_law_sections)
 *   2. People                     (referenced by adhoc_committee_people)
 *   3. AdhocCommittees
 *   4. adhoc_committee_law_sections
 *   5. adhoc_committee_people
 *   6. Best-effort cross-link of the Mkhwanazi story (if it already exists)
 *
 * Relationship to OTHER seeds:
 *   • commissions-master.seed.ts — expected to run before this seed so the
 *     historical 21 commissions exist. This seed does NOT depend on any of
 *     them except the Madlanga Commission (Committee 1's related_commission).
 *
 *   • Madlanga Commission — owned by mkhwanazi.seed.ts. If this seed runs
 *     before mkhwanazi.seed.ts, Madlanga does not yet exist and Committee
 *     1's related_commission_id is left null. mkhwanazi.seed.ts then
 *     patches it at the end of its own run — so after the full chain
 *     completes, the link is always present regardless of ordering.
 *
 *   • The Mkhwanazi story (slug `mkhwanazi-madlanga-commission`) is seeded
 *     by mkhwanazi.seed.ts. Its adhoc_committee_id is set by whichever of
 *     the two seeds runs SECOND (both ends self-heal), so a full chain
 *     run converges to: story.commission = Madlanga AND
 *     story.adhoc_committee = Mkhwanazi Ad Hoc.
 *
 * Run with (inside apps/api):
 *   npm run seed:adhoc
 */

import 'reflect-metadata';

import type { EntityManager } from 'typeorm';

import {
  AdhocCommittee,
  AdhocCommitteeCategory,
  AdhocCommitteeStatus,
} from '../../entities/adhoc_committee.entity';
import {
  AdhocCommitteeLawSection,
  AdhocCommitteeLawSectionUsage,
} from '../../entities/adhoc_committee_law_section.entity';
import {
  AdhocCommitteePerson,
  AdhocCommitteePersonRole,
} from '../../entities/adhoc_committee_person.entity';
import { Commission, CommissionDomain } from '../../entities/commission.entity';
import { Law, LawCategory } from '../../entities/law.entity';
import { LawSection } from '../../entities/law_section.entity';
import { Person, PersonStatus } from '../../entities/person.entity';
import { Story } from '../../entities/story.entity';
import { AppDataSource } from '../data-source';

// ═══════════════════════════════════════════════════════════════════════════════
// Notes on domain values
// ═══════════════════════════════════════════════════════════════════════════════
//
// `domain` reuses the commissions enum (CommissionDomain). "accountability" is
// NOT a valid domain — it's an AdhocCommitteeCategory. Where the spec said
// `domain: 'accountability'` we map to the closest actual domain:
//   • SABC Board Inquiry (2017)        → politics  (public broadcaster governance)
//   • Nkandla (2015)                   → corruption (R246m + Public Protector findings)
//   • Public Protector Appointment '23 → politics  (Chapter 9 appointment)
//   • Mkhwebane Impeachment (2022/23)  → politics  (Chapter 9 head accountability)
// The architectural `category` on each row is where "accountability" lives.

// ═══════════════════════════════════════════════════════════════════════════════
// Laws & Constitution sections required by these committees
// ═══════════════════════════════════════════════════════════════════════════════

interface LawSectionSeed {
  section_number: string;
  section_title: string;
  plain_english: string;
}

interface LawSeed {
  short_name: string;
  name: string;
  act_number: string;
  category: LawCategory;
  plain_english: string;
  full_text_url: string | null;
  sections: LawSectionSeed[];
}

/**
 * Every Law / LawSection referenced by the 10 committees below.
 *
 * `Constitution`, `PRECCA` and `SAPS Act` are declared here too even though
 * earlier seeds already upsert them — each upsert is keyed on `short_name`
 * + `(law_id, section_number)`, so re-declaring is idempotent and gives
 * this seed order-independence when run on its own.
 */
const LAWS_SEED: readonly LawSeed[] = [
  {
    short_name: 'Constitution',
    name: 'Constitution of the Republic of South Africa, 1996',
    act_number: '108 of 1996',
    category: LawCategory.CONSTITUTIONAL,
    plain_english:
      "South Africa's supreme law. Everything the government does — every other law, every presidential order, every arrest — must fit inside it.",
    full_text_url:
      'https://www.gov.za/documents/constitution-republic-south-africa-1996',
    sections: [
      {
        section_number: 'Section 16',
        section_title: 'Freedom of expression',
        plain_english:
          'Everyone has the right to say what they think, to write it, to publish it and to receive and share information — including criticism of the government.',
      },
      {
        section_number: 'Section 19',
        section_title: 'Political rights',
        plain_english:
          'Every citizen may vote, stand for election, form a political party, and campaign freely. The fairness of those rights depends on knowing who is paying whom.',
      },
      {
        section_number: 'Section 25',
        section_title: 'Property rights / land',
        plain_english:
          'Nobody may have their property taken away except by a law of general application, and in the public interest, and with compensation. Section 25 is the section the Section 25 ad hoc committee tried — and failed — to amend.',
      },
      {
        section_number: 'Section 32',
        section_title: 'Right of access to information',
        plain_english:
          'Everyone has the right to information held by the state and to information held by anyone else if it is needed to protect a right. This is the section the Protection of State Information Bill would have limited.',
      },
      {
        section_number: 'Section 41',
        section_title: 'Principles of cooperative government',
        plain_english:
          'National, provincial and local government must work together, respect each other, and not get in each other\'s way. A disaster response that fails happens here.',
      },
      {
        section_number: 'Section 55(2)',
        section_title: 'National Assembly — scrutiny and oversight',
        plain_english:
          'The National Assembly must make sure that every part of government does its job honestly, and it must provide ways to hold the executive to account. This subsection is the root authority under which ad hoc committees are created.',
      },
      {
        section_number: 'Section 56',
        section_title: 'Powers of committees of Parliament',
        plain_english:
          'A parliamentary committee can summon any person to appear, give evidence or produce documents — the same investigative power a judicial commission has.',
      },
      {
        section_number: 'Section 74',
        section_title: 'Procedure for amending the Constitution',
        plain_english:
          'The Constitution can be changed, but only with very large majorities in Parliament — a two-thirds vote for most sections. Section 74 is why the Section 25 land amendment eventually failed: the votes were not there.',
      },
      {
        section_number: 'Section 83',
        section_title: 'Obligations of the President',
        plain_english:
          'The President must uphold, defend and respect the Constitution, and must promote the unity of the nation. The Constitutional Court found Zuma failed this obligation in the Nkandla matter.',
      },
      {
        section_number: 'Section 181',
        section_title: 'Chapter 9 institutions supporting democracy',
        plain_english:
          'Chapter 9 creates a set of independent bodies — the Public Protector, the Auditor-General, the Human Rights Commission and others — to guard democracy. No organ of state may interfere with their work.',
      },
      {
        section_number: 'Section 182',
        section_title: 'Powers of the Public Protector',
        plain_english:
          'The Public Protector may investigate improper conduct in government, report on it, and take remedial action. The Constitutional Court confirmed those remedial powers are legally binding.',
      },
      {
        section_number: 'Section 193',
        section_title: 'Appointment of Chapter 9 heads',
        plain_english:
          'The Public Protector, the Auditor-General and the heads of other Chapter 9 bodies are recommended by the National Assembly and then appointed by the President. This is the section under which ad hoc appointment committees sit.',
      },
      {
        section_number: 'Section 194',
        section_title: 'Removal of Chapter 9 heads',
        plain_english:
          'A Chapter 9 head can only be removed if Parliament finds they are guilty of misconduct, incapacity or incompetence. Section 194 was used for the first time in history to remove Public Protector Busisiwe Mkhwebane in 2023.',
      },
      {
        section_number: 'Section 205',
        section_title: 'Police service objects',
        plain_english:
          'The police must prevent, combat and investigate crime, maintain public order, and protect the public — without fear, favour or prejudice.',
      },
    ],
  },
  {
    short_name: 'PRECCA',
    name: 'Prevention and Combating of Corrupt Activities Act',
    act_number: '12 of 2004',
    category: LawCategory.CORRUPTION,
    plain_english:
      "South Africa's main anti-corruption law. It says it is illegal to give or take a bribe, to misuse your position for private gain, or to let corruption happen when you know about it.",
    full_text_url:
      'https://www.gov.za/documents/prevention-and-combating-corrupt-activities-act',
    sections: [
      {
        section_number: 'Section 3',
        section_title: 'General offence of corruption',
        plain_english:
          'The core crime: if anyone — in government or out — gives or receives any benefit in exchange for acting in a dishonest, biased or unauthorised way, that is corruption.',
      },
    ],
  },
  {
    short_name: 'SAPS Act',
    name: 'South African Police Service Act',
    act_number: '68 of 1995',
    category: LawCategory.POLICING,
    plain_english:
      'The law that creates the South African Police Service, sets out its command and control, and says who answers to whom inside the police.',
    full_text_url: 'https://www.gov.za/documents/south-african-police-service-act',
    sections: [
      {
        section_number: 'Section 207',
        section_title: 'Political responsibility for policing',
        plain_english:
          'The Minister of Police sets broad policy. The National Commissioner runs SAPS day-to-day. A Minister is not permitted to instruct the police on individual cases or operations.',
      },
    ],
  },
  {
    short_name: 'Broadcasting Act',
    name: 'Broadcasting Act',
    act_number: '4 of 1999',
    category: LawCategory.OTHER,
    plain_english:
      'The law that governs the South African Broadcasting Corporation (SABC) and all broadcasting in the country. It sets how the SABC board is appointed and what duties it owes the public.',
    full_text_url: 'https://www.gov.za/documents/broadcasting-act',
    sections: [
      {
        section_number: 'Section 13',
        section_title: 'Governance and composition of the SABC Board',
        plain_english:
          'The SABC Board runs the public broadcaster. Its members are recommended by the National Assembly and appointed by the President, and they answer to Parliament — not to any political party.',
      },
    ],
  },
  {
    short_name: 'Political Party Funding Act',
    name: 'Political Party Funding Act',
    act_number: '6 of 2018',
    category: LawCategory.OTHER,
    plain_english:
      'The law that forces political parties to disclose their private funders. Before this law, parties could accept donations in complete secrecy. Since 2021 any donation above R100,000 must be reported to the IEC.',
    full_text_url: 'https://www.gov.za/documents/political-party-funding-act',
    sections: [
      {
        section_number: 'Section 9',
        section_title: 'Disclosure of donations',
        plain_english:
          'Any political party that receives a donation above the legal threshold must tell the Electoral Commission who paid, how much, and when. The public can look the information up.',
      },
    ],
  },
  {
    short_name: 'State Information Bill',
    name: 'Protection of State Information Bill',
    act_number: 'B6B-2010 (never enacted)',
    category: LawCategory.OTHER,
    plain_english:
      "A bill — widely called the 'Secrecy Bill' — that would have let the state classify information and make it a crime to publish classified material, even when that material exposed wrongdoing. It was passed by the National Assembly in 2013 but never signed into law; it lapsed at the end of the 4th Parliament.",
    full_text_url: 'https://www.parliament.gov.za/bill/2005-16',
    sections: [
      {
        section_number: 'Bill B6B-2010',
        section_title: 'The bill as passed by the National Assembly in 2013',
        plain_english:
          'The full bill, passed in a contested National Assembly vote in April 2013. It was never signed by the President, it was never assented to, and it eventually lapsed. Press-freedom advocates treat the result as a key democratic win.',
      },
    ],
  },
  {
    short_name: 'PAIA',
    name: 'Promotion of Access to Information Act',
    act_number: '2 of 2000',
    category: LawCategory.OTHER,
    plain_english:
      'The law that makes section 32 of the Constitution real. It gives anyone the right to ask the state — and in some cases private bodies — for records, and forces those bodies to answer or give reasons for refusing.',
    full_text_url:
      'https://www.gov.za/documents/promotion-access-information-act',
    sections: [
      {
        section_number: 'Section 1',
        section_title: 'Object of the Act',
        plain_english:
          'Government is supposed to be open. This Act is the route by which a journalist, an NGO or an ordinary person can force a department to hand over the records it would rather hide.',
      },
    ],
  },
  {
    short_name: 'Disaster Management Act',
    name: 'Disaster Management Act',
    act_number: '57 of 2002',
    category: LawCategory.OTHER,
    plain_english:
      'The law that says how government must prepare for — and respond to — disasters like floods, fires and pandemics, and who is in charge at each level.',
    full_text_url: 'https://www.gov.za/documents/disaster-management-act',
    sections: [
      {
        section_number: 'Section 27',
        section_title: 'Declaration of a national state of disaster',
        plain_english:
          "The Minister responsible can declare a national disaster, which unlocks emergency powers — special procurement rules, deployment of resources, fast-track spending. How that money is actually used is what an oversight committee is meant to check.",
      },
    ],
  },
  {
    short_name: 'PFMA',
    name: 'Public Finance Management Act',
    act_number: '1 of 1999',
    category: LawCategory.OTHER,
    plain_english:
      "The main law on how national and provincial government must spend public money. Irregular, wasteful or fruitless spending — the Auditor-General's language — breaks this Act.",
    full_text_url: 'https://www.gov.za/documents/public-finance-management-act',
    sections: [
      {
        section_number: 'Section 38',
        section_title: 'Responsibilities of accounting officers',
        plain_english:
          'Every department has an accounting officer (usually the Director-General). They are personally responsible for making sure money is spent within the law — if they fail, they can be sanctioned or prosecuted.',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// People
// ═══════════════════════════════════════════════════════════════════════════════

interface PersonSeed {
  full_name: string;
  aliases: string[];
  current_role: string | null;
  organisation: string | null;
  status: PersonStatus;
  profile_summary: string;
}

/**
 * Upserted by `full_name`. Overlaps with commissions-master + mkhwanazi
 * seeds are intentional and idempotent — the later-running seed wins, and
 * both ends hold compatible data for the overlapping rows (Ramaphosa, Zuma,
 * Breytenbach, Mkhwanazi).
 */
const PEOPLE_SEED: readonly PersonSeed[] = [
  {
    full_name: 'Thandi Modise',
    aliases: ['Modise', 'Speaker Modise'],
    current_role: 'Former Minister of Defence and Military Veterans',
    organisation: 'African National Congress',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Speaker of the National Assembly from May 2019 to August 2021, during the 6th Parliament, and thereafter Minister of Defence. ANC veteran who presided over Parliament at the start of several of the committees in this seed.',
  },
  {
    full_name: 'Nosiviwe Mapisa-Nqakula',
    aliases: ['Mapisa-Nqakula', 'Speaker Mapisa-Nqakula'],
    current_role: 'Former Speaker of the National Assembly',
    organisation: 'African National Congress',
    status: PersonStatus.CHARGED,
    profile_summary:
      'Speaker of the National Assembly from August 2021 to April 2024. Resigned from Parliament in 2024 after being criminally charged with corruption and money-laundering arising from her previous time as Minister of Defence. Presumed innocent until proven guilty.',
  },
  {
    full_name: 'Baleka Mbete',
    aliases: ['Mbete', 'Speaker Mbete'],
    current_role: 'Former Speaker of the National Assembly',
    organisation: 'African National Congress',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'Speaker of the National Assembly for two terms (2004–2008 in the 3rd Parliament and 2014–2019 in the 5th Parliament). Presided over the House during the Nkandla Ad Hoc Committee and the SABC Board Inquiry.',
  },
  {
    full_name: 'Molapi Lekganyane',
    aliases: ['Lekganyane', 'Mr Lekganyane', 'Mr Molapi Lekganyane'],
    current_role: 'Chair — Mkhwanazi Ad Hoc Committee',
    organisation: 'African National Congress',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'ANC Member of Parliament appointed in 2025 to chair the National Assembly Ad Hoc Committee investigating the Mkhwanazi allegations — the parliamentary counterpart to the Madlanga Commission of Inquiry.',
  },
  {
    full_name: 'Glynnis Breytenbach',
    aliases: ['Breytenbach', 'Adv Breytenbach'],
    current_role: 'DA MP — Shadow Minister of Justice',
    organisation: 'Democratic Alliance',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Former senior prosecutor in the NPA and Democratic Alliance Member of Parliament. Sits on the Mkhwanazi Ad Hoc Committee and has served on several justice-cluster committees in the 6th and 7th Parliaments.',
  },
  {
    full_name: 'Julius Malema',
    aliases: ['Malema', 'Juju', 'CIC Malema'],
    current_role: 'President and Commander-in-Chief of the Economic Freedom Fighters',
    organisation: 'Economic Freedom Fighters',
    status: PersonStatus.ACTIVE,
    profile_summary:
      "Founder and leader of the Economic Freedom Fighters. Drove the political case for amending section 25 of the Constitution to permit expropriation without compensation, and served on the Section 25 Land Amendment ad hoc committee.",
  },
  {
    full_name: 'Nhlanhla Mkhwanazi',
    aliases: ['Mkhwanazi', 'Lt Gen Mkhwanazi', 'Nhlanhla Mkhwanazi'],
    current_role: 'KZN Provincial Police Commissioner',
    organisation: 'South African Police Service',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Provincial Commissioner of SAPS in KwaZulu-Natal. His 6 July 2025 press conference triggered both the Madlanga Commission of Inquiry and the parallel National Assembly Ad Hoc Committee that carries his name.',
  },
  {
    full_name: 'Mathole Motshekga',
    aliases: ['Motshekga', 'Dr Motshekga'],
    current_role: 'ANC MP',
    organisation: 'African National Congress',
    status: PersonStatus.ACTIVE,
    profile_summary:
      "Long-serving ANC Member of Parliament and constitutional-law academic. Chaired the Section 25 Land Amendment committee (2019–2021) and the ad hoc committee that recommended Tsakani Maluleke as Auditor-General (2020).",
  },
  {
    full_name: 'Vincent Smith',
    aliases: ['Smith', 'Adv Vincent Smith'],
    current_role: 'Former ANC MP',
    organisation: 'African National Congress',
    status: PersonStatus.CHARGED,
    profile_summary:
      'ANC Member of Parliament until 2019. Chaired both the SABC Board Inquiry (2017) and the Political Party Funding committee (2018). Subsequently charged with corruption and fraud in connection with Bosasa — matters that are ongoing before the courts.',
  },
  {
    full_name: 'Cedric Frolick',
    aliases: ['Frolick', 'Mr Frolick'],
    current_role: 'ANC MP',
    organisation: 'African National Congress',
    status: PersonStatus.ACTIVE,
    profile_summary:
      "Long-serving ANC Member of Parliament and House Chairperson for committees. Chaired the Nkandla Ad Hoc Committee (2015–2016) and the joint Flood Disaster Relief and Recovery Committee (2023).",
  },
  {
    full_name: 'Cecil Burgess',
    aliases: ['Burgess'],
    current_role: 'Former ANC MP',
    organisation: 'African National Congress',
    status: PersonStatus.RESIGNED,
    profile_summary:
      "ANC Member of Parliament in the 4th Parliament. Chaired the Ad Hoc Committee on the Protection of State Information Bill — the committee that processed what became known as the 'Secrecy Bill'.",
  },
  {
    full_name: 'Qubudile Dyantyi',
    aliases: ['Dyantyi', 'Richard Dyantyi', 'Qubudile Richard Dyantyi'],
    current_role: 'ANC MP',
    organisation: 'African National Congress',
    status: PersonStatus.ACTIVE,
    profile_summary:
      "ANC Member of Parliament in the 6th Parliament. Chaired the Section 194 Ad Hoc Committee that recommended the removal of Public Protector Busisiwe Mkhwebane — the first successful removal of a Chapter 9 institution head in democratic South Africa. Also chaired the 2023 ad hoc committee that recommended Kholeka Gcaleka for Public Protector.",
  },
  {
    full_name: 'Busisiwe Mkhwebane',
    aliases: ['Mkhwebane', 'Adv Mkhwebane', 'Advocate Busisiwe Mkhwebane'],
    current_role: 'Former Public Protector',
    organisation: 'Office of the Public Protector (former)',
    status: PersonStatus.RESIGNED,
    profile_summary:
      "Public Protector from October 2016 until August 2023, when the National Assembly voted 257–83 under section 194 of the Constitution to remove her for misconduct — the first such removal in democratic South Africa's history.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Committees
// ═══════════════════════════════════════════════════════════════════════════════

interface CommitteePersonLink {
  full_name: string;
  role: AdhocCommitteePersonRole;
  party_affiliation: string | null;
  summary: string | null;
}

interface CommitteeLawLink {
  law_short_name: string;
  section_number: string;
  usage_type: AdhocCommitteeLawSectionUsage;
}

interface CommitteeSeed {
  popular_name: string;
  full_name: string;
  slug: string;
  parliament_term: string | null;
  parliament_years: string | null;
  domain: CommissionDomain;
  category: AdhocCommitteeCategory;
  established_by: string;
  enabling_provision: string | null;
  is_joint_committee: boolean;
  chair_name: string | null;
  mandate_summary: string;
  plain_english_summary: string;
  announced_date: string | null;
  first_meeting_date: string | null;
  concluded_date: string | null;
  report_adopted_date: string | null;
  status: AdhocCommitteeStatus;
  outcome_summary: string | null;
  produced_legislative_change: boolean | null;
  produced_accountability_action: boolean | null;
  report_url: string | null;
  parliament_url: string | null;
  /** Slug of the related commission, or null. Resolved at insert time. */
  related_commission_slug: string | null;
  person_links: CommitteePersonLink[];
  law_links: CommitteeLawLink[];
}

const COMMITTEES_SEED: readonly CommitteeSeed[] = [
  // ── 1 ────────────────────────────────────────────────────────────────────
  {
    popular_name: 'Mkhwanazi Ad Hoc Committee',
    full_name:
      'Ad Hoc Committee to Investigate Allegations Made Public by Lieutenant General Nhlanhla Mkhwanazi on 6 July 2025',
    slug: 'adhoc-mkhwanazi-2025',
    parliament_term: '7th Parliament',
    parliament_years: '2024-2029',
    domain: CommissionDomain.CRIMINAL_JUSTICE,
    category: AdhocCommitteeCategory.ACCOUNTABILITY,
    established_by: 'National Assembly',
    enabling_provision: 'National Assembly Rule 253',
    is_joint_committee: false,
    chair_name: 'Molapi Lekganyane',
    mandate_summary:
      'To investigate the allegations made public by Lt Gen Mkhwanazi on 6 July 2025 concerning corruption, political interference, and criminality within the South African Police Service and Crime Intelligence, and to assess the security implications for the country.',
    plain_english_summary:
      "Parliament decided it also needed to investigate what General Mkhwanazi said about corruption in the police. Even though the President had already set up his own investigation (the Madlanga Commission), Parliament said: we are a separate part of government and we want to ask our own questions. So two groups are investigating the same thing — one for the President, one for Parliament.",
    announced_date: '2025-07-23',
    first_meeting_date: '2025-08-01',
    concluded_date: null,
    report_adopted_date: null,
    status: AdhocCommitteeStatus.ACTIVE,
    outcome_summary: null,
    produced_legislative_change: null,
    produced_accountability_action: null,
    report_url: null,
    parliament_url:
      'https://www.parliament.gov.za/ad-hoc-committee-gen-mkhwanazis-allegations',
    related_commission_slug: 'madlanga-commission',
    person_links: [
      {
        full_name: 'Molapi Lekganyane',
        role: AdhocCommitteePersonRole.CHAIR,
        party_affiliation: 'ANC',
        summary: 'Chair of the committee.',
      },
      {
        full_name: 'Glynnis Breytenbach',
        role: AdhocCommitteePersonRole.MEMBER,
        party_affiliation: 'DA',
        summary: 'Opposition member and former senior NPA prosecutor.',
      },
      {
        full_name: 'Nhlanhla Mkhwanazi',
        role: AdhocCommitteePersonRole.WITNESS,
        party_affiliation: null,
        summary:
          'The Lieutenant-General whose 6 July 2025 press conference triggered the committee.',
      },
    ],
    law_links: [
      {
        law_short_name: 'Constitution',
        section_number: 'Section 55(2)',
        usage_type: AdhocCommitteeLawSectionUsage.ENABLING,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 205',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
      {
        law_short_name: 'PRECCA',
        section_number: 'Section 3',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
      {
        law_short_name: 'SAPS Act',
        section_number: 'Section 207',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
    ],
  },

  // ── 2 ────────────────────────────────────────────────────────────────────
  {
    popular_name: 'Section 25 Land Amendment Committee',
    full_name:
      'Ad Hoc Committee to Initiate and Introduce Legislation Amending Section 25 of the Constitution',
    slug: 'adhoc-section-25-land-2019',
    parliament_term: '6th Parliament',
    parliament_years: '2019-2024',
    domain: CommissionDomain.POLITICS,
    category: AdhocCommitteeCategory.CONSTITUTIONAL_AMENDMENT,
    established_by: 'National Assembly',
    enabling_provision: 'National Assembly Rule 253',
    is_joint_committee: false,
    chair_name: 'Mathole Motshekga',
    mandate_summary:
      'To initiate and introduce legislation to amend Section 25 of the Constitution to make explicit that land may be expropriated without compensation where the public interest requires it.',
    plain_english_summary:
      'Section 25 of the Constitution is about property rights — especially land. Many South Africans feel they lost their land during apartheid and want it back. This committee was tasked with changing the Constitution to allow land to be taken from owners without paying them — for the benefit of the country. After much debate and public hearings, Parliament ultimately could not get the votes needed to change the Constitution.',
    announced_date: '2019-12-07',
    first_meeting_date: '2020-02-01',
    concluded_date: '2021-12-07',
    report_adopted_date: null,
    status: AdhocCommitteeStatus.CONCLUDED,
    outcome_summary:
      'The committee completed its work and a bill was introduced, but Parliament failed to pass the constitutional amendment with the required two-thirds majority before the 6th Parliament dissolved in 2024. The bill lapsed.',
    produced_legislative_change: false,
    produced_accountability_action: false,
    report_url: null,
    parliament_url: null,
    related_commission_slug: null,
    person_links: [
      {
        full_name: 'Mathole Motshekga',
        role: AdhocCommitteePersonRole.CHAIR,
        party_affiliation: 'ANC',
        summary: 'Chair of the committee.',
      },
      {
        full_name: 'Julius Malema',
        role: AdhocCommitteePersonRole.MEMBER,
        party_affiliation: 'EFF',
        summary:
          'EFF leader; pushed strongly for expropriation without compensation throughout the committee process.',
      },
    ],
    law_links: [
      {
        law_short_name: 'Constitution',
        section_number: 'Section 25',
        usage_type: AdhocCommitteeLawSectionUsage.BEING_PROCESSED,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 74',
        usage_type: AdhocCommitteeLawSectionUsage.ENABLING,
      },
    ],
  },

  // ── 3 ────────────────────────────────────────────────────────────────────
  {
    popular_name: 'SABC Board Inquiry Committee',
    full_name:
      'Ad Hoc Committee Enquiring into the Fitness of the Members of the SABC Board',
    slug: 'adhoc-sabc-board-2017',
    parliament_term: '5th Parliament',
    parliament_years: '2014-2019',
    // Spec said 'accountability'; mapped to politics (public-broadcaster governance).
    domain: CommissionDomain.POLITICS,
    category: AdhocCommitteeCategory.ACCOUNTABILITY,
    established_by: 'National Assembly',
    enabling_provision: 'National Assembly Rule 253',
    is_joint_committee: false,
    chair_name: 'Vincent Smith',
    mandate_summary:
      'To inquire into the fitness of the members of the SABC Board to hold office, following a period of severe governance failures, editorial interference, and financial mismanagement at the public broadcaster.',
    plain_english_summary:
      "The SABC — South Africa's public TV and radio — was in serious trouble. Its board was accused of doing their jobs badly, protecting the wrong people, and wasting public money. This committee investigated and decided whether the board members were doing a good enough job to stay.",
    announced_date: '2017-02-01',
    first_meeting_date: null,
    concluded_date: '2017-05-01',
    report_adopted_date: '2017-05-17',
    status: AdhocCommitteeStatus.CONCLUDED,
    outcome_summary:
      'Found the majority of SABC board members unfit to hold office. Parliament voted to remove them. New board members were subsequently appointed. The SABC remained in financial difficulty.',
    produced_legislative_change: false,
    produced_accountability_action: true,
    report_url: null,
    parliament_url: null,
    related_commission_slug: null,
    person_links: [
      {
        full_name: 'Vincent Smith',
        role: AdhocCommitteePersonRole.CHAIR,
        party_affiliation: 'ANC',
        summary:
          "Chair of the committee. Subsequently charged (in unrelated matters arising from the Bosasa corruption scandal). Presumed innocent until proven guilty.",
      },
    ],
    law_links: [
      {
        law_short_name: 'Broadcasting Act',
        section_number: 'Section 13',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 181',
        usage_type: AdhocCommitteeLawSectionUsage.ENABLING,
      },
    ],
  },

  // ── 4 ────────────────────────────────────────────────────────────────────
  {
    popular_name: 'Nkandla Ad Hoc Committee',
    full_name:
      "Ad Hoc Committee on the Police Minister's Report on the Security Upgrades at the President's Private Home at Nkandla",
    slug: 'adhoc-nkandla-2015',
    parliament_term: '5th Parliament',
    parliament_years: '2014-2019',
    // Spec said 'accountability'; mapped to corruption (R246m + PP remedial action).
    domain: CommissionDomain.CORRUPTION,
    category: AdhocCommitteeCategory.ACCOUNTABILITY,
    established_by: 'National Assembly',
    enabling_provision: 'National Assembly Rule 253',
    is_joint_committee: false,
    chair_name: 'Cedric Frolick',
    mandate_summary:
      "To consider the Police Minister's report on the security upgrades at President Zuma's private Nkandla homestead, which cost taxpayers over R246 million, and the Public Protector's remedial action requiring Zuma to repay a portion.",
    plain_english_summary:
      "President Zuma's private home got over R246 million worth of upgrades paid for by the government. Some of it — like the swimming pool — had nothing to do with security. The Public Protector (like the country's official complaint-handler) said Zuma must pay some of the money back. Parliament's committee looked at whether the Police Minister's explanation was good enough. The Constitutional Court later ruled that Zuma had to pay back the money and that Parliament had failed to hold him accountable.",
    announced_date: '2015-11-01',
    first_meeting_date: null,
    concluded_date: '2016-05-01',
    report_adopted_date: null,
    status: AdhocCommitteeStatus.CONCLUDED,
    outcome_summary:
      "The committee accepted the Police Minister's report and effectively absolved Zuma — a decision widely condemned. The Constitutional Court subsequently ruled in March 2016 that Zuma had failed to uphold the Constitution, and that the National Assembly had failed in its constitutional duty to hold the President accountable. Zuma was ultimately ordered to repay R7.8 million. The Constitutional Court, in effect, said the committee got it wrong — the highest court in the country said Parliament failed to do its job here.",
    produced_legislative_change: false,
    produced_accountability_action: false,
    report_url: null,
    parliament_url: null,
    related_commission_slug: null,
    person_links: [
      {
        full_name: 'Cedric Frolick',
        role: AdhocCommitteePersonRole.CHAIR,
        party_affiliation: 'ANC',
        summary: 'Chair of the committee.',
      },
      {
        full_name: 'Jacob Zuma',
        role: AdhocCommitteePersonRole.IMPLICATED,
        party_affiliation: 'ANC',
        summary:
          "Then President. Subject of the Police Minister's report the committee was processing, and subsequently ordered by the Constitutional Court to repay a portion of the Nkandla costs.",
      },
    ],
    law_links: [
      {
        law_short_name: 'Constitution',
        section_number: 'Section 55(2)',
        usage_type: AdhocCommitteeLawSectionUsage.ENABLING,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 83',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 181',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
      {
        law_short_name: 'PRECCA',
        section_number: 'Section 3',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
    ],
  },

  // ── 5 ────────────────────────────────────────────────────────────────────
  {
    popular_name: 'Secrecy Bill Committee',
    full_name: 'Ad Hoc Committee on the Protection of State Information Bill',
    slug: 'adhoc-secrecy-bill-2012',
    parliament_term: '4th Parliament',
    parliament_years: '2009-2014',
    domain: CommissionDomain.POLITICS,
    category: AdhocCommitteeCategory.LEGISLATION,
    established_by: 'National Assembly',
    enabling_provision: 'National Assembly Rule 253',
    is_joint_committee: false,
    chair_name: 'Cecil Burgess',
    mandate_summary:
      "To process the Protection of State Information Bill, widely known as the 'Secrecy Bill', which proposed to classify state information and criminalise its disclosure — raising serious concerns about press freedom and the right of access to information.",
    plain_english_summary:
      'The government wanted a new law that would make it a crime to share certain government secrets — even if those secrets showed the government was doing something wrong. Journalists, civil society organisations and opposition parties were very worried this law would be used to hide corruption. This committee debated and processed the bill.',
    announced_date: '2012-01-01',
    first_meeting_date: null,
    concluded_date: '2013-04-25',
    report_adopted_date: '2013-04-25',
    status: AdhocCommitteeStatus.CONCLUDED,
    outcome_summary:
      'The bill was passed by the National Assembly in April 2013 but was referred back by the NCOP. It was never signed into law and remained unsigned at the end of the 4th Parliament. It lapsed and was never enacted.',
    produced_legislative_change: true,
    produced_accountability_action: false,
    report_url: null,
    parliament_url: null,
    related_commission_slug: null,
    person_links: [
      {
        full_name: 'Cecil Burgess',
        role: AdhocCommitteePersonRole.CHAIR,
        party_affiliation: 'ANC',
        summary: 'Chair of the committee.',
      },
    ],
    law_links: [
      {
        law_short_name: 'State Information Bill',
        section_number: 'Bill B6B-2010',
        usage_type: AdhocCommitteeLawSectionUsage.BEING_PROCESSED,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 16',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 32',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
      {
        law_short_name: 'PAIA',
        section_number: 'Section 1',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
    ],
  },

  // ── 6 ────────────────────────────────────────────────────────────────────
  {
    popular_name: 'Party Funding Committee',
    full_name: 'Ad Hoc Committee on the Funding of Political Parties',
    slug: 'adhoc-party-funding-2018',
    parliament_term: '5th Parliament',
    parliament_years: '2014-2019',
    domain: CommissionDomain.POLITICS,
    category: AdhocCommitteeCategory.LEGISLATION,
    established_by: 'National Assembly',
    enabling_provision: 'National Assembly Rule 253',
    is_joint_committee: false,
    chair_name: 'Vincent Smith',
    mandate_summary:
      'To introduce and process legislation requiring disclosure of private funding sources of political parties, in response to Constitutional Court rulings that the absence of such legislation was unconstitutional.',
    plain_english_summary:
      'Before this committee, political parties could receive donations from businesses and wealthy people in total secrecy. Nobody knew who was paying for political campaigns — which meant businesses could secretly buy influence. The Constitutional Court said this was unconstitutional. This committee wrote the law that forces parties to disclose who gives them money.',
    announced_date: '2018-03-01',
    first_meeting_date: null,
    concluded_date: '2018-12-07',
    report_adopted_date: '2018-12-07',
    status: AdhocCommitteeStatus.CONCLUDED,
    outcome_summary:
      'Produced the Political Party Funding Act 6 of 2018, which came into force in 2021. For the first time, parties must disclose donations above R100,000. The My Vote Counts case that forced this committee into existence is a landmark in South African transparency law.',
    produced_legislative_change: true,
    produced_accountability_action: false,
    report_url: null,
    parliament_url: null,
    related_commission_slug: null,
    person_links: [
      {
        full_name: 'Vincent Smith',
        role: AdhocCommitteePersonRole.CHAIR,
        party_affiliation: 'ANC',
        summary: 'Chair of the committee.',
      },
    ],
    law_links: [
      {
        law_short_name: 'Constitution',
        section_number: 'Section 19',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 32',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
      {
        law_short_name: 'Political Party Funding Act',
        section_number: 'Section 9',
        usage_type: AdhocCommitteeLawSectionUsage.BEING_PROCESSED,
      },
    ],
  },

  // ── 7 ────────────────────────────────────────────────────────────────────
  {
    popular_name: 'Flood Disaster Relief Committee',
    full_name: 'Ad Hoc Joint Committee on Flood Disaster Relief and Recovery',
    slug: 'adhoc-flood-disaster-2023',
    parliament_term: '6th Parliament',
    parliament_years: '2019-2024',
    domain: CommissionDomain.PUBLIC_SAFETY,
    category: AdhocCommitteeCategory.DISASTER_RESPONSE,
    established_by: 'National Assembly and National Council of Provinces',
    enabling_provision: 'Joint Rule 138 (Joint Committees)',
    is_joint_committee: true,
    chair_name: 'Cedric Frolick',
    mandate_summary:
      "To oversee government's response to catastrophic flooding in KwaZulu-Natal (April 2022) and other provinces, monitor relief and recovery spending, and make recommendations on disaster preparedness.",
    plain_english_summary:
      'In April 2022, terrible floods hit KwaZulu-Natal. More than 400 people died and hundreds of thousands lost their homes. Billions of rand were supposed to be spent helping people rebuild. This joint committee — with members from both houses of Parliament — checked whether that money was actually being spent correctly and whether people were being helped.',
    announced_date: '2023-02-01',
    first_meeting_date: null,
    concluded_date: '2023-09-01',
    report_adopted_date: null,
    status: AdhocCommitteeStatus.CONCLUDED,
    outcome_summary:
      'Found significant failures in disaster relief delivery, procurement irregularities in reconstruction spending, and inadequate coordination between national and provincial government. Recommendations made for Disaster Management Act reforms.',
    produced_legislative_change: false,
    produced_accountability_action: false,
    report_url: null,
    parliament_url: null,
    related_commission_slug: null,
    person_links: [
      {
        full_name: 'Cedric Frolick',
        role: AdhocCommitteePersonRole.CHAIR,
        party_affiliation: 'ANC',
        summary: 'Chair of the joint committee.',
      },
    ],
    law_links: [
      {
        law_short_name: 'Disaster Management Act',
        section_number: 'Section 27',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 41',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
      {
        law_short_name: 'PFMA',
        section_number: 'Section 38',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
    ],
  },

  // ── 8 ────────────────────────────────────────────────────────────────────
  {
    popular_name: 'Public Protector Appointment Committee 2023',
    full_name:
      'Ad Hoc Committee to Recommend Candidates for Appointment as Public Protector',
    slug: 'adhoc-public-protector-2023',
    parliament_term: '6th Parliament',
    parliament_years: '2019-2024',
    // Spec said 'accountability'; mapped to politics (Chapter 9 appointment process).
    domain: CommissionDomain.POLITICS,
    category: AdhocCommitteeCategory.APPOINTMENTS,
    established_by: 'National Assembly',
    enabling_provision: 'National Assembly Rule 253 + Constitution Section 193',
    is_joint_committee: false,
    chair_name: 'Qubudile Dyantyi',
    mandate_summary:
      'To interview and recommend candidates to the President for appointment as Public Protector, following the term end of Busisiwe Mkhwebane.',
    plain_english_summary:
      "The Public Protector is like the country's official complaint handler — they investigate when government does something wrong to ordinary citizens. When the old Public Protector's term ended, Parliament needed to recommend who the next one should be. This committee interviewed candidates and chose a recommendation for the President.",
    announced_date: '2023-03-01',
    first_meeting_date: null,
    concluded_date: '2023-10-01',
    report_adopted_date: null,
    status: AdhocCommitteeStatus.CONCLUDED,
    outcome_summary:
      'Recommended Kholeka Gcaleka, who was subsequently appointed as Public Protector by President Ramaphosa.',
    produced_legislative_change: false,
    produced_accountability_action: false,
    report_url: null,
    parliament_url: null,
    related_commission_slug: null,
    person_links: [
      {
        full_name: 'Qubudile Dyantyi',
        role: AdhocCommitteePersonRole.CHAIR,
        party_affiliation: 'ANC',
        summary: 'Chair of the committee.',
      },
    ],
    law_links: [
      {
        law_short_name: 'Constitution',
        section_number: 'Section 181',
        usage_type: AdhocCommitteeLawSectionUsage.ENABLING,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 193',
        usage_type: AdhocCommitteeLawSectionUsage.ENABLING,
      },
    ],
  },

  // ── 9 ────────────────────────────────────────────────────────────────────
  {
    popular_name: 'Auditor-General Appointment Committee 2020',
    full_name:
      'Ad Hoc Committee to Recommend a Candidate for Appointment as Auditor-General',
    slug: 'adhoc-auditor-general-2020',
    parliament_term: '6th Parliament',
    parliament_years: '2019-2024',
    domain: CommissionDomain.FINANCIAL,
    category: AdhocCommitteeCategory.APPOINTMENTS,
    established_by: 'National Assembly',
    enabling_provision: 'National Assembly Rule 253 + Constitution Section 193',
    is_joint_committee: false,
    chair_name: 'Mathole Motshekga',
    mandate_summary:
      'To interview and recommend a candidate to the President for appointment as Auditor-General, following the retirement of Kimi Makwetu.',
    plain_english_summary:
      'The Auditor-General is the person who checks whether government departments are spending money correctly. They have a very important job — finding waste and corruption in government accounts. This committee chose who the next Auditor-General should be.',
    announced_date: '2020-01-01',
    first_meeting_date: null,
    concluded_date: '2020-05-01',
    report_adopted_date: null,
    status: AdhocCommitteeStatus.CONCLUDED,
    outcome_summary:
      'Recommended Tsakani Maluleke, who was subsequently appointed as Auditor-General — the first woman to hold this position.',
    produced_legislative_change: false,
    produced_accountability_action: false,
    report_url: null,
    parliament_url: null,
    related_commission_slug: null,
    person_links: [
      {
        full_name: 'Mathole Motshekga',
        role: AdhocCommitteePersonRole.CHAIR,
        party_affiliation: 'ANC',
        summary: 'Chair of the committee.',
      },
    ],
    law_links: [
      {
        law_short_name: 'Constitution',
        section_number: 'Section 181',
        usage_type: AdhocCommitteeLawSectionUsage.ENABLING,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 193',
        usage_type: AdhocCommitteeLawSectionUsage.ENABLING,
      },
    ],
  },

  // ── 10 ───────────────────────────────────────────────────────────────────
  {
    popular_name: 'Mkhwebane Impeachment Committee',
    full_name:
      'Independent Panel and Ad Hoc Committee on Section 194 Inquiry into the Fitness of Advocate Busisiwe Mkhwebane to Hold Office as Public Protector',
    slug: 'adhoc-mkhwebane-section194-2022',
    parliament_term: '6th Parliament',
    parliament_years: '2019-2024',
    // Spec said 'accountability'; mapped to politics (Chapter 9 head accountability via Parliament).
    domain: CommissionDomain.POLITICS,
    category: AdhocCommitteeCategory.ACCOUNTABILITY,
    established_by: 'National Assembly',
    enabling_provision: 'Constitution Section 194 + National Assembly Rule 129R',
    is_joint_committee: false,
    chair_name: 'Qubudile Dyantyi',
    mandate_summary:
      'To conduct a Section 194 inquiry into whether Public Protector Busisiwe Mkhwebane was guilty of misconduct or incapacity, following multiple court findings against her and a preliminary independent panel finding that there was a prima facie case.',
    plain_english_summary:
      "The Public Protector Busisiwe Mkhwebane had lost many cases in court. Judges had said she acted in bad faith and was dishonest. Parliament decided to investigate whether she should be removed from her job. This was only the second time in South Africa's history that Section 194 of the Constitution — the removal process for Chapter 9 heads — was ever used. No Chapter 9 institution head had ever been removed by Parliament before. It took almost 30 years of democracy for this constitutional mechanism to actually be used.",
    announced_date: '2022-02-01',
    first_meeting_date: '2022-09-01',
    concluded_date: '2023-06-01',
    report_adopted_date: '2023-08-22',
    status: AdhocCommitteeStatus.CONCLUDED,
    outcome_summary:
      "The committee found Mkhwebane guilty of misconduct and recommended her removal. The National Assembly voted 257–83 to remove her on 22 August 2023 — the first removal of a Chapter 9 head in democratic South Africa's history.",
    produced_legislative_change: false,
    produced_accountability_action: true,
    report_url: null,
    parliament_url: null,
    related_commission_slug: null,
    person_links: [
      {
        full_name: 'Qubudile Dyantyi',
        role: AdhocCommitteePersonRole.CHAIR,
        party_affiliation: 'ANC',
        summary: 'Chair of the Section 194 inquiry.',
      },
      {
        full_name: 'Busisiwe Mkhwebane',
        role: AdhocCommitteePersonRole.IMPLICATED,
        party_affiliation: null,
        // Schema note: the adhoc-committee person-role enum does not carry a
        // dedicated `subject_of_inquiry` value (the commissions enum does).
        // `implicated` is the closest approximation for a section 194 fitness
        // inquiry, and the summary field carries the precise meaning.
        summary:
          'Public Protector whose fitness to hold office was the subject of this section 194 inquiry. Removed by the National Assembly on 22 August 2023 — the first removal of a Chapter 9 institution head in democratic South Africa.',
      },
    ],
    law_links: [
      {
        law_short_name: 'Constitution',
        section_number: 'Section 194',
        usage_type: AdhocCommitteeLawSectionUsage.ENABLING,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 181',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 182',
        usage_type: AdhocCommitteeLawSectionUsage.INVESTIGATED,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Upsert helpers
// ═══════════════════════════════════════════════════════════════════════════════

async function upsertLaws(m: EntityManager): Promise<Map<string, LawSection>> {
  const lawRepo = m.getRepository(Law);
  const sectionRepo = m.getRepository(LawSection);
  const sections = new Map<string, LawSection>();

  for (const seed of LAWS_SEED) {
    const lawPayload = {
      name: seed.name,
      short_name: seed.short_name,
      act_number: seed.act_number,
      category: seed.category,
      plain_english: seed.plain_english,
      full_text_url: seed.full_text_url,
    };

    let law = await lawRepo.findOne({ where: { short_name: seed.short_name } });
    if (!law) {
      law = lawRepo.create(lawPayload);
      law = await lawRepo.save(law);
    } else {
      Object.assign(law, lawPayload);
      law = await lawRepo.save(law);
    }

    for (const secSeed of seed.sections) {
      let section = await sectionRepo.findOne({
        where: { law_id: law.id, section_number: secSeed.section_number },
      });
      if (!section) {
        section = sectionRepo.create({ law_id: law.id, ...secSeed });
        section = await sectionRepo.save(section);
      } else {
        Object.assign(section, secSeed);
        section = await sectionRepo.save(section);
      }
      sections.set(`${seed.short_name}::${secSeed.section_number}`, section);
    }
  }

  console.log(`  · Laws: ${LAWS_SEED.length}, law sections: ${sections.size}`);
  return sections;
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

/**
 * Upsert a Person by `full_name` if they are referenced by a committee but
 * were not declared in this seed's PEOPLE_SEED (e.g. 'Jacob Zuma', who is
 * already seeded by commissions-master.seed.ts). Returns the row.
 */
async function resolveExistingPerson(
  m: EntityManager,
  fullName: string,
): Promise<Person> {
  const repo = m.getRepository(Person);
  const person = await repo.findOne({ where: { full_name: fullName } });
  if (!person) {
    throw new Error(
      `Person "${fullName}" was referenced by a committee but is not seeded anywhere. ` +
        `Add them to PEOPLE_SEED in this file or to commissions-master.seed.ts.`,
    );
  }
  return person;
}

async function upsertCommittees(
  m: EntityManager,
): Promise<Map<string, AdhocCommittee>> {
  const repo = m.getRepository(AdhocCommittee);
  const commissionRepo = m.getRepository(Commission);
  const bySlug = new Map<string, AdhocCommittee>();

  let linkedToCommission = 0;
  let deferredCommissionLink = 0;

  for (const seed of COMMITTEES_SEED) {
    let relatedCommissionId: string | null = null;
    if (seed.related_commission_slug) {
      const c = await commissionRepo.findOne({
        where: { slug: seed.related_commission_slug },
      });
      if (c) {
        relatedCommissionId = c.id;
        linkedToCommission++;
      } else {
        deferredCommissionLink++;
        console.log(
          `  ! Related commission "${seed.related_commission_slug}" not found ` +
            `when seeding "${seed.slug}". Leaving related_commission_id null ` +
            `— will be patched by mkhwanazi.seed.ts when Madlanga is seeded.`,
        );
      }
    }

    const payload = {
      popular_name: seed.popular_name,
      full_name: seed.full_name,
      slug: seed.slug,
      parliament_term: seed.parliament_term,
      parliament_years: seed.parliament_years,
      domain: seed.domain,
      category: seed.category,
      established_by: seed.established_by,
      enabling_provision: seed.enabling_provision,
      is_joint_committee: seed.is_joint_committee,
      chair_name: seed.chair_name,
      mandate_summary: seed.mandate_summary,
      plain_english_summary: seed.plain_english_summary,
      announced_date: seed.announced_date,
      first_meeting_date: seed.first_meeting_date,
      concluded_date: seed.concluded_date,
      report_adopted_date: seed.report_adopted_date,
      status: seed.status,
      outcome_summary: seed.outcome_summary,
      produced_legislative_change: seed.produced_legislative_change,
      produced_accountability_action: seed.produced_accountability_action,
      report_url: seed.report_url,
      parliament_url: seed.parliament_url,
      related_commission_id: relatedCommissionId,
    };

    let committee = await repo.findOne({ where: { slug: seed.slug } });
    if (!committee) {
      committee = repo.create(payload);
      committee = await repo.save(committee);
    } else {
      Object.assign(committee, payload);
      committee = await repo.save(committee);
    }
    bySlug.set(seed.slug, committee);
  }

  console.log(
    `  · Committees: ${bySlug.size} (commission links resolved: ${linkedToCommission}, deferred: ${deferredCommissionLink})`,
  );
  return bySlug;
}

async function linkCommitteeLawSections(
  m: EntityManager,
  committees: Map<string, AdhocCommittee>,
  lawSections: Map<string, LawSection>,
): Promise<void> {
  const repo = m.getRepository(AdhocCommitteeLawSection);
  let count = 0;

  for (const seed of COMMITTEES_SEED) {
    const committee = committees.get(seed.slug);
    if (!committee) continue;

    for (const link of seed.law_links) {
      const key = `${link.law_short_name}::${link.section_number}`;
      const section = lawSections.get(key);
      if (!section) {
        throw new Error(
          `linkCommitteeLawSections: law section "${key}" missing when linking ` +
            `committee "${seed.slug}" — add it to LAWS_SEED first.`,
        );
      }

      const payload = {
        adhoc_committee_id: committee.id,
        law_section_id: section.id,
        usage_type: link.usage_type,
      };

      let existing = await repo.findOne({
        where: {
          adhoc_committee_id: committee.id,
          law_section_id: section.id,
          usage_type: link.usage_type,
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

  console.log(`  · Committee → law section links: ${count}`);
}

async function linkCommitteePeople(
  m: EntityManager,
  committees: Map<string, AdhocCommittee>,
  people: Map<string, Person>,
): Promise<void> {
  const repo = m.getRepository(AdhocCommitteePerson);
  let count = 0;

  for (const seed of COMMITTEES_SEED) {
    const committee = committees.get(seed.slug);
    if (!committee) continue;

    for (const link of seed.person_links) {
      let person = people.get(link.full_name);
      if (!person) {
        person = await resolveExistingPerson(m, link.full_name);
      }

      const payload = {
        adhoc_committee_id: committee.id,
        person_id: person.id,
        role: link.role,
        party_affiliation: link.party_affiliation,
        summary: link.summary,
      };

      let existing = await repo.findOne({
        where: {
          adhoc_committee_id: committee.id,
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

  console.log(`  · Committee → person links: ${count}`);
}

/**
 * Best-effort back-link: if the Mkhwanazi story (owned by mkhwanazi.seed.ts)
 * already exists, set its `adhoc_committee_id` to point at this seed's
 * Mkhwanazi committee. If the story is not yet seeded, do nothing — the
 * mkhwanazi seed will set the link itself when it runs.
 */
async function crossLinkMkhwanaziStory(
  m: EntityManager,
  committees: Map<string, AdhocCommittee>,
): Promise<void> {
  const STORY_SLUG = 'mkhwanazi-madlanga-commission';
  const COMMITTEE_SLUG = 'adhoc-mkhwanazi-2025';

  const committee = committees.get(COMMITTEE_SLUG);
  if (!committee) return;

  const storyRepo = m.getRepository(Story);
  const story = await storyRepo.findOne({ where: { slug: STORY_SLUG } });

  if (!story) {
    console.log(
      `  · Mkhwanazi story not yet seeded — story ↔ committee link will be ` +
        `set by mkhwanazi.seed.ts on its run.`,
    );
    return;
  }

  if (story.adhoc_committee_id === committee.id) {
    console.log(`  · Mkhwanazi story already linked to ${COMMITTEE_SLUG}.`);
    return;
  }

  story.adhoc_committee_id = committee.id;
  await storyRepo.save(story);
  console.log(`  · Patched story "${STORY_SLUG}" → committee "${COMMITTEE_SLUG}".`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Entry point
// ═══════════════════════════════════════════════════════════════════════════════

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized
    ? AppDataSource
    : await AppDataSource.initialize();

  console.log('\n── Seeding: ad hoc committees ──');

  try {
    await dataSource.transaction(async (m) => {
      const lawSections = await upsertLaws(m);
      const people = await upsertPeople(m);
      const committees = await upsertCommittees(m);
      await linkCommitteeLawSections(m, committees, lawSections);
      await linkCommitteePeople(m, committees, people);
      await crossLinkMkhwanaziStory(m, committees);
    });

    console.log('─────────────────────────────────');
    console.log('✓ Ad hoc committees seed complete.\n');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  run().catch((err: unknown) => {
    console.error('\n✗ Ad hoc committees seed failed:', err);
    process.exit(1);
  });
}
