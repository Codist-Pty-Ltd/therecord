/* eslint-disable no-console */

/**
 * South African history layer — eras, events, historical laws, statistics.
 * Idempotent upserts. Requires: migrations (historical_* tables), commissions-master
 * (TRC, TRC Prosecutions), and people (Nelson Mandela).
 *
 * Run after impact-sectors, before state-entities, or standalone:
 *   npm run seed:sa-history   (after nest build — uses dist)
 *   ts-node src/database/seeds/sa-history.seed.ts
 */

import 'reflect-metadata';

import type { EntityManager } from 'typeorm';

import { Commission } from '../../entities/commission.entity';
import {
  HistoricalEra,
} from '../../entities/historical-era.entity';
import {
  HistoricalEvent,
  HistoricalEventSignificance,
  HistoricalEventType,
} from '../../entities/historical-event.entity';
import {
  HistoricalLaw,
  HistoricalLawCategory,
  HistoricalLawStatus,
} from '../../entities/historical-law.entity';
import {
  HistoricalStatistic,
  HistoricalStatType,
} from '../../entities/historical-statistic.entity';
import { Person } from '../../entities/person.entity';
import { AppDataSource } from '../data-source';

const TRC_SLUG = 'truth-reconciliation-commission-trc';

type EraSeed = Omit<HistoricalEra, 'id' | 'created_at'>;

const ERAS: EraSeed[] = [
  {
    slug: 'pre-colonial',
    name: 'Pre-Colonial South Africa',
    period: '200,000 BCE – 1652 CE',
    order_index: 1,
    icon: '🏔️',
    key_theme: 'Land, sovereignty, and communal life before European contact',
    summary:
      'For hundreds of thousands of years before European arrival, southern Africa was home to diverse, sophisticated peoples with their own systems of governance, land use, trade, and law. The San were among the oldest continuous human populations on Earth. The Khoikhoi were skilled pastoralists. Bantu-speaking kingdoms traded across the Indian Ocean world. The Kingdom of Mapungubwe traded with Arabia, India, and China from approximately 900 to 1300 CE. None of these societies recognised individual land ownership as Europeans understood it — land was communally held, managed through kinship and chieftaincy. This fundamental difference would be exploited systematically during colonisation.',
    plain_english_child:
      'Long before anyone came from Europe, South Africa was home to many different peoples. The San people were hunters and gatherers who knew every plant and animal in the land. The Khoikhoi herded cattle. The Zulu, Xhosa, and Sotho people farmed and built kingdoms. They had their own rules, their own leaders, and their own ways of sharing the land. The land belonged to everyone in the community — not to one person.',
    plain_english_layperson:
      'Before 1652, southern Africa had been continuously inhabited for at least 200,000 years. The San (hunter-gatherers) and Khoikhoi (pastoralists) were the original inhabitants. From the 3rd century CE onwards, Bantu-speaking agricultural communities migrated south. By the time Europeans arrived, kingdoms like Mapungubwe, Zulu, Sotho, and Xhosa had sophisticated political and economic systems. Land was communally held — not sold or owned individually. This is the world that colonisation destroyed.',
    plain_english_legal:
      'Pre-colonial societies operated under customary law — unwritten but binding frameworks for land use, inheritance, dispute resolution, and governance through hereditary authority. Customary law recognised communal land rights rather than individual freehold. Roman-Dutch and English property law introduced through colonisation conflicted with those systems; the 1996 Constitution partially addresses this through recognition of customary law and land reform (Sections 211 and 25).',
  },
  {
    slug: 'colonial',
    name: 'Colonial South Africa',
    period: '1652 – 1910',
    order_index: 2,
    icon: '⛵',
    key_theme: 'Dispossession, slavery, and the building of racial hierarchy',
    summary:
      "The Dutch East India Company (VOC) established a refreshment station at the Cape in 1652. What was intended as a waystation became a colony. The VOC imported approximately 36,000 enslaved people from Angola, Mozambique, Madagascar, and Southeast Asia. The Khoikhoi were dispossessed of their land and reduced to near-serfdom. The San were systematically hunted. Britain seized the Cape in 1806. Britain abolished slavery in 1834 — slave owners received compensation; the enslaved did not. The discovery of diamonds (1867) and gold (1886) transformed South Africa into one of the world's most economically significant territories, triggering wars between Britain and the Boer republics. The Union of South Africa was formed in 1910 — a political settlement that deliberately excluded the majority of the population.",
    plain_english_child:
      'In 1652, a Dutch company sent Jan van Riebeeck to set up a stop for their ships at the Cape. More and more settlers came. They brought enslaved people from other parts of Africa and Asia to do the work. They took land from the Khoikhoi and San people who already lived there. When gold and diamonds were found, Britain and the Boers fought wars over who would control all that wealth. In 1910, they agreed to share — but only white people were included in that agreement.',
    plain_english_layperson:
      "From 1652 to 1910, South Africa was transformed from a region of independent kingdoms into a European colony. The VOC enslaved tens of thousands of people. The Khoikhoi lost their lands and independence. The San were systematically killed or driven into the Kalahari. The discovery of gold and diamonds made South Africa the world's most valuable colonial territory — and its wealth was built on the labour of black people who shared almost none of it. The 1910 Union of South Africa was a political deal between white British and white Boers from which black, coloured, and Indian South Africans were excluded.",
    plain_english_legal:
      'British Crown rule layered English public law onto Cape Roman-Dutch law; slavery abolition (1834) reshaped labour relations. The South Africa Act 1909 entrenched white parliamentary sovereignty at Union — an order later displaced by universal suffrage and the 1996 Constitution.',
  },
  {
    slug: 'union-and-segregation',
    name: 'Union and Segregation',
    period: '1910 – 1948',
    order_index: 3,
    icon: '⛓️',
    key_theme: 'Legal foundations of racial exclusion before apartheid was named',
    summary:
      'After Union (1910), white MPs constructed segregation by statute: the colour bar in mining, influx control, and above all the Natives Land Act 1913, which confined black land rights to a small fraction of the country. The Cape\'s qualified franchise for some black and coloured men was erased by the Representation of Natives Act 1936. By 1948 the statutes of "separate development" were largely in place before the National Party baptised the system "apartheid".',
    plain_english_child:
      "After 1910, the government passed laws that pushed black people off fertile land and controlled where they could live and work. The worst early law was the Land Act of 1913. Later, even the few black voters in the Cape lost the vote. Apartheid wasn't the start of separation — it was the continuation of laws that were already there.",
    plain_english_layperson:
      'Between 1910 and 1948, Parliament built segregation into law: land capped in "reserves", movement to cities regulated, and political rights stripped away. The 1913 Land Act is the landmark; the 1936 Act removed black voters from the common roll in the Cape. When Malan won in 1948 he inherited this architecture — and then made it total.',
    plain_english_legal:
      'Segregation statutes interacted with Crown sovereignty and parliamentary supremacy; they survived until the interim and final Constitutions ended racial franchise and mandated equality before the law. Many harms these Acts caused are now measured against Section 9 (equality), Section 25 (property and land reform), and related Bill of Rights provisions.',
  },
  {
    slug: 'apartheid',
    name: 'The Apartheid Era',
    period: '1948 – 1994',
    order_index: 4,
    icon: '🔒',
    key_theme: 'A total legal system of racial control — and the resistance that ended it',
    summary:
      'From 1948, the National Party legislated apartheid ("separateness"): racial classification, forced removals, Bantu Education, pass laws, homelands citizenship, and sweeping security powers. Sharpeville (1960), Rivonia (1963–64), Soweto (1976), Steve Biko\'s death (1977), and mass mobilisation in the 1980s were met with States of Emergency. F.W. de Klerk\'s 1990 speech unbanned organisations and set in train the release of Nelson Mandela. The first democratic election followed on 27 April 1994.',
    plain_english_child:
      'From 1948 the government tried to control almost everything about people\'s lives based on race: where you lived, which school you went to, who you could marry, and what jobs you could have. People resisted. Many were murdered, jailed, or banished. In 1994, everyone could vote for the first time.',
    plain_english_layperson:
      'Apartheid was a 46-year project of racial law backed by violence. It classified people by race, bulldozed mixed neighbourhoods, under-funded black schools on purpose, stripped citizenship through homelands, and detained opponents without trial. Resistance inside the country and pressure from outside helped end it; the transition passed through unbanning in 1990 to the 1994 election.',
    plain_english_legal:
      'Apartheid legislation systematically violated the later guarantees in the 1996 Constitution — equality (Section 9), dignity (Section 10), freedom of movement (Section 21), political rights (Section 19), property (Section 25), housing (Section 26), healthcare and water (Section 27), education (Section 29), language and culture (Section 30–31), and fair trial rights (Section 35).',
  },
  {
    slug: 'post-apartheid',
    name: 'Post-Apartheid South Africa',
    period: '1994 – Present',
    order_index: 5,
    icon: '🌅',
    key_theme: 'Political freedom achieved. Economic equality: the unfinished work.',
    summary:
      'The 1996 Constitution, TRC process (1996–1998), and electoral democracy ended formal apartheid. Major gaps remain in wealth, land, unemployment, and poverty. Independent statistics and research — Stats SA, World Inequality Database, inequality studies at Wits — document both progress and persistent stratification along lines shaped by colonialism and apartheid.',
    plain_english_child:
      'Today everyone can vote and the Constitution promises rights like housing, water, and education. But many families are still very poor, many adults cannot find work, and land reform has been slow. Fixing this takes a long time — and honest facts help everyone see what still needs to change.',
    plain_english_layperson:
      'Since 1994 South Africa has political freedom and a progressive Bill of Rights. Income inequality between racial groups has narrowed but remains extreme; wealth is even more concentrated; expanded unemployment and poverty figures remain crises. The Record tracks accountability partly because economic justice is unfinished business under the same Constitution that ended white minority rule.',
    plain_english_legal:
      'The supreme law is the 1996 Constitution. The state must progressively realise socio-economic rights within available resources while independent Chapter 9 institutions and commissions of inquiry scrutinise abuse of power. Historical wrongs inform interpretive duties (e.g. Section 39(3)) and land-restitution frameworks under Section 25.',
  },
];

