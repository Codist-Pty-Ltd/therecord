/* eslint-disable no-console */

/**
 * State-owned entities (SOEs / major PFMA schedule bodies) — master editorial seed.
 * Idempotent: keyed on `state_entities.slug`. Refreshes timeline + commission links
 * per entity on each run.
 *
 * Dependencies (run via `npm run seed:all`):
 *   • commissions-master + adhoc-committees (Zondo, PIC, SABC inquiry)
 *   • siu.seed.ts (proclamation rows for FK targets)
 *   • cape-town-stories + impact-sectors (stories + sector slugs referenced here)
 *
 * Run after `nest build`:
 *   npm run seed:state-entities
 */

import 'reflect-metadata';

import type { EntityManager } from 'typeorm';

import { AdhocCommittee } from '../../entities/adhoc_committee.entity';
import { Commission } from '../../entities/commission.entity';
import { SiuProclamation } from '../../entities/siu_proclamation.entity';
import {
  StateEntityCommissionLink,
  StateEntityCommissionRelationshipType,
} from '../../entities/state-entity-commission-link.entity';
import { StateEntity } from '../../entities/state-entity.entity';
import {
  StateEntityFinancialHealth,
  StateEntityPfmaSchedule,
  StateEntityPrivatisationStatus,
  StateEntitySector,
  StateEntityStatus,
} from '../../entities/state-entity.entity';
import { StateEntityTimeline } from '../../entities/state-entity-timeline.entity';
import {
  StateEntityTimelineEventType,
  StateEntityTimelineSignificance,
} from '../../entities/state-entity-timeline.entity';
import { Story } from '../../entities/story.entity';
import { AppDataSource } from '../data-source';

const ZONDO_SLUG = 'zondo-commission-state-capture';
const PIC_SLUG = 'pic-commission-mpati';
const SABC_ADHOC_SLUG = 'adhoc-sabc-board-2017';

type TimelineSeed = {
  year: number;
  event_type: StateEntityTimelineEventType;
  title: string;
  description: string;
  plain_english?: string | null;
  amount_rands?: string | null;
  source_url?: string | null;
  significance?: StateEntityTimelineSignificance;
  related_commission_slug?: string | null;
  related_siu_proclamation_slug?: string | null;
  related_story_slug?: string | null;
};

type CommissionLinkSeed = {
  relationship_type: StateEntityCommissionRelationshipType;
  summary: string | null;
  commission_slug?: string | null;
  adhoc_committee_slug?: string | null;
  siu_proclamation_slug?: string | null;
};

type EntitySeed = Omit<
  Partial<StateEntity>,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'timeline_entries'
  | 'commission_links'
  | 'pfma_schedule'
  | 'sector'
  | 'status'
  | 'financial_health'
  | 'privatisation_status'
> & {
  slug: string;
  name: string;
  popular_name: string;
  abbreviation: string;
  sector: StateEntitySector;
  pfma_schedule?: StateEntityPfmaSchedule | null;
  status: StateEntityStatus;
  established_year: number;
  established_by?: string | null;
  purpose_original: string;
  purpose_plain_english: string;
  why_it_matters_to_ordinary_people: string;
  current_mandate_summary?: string | null;
  current_ceo?: string | null;
  supervising_ministry: string;
  government_ownership_percentage?: string;
  latest_annual_loss_rands?: string | null;
  total_debt_rands?: string | null;
  total_bailouts_received_rands?: string | null;
  annual_budget_rands?: string | null;
  financial_health: StateEntityFinancialHealth;
  financial_health_year?: string | null;
  health_score?: number | null;
  health_score_rationale?: string | null;
  is_in_crisis?: boolean;
  crisis_summary?: string | null;
  privatisation_debate?: string | null;
  privatisation_status?: StateEntityPrivatisationStatus;
  primary_impact_sector_slug: string;
  timeline?: TimelineSeed[];
  commission_links?: CommissionLinkSeed[];
};

