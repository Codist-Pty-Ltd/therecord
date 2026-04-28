/* eslint-disable no-console */

/**
 * commissions-master.seed.ts
 *
 * Seeds every national South African commission of inquiry since 1994
 * (excluding the Madlanga Commission, which is seeded alongside the
 * Mkhwanazi story in `mkhwanazi.seed.ts`).
 *
 * Safe to run repeatedly — every write is an upsert keyed on a stable
 * natural identifier (commission.slug, law.short_name, person.full_name,
 * etc.). The whole operation runs inside a single transaction.
 *
 * Run with (inside apps/api):
 *   npm run seed:commissions
 *
 * Dependency order:
 *   1. Laws / LawSections          (referenced by commission_law_sections)
 *   2. People                      (referenced by commission_people)
 *   3. Commissions
 *   4. commission_law_sections     (Commission ↔ LawSection join)
 *   5. commission_people           (Commission ↔ Person join)
 *
 * Intentionally does NOT touch `stories`, `timeline_events`,
 * `constitution_sections` or the story↔commission link — those belong to
 * per-story seeds (see mkhwanazi.seed.ts).
 */

import 'reflect-metadata';

import type { EntityManager } from 'typeorm';

import {
  Commission,
  CommissionDomain,
  CommissionStatus,
} from '../../entities/commission.entity';
import {
  CommissionLawSection,
  CommissionLawSectionUsage,
} from '../../entities/commission_law_section.entity';
import {
  CommissionPerson,
  CommissionPersonRole,
} from '../../entities/commission_person.entity';
import { Law, LawCategory } from '../../entities/law.entity';
import { LawSection } from '../../entities/law_section.entity';
import { Person, PersonStatus } from '../../entities/person.entity';
import { AppDataSource } from '../data-source';

// ───────────────────────────────────────────────────────────────────────────────
// Seed input data
// ───────────────────────────────────────────────────────────────────────────────

// --- Laws & sections -------------------------------------------------------

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
 * Laws referenced by `enabling_legislation` / `commission_law_sections`.
 * "Constitution" is represented as a Law record so commission_law_sections
 * can link to it via LawSection (the join table doesn't know about
 * constitution_sections — that's intentional; constitution_sections serve
 * the per-event legal-reference view).
 */
const LAWS_SEED: readonly LawSeed[] = [
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
        section_title: 'President may establish a commission',
        plain_english:
          'The President can set up a commission of inquiry whenever it is in the public interest, and give it powers to summon witnesses and require documents.',
      },
    ],
  },
  {
    short_name: 'Constitution',
    name: 'Constitution of the Republic of South Africa, 1996',
    act_number: '108 of 1996',
    category: LawCategory.CONSTITUTIONAL,
    plain_english:
      "South Africa's supreme law. Everything the government does — every other law, every presidential order, every arrest — must fit inside it.",
    full_text_url: 'https://www.gov.za/documents/constitution-republic-south-africa-1996',
    sections: [
      {
        section_number: 'Section 7',
        section_title: 'Bill of Rights — cornerstone of democracy',
        plain_english:
          'The Bill of Rights is the part of the Constitution that protects every person in South Africa. The state must respect, protect, promote and fulfil these rights.',
      },
      {
        section_number: 'Section 84(2)(f)',
        section_title: 'Presidential power to appoint a commission of inquiry',
        plain_english:
          'The President may appoint a commission of inquiry. This is the most common constitutional basis for big public investigations in South Africa.',
      },
      {
        section_number: 'Section 127(2)(e)',
        section_title: 'Provincial Premier power to appoint a commission',
        plain_english:
          'A provincial Premier can appoint commissions of inquiry at provincial level — the same kind of power the President has nationally.',
      },
      {
        section_number: 'Section 206(5)',
        section_title: 'Provincial commissions on policing',
        plain_english:
          'A provincial government can set up its own investigation into police inefficiency or complaints about the police in that province.',
      },
    ],
  },
  {
    short_name: 'Promotion of National Unity Act',
    name: 'Promotion of National Unity and Reconciliation Act',
    act_number: '34 of 1995',
    category: LawCategory.OTHER,
    plain_english:
      'The law that created the Truth and Reconciliation Commission. It let victims of apartheid be heard and let perpetrators confess in exchange for amnesty.',
    full_text_url:
      'https://www.gov.za/documents/promotion-national-unity-and-reconciliation-act',
    sections: [
      {
        section_number: 'Section 2',
        section_title: 'Establishment of the Truth and Reconciliation Commission',
        plain_english:
          'The section that actually created the TRC and said what it was for: healing the country, recording the truth, and deciding who could be forgiven.',
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
        section_number: 'Section 12(6)(a)',
        section_title: 'Fitness inquiry into an NDPP or Deputy NDPP',
        plain_english:
          'If there is reason to think the head of the prosecutors is no longer fit for the job, the President can hold a formal inquiry to decide whether to remove them.',
      },
      {
        section_number: 'Section 32',
        section_title: 'Independence and impartiality of prosecuting authority',
        plain_english:
          'Prosecutors must decide cases based on the law and the evidence — without fear, favour or prejudice. No politician or official can tell them to drop a case or press a charge.',
      },
    ],
  },
  {
    short_name: 'HR Commission Act',
    name: 'Human Rights Commission Act',
    act_number: '54 of 1994',
    category: LawCategory.CONSTITUTIONAL,
    plain_english:
      'The law that creates the South African Human Rights Commission and gives it the power to investigate human-rights violations.',
    full_text_url: 'https://www.gov.za/documents/human-rights-commission-act',
    sections: [
      {
        section_number: 'Section 9(6)',
        section_title: 'Power of the SAHRC to hold inquiries',
        plain_english:
          'The South African Human Rights Commission can set up its own public inquiry into a serious or widespread rights abuse, with the power to call witnesses.',
      },
    ],
  },
];

// --- People (commission chairs / implicated / established-by) --------------

interface PersonSeed {
  full_name: string;
  aliases: string[];
  current_role: string | null;
  organisation: string | null;
  status: PersonStatus;
  profile_summary: string;
}

/**
 * Everyone referenced in `COMMISSIONS_SEED` as chair, subject_of_inquiry,
 * implicated, witness, or established_by. Upserted by `full_name`.
 */