type LawSeed = {
  era_slug: string;
  slug: string;
  year_enacted: number;
  year_repealed: number | null;
  name: string;
  full_name: string | null;
  act_number: string | null;
  category: HistoricalLawCategory;
  status: HistoricalLawStatus;
  replaced_by: string | null;
  what_it_did: string;
  plain_english_child: string;
  plain_english_layperson: string;
  impact_summary: string;
  constitutional_violation: string | null;
  is_foundational: boolean;
};

const LAWS: LawSeed[] = [
  {
    era_slug: 'union-and-segregation',
    slug: 'natives-land-act-1913',
    year_enacted: 1913,
    year_repealed: 1991,
    name: 'Natives Land Act',
    full_name: 'Natives Land Act 27 of 1913',
    act_number: '27 of 1913',
    category: HistoricalLawCategory.LAND,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: 'Abolition of Racially Based Land Measures Act 1991',
    what_it_did:
      'Restricted black land ownership to roughly 7.3% of South Africa (expanded to about 13% in 1936). Black people could not buy, lease, or occupy land outside designated "reserves" even when families had farmed there for generations. Sharecroppers and labour tenants were displaced.',
    plain_english_child:
      'This law said most black people could only use a tiny piece of South Africa\'s land. Families who had lived somewhere for generations were suddenly told to leave.',
    plain_english_layperson:
      'The 1913 Land Act locked the majority population into a fraction of the land mass, destroying independent African farming and accelerating labour migration — effects that still structure inequality.',
    impact_summary:
      'Immediately displaced hundreds of thousands of sharecroppers and tenants; blocked intergenerational wealth through land for decades.',
    constitutional_violation: 'Would violate equality (Section 9) and property/land reform framing (Section 25).',
    is_foundational: true,
  },
  {
    era_slug: 'union-and-segregation',
    slug: 'mines-and-works-act-1911',
    year_enacted: 1911,
    year_repealed: null,
    name: 'Mines and Works Act (Colour Bar)',
    full_name: 'Mines and Works Act 12 of 1911',
    act_number: '12 of 1911',
    category: HistoricalLawCategory.LABOUR,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: null,
    what_it_did:
      'Reserved skilled mining jobs and certain certificates (e.g. blasting) for white workers, entrenched a racial wage hierarchy on the mines.',
    plain_english_child:
      'The law said many important jobs in the mines were only for white workers, even when black miners did the hardest work.',
    plain_english_layperson:
      'Created a legal "colour bar" in mining that capped black wages and blocked promotion into skilled work — foundational to migrant labour exploitation.',
    impact_summary:
      'Compressed black miners\' bargaining power for much of the 20th century; contributed to extreme underground racial wage gaps.',
    constitutional_violation: 'Would violate equality (Section 9) and fair labour relations (Section 23).',
    is_foundational: false,
  },
  {
    era_slug: 'union-and-segregation',
    slug: 'natives-urban-areas-act-1923',
    year_enacted: 1923,
    year_repealed: null,
    name: 'Natives (Urban Areas) Act',
    full_name: 'Natives (Urban Areas) Act 21 of 1923',
    act_number: '21 of 1923',
    category: HistoricalLawCategory.MOVEMENT,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: null,
    what_it_did:
      'Controlled African movement into towns, regulated informal settlement, and anchored the municipal geography of segregated housing.',
    plain_english_child:
      'The government decided when black people could enter cities and where they could live.',
    plain_english_layperson:
      'Criminalised presence in "white" cities without permits — a legislative ancestor of apartheid influx control.',
    impact_summary:
      'Fused segregation with urban planning; legitimised township systems and labour circulation.',
    constitutional_violation: 'Would violate freedom of movement (Section 21) and equality (Section 9).',
    is_foundational: false,
  },
  {
    era_slug: 'apartheid',
    slug: 'prohibition-of-mixed-marriages-act-1949',
    year_enacted: 1949,
    year_repealed: 1985,
    name: 'Prohibition of Mixed Marriages Act',
    full_name: 'Prohibition of Mixed Marriages Act 55 of 1949',
    act_number: '55 of 1949',
    category: HistoricalLawCategory.CLASSIFICATION,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: null,
    what_it_did:
      'Criminalised marriages between "white" and "non-white" persons — a core pillar of apartheid biopolitics.',
    plain_english_child:
      'Two adults who loved each other could be stopped from marrying because of race labels.',
    plain_english_layperson:
      'Police and courts policed intimacy across the colour line until repeal in the mid-1980s.',
    impact_summary:
      'Destroyed families and entrenched racial boundaries in private life.',
    constitutional_violation: 'Would violate equality (Section 9) and dignity (Section 10).',
    is_foundational: false,
  },
  {
    era_slug: 'apartheid',
    slug: 'population-registration-act-1950',
    year_enacted: 1950,
    year_repealed: 1991,
    name: 'Population Registration Act',
    full_name: 'Population Registration Act 30 of 1950',
    act_number: '30 of 1950',
    category: HistoricalLawCategory.CLASSIFICATION,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: null,
    what_it_did:
      'Classified every South African by "race" (Native/Black, Coloured, White; Asian/Indian added). IDs carried the classification, governing residence, schools, marriage, amenities, and economic life.',
    plain_english_child:
      'Everyone got a race label on paper that decided almost everything in daily life.',
    plain_english_layperson:
      'The bureaucratic spine of apartheid — racial classification on documents, with reclassification hearings that could split families.',
    impact_summary:
      'Encoded apartheid in identity documents; enabled forced removals and unequal services at scale.',
    constitutional_violation: 'Would violate equality (Section 9) and dignity (Section 10).',
    is_foundational: true,
  },
  {
    era_slug: 'apartheid',
    slug: 'group-areas-act-1950',
    year_enacted: 1950,
    year_repealed: 1991,
    name: 'Group Areas Act',
    full_name: 'Group Areas Act 41 of 1950',
    act_number: '41 of 1950',
    category: HistoricalLawCategory.HOUSING,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: null,
    what_it_did:
      'Zoned urban SA by race; bulldozed District Six, Sophiatown, Cato Manor, and many other communities.',
    plain_english_child:
      'The government could kick you out of your home if your race did not match the new map.',
    plain_english_layperson:
      'Turned cities into apartheid diagrams — destruction of mixed neighbourhoods and forced relocations to distant townships.',
    impact_summary:
      'Uprooted hundreds of thousands; destroyed generational community wealth and access to urban jobs.',
    constitutional_violation: 'Would violate housing (Section 26), equality (Section 9), and dignity (Section 10).',
    is_foundational: true,
  },
  {
    era_slug: 'apartheid',
    slug: 'suppression-of-communism-act-1950',
    year_enacted: 1950,
    year_repealed: null,
    name: 'Suppression of Communism Act',
    full_name: 'Suppression of Communism Act 44 of 1950',
    act_number: '44 of 1950',
    category: HistoricalLawCategory.POLITICAL,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: null,
    what_it_did:
      'Defined "communism" so broadly it could capture many opponents of apartheid; enabled banning orders and removals from public life.',
    plain_english_child:
      'The government could label peaceful critics as "communists" and silence them.',
    plain_english_layperson:
      'A battering ram against dissent — used to ban leaders and organisations before outright party bans in 1960.',
    impact_summary:
      'Chilled speech and assembly; precursor to long-term banning and detention without trial politics.',
    constitutional_violation: 'Would violate freedom of expression (Section 16) and political rights (Section 19).',
    is_foundational: false,
  },
  {
    era_slug: 'apartheid',
    slug: 'bantu-authorities-act-1951',
    year_enacted: 1951,
    year_repealed: null,
    name: 'Bantu Authorities Act',
    full_name: 'Bantu Authorities Act 68 of 1951',
    act_number: '68 of 1951',
    category: HistoricalLawCategory.POLITICAL,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: null,
    what_it_did:
      'Reconstructed rural governance to bolster "tribal" authorities aligned with Pretoria — underpinning later homelands policy.',
    plain_english_child:
      'Leaders in the countryside were reshaped to suit Pretoria\'s plans.',
    plain_english_layperson:
      'Centralised native administration and set up local authorities that would administer forced betterment and removals.',
    impact_summary:
      'Deepened authoritarian rural structures ahead of homeland independence charades.',
    constitutional_violation: 'Would violate political participation (Section 19) and equality (Section 9).',
    is_foundational: false,
  },
  {
    era_slug: 'apartheid',
    slug: 'natives-abolition-of-passes-act-1952',
    year_enacted: 1952,
    year_repealed: 1986,
    name: 'Natives (Abolition of Passes) Act',
    full_name: 'Natives (Reference Books) Act 67 of 1952',
    act_number: '67 of 1952',
    category: HistoricalLawCategory.MOVEMENT,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: null,
    what_it_did:
      'Despite its title, consolidated the pass/reference book system compelling African adults to carry documents to be lawfully present in urban areas.',
    plain_english_child:
      'Adults had to carry a passbook or risk arrest — even though the law\'s name sounded like passes were ending.',
    plain_english_layperson:
      'Police enforcement of pass laws structured daily humiliation and labour circulation.',
    impact_summary:
      'Criminalised African mobility; fed overcrowding in cells and structural dependence on migrant wages.',
    constitutional_violation: 'Would violate freedom of movement (Section 21) and equality (Section 9).',
    is_foundational: false,
  },
  {
    era_slug: 'apartheid',
    slug: 'bantu-education-act-1953',
    year_enacted: 1953,
    year_repealed: null,
    name: 'Bantu Education Act',
    full_name: 'Bantu Education Act 47 of 1953',
    act_number: '47 of 1953',
    category: HistoricalLawCategory.EDUCATION,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: null,
    what_it_did:
      'Transferred black schooling under central control with inferior funding and curriculum geared to unskilled labour. Minister Verwoerd\'s 1953 speech stated black education should fit "certain forms of labour".',
    plain_english_child:
      'Black children got worse schools on purpose — fewer books, worse buildings, crowded classes.',
    plain_english_layperson:
      'Codified unequal education; per-pupil spending gaps versus white schools were vast at apartheid\'s height.',
    impact_summary:
      'Still shapes skills, earnings, and intergenerational mobility today.',
    constitutional_violation: 'Would violate equality (Section 9) and basic/higher education rights (Section 29).',
    is_foundational: true,
  },
  {
    era_slug: 'apartheid',
    slug: 'reservation-of-separate-amenities-act-1953',
    year_enacted: 1953,
    year_repealed: 1990,
    name: 'Reservation of Separate Amenities Act',
    full_name: 'Reservation of Separate Amenities Act 49 of 1953',
    act_number: '49 of 1953',
    category: HistoricalLawCategory.AMENITIES,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: null,
    what_it_did:
      'Mandated racially separate public amenities; unequal by design across beaches, baths, transport, healthcare, and civic space.',
    plain_english_child:
      'Signs told you which bench, beach, or bathroom you could use — based on race.',
    plain_english_layperson:
      'The petty apartheid of daily humiliation — "whites only" enforced by law.',
    impact_summary:
      'Normalised degradation and signalled second-class citizenship at every turn.',
    constitutional_violation: 'Would violate equality (Section 9) and dignity (Section 10).',
    is_foundational: false,
  },
  {
    era_slug: 'apartheid',
    slug: 'terrorism-act-1967',
    year_enacted: 1967,
    year_repealed: null,
    name: 'Terrorism Act',
    full_name: 'Terrorism Act 83 of 1967',
    act_number: '83 of 1967',
    category: HistoricalLawCategory.SECURITY,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: null,
    what_it_did:
      'Enabled lengthy detention and broad "terrorism" definitions weaponised against anti-apartheid activity.',
    plain_english_child:
      'People could be locked up for a long time with almost no trial protections.',
    plain_english_layperson:
      'Part of the security architecture that stuffed prisons and made torture in detention a systemic risk.',
    impact_summary:
      'Expanded arbitrary detention; chilled open opposition.',
    constitutional_violation: 'Would violate fair trial rights (Section 35) and freedom and security (Section 12).',
    is_foundational: false,
  },
  {
    era_slug: 'apartheid',
    slug: 'bantu-homelands-citizenship-act-1970',
    year_enacted: 1970,
    year_repealed: null,
    name: 'Bantu Homelands Citizenship Act',
    full_name: 'Bantu Homelands Citizenship Act 26 of 1970',
    act_number: '26 of 1970',
    category: HistoricalLawCategory.POLITICAL,
    status: HistoricalLawStatus.REPEALED,
    replaced_by: null,
    what_it_did:
      'Stripped black South Africans of citizenship, assigning them to notional "homeland" citizenship regardless of actual residence.',
    plain_english_child:
      'The government tried to say many black South Africans were not citizens of their own country.',
    plain_english_layperson:
      'Cynical precursor to "independent" homelands — a legal fiction recognised internationally only by Pretoria.',
    impact_summary:
      'Facilitated denial of political rights and justified exclusion from national bargaining.',
    constitutional_violation: 'Would violate citizenship (Section 20) and equality (Section 9).',
    is_foundational: true,
  },
];

