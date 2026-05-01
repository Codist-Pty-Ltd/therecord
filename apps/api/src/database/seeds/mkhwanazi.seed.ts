/* eslint-disable no-console */

/**
 * mkhwanazi.seed.ts
 *
 * Seeds the complete "Mkhwanazi / Madlanga Commission" story into the
 * database. Safe to run repeatedly — every write is an upsert keyed on a
 * stable natural identifier (slug / full_name / act_number / etc.), and the
 * whole operation runs inside a single transaction.
 *
 * Run with:
 *   npm run seed           # inside apps/api
 *   ts-node apps/api/src/database/seeds/mkhwanazi.seed.ts
 *
 * Requires DATABASE_URL in the environment (see .env.example).
 */

import 'reflect-metadata';

import { IsNull, type EntityManager } from 'typeorm';

import {
  Commission,
  CommissionDomain,
  CommissionStatus,
} from '../../entities/commission.entity';
import {
  CommissionPerson,
  CommissionPersonRole,
} from '../../entities/commission_person.entity';
import { AdhocCommittee } from '../../entities/adhoc_committee.entity';
import { ConstitutionSection } from '../../entities/constitution_section.entity';
import { EventLegalReference } from '../../entities/event_legal_reference.entity';
import {
  Investigation,
  InvestigationStatus,
  InvestigationType,
} from '../../entities/investigation.entity';
import { Law, LawCategory } from '../../entities/law.entity';
import { LawSection } from '../../entities/law_section.entity';
import { Person, PersonStatus } from '../../entities/person.entity';
import { SimilarityReason } from '../../entities/similar-story.entity';
import { Story, StoryDomain, StoryStatus } from '../../entities/story.entity';
import { StoryPerson } from '../../entities/story_person.entity';
import {
  EventSignificance,
  EventType,
  TimelineEvent,
} from '../../entities/timeline_event.entity';
import { AppDataSource } from '../data-source';
import { upsertSimilarPair } from './cape-town-stories.seed';

// ───────────────────────────────────────────────────────────────────────────────
// Seed input data
// ───────────────────────────────────────────────────────────────────────────────

const STORY_SLUG = 'mkhwanazi-madlanga-commission';
const COMMISSION_SLUG = 'madlanga-commission';
/**
 * Slug of the paired National Assembly Ad Hoc Committee (seeded by
 * adhoc-committees.seed.ts). If that seed has already run, the Mkhwanazi
 * story is cross-linked to the committee on the way in here. If it has not,
 * we leave story.adhoc_committee_id null — the adhoc seed's own best-effort
 * patch will set it when it eventually runs.
 */
const ADHOC_COMMITTEE_SLUG = 'adhoc-mkhwanazi-2025';

// ───────────────────────────────────────────────────────────────────────────────
// Madlanga Commission — first-class Commission record
//
// Seeded here (rather than in commissions-master.seed.ts) because the Commission
// is tightly coupled to this story: `stories.commission_id` points back at it,
// and we want the commission and the story it is tied to to be born together.
// The master seed explicitly skips this slug.
// ───────────────────────────────────────────────────────────────────────────────

const COMMISSION_SEED = {
  slug: COMMISSION_SLUG,
  popular_name: 'Madlanga Commission',
  full_name:
    "Judicial Commission of Inquiry into Allegations of Criminality, Political Interference and Corruption in the Criminal Justice System",
  domain: CommissionDomain.CRIMINAL_JUSTICE,
  enabling_legislation: 'Commissions Act 8 of 1947 Section 1',
  constitution_section_invoked: 'Section 84(2)(f)',
  reason_summary:
    "To investigate General Mkhwanazi's allegations that senior SAPS leadership and the Ministry of Police protected a criminal syndicate linked to businessman Vusimuzi 'Cat' Matlala, including the disbandment of the Political Killings Task Team and the handling of the Medicare 24 Tshwane District healthcare contract.",
  plain_english_summary:
    "A retired judge — Justice Mbuyiseli Madlanga — was asked by the President to investigate very serious allegations made by a top police general. The allegations say powerful people inside the police and government were protecting criminals. The commission is gathering evidence in public so the country can see what is true.",
  chair_name: 'Mbuyiseli Madlanga',
  announced_date: '2025-07-14',
  hearings_started: '2025-09-17',
  concluded_date: null,
  report_released_date: null,
  status: CommissionStatus.ACTIVE,
  official_url: 'https://criminaljusticecommission.org.za',
  report_url: null,
  cost_rands: null,
  total_hearing_days: null,
  outcome_summary: null,
  produced_prosecutions: null,
  president_who_established: 'Cyril Ramaphosa',
} as const;

/**
 * Cross-commission people linked from the Mkhwanazi story. Ramaphosa is
 * upserted here rather than in the main PEOPLE_SEED so the main list stays
 * scoped to the Mkhwanazi-story graph; the Madlanga-Ramaphosa link is
 * genuinely commission-level, not story-level.
 */
const RAMAPHOSA_SEED = {
  full_name: 'Cyril Ramaphosa',
  aliases: ['Ramaphosa', 'President Ramaphosa', 'CR'],
  current_role: 'President of South Africa',
  organisation: 'African National Congress',
  status: PersonStatus.ACTIVE,
  profile_summary:
    "President of South Africa since February 2018. Established the Madlanga Commission by presidential proclamation on 14 July 2025 in response to General Mkhwanazi's public allegations.",
} as const;

const STORY_SEED = {
  title: 'The Mkhwanazi Allegations & Madlanga Commission',
  slug: STORY_SLUG,
  domain: StoryDomain.CRIMINAL_JUSTICE,
  status: StoryStatus.ACTIVE,
  summary:
    "In July 2025 KZN Provincial Police Commissioner Lt Gen Nhlanhla Mkhwanazi delivered an extraordinary televised press conference accusing the then-Minister of Police, senior SAPS leadership and a private businessman of protecting an organised-crime cartel operating inside the state. The allegations led to the suspension of the Minister, the establishment of the Madlanga Commission of Inquiry by Presidential Proclamation, and a parallel National Assembly Ad Hoc Committee — two investigations into the same set of allegations running at once.",
  plain_english_summary:
    'Imagine your school has a special teacher whose job is to catch cheaters. One day that teacher stood up and said: the principal is helping the cheaters and hiding the evidence. That is what happened in South Africa. A senior police officer named General Mkhwanazi stood up and said some very powerful politicians and police bosses were protecting a criminal gang. Two groups of very important people are now investigating to find out if this is true.',
} as const;