const PEOPLE_SEED: readonly PersonSeed[] = [
  {
    full_name: 'Nelson Mandela',
    aliases: ['Madiba', 'Nelson Rolihlahla Mandela'],
    current_role: 'First President of democratic South Africa (1994–1999)',
    organisation: 'African National Congress',
    status: PersonStatus.RESIGNED,
    profile_summary:
      "First democratically elected President of South Africa. Established the Truth and Reconciliation Commission in 1995 to help the country heal from apartheid.",
  },
  {
    full_name: 'Thabo Mbeki',
    aliases: ['Mbeki', 'President Mbeki'],
    current_role: 'Former President of South Africa (1999–2008)',
    organisation: 'African National Congress',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'Second democratically elected President of South Africa. Established several commissions including Jali (prisons), Hefer (spy allegations), Khampepe (Scorpions), Myburgh (rand), Donen (oil-for-food), Nel (Masterbond) and Ngoepe (Ellis Park).',
  },
  {
    full_name: 'Kgalema Motlanthe',
    aliases: ['Motlanthe', 'President Motlanthe'],
    current_role: 'Former Deputy President and President of South Africa (2008–2009)',
    organisation: 'African National Congress',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'Succeeded Thabo Mbeki as President in September 2008 until the 2009 election. Established the Ginwala Enquiry into the fitness of NDPP Vusi Pikoli.',
  },
  {
    full_name: 'Jacob Zuma',
    aliases: ['Zuma', 'JZ', 'President Zuma', 'Msholozi'],
    current_role: 'Former President of South Africa (2009–2018)',
    organisation: 'African National Congress / MK Party',
    status: PersonStatus.CHARGED,
    profile_summary:
      'Third democratically elected President. Central figure in the Hefer, Seriti, Cassim and Zondo commissions — and implicated at several. Refused to complete his testimony at Zondo and was jailed in 2021 for contempt, triggering widespread civil unrest.',
  },
  {
    full_name: 'Cyril Ramaphosa',
    aliases: ['Ramaphosa', 'President Ramaphosa', 'CR'],
    current_role: 'President of South Africa',
    organisation: 'African National Congress',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'President of South Africa since February 2018. Established the Nugent (SARS), PIC (Mpati), Mokgoro (NPA fitness), Madlanga (SAPS allegations) and TRC Prosecutions commissions. Also testified as a witness at the Zondo Commission.',
  },
  {
    full_name: 'Desmond Tutu',
    aliases: ['Tutu', 'Archbishop Tutu', 'Arch'],
    current_role: null,
    organisation: 'Anglican Church / TRC',
    status: PersonStatus.UNKNOWN,
    profile_summary:
      'Nobel Peace laureate and Archbishop Emeritus of Cape Town. Chaired the Truth and Reconciliation Commission. Died in December 2021.',
  },
  {
    full_name: 'Thabani Jali',
    aliases: ['Jali', 'Judge Jali'],
    current_role: 'Retired Judge',
    organisation: 'High Court of South Africa',
    status: PersonStatus.UNKNOWN,
    profile_summary:
      'KwaZulu-Natal High Court judge who chaired the 2001 commission into corruption and maladministration in the Department of Correctional Services.',
  },
  {
    full_name: 'Bernard Ngoepe',
    aliases: ['Ngoepe', 'Judge Ngoepe', 'B M Ngoepe'],
    current_role: 'Former Judge President, North Gauteng High Court',
    organisation: 'High Court of South Africa',
    status: PersonStatus.UNKNOWN,
    profile_summary:
      'Retired Judge President of the North Gauteng High Court. Chaired the Ellis Park Stadium disaster inquiry (2001–2002) and later served as Tax Ombud.',
  },
  {
    full_name: 'John Myburgh',
    aliases: ['Myburgh', 'Judge Myburgh'],
    current_role: 'Retired Judge',
    organisation: 'High Court of South Africa',
    status: PersonStatus.UNKNOWN,
    profile_summary:
      'Senior counsel and former judge who chaired the 2002 commission into the rapid devaluation of the Rand.',
  },
  {
    full_name: 'Michael Donen',
    aliases: ['Donen'],
    current_role: 'Senior Counsel',
    organisation: 'Cape Bar',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'South African senior counsel who chaired the 2002–2006 commission into alleged irregular conduct by SA companies in the UN Oil-for-Food Programme.',
  },
  {
    full_name: 'Joos Hefer',
    aliases: ['Hefer', 'Judge Hefer'],
    current_role: 'Retired Judge of Appeal',
    organisation: 'Supreme Court of Appeal',
    status: PersonStatus.UNKNOWN,
    profile_summary:
      'Retired judge of the Supreme Court of Appeal who chaired the 2003–2004 commission into allegations that NDPP Bulelani Ngcuka was an apartheid-era spy.',
  },
  {
    full_name: 'Bulelani Ngcuka',
    aliases: ['Ngcuka', 'Adv Ngcuka'],
    current_role: 'Former National Director of Public Prosecutions (1998–2004)',
    organisation: 'National Prosecuting Authority',
    status: PersonStatus.RESIGNED,
    profile_summary:
      "First NDPP of the democratic era. Led the investigation into Jacob Zuma's arms-deal dealings. Accused in 2003 of having been an apartheid-era spy — allegations found to be unproven by the Hefer Commission.",
  },
  {
    full_name: 'Sisi Khampepe',
    aliases: ['Khampepe', 'Justice Khampepe'],
    current_role: 'Former Justice of the Constitutional Court',
    organisation: 'Constitutional Court of South Africa',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'Retired Constitutional Court Justice (2009–2021). Before her elevation she chaired the Khampepe Commission (2005–2006) into the future of the Directorate of Special Operations (the Scorpions).',
  },
  {
    full_name: 'Frene Ginwala',
    aliases: ['Ginwala', 'Dr Ginwala'],
    current_role: 'Former Speaker of the National Assembly (1994–2004)',
    organisation: 'Parliament of South Africa',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'First Speaker of the post-1994 National Assembly. In 2007–2008 she chaired the enquiry into the fitness of NDPP Vusi Pikoli. Died in 2023.',
  },
  {
    full_name: 'Vusi Pikoli',
    aliases: ['Pikoli', 'Adv Pikoli'],
    current_role: 'Former National Director of Public Prosecutions (2005–2009)',
    organisation: 'National Prosecuting Authority',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'Third NDPP. Suspended by President Mbeki in 2007 — reportedly because he was about to arrest National Police Commissioner Jackie Selebi. Found fit to hold office by the Ginwala Enquiry but nonetheless dismissed by President Motlanthe in 2008.',
  },
  {
    full_name: "Kate O'Regan",
    aliases: ["O'Regan", 'Justice O\'Regan'],
    current_role: 'Former Justice of the Constitutional Court',
    organisation: 'Constitutional Court of South Africa',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'Retired Constitutional Court Justice (1994–2009). Co-chaired the Khayelitsha Commission (2012–2014) into police inefficiency in the Cape Town township. Now directs the Bonavero Institute of Human Rights at Oxford.',
  },
  {
    full_name: 'Helen Zille',
    aliases: ['Zille', 'Premier Zille'],
    current_role: 'Former Premier of the Western Cape (2009–2019)',
    organisation: 'Democratic Alliance',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'Former Western Cape Premier and DA leader. Established the Khayelitsha Commission of Inquiry under section 206(5) of the Constitution in 2012.',
  },
  {
    full_name: 'Ian Farlam',
    aliases: ['Farlam', 'Judge Farlam'],
    current_role: 'Retired Judge of Appeal',
    organisation: 'Supreme Court of Appeal',
    status: PersonStatus.UNKNOWN,
    profile_summary:
      'Retired SCA judge who chaired the Marikana Commission of Inquiry (2012–2015) into the deaths of 34 mineworkers shot by police at Lonmin\'s Marikana mine.',
  },
  {
    full_name: 'Nathi Mthethwa',
    aliases: ['Mthethwa', 'Minister Mthethwa'],
    current_role: 'Former Minister of Police (2009–2014)',
    organisation: 'Cabinet of the Republic of South Africa',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'Minister of Police at the time of the Marikana massacre. Criticised by the Farlam Commission for aspects of political oversight that preceded the police operation.',
  },
  {
    full_name: 'Willie Seriti',
    aliases: ['Seriti', 'Judge Seriti'],
    current_role: 'Retired Judge of the Supreme Court of Appeal',
    organisation: 'Supreme Court of Appeal',
    status: PersonStatus.UNKNOWN,
    profile_summary:
      'Retired SCA judge who chaired the Arms Procurement Commission (2011–2016). His final report was set aside in 2019 by the North Gauteng High Court on the ground that the commission had failed to investigate properly.',
  },
  {
    full_name: 'John Heher',
    aliases: ['Heher', 'Judge Heher'],
    current_role: 'Retired Judge of Appeal',
    organisation: 'Supreme Court of Appeal',
    status: PersonStatus.UNKNOWN,
    profile_summary:
      'Retired SCA judge who chaired the Heher Commission (2016–2017) into the feasibility of fee-free higher education, convened after the #FeesMustFall protests.',
  },
  {
    full_name: 'Raymond Zondo',
    aliases: ['Zondo', 'Justice Zondo', 'Chief Justice Zondo'],
    current_role: 'Former Chief Justice of South Africa (2022–2024)',
    organisation: 'Constitutional Court of South Africa',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'Chaired the 4-year Judicial Commission into State Capture (2018–2022). Appointed Deputy Chief Justice in 2017 and Chief Justice in April 2022 — while still running the commission. His final 6-volume, 5,000-page report became the reference record for the state-capture era.',
  },
  {
    full_name: 'Robert Nugent',
    aliases: ['Nugent', 'Judge Nugent'],
    current_role: 'Retired Judge of Appeal',
    organisation: 'Supreme Court of Appeal',
    status: PersonStatus.UNKNOWN,
    profile_summary:
      'Retired SCA judge who chaired the 2018 commission into governance failures at SARS under Commissioner Tom Moyane.',
  },
  {
    full_name: 'Tom Moyane',
    aliases: ['Moyane', 'Commissioner Moyane'],
    current_role: 'Former Commissioner of SARS (2014–2018)',
    organisation: 'South African Revenue Service',
    status: PersonStatus.RESIGNED,
    profile_summary:
      "Head of SARS under Jacob Zuma. Found by the Nugent Commission to have caused serious damage to SARS' governance, capacity and culture. Removed from office in November 2018.",
  },
  {
    full_name: 'Lex Mpati',
    aliases: ['Mpati', 'Judge Mpati'],
    current_role: 'Former President of the Supreme Court of Appeal',
    organisation: 'Supreme Court of Appeal',
    status: PersonStatus.UNKNOWN,
    profile_summary:
      'Retired President of the SCA. Chaired the 2018–2019 commission into alleged impropriety at the Public Investment Corporation.',
  },
  {
    full_name: 'Dan Matjila',
    aliases: ['Matjila', 'Dr Matjila'],
    current_role: 'Former CEO of the Public Investment Corporation',
    organisation: 'Public Investment Corporation',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'CEO of the PIC (2014–2018), the state-owned asset manager that oversees more than R2 trillion in public pension money. Found by the Mpati Commission to have made improper investments and misused his position.',
  },
  {
    full_name: 'Yvonne Mokgoro',
    aliases: ['Mokgoro', 'Justice Mokgoro'],
    current_role: 'Former Justice of the Constitutional Court',
    organisation: 'Constitutional Court of South Africa',
    status: PersonStatus.RESIGNED,
    profile_summary:
      "Retired Constitutional Court Justice (1994–2009). Chaired the 2018–2019 enquiry into the fitness of Deputy NDPP Nomgcobo Jiba and Adv Lawrence Mrwebi. Died in 2020.",
  },
  {
    full_name: 'Nomgcobo Jiba',
    aliases: ['Jiba', 'Adv Jiba'],
    current_role: 'Former Deputy NDPP',
    organisation: 'National Prosecuting Authority',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'Deputy National Director of Public Prosecutions. Found unfit to hold office by the Mokgoro Enquiry (2019) over the withdrawal of charges and the handling of the Richard Mdluli prosecution. Removed by President Ramaphosa.',
  },
  {
    full_name: 'Lawrence Mrwebi',
    aliases: ['Mrwebi', 'Adv Mrwebi'],
    current_role: 'Former head of the Specialised Commercial Crime Unit',
    organisation: 'National Prosecuting Authority',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'Head of the Specialised Commercial Crime Unit. Found unfit to hold office alongside Jiba in the Mokgoro Enquiry, over his handling of the Mdluli matter.',
  },
  {
    full_name: 'Nazeer Ahmed Cassim',
    aliases: ['Cassim', 'Adv Cassim'],
    current_role: 'Senior Counsel',
    organisation: 'Johannesburg Bar',
    status: PersonStatus.ACTIVE,
    profile_summary:
      'South African senior counsel who chaired the 2015 inquiry into the fitness of NDPP Mxolisi Nxasana.',
  },
  {
    full_name: 'Mxolisi Nxasana',
    aliases: ['Nxasana', 'Adv Nxasana'],
    current_role: 'Former National Director of Public Prosecutions (2013–2015)',
    organisation: 'National Prosecuting Authority',
    status: PersonStatus.RESIGNED,
    profile_summary:
      'Fourth NDPP. Left office in 2015 with a R17.3m golden handshake that the Constitutional Court later declared unlawful, ordering him to repay it.',
  },
  {
    full_name: 'H C Nel',
    aliases: ['Nel', 'Judge Nel'],
    current_role: 'Retired Judge',
    organisation: 'High Court of South Africa',
    status: PersonStatus.UNKNOWN,
    profile_summary:
      'Retired High Court judge. Chaired the Nel Commission of Inquiry into the Masterbond Group and investor protection (commencing 2001).',
  },
  {
    full_name: 'Jody Kollapen',
    aliases: ['Kollapen', 'Justice Kollapen'],
    current_role: 'Justice of the Constitutional Court',
    organisation: 'Constitutional Court of South Africa',
    status: PersonStatus.ACTIVE,
    profile_summary:
      "Justice of the Constitutional Court since 2022. Former chair of the South African Human Rights Commission (2002–2009), in which capacity he led the 2001 inquiry into human-rights violations in farming communities.",
  },
];