const ENTITY_SEEDS: EntitySeed[] = [
  {
    slug: 'eskom',
    name: 'Eskom Holdings SOC Ltd',
    popular_name: 'Eskom',
    abbreviation: 'Eskom',
    sector: StateEntitySector.ENERGY,
    pfma_schedule: StateEntityPfmaSchedule.SCHEDULE_2,
    status: StateEntityStatus.RESTRUCTURING,
    established_year: 1923,
    established_by: 'Electricity Act 1923 (historical); subsequently Eskom Conversion Act and Companies Act as SOC',
    purpose_original:
      'To generate, transmit and distribute electricity to all South Africans and to industry. Eskom was meant to be the engine of economic growth and the backbone of electrification for communities that had never had power under apartheid.',
    purpose_plain_english:
      "Eskom's job is to make electricity and send it to every home, school, hospital and factory in South Africa. Without electricity, almost nothing works — not hospitals, not schools, not factories, not phones. Eskom is supposed to make sure the lights stay on for everyone.",
    why_it_matters_to_ordinary_people:
      "When Eskom fails, the lights go out. Load-shedding means food in fridges goes bad, small businesses cannot operate, water pumps stop working, and hospital generators burn expensive diesel. It is estimated that load-shedding cost the South African economy over R600 billion in lost output. Every South African pays for Eskom's failures — in their electricity bill, in lost jobs, and in the R254 billion in taxpayer-funded debt relief that government provided to keep it alive.",
    supervising_ministry: 'Ministry of Electricity and Energy',
    latest_annual_loss_rands: '23900000000',
    total_debt_rands: '396000000000',
    total_bailouts_received_rands: '254000000000',
    financial_health: StateEntityFinancialHealth.DISTRESSED,
    financial_health_year: '2023/24',
    is_in_crisis: false,
    health_score: 38,
    health_score_rationale:
      "Load-shedding ended April 2024 — a genuine improvement. But Eskom's debt remains crippling, infrastructure is aging, and the entity is being structurally unbundled. Recovery is real but fragile.",
    privatisation_status: StateEntityPrivatisationStatus.PARTIAL_PRIVATISATION_UNDERWAY,
    privatisation_debate:
      'FOR privatisation: Private generators (IPPs) have helped end load-shedding. Competition drives efficiency. The state cannot fund the investment needed. AGAINST privatisation: Electricity is a public good — privatisation means price increases for poor households (as happened in Soweto where 86% reconnected illegally after being disconnected for arrears). IPPs already cost Eskom R16bn/year in guaranteed payments — costs passed to consumers. Eskom as a public entity can cross-subsidise poor areas that private firms would not serve.',
    primary_impact_sector_slug: 'jobs',
    timeline: [
      {
        year: 1923,
        event_type: StateEntityTimelineEventType.ESTABLISHED,
        title: 'Electricity Supply Commission (Escom) established',
        description:
          'The public electricity undertaking that became Eskom was established to centralise generation and supply under public ownership.',
        significance: StateEntityTimelineSignificance.HIGH,
      },
      {
        year: 1994,
        event_type: StateEntityTimelineEventType.MAJOR_ACHIEVEMENT,
        title: 'Electrification programme — mass household connections in the 1990s',
        description:
          'The post-1994 electrification drive connected hundreds of thousands of households per year, extending grid access to communities excluded under apartheid.',
        significance: StateEntityTimelineSignificance.HIGH,
      },
      {
        year: 2007,
        event_type: StateEntityTimelineEventType.SERVICE_COLLAPSE,
        title: 'First major load-shedding crisis',
        description:
          'Eskom had publicly warned since the late 1990s that reserve margin would be exhausted; by 2007 demand outstripped reliable capacity and rotational cuts began.',
        significance: StateEntityTimelineSignificance.CRITICAL,
      },
      {
        year: 2015,
        event_type: StateEntityTimelineEventType.CORRUPTION_EXPOSED,
        title: 'State capture networks target Eskom governance and procurement',
        description:
          'Evidence emerged of compromised governance and irregular procurement channels linked to wider state capture — later documented in the Zondo Commission.',
        related_commission_slug: ZONDO_SLUG,
        significance: StateEntityTimelineSignificance.HIGH,
      },
      {
        year: 2019,
        event_type: StateEntityTimelineEventType.FINANCIAL_CRISIS,
        title: 'Severe losses and unsustainable borrowings',
        description:
          'Year-end results reflected a multi-billion-rand loss and debt at levels that threatened solvency without ongoing sovereign support.',
        significance: StateEntityTimelineSignificance.CRITICAL,
      },
      {
        year: 2019,
        event_type: StateEntityTimelineEventType.BAILOUT_RECEIVED,
        title: 'Government equity support — first major tranche of shareholder relief',
        description:
          'National Treasury injected equity to stabilise Eskom’s balance sheet — the first of several large fiscal interventions.',
        amount_rands: '23000000000',
        significance: StateEntityTimelineSignificance.HIGH,
      },
      {
        year: 2023,
        event_type: StateEntityTimelineEventType.SERVICE_COLLAPSE,
        title: 'Record rotational outages — Stage 6 for prolonged periods',
        description:
          'Unprecedented load-shedding intensity — with modelling and industry estimates of hundreds of billions of rand in cumulative economic damage over the load-shedding era.',
        significance: StateEntityTimelineSignificance.CRITICAL,
      },
      {
        year: 2024,
        event_type: StateEntityTimelineEventType.RECOVERY,
        title: 'First full calendar month without load-shedding since early 2022',
        description:
          'April 2024 marked a material operational reprieve after years of intensive outages — still contingent on expensive diesel and IPP imports.',
        significance: StateEntityTimelineSignificance.CRITICAL,
      },
      {
        year: 2024,
        event_type: StateEntityTimelineEventType.RESTRUCTURING,
        title: 'Legal unbundling into generation, transmission and distribution',
        description:
          'Legislative and governance steps advanced to separate transmission (independent system/market operator trajectory) from legacy integrated utility structures.',
        significance: StateEntityTimelineSignificance.HIGH,
      },
      {
        year: 2025,
        event_type: StateEntityTimelineEventType.PRIVATISATION_MOVE,
        title: 'SONA commitment to independent transmission company',
        description:
          'President Cyril Ramaphosa’s 2025 State of the Nation trajectory confirmed movement toward an independent transmission entity — debated in public discourse as partial opening of the grid/transmission function.',
        significance: StateEntityTimelineSignificance.MEDIUM,
      },
    ],
    commission_links: [
      {
        relationship_type: StateEntityCommissionRelationshipType.INVESTIGATED,
        summary:
          'Eskom sat at the centre of state capture — including McKinsey, Trillian and Gupta-linked consultancy and procurement lines investigated by the Zondo Commission.',
        commission_slug: ZONDO_SLUG,
      },
      {
        relationship_type: StateEntityCommissionRelationshipType.SUBJECT_OF,
        summary: 'SIU Proclamation R29 of 2019 activates investigation into Eskom procurement and financial misconduct.',
        siu_proclamation_slug: 'proclamation-r29-2019-eskom',
      },
    ],
  },
  {
    slug: 'prasa',
    name: 'Passenger Rail Agency of South Africa',
    popular_name: 'PRASA',
    abbreviation: 'PRASA',
    sector: StateEntitySector.TRANSPORT_RAIL,
    pfma_schedule: StateEntityPfmaSchedule.SCHEDULE_2,
    status: StateEntityStatus.RESTRUCTURING,
    established_year: 2009,
    purpose_original:
      'To provide safe, reliable, affordable commuter rail services to millions of working-class South Africans who cannot afford private transport. PRASA was meant to be the backbone of working-class mobility — the alternative to expensive taxis and personal vehicles.',
    purpose_plain_english:
      'PRASA runs the trains. Not the fancy long-distance ones — the Metrorail trains that ordinary working people take to get to work every day. A train ticket costs a fraction of a taxi. For millions of South Africans, the train is the only way they can afford to get to work.',
    why_it_matters_to_ordinary_people:
      "When PRASA fails, workers pay 3-4x more for taxis. A worker earning R5,000/month might spend R2,000 on transport instead of R500. That difference — R1,500/month — is food, school fees, electricity. Every truck that replaces a freight train means more road damage, more accidents, more pollution, and higher consumer prices. By 2022, over 80% of PRASA's rolling stock was out of service.",
    supervising_ministry: 'Department of Transport',
    latest_annual_loss_rands: '1800000000',
    total_bailouts_received_rands: '5000000000',
    financial_health: StateEntityFinancialHealth.DISTRESSED,
    is_in_crisis: true,
    crisis_summary:
      'Over 80% of rolling stock out of service by 2022. Trains set on fire by criminals — 1,800 carriages vandalised or burned. SIU found R4.3bn in irregular expenditure under CEO Lucky Montana. Locomotives purchased that were too tall for South African rail lines.',
    health_score: 25,
    health_score_rationale:
      'Some recovery in 2024–25 with new rolling stock procurement and route restoration, but the system remains severely damaged. Metrorail in most cities is still not reliable enough for daily commuting.',
    privatisation_status: StateEntityPrivatisationStatus.UNDER_DEBATE,
    privatisation_debate:
      'FOR: Private operators could run routes more efficiently. The state has proven it cannot manage PRASA. AGAINST: Private rail would only operate profitable routes — leaving poor communities unserved. Rail subsidises mobility for those who cannot afford alternatives. A profit-seeking rail operator would raise fares until only wealthier commuters could use it. The social cost of that far exceeds the cost of fixing PRASA.',
    primary_impact_sector_slug: 'transport',
    timeline: [
      {
        year: 2009,
        event_type: StateEntityTimelineEventType.ESTABLISHED,
        title: 'PRASA formed from Metrorail and Shosholoza Meyl',
        description: 'Consolidation of passenger rail functions into a single state-owned agency.',
        significance: StateEntityTimelineSignificance.MEDIUM,
      },
      {
        year: 2012,
        event_type: StateEntityTimelineEventType.CORRUPTION_EXPOSED,
        title: 'Irregular locomotive procurement — including stock too tall for SA gauge',
        description:
          'Large rolling-stock contracts under CEO Lucky Montana later featured in SIU and Public Protector work as emblematic failures of governance.',
        significance: StateEntityTimelineSignificance.HIGH,
      },
      {
        year: 2015,
        event_type: StateEntityTimelineEventType.LEGAL_ACTION,
        title: 'SIU Proclamation R25/2015 — PRASA investigation activated',
        description: 'Presidential proclamation authorising SIU investigation into PRASA procurement and financial misconduct.',
        related_siu_proclamation_slug: 'proclamation-r25-2015-prasa',
        significance: StateEntityTimelineSignificance.HIGH,
      },
      {
        year: 2015,
        event_type: StateEntityTimelineEventType.RESTRUCTURING,
        title: 'PRASA placed under administration',
        description: 'Ministerial intervention to stabilise governance and operations after governance breakdown.',
        significance: StateEntityTimelineSignificance.MEDIUM,
      },
      {
        year: 2019,
        event_type: StateEntityTimelineEventType.FINANCIAL_CRISIS,
        title: 'Large operating deficit — performance targets routinely missed',
        description:
          'Annual disclosures showed a multi-billion-rand operating shortfall with only a fraction of reliability targets met even in relatively “better” years.',
        significance: StateEntityTimelineSignificance.HIGH,
      },
      {
        year: 2020,
        event_type: StateEntityTimelineEventType.SERVICE_COLLAPSE,
        title: 'COVID disruption compounded by security collapse and arson',
        description:
          'National lockdown halted services; security vacuum and criminal attacks destroyed or damaged large numbers of coaches.',
        significance: StateEntityTimelineSignificance.HIGH,
      },
      {
        year: 2022,
        event_type: StateEntityTimelineEventType.SERVICE_COLLAPSE,
        title: 'Metrorail largely non-functional across major metros',
        description:
          'Operational statistics and Parliamentary oversight painted a network where the majority of rolling stock could not run scheduled services.',
        significance: StateEntityTimelineSignificance.CRITICAL,
      },
      {
        year: 2024,
        event_type: StateEntityTimelineEventType.RECOVERY,
        title: 'New rolling stock and partial route restoration',
        description:
          'Procurement deliveries and line reopenings began to restore limited services; long-distance Shosholoza Meyl partially restarted.',
        significance: StateEntityTimelineSignificance.MEDIUM,
      },
    ],
    commission_links: [
      {
        relationship_type: StateEntityCommissionRelationshipType.SUBJECT_OF,
        summary:
          'SIU Proclamation R25/2015 centres PRASA procurement — including findings-scale irregular expenditure referenced in oversight reporting.',
        siu_proclamation_slug: 'proclamation-r25-2015-prasa',
      },
      {
        relationship_type: StateEntityCommissionRelationshipType.IMPLICATED,
        summary: 'Zondo Commission state capture volumes document PRASA among the SOEs weaponised for rent-seeking.',
        commission_slug: ZONDO_SLUG,
      },
    ],
  },
  {
    slug: 'south-african-post-office',
    name: 'South African Post Office SOC Ltd',
    popular_name: 'Post Office',
    abbreviation: 'SAPO',
    sector: StateEntitySector.COMMUNICATIONS,
    pfma_schedule: StateEntityPfmaSchedule.SCHEDULE_2,
    status: StateEntityStatus.RESTRUCTURING,
    established_year: 1792,
    purpose_original:
      'Universal postal service for all South Africans — delivering mail, parcels, and financial services including social grant payments to those without bank accounts. In a country where millions are unbanked, the Post Office was meant to be the financial access point for the most vulnerable.',
    purpose_plain_english:
      'The Post Office was supposed to be the place where everyone — even people in remote areas without a bank account — could send and receive letters, collect their government grants, and access basic financial services. For pensioners and grant recipients in rural areas, the Post Office was often the only place they could collect their money.',
    why_it_matters_to_ordinary_people:
      "When SASSA grants moved to private banks (Postbank losing the grant contract to CPS/Net1 and later banks), 18 million grant recipients were forced to use commercial banks. Private banks charge fees that eat into grants. The PostBank was meant to be the zero-fee option for the poor. SAPO's collapse also means rural and elderly South Africans lost their local financial access point. R8.5 billion in losses since 2018. Liabilities exceed assets by R7.9 billion.",
    supervising_ministry: 'Department of Communications and Digital Technologies',
    total_bailouts_received_rands: '8500000000',
    financial_health: StateEntityFinancialHealth.INSOLVENT,
    financial_health_year: '2023',
    is_in_crisis: true,
    crisis_summary:
      'Placed under business rescue in 2023. Liabilities exceed assets by R7.9bn — hopelessly insolvent. R2bn annual losses as of 2023. 16,000 employees retrenched or at risk. Grant payment function lost to private banks.',
    health_score: 12,
    privatisation_status: StateEntityPrivatisationStatus.PARTIAL_PRIVATISATION_UNDERWAY,
    privatisation_debate:
      'SAPO is effectively being privatised by collapse — private courier companies (DHL, Courier Guy) have taken over most parcel delivery. The PostBank financial services function may be separated and saved. The critical question: if PostBank is privatised, who provides zero-fee banking for 18 million grant recipients?',
    primary_impact_sector_slug: 'food',
    timeline: [
      {
        year: 1792,
        event_type: StateEntityTimelineEventType.ESTABLISHED,
        title: 'Postal service established at the Cape Colony',
        description: 'Colonial postal origins of what became a national universal service mandate.',
        significance: StateEntityTimelineSignificance.LOW,
      },
      {
        year: 1994,
        event_type: StateEntityTimelineEventType.MAJOR_ACHIEVEMENT,
        title: 'Network expanded toward rural grant payment points',
        description: 'Post-1994 spatial inclusion efforts tied mail and money services to social delivery.',
        significance: StateEntityTimelineSignificance.MEDIUM,
      },
      {
        year: 2012,
        event_type: StateEntityTimelineEventType.CORRUPTION_EXPOSED,
        title: 'Governance fraying — irregular procurement and political interference',
        description: 'Parliamentary and oversight reporting flagged procurement and cadre-deployment pressures.',
        significance: StateEntityTimelineSignificance.MEDIUM,
      },
      {
        year: 2018,
        event_type: StateEntityTimelineEventType.FINANCIAL_CRISIS,
        title: 'Deepening losses — operational shock from electricity outages',
        description: 'SAPO’s cost base and branch economics deteriorated sharply alongside national load-shedding.',
        significance: StateEntityTimelineSignificance.HIGH,
      },
      {
        year: 2019,
        event_type: StateEntityTimelineEventType.POLICY_CHANGE,
        title: 'SASSA grant payment migration away from SAPO dominance',
        description: 'Payment channel reforms moved millions of grants into commercial banking rails.',
        significance: StateEntityTimelineSignificance.HIGH,
      },
      {
        year: 2023,
        event_type: StateEntityTimelineEventType.FINANCIAL_CRISIS,
        title: 'Business rescue — negative equity and unsustainable losses',
        description:
          'Annual losses near multi-billion-rand run-rate with liabilities materially exceeding assets under audited disclosure.',
        significance: StateEntityTimelineSignificance.CRITICAL,
      },
      {
        year: 2023,
        event_type: StateEntityTimelineEventType.LEADERSHIP_CHANGE,
        title: 'Business rescue practitioners appointed',
        description: 'Board control ceded to business rescue process to attempt restructuring.',
        significance: StateEntityTimelineSignificance.HIGH,
      },
      {
        year: 2024,
        event_type: StateEntityTimelineEventType.RESTRUCTURING,
        title: 'Large-scale retrenchments and branch closures',
        description: 'Workforce and footprint rationalisation accelerated under rescue and liquidity constraints.',
        significance: StateEntityTimelineSignificance.HIGH,
      },
    ],
  },
  {
    slug: 'sabc',
    name: 'South African Broadcasting Corporation',
    popular_name: 'SABC',
    abbreviation: 'SABC',
    sector: StateEntitySector.BROADCASTING,
    pfma_schedule: StateEntityPfmaSchedule.SCHEDULE_2,
    status: StateEntityStatus.RESTRUCTURING,
    established_year: 1936,
    purpose_original:
      'To provide public broadcasting in all 11 official languages, serving all communities with news, education, and entertainment. The SABC was meant to be the democratic voice of all South Africans — independent from government, accountable to the public.',
    purpose_plain_english:
      'The SABC makes TV shows and radio programmes for everyone in South Africa, in all 11 languages. It is meant to be independent — like a public referee that tells the truth to everyone. It should not be controlled by the party in power. It is supposed to be YOUR broadcaster, paid for by your TV licence fees and government funding.',
    why_it_matters_to_ordinary_people:
      'For millions of South Africans without subscriptions to pay-TV or streaming, SABC is the only broadcaster they can afford. When the SABC becomes a propaganda tool (as it did under Hlaudi Motsoeneng), people cannot get independent news. When it nearly collapses, 11 languages and millions of viewers lose their broadcaster.',
    supervising_ministry: 'Department of Communications and Digital Technologies',
    total_bailouts_received_rands: '3200000000',
    financial_health: StateEntityFinancialHealth.UNDER_PRESSURE,
    is_in_crisis: false,
    health_score: 45,
    privatisation_status: StateEntityPrivatisationStatus.UNDER_DEBATE,
    privatisation_debate:
      'FOR: The SABC cannot compete commercially. Private media does it better. AGAINST: Public broadcasting serves communities that commercial media ignores — rural areas, minority languages, the poor. A privatised broadcaster serves profit, not public interest. South Africa\'s 11 languages need a public mandate, not a market one.',
    primary_impact_sector_slug: 'safety',
    commission_links: [
      {
        relationship_type: StateEntityCommissionRelationshipType.SUBJECT_OF,
        summary: 'Parliament’s Ad Hoc Committee on the SABC Board (2017) probed governance collapse and editorial interference.',
        adhoc_committee_slug: SABC_ADHOC_SLUG,
      },
      {
        relationship_type: StateEntityCommissionRelationshipType.SUBJECT_OF,
        summary: 'SIU Proclamation R01/2019 targets irregular appointments, contracts and bonus inflation — including Hlaudi Motsoeneng-era dealings.',
        siu_proclamation_slug: 'proclamation-r01-2019-sabc-hlaudi',
      },
    ],
  },
  {
    slug: 'sassa',
    name: 'South African Social Security Agency',
    popular_name: 'SASSA',
    abbreviation: 'SASSA',
    sector: StateEntitySector.FINANCE_GRANTS,
    pfma_schedule: StateEntityPfmaSchedule.SCHEDULE_3A,
    status: StateEntityStatus.OPERATIONAL,
    established_year: 2005,
    purpose_original:
      'To administer social grants to the most vulnerable South Africans — children, the elderly, people with disabilities, unemployed caregivers. The social grant system is the primary safety net against starvation and destitution for 18 million grant recipients.',
    purpose_plain_english:
      'SASSA is the government body that makes sure vulnerable South Africans receive their grants — money for children, old people, people who are sick or disabled, and unemployed people looking after children. 18 million people depend on this money every month to eat and survive.',
    why_it_matters_to_ordinary_people:
      '18 million South Africans — nearly a third of the population — receive social grants. For many families this is their only income. When SASSA officials steal from the grants system (R260m stolen in Gauteng 2025), when the grant payment system is given to a private company (CPS/Net1) that charges illegal deductions, when the PostBank collapses removing zero-fee banking — ordinary grant recipients bear all the costs.',
    supervising_ministry: 'Department of Social Development',
    financial_health: StateEntityFinancialHealth.UNDER_PRESSURE,
    is_in_crisis: false,
    health_score: 55,
    privatisation_status: StateEntityPrivatisationStatus.UNDER_DEBATE,
    privatisation_debate:
      'SASSA itself is not being privatised, but the PAYMENT infrastructure — once public via PostBank — has been privatised by default as private banks now handle grant disbursement. Each private bank transaction has fees. For a pensioner receiving R2,200/month, even R50 in bank charges is R600/year stolen from their grant — legally.',
    primary_impact_sector_slug: 'food',
    commission_links: [
      {
        relationship_type: StateEntityCommissionRelationshipType.SUBJECT_OF,
        summary: 'SIU Proclamation R23/2017 investigates the irregular CPS/Net1 grant payment contract.',
        siu_proclamation_slug: 'proclamation-r23-2017-sassa',
      },
      {
        relationship_type: StateEntityCommissionRelationshipType.IMPLICATED,
        summary: 'PIC Commission work intersects the broader pension-and-grants ecosystem where governance failures amplified social risk.',
        commission_slug: PIC_SLUG,
      },
    ],
  },
  {
    slug: 'transnet',
    name: 'Transnet SOC Ltd',
    popular_name: 'Transnet',
    abbreviation: 'Transnet',
    sector: StateEntitySector.LOGISTICS_PORTS,
    pfma_schedule: StateEntityPfmaSchedule.SCHEDULE_2,
    status: StateEntityStatus.RESTRUCTURING,
    established_year: 1990,
    purpose_original:
      "To operate South Africa's freight rail, ports, and pipelines — the logistics backbone of the economy. Moving goods by rail instead of road reduces costs, reduces road damage, reduces accidents, and enables economic growth.",
    purpose_plain_english:
      'Transnet moves goods around South Africa — coal, cars, containers, fuel. It runs the ports where ships come in. It runs the freight trains. When Transnet works, things are cheaper because rail is cheaper than trucks. When Transnet fails, everything costs more — and more trucks on the roads means more potholes, more accidents, and higher prices in shops.',
    why_it_matters_to_ordinary_people:
      "Every product in a South African shop that came through a port or across the country depends on Transnet. When Transnet's ports rank among the worst in the world (as they did in 2022), exporters lose contracts, farmers miss markets, and the economy shrinks. The Transnet locomotive deal (R54bn, linked to Gupta network) is the largest single act of state capture investigated by the Zondo Commission.",
    supervising_ministry: 'Department of Public Enterprises',
    total_debt_rands: '130000000000',
    financial_health: StateEntityFinancialHealth.DISTRESSED,
    is_in_crisis: true,
    crisis_summary:
      'Tens of billions of rand in irregular expenditure referenced in oversight and judicial processes. Durban container terminal performance drew global benchmarking criticism. Rail freight volumes collapsed over a multi-year period. Civil claims at huge scale enrolled against capture-related dealings.',
    health_score: 32,
    privatisation_status: StateEntityPrivatisationStatus.PARTIAL_PRIVATISATION_UNDERWAY,
    primary_impact_sector_slug: 'jobs',
    commission_links: [
      {
        relationship_type: StateEntityCommissionRelationshipType.SUBJECT_OF,
        summary: 'Zondo Commission devoted substantial findings to Transnet’s locomotive procurement and related rent-seeking.',
        commission_slug: ZONDO_SLUG,
      },
      {
        relationship_type: StateEntityCommissionRelationshipType.SUBJECT_OF,
        summary: 'SIU Proclamation R27/2019 activates investigation aligned with Special Tribunal civil recovery on capture-linked contracts.',
        siu_proclamation_slug: 'proclamation-r27-2019-transnet-locomotives',
      },
    ],
  },
  {
    slug: 'nsfas',
    name: 'National Student Financial Aid Scheme',
    popular_name: 'NSFAS',
    abbreviation: 'NSFAS',
    sector: StateEntitySector.EDUCATION_FUNDING,
    pfma_schedule: StateEntityPfmaSchedule.SCHEDULE_3A,
    status: StateEntityStatus.RESTRUCTURING,
    established_year: 1999,
    purpose_original:
      'To fund university and TVET college education for students from low-income households — making higher education accessible to those who cannot afford it. The post-apartheid promise that anyone with ability could get a degree.',
    purpose_plain_english:
      'NSFAS gives money to students from poor families so they can go to university or college. Without it, most poor students could not afford to study after school. It is meant to be the ladder out of poverty.',
    why_it_matters_to_ordinary_people:
      'For a child from a family earning under R350,000 per year, NSFAS is the only way into university. When NSFAS is mismanaged — as it has been, with multi-billion-rand irregular expenditure disclosed in 2022/23 — students do not receive their allowances. They go hungry, lose accommodation, drop out. The #FeesMustFall movement (2015–16) that led to the Fees Commission was about this fundamental injustice.',
    supervising_ministry: 'Department of Higher Education and Training',
    financial_health: StateEntityFinancialHealth.DISTRESSED,
    is_in_crisis: true,
    crisis_summary:
      'AG and oversight reporting flagged billions in irregular expenditure; allowance payment crises stranded students; direct-payment contracting attracted fraud and governance warnings.',
    health_score: 28,
    primary_impact_sector_slug: 'education',
  },
  {
    slug: 'south-african-airways',
    name: 'South African Airways SOC Ltd',
    popular_name: 'SAA',
    abbreviation: 'SAA',
    sector: StateEntitySector.TRANSPORT_AIR,
    pfma_schedule: StateEntityPfmaSchedule.SCHEDULE_2,
    status: StateEntityStatus.RESTRUCTURING,
    established_year: 1934,
    purpose_original:
      'To connect South Africa to the world and to itself — the national carrier representing South African identity abroad and connecting domestic routes commercially unviable for private airlines.',
    purpose_plain_english:
      "SAA was South Africa's national airline. It was supposed to fly South Africans around the country and to other countries at competitive prices, and to represent South Africa on the world stage. But it never made a profit after 2011 and cost taxpayers over R40 billion in bailouts before it was put into business rescue.",
    why_it_matters_to_ordinary_people:
      'Air connectivity affects tourism jobs, exporters, and families split across provinces. When a national carrier fails repeatedly, ticket prices on remaining routes can rise, routes disappear, and provinces lose direct links to economic hubs — while taxpayers still pay for past bailouts.',
    supervising_ministry: 'Department of Public Enterprises',
    total_bailouts_received_rands: '40000000000',
    financial_health: StateEntityFinancialHealth.DISTRESSED,
    is_in_crisis: false,
    health_score: 20,
    privatisation_status: StateEntityPrivatisationStatus.PARTIAL_PRIVATISATION_UNDERWAY,
    privatisation_debate:
      'SAA is the clearest case where privatisation arguments are strong: a national airline is not a constitutional right, private airlines exist, and R40bn in bailouts over 20 years is indefensible. The counter-argument: loss of SAA hubs damages tourism, reduces connectivity for communities served only by SAA routes, and signals state incapacity to international investors.',
    primary_impact_sector_slug: 'jobs',
  },
  {
    slug: 'rand-water',
    name: 'Rand Water',
    popular_name: 'Rand Water',
    abbreviation: 'Rand Water',
    sector: StateEntitySector.WATER,
    pfma_schedule: null,
    status: StateEntityStatus.OPERATIONAL,
    established_year: 1903,
    purpose_original:
      'To supply bulk drinking water to Gauteng and surrounding areas — serving 19 million people, making it one of the largest water utilities in the world.',
    purpose_plain_english:
      'Rand Water takes water from the Vaal system, treats it, and supplies bulk potable water to metros and municipalities serving roughly 19 million people. Without Rand Water’s treatment and bulk conveyance, large parts of Gauteng’s urban economy could not be hydrated at scale.',
    why_it_matters_to_ordinary_people:
      'Rand Water is one of the few major utilities that has maintained comparatively strong operational performance, but its municipal customers frequently lose massive volumes to leaks and poor local reticulation. Johannesburg has disclosed extreme non-revenue water — meaning a functioning bulk supplier can still coexist with a household-level water crisis.',
    supervising_ministry: 'Department of Water and Sanitation',
    financial_health: StateEntityFinancialHealth.HEALTHY,
    is_in_crisis: false,
    health_score: 72,
    primary_impact_sector_slug: 'water',
  },
  {
    slug: 'denel',
    name: 'Denel SOC Ltd',
    popular_name: 'Denel',
    abbreviation: 'Denel',
    sector: StateEntitySector.DEFENCE,
    pfma_schedule: StateEntityPfmaSchedule.SCHEDULE_2,
    status: StateEntityStatus.RESTRUCTURING,
    established_year: 1992,
    purpose_original:
      'To develop and manufacture defence equipment and aerospace systems for the South African National Defence Force and for export — supporting South African sovereign defence capability and high-tech jobs.',
    purpose_plain_english:
      'Denel makes weapons, aircraft parts, and military equipment. It was meant to make sure South Africa could defend itself without depending on other countries, and to create highly skilled jobs for South African engineers.',
    why_it_matters_to_ordinary_people:
      'When Denel collapses, highly skilled aerospace and engineering jobs leave the country, supply chains to the defence force fray, and the state loses strategic autonomy — while still bearing legacy debt and salary crises that rip through families dependent on Denel wages.',
    supervising_ministry: 'Department of Defence and Military Veterans',
    total_debt_rands: '3400000000',
    financial_health: StateEntityFinancialHealth.INSOLVENT,
    is_in_crisis: true,
    crisis_summary:
      'Liquidity crises delayed salary payments; multi-billion-rand debt overhang; state capture-era joint ventures (including Gupta-linked VR Laser scrutiny at Zondo) accelerated skills flight.',
    health_score: 15,
    primary_impact_sector_slug: 'jobs',
    commission_links: [
      {
        relationship_type: StateEntityCommissionRelationshipType.IMPLICATED,
        summary: 'Zondo Commission findings engage Denel joint-venture and governance lines tied to capture networks.',
        commission_slug: ZONDO_SLUG,
      },
    ],
  },
];