type EventSeed = {
  era_slug: string;
  year: number;
  year_display: string | null;
  event_type: HistoricalEventType;
  title: string;
  description: string;
  plain_english_child: string;
  significance: HistoricalEventSignificance;
  source_attribution: string | null;
  related_historical_law_slug?: string;
  commission_slug?: string;
  person_full_name?: string;
};

const EVENTS: EventSeed[] = [
  {
    era_slug: 'pre-colonial',
    year: -200000,
    year_display: '200,000 BCE',
    event_type: HistoricalEventType.FOUNDING,
    title: 'First human inhabitants of southern Africa',
    description:
      'The San people — among the oldest continuous human populations on Earth — inhabit southern Africa. Archaeological evidence confirms human presence in the region dating back approximately 200,000 years.',
    plain_english_child:
      'The first people in South Africa were the San (also called Bushmen). They lived here for a very, very long time — among the longest human stories science can trace in one place.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution:
      'Archaeological and genetic research — South African History Online; UCT archaeology literature',
  },
  {
    era_slug: 'pre-colonial',
    year: 300,
    year_display: 'c. 300 CE',
    event_type: HistoricalEventType.FOUNDING,
    title: 'Bantu-speaking peoples migrate southward into southern Africa',
    description:
      "Agricultural communities speaking Bantu languages — ancestors of today's Zulu, Xhosa, Sotho, Tswana, Venda, and Ndebele peoples — migrate from central and west Africa. They bring iron-working, agriculture, and cattle herding. They establish settled village communities alongside the existing Khoisan populations.",
    plain_english_child:
      'Many peoples moved south over centuries. They farmed, forged iron tools, and built villages beside the older San and Khoikhoi communities.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution: 'South African History Online; Britannica',
  },
  {
    era_slug: 'pre-colonial',
    year: 900,
    year_display: 'c. 900 CE',
    event_type: HistoricalEventType.FOUNDING,
    title: 'Kingdom of Mapungubwe established — first complex kingdom in South Africa',
    description:
      'The Kingdom of Mapungubwe is established at the confluence of the Limpopo and Shashe rivers (present-day Limpopo province). Archaeological evidence confirms it was a class-stratified society with a ruling elite buried separately on a hilltop. It traded gold and ivory with Arabia, India, and China — confirmed by glass beads and other artefacts recovered from the site. It collapsed around 1300 CE due to climate change.',
    plain_english_child:
      'Hundreds of years before Europeans arrived, Mapungubwe traded gold as far as Asia — a real kingdom with rulers and artisans.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution:
      'South African History Online; UP Mapungubwe Institute; archaeological site record',
  },
  {
    era_slug: 'pre-colonial',
    year: 1488,
    year_display: '1488',
    event_type: HistoricalEventType.FOUNDING,
    title: 'Bartolomeu Dias — first European to reach the southern tip of Africa',
    description:
      'Portuguese explorer Bartolomeu Dias rounds the Cape of Good Hope — the southernmost tip of Africa — naming it Cabo das Tormentas (Cape of Storms). This is the first confirmed European contact with what is now South Africa.',
    plain_english_child:
      'In 1488 a Portuguese sailor rounded the Cape while searching for a sea route to India.',
    significance: HistoricalEventSignificance.HIGH,
    source_attribution: 'Britannica; Portuguese navigational record',
  },
  {
    era_slug: 'colonial',
    year: 1652,
    year_display: '6 April 1652',
    event_type: HistoricalEventType.FOUNDING,
    title: 'Jan van Riebeeck establishes VOC station at the Cape',
    description:
      'The Dutch East India Company (VOC) establishes a refreshment station at the Cape of Good Hope under Jan van Riebeeck. This is considered the founding moment of the European settlement of South Africa. It was not initially intended as a colony — only as a supply point for VOC ships. It became a colony as settlers spread outward.',
    plain_english_child:
      'In 1652 the Dutch set up a garden and supply station for ships. It grew into something much bigger.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution: 'South African History Online; Britannica',
  },
  {
    era_slug: 'colonial',
    year: 1658,
    year_display: '1658',
    event_type: HistoricalEventType.DISPOSSESSION,
    title: 'VOC begins importing enslaved people to the Cape',
    description:
      'The VOC imports enslaved people from Angola, Mozambique, Madagascar, and Southeast Asia to provide labour for the expanding Cape Colony. By 1700, there were more enslaved people than free settlers at the Cape. Conditions were brutal. By 1834 when Britain abolished slavery, approximately 36,000 enslaved people were freed in the Cape Colony.',
    plain_english_child:
      'Colonial bosses brought enslaved workers from many places — tens of thousands suffered bondage at the Cape.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution: 'South African History Online; Cape slavery historical record',
  },
  {
    era_slug: 'colonial',
    year: 1713,
    year_display: '1713',
    event_type: HistoricalEventType.DISPOSSESSION,
    title: 'Smallpox epidemic devastates the Khoikhoi',
    description:
      'A smallpox epidemic brought by European ships kills an estimated 90% of the Khoikhoi at the Cape. Combined with dispossession of grazing lands and the enserfment of survivors on settler farms, this effectively destroys Khoikhoi society as an organised independent force.',
    plain_english_child:
      'A disease brought by ships killed most Khoikhoi people at the Cape; survivors often lost land and independence.',
    significance: HistoricalEventSignificance.CRITICAL,
    source_attribution: 'South African History Online; Britannica',
  },
  {
    era_slug: 'colonial',
    year: 1806,
    year_display: '1806',
    event_type: HistoricalEventType.FOUNDING,
    title: 'Britain permanently seizes the Cape Colony',
    description:
      'Following the Napoleonic Wars, Britain permanently occupies the Cape Colony. British rule introduces English law, new settlers (the 1820 Settlers), and ultimately the abolition of slavery. Britain also expands eastward, coming into conflict with Xhosa kingdoms in the Eastern Cape.',
    plain_english_child:
      'Britain took control from the Dutch after European wars; new laws and settlers followed.',
    significance: HistoricalEventSignificance.HIGH,
    source_attribution: 'Britannica; South African History Online',
  },
  {
    era_slug: 'colonial',
    year: 1834,
    year_display: '1 December 1834',
    event_type: HistoricalEventType.LIBERATION,
    title: 'Britain abolishes slavery in the Cape Colony',
    description:
      'The Slavery Abolition Act 1833 comes into force throughout the British Empire, including the Cape Colony. Approximately 36,000 enslaved people in the Cape are freed. Slave owners receive financial compensation from the British government; the formerly enslaved receive nothing. Many remain on settler farms as poorly paid labourers. The abolition contributes to the Great Trek.',
    plain_english_child:
      'Slavery ended on paper — but owners got money, and freed people did not get land or fair pay.',
    significance: HistoricalEventSignificance.CRITICAL,
    source_attribution: 'British parliamentary record; South African History Online',
  },
  {
    era_slug: 'colonial',
    year: 1835,
    year_display: '1835',
    event_type: HistoricalEventType.DISPOSSESSION,
    title: 'The Great Trek begins — Boers move north and east',
    description:
      'Dutch-speaking settlers (Voortrekkers/Boers) begin moving north and east in large numbers, primarily to escape British law and governance — particularly the abolition of slavery and legal ideas of equality many rejected. They enter territories occupied by Zulu, Ndebele, Sotho, and other peoples, leading to wars and the establishment of Boer republics.',
    plain_english_child:
      'Some Dutch farmers trekked inland with wagons and fought battles with kingdoms already living there.',
    significance: HistoricalEventSignificance.CRITICAL,
    source_attribution: 'South African History Online; Britannica',
  },
  {
    era_slug: 'colonial',
    year: 1867,
    year_display: '1867',
    event_type: HistoricalEventType.ECONOMIC,
    title: 'Diamonds discovered near Kimberley',
    description:
      'Diamond deposits are discovered near the Vaal–Orange confluence (Kimberley area). A rush of immigrants transforms South Africa into a globally significant territory and accelerates racialised labour systems.',
    plain_english_child:
      'Diamonds made South Africa suddenly famous — and hungry for cheap mine labour.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution: 'South African History Online; Britannica',
  },
  {
    era_slug: 'colonial',
    year: 1886,
    year_display: '1886',
    event_type: HistoricalEventType.ECONOMIC,
    title: "Gold discovered on the Witwatersrand — the world's largest reef",
    description:
      "The world's largest known gold reef is discovered on the Witwatersrand (present-day Johannesburg area). This entrenched deep-level mining and vast migrant labour systems; Britain and Boer republics later went to war over sovereignty and revenue.",
    plain_english_child:
      'Gold under Johannesburg drew the world\'s attention — and tens of thousands of workers underground.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution: 'South African History Online; Britannica',
  },
  {
    era_slug: 'colonial',
    year: 1899,
    year_display: '11 October 1899',
    event_type: HistoricalEventType.FOUNDING,
    title: 'Second Anglo-Boer War begins',
    description:
      'War breaks out between Britain and the Boer republics over control of the gold fields. Britain operates concentration camps in which tens of thousands of Boer civilians and black Africans die from disease and neglect. The Peace of Vereeniging ends the war in 1902 with British victory.',
    plain_english_child:
      'Britain fought the Boer republics; prison camps killed many women, children, and workers.',
    significance: HistoricalEventSignificance.HIGH,
    source_attribution:
      'South African History Online; British War Office historical record; Britannica',
  },
  {
    era_slug: 'colonial',
    year: 1910,
    year_display: '31 May 1910',
    event_type: HistoricalEventType.FOUNDING,
    title: 'Union of South Africa established — black people excluded from power',
    description:
      'The four colonies (Cape, Natal, Transvaal, Orange Free State) unite as the Union of South Africa. The political settlement is a compromise between Britain and the former Boer republics. Black, coloured, and Indian South Africans are almost entirely excluded: only white men can vote in most provinces. The Cape has a limited property-based franchise that includes some black and coloured men — this is later removed. The Union Parliament is entirely white.',
    plain_english_child:
      'In 1910, all the colonies joined together to form one country — the Union of South Africa. But it was a country run only by and for white people. Black, coloured, and Indian South Africans had almost no say in how their country was governed.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution: 'South Africa Act 1909 (UK Parliament); South African History Online',
  },
  {
    era_slug: 'union-and-segregation',
    year: 1912,
    year_display: '8 January 1912',
    event_type: HistoricalEventType.RESISTANCE,
    title: 'African National Congress founded',
    description:
      'The South African Native National Congress — later renamed the African National Congress — is founded in Bloemfontein, one year before the Natives Land Act. Its founding purpose is to bring together black South Africans to fight for political rights and resist racial legislation. Its founding president was Dr. John Langalibalele Dube. Nelson Mandela was born six years later, in 1918.',
    plain_english_child:
      'The year before the government passed the terrible Land Act, black South Africans formed an organisation called the African National Congress to fight for their rights. This organisation would lead the struggle against apartheid for decades.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution: 'South African History Online; ANC historical overview',
  },
  {
    era_slug: 'union-and-segregation',
    year: 1913,
    year_display: '19 June 1913',
    event_type: HistoricalEventType.LAW_ENACTED,
    title: 'Natives Land Act 27 of 1913 — the foundational dispossession law',
    description:
      'The Natives Land Act is passed by the Union Parliament. It restricts black land ownership to 7.3% of South Africa\'s total land area (later expanded to approximately 13% in 1936). Black people cannot buy, lease, or occupy land outside designated "reserves" — even on land their families had farmed for generations. Sharecroppers and labour tenants are displaced across the country. Sol Plaatje documented the devastation in Native Life in South Africa (1916).',
    plain_english_child:
      'In 1913, the government passed a law saying that black people — who were most of the population — could only own or use a small share of all the land in South Africa. Families who had farmed land for generations were suddenly told to leave.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution:
      'Natives Land Act 27 of 1913; Sol Plaatje Native Life in South Africa (1916); South African History Online',
    related_historical_law_slug: 'natives-land-act-1913',
  },
  {
    era_slug: 'union-and-segregation',
    year: 1936,
    year_display: '1936',
    event_type: HistoricalEventType.LAW_ENACTED,
    title: 'Representation of Natives Act — black voters removed from common roll',
    description:
      'Black voters in the Cape Province are removed from the common voters\' roll. They are placed on a separate roll and can only vote for three white MPs to "represent" them in Parliament. It passes with the required two-thirds majority. It is the final removal of black people from formal parliamentary democracy until 1994.',
    plain_english_child:
      'Even the small right that some black people had to vote in the Cape was taken away in 1936. From this year, black South Africans could not vote for their own representatives in the same way — this would not change until 1994.',
    significance: HistoricalEventSignificance.CRITICAL,
    source_attribution: 'Representation of Natives Act 1936; South African History Online',
  },
  {
    era_slug: 'apartheid',
    year: 1948,
    year_display: 'May 1948',
    event_type: HistoricalEventType.ELECTION,
    title: 'National Party wins election — apartheid begins',
    description:
      'The National Party under D.F. Malan wins the whites-only general election. They campaign explicitly on apartheid ("separateness"). They win 70 seats against the United Party\'s 65 — a narrow majority. They immediately begin passing the body of legislation that will constitute apartheid.',
    plain_english_child:
      'In 1948, a political party won an election that only white people could vote in. They promised to keep races completely separate. They started passing laws to do that.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution: 'South African History Online; Britannica',
  },
  {
    era_slug: 'apartheid',
    year: 1950,
    year_display: '1950',
    event_type: HistoricalEventType.LAW_ENACTED,
    title: 'Population Registration Act 30 of 1950 — racial classification of all South Africans',
    description:
      'Every South African is classified by race: Native (Black African), Coloured, or White. A fourth category — Asian (Indian) — is added later. Identity documents carry racial classification. Classification determines residence, schools, marriage, public amenities, and economic life. Families are sometimes split across classifications.',
    plain_english_child:
      'The government made a law saying every South African must be given a race label. This label was written on your identity document and determined where you could live, which school you went to, and much more.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution: 'Population Registration Act 30 of 1950; South African History Online',
  },
  {
    era_slug: 'apartheid',
    year: 1950,
    year_display: '1950',
    event_type: HistoricalEventType.LAW_ENACTED,
    title: 'Group Areas Act 41 of 1950 — forced removal from urban areas',
    description:
      'The Group Areas Act divides urban areas into racial zones. Non-white people in the "wrong" zone can be removed by force. Cape Town\'s District Six is declared a White Group Area; tens of thousands are forcibly removed. Sophiatown in Johannesburg is bulldozed; residents are relocated. Cato Manor in Durban is similarly destroyed.',
    plain_english_child:
      'Cities were split into areas by race. Whole neighbourhoods were knocked down and people were moved far from the city centre.',
    significance: HistoricalEventSignificance.CRITICAL,
    source_attribution: 'Group Areas Act 41 of 1950; South African History Online',
  },
  {
    era_slug: 'apartheid',
    year: 1953,
    year_display: '1953',
    event_type: HistoricalEventType.LAW_ENACTED,
    title: 'Bantu Education Act 47 of 1953 — deliberately inferior education',
    description:
      'The Bantu Education Act transfers control of black education to the central government. Minister Hendrik Verwoerd stated in Parliament on 17 September 1953 that there was "no place for the Bantu in the European community above the level of certain forms of labour." Government spending per pupil heavily favoured white schools at apartheid\'s height.',
    plain_english_child:
      'The government took over schools for black children and spent much less on them on purpose.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution:
      'Bantu Education Act 47 of 1953; Hansard 17 September 1953; South African History Online',
  },
  {
    era_slug: 'apartheid',
    year: 1960,
    year_display: '21 March 1960',
    event_type: HistoricalEventType.MASSACRE,
    title: 'Sharpeville Massacre — 69 people killed by police',
    description:
      'A crowd of approximately 5,000 gather at Sharpeville police station without passbooks as a protest against pass laws. Police fire on the crowd. 69 people are killed — many shot in the back as they fled; 186 wounded. International condemnation follows; the UN moves toward sanctions discourse. The ANC is banned days later (context: organisations Acts).',
    plain_english_child:
      'People protested pass laws; police shot dozens dead. March 21 is now Human Rights Day in South Africa.',
    significance: HistoricalEventSignificance.CRITICAL,
    source_attribution: 'TRC Final Report; South African History Online; contemporaneous inquiries',
    commission_slug: TRC_SLUG,
  },
  {
    era_slug: 'apartheid',
    year: 1963,
    year_display: '1963–1964',
    event_type: HistoricalEventType.LAW_ENACTED,
    title: 'Rivonia Trial — Nelson Mandela sentenced to life imprisonment',
    description:
      'Nelson Mandela and seven others are convicted of sabotage at the Rivonia Trial. Mandela\'s statement from the dock becomes one of the most famous political speeches of the era. He is sentenced to life imprisonment and serves 27 years (including years on Robben Island).',
    plain_english_child:
      'Nelson Mandela and his colleagues were sentenced to life in prison for resisting apartheid.',
    significance: HistoricalEventSignificance.CRITICAL,
    source_attribution: 'Court record — Rivonia Trial; Nelson Mandela Foundation',
    person_full_name: 'Nelson Mandela',
  },
  {
    era_slug: 'apartheid',
    year: 1976,
    year_display: '16 June 1976',
    event_type: HistoricalEventType.RESISTANCE,
    title: 'Soweto Uprising — students rise against Afrikaans instruction',
    description:
      'Students in Soweto protest the use of Afrikaans as a medium of instruction in black schools. Police fire on protesters. The official death toll is recorded at 176; other estimates are higher. Hector Pieterson, 13, is among the first fatalities; press photographs circle the globe. June 16 is now Youth Day.',
    plain_english_child:
      'Students marched against Afrikaans in schools; police opened fire; many died. The world watched.',
    significance: HistoricalEventSignificance.CRITICAL,
    source_attribution: 'South African History Online; TRC Final Report (context); official toll contested',
  },
  {
    era_slug: 'apartheid',
    year: 1977,
    year_display: '12 September 1977',
    event_type: HistoricalEventType.ASSASSINATION,
    title: 'Steve Biko dies in police custody',
    description:
      'Steve Biko, founder of the Black Consciousness Movement, dies of injuries sustained in security police detention aged 30. An inquest is criticised; officers face limited criminal consequences in the apartheid era. TRC processes later examine full disclosure for related amnesty applications.',
    plain_english_child:
      'A young leader who inspired pride and resistance died after being hurt in jail.',
    significance: HistoricalEventSignificance.CRITICAL,
    source_attribution: 'TRC Final Report; Donald Woods Biko (1978); inquest record',
  },
  {
    era_slug: 'apartheid',
    year: 1990,
    year_display: '2 February 1990',
    event_type: HistoricalEventType.LIBERATION,
    title: 'De Klerk unbans the ANC — Mandela to be released',
    description:
      'President F.W. de Klerk announces the unbanning of the ANC, PAC, SACP, and other organisations and the forthcoming release of political prisoners including Nelson Mandela. He announces death penalty suspension in context and lifts the State of Emergency in many areas. Mandela is released on 11 February 1990 after 27 years in prison.',
    plain_english_child:
      'The president said banned organisations could work openly again and Mandela would be freed days later.',
    significance: HistoricalEventSignificance.CRITICAL,
    source_attribution: 'De Klerk opening of Parliament address 2 February 1990; South African History Online',
  },
  {
    era_slug: 'apartheid',
    year: 1994,
    year_display: '27 April 1994',
    event_type: HistoricalEventType.ELECTION,
    title: 'First democratic election — the birth of the new South Africa',
    description:
      'South Africans of all races vote in a general election for the first time. Queues stretch for kilometres in places. Voter turnout is approximately 86% per IEC data. The ANC wins 62.65%. Nelson Mandela is inaugurated President on 10 May 1994.',
    plain_english_child:
      'For the first time, every South African could vote in a national election — many waited hours in line.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution: 'IEC official results; Mandela inaugural address 10 May 1994',
  },
  {
    era_slug: 'post-apartheid',
    year: 1996,
    year_display: '4 February 1996',
    event_type: HistoricalEventType.FOUNDING,
    title: 'The Constitution of the Republic of South Africa adopted',
    description:
      'The Constitutional Assembly adopts the final Constitution. It contains a comprehensive Bill of Rights (equality, dignity, life, freedom and security, privacy, expression, assembly, association, political rights, property, housing, health care, food and water, children, education, language, and more). President Mandela signs it on 10 December 1996 — Human Rights Day internationally.',
    plain_english_child:
      'South Africa wrote down big promises: everyone counts equally under the law and has basic rights the government must work towards.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution:
      'Constitution of the Republic of South Africa, 1996 (Government Gazette / public text)',
  },
  {
    era_slug: 'post-apartheid',
    year: 1997,
    year_display: '1996–1998',
    event_type: HistoricalEventType.FOUNDING,
    title: 'Truth and Reconciliation Commission holds hearings',
    description:
      'The TRC, chaired by Archbishop Desmond Tutu, holds public hearings across South Africa. Victims testify; perpetrators may apply for amnesty subject to full disclosure of politically motivated acts. The TRC Final Report (5 volumes) is presented to President Mandela on 29 October 1998. It finds serious violations across sides but emphasises primary state responsibility under apartheid.',
    plain_english_child:
      'People told painful stories in public so the country could try to face what happened — some perpetrators could get amnesty only if they told the truth.',
    significance: HistoricalEventSignificance.FOUNDATIONAL,
    source_attribution: 'TRC Final Report volumes 1–5 (1998)',
    commission_slug: TRC_SLUG,
  },
];