// ───────────────────────────────────────────────────────────────────────────────
// People
// ───────────────────────────────────────────────────────────────────────────────

interface PersonSeed {
  full_name: string;
  aliases: string[];
  current_role: string;
  organisation: string;
  status: PersonStatus;
  profile_summary: string;
  role_in_story: string;
  is_key_figure: boolean;
}

const PEOPLE_SEED: readonly PersonSeed[] = [
  {
    full_name: 'Nhlanhla Mkhwanazi',
    aliases: ['Mkhwanazi', 'Lt Gen Mkhwanazi', 'Nhlanhla Mkhwanazi'],
    current_role: 'KZN Provincial Police Commissioner',
    organisation: 'South African Police Service',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Lt Gen Nhlanhla Mkhwanazi is the Provincial Commissioner of the South African Police Service in KwaZulu-Natal. In July 2025 he held a televised press conference in Durban alleging that senior politicians and SAPS leaders were protecting a criminal enterprise — allegations that triggered the Madlanga Commission.',
    role_in_story: 'whistleblower',
    is_key_figure: true,
  },
  {
    full_name: 'Senzo Mchunu',
    aliases: ['Mchunu', 'Minister Mchunu'],
    current_role: 'Former Minister of Police (on special leave)',
    organisation: 'Cabinet of the Republic of South Africa',
    status: PersonStatus.SUSPENDED,
    profile_summary:
      'Senzo Mchunu served as Minister of Police until July 2025, when President Ramaphosa placed him on special leave pending inquiry following the Mkhwanazi allegations. He has denied wrongdoing.',
    role_in_story: 'accused',
    is_key_figure: true,
  },
  {
    full_name: 'Fannie Masemola',
    aliases: ['Masemola', 'Gen Masemola'],
    current_role: 'National Police Commissioner',
    organisation: 'South African Police Service',
    status: PersonStatus.ACTIVE,
    profile_summary:
      "General Fannie Masemola is the National Commissioner of SAPS. He testified before the Madlanga Commission, corroborating material portions of Mkhwanazi's account including the handling of the cancelled Medicare 24 Tshwane District contract.",
    role_in_story: 'corroborating witness',
    is_key_figure: true,
  },
  {
    full_name: 'Shadrack Sibiya',
    aliases: ['Sibiya', 'Gen Sibiya'],
    current_role: 'Deputy National Commissioner — Crime Detection',
    organisation: 'South African Police Service',
    status: PersonStatus.SUSPENDED,
    profile_summary:
      'Lt Gen Shadrack Sibiya served as Deputy National Commissioner for Crime Detection until his suspension in 2025 following allegations raised during the Mkhwanazi press conference.',
    role_in_story: 'accused',
    is_key_figure: true,
  },
  {
    full_name: 'Dumisani Khumalo',
    aliases: ['Khumalo', 'Lt Gen Khumalo'],
    current_role: 'Divisional Commissioner — Crime Intelligence',
    organisation: 'South African Police Service',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Lt Gen Dumisani Khumalo heads SAPS Crime Intelligence. At the Madlanga Commission he named a group he described as the "Big Five" — an alleged criminal enterprise linking business, police and politics.',
    role_in_story: 'witness',
    is_key_figure: true,
  },
  {
    full_name: 'Vusimuzi "Cat" Matlala',
    aliases: ['Vusimuzi Matlala', 'Cat Matlala', 'Cat', 'Matlala'],
    current_role: 'Businessman',
    organisation: 'Medicare 24 Tshwane District',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Vusimuzi "Cat" Matlala is a businessman whose company, Medicare 24 Tshwane District, was awarded and later stripped of a R360-million SAPS healthcare contract. He is alleged by witnesses before the Madlanga Commission to be a member of a criminal cartel operating at the intersection of business, police and politics.',
    role_in_story: 'alleged cartel member',
    is_key_figure: true,
  },
  {
    full_name: 'Mbuyiseli Madlanga',
    aliases: ['Madlanga', 'Justice Madlanga', 'Ret. Justice Madlanga'],
    current_role: 'Chairperson — Madlanga Commission of Inquiry',
    organisation: 'Madlanga Commission',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Retired Constitutional Court Justice Mbuyiseli Madlanga was appointed by President Ramaphosa to chair the judicial commission of inquiry into General Mkhwanazi\'s allegations.',
    role_in_story: 'commission chair',
    is_key_figure: true,
  },
  {
    full_name: 'Firoz Cachalia',
    aliases: ['Cachalia', 'Prof Cachalia', 'Minister Cachalia'],
    current_role: 'Acting Minister of Police',
    organisation: 'Cabinet of the Republic of South Africa',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Prof Firoz Cachalia, a constitutional-law academic, was appointed acting Minister of Police in July 2025 under section 91(3)(c) of the Constitution while Senzo Mchunu is on special leave.',
    role_in_story: 'ministerial oversight',
    is_key_figure: false,
  },
  {
    full_name: 'Brown Mogotsi',
    aliases: ['Mogotsi'],
    current_role: 'Businessman',
    organisation: 'Private sector',
    status: PersonStatus.ACTIVE,
    profile_summary:
      "Brown Mogotsi is a businessman whose communications with persons in Minister Mchunu's office were cited in press reporting and subsequently before the Madlanga Commission.",
    role_in_story: 'witness',
    is_key_figure: false,
  },
  {
    full_name: 'Glynnis Breytenbach',
    aliases: ['Breytenbach'],
    current_role: 'DA MP — Shadow Minister of Justice',
    organisation: 'Democratic Alliance',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Glynnis Breytenbach, a former prosecutor and DA Member of Parliament, sits on the Ad Hoc Committee exercising parliamentary oversight over the Mkhwanazi allegations.',
    role_in_story: 'parliamentary oversight',
    is_key_figure: false,
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// Laws & sections
// ───────────────────────────────────────────────────────────────────────────────

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

const LAWS_SEED: readonly LawSeed[] = [
  {
    short_name: 'PRECCA',
    name: 'Prevention and Combating of Corrupt Activities Act',
    act_number: '12 of 2004',
    category: LawCategory.CORRUPTION,
    plain_english:
      "South Africa's main anti-corruption law. It says it is illegal to give or take a bribe, to misuse your position for private gain, or to let corruption happen when you know about it.",
    full_text_url: 'https://www.gov.za/documents/prevention-and-combating-corrupt-activities-act',
    sections: [
      {
        section_number: 'Section 3',
        section_title: 'General offence of corruption',
        plain_english:
          'It is a crime to give, offer, receive or accept any kind of reward to make someone do their job dishonestly — whether you are in government or in business.',
      },
      {
        section_number: 'Section 34',
        section_title: 'Duty to report corrupt transactions',
        plain_english:
          'If you are in a position of authority and you know about serious corruption or fraud over R100,000, you must report it to the police. Staying silent is itself a crime.',
      },
    ],
  },
  {
    short_name: 'SAPS Act',
    name: 'South African Police Service Act',
    act_number: '68 of 1995',
    category: LawCategory.POLICING,
    plain_english:
      'The law that sets up the South African Police Service, says who is in charge, and draws the line between what the Minister can decide and what police commanders must decide.',
    full_text_url: 'https://www.gov.za/documents/south-african-police-service-act',
    sections: [
      {
        section_number: 'Section 7',
        section_title: 'Appointments and promotions within SAPS',
        plain_english:
          'Says how senior police officers are appointed and promoted. Appointments must follow the Act — politicians cannot hand-pick officers outside the rules.',
      },
      {
        section_number: 'Section 207',
        section_title: 'Ministerial limits on operational direction',
        plain_english:
          'The Minister of Police can decide overall policy — but cannot instruct the police on who to investigate or arrest in a specific case.',
      },
    ],
  },
  {
    short_name: 'POCA',
    name: 'Prevention of Organised Crime Act',
    act_number: '121 of 1998',
    category: LawCategory.ORGANISED_CRIME,
    plain_english:
      'The law that lets the state fight organised crime — gangs, cartels and syndicates — by creating new crimes like racketeering and by allowing the state to seize property earned from crime.',
    full_text_url: 'https://www.gov.za/documents/prevention-organised-crime-act',
    sections: [
      {
        section_number: 'Section 2',
        section_title: 'Offences relating to racketeering activities',
        plain_english:
          'It is a serious crime to be part of a group — a "pattern of racketeering activity" — that repeatedly commits crimes for profit. The leaders and the members are all liable.',
      },
    ],
  },
  {
    short_name: 'PDA',
    name: 'Protected Disclosures Act',
    act_number: '26 of 2000',
    category: LawCategory.WHISTLEBLOWER,
    plain_english:
      'Protects whistleblowers. If you report wrongdoing in the proper way, you cannot be fired, demoted or punished for it.',
    full_text_url: 'https://www.gov.za/documents/protected-disclosures-act',
    sections: [
      {
        section_number: 'Section 3',
        section_title: 'Protected disclosure — general protection',
        plain_english:
          'If you report wrongdoing in good faith to the right person (your employer, the Public Protector, the Auditor-General or the police) you are legally protected from being fired or harmed for speaking up.',
      },
    ],
  },
  {
    short_name: 'NPA Act',
    name: 'National Prosecuting Authority Act',
    act_number: '32 of 1998',
    category: LawCategory.PROSECUTION,
    plain_english:
      'The law that creates the National Prosecuting Authority, says how prosecutors are appointed, and guarantees they can decide who to charge independently of politicians.',
    full_text_url: 'https://www.gov.za/documents/national-prosecuting-authority-act',
    sections: [
      {
        section_number: 'Section 32',
        section_title: 'Independence and impartiality of prosecuting authority',
        plain_english:
          'Prosecutors must decide cases based on the law and the evidence — without fear, favour or prejudice. No politician or official can tell them to drop a case or press a charge.',
      },
    ],
  },
  // Included so the Madlanga Commission-establishment event can link to
  // its statutory basis. The user spec refers to this via "Commissions Act"
  // in event #8's legal link.
  {
    short_name: 'Commissions Act',
    name: 'Commissions Act',
    act_number: '8 of 1947',
    category: LawCategory.OTHER,
    plain_english:
      'A short but powerful law that lets the President set up a commission of inquiry with the power to call witnesses, demand documents and take evidence under oath.',
    full_text_url: 'https://www.gov.za/documents/commissions-act',
    sections: [
      {
        section_number: 'Section 1',
        section_title: 'Powers of commissions of inquiry',
        plain_english:
          'A commission of inquiry set up under this Act can summon witnesses, require documents, and take evidence under oath — just like a court.',
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// Constitution sections
// ───────────────────────────────────────────────────────────────────────────────

interface ConstitutionSectionSeed {
  chapter_number: number;
  section_number: number;
  section_title: string;
  plain_english: string;
}

const CONSTITUTION_SEED: readonly ConstitutionSectionSeed[] = [
  {
    chapter_number: 1,
    section_number: 1,
    section_title: 'Section 1(c) — Supremacy of the Constitution and Rule of Law',
    plain_english:
      'South Africa is built on the rule of law. No one — not the President, not a Minister, not a police general — is above the Constitution. Everyone must follow the rules.',
  },
  {
    // Inserted for event #10's link. Parliamentary oversight.
    chapter_number: 4,
    section_number: 55,
    section_title: 'Section 55 — Powers of the National Assembly',
    plain_english:
      'Parliament is allowed to investigate any part of government — including ministers and the police — call witnesses, demand documents and pass laws to fix problems it uncovers.',
  },
  {
    chapter_number: 5,
    section_number: 91,
    section_title: 'Section 91(3)(c) — Appointment of ministers outside Parliament',
    plain_english:
      'The President can appoint a maximum of two ministers from outside Parliament. This is the provision used to bring in Prof Cachalia as acting Minister of Police while Mchunu is on special leave.',
  },
  {
    chapter_number: 8,
    section_number: 179,
    section_title: 'Section 179 — National Prosecuting Authority',
    plain_english:
      'The NPA decides who is charged with a crime. The Constitution says it must work without fear, favour or prejudice — no politician may tell prosecutors what to do.',
  },
  {
    chapter_number: 10,
    section_number: 195,
    section_title: 'Section 195 — Basic values of public administration',
    plain_english:
      'Everyone working for the state must be honest, use resources wisely, treat the public fairly, and answer to the public for their decisions.',
  },
  {
    chapter_number: 11,
    section_number: 205,
    section_title: 'Section 205 — Police service objects',
    plain_english:
      'The police must prevent, combat and investigate crime, maintain public order, protect the public — and do all of this without fear, favour or prejudice.',
  },
  {
    chapter_number: 11,
    section_number: 207,
    section_title: 'Section 207 — Political responsibility for policing',
    plain_english:
      'The Minister of Police sets overall policy. But the National Commissioner runs the police day-to-day. The Minister cannot instruct the police on individual cases or operations.',
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// Timeline events (+ legal links)
// ───────────────────────────────────────────────────────────────────────────────

/** A legal link for an event — resolved via natural key before insert. */
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

interface TimelineEventSeed {
  event_date: string;
  event_type: EventType;
  title: string;
  description: string;
  plain_english: string;
  significance: EventSignificance;
  source_urls: string[];
  legal_links: EventLegalLink[];
}

const TIMELINE_SEED: readonly TimelineEventSeed[] = [
  {
    event_date: '2018-01-01',
    event_type: EventType.INCIDENT,
    title: 'Political Killings Task Team (PKTT) Established',
    description:
      'The Political Killings Task Team is formed by SAPS to investigate a spate of assassinations in KwaZulu-Natal linked to ward-councillor contests, taxi-industry disputes and intra-party factional fighting. The unit is given cross-jurisdictional authority and quickly secures several high-profile prosecutions.',
    plain_english:
      'The police created a special team to catch people who were killing politicians in KwaZulu-Natal.',
    significance: EventSignificance.HIGH,
    source_urls: ['https://www.saps.gov.za'],
    legal_links: [],
  },
  {
    event_date: '2024-06-01',
    event_type: EventType.INCIDENT,
    title: "Matlala's Company Wins R360m SAPS Healthcare Tender",
    description:
      'Medicare 24 Tshwane District, a company linked to Vusimuzi "Cat" Matlala, is awarded a R360-million contract to provide healthcare services to SAPS members. Concerns about the procurement process are raised internally but not escalated to the Hawks.',
    plain_english:
      'A company run by a man people called "Cat" won a huge R360-million contract to take care of sick police officers — but some people inside the police were already worried about how the contract was awarded.',
    significance: EventSignificance.HIGH,
    source_urls: ['https://www.dailymaverick.co.za'],
    legal_links: [
      {
        kind: 'law',
        law_short_name: 'PRECCA',
        section_number: 'Section 3',
        relevance:
          'The circumstances of the tender award are later examined for potential contraventions of PRECCA section 3 — the general offence of corruption.',
        alleged_violation: false,
      },
    ],
  },
  {
    event_date: '2025-01-15',
    event_type: EventType.INCIDENT,
    title: 'Minister Mchunu Disbands the PKTT',
    description:
      'Police Minister Senzo Mchunu issues a directive disbanding the Political Killings Task Team. No replacement structure is announced. Detectives attached to the unit are reassigned to general crime duties in KwaZulu-Natal and Gauteng, and active dockets are redistributed.',
    plain_english:
      'The special team catching political murderers was suddenly shut down by the minister.',
    significance: EventSignificance.CRITICAL,
    source_urls: ['https://www.news24.com'],
    legal_links: [
      {
        kind: 'constitution',
        section_number: 207,
        relevance:
          'Section 207 permits the Minister to set overall policy but not to issue operational directives. Disbanding an operational task team is later alleged at the Commission to have crossed this constitutional line.',
        alleged_violation: true,
      },
    ],
  },
  {
    event_date: '2025-01-20',
    event_type: EventType.INCIDENT,
    title: "WhatsApp Chats Link Mchunu's Office to Matlala's Fixer",
    description:
      "Media reports publish WhatsApp messages exchanged between persons in Minister Mchunu's office and a business associate of Vusimuzi Matlala. The messages reference SAPS procurement and the future of the Political Killings Task Team. The Minister's spokesperson denies operational knowledge.",
    plain_english:
      "Journalists found messages on WhatsApp between the minister's team and the businessman's team. They were talking about police contracts and shutting down the special team.",
    significance: EventSignificance.HIGH,
    source_urls: ['https://www.dailymaverick.co.za'],
    legal_links: [],
  },
  {
    event_date: '2025-05-01',
    event_type: EventType.INCIDENT,
    title: "SAPS Cancels Matlala's R360m Contract",
    description:
      'National Commissioner Fannie Masemola signs off on the cancellation of the R360-million Medicare 24 Tshwane District contract. SAPS cites procurement irregularities and reports the matter to the Directorate for Priority Crime Investigation (the Hawks).',
    plain_english:
      'The top police boss cancelled the big contract with Cat\'s company and asked a special police unit to investigate how it was awarded.',
    significance: EventSignificance.HIGH,
    source_urls: ['https://www.news24.com'],
    legal_links: [],
  },
  {
    event_date: '2025-07-06',
    event_type: EventType.PRESS_CONFERENCE,
    title: "Mkhwanazi's Bombshell Press Conference in Durban",
    description:
      "Standing in full uniform in front of heavily armed KZN tactical response officers, Lt Gen Nhlanhla Mkhwanazi holds a press conference in Durban. He alleges a 'criminal syndicate' operates at the highest levels of SAPS leadership and in the Ministry of Police, names Minister Mchunu and Deputy National Commissioner Sibiya, and accuses them of protecting the business interests of Vusimuzi 'Cat' Matlala.",
    plain_english:
      'General Mkhwanazi stood in front of cameras in his police uniform with armed officers behind him and told the whole country: our police minister is protecting criminals.',
    significance: EventSignificance.CRITICAL,
    source_urls: [
      'https://www.dailymaverick.co.za',
      'https://www.news24.com',
      'https://www.sabcnews.com',
    ],
    legal_links: [
      {
        kind: 'constitution',
        section_number: 205,
        relevance:
          'The allegations speak directly to section 205 — that the police must operate without fear, favour or prejudice — and frame the disbandment of the PKTT as a violation of that command.',
        alleged_violation: true,
      },
    ],
  },
  {
    event_date: '2025-07-13',
    event_type: EventType.SUSPENSION,
    title: 'President Ramaphosa Places Mchunu on Special Leave',
    description:
      'In a televised address to the nation, President Cyril Ramaphosa announces that Minister Senzo Mchunu is placed on special leave pending an inquiry. Prof Firoz Cachalia is appointed acting Minister of Police under section 91(3)(c) of the Constitution.',
    plain_english:
      'The president told the country on TV that the minister was being sent home on leave while things were investigated. A law professor was asked to run the police for now.',
    significance: EventSignificance.HIGH,
    source_urls: ['https://www.thepresidency.gov.za'],
    legal_links: [
      {
        kind: 'constitution',
        section_number: 91,
        relevance:
          "Section 91(3)(c) is the constitutional provision used to appoint Prof Cachalia — one of the President's two permitted ministers from outside the National Assembly.",
        alleged_violation: false,
      },
    ],
  },
  {
    event_date: '2025-07-14',
    event_type: EventType.COMMISSION_ESTABLISHED,
    title: 'Madlanga Commission Announced',
    description:
      "By Presidential Proclamation under the Commissions Act 8 of 1947, a judicial commission of inquiry is established to investigate General Mkhwanazi's allegations. Retired Constitutional Court Justice Mbuyiseli Madlanga is appointed chairperson. Terms of reference cover the disbandment of the PKTT, the Matlala contract and the alleged cartel.",
    plain_english:
      'The president asked a retired judge to lead an official investigation — with the power to call witnesses and ask for secret documents — into everything the general said.',
    significance: EventSignificance.CRITICAL,
    source_urls: ['https://www.thepresidency.gov.za', 'https://www.gov.za'],
    legal_links: [
      {
        kind: 'law',
        law_short_name: 'Commissions Act',
        section_number: 'Section 1',
        relevance:
          'The Commissions Act 8 of 1947 is the statutory authority under which the President establishes the inquiry and grants it powers to summon witnesses and demand documents.',
        alleged_violation: false,
      },
    ],
  },
  {
    event_date: '2025-07-21',
    event_type: EventType.ARREST,
    title: 'Arrests Made in DJ Sumbody Murder Case',
    description:
      'Six suspects are arrested and charged with the 2022 murder of musician Oupa "DJ Sumbody" Sefoka. The docket is among those previously handled by the Political Killings Task Team before its disbandment. Two of the accused are said to be associates of Vusimuzi Matlala.',
    plain_english:
      'Police arrested six people for the murder of a famous DJ. That case had been handled by the special team that was shut down in January.',
    significance: EventSignificance.HIGH,
    source_urls: ['https://www.news24.com', 'https://www.timeslive.co.za'],
    legal_links: [],
  },
  {
    event_date: '2025-07-23',
    event_type: EventType.COMMISSION_ESTABLISHED,
    title: 'Parliamentary Ad Hoc Committee Established',
    description:
      "The National Assembly adopts a motion establishing an Ad Hoc Committee in terms of National Assembly Rule 253 to inquire into General Mkhwanazi's allegations. The committee is chaired by Mr Molapi Lekganyane (ANC) and is tasked with running in parallel to, not in place of, the Madlanga Commission.",
    plain_english:
      'Parliament created its own group of MPs to investigate — on top of the judge\'s commission. So two different groups are now looking into the same thing at the same time.',
    significance: EventSignificance.HIGH,
    source_urls: ['https://www.parliament.gov.za'],
    legal_links: [
      {
        kind: 'constitution',
        section_number: 55,
        relevance:
          "Section 55 vests the National Assembly with the power to conduct inquiries and call for evidence — the constitutional basis for the Ad Hoc Committee's parallel investigation.",
        alleged_violation: false,
      },
    ],
  },
  {
    event_date: '2025-08-01',
    event_type: EventType.SUSPENSION,
    title: 'Gauteng Director of Public Prosecutions Suspended',
    description:
      "The Gauteng Director of Public Prosecutions is suspended by the National Director of Public Prosecutions pending an inquiry into alleged interference in prosecutions linked to Matlala's business interests and the PKTT dockets.",
    plain_english:
      'The top prosecutor in Gauteng was also sent home while people investigate whether she was blocking important cases.',
    significance: EventSignificance.HIGH,
    source_urls: ['https://www.npa.gov.za'],
    legal_links: [
      {
        kind: 'constitution',
        section_number: 179,
        relevance:
          "Section 179 guarantees NPA independence. The suspension is framed as a step to protect — rather than undermine — that independence while the facts are established.",
        alleged_violation: false,
      },
    ],
  },
  {
    event_date: '2025-09-17',
    event_type: EventType.HEARING,
    title: 'Madlanga Commission: Day 1 — Mkhwanazi Testifies',
    description:
      'The Madlanga Commission convenes for the first day of public hearings in Pretoria. General Mkhwanazi is the first witness, giving evidence-in-chief on the operations of the Political Killings Task Team, the circumstances of its disbandment, and the individuals he alleges are members of the criminal syndicate.',
    plain_english:
      'The judge\'s commission started. General Mkhwanazi was the first person to tell his story on the record, in public.',
    significance: EventSignificance.CRITICAL,
    source_urls: [
      'https://criminaljusticecommission.org.za',
      'https://www.dailymaverick.co.za',
    ],
    legal_links: [
      {
        kind: 'law',
        law_short_name: 'PDA',
        section_number: 'Section 3',
        relevance:
          "As a public servant disclosing wrongdoing to a body empowered to investigate it, General Mkhwanazi's evidence is treated as a protected disclosure under the Protected Disclosures Act.",
        alleged_violation: false,
      },
    ],
  },
  {
    event_date: '2025-09-22',
    event_type: EventType.HEARING,
    title: 'Masemola Corroborates Mkhwanazi at Commission',
    description:
      "National Commissioner Fannie Masemola testifies before the Madlanga Commission and corroborates significant portions of General Mkhwanazi's account, including the handling of the Medicare 24 Tshwane District contract and his own awareness of the PKTT-disbandment directive.",
    plain_english:
      'The national police boss came to the commission and said: yes, much of what Mkhwanazi said is true.',
    significance: EventSignificance.HIGH,
    source_urls: ['https://criminaljusticecommission.org.za'],
    legal_links: [],
  },
  {
    event_date: '2025-09-29',
    event_type: EventType.HEARING,
    title: "Khumalo Names the 'Big Five' Cartel",
    description:
      "Crime Intelligence head Lt Gen Dumisani Khumalo testifies before the Madlanga Commission and names what he describes as the 'Big Five' — an alleged criminal enterprise linking business, police and politics. He identifies Vusimuzi Matlala as one of the five.",
    plain_english:
      'The head of police intelligence told the commission there is a gang of five — made up of business people, police officers and politicians — working together like an organised crime family.',
    significance: EventSignificance.CRITICAL,
    source_urls: ['https://criminaljusticecommission.org.za'],
    legal_links: [
      {
        kind: 'law',
        law_short_name: 'POCA',
        section_number: 'Section 2',
        relevance:
          'If the allegations are proved, the conduct alleged would fit the statutory definition of a "pattern of racketeering activity" under POCA section 2.',
        alleged_violation: true,
      },
    ],
  },
  {
    event_date: '2026-04-24',
    event_type: EventType.HEARING,
    title: 'Commission Reaches Day 93 — Still Active',
    description:
      'The Madlanga Commission reaches its 93rd day of hearings. Further witnesses — including forensic investigators and additional SAPS officers — are scheduled to testify. A final report is anticipated later in the year.',
    plain_english:
      'The commission is still working — more than three months in, with more witnesses still to come.',
    significance: EventSignificance.MEDIUM,
    source_urls: ['https://criminaljusticecommission.org.za'],
    legal_links: [],
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// Investigations
// ───────────────────────────────────────────────────────────────────────────────

interface InvestigationSeed {
  name: string;
  investigation_type: InvestigationType;
  established_by: string;
  legal_basis: string;
  chair_name: string;
  status: InvestigationStatus;
  official_url: string;
  started_at: string;
}

const INVESTIGATIONS_SEED: readonly InvestigationSeed[] = [
  {
    name: 'Madlanga Commission of Inquiry',
    investigation_type: InvestigationType.JUDICIAL_COMMISSION,
    established_by: 'President Cyril Ramaphosa',
    legal_basis: 'Commissions Act 8 of 1947 / Presidential Proclamation',
    chair_name: 'Ret. Justice Mbuyiseli Madlanga',
    status: InvestigationStatus.ACTIVE,
    official_url: 'https://criminaljusticecommission.org.za',
    started_at: '2025-09-17',
  },
  {
    name: "Ad Hoc Committee on Gen Mkhwanazi's Allegations",
    investigation_type: InvestigationType.PARLIAMENTARY_COMMITTEE,
    established_by: 'National Assembly',
    legal_basis: 'National Assembly Rule 253',
    chair_name: 'Mr Molapi Lekganyane MP (ANC)',
    status: InvestigationStatus.ACTIVE,
    official_url:
      'https://www.parliament.gov.za/ad-hoc-committee-gen-mkhwanazis-allegations',
    started_at: '2025-07-23',
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// Upsert helpers
// ───────────────────────────────────────────────────────────────────────────────

async function upsertStory(
  m: EntityManager,
  commissionId: string,
  adhocCommitteeId: string | null,
): Promise<Story> {
  const repo = m.getRepository(Story);
  const payload = {
    ...STORY_SEED,
    commission_id: commissionId,
    adhoc_committee_id: adhocCommitteeId,
  };
  let story = await repo.findOne({ where: { slug: STORY_SEED.slug } });
  const adhocTag = adhocCommitteeId ? ` + committee ${ADHOC_COMMITTEE_SLUG}` : '';
  if (!story) {
    story = repo.create(payload);
    story = await repo.save(story);
    console.log(
      `  + Story created: ${story.slug} (linked to commission ${COMMISSION_SLUG}${adhocTag})`,
    );
  } else {
    Object.assign(story, payload);
    story = await repo.save(story);
    console.log(
      `  · Story updated: ${story.slug} (linked to commission ${COMMISSION_SLUG}${adhocTag})`,
    );
  }
  return story;
}

/**
 * Look up the Mkhwanazi ad hoc committee if it has already been seeded.
 * Returns null (with a log) when adhoc-committees.seed.ts has not yet run
 * — the adhoc seed will patch the link itself on its own run.
 */
async function resolveAdhocCommitteeId(m: EntityManager): Promise<string | null> {
  const repo = m.getRepository(AdhocCommittee);
  const committee = await repo.findOne({ where: { slug: ADHOC_COMMITTEE_SLUG } });
  if (!committee) {
    console.log(
      `  · Ad hoc committee "${ADHOC_COMMITTEE_SLUG}" not yet seeded — ` +
        `story ↔ committee link will be set when adhoc-committees.seed.ts runs.`,
    );
    return null;
  }
  return committee.id;
}

/**
 * If the Mkhwanazi ad hoc committee exists and is not yet linked to
 * Madlanga, patch its related_commission_id. This makes the seed chain
 * order-independent: the adhoc seed skips the link when Madlanga does not
 * yet exist, and this patch closes the loop when Madlanga is seeded here.
 */
async function patchAdhocCommitteeCommissionLink(
  m: EntityManager,
  commissionId: string,
): Promise<void> {
  const repo = m.getRepository(AdhocCommittee);
  const committee = await repo.findOne({ where: { slug: ADHOC_COMMITTEE_SLUG } });
  if (!committee) return;
  if (committee.related_commission_id === commissionId) return;

  committee.related_commission_id = commissionId;
  await repo.save(committee);
  console.log(
    `  · Patched committee "${ADHOC_COMMITTEE_SLUG}".related_commission_id → ${COMMISSION_SLUG}`,
  );
}

async function upsertMadlangaCommission(m: EntityManager): Promise<Commission> {
  const repo = m.getRepository(Commission);
  let commission = await repo.findOne({
    where: { slug: COMMISSION_SEED.slug },
  });
  if (!commission) {
    commission = repo.create({ ...COMMISSION_SEED });
    commission = await repo.save(commission);
    console.log(`  + Commission created: ${commission.slug}`);
  } else {
    Object.assign(commission, COMMISSION_SEED);
    commission = await repo.save(commission);
    console.log(`  · Commission updated: ${commission.slug}`);
  }
  return commission;
}

async function upsertRamaphosa(m: EntityManager): Promise<Person> {
  const repo = m.getRepository(Person);
  let person = await repo.findOne({
    where: { full_name: RAMAPHOSA_SEED.full_name },
  });
  const payload = {
    full_name: RAMAPHOSA_SEED.full_name,
    aliases: [...RAMAPHOSA_SEED.aliases],
    current_role: RAMAPHOSA_SEED.current_role,
    organisation: RAMAPHOSA_SEED.organisation,
    status: RAMAPHOSA_SEED.status,
    profile_summary: RAMAPHOSA_SEED.profile_summary,
  };
  if (!person) {
    person = repo.create(payload);
    person = await repo.save(person);
  } else {
    Object.assign(person, payload);
    person = await repo.save(person);
  }
  return person;
}

/**
 * Wire the Madlanga Commission to its key people:
 *   - Madlanga          → chair
 *   - Ramaphosa         → established_by
 *   - Mkhwanazi         → witness (evidence-in-chief on day 1)
 *   - Mchunu            → implicated (on special leave pending the inquiry)
 *   - Sibiya            → implicated
 *   - Matlala           → implicated
 *   - Masemola, Khumalo → witness
 */
async function linkCommissionPeople(
  m: EntityManager,
  commission: Commission,
  people: Map<string, Person>,
): Promise<void> {
  const repo = m.getRepository(CommissionPerson);

  const links: ReadonlyArray<{
    full_name: string;
    role: CommissionPersonRole;
    summary: string | null;
  }> = [
    {
      full_name: 'Mbuyiseli Madlanga',
      role: CommissionPersonRole.CHAIR,
      summary: 'Chairperson of the commission, appointed by presidential proclamation.',
    },
    {
      full_name: 'Cyril Ramaphosa',
      role: CommissionPersonRole.ESTABLISHED_BY,
      summary:
        "Established the commission by presidential proclamation under the Commissions Act on 14 July 2025 in response to General Mkhwanazi's public allegations.",
    },
    {
      full_name: 'Nhlanhla Mkhwanazi',
      role: CommissionPersonRole.WITNESS,
      summary: 'Gave evidence-in-chief on Day 1 (17 Sept 2025) setting out the allegations.',
    },
    {
      full_name: 'Fannie Masemola',
      role: CommissionPersonRole.WITNESS,
      summary: "Corroborated material portions of Mkhwanazi's account.",
    },
    {
      full_name: 'Dumisani Khumalo',
      role: CommissionPersonRole.WITNESS,
      summary: 'Named the alleged "Big Five" syndicate at the commission.',
    },
    {
      full_name: 'Senzo Mchunu',
      role: CommissionPersonRole.IMPLICATED,
      summary: 'Named by General Mkhwanazi as part of the alleged protection network; placed on special leave.',
    },
    {
      full_name: 'Shadrack Sibiya',
      role: CommissionPersonRole.IMPLICATED,
      summary: 'Named by General Mkhwanazi; subsequently suspended.',
    },
    {
      full_name: 'Vusimuzi "Cat" Matlala',
      role: CommissionPersonRole.IMPLICATED,
      summary: 'Alleged business end of the "Big Five" syndicate named in evidence before the commission.',
    },
  ];

  let count = 0;
  for (const link of links) {
    const person = people.get(link.full_name);
    if (!person) {
      throw new Error(
        `linkCommissionPeople: person "${link.full_name}" missing from people map`,
      );
    }

    const payload = {
      commission_id: commission.id,
      person_id: person.id,
      role: link.role,
      summary: link.summary,
    };

    let existing = await repo.findOne({
      where: {
        commission_id: commission.id,
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

  console.log(`  · Commission → person links: ${count}`);
}

async function upsertConstitutionSections(
  m: EntityManager,
): Promise<Map<number, ConstitutionSection>> {
  const repo = m.getRepository(ConstitutionSection);
  const byNumber = new Map<number, ConstitutionSection>();

  for (const seed of CONSTITUTION_SEED) {
    let record = await repo.findOne({
      where: { section_number: seed.section_number },
    });
    if (!record) {
      record = repo.create(seed);
      record = await repo.save(record);
    } else {
      Object.assign(record, seed);
      record = await repo.save(record);
    }
    byNumber.set(seed.section_number, record);
  }
  console.log(`  · Constitution sections: ${byNumber.size}`);
  return byNumber;
}

async function upsertLaws(
  m: EntityManager,
): Promise<Map<string, LawSection>> {
  const lawRepo = m.getRepository(Law);
  const sectionRepo = m.getRepository(LawSection);

  // Keyed by `${law.short_name}::${section.section_number}` — the natural key
  // we'll use from timeline events when resolving legal links.
  const sections = new Map<string, LawSection>();

  for (const seed of LAWS_SEED) {
    let law = await lawRepo.findOne({ where: { short_name: seed.short_name } });
    const lawData = {
      name: seed.name,
      short_name: seed.short_name,
      act_number: seed.act_number,
      category: seed.category,
      plain_english: seed.plain_english,
      full_text_url: seed.full_text_url,
    };
    if (!law) {
      law = lawRepo.create(lawData);
      law = await lawRepo.save(law);
    } else {
      Object.assign(law, lawData);
      law = await lawRepo.save(law);
    }

    for (const sec of seed.sections) {
      let section = await sectionRepo.findOne({
        where: { law_id: law.id, section_number: sec.section_number },
      });
      if (!section) {
        section = sectionRepo.create({ law_id: law.id, ...sec });
        section = await sectionRepo.save(section);
      } else {
        Object.assign(section, sec);
        section = await sectionRepo.save(section);
      }
      sections.set(`${seed.short_name}::${sec.section_number}`, section);
    }
  }
  console.log(
    `  · Laws: ${LAWS_SEED.length}, law sections: ${sections.size}`,
  );
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
  console.log(`  · People: ${byName.size}`);
  return byName;
}

async function upsertStoryPeople(
  m: EntityManager,
  story: Story,
  people: Map<string, Person>,
): Promise<void> {
  const repo = m.getRepository(StoryPerson);
  let count = 0;

  for (const seed of PEOPLE_SEED) {
    const person = people.get(seed.full_name);
    if (!person) {
      throw new Error(
        `upsertStoryPeople: person "${seed.full_name}" missing from people map`,
      );
    }

    const payload = {
      story_id: story.id,
      person_id: person.id,
      role_in_story: seed.role_in_story,
      is_key_figure: seed.is_key_figure,
    };

    let link = await repo.findOne({
      where: { story_id: story.id, person_id: person.id },
    });
    if (!link) {
      link = repo.create(payload);
      await repo.save(link);
    } else {
      Object.assign(link, payload);
      await repo.save(link);
    }
    count++;
  }
  console.log(`  · Story-people links: ${count}`);
}

async function upsertInvestigations(
  m: EntityManager,
  story: Story,
): Promise<void> {
  const repo = m.getRepository(Investigation);

  for (const seed of INVESTIGATIONS_SEED) {
    const payload = { story_id: story.id, concluded_at: null, ...seed };
    let inv = await repo.findOne({
      where: { story_id: story.id, name: seed.name },
    });
    if (!inv) {
      inv = repo.create(payload);
      await repo.save(inv);
    } else {
      Object.assign(inv, payload);
      await repo.save(inv);
    }
  }
  console.log(`  · Investigations: ${INVESTIGATIONS_SEED.length}`);
}

async function upsertTimelineEvents(
  m: EntityManager,
  story: Story,
  lawSections: Map<string, LawSection>,
  constitutionSections: Map<number, ConstitutionSection>,
): Promise<void> {
  const eventRepo = m.getRepository(TimelineEvent);
  const refRepo = m.getRepository(EventLegalReference);

  let eventCount = 0;
  let refCount = 0;

  for (const seed of TIMELINE_SEED) {
    const payload = {
      story_id: story.id,
      event_date: seed.event_date,
      event_type: seed.event_type,
      title: seed.title,
      description: seed.description,
      plain_english: seed.plain_english,
      significance: seed.significance,
      source_urls: seed.source_urls,
    };

    let event = await eventRepo.findOne({
      where: {
        story_id: story.id,
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
    eventCount++;

    for (const link of seed.legal_links) {
      let lawSectionId: string | null = null;
      let constitutionSectionId: string | null = null;

      if (link.kind === 'law') {
        const key = `${link.law_short_name}::${link.section_number}`;
        const section = lawSections.get(key);
        if (!section) {
          throw new Error(
            `upsertTimelineEvents: law section "${key}" missing when linking event "${seed.title}"`,
          );
        }
        lawSectionId = section.id;
      } else {
        const section = constitutionSections.get(link.section_number);
        if (!section) {
          throw new Error(
            `upsertTimelineEvents: constitution section ${link.section_number} missing when linking event "${seed.title}"`,
          );
        }
        constitutionSectionId = section.id;
      }

      // TypeORM translates `null` in a `where` to `= NULL` (which never
      // matches), so we swap null → IsNull() for the lookup.
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
      refCount++;
    }
  }

  console.log(
    `  · Timeline events: ${eventCount}, legal references: ${refCount}`,
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Entry point
// ───────────────────────────────────────────────────────────────────────────────

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized
    ? AppDataSource
    : await AppDataSource.initialize();

  console.log('\n── Seeding: Mkhwanazi / Madlanga Commission ──');

  try {
    await dataSource.transaction(async (m) => {
      const commission = await upsertMadlangaCommission(m);
      await patchAdhocCommitteeCommissionLink(m, commission.id);
      const adhocCommitteeId = await resolveAdhocCommitteeId(m);
      const story = await upsertStory(m, commission.id, adhocCommitteeId);
      const constitutionSections = await upsertConstitutionSections(m);
      const lawSections = await upsertLaws(m);
      const people = await upsertPeople(m);
      const ramaphosa = await upsertRamaphosa(m);
      people.set(ramaphosa.full_name, ramaphosa);
      await upsertStoryPeople(m, story, people);
      await upsertInvestigations(m, story);
      await upsertTimelineEvents(m, story, lawSections, constitutionSections);
      await linkCommissionPeople(m, commission, people);

      // Cape Town seed runs before this in seed:all; pair needs Mkhwanazi story row.
      await upsertSimilarPair(
        m,
        'malusi-booi-housing-tender-fraud-2023',
        'mkhwanazi-madlanga-commission',
        SimilarityReason.SAME_PATTERN,
        'Both allege organised criminal networks embedded in government procurement.',
      );
    });

    console.log('──────────────────────────────────────────────');
    console.log('✓ Seed complete.\n');
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