function buildEntityPayload(seed: EntitySeed): Partial<StateEntity> {
  return {
    slug: seed.slug,
    name: seed.name,
    popular_name: seed.popular_name,
    abbreviation: seed.abbreviation,
    sector: seed.sector,
    pfma_schedule: seed.pfma_schedule ?? null,
    status: seed.status,
    established_year: seed.established_year,
    established_by: seed.established_by ?? null,
    purpose_original: seed.purpose_original,
    purpose_plain_english: seed.purpose_plain_english,
    why_it_matters_to_ordinary_people: seed.why_it_matters_to_ordinary_people,
    current_mandate_summary: seed.current_mandate_summary ?? null,
    current_ceo: seed.current_ceo ?? null,
    supervising_ministry: seed.supervising_ministry,
    government_ownership_percentage: seed.government_ownership_percentage ?? '100.00',
    latest_annual_loss_rands: seed.latest_annual_loss_rands ?? null,
    total_debt_rands: seed.total_debt_rands ?? null,
    total_bailouts_received_rands: seed.total_bailouts_received_rands ?? null,
    annual_budget_rands: seed.annual_budget_rands ?? null,
    financial_health: seed.financial_health,
    financial_health_year: seed.financial_health_year ?? null,
    health_score: seed.health_score ?? null,
    health_score_rationale: seed.health_score_rationale ?? null,
    is_in_crisis: seed.is_in_crisis ?? false,
    crisis_summary: seed.crisis_summary ?? null,
    privatisation_debate: seed.privatisation_debate ?? null,
    privatisation_status: seed.privatisation_status ?? StateEntityPrivatisationStatus.NOT_DISCUSSED,
    primary_impact_sector_slug: seed.primary_impact_sector_slug,
  };
}