// --- Commissions -----------------------------------------------------------

/**
 * Link between a commission and a specific section of a law, for insertion
 * into `commission_law_sections`. Resolved by natural key at seed time.
 */
interface CommissionLawLink {
  law_short_name: string;
  section_number: string;
  usage_type: CommissionLawSectionUsage;
}

/** Link between a commission and a Person, for insertion into `commission_people`. */
interface CommissionPersonLink {
  full_name: string;
  role: CommissionPersonRole;
  summary: string | null;
}

interface CommissionSeed {
  slug: string;
  popular_name: string;
  full_name: string;
  domain: CommissionDomain;
  enabling_legislation: string;
  constitution_section_invoked: string;
  reason_summary: string;
  plain_english_summary: string;
  chair_name: string;
  announced_date: string | null;
  hearings_started: string | null;
  concluded_date: string | null;
  report_released_date: string | null;
  status: CommissionStatus;
  official_url: string | null;
  report_url: string | null;
  cost_rands: string | null;
  total_hearing_days: number | null;
  outcome_summary: string | null;
  produced_prosecutions: boolean | null;
  president_who_established: string | null;
  law_links: CommissionLawLink[];
  person_links: CommissionPersonLink[];
}

/** Default fallback when the user spec didn't supply enabling_legislation. */
const DEFAULT_ENABLING = 'Commissions Act 8 of 1947 Section 1';
const DEFAULT_CONSTITUTION_SECTION = 'Section 84(2)(f)';

