/* eslint-disable no-console */

/**
 * Cape Town / Western Cape + national accountability stories seed.
 * Idempotent upserts (slug / natural keys). Depends on laws/constitution rows
 * from commissions / SIU / mkhwanazi seeds when run via `seed:all`; also
 * ensures minimal constitution sections and law sections needed for legal links.
 *
 * Run:
 *   npm run seed:cape-town   (after `nest build`)
 *   or via `npm run seed:all` (ts-node index)
 */

import 'reflect-metadata';

import { IsNull, type EntityManager } from 'typeorm';

import { ConstitutionSection } from '../../entities/constitution_section.entity';
import { EventLegalReference } from '../../entities/event_legal_reference.entity';
import { Law, LawCategory } from '../../entities/law.entity';
import { LawSection } from '../../entities/law_section.entity';
import { Municipality, MunicipalityType } from '../../entities/municipality.entity';
import { Person, PersonStatus } from '../../entities/person.entity';
import {
  AmountQualifier,
  ExpenditureSector,
  ExpenditureType,
  PublicExpenditureRecord,
} from '../../entities/public-expenditure-record.entity';
import { Province } from '../../entities/province.entity';
import { SimilarityReason, SimilarStory } from '../../entities/similar-story.entity';
import {
  Story,
  StoryCategory,
  StoryDomain,
  StoryStatus,
} from '../../entities/story.entity';
import { StoryPerson } from '../../entities/story_person.entity';
import {
  EventSignificance,
  EventType,
  TimelineEvent,
} from '../../entities/timeline_event.entity';
import { AppDataSource } from '../data-source';

// ─────────────────────────────────────────────────────────────────────────────
// Geography
// ─────────────────────────────────────────────────────────────────────────────

const PROVINCE_WESTERN_CAPE = {
  name: 'Western Cape',
  slug: 'western-cape',
  abbreviation: 'WC',
  capital: 'Cape Town',
} as const;

const PROVINCE_MPUMALANGA = {
  name: 'Mpumalanga',
  slug: 'mpumalanga',
  abbreviation: 'MP',
  capital: 'Nelspruit',
} as const;

const PROVINCE_GAUTENG = {
  name: 'Gauteng',
  slug: 'gauteng',
  abbreviation: 'GP',
  capital: 'Johannesburg',
} as const;