async function upsertEntity(m: EntityManager, seed: EntitySeed): Promise<StateEntity> {
  const repo = m.getRepository(StateEntity);
  const payload = buildEntityPayload(seed);
  let row = await repo.findOne({ where: { slug: seed.slug } });
  if (!row) {
    row = repo.create(payload as StateEntity);
  } else {
    Object.assign(row, payload);
  }
  row = await repo.save(row);
  return row;
}

async function refreshTimeline(m: EntityManager, entityId: string, entries: TimelineSeed[]): Promise<void> {
  const tRepo = m.getRepository(StateEntityTimeline);
  await tRepo.delete({ state_entity_id: entityId });
  for (const e of entries) {
    await tRepo.save(
      tRepo.create({
        state_entity_id: entityId,
        year: e.year,
        event_type: e.event_type,
        title: e.title,
        description: e.description,
        plain_english: e.plain_english ?? null,
        amount_rands: e.amount_rands ?? null,
        source_url: e.source_url ?? null,
        significance: e.significance ?? StateEntityTimelineSignificance.MEDIUM,
        related_commission_slug: e.related_commission_slug ?? null,
        related_siu_proclamation_slug: e.related_siu_proclamation_slug ?? null,
        related_story_slug: e.related_story_slug ?? null,
      }),
    );
  }
}