type StatSeed = {
  era_slug: string;
  stat_type: HistoricalStatType;
  label: string;
  value: string;
  value_context: string;
  year_or_period: string | null;
  source: string;
  plain_english_child: string;
};

const STATS: StatSeed[] = [
  {
    era_slug: 'apartheid',
    stat_type: HistoricalStatType.INCOME_GAP,
    label: 'White-to-black income ratio (early 1970s)',
    value: '15:1',
    year_or_period: '1970s',
    source: 'World Inequality Database / Czajka and Gethin (2024)',
    value_context:
      'White South Africans earned roughly fifteen times more per capita than black South Africans in the early 1970s on these estimates — contested precision; direction is widely accepted.',
    plain_english_child:
      'For every rand a black person earned, a white person might earn fifteen — racism written into wages.',
  },
  {
    era_slug: 'apartheid',
    stat_type: HistoricalStatType.LAND_OWNERSHIP,
    label: 'Share of land in "homelands" / reserves (majority population)',
    value: '13%',
    year_or_period: '1936–1991',
    source: 'Native Trust and Land Act 1936; overview literature',
    value_context:
      'Roughly thirteen per cent of land was set aside for black occupation under segregation/apartheid law — while black South Africans were the large majority — proportions vary slightly by source.',
    plain_english_child:
      'Most people were pushed onto a small part of the map by law.',
  },
  {
    era_slug: 'post-apartheid',
    stat_type: HistoricalStatType.WEALTH_GAP,
    label: 'Median black household wealth vs median white household wealth',
    value: 'R70,000 vs R1.36 million',
    year_or_period: '2025',
    source: 'Southern Centre for Inequality Studies, Wits University',
    value_context:
      'Illustrative median wealth gap — verify exact release year and methodology in SCIS output.',
    plain_english_child:
      'Typical white households still hold far more wealth than typical black households — the old patterns fade slowly.',
  },
  {
    era_slug: 'post-apartheid',
    stat_type: HistoricalStatType.INCOME_GAP,
    label: 'White-to-black income ratio (2019)',
    value: '9.3:1',
    year_or_period: '2019',
    source: 'World Inequality Database / Czajka and Gethin',
    value_context:
      'Ratio improved from extreme 1970s levels but remains very high versus peer countries; US racial income gap is far smaller on comparable headline metrics.',
    plain_english_child:
      'Incomes moved closer together than in the 1970s — but not close enough to feel fair.',
  },
  {
    era_slug: 'post-apartheid',
    stat_type: HistoricalStatType.UNEMPLOYMENT,
    label: 'Expanded unemployment rate',
    value: '42.4%',
    year_or_period: 'Q3 2025',
    source: 'Stats SA QLFS',
    value_context: 'Expanded definition includes discouraged work-seekers — check latest quarterly release.',
    plain_english_child:
      'Many adults who want work cannot find it — the widest unemployment measure is very high.',
  },
  {
    era_slug: 'post-apartheid',
    stat_type: HistoricalStatType.POVERTY,
    label: 'Population below lower-bound poverty line',
    value: '23.2 million (37.9%)',
    year_or_period: '2025',
    source: 'Stats SA poverty report line',
    value_context: 'Figures move with each Statistical Release — corroborate against latest Stats SA document.',
    plain_english_child:
      'Tens of millions of people live on very little money each month.',
  },
  {
    era_slug: 'post-apartheid',
    stat_type: HistoricalStatType.LAND_OWNERSHIP,
    label: 'Agricultural land redistributed since 1994 (approx.)',
    value: '10%',
    year_or_period: '2018',
    source: 'BBC (2018); PLAAS research',
    value_context:
      'Government targets (30% by 2014) were missed; independent researchers describe slow redistribution — update with latest DALRRD statistics where available.',
    plain_english_child:
      'Most farmland redistribution targets were missed — change on the ground has been slower than laws on paper promised.',
  },
];