const MUNICIPALITY_CCT = {
  name: 'City of Cape Town',
  short_name: 'Cape Town',
  slug: 'city-of-cape-town',
  municipality_type: MunicipalityType.METROPOLITAN,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Extra constitution sections (SIU seed already inserts s217; mkhwanazi adds others)
// ─────────────────────────────────────────────────────────────────────────────

const EXTRA_CONSTITUTION_SECTIONS = [
  {
    chapter_number: 2,
    section_number: 14,
    section_title: 'Section 14 — Privacy',
    plain_english:
      'Everyone has the right to privacy — including not having your home or office searched unfairly. Police searches usually need a proper warrant that tells the truth.',
  },
  {
    chapter_number: 2,
    section_number: 22,
    section_title: 'Section 22 — Freedom of trade, occupation and profession',
    plain_english:
      'Every citizen has the right to choose their trade, occupation or profession freely. Using violence to control people’s jobs or construction sites attacks that freedom.',
  },
  {
    chapter_number: 2,
    section_number: 35,
    section_title: 'Section 35 — Rights of arrested, detained and accused persons',
    plain_english:
      'If you are arrested you still have rights — including a fair trial and humane treatment. Evidence gathered by breaking these rules may be challenged in court.',
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Laws / sections (aligned with SIU seed keys so this file is safe standalone)
// ─────────────────────────────────────────────────────────────────────────────

interface LawSeed {
  short_name: string;
  name: string;
  act_number: string;
  category: LawCategory;
  plain_english: string;
  full_text_url: string | null;
  sections: ReadonlyArray<{
    section_number: string;
    section_title: string;
    plain_english: string;
  }>;
}

const ENSURE_LAWS: readonly LawSeed[] = [
  {
    short_name: 'PRECCA',
    name: 'Prevention and Combating of Corrupt Activities Act',
    act_number: '12 of 2004',
    category: LawCategory.CORRUPTION,
    plain_english:
      "South Africa's main anti-corruption statute — gratification, abuse of office and reporting duties.",
    full_text_url:
      'https://www.gov.za/documents/prevention-and-combating-corrupt-activities-act',
    sections: [
      {
        section_number: 'Section 3',
        section_title: 'General offence of corruption',
        plain_english:
          'Core corruption offence: giving or receiving gratification to act dishonestly in public or private-sector functions.',
      },
      {
        section_number: 'Section 34',
        section_title: 'Duty to report corrupt transactions',
        plain_english:
          'Certain managers and officials must report serious corruption they become aware of — silence can itself be criminal.',
      },
    ],
  },
  {
    short_name: 'POCA',
    name: 'Prevention of Organised Crime Act',
    act_number: '121 of 1998',
    category: LawCategory.ORGANISED_CRIME,
    plain_english:
      'Organised crime and racketeering framework, including pattern-of-racketeering and money-laundering style offences.',
    full_text_url: 'https://www.gov.za/documents/prevention-organised-crime-act',
    sections: [
      {
        section_number: 'Section 2',
        section_title: 'Offences relating to racketeering activities',
        plain_english:
          'Racketeering — repeated predicate crimes by an enterprise or pattern — attracts heavy penalties.',
      },
      {
        section_number: 'Section 4',
        section_title: 'Assisting another to benefit from proceeds of unlawful activities',
        plain_english:
          'Money-laundering style conduct: helping someone enjoy proceeds of crime, including layering and concealment.',
      },
    ],
  },
  {
    short_name: 'PFMA',
    name: 'Public Finance Management Act',
    act_number: '1 of 1999',
    category: LawCategory.OTHER,
    plain_english:
      'How national and provincial departments must safeguard public money — fruitless, wasteful and irregular expenditure.',
    full_text_url: 'https://www.gov.za/documents/public-finance-management-act',
    sections: [
      {
        section_number: 'Section 86',
        section_title: 'Unauthorised, irregular or fruitless and wasteful expenditure',
        plain_english:
          'Accounting officers must prevent waste and losses; personal liability can follow where duties are breached.',
      },
    ],
  },
  {
    short_name: 'Social Assistance Act',
    name: 'Social Assistance Act',
    act_number: '13 of 2004',
    category: LawCategory.OTHER,
    plain_english:
      'Framework for social grants and SASSA’s mandate to pay the right people lawfully.',
    full_text_url: 'https://www.gov.za/documents/social-assistance-act',
    sections: [
      {
        section_number: 'Section 4',
        section_title: "Minister’s powers and performance of the Agency",
        plain_english:
          'Duties on the Minister and SASSA to administer grants faithfully — a lens for grant fraud prosecutions.',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Legal link typing (timeline)
// ─────────────────────────────────────────────────────────────────────────────

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

interface TimelineSeed {
  event_date: string;
  event_type: EventType;
  title: string;
  description: string;
  plain_english: string;
  significance: EventSignificance;
  source_urls: string[];
  legal_links: EventLegalLink[];
}

interface PersonLinkSeed {
  full_name: string;
  role_in_story: string;
  is_key_figure: boolean;
}

interface ExpenditureSeed {
  amount_rands: string;
  amount_qualifier: AmountQualifier;
  expenditure_type: ExpenditureType;
  sector: ExpenditureSector;
  description: string;
  plain_english?: string | null;
  source_document?: string | null;
  source_url?: string | null;
  is_verified: boolean;
  reference_date: string | null;
  province_slug?: string | null;
  municipality_slug?: string | null;
  /** When false, row is excluded from the national money counter (default true). */
  is_primary_record?: boolean;
}

interface StoryBundle {
  title: string;
  slug: string;
  domain: StoryDomain;
  story_category: StoryCategory | null;
  status: StoryStatus;
  province_slug: string | null;
  municipality_slug: string | null;
  plain_english_summary: string;
  /** Child-level explanation — stored in `stories.summary` (no separate DB column). */
  plain_english_child: string | null;
  people: ReadonlyArray<{
    full_name: string;
    aliases: string[];
    current_role: string | null;
    organisation: string | null;
    status: PersonStatus;
    profile_summary: string | null;
    link: PersonLinkSeed;
  }>;
  timeline: TimelineSeed[];
  expenditures: ExpenditureSeed[];
  total_amount_rands: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Story data (dates and figures checked against contemporary reporting;
// where press counts diverged — e.g. school arrests — narrative notes ranges.)
// ─────────────────────────────────────────────────────────────────────────────

const STORY_R1_6: StoryBundle = {
  title: 'Cape Town R1.6 Billion Construction Tender Fraud',
  slug: 'cape-town-r1-6bn-tender-fraud-2025',
  domain: StoryDomain.POLITICS,
  story_category: StoryCategory.TENDER_FRAUD,
  status: StoryStatus.ACTIVE,
  province_slug: PROVINCE_WESTERN_CAPE.slug,
  municipality_slug: MUNICIPALITY_CCT.slug,
  plain_english_summary:
    'The government pays companies to build roads and manage waste in Cape Town. Some officials who decide which companies get these contracts are accused of colluding with certain businesses to give them the contracts unfairly. The police raided 26 buildings looking for proof. Three city officials are under investigation. The total value of the contracts under investigation is R1.6 billion — but this does not mean all of that money was stolen.',
  plain_english_child:
    'Imagine the school was supposed to hire someone to fix the roof. But some teachers secretly told their friends about it first so their friends could win the job unfairly. That is what is alleged to have happened here — but with billions of rands meant for roads and rubbish collection.',
  people: [
    {
      full_name: 'Geordin Hill-Lewis',
      aliases: ['Mayor Hill-Lewis'],
      current_role: 'Executive Mayor — City of Cape Town',
      organisation: 'City of Cape Town',
      status: PersonStatus.ACTIVE,
      profile_summary:
        'DA mayor; publicly briefed media after September–October 2025 raids and emphasised contract value ≠ proven theft.',
      link: {
        full_name: 'Geordin Hill-Lewis',
        role_in_story: 'executive oversight (mayor)',
        is_key_figure: true,
      },
    },
    {
      full_name: 'Lungelo Mbandazayo',
      aliases: ['City Manager Mbandazayo'],
      current_role: 'City Manager — City of Cape Town',
      organisation: 'City of Cape Town',
      status: PersonStatus.ACTIVE,
      profile_summary:
        'Reported whistle-blower driven information through to SAPS after internal city processes, triggering the late-2025 search-and-seizure wave (per mayoral briefings).',
      link: {
        full_name: 'Lungelo Mbandazayo',
        role_in_story: 'whistleblower pathway (reported to police)',
        is_key_figure: true,
      },
    },
    {
      full_name: 'JP Smith',
      aliases: ['Jean-Pierre Smith'],
      current_role: 'Mayoral Committee Member — Safety & Security',
      organisation: 'City of Cape Town',
      status: PersonStatus.ACTIVE,
      profile_summary:
        'His City office was raided in January 2025 alongside Xanthea Limberg’s as part of construction-sector fraud probes; the Western Cape High Court later reviewed warrant lawfulness. Separate from the October 2025 26-site operation.',
      link: {
        full_name: 'JP Smith',
        role_in_story:
          'earlier raid subject — court found search unlawful Sept 2025; denies wrongdoing',
        is_key_figure: true,
      },
    },
    {
      full_name: 'André Traut',
      aliases: ['Colonel André Traut', 'Andre Traut'],
      current_role: 'Provincial Spokesperson — SAPS Western Cape',
      organisation: 'South African Police Service',
      status: PersonStatus.ACTIVE,
      profile_summary:
        'SAPS Western Cape media liaison quoted on major commercial-crime operations including Cape Town construction probes.',
      link: {
        full_name: 'André Traut',
        role_in_story: 'police media witness (operational statements)',
        is_key_figure: false,
      },
    },
    {
      full_name: 'Three unnamed City of Cape Town officials (under investigation)',
      aliases: [],
      current_role: 'City administration — junior through senior roles',
      organisation: 'City of Cape Town',
      status: PersonStatus.UNKNOWN,
      profile_summary:
        'Mayor Hill-Lewis confirmed three staff tiers implicated in road and waste tender collusion narratives (Oct 2025) — names not publicly released at that stage.',
      link: {
        full_name: 'Three unnamed City of Cape Town officials (under investigation)',
        role_in_story: 'accused / subjects of probe',
        is_key_figure: false,
      },
    },
  ],
  timeline: [
    {
      event_date: '2025-01-24',
      event_type: EventType.INCIDENT,
      title: 'SAPS raids JP Smith and Xanthea Limberg offices',
      description:
        'The SAPS Western Cape Commercial Crime Unit searches two mayoral committee offices at the Civic Centre complex, citing an ongoing construction-sector tender investigation. Phones and materials are seized; officials term cooperation and political opponents demand suspensions.',
      plain_english:
        'Police raided the offices of two Cape Town city councillors as part of a construction fraud investigation. The councillors said politics was behind the raid.',
      significance: EventSignificance.HIGH,
      source_urls: [
        'https://www.news24.com/southafrica/news/police-raid-offices-of-city-of-cape-towns-jp-smith-and-xanthea-limberg-20250124',
        'https://www.dailymaverick.co.za/article/2025-01-24-smith-and-limberg-raid-parties-call-for-suspension-of-cape-town-mayco-pair/',
      ],
      legal_links: [],
    },
    {
      event_date: '2025-09-12',
      event_type: EventType.JUDGMENT,
      title: 'Western Cape High Court declares January 2025 office raids unlawful',
      description:
        'Judge Kate Savage sets aside search-and-seizure warrants executed on JP Smith’s mayoral office (and related litigation joined by the City), finding material non-disclosure to the issuing magistrate and constitutional defects in the process.',
      plain_english:
        'A judge ruled the police raid on JP Smith’s office was unfair. The police had serious problems with their warrant paperwork and how they went about the search.',
      significance: EventSignificance.HIGH,
      source_urls: [
        'https://www.news24.com/southafrica/crime-and-courts/jp-smith-weighs-legal-action-after-court-slams-police-raid-as-unlawful-20250912',
        'https://www.capetownetc.com/news/court-victory-for-city-of-cape-town-and-jp-smith-against-saps/',
      ],
      legal_links: [
        {
          kind: 'constitution',
          section_number: 14,
          relevance: 'Privacy and home/office search standards — court found the warrant pathway constitutionally flawed.',
          alleged_violation: true,
        },
        {
          kind: 'constitution',
          section_number: 35,
          relevance:
            'Fair process for accused persons — feeds reasonable suspicion and evidentiary hygiene in criminal probes.',
          alleged_violation: false,
        },
      ],
    },
    {
      event_date: '2025-09-30',
      event_type: EventType.INCIDENT,
      title: 'SAPS executes warrants at 26 Cape Town addresses',
      description:
        'Commercial crimes detectives hit 26 business, municipal and residential sites overnight, taking documentary and electronic exhibits for a fraud case City Hall says spans roughly R1.6bn in awarded construction, road and waste services contracts.',
      plain_english:
        'Police raided 26 buildings — city offices, companies and officials’ homes — after the city manager took whistle-blower allegations to SAPS.',
      significance: EventSignificance.CRITICAL,
      source_urls: [
        'https://www.news24.com/southafrica/crime-and-courts/police-raid-26-properties-in-cape-town-linked-to-r16bn-tender-fraud-case-20251001',
        'https://ewn.co.za/2025/10/01/wc-police-raid-26-sites-linked-to-alleged-fraud-involving-over-r1-billion-municipal-contracts',
        'https://www.dailymaverick.co.za/article/2025-10-01-whistleblower-sparks-police-raids-as-investigations-into-cape-towns-r1-6-billion-tender-fraud-intensifies/',
      ],
      legal_links: [
        {
          kind: 'law',
          law_short_name: 'PRECCA',
          section_number: 'Section 3',
          relevance: 'Core gratification / abuse-of-position lens on alleged tender collusion.',
          alleged_violation: true,
        },
        {
          kind: 'law',
          law_short_name: 'PFMA',
          section_number: 'Section 86',
          relevance: 'Fruitless / wasteful expenditure exposure when public money is mis-directed via contracts.',
          alleged_violation: true,
        },
        {
          kind: 'constitution',
          section_number: 217,
          relevance: 'Constitutional procurement principles — fairness, transparency, competitiveness.',
          alleged_violation: true,
        },
        {
          kind: 'law',
          law_short_name: 'POCA',
          section_number: 'Section 2',
          relevance:
            'If organised enterprise conduct is proven, racketeering pattern charges may sit alongside corruption counts.',
          alleged_violation: false,
        },
      ],
    },
    {
      event_date: '2025-10-01',
      event_type: EventType.PRESS_CONFERENCE,
      title: 'Mayor Hill-Lewis confirms three city officials implicated',
      description:
        'Executive mayor ties three administration employees to alleged collusive award of road and refuse-management tenders, stressing investigations continue and urging against premature conclusions on quantum misappropriated.',
      plain_english:
        'The Mayor said three city workers — from junior to senior level — are being investigated for working improperly with contractors.',
      significance: EventSignificance.CRITICAL,
      source_urls: [
        'https://ewn.co.za/2025/10/03/3-coct-officials-implicated-in-tender-fraud-probe-related-to-r16-billion-construction-contract',
      ],
      legal_links: [
        {
          kind: 'law',
          law_short_name: 'PRECCA',
          section_number: 'Section 34',
          relevance:
            'Duty-to-report context — City manager escalation follows internal probes of whistle-blower claims.',
          alleged_violation: false,
        },
      ],
    },
    {
      event_date: '2025-10-03',
      event_type: EventType.STATEMENT,
      title: 'City clarifies R1.6bn headline is investigated contract value',
      description:
        'Mayoral office refines messaging: R1.6 billion reflects aggregate contract face value under review, not adjudicated theft; actual prejudice still being quantified forensically.',
      plain_english:
        'The city explained R1.6 billion is the size of the contracts being looked at — not the amount already proved stolen.',
      significance: EventSignificance.MEDIUM,
      source_urls: [
        'https://ewn.co.za/2025/10/03/hill-lewis-clarifies-some-details-related-to-tender-fraud-probe-into-r16bn-coct-construction-contract',
      ],
      legal_links: [],
    },
    {
      event_date: '2026-01-01',
      event_type: EventType.HEARING,
      title: 'Investigation remains active — no public arrests linked to October wave (editorial checkpoint)',
      description:
        'Quarterly editorial status marker: SAPS/NPA have not announced charges tied to the September–October 2025 search campaign at the time of this seed snapshot.',
      plain_english:
        'As of early 2026 the big police raids had happened but there were no public arrests yet in that specific tender strand.',
      significance: EventSignificance.MEDIUM,
      source_urls: [],
      legal_links: [],
    },
  ],
  expenditures: [
    {
      amount_rands: '1600000000',
      amount_qualifier: AmountQualifier.UNDER_INVESTIGATION,
      expenditure_type: ExpenditureType.UNDER_INVESTIGATION,
      sector: ExpenditureSector.CONSTRUCTION_ROADS,
      description:
        'Aggregate face value of City of Cape Town road & waste-management contracts under SAPS commercial crime review after September–October 2025 raids.',
      plain_english:
        'About R1.6 billion in contracts are part of the police investigation — that is the size of the deals, not proof of theft.',
      source_document:
        'Mayor Geordin Hill-Lewis briefing 3 Oct 2025; News24 / EWN coverage of 26-site operation 1 Oct 2025',
      source_url:
        'https://ewn.co.za/2025/10/03/hill-lewis-clarifies-some-details-related-to-tender-fraud-probe-into-r16bn-coct-construction-contract',
      is_verified: true,
      reference_date: '2025-10-01',
      province_slug: PROVINCE_WESTERN_CAPE.slug,
      municipality_slug: MUNICIPALITY_CCT.slug,
    },
  ],
  total_amount_rands: '1600000000',
};

const STORY_BOOI: StoryBundle = {
  title: 'Malusi Booi and the Cape Town Housing Tender Enterprise',
  slug: 'malusi-booi-housing-tender-fraud-2023',
  domain: StoryDomain.ORGANISED_CRIME,
  story_category: StoryCategory.GANG_LINKED_CORRUPTION,
  status: StoryStatus.ACTIVE,
  province_slug: PROVINCE_WESTERN_CAPE.slug,
  municipality_slug: MUNICIPALITY_CCT.slug,
  plain_english_summary:
    "A former senior Cape Town politician named Malusi Booi was accused of working with alleged 28s gang boss Ralph Stanfield and business associate Nicole Johnson to unfairly steer massive housing-related contracts. Booi was arrested in 2024, fired years earlier after SAPS raids, and saw commercial fraud charges provisionally withdrawn in May 2025 while detectives reworked the docket. He insists he is innocent; key co-accused remain in custody on other charges.",
  plain_english_child:
    'The city had money to build houses for people who needed homes. But some of the people in charge are accused of giving the building contracts to a criminal\'s friends instead of the best company. One city official was accused of receiving secret gifts as a thank you. A whistleblower helped police, and prosecutors are still building the case.',
  people: [
    {
      full_name: 'Malusi Booi',
      aliases: ['MMC Booi', 'Malusi Booi'],
      current_role: 'Former MMC — Human Settlements (excluded from mayoral committee)',
      organisation: 'City of Cape Town',
      status: PersonStatus.CHARGED,
      profile_summary:
        'Former DA-turned-independent housing MMC; arrested Sept 2024 on billion-rand fraud allegations; charges provisionally withdrawn 23 May 2025 — NPA stresses investigation continues.',
      link: { full_name: 'Malusi Booi', role_in_story: 'accused (former MMC)', is_key_figure: true },
    },
    {
      full_name: 'Ralph Stanfield',
      aliases: ['alleged 28s boss'],
      current_role: 'Alleged organised-crime figure',
      organisation: 'Alleged 28s gang network (per charge sheets)',
      status: PersonStatus.CHARGED,
      profile_summary:
        'Described in court papers and media as an alleged 28s leader tied to extortion and construction-site violence; arrested 2023 on multiple counts.',
      link: {
        full_name: 'Ralph Stanfield',
        role_in_story: 'accused — alleged enterprise principal',
        is_key_figure: true,
      },
    },
    {
      full_name: 'Nicole Johnson',
      aliases: ['Glomix-linked director'],
      current_role: 'Businesswoman',
      organisation: 'Glomix and related entities (per reporting)',
      status: PersonStatus.CHARGED,
      profile_summary:
        'Married to Stanfield; Glomix House Brokers and affiliates surfaced in blacklist / tender investigations.',
      link: {
        full_name: 'Nicole Johnson',
        role_in_story: 'accused — alleged company controller',
        is_key_figure: true,
      },
    },
    {
      full_name: 'Nomvuyo Mnyaka',
      aliases: ['Booi ex-spouse'],
      current_role: 'Private citizen',
      organisation: null,
      status: PersonStatus.CHARGED,
      profile_summary:
        'State alleged receipt of a luxury watch from Stanfield — cited as gratification in the housing tender narrative.',
      link: {
        full_name: 'Nomvuyo Mnyaka',
        role_in_story: 'accused — alleged gratification recipient',
        is_key_figure: false,
      },
    },
    {
      full_name: 'Siphokazi September',
      aliases: [],
      current_role: 'Former Director — Public Housing',
      organisation: 'City of Cape Town',
      status: PersonStatus.CHARGED,
      profile_summary:
        'Senior city human-settlements official listed among co-accused on the billion-rand procurement indictment.',
      link: {
        full_name: 'Siphokazi September',
        role_in_story: 'accused — line director',
        is_key_figure: false,
      },
    },
    {
      full_name: 'Wendy Kloppers',
      aliases: [],
      current_role: 'Former City human-settlements project liaison',
      organisation: 'City of Cape Town',
      status: PersonStatus.UNKNOWN,
      profile_summary:
        'Slain 2023 at the Symphony Way flagship housing precinct in Delft while resisting extortion; killing treated as emblematic of gang capture of construction sites.',
      link: {
        full_name: 'Wendy Kloppers',
        role_in_story: 'murder victim (project official)',
        is_key_figure: true,
      },
    },
    {
      full_name: 'Abdul Kader Davids',
      aliases: [],
      current_role: 'Co-accused (deceased)',
      organisation: null,
      status: PersonStatus.UNKNOWN,
      profile_summary:
        'Named co-accused in broader housing corruption network; shot dead in Blue Downs days after release on bail in late 2024 per News24 obituary-style reporting.',
      link: {
        full_name: 'Abdul Kader Davids',
        role_in_story: 'accused — murdered during bail',
        is_key_figure: false,
      },
    },
  ],
  timeline: [
    {
      event_date: '2019-01-01',
      event_type: EventType.INCIDENT,
      title: 'State case theory: enterprise crystallises in Cape Town housing pipeline',
      description:
        'Prosecutors later allege that from roughly 2019 illegal enterprise activity infected human-settlements procurement — long-lead predicate conduct preceding high-profile 2023–2024 arrests.',
      plain_english:
        'According to investigators, a criminal group started working inside Cape Town’s housing deals from about 2019.',
      significance: EventSignificance.MEDIUM,
      source_urls: [
        'https://www.dailymaverick.co.za/article/2025-05-23-fraud-charges-against-malusi-booi-in-r1bn-tender-case-dropped-for-now/',
      ],
      legal_links: [],
    },
    {
      event_date: '2023-02-15',
      event_type: EventType.INCIDENT,
      title: 'Project official Wendy Kloppers murdered at Symphony Way (Delft)',
      description:
        'Kloppers is gunned down on the Symphony Way mega-site — a R400m+ City flagship paused afterwards as extortion and gang interference dominate security planning.',
      plain_english:
        'A city worker helping build houses was shot dead at the building site. People say gangsters wanted to control the contracts.',
      significance: EventSignificance.CRITICAL,
      source_urls: [
        'https://ewn.co.za/2025/03/10/blikkiesdorp-malawi-camp-freedom-farm-residents-excited-to-see-symphony-way-housing-project-resume',
        'https://capeargus.co.za/weekend-argus/news/2025-03-10-cape-town-relaunches-symphony-way-housing-project-to-benefit-thousands/',
      ],
      legal_links: [
        {
          kind: 'law',
          law_short_name: 'POCA',
          section_number: 'Section 2',
          relevance:
            'Pattern violence to capture public construction mirrors racketeering predicates referenced in allied prosecutions.',
          alleged_violation: true,
        },
        {
          kind: 'constitution',
          section_number: 22,
          relevance:
            'Right to freely choose occupation undermined when extortionists control municipal building sites by violence.',
          alleged_violation: true,
        },
      ],
    },
    {
      event_date: '2023-03-15',
      event_type: EventType.INCIDENT,
      title: 'SAPS raids Malusi Booi’s Civic Centre office',
      description:
        'Commercial crimes unit searches the MMC’s office suite, seizing electronics weeks before the mayor suspends then fires Booi from the mayoral cabinet.',
      plain_english:
        'Police searched the housing councillor’s office; he had not been arrested yet.',
      significance: EventSignificance.HIGH,
      source_urls: [
        'https://www.timeslive.co.za/news/south-africa/2023-03-16-fraud-and-corruption-investigation-behind-police-raid-on-city-of-cape-town-offices/',
        'https://www.news24.com/southafrica/news/just-in-offices-of-city-of-cape-town-mayco-member-raided-amid-fraud-corruption-probe-20230316',
      ],
      legal_links: [],
    },
    {
      event_date: '2023-09-29',
      event_type: EventType.ARREST,
      title: 'Ralph Stanfield & Nicole Johnson arrested in Constantia sweep',
      description:
        'Elite detectives arrest the couple on charges initially featuring armed extortion and vehicle-theft predicates; prosecutors later fold in broader procurement angles.',
      plain_english:
        'Police arrested the alleged gang boss and his wife — first on serious violent crimes, while the housing tender case kept growing.',
      significance: EventSignificance.HIGH,
      source_urls: [
        'https://www.dailymaverick.co.za/article/2023-09-29-alleged-28s-boss-ralph-stanfield-and-his-wife-arrested-in-cape-town-crackdown/',
      ],
      legal_links: [],
    },
    {
      event_date: '2024-09-11',
      event_type: EventType.CHARGE_FILED,
      title: 'Malusi Booi arrested — ten-accused indictment on R1bn housing fraud',
      description:
        'Hawks fly Booi from the Eastern Cape to Cape Town magistrates court alongside nine others; State outlines R1bn tender manipulation, gratification and laundering theory.',
      plain_english:
        'Booi was arrested and court papers accused a big group of stealing about R1 billion through bad housing contracts.',
      significance: EventSignificance.CRITICAL,
      source_urls: [
        'https://ewn.co.za/2024/09/11/malusi-booi-and-nine-co-accused-will-remain-in-police-custody',
        'https://www.dailymaverick.co.za/article/2025-05-23-fraud-charges-against-malusi-booi-in-r1bn-tender-case-dropped-for-now/',
      ],
      legal_links: [
        {
          kind: 'law',
          law_short_name: 'PRECCA',
          section_number: 'Section 3',
          relevance: 'Gratification and abuse-of-office counts on the roll.',
          alleged_violation: true,
        },
        {
          kind: 'law',
          law_short_name: 'POCA',
          section_number: 'Section 2',
          relevance: 'Enterprise pattern allegations tying violence, extortion and procurement fraud.',
          alleged_violation: true,
        },
        {
          kind: 'law',
          law_short_name: 'POCA',
          section_number: 'Section 4',
          relevance: 'Money laundering predicates where kickbacks moved through proxies.',
          alleged_violation: true,
        },
      ],
    },
    {
      event_date: '2025-01-31',
      event_type: EventType.HEARING,
      title: 'Defence pushes delay — cites incomplete forensic docket',
      description:
        'During pretrial mentions defence counsel flag outstanding downloads and chain-of-custody disputes, seeking striking relief that is resisted by prosecutors.',
      plain_english:
        'Lawyers told the court the investigation was taking very long and hurting their clients.',
      significance: EventSignificance.MEDIUM,
      source_urls: [
        'https://www.dailymaverick.co.za/article/2025-05-25-new-evidence-stalled-r1bn-malusi-booi-and-ralph-stanfield-tender-fraud-case-still-on-track/',
      ],
      legal_links: [],
    },
    {
      event_date: '2025-05-23',
      event_type: EventType.JUDGMENT,
      title: 'NPA provisionally withdraws commercial fraud charges — reinvestigation',
      description:
        'Senior prosecutor tells court new evidence surfaced; fraud charges against Booi cohort withdrawn without acquittal; Stanfield & Johnson remain detained on parallel violent-crime files.',
      plain_english:
        'Prosecutors dropped the fraud charges for now to build a stronger case. It is not the same as saying everyone is innocent.',
      significance: EventSignificance.CRITICAL,
      source_urls: [
        'https://www.dailymaverick.co.za/article/2025-05-23-fraud-charges-against-malusi-booi-in-r1bn-tender-case-dropped-for-now/',
        'https://ewn.co.za/2025/05/23/tender-fraud-charges-against-malusi-booi-and-9-others-provisionally-withdrawn',
      ],
      legal_links: [],
    },
  ],
  expenditures: [
    {
      amount_rands: '1024000000',
      amount_qualifier: AmountQualifier.APPROXIMATE,
      expenditure_type: ExpenditureType.ALLEGEDLY_STOLEN,
      sector: ExpenditureSector.HOUSING,
      description:
        'Approximate quantum cited in 2024 indictment covering eight mega human-settlement awards allegedly rigged for Stanfield-Johnson linked shells.',
      plain_english:
        'Court papers talked about more than R1 billion in housing contracts that might have been stolen through cheating.',
      source_document: 'Daily Maverick / EWN coverage of Sept 2024 arrests & May 2025 withdrawal',
      source_url:
        'https://www.dailymaverick.co.za/article/2025-05-23-fraud-charges-against-malusi-booi-in-r1bn-tender-case-dropped-for-now/',
      is_verified: true,
      reference_date: '2024-09-11',
      province_slug: PROVINCE_WESTERN_CAPE.slug,
      municipality_slug: MUNICIPALITY_CCT.slug,
    },
  ],
  total_amount_rands: '1024000000',
};

const STORY_MPUMALANGA: StoryBundle = {
  title: 'Mpumalanga R114 Million School Maintenance Tender Fraud',
  slug: 'mpumalanga-school-tender-fraud-2026',
  domain: StoryDomain.POLITICS,
  story_category: StoryCategory.EDUCATION_CORRUPTION,
  status: StoryStatus.ACTIVE,
  province_slug: PROVINCE_MPUMALANGA.slug,
  municipality_slug: null,
  plain_english_summary:
    'The Mpumalanga Department of Education budgeted roughly R114 million for emergency repairs at 21 rural schools. Hawks investigators say officials and contractors inflated prices, billed for ghost work and split proceeds. A former acting HOD, acting CFO and dozens of suppliers were rounded up in a four-province takedown in February 2026 — totals in headlines ranged from about 20 to 36 suspects as operations widened.',
  plain_english_child:
    'Country schools needed fixing. The government sent money. Police say some adults faked the work and stole the cash instead.',
  people: [
    {
      full_name: 'Mpumalanga Education acting HOD (name withheld — Feb 2026 docket)',
      aliases: [],
      current_role: 'Former acting Head of Department — Mpumalanga Education',
      organisation: 'Mpumalanga Department of Education',
      status: PersonStatus.CHARGED,
      profile_summary:
        'Hawks named a former acting HOD among senior officials arrested 22–23 Feb 2026; formal name omitted in early releases.',
      link: {
        full_name: 'Mpumalanga Education acting HOD (name withheld — Feb 2026 docket)',
        role_in_story: 'accused — senior department official',
        is_key_figure: true,
      },
    },
    {
      full_name: 'Mpumalanga Education CFO-track official (name withheld — Feb 2026 docket)',
      aliases: [],
      current_role: 'Former chief financial officer (acting capacity)',
      organisation: 'Mpumalanga Department of Education',
      status: PersonStatus.CHARGED,
      profile_summary:
        'Listed in Hawks briefing packs as among nine departmental figures arrested in the school-maintenance sweep.',
      link: {
        full_name: 'Mpumalanga Education CFO-track official (name withheld — Feb 2026 docket)',
        role_in_story: 'accused — finance oversight',
        is_key_figure: true,
      },
    },
    {
      full_name: 'Contractors & officials — Mpumalanga school maintenance case (Feb 2026)',
      aliases: [],
      current_role: 'Mixed co-accused pool',
      organisation: 'Various (contractors + public servants)',
      status: PersonStatus.CHARGED,
      profile_summary:
        'Sowetan / EWN coverage cites 20–36 people ultimately apprehended across Mpumalanga, Gauteng, Limpopo and Western Cape as the Hawks widened the net.',
      link: {
        full_name: 'Contractors & officials — Mpumalanga school maintenance case (Feb 2026)',
        role_in_story: 'accused — bulk defendants',
        is_key_figure: false,
      },
    },
  ],
  timeline: [
    {
      event_date: '2019-07-01',
      event_type: EventType.INCIDENT,
      title: 'Emergency school maintenance panels activated for 21 rural schools',
      description:
        'Departmental records show irregular emergency repair awards beginning 2019/20 — later described as hand-picked panel appointments skipping SCM checks.',
      plain_english:
        'Starting around 2019 the department signed repair deals for 21 schools.',
      significance: EventSignificance.MEDIUM,
      source_urls: [
        'https://www.sowetanlive.co.za/news/2026-02-22-hawks-arrest-20-suspects-in-r113m-mpumalanga-school-repairs-scandal/',
      ],
      legal_links: [],
    },
    {
      event_date: '2026-02-22',
      event_type: EventType.ARREST,
      title: 'Hawks-led raids across four provinces on school maintenance syndicate',
      description:
        'DPCI teams hit finance directorates and contractor homes — early tallies spoke of ~R113–114m looted and roughly twenty prime suspects, climbing past thirty within 24h as follow-up warrants executed.',
      plain_english:
        'Anti-corruption police arrested many people in four provinces for stealing school repair money.',
      significance: EventSignificance.CRITICAL,
      source_urls: [
        'https://www.sowetanlive.co.za/news/2026-02-22-hawks-arrest-20-suspects-in-r113m-mpumalanga-school-repairs-scandal/',
        'http://ewn.co.za/2026/02/23/36-arrested-as-mpumalanga-hawks-close-in-on-school-maintenance-looting-syndicate',
      ],
      legal_links: [
        {
          kind: 'law',
          law_short_name: 'PRECCA',
          section_number: 'Section 3',
          relevance: 'Bribery / gratification on procurement approvals.',
          alleged_violation: true,
        },
        {
          kind: 'law',
          law_short_name: 'PFMA',
          section_number: 'Section 86',
          relevance: 'Fruitless expenditure where invoices lacked underlying delivery.',
          alleged_violation: true,
        },
      ],
    },
  ],
  expenditures: [
    {
      amount_rands: '114000000',
      amount_qualifier: AmountQualifier.EXACT,
      expenditure_type: ExpenditureType.ALLEGEDLY_STOLEN,
      sector: ExpenditureSector.EDUCATION,
      description:
        'Hawks briefing figure for allegedly diverted maintenance funds across the 21-school emergency programme.',
      plain_english:
        'Police say about R114 million meant for fixing schools was stolen.',
      source_document: 'Sowetanlive / EWN Hawks takedown copy — 22–23 Feb 2026',
      source_url:
        'https://www.sowetanlive.co.za/news/2026-02-22-hawks-arrest-20-suspects-in-r113m-mpumalanga-school-repairs-scandal/',
      is_verified: true,
      reference_date: '2026-02-22',
      province_slug: PROVINCE_MPUMALANGA.slug,
      municipality_slug: null,
    },
  ],
  total_amount_rands: '114000000',
};

const STORY_WATER: StoryBundle = {
  title: 'R19 Billion Lost in Water Sector Mismanagement (2023/24)',
  slug: 'water-sector-r19bn-losses-2023-24',
  domain: StoryDomain.POLITICS,
  story_category: StoryCategory.WATER_SANITATION,
  status: StoryStatus.ACTIVE,
  province_slug: null,
  municipality_slug: null,
  plain_english_summary:
    'Auditor-General Tsakani Maluleke’s 2023/24 municipal water disclosures quantify roughly R18.9 billion in technical and commercial losses nationally — effectively R52 million per day — alongside tens of millions of people facing unreliable supply. Gauteng municipalities alone shed about R6.9 billion; KwaZulu-Natal R3.45 billion. Fifty-five material irregularities added R1.76 billion in booked financial losses. SIU in 2025 separately said it referred 350 criminal dockets and chased R6.2 billion in civil recoveries linked to water-sector corruption.',
  plain_english_child:
    'Imagine giant taps left open and pipes leaking while someone still gets paid to fix them — that is what auditors measured: billions of litres and rands lost while millions wait for reliable water.',
  people: [],
  timeline: [
    {
      event_date: '2024-07-31',
      event_type: EventType.INCIDENT,
      title: 'Auditor-General closes fieldwork on 2023/24 municipal water disclosures',
      description:
        'AGSA finalises MFMA general reports underpinning the 28 May 2025 national outcomes briefing on drinking-water losses and governance failures.',
      plain_english:
        'The country’s top auditor finished checking the books on municipal water for the 2023/24 year.',
      significance: EventSignificance.LOW,
      source_urls: ['https://www.agsa.co.za/Reporting/GeneralReports.aspx'],
      legal_links: [],
    },
    {
      event_date: '2025-04-01',
      event_type: EventType.STATEMENT,
      title: 'AGRSA tabling — R18.9bn national water losses; provincial splits published',
      description:
        'Consolidated MFMA / water-supply reporting shows R18.9bn losses (≈R52m/day), Gauteng R6.9bn, KZN R3.45bn, with 55 material irregularities worth R1.76bn.',
      plain_english:
        'Auditors said South Africa lost almost R19 billion worth of water in one year — not from drought alone, but leakage, theft and bad management.',
      significance: EventSignificance.CRITICAL,
      source_urls: [
        'https://mfma-2024.agsareports.co.za/report/FINAL%202023-24%20MFMA%20GR%2028%20May%202025%20media%20release.pdf',
        'https://www.agsa.co.za/Portals/0/Reports/MFMA/2023-24/MFMA%20Report%202023-24%20interactive%20(updated%20August%202025).pdf?ver=slan798UjMlesR7ldmMsyA%3D%3D',
      ],
      legal_links: [
        {
          kind: 'law',
          law_short_name: 'PFMA',
          section_number: 'Section 86',
          relevance:
            'Local government accounting officers must curb fruitless water expenditure — AG flags systemic non-revenue water as governance failure.',
          alleged_violation: true,
        },
      ],
    },
    {
      event_date: '2025-04-15',
      event_type: EventType.STATEMENT,
      title: 'SIU water-sector recoveries / referrals snapshot',
      description:
        'SIU head told Parliament the unit referred roughly 350 criminal cases to the NPA and was pursuing ~R6.2 billion in civil litigation while cash recoveries sat near R593 million in the same reporting cycle (per ministerial answers consolidated by Citizen/TimesLive).',
      plain_english:
        'The corruption-busting unit told MPs it sent hundreds of water corruption files to prosecutors and is trying to get millions back through court cases.',
      significance: EventSignificance.HIGH,
      source_urls: [
        'https://www.citizen.co.za/news/south-africa/contract-value-siu-water-sector-investigations-tops-r6-billion/',
        'https://www.timeslive.co.za/politics/2026-04-01-siu-claws-back-billions-in-dodgy-water-contracts-as-floodgates-open/',
      ],
      legal_links: [
        {
          kind: 'law',
          law_short_name: 'PRECCA',
          section_number: 'Section 3',
          relevance: 'Kickbacks on water tanker and project spend recurring in SIU referrals.',
          alleged_violation: true,
        },
      ],
    },
  ],
  expenditures: [
    {
      amount_rands: '18900000000',
      amount_qualifier: AmountQualifier.APPROXIMATE,
      expenditure_type: ExpenditureType.FRUITLESS_WASTEFUL,
      sector: ExpenditureSector.WATER_SANITATION,
      description:
        'National non-revenue water (technical + commercial losses) quantified by AGSA for 2023/24 — R18.9 billion headline repeated in May 2025 MFMA release (≈R52m/day).',
      plain_english:
        'Almost nineteen billion rands worth of water never reached paying customers that year.',
      source_document:
        'Auditor-General South Africa MFMA 2023/24 general report media release (28 May 2025)',
      source_url:
        'https://mfma-2024.agsareports.co.za/report/FINAL%202023-24%20MFMA%20GR%2028%20May%202025%20media%20release.pdf',
      is_verified: true,
      reference_date: '2025-04-01',
      province_slug: null,
      municipality_slug: null,
    },
    {
      amount_rands: '1760000000',
      amount_qualifier: AmountQualifier.EXACT,
      expenditure_type: ExpenditureType.FRUITLESS_WASTEFUL,
      sector: ExpenditureSector.WATER_SANITATION,
      description:
        'Sum of financial losses booked against 55 material irregularities in the water supply and sanitation sector per AGSA 2023/24 consolidated outcomes.',
      plain_english: 'Auditors found R1.76 billion in definite money losses from 55 big irregularities.',
      source_document: 'AGSA MFMA 2023/24 outcomes presentation / interactive report',
      source_url:
        'https://www.agsa.co.za/Portals/0/Reports/MFMA/2023-24/MFMA%20Report%202023-24%20interactive%20(updated%20August%202025).pdf?ver=slan798UjMlesR7ldmMsyA%3D%3D',
      is_verified: true,
      reference_date: '2025-04-01',
      province_slug: null,
      municipality_slug: null,
    },
  ],
  total_amount_rands: '20660000000',
};

const STORY_SASSA: StoryBundle = {
  title: 'Gauteng SASSA Officials Arrested in R260 Million Grant Fraud',
  slug: 'gauteng-sassa-r260m-fraud-2025',
  domain: StoryDomain.POLITICS,
  story_category: StoryCategory.SOCIAL_GRANTS_FRAUD,
  status: StoryStatus.ACTIVE,
  province_slug: PROVINCE_GAUTENG.slug,
  municipality_slug: null,
  plain_english_summary:
    'Gauteng SAPS and SASSA integrity teams arrested four regional officials in March 2025 for an alleged R260 million ghost-beneficiary / cloned-card scheme run out of Johannesburg and Soweto. Further counts and private-sector accomplices were added as card laboratories were dismantled.',
  plain_english_child:
    'Some people whose job was to protect grant money are accused of inventing fake names to steal cash meant for children and grandparents.',
  people: [],
  timeline: [
    {
      event_date: '2025-03-14',
      event_type: EventType.ARREST,
      title: 'Four Gauteng SASSA officials arrested in R260m grant fraud sting',
      description:
        'Provincial commissioner Lieutenant General Tommy Mthombeni briefs media: trio arrested at SASSA House, fourth in Soweto; syndicate cloned >150 cards; losses estimated R260m.',
      plain_english:
        'Police arrested four SASSA workers in Johannesburg and Soweto for stealing grant money with fake accounts.',
      significance: EventSignificance.CRITICAL,
      source_urls: [
        'https://www.saps.gov.za/newsroom/msspeechdetail.php?nid=59588',
        'https://www.theherald.co.za/news/2025-03-15-sassa-workers-arrested-for-r260m-fraud-scheme/',
      ],
      legal_links: [
        {
          kind: 'law',
          law_short_name: 'PRECCA',
          section_number: 'Section 3',
          relevance: 'Abuse of position to divert social security funds.',
          alleged_violation: true,
        },
        {
          kind: 'law',
          law_short_name: 'Social Assistance Act',
          section_number: 'Section 4',
          relevance: 'Minister / Agency duties to pay lawful beneficiaries only.',
          alleged_violation: true,
        },
      ],
    },
  ],
  expenditures: [
    {
      amount_rands: '260000000',
      amount_qualifier: AmountQualifier.EXACT,
      expenditure_type: ExpenditureType.ALLEGEDLY_STOLEN,
      sector: ExpenditureSector.SOCIAL_GRANTS,
      description:
        'SAPS-published estimate of fraudulent grants mis-paid via cloned cards linked to the March 2025 Gauteng takedown.',
      plain_english: 'Police said about R260 million in grants was stolen in this scheme.',
      source_document: 'SAPS provincial statement 14–15 March 2025; Herald coverage',
      source_url: 'https://www.saps.gov.za/newsroom/msspeechdetail.php?nid=59588',
      is_verified: true,
      reference_date: '2025-03-14',
      province_slug: PROVINCE_GAUTENG.slug,
      municipality_slug: null,
    },
  ],
  total_amount_rands: '260000000',
};

const ALL_STORIES: StoryBundle[] = [
  STORY_R1_6,
  STORY_BOOI,
  STORY_MPUMALANGA,
  STORY_WATER,
  STORY_SASSA,
];

// ─────────────────────────────────────────────────────────────────────────────
// Upsert helpers
// ─────────────────────────────────────────────────────────────────────────────

type ProvinceUpsert = {
  name: string;
  slug: string;
  abbreviation: string;
  capital: string;
};

async function upsertProvince(m: EntityManager, seed: ProvinceUpsert): Promise<Province> {
  const repo = m.getRepository(Province);
  let row = await repo.findOne({ where: { slug: seed.slug } });
  const payload = {
    name: seed.name,
    slug: seed.slug,
    abbreviation: seed.abbreviation,
    capital: seed.capital,
  };
  if (!row) {
    row = repo.create(payload);
    row = await repo.save(row);
    console.log(`  + Province: ${seed.slug}`);
  } else {
    Object.assign(row, payload);
    row = await repo.save(row);
    console.log(`  · Province: ${seed.slug}`);
  }
  return row;
}

async function upsertMunicipality(
  m: EntityManager,
  seed: typeof MUNICIPALITY_CCT,
  provinceId: string,
): Promise<Municipality> {
  const repo = m.getRepository(Municipality);
  let row = await repo.findOne({ where: { slug: seed.slug } });
  const payload = {
    name: seed.name,
    short_name: seed.short_name,
    slug: seed.slug,
    municipality_type: seed.municipality_type,
    province_id: provinceId,
  };
  if (!row) {
    row = repo.create(payload);
    row = await repo.save(row);
    console.log(`  + Municipality: ${seed.slug}`);
  } else {
    Object.assign(row, payload);
    row = await repo.save(row);
    console.log(`  · Municipality: ${seed.slug}`);
  }
  return row;
}

async function ensureExtraConstitution(
  m: EntityManager,
): Promise<Map<number, ConstitutionSection>> {
  const repo = m.getRepository(ConstitutionSection);
  const map = new Map<number, ConstitutionSection>();

  for (const row of await repo.find()) {
    map.set(row.section_number, row);
  }

  for (const seed of EXTRA_CONSTITUTION_SECTIONS) {
    let row = await repo.findOne({ where: { section_number: seed.section_number } });
    const payload = {
      chapter_number: seed.chapter_number,
      section_number: seed.section_number,
      section_title: seed.section_title,
      plain_english: seed.plain_english,
      full_text: null as string | null,
    };
    if (!row) {
      row = repo.create(payload);
      row = await repo.save(row);
    } else {
      Object.assign(row, payload);
      row = await repo.save(row);
    }
    map.set(seed.section_number, row);
  }
  return map;
}

async function ensureLawSections(m: EntityManager): Promise<Map<string, LawSection>> {
  const lawRepo = m.getRepository(Law);
  const sectionRepo = m.getRepository(LawSection);
  const map = new Map<string, LawSection>();

  for (const seed of ENSURE_LAWS) {
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
      const sPayload = {
        law_id: law.id,
        section_number: sec.section_number,
        section_title: sec.section_title,
        plain_english: sec.plain_english,
        full_text: null as string | null,
      };
      if (!section) {
        section = sectionRepo.create(sPayload);
        section = await sectionRepo.save(section);
      } else {
        Object.assign(section, sPayload);
        section = await sectionRepo.save(section);
      }
      map.set(`${seed.short_name}::${sec.section_number}`, section);
    }
  }
  return map;
}

async function resolveProvinceId(
  provinces: Map<string, Province>,
  slug: string | null,
): Promise<string | null> {
  if (!slug) return null;
  const p = provinces.get(slug);
  if (!p) throw new Error(`Province slug not loaded: ${slug}`);
  return p.id;
}

async function resolveMunicipalityId(
  m: EntityManager,
  slug: string | null,
): Promise<string | null> {
  if (!slug) return null;
  const row = await m.getRepository(Municipality).findOne({ where: { slug } });
  if (!row) throw new Error(`Municipality slug not found: ${slug}`);
  return row.id;
}

async function upsertStoryRecord(
  m: EntityManager,
  bundle: StoryBundle,
  provinceId: string | null,
  municipalityId: string | null,
): Promise<Story> {
  const repo = m.getRepository(Story);
  const payload = {
    title: bundle.title,
    slug: bundle.slug,
    domain: bundle.domain,
    status: bundle.status,
    summary: bundle.plain_english_child,
    plain_english_summary: bundle.plain_english_summary,
    story_category: bundle.story_category,
    province_id: provinceId,
    municipality_id: municipalityId,
    total_amount_rands: bundle.total_amount_rands,
    commission_id: null,
    adhoc_committee_id: null,
    siu_proclamation_id: null,
  };

  let story = await repo.findOne({ where: { slug: bundle.slug } });
  if (!story) {
    story = repo.create(payload);
    story = await repo.save(story);
    console.log(`  + Story: ${bundle.slug}`);
  } else {
    Object.assign(story, payload);
    story = await repo.save(story);
    console.log(`  · Story: ${bundle.slug}`);
  }
  return story;
}

async function upsertPeopleForStory(
  m: EntityManager,
  story: Story,
  bundle: StoryBundle,
): Promise<void> {
  const personRepo = m.getRepository(Person);
  const linkRepo = m.getRepository(StoryPerson);

  for (const seed of bundle.people) {
    let person = await personRepo.findOne({ where: { full_name: seed.full_name } });
    const pPayload = {
      full_name: seed.full_name,
      aliases: [...seed.aliases],
      current_role: seed.current_role,
      organisation: seed.organisation,
      status: seed.status,
      profile_summary: seed.profile_summary,
    };
    if (!person) {
      person = personRepo.create(pPayload);
      person = await personRepo.save(person);
    } else {
      Object.assign(person, pPayload);
      person = await personRepo.save(person);
    }

    const linkPayload = {
      story_id: story.id,
      person_id: person.id,
      role_in_story: seed.link.role_in_story,
      is_key_figure: seed.link.is_key_figure,
    };
    let link = await linkRepo.findOne({
      where: { story_id: story.id, person_id: person.id },
    });
    if (!link) {
      link = linkRepo.create(linkPayload);
      await linkRepo.save(link);
    } else {
      Object.assign(link, linkPayload);
      await linkRepo.save(link);
    }
  }
}

async function upsertTimeline(
  m: EntityManager,
  story: Story,
  bundle: StoryBundle,
  lawSections: Map<string, LawSection>,
  constitutionSections: Map<number, ConstitutionSection>,
): Promise<void> {
  const eventRepo = m.getRepository(TimelineEvent);
  const refRepo = m.getRepository(EventLegalReference);

  for (const seed of bundle.timeline) {
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

    for (const link of seed.legal_links) {
      let lawSectionId: string | null = null;
      let constitutionSectionId: string | null = null;

      if (link.kind === 'law') {
        const key = `${link.law_short_name}::${link.section_number}`;
        const section = lawSections.get(key);
        if (!section) {
          throw new Error(
            `Legal link missing law section "${key}" for event "${seed.title}"`,
          );
        }
        lawSectionId = section.id;
      } else {
        const cs = constitutionSections.get(link.section_number);
        if (!cs) {
          throw new Error(
            `Legal link missing constitution section ${link.section_number} for event "${seed.title}"`,
          );
        }
        constitutionSectionId = cs.id;
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

async function upsertExpenditure(
  m: EntityManager,
  story: Story,
  bundle: StoryBundle,
  provinces: Map<string, Province>,
): Promise<void> {
  const repo = m.getRepository(PublicExpenditureRecord);

  for (const seed of bundle.expenditures) {
    const provId = await resolveProvinceId(provinces, seed.province_slug ?? null);
    const munId = await resolveMunicipalityId(m, seed.municipality_slug ?? null);

    let row = await repo.findOne({
      where: {
        story_id: story.id,
        amount_rands: seed.amount_rands,
        reference_date: seed.reference_date ?? IsNull(),
        sector: seed.sector,
        expenditure_type: seed.expenditure_type,
      },
    });

    const payload = {
      story_id: story.id,
      province_id: provId,
      municipality_id: munId,
      amount_rands: seed.amount_rands,
      amount_qualifier: seed.amount_qualifier,
      expenditure_type: seed.expenditure_type,
      sector: seed.sector,
      description: seed.description,
      plain_english: seed.plain_english ?? null,
      source_document: seed.source_document ?? null,
      source_url: seed.source_url ?? null,
      reference_date: seed.reference_date,
      is_verified: seed.is_verified,
      is_primary_record: seed.is_primary_record ?? true,
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

export async function upsertSimilarPair(
  m: EntityManager,
  slugA: string,
  slugB: string,
  reason: SimilarityReason,
  note: string,
): Promise<void> {
  const storyRepo = m.getRepository(Story);
  const simRepo = m.getRepository(SimilarStory);
  const a = await storyRepo.findOne({ where: { slug: slugA } });
  const b = await storyRepo.findOne({ where: { slug: slugB } });
  if (!a || !b) {
    console.warn(
      `  · similar_stories: skip "${slugA}" ↔ "${slugB}" (missing ${!a ? slugA : ''} ${!b ? slugB : ''})`,
    );
    return;
  }

  let row = await simRepo.findOne({
    where: { story_id: a.id, similar_story_id: b.id },
  });
  const payload = {
    story_id: a.id,
    similar_story_id: b.id,
    similarity_reason: reason,
    similarity_note: note,
  };
  if (!row) {
    row = simRepo.create(payload);
    await simRepo.save(row);
    console.log(`  + Similar: ${slugA} → ${slugB} (${reason})`);
  } else {
    Object.assign(row, payload);
    await simRepo.save(row);
    console.log(`  · Similar: ${slugA} → ${slugB} (${reason})`);
  }
}

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized
    ? AppDataSource
    : await AppDataSource.initialize();

  console.log('\n── Seeding: Cape Town & provincial accountability stories ──');

  try {
    await dataSource.transaction(async (m) => {
      const wc = await upsertProvince(m, PROVINCE_WESTERN_CAPE);
      await upsertProvince(m, PROVINCE_MPUMALANGA);
      await upsertProvince(m, PROVINCE_GAUTENG);
      await upsertMunicipality(m, MUNICIPALITY_CCT, wc.id);

      const provinces = new Map<string, Province>();
      for (const p of await m.getRepository(Province).find()) {
        provinces.set(p.slug, p);
      }

      const constitutionSections = await ensureExtraConstitution(m);
      const lawSections = await ensureLawSections(m);

      for (const bundle of ALL_STORIES) {
        const provinceId = await resolveProvinceId(provinces, bundle.province_slug);
        const municipalityId = bundle.municipality_slug
          ? await resolveMunicipalityId(m, bundle.municipality_slug)
          : null;
        const story = await upsertStoryRecord(m, bundle, provinceId, municipalityId);
        await upsertPeopleForStory(m, story, bundle);
        await upsertTimeline(m, story, bundle, lawSections, constitutionSections);
        await upsertExpenditure(m, story, bundle, provinces);
      }

      await upsertSimilarPair(
        m,
        'cape-town-r1-6bn-tender-fraud-2025',
        'malusi-booi-housing-tender-fraud-2023',
        SimilarityReason.SAME_MUNICIPALITY,
        'Both involve Cape Town municipal tender fraud investigations.',
      );
      await upsertSimilarPair(
        m,
        'cape-town-r1-6bn-tender-fraud-2025',
        'mpumalanga-school-tender-fraud-2026',
        SimilarityReason.SAME_CATEGORY,
        'Both involve government construction / maintenance tender fraud.',
      );
      await upsertSimilarPair(
        m,
        'malusi-booi-housing-tender-fraud-2023',
        'mkhwanazi-madlanga-commission',
        SimilarityReason.SAME_PATTERN,
        'Both allege organised criminal networks embedded in government procurement.',
      );
      await upsertSimilarPair(
        m,
        'gauteng-sassa-r260m-fraud-2025',
        'water-sector-r19bn-losses-2023-24',
        SimilarityReason.SAME_PROVINCE,
        'Gauteng losses dominate water-sector audit disclosures; SASSA fraud strand prosecuted in Gauteng — linked as provincial public-finance stress.',
      );
    });

    console.log('──────────────────────────────────────────────');
    console.log('✓ Cape Town stories seed complete.\n');
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