const COMMISSIONS_SEED: readonly CommissionSeed[] = [
  // 1 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'truth-reconciliation-commission-trc',
    popular_name: 'Truth and Reconciliation Commission',
    full_name: 'Commission on Truth and Reconciliation',
    domain: CommissionDomain.HUMAN_RIGHTS,
    enabling_legislation: 'Promotion of National Unity and Reconciliation Act 34 of 1995',
    constitution_section_invoked: 'Preamble + Section 7 (Bill of Rights)',
    reason_summary:
      'To investigate gross human rights violations committed between 1960 and 1994 under apartheid, grant amnesty to those who made full disclosure, and help South Africa transition peacefully to democracy.',
    plain_english_summary:
      'After apartheid ended, South Africa needed to heal. The TRC let victims of apartheid tell their stories in public. It also let people who did bad things during apartheid confess — and if they told the whole truth, they could be forgiven (amnesty). It was like a national healing session for the whole country.',
    chair_name: 'Archbishop Desmond Tutu',
    announced_date: '1995-12-01',
    hearings_started: '1996-04-15',
    concluded_date: '1998-10-29',
    report_released_date: '1998-10-29',
    status: CommissionStatus.CONCLUDED,
    official_url: 'https://www.justice.gov.za/trc/',
    report_url: null,
    cost_rands: '200000000',
    total_hearing_days: null,
    outcome_summary:
      'Published a 5-volume final report. Granted 1,512 amnesties from 7,112 applications. Identified perpetrators from all sides of the conflict. Prosecutions were promised but largely never followed through. Many survivors felt justice was incomplete.',
    produced_prosecutions: false,
    president_who_established: 'Nelson Mandela',
    law_links: [
      {
        law_short_name: 'Promotion of National Unity Act',
        section_number: 'Section 2',
        usage_type: CommissionLawSectionUsage.ENABLING,
      },
      {
        law_short_name: 'Constitution',
        section_number: 'Section 7',
        usage_type: CommissionLawSectionUsage.INVESTIGATED,
      },
    ],
    person_links: [
      {
        full_name: 'Desmond Tutu',
        role: CommissionPersonRole.CHAIR,
        summary: 'Chaired the TRC. Set the tone of "restorative" rather than retributive justice.',
      },
      {
        full_name: 'Nelson Mandela',
        role: CommissionPersonRole.ESTABLISHED_BY,
        summary: 'Established the TRC by presidential proclamation under the Promotion of National Unity and Reconciliation Act.',
      },
    ],
  },
  // 2 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'jali-commission',
    popular_name: 'Jali Commission',
    full_name:
      'Commission of Inquiry into Alleged Incidents of Corruption, Maladministration, Violence or Intimidation in the Department of Correctional Services',
    domain: CommissionDomain.CRIMINAL_JUSTICE,
    enabling_legislation: 'Constitution Section 84(2)(f) and Commissions Act 8 of 1947',
    constitution_section_invoked: 'Section 84(2)(f)',
    reason_summary:
      'To investigate corruption, violence, intimidation and maladministration within the Department of Correctional Services (prisons).',
    plain_english_summary:
      "This was an investigation into what was happening inside South Africa's prisons. Officials were accused of helping prisoners with things they should not, taking bribes, and being violent. Think of it as a school inspection — but for prisons.",
    chair_name: 'Thabani Jali',
    announced_date: '2001-12-03',
    hearings_started: null,
    concluded_date: '2005-12-01',
    report_released_date: null,
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary:
      'Found widespread corruption and maladministration in prisons. Report made recommendations for reform. Limited prosecutions followed.',
    produced_prosecutions: false,
    president_who_established: 'Thabo Mbeki',
    law_links: [],
    person_links: [
      { full_name: 'Thabani Jali', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Thabo Mbeki', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
    ],
  },
  // 3 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'ngoepe-commission-ellis-park',
    popular_name: 'Ngoepe Commission',
    full_name: 'Commission of Inquiry into the Ellis Park Stadium Disaster',
    domain: CommissionDomain.PUBLIC_SAFETY,
    enabling_legislation: DEFAULT_ENABLING,
    constitution_section_invoked: DEFAULT_CONSTITUTION_SECTION,
    reason_summary:
      'To investigate the Ellis Park Stadium disaster of 11 April 2001 in which 43 people were killed in a crowd crush during an Orlando Pirates vs Kaizer Chiefs match.',
    plain_english_summary:
      'In April 2001, a terrible thing happened at Ellis Park stadium in Johannesburg during a soccer match. Many people were crushed and 43 people died. This commission asked: why did it happen and who was responsible?',
    chair_name: 'B M Ngoepe',
    announced_date: '2001-04-20',
    hearings_started: null,
    concluded_date: '2002-01-01',
    report_released_date: null,
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary: null,
    produced_prosecutions: false,
    president_who_established: 'Thabo Mbeki',
    law_links: [],
    person_links: [
      { full_name: 'Bernard Ngoepe', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Thabo Mbeki', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
    ],
  },
  // 4 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'myburgh-commission-rand',
    popular_name: 'Myburgh Commission',
    full_name: 'Commission of Inquiry into the Rapid Devaluation of the Rand',
    domain: CommissionDomain.FINANCIAL,
    enabling_legislation: 'Commissions Act 8 of 1947 Section 1',
    constitution_section_invoked: DEFAULT_CONSTITUTION_SECTION,
    reason_summary:
      'To investigate the rapid devaluation of the external value of the South African Rand in late 2001, amid allegations of market manipulation.',
    plain_english_summary:
      'The South African Rand lost its value very fast in 2001. People were worried someone was cheating to make money from this. This commission investigated who or what caused the crash.',
    chair_name: 'John Myburgh',
    announced_date: '2002-01-30',
    hearings_started: null,
    concluded_date: '2002-06-01',
    report_released_date: null,
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary: null,
    produced_prosecutions: false,
    president_who_established: 'Thabo Mbeki',
    law_links: [
      {
        law_short_name: 'Commissions Act',
        section_number: 'Section 1',
        usage_type: CommissionLawSectionUsage.ENABLING,
      },
    ],
    person_links: [
      { full_name: 'John Myburgh', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Thabo Mbeki', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
    ],
  },
  // 5 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'donen-commission-oil-for-food',
    popular_name: 'Donen Commission',
    full_name:
      'Commission of Inquiry into the Alleged Illicit Activities of Certain South African Companies in relation to the UN Oil-for-Food Programme',
    domain: CommissionDomain.CORRUPTION,
    enabling_legislation: 'Commissions Act 8 of 1947 Section 1',
    constitution_section_invoked: DEFAULT_CONSTITUTION_SECTION,
    reason_summary:
      'To investigate South African companies accused of paying illegal surcharges to the Iraqi government under the United Nations Oil-for-Food Programme.',
    plain_english_summary:
      'The United Nations had a programme to help the people of Iraq get food even when their country was being punished with trade bans. Some South African companies were accused of cheating this programme to make illegal profits.',
    chair_name: 'Michael Donen',
    announced_date: '2002-02-13',
    hearings_started: null,
    concluded_date: '2006-01-01',
    report_released_date: null,
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary: null,
    produced_prosecutions: false,
    president_who_established: 'Thabo Mbeki',
    law_links: [
      {
        law_short_name: 'Commissions Act',
        section_number: 'Section 1',
        usage_type: CommissionLawSectionUsage.ENABLING,
      },
    ],
    person_links: [
      { full_name: 'Michael Donen', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Thabo Mbeki', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
    ],
  },
  // 6 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'hefer-commission',
    popular_name: 'Hefer Commission',
    full_name:
      'Commission of Inquiry into Allegations of Spying Against the National Director of Public Prosecutions',
    domain: CommissionDomain.CRIMINAL_JUSTICE,
    enabling_legislation: 'Commissions Act 8 of 1947 Section 1',
    constitution_section_invoked: DEFAULT_CONSTITUTION_SECTION,
    reason_summary:
      'To investigate allegations that NDPP Bulelani Ngcuka was an apartheid-era spy, following claims made by Mac Maharaj and Mo Shaik.',
    plain_english_summary:
      "The head of the prosecutors (like the country's top crime-fighter) was accused of being a spy. This commission investigated whether those accusations were true. It found they were not true — but critics said the whole thing was really about silencing someone who was getting too close to powerful people.",
    chair_name: 'Joos Hefer',
    announced_date: '2003-09-19',
    hearings_started: null,
    concluded_date: '2004-02-01',
    report_released_date: null,
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary:
      'Found the allegations against Ngcuka to be unproven. Widely criticised as a political manoeuvre to discredit Ngcuka, who had been investigating Jacob Zuma.',
    produced_prosecutions: false,
    president_who_established: 'Thabo Mbeki',
    law_links: [
      {
        law_short_name: 'Commissions Act',
        section_number: 'Section 1',
        usage_type: CommissionLawSectionUsage.ENABLING,
      },
    ],
    person_links: [
      { full_name: 'Joos Hefer', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Thabo Mbeki', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
      {
        full_name: 'Bulelani Ngcuka',
        role: CommissionPersonRole.SUBJECT_OF_INQUIRY,
        summary: 'Subject of the spy allegations the commission investigated.',
      },
      {
        full_name: 'Jacob Zuma',
        role: CommissionPersonRole.IMPLICATED,
        summary: "At the time Ngcuka was investigating Zuma's arms-deal dealings; critics said the spy allegations were a tactical response.",
      },
    ],
  },
  // 7 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'khampepe-commission-scorpions',
    popular_name: 'Khampepe Commission',
    full_name: 'Commission of Inquiry into the Directorate of Special Operations',
    domain: CommissionDomain.CRIMINAL_JUSTICE,
    enabling_legislation: 'Constitution Section 84(2)(f)',
    constitution_section_invoked: 'Section 84(2)(f)',
    reason_summary:
      'To investigate the Directorate of Special Operations (the Scorpions) and recommend whether they should be amalgamated into SAPS or the NPA.',
    plain_english_summary:
      'The Scorpions were a very powerful special police unit that investigated big criminals and corrupt officials. This commission was asked: should the Scorpions keep working separately or be put under the normal police? Many people believe this commission was used to get rid of the Scorpions because they were too close to catching important politicians.',
    chair_name: 'Sisi Khampepe',
    announced_date: '2005-04-01',
    hearings_started: null,
    concluded_date: '2006-01-01',
    report_released_date: '2015-01-01',
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary:
      'Recommended the Scorpions continue independently. The report was suppressed for nine years and only released in 2015. The Scorpions were disbanded in 2008 regardless of the finding.',
    produced_prosecutions: false,
    president_who_established: 'Thabo Mbeki',
    law_links: [],
    person_links: [
      { full_name: 'Sisi Khampepe', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Thabo Mbeki', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
    ],
  },
  // 8 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'ginwala-enquiry-pikoli',
    popular_name: 'Ginwala Enquiry',
    full_name:
      'Enquiry into the Fitness of Advocate Vusumuzi Pikoli to hold the Office of National Director of Public Prosecutions',
    domain: CommissionDomain.CRIMINAL_JUSTICE,
    enabling_legislation: 'NPA Act 32 of 1998 Section 12(6)(a)',
    constitution_section_invoked: 'Section 179',
    reason_summary:
      'To investigate whether NDPP Vusi Pikoli was fit to hold office, after President Mbeki suspended him — allegedly to prevent the arrest of National Police Commissioner Jackie Selebi.',
    plain_english_summary:
      'The head of the national prosecutors, Vusi Pikoli, was suspended. The government said he was not fit to do his job. But many people believed the real reason was that he was about to arrest the head of the police — and powerful people wanted to stop him.',
    chair_name: 'Frene Ginwala',
    announced_date: '2007-10-04',
    hearings_started: null,
    concluded_date: '2008-12-01',
    report_released_date: null,
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary:
      'Found Pikoli fit to hold office. He was nonetheless dismissed by President Motlanthe. Selebi was later convicted of corruption in 2010.',
    produced_prosecutions: false,
    president_who_established: 'Kgalema Motlanthe',
    law_links: [
      {
        law_short_name: 'NPA Act',
        section_number: 'Section 12(6)(a)',
        usage_type: CommissionLawSectionUsage.ENABLING,
      },
    ],
    person_links: [
      { full_name: 'Frene Ginwala', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Kgalema Motlanthe', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
      {
        full_name: 'Vusi Pikoli',
        role: CommissionPersonRole.SUBJECT_OF_INQUIRY,
        summary: 'Subject of the fitness enquiry; found fit but dismissed anyway.',
      },
    ],
  },
  // 9 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'khayelitsha-commission',
    popular_name: 'Khayelitsha Commission',
    full_name:
      'Commission of Inquiry into Allegations of Police Inefficiency in Khayelitsha and a Breakdown in Relations between the Community and the Police',
    domain: CommissionDomain.POLICING,
    enabling_legislation: 'Constitution Section 206(5)',
    constitution_section_invoked: 'Section 206(5)',
    reason_summary:
      'To investigate allegations of police inefficiency in Khayelitsha township and the breakdown in relations between the community and SAPS. Established by Western Cape Premier Helen Zille.',
    plain_english_summary:
      'In Khayelitsha, a large township in Cape Town, residents complained that the police were not protecting them. Criminals were getting away with things. This commission, set up by the Western Cape Premier, investigated why.',
    chair_name: "Kate O'Regan",
    announced_date: '2012-08-01',
    hearings_started: '2012-11-01',
    concluded_date: '2014-08-25',
    report_released_date: '2014-08-25',
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary:
      'Found serious inefficiency in SAPS allocation and detective capacity in Khayelitsha. SAPS initially contested the Premier\'s authority; the Constitutional Court affirmed it in 2014.',
    produced_prosecutions: false,
    president_who_established: null,
    law_links: [
      {
        law_short_name: 'Constitution',
        section_number: 'Section 206(5)',
        usage_type: CommissionLawSectionUsage.ENABLING,
      },
    ],
    person_links: [
      { full_name: "Kate O'Regan", role: CommissionPersonRole.CHAIR, summary: null },
      {
        full_name: 'Helen Zille',
        role: CommissionPersonRole.ESTABLISHED_BY,
        summary: 'Established the commission as Western Cape Premier under s206(5).',
      },
    ],
  },
  // 10 ────────────────────────────────────────────────────────────────────
  {
    slug: 'marikana-commission-farlam',
    popular_name: 'Marikana Commission',
    full_name:
      'Commission of Inquiry into the Events at the Marikana Mine in North West Province on 16 August 2012',
    domain: CommissionDomain.PUBLIC_SAFETY,
    enabling_legislation: 'Constitution Section 84(2)(f)',
    constitution_section_invoked: 'Section 84(2)(f)',
    reason_summary:
      "To investigate the deaths of 34 striking miners at Lonmin's Marikana platinum mine, shot by police on 16 August 2012, as well as 10 further deaths in preceding days.",
    plain_english_summary:
      'On 16 August 2012, police shot and killed 34 miners who were on strike at a platinum mine called Marikana. It was the worst police use of force since apartheid. This commission investigated what happened, who gave the orders, and why so many people died.',
    chair_name: 'Ian Farlam',
    announced_date: '2012-08-23',
    hearings_started: '2012-10-01',
    concluded_date: '2015-06-25',
    report_released_date: '2015-06-25',
    status: CommissionStatus.CONCLUDED,
    official_url: 'https://www.justice.gov.za/commissions/Marikana/Marikana.htm',
    report_url: null,
    cost_rands: '130000000',
    total_hearing_days: 300,
    outcome_summary:
      'Found that the police operation was not properly planned and that some shootings constituted murder. Recommended prosecutions. Criticised then-Minister of Police Nathi Mthethwa and SAPS leadership. No senior officials were prosecuted.',
    produced_prosecutions: false,
    president_who_established: 'Jacob Zuma',
    law_links: [],
    person_links: [
      { full_name: 'Ian Farlam', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Jacob Zuma', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
      {
        full_name: 'Nathi Mthethwa',
        role: CommissionPersonRole.IMPLICATED,
        summary: 'Criticised by the commission for aspects of ministerial oversight leading up to the police operation.',
      },
    ],
  },
  // 11 ────────────────────────────────────────────────────────────────────
  {
    slug: 'seriti-commission-arms-deal',
    popular_name: 'Seriti Commission',
    full_name:
      'Commission of Inquiry into Allegations of Fraud, Corruption, Impropriety or Irregularity in the Strategic Defence Procurement Packages',
    domain: CommissionDomain.CORRUPTION,
    enabling_legislation: 'Constitution Section 84(2)(f)',
    constitution_section_invoked: 'Section 84(2)(f)',
    reason_summary:
      "To investigate fraud, corruption and irregularities in South Africa's multibillion-rand Strategic Defence Procurement Package (the Arms Deal) of the late 1990s, amid allegations of widespread bribery.",
    plain_english_summary:
      'In the late 1990s, South Africa spent billions buying planes, ships and weapons. Many people believed companies paid bribes to government officials to win these contracts. This included allegations against Jacob Zuma himself. The commission investigated — but critics say it was designed to protect the guilty.',
    chair_name: 'Willie Seriti',
    announced_date: '2011-10-24',
    hearings_started: '2012-08-01',
    concluded_date: '2016-04-01',
    report_released_date: '2016-04-20',
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary:
      "Concluded there was no evidence of improper conduct. The report was widely condemned as a whitewash. The North Gauteng High Court later set aside the commission's report in 2019, finding it was not independent and failed to investigate properly.",
    produced_prosecutions: false,
    president_who_established: 'Jacob Zuma',
    law_links: [],
    person_links: [
      { full_name: 'Willie Seriti', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Jacob Zuma', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
      {
        full_name: 'Jacob Zuma',
        role: CommissionPersonRole.IMPLICATED,
        summary: 'Central named figure in the underlying bribery allegations the commission was set up to investigate.',
      },
    ],
  },
  // 12 ────────────────────────────────────────────────────────────────────
  {
    slug: 'fees-commission-heher',
    popular_name: 'Fees Commission',
    full_name:
      'Commission of Inquiry into the Feasibility of Making Higher Education and Training Fee-Free in South Africa',
    domain: CommissionDomain.EDUCATION,
    enabling_legislation: 'Constitution Section 84(2)(f)',
    constitution_section_invoked: 'Section 84(2)(f)',
    reason_summary:
      'To investigate the feasibility of making higher education and training fee-free in South Africa, following the #FeesMustFall protests.',
    plain_english_summary:
      'University students across South Africa were protesting because they could not afford to pay for university. The #FeesMustFall movement was very big and sometimes very violent. The President set up this commission to ask: is free university education possible in South Africa?',
    chair_name: 'John Heher',
    announced_date: '2016-01-14',
    hearings_started: '2016-06-01',
    concluded_date: '2017-08-31',
    report_released_date: '2017-08-31',
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary:
      'Found that fully free higher education was not immediately feasible given fiscal constraints. President Zuma then announced free education for students from households earning under R350,000 per year — going beyond what the commission recommended.',
    produced_prosecutions: false,
    president_who_established: 'Jacob Zuma',
    law_links: [],
    person_links: [
      { full_name: 'John Heher', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Jacob Zuma', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
    ],
  },
  // 13 ────────────────────────────────────────────────────────────────────
  {
    slug: 'zondo-commission-state-capture',
    popular_name: 'Zondo Commission',
    full_name:
      'Judicial Commission of Inquiry into Allegations of State Capture, Corruption and Fraud in the Public Sector including Organs of State',
    domain: CommissionDomain.CORRUPTION,
    enabling_legislation: 'Commissions Act 8 of 1947 Section 1',
    constitution_section_invoked: 'Section 84(2)(f)',
    reason_summary:
      'To investigate the nature and extent of state capture — the systematic corruption of state institutions for private benefit — including the role of the Gupta family network, Jacob Zuma, and senior officials across state-owned enterprises and government.',
    plain_english_summary:
      'For many years, a rich family called the Guptas — who were friends with President Jacob Zuma — were accused of controlling government decisions to make money for themselves. Government contracts, state companies, even cabinet appointments — all allegedly influenced by one family. This commission spent 4 years investigating what happened.',
    chair_name: 'Raymond Zondo',
    announced_date: '2018-02-08',
    hearings_started: '2018-08-20',
    concluded_date: '2022-06-30',
    report_released_date: '2022-06-22',
    status: CommissionStatus.CONCLUDED,
    official_url: 'https://www.statecapture.org.za',
    report_url:
      'https://www.statecapture.org.za/site/files/notice/515/state_capture_report_complete.pdf',
    cost_rands: '1000000000',
    total_hearing_days: 434,
    outcome_summary:
      'Produced a 6-volume, 5,000-page report. Named hundreds of individuals. Recommended prosecution of Jacob Zuma, the Guptas, and many senior officials. Led to the establishment of the Investigating Directorate Against Corruption (IDAC). Limited prosecutions have followed.',
    produced_prosecutions: true,
    president_who_established: 'Cyril Ramaphosa',
    law_links: [
      {
        law_short_name: 'Commissions Act',
        section_number: 'Section 1',
        usage_type: CommissionLawSectionUsage.ENABLING,
      },
    ],
    person_links: [
      { full_name: 'Raymond Zondo', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Cyril Ramaphosa', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
      {
        full_name: 'Cyril Ramaphosa',
        role: CommissionPersonRole.WITNESS,
        summary: 'Testified in his capacity as Deputy President (2014–2018) about what he had observed of state capture.',
      },
      {
        full_name: 'Jacob Zuma',
        role: CommissionPersonRole.WITNESS,
        summary: 'Appeared once, refused to be cross-examined, walked out. Later jailed for contempt of the commission.',
      },
      {
        full_name: 'Jacob Zuma',
        role: CommissionPersonRole.IMPLICATED,
        summary: 'The commission found sustained findings against Zuma across all three volumes dealing with state capture at SOEs.',
      },
      {
        full_name: 'Nomgcobo Jiba',
        role: CommissionPersonRole.IMPLICATED,
        summary: 'Criticised for the NPA\'s handling of state-capture matters during her tenure as Deputy NDPP.',
      },
    ],
  },
  // 14 ────────────────────────────────────────────────────────────────────
  {
    slug: 'nugent-commission-sars',
    popular_name: 'Nugent Commission',
    full_name: 'Commission of Inquiry into Tax Administration and Governance by SARS',
    domain: CommissionDomain.FINANCIAL,
    enabling_legislation: 'Constitution Section 84(2)(f)',
    constitution_section_invoked: 'Section 84(2)(f)',
    reason_summary:
      'To investigate governance failures and alleged misconduct at SARS under Commissioner Tom Moyane, including the dismantling of the High Risk Investigations Unit.',
    plain_english_summary:
      'The South African Revenue Service — the people who collect taxes — was being run badly. Important investigators who caught tax cheats were fired. The person in charge, Tom Moyane, was accused of destroying SARS from the inside. This commission investigated what happened.',
    chair_name: 'Robert Nugent',
    announced_date: '2018-05-23',
    hearings_started: '2018-08-01',
    concluded_date: '2018-12-14',
    report_released_date: '2018-12-14',
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: '15000000',
    total_hearing_days: 45,
    outcome_summary:
      'Found that Moyane had caused serious damage to SARS. Recommended his removal and institutional reforms. Ramaphosa acted on the recommendations. Moyane was fired. SARS began to recover under Edward Kieswetter.',
    produced_prosecutions: false,
    president_who_established: 'Cyril Ramaphosa',
    law_links: [],
    person_links: [
      { full_name: 'Robert Nugent', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Cyril Ramaphosa', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
      {
        full_name: 'Tom Moyane',
        role: CommissionPersonRole.SUBJECT_OF_INQUIRY,
        summary: 'The commission centred on his stewardship of SARS and found him to have caused serious damage.',
      },
    ],
  },
  // 15 ────────────────────────────────────────────────────────────────────
  {
    slug: 'pic-commission-mpati',
    popular_name: 'PIC Commission',
    full_name:
      'Commission of Inquiry into Allegations of Impropriety regarding the Public Investment Corporation',
    domain: CommissionDomain.FINANCIAL,
    enabling_legislation: 'Constitution Section 84(2)(f)',
    constitution_section_invoked: 'Section 84(2)(f)',
    reason_summary:
      'To investigate allegations of impropriety at the Public Investment Corporation under CEO Dan Matjila, involving irregular investments and conflicts of interest affecting R2 trillion in public pension funds.',
    plain_english_summary:
      "The PIC is a huge fund that manages the pension money of government workers — over R2 trillion. Its CEO Dan Matjila was accused of making bad investments and using the fund to benefit people he knew. This commission investigated what happened to ordinary workers' pension money.",
    chair_name: 'Lex Mpati',
    announced_date: '2018-10-17',
    hearings_started: '2019-02-01',
    concluded_date: '2019-11-28',
    report_released_date: '2019-11-28',
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: '50000000',
    total_hearing_days: null,
    outcome_summary:
      'Found Matjila had made improper investments and misused his position. Recommended his removal and structural reforms at the PIC. Matjila resigned before the report was released.',
    produced_prosecutions: false,
    president_who_established: 'Cyril Ramaphosa',
    law_links: [],
    person_links: [
      { full_name: 'Lex Mpati', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Cyril Ramaphosa', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
      {
        full_name: 'Dan Matjila',
        role: CommissionPersonRole.SUBJECT_OF_INQUIRY,
        summary: 'Subject of the inquiry. Found to have made improper investments.',
      },
    ],
  },
  // 16 ────────────────────────────────────────────────────────────────────
  {
    slug: 'mokgoro-commission-npa',
    popular_name: 'Mokgoro Commission',
    full_name:
      'Commission of Enquiry into the Fitness of Advocate Nomgcobo Jiba and Advocate Lawrence Sithembiso Mrwebi to Hold Office',
    domain: CommissionDomain.CRIMINAL_JUSTICE,
    enabling_legislation: 'NPA Act 32 of 1998 Section 12(6)(a)',
    constitution_section_invoked: 'Section 179',
    reason_summary:
      'To investigate whether NPA Deputy NDPP Nomgcobo Jiba and Advocate Lawrence Mrwebi were fit to hold their senior positions, amid allegations of improper case withdrawal and political interference in prosecutions.',
    plain_english_summary:
      'Two senior prosecutors — Nomgcobo Jiba and Lawrence Mrwebi — were accused of dropping important cases against powerful people when they should not have. This commission asked: are these two people fit to keep working as senior prosecutors?',
    chair_name: 'Yvonne Mokgoro',
    announced_date: '2018-11-09',
    hearings_started: '2019-02-11',
    concluded_date: '2019-04-30',
    report_released_date: '2019-04-30',
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary:
      'Found both unfit to hold office. Ramaphosa removed them. Jiba had previously dropped fraud charges against Zuma allies and withdrawn the prosecution of Richard Mdluli.',
    produced_prosecutions: false,
    president_who_established: 'Cyril Ramaphosa',
    law_links: [
      {
        law_short_name: 'NPA Act',
        section_number: 'Section 12(6)(a)',
        usage_type: CommissionLawSectionUsage.ENABLING,
      },
    ],
    person_links: [
      { full_name: 'Yvonne Mokgoro', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Cyril Ramaphosa', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
      {
        full_name: 'Nomgcobo Jiba',
        role: CommissionPersonRole.SUBJECT_OF_INQUIRY,
        summary: 'Subject of the fitness enquiry. Found unfit.',
      },
      {
        full_name: 'Lawrence Mrwebi',
        role: CommissionPersonRole.SUBJECT_OF_INQUIRY,
        summary: 'Subject of the fitness enquiry. Found unfit.',
      },
    ],
  },
  // 17 ────────────────────────────────────────────────────────────────────
  {
    slug: 'cassim-inquiry-nxasana',
    popular_name: 'Cassim Inquiry',
    full_name:
      'Inquiry into the Fitness of Advocate Mxolisi Nxasana to hold the Office of National Director of Public Prosecutions',
    domain: CommissionDomain.CRIMINAL_JUSTICE,
    enabling_legislation: 'NPA Act 32 of 1998 Section 12(6)(a)',
    constitution_section_invoked: 'Section 179',
    reason_summary:
      'To investigate the fitness of NDPP Mxolisi Nxasana to hold office. Nxasana was subsequently paid R17.3 million to leave, which was later declared unlawful by the courts.',
    plain_english_summary:
      'The head of the national prosecutors, Mxolisi Nxasana, was removed from his job. He later said he was paid R17 million to leave. This inquiry was supposed to check if he was fit for the job — but it was widely seen as a way to remove a person who would not do what the President wanted.',
    chair_name: 'Nazeer Ahmed Cassim',
    announced_date: '2015-02-05',
    hearings_started: null,
    concluded_date: '2015-05-01',
    report_released_date: null,
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary:
      'Nxasana "agreed" to vacate office with a golden handshake of R17.3 million. The Constitutional Court later declared the payment invalid and ordered Nxasana to repay it.',
    produced_prosecutions: false,
    president_who_established: 'Jacob Zuma',
    law_links: [
      {
        law_short_name: 'NPA Act',
        section_number: 'Section 12(6)(a)',
        usage_type: CommissionLawSectionUsage.ENABLING,
      },
    ],
    person_links: [
      { full_name: 'Nazeer Ahmed Cassim', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Jacob Zuma', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
      {
        full_name: 'Mxolisi Nxasana',
        role: CommissionPersonRole.SUBJECT_OF_INQUIRY,
        summary: 'Subject of the fitness enquiry. Left with a golden handshake later found to be unlawful.',
      },
    ],
  },
  // 18 ────────────────────────────────────────────────────────────────────
  {
    slug: 'trc-prosecutions-inquiry-2025',
    popular_name: 'TRC Prosecutions Inquiry',
    full_name:
      'Commission of Inquiry into Allegations regarding Efforts or Attempts Having Been Made to Stop Investigation or Prosecution of TRC Cases',
    domain: CommissionDomain.HUMAN_RIGHTS,
    enabling_legislation: 'Constitution Section 84(2)(f)',
    constitution_section_invoked: 'Section 84(2)(f)',
    reason_summary:
      'To investigate allegations that efforts were made to stop the investigation or prosecution of cases that arose from the TRC process — meaning apartheid-era perpetrators who were denied amnesty and should have faced prosecution.',
    plain_english_summary:
      'After apartheid, the TRC gave many people amnesty — but only if they told the full truth. Those who did NOT get amnesty were supposed to be prosecuted. Thirty years later, almost none of them have been. This commission is investigating whether powerful people have been deliberately blocking those prosecutions.',
    chair_name: 'TBA',
    announced_date: '2025-05-29',
    hearings_started: null,
    concluded_date: null,
    report_released_date: null,
    status: CommissionStatus.ACTIVE,
    official_url: 'https://www.justice.gov.za/commissions/',
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary: null,
    produced_prosecutions: null,
    president_who_established: 'Cyril Ramaphosa',
    law_links: [],
    person_links: [
      { full_name: 'Cyril Ramaphosa', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
    ],
  },
  // 19 ────────────────────────────────────────────────────────────────────
  // Madlanga Commission is seeded by mkhwanazi.seed.ts to keep it co-located
  // with the Mkhwanazi story it belongs to. Intentionally NOT listed here.
  // 20 ────────────────────────────────────────────────────────────────────
  {
    slug: 'nel-commission-masterbond',
    popular_name: 'Nel Commission',
    full_name:
      'Commission of Inquiry into the Affairs of the Masterbond Group and Investor Protection in South Africa',
    domain: CommissionDomain.FINANCIAL,
    enabling_legislation: DEFAULT_ENABLING,
    constitution_section_invoked: DEFAULT_CONSTITUTION_SECTION,
    reason_summary:
      'To investigate the collapse of the Masterbond Group and the need for better investor protection in South Africa.',
    plain_english_summary:
      'A company called Masterbond took money from many ordinary South Africans as investments and collapsed, leaving people with nothing. This commission investigated what happened to protect future investors.',
    chair_name: 'H C Nel',
    announced_date: '2001-04-01',
    hearings_started: null,
    concluded_date: null,
    report_released_date: null,
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary: null,
    produced_prosecutions: false,
    president_who_established: 'Thabo Mbeki',
    law_links: [],
    person_links: [
      { full_name: 'H C Nel', role: CommissionPersonRole.CHAIR, summary: null },
      { full_name: 'Thabo Mbeki', role: CommissionPersonRole.ESTABLISHED_BY, summary: null },
    ],
  },
  // 21 ────────────────────────────────────────────────────────────────────
  {
    slug: 'human-rights-farming-inquiry',
    popular_name: 'Human Rights Farming Inquiry',
    full_name:
      'Inquiry into Incidence of Human Rights Violations within Farming Communities and Structures to Address the Problem',
    domain: CommissionDomain.HUMAN_RIGHTS,
    enabling_legislation: 'Human Rights Commission Act 54 of 1994 Section 9(6)',
    constitution_section_invoked: 'Chapter 9 — SAHRC',
    reason_summary:
      'To investigate human rights violations within farming communities, including evictions, labour abuse, violence and inadequate access to services for farm workers.',
    plain_english_summary:
      'Farm workers in South Africa — especially black farm workers — were being treated very badly. They had very few rights. This inquiry investigated violence, evictions, and abuse on South African farms.',
    chair_name: 'Jody Kollapen',
    announced_date: '2001-06-11',
    hearings_started: null,
    concluded_date: null,
    report_released_date: null,
    status: CommissionStatus.CONCLUDED,
    official_url: null,
    report_url: null,
    cost_rands: null,
    total_hearing_days: null,
    outcome_summary: null,
    produced_prosecutions: false,
    president_who_established: null,
    law_links: [
      {
        law_short_name: 'HR Commission Act',
        section_number: 'Section 9(6)',
        usage_type: CommissionLawSectionUsage.ENABLING,
      },
    ],
    person_links: [
      {
        full_name: 'Jody Kollapen',
        role: CommissionPersonRole.CHAIR,
        summary: 'Chaired the inquiry in his then capacity at the South African Human Rights Commission.',
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// Upsert helpers
// ───────────────────────────────────────────────────────────────────────────────

async function upsertLaws(m: EntityManager): Promise<Map<string, LawSection>> {
  const lawRepo = m.getRepository(Law);
  const sectionRepo = m.getRepository(LawSection);
  const sections = new Map<string, LawSection>();

  for (const seed of LAWS_SEED) {
    let law = await lawRepo.findOne({ where: { short_name: seed.short_name } });
    const lawPayload = {
      name: seed.name,
      short_name: seed.short_name,
      act_number: seed.act_number,
      category: seed.category,
      plain_english: seed.plain_english,
      full_text_url: seed.full_text_url,
    };
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

  console.log(`  · People: ${byName.size}`);
  return byName;
}

async function upsertCommissions(
  m: EntityManager,
): Promise<Map<string, Commission>> {
  const repo = m.getRepository(Commission);
  const bySlug = new Map<string, Commission>();

  for (const seed of COMMISSIONS_SEED) {
    const payload = {
      slug: seed.slug,
      popular_name: seed.popular_name,
      full_name: seed.full_name,
      domain: seed.domain,
      enabling_legislation: seed.enabling_legislation,
      constitution_section_invoked: seed.constitution_section_invoked,
      reason_summary: seed.reason_summary,
      plain_english_summary: seed.plain_english_summary,
      chair_name: seed.chair_name,
      announced_date: seed.announced_date,
      hearings_started: seed.hearings_started,
      concluded_date: seed.concluded_date,
      report_released_date: seed.report_released_date,
      status: seed.status,
      official_url: seed.official_url,
      report_url: seed.report_url,
      cost_rands: seed.cost_rands,
      total_hearing_days: seed.total_hearing_days,
      outcome_summary: seed.outcome_summary,
      produced_prosecutions: seed.produced_prosecutions,
      president_who_established: seed.president_who_established,
    };

    let commission = await repo.findOne({ where: { slug: seed.slug } });
    if (!commission) {
      commission = repo.create(payload);
      commission = await repo.save(commission);
    } else {
      Object.assign(commission, payload);
      commission = await repo.save(commission);
    }
    bySlug.set(seed.slug, commission);
  }

  console.log(`  · Commissions: ${bySlug.size}`);
  return bySlug;
}

async function linkCommissionLawSections(
  m: EntityManager,
  commissions: Map<string, Commission>,
  lawSections: Map<string, LawSection>,
): Promise<void> {
  const repo = m.getRepository(CommissionLawSection);
  let count = 0;

  for (const seed of COMMISSIONS_SEED) {
    const commission = commissions.get(seed.slug);
    if (!commission) continue;

    for (const link of seed.law_links) {
      const key = `${link.law_short_name}::${link.section_number}`;
      const section = lawSections.get(key);
      if (!section) {
        throw new Error(
          `linkCommissionLawSections: law section "${key}" missing when linking commission "${seed.slug}" — ` +
            `add it to LAWS_SEED first.`,
        );
      }

      const payload = {
        commission_id: commission.id,
        law_section_id: section.id,
        usage_type: link.usage_type,
      };

      let existing = await repo.findOne({
        where: {
          commission_id: commission.id,
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

  console.log(`  · Commission → law section links: ${count}`);
}

async function linkCommissionPeople(
  m: EntityManager,
  commissions: Map<string, Commission>,
  people: Map<string, Person>,
): Promise<void> {
  const repo = m.getRepository(CommissionPerson);
  let count = 0;

  for (const seed of COMMISSIONS_SEED) {
    const commission = commissions.get(seed.slug);
    if (!commission) continue;

    for (const link of seed.person_links) {
      const person = people.get(link.full_name);
      if (!person) {
        throw new Error(
          `linkCommissionPeople: person "${link.full_name}" missing when linking commission "${seed.slug}" — ` +
            `add them to PEOPLE_SEED first.`,
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
  }

  console.log(`  · Commission → person links: ${count}`);
}

// ───────────────────────────────────────────────────────────────────────────────
// Entry point
// ───────────────────────────────────────────────────────────────────────────────

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized
    ? AppDataSource
    : await AppDataSource.initialize();

  console.log('\n── Seeding: commissions master ──');

  try {
    await dataSource.transaction(async (m) => {
      const lawSections = await upsertLaws(m);
      const people = await upsertPeople(m);
      const commissions = await upsertCommissions(m);
      await linkCommissionLawSections(m, commissions, lawSections);
      await linkCommissionPeople(m, commissions, people);
    });

    console.log('─────────────────────────────────');
    console.log('✓ Commissions master seed complete.\n');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  run().catch((err: unknown) => {
    console.error('\n✗ Commissions master seed failed:', err);
    process.exit(1);
  });
}