async function seedHistorical(
  m: EntityManager,
  eraBySlug: Map<string, string>,
  lawBySlug: Map<string, string>,
): Promise<void> {
  const eventRepo = m.getRepository(HistoricalEvent);
  const statRepo = m.getRepository(HistoricalStatistic);

  for (const e of EVENTS) {
    const eraId = eraBySlug.get(e.era_slug);
    if (!eraId) throw new Error(`Missing era ${e.era_slug}`);

    let relatedHistoricalLawId: string | null = null;
    if (e.related_historical_law_slug) {
      relatedHistoricalLawId = lawBySlug.get(e.related_historical_law_slug) ?? null;
    }

    let relatedCommissionId: string | null = null;
    if (e.commission_slug) {
      const c = await m.getRepository(Commission).findOne({
        where: { slug: e.commission_slug },
      });
      relatedCommissionId = c?.id ?? null;
    }

    let relatedPersonId: string | null = null;
    if (e.person_full_name) {
      const p = await m.getRepository(Person).findOne({
        where: { full_name: e.person_full_name },
      });
      relatedPersonId = p?.id ?? null;
    }

    await eventRepo.upsert(
      {
        era_id: eraId,
        year: e.year,
        year_display: e.year_display,
        event_type: e.event_type,
        title: e.title,
        description: e.description,
        plain_english_child: e.plain_english_child,
        significance: e.significance,
        is_verified: true,
        source_attribution: e.source_attribution,
        related_historical_law_id: relatedHistoricalLawId,
        related_commission_id: relatedCommissionId,
        related_person_id: relatedPersonId,
      },
      { conflictPaths: ['era_id', 'year', 'title'] },
    );
  }

  for (const s of STATS) {
    const eraId = eraBySlug.get(s.era_slug);
    if (!eraId) throw new Error(`Missing era ${s.era_slug}`);
    await statRepo.upsert(
      {
        era_id: eraId,
        stat_type: s.stat_type,
        label: s.label,
        value: s.value,
        value_context: s.value_context,
        year_or_period: s.year_or_period,
        source: s.source,
        plain_english_child: s.plain_english_child,
      },
      { conflictPaths: ['era_id', 'label'] },
    );
  }
}

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized
    ? AppDataSource
    : await AppDataSource.initialize();

  console.log('\n── Seeding: South African history layer ──');

  try {
    await dataSource.transaction(async (m) => {
      const eraRepo = m.getRepository(HistoricalEra);
      const lawRepo = m.getRepository(HistoricalLaw);

      for (const row of ERAS) {
        await eraRepo.upsert(
          { ...row, key_theme: row.key_theme ?? undefined },
          { conflictPaths: ['slug'] },
        );
      }

      const eras = await eraRepo.find();
      const eraBySlug = new Map(eras.map((e) => [e.slug, e.id]));

      for (const L of LAWS) {
        const eraId = eraBySlug.get(L.era_slug);
        if (!eraId) throw new Error(`Law references missing era ${L.era_slug}`);
        await lawRepo.upsert(
          {
            era_id: eraId,
            year_enacted: L.year_enacted,
            year_repealed: L.year_repealed,
            name: L.name,
            full_name: L.full_name,
            act_number: L.act_number,
            slug: L.slug,
            category: L.category,
            status: L.status,
            replaced_by: L.replaced_by,
            what_it_did: L.what_it_did,
            plain_english_child: L.plain_english_child,
            plain_english_layperson: L.plain_english_layperson,
            impact_summary: L.impact_summary,
            constitutional_violation: L.constitutional_violation,
            is_foundational: L.is_foundational,
          },
          { conflictPaths: ['slug'] },
        );
      }

      const laws = await lawRepo.find();
      const lawBySlug = new Map(laws.map((l) => [l.slug, l.id]));

      const trc = await m.getRepository(Commission).findOne({ where: { slug: TRC_SLUG } });
      const mandela = await m
        .getRepository(Person)
        .findOne({ where: { full_name: 'Nelson Mandela' } });

      await seedHistorical(m, eraBySlug, lawBySlug);

      if (!trc) {
        console.warn('  ⚠ TRC commission not found — Sharpeville/TRC events lack commission FK');
      }
      if (!mandela) {
        console.warn('  ⚠ Nelson Mandela not in people table — Rivonia event lacks person FK');
      }
    });

    console.log('✓ SA history seed complete.\n');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  run().catch((err: unknown) => {
    console.error('\n✗ SA history seed failed:', err);
    process.exit(1);
  });
}