async function refreshCommissionLinks(
  m: EntityManager,
  entityId: string,
  links: CommissionLinkSeed[] | undefined,
): Promise<void> {
  const lRepo = m.getRepository(StateEntityCommissionLink);
  await lRepo.delete({ state_entity_id: entityId });
  if (!links?.length) return;

  const cRepo = m.getRepository(Commission);
  const aRepo = m.getRepository(AdhocCommittee);
  const sRepo = m.getRepository(SiuProclamation);

  for (const link of links) {
    let commissionId: string | null = null;
    let adhocId: string | null = null;
    let siuId: string | null = null;

    if (link.commission_slug) {
      const c = await cRepo.findOne({ where: { slug: link.commission_slug } });
      if (!c) {
        console.warn(
          `  ⚠ Commission "${link.commission_slug}" missing — skip SOE link (${link.relationship_type})`,
        );
        continue;
      }
      commissionId = c.id;
    }
    if (link.adhoc_committee_slug) {
      const a = await aRepo.findOne({ where: { slug: link.adhoc_committee_slug } });
      if (!a) {
        console.warn(
          `  ⚠ Ad hoc committee "${link.adhoc_committee_slug}" missing — skip SOE link (${link.relationship_type})`,
        );
        continue;
      }
      adhocId = a.id;
    }
    if (link.siu_proclamation_slug) {
      const s = await sRepo.findOne({ where: { slug: link.siu_proclamation_slug } });
      if (!s) {
        console.warn(
          `  ⚠ SIU proclamation "${link.siu_proclamation_slug}" missing — skip SOE link (${link.relationship_type})`,
        );
        continue;
      }
      siuId = s.id;
    }

    if (!commissionId && !adhocId && !siuId) continue;

    await lRepo.save(
      lRepo.create({
        state_entity_id: entityId,
        commission_id: commissionId,
        adhoc_committee_id: adhocId,
        siu_proclamation_id: siuId,
        accountability_body_id: null,
        relationship_type: link.relationship_type,
        summary: link.summary,
      }),
    );
  }
}

async function patchStoryStateEntity(
  m: EntityManager,
  storySlug: string,
  entityId: string,
): Promise<void> {
  const res = await m.getRepository(Story).update({ slug: storySlug }, { state_entity_id: entityId });
  if (!res.affected) {
    console.warn(`  ⚠ Story not found for state_entity patch: ${storySlug}`);
  } else {
    console.log(`  · Story ${storySlug} → state_entity`);
  }
}

async function patchStoriesBySiuProclamation(
  m: EntityManager,
  proclamationSlug: string,
  entityId: string,
): Promise<void> {
  const proc = await m.getRepository(SiuProclamation).findOne({ where: { slug: proclamationSlug } });
  if (!proc) {
    console.warn(`  ⚠ SIU proclamation missing — cannot patch stories: ${proclamationSlug}`);
    return;
  }
  const byFk = await m
    .getRepository(Story)
    .update({ siu_proclamation_id: proc.id }, { state_entity_id: entityId });
  let total = byFk.affected ?? 0;
  if (byFk.affected) {
    console.log(`  · ${byFk.affected} stor(y/ies) via siu_proclamation_id → ${proclamationSlug}`);
  }
  const bySlug = await m
    .getRepository(Story)
    .update({ slug: proclamationSlug }, { state_entity_id: entityId });
  total += bySlug.affected ?? 0;
  if (bySlug.affected) {
    console.log(`  · ${bySlug.affected} stor(y/ies) via slug match → ${proclamationSlug}`);
  }
  if (!total) {
    console.log(`  · No stories linked yet to ${proclamationSlug} (siu_proclamation_id / slug)`);
  }
}

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized ? AppDataSource : await AppDataSource.initialize();

  console.log('\n── Seeding: State-owned entities (SOEs) ──');

  try {
    await dataSource.transaction(async (m) => {
      const bySlug = new Map<string, StateEntity>();

      for (const seed of ENTITY_SEEDS) {
        const entity = await upsertEntity(m, seed);
        bySlug.set(seed.slug, entity);
        console.log(`  · Upserted state entity: ${entity.popular_name} (${entity.slug})`);

        if (seed.timeline?.length) {
          await refreshTimeline(m, entity.id, seed.timeline);
          console.log(`    → ${seed.timeline.length} timeline events`);
        } else {
          await m.getRepository(StateEntityTimeline).delete({ state_entity_id: entity.id });
        }

        await refreshCommissionLinks(m, entity.id, seed.commission_links);
      }

      const eskom = bySlug.get('eskom')!;
      const prasa = bySlug.get('prasa')!;
      const sassa = bySlug.get('sassa')!;
      const transnet = bySlug.get('transnet')!;
      const randWater = bySlug.get('rand-water')!;

      await patchStoryStateEntity(m, 'water-sector-r19bn-losses-2023-24', randWater.id);
      await patchStoryStateEntity(m, 'gauteng-sassa-r260m-fraud-2025', sassa.id);

      await patchStoriesBySiuProclamation(m, 'proclamation-r29-2019-eskom', eskom.id);
      await patchStoriesBySiuProclamation(m, 'proclamation-r27-2019-transnet-locomotives', transnet.id);
      await patchStoriesBySiuProclamation(m, 'proclamation-r25-2015-prasa', prasa.id);
      await patchStoriesBySiuProclamation(m, 'proclamation-r01-2019-sabc-hlaudi', bySlug.get('sabc')!.id);
      await patchStoriesBySiuProclamation(m, 'proclamation-r23-2017-sassa', sassa.id);
    });

    console.log('✓ State entities seed complete.\n');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  run().catch((err: unknown) => {
    console.error('\n✗ State entities seed failed:', err);
    process.exit(1);
  });
}
