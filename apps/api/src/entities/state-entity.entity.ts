import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { StateEntityCommissionLink } from './state-entity-commission-link.entity';
import { StateEntityTimeline } from './state-entity-timeline.entity';

/** PFMA schedule bucket — major SOEs vs other public entities. */
export enum StateEntityPfmaSchedule {
  SCHEDULE_2 = 'schedule_2',
  SCHEDULE_3A = 'schedule_3a',
  SCHEDULE_3B = 'schedule_3b',
  SCHEDULE_3C = 'schedule_3c',
  SCHEDULE_3D = 'schedule_3d',
}

export enum StateEntitySector {
  ENERGY = 'energy',
  TRANSPORT_RAIL = 'transport_rail',
  TRANSPORT_AIR = 'transport_air',
  TRANSPORT_ROAD = 'transport_road',
  LOGISTICS_PORTS = 'logistics_ports',
  COMMUNICATIONS = 'communications',
  BROADCASTING = 'broadcasting',
  FINANCE_DEVELOPMENT = 'finance_development',
  FINANCE_GRANTS = 'finance_grants',
  WATER = 'water',
  DEFENCE = 'defence',
  RESEARCH = 'research',
  EDUCATION_FUNDING = 'education_funding',
  HEALTHCARE = 'healthcare',
  FORESTRY_AGRICULTURE = 'forestry_agriculture',
  OTHER = 'other',
}

export enum StateEntityStatus {
  OPERATIONAL = 'operational',
  BUSINESS_RESCUE = 'business_rescue',
  RESTRUCTURING = 'restructuring',
  PARTIALLY_PRIVATISED = 'partially_privatised',
  DISSOLVED = 'dissolved',
  MERGED = 'merged',
  DORMANT = 'dormant',
}

export enum StateEntityFinancialHealth {
  HEALTHY = 'healthy',
  UNDER_PRESSURE = 'under_pressure',
  DISTRESSED = 'distressed',
  INSOLVENT = 'insolvent',
  UNKNOWN = 'unknown',
}

export enum StateEntityPrivatisationStatus {
  NOT_DISCUSSED = 'not_discussed',
  UNDER_DEBATE = 'under_debate',
  PARTIAL_PRIVATISATION_UNDERWAY = 'partial_privatisation_underway',
  FULLY_PRIVATISED = 'fully_privatised',
  GOVERNMENT_COMMITTED_AGAINST = 'government_committed_against',
}

@Entity('state_entities')
@Index('state_entities_sector_idx', ['sector'])
@Index('state_entities_status_idx', ['status'])
@Index('state_entities_impact_sector_slug_idx', ['primary_impact_sector_slug'])
export class StateEntity {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  popular_name!: string;

  @Column({ type: 'varchar', length: 20 })
  abbreviation!: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug!: string;

  @Column({
    type: 'enum',
    enum: StateEntitySector,
    enumName: 'state_entity_sector',
  })
  sector!: StateEntitySector;

  @Column({
    type: 'enum',
    enum: StateEntityPfmaSchedule,
    enumName: 'state_entity_pfma_schedule',
    nullable: true,
  })
  pfma_schedule!: StateEntityPfmaSchedule | null;

  @Column({
    type: 'enum',
    enum: StateEntityStatus,
    enumName: 'state_entity_status',
    default: StateEntityStatus.OPERATIONAL,
  })
  status!: StateEntityStatus;

  @Column({ type: 'int' })
  established_year!: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  established_by!: string | null;

  @Column({ type: 'text' })
  purpose_original!: string;

  @Column({ type: 'text' })
  purpose_plain_english!: string;

  @Column({ type: 'text' })
  why_it_matters_to_ordinary_people!: string;

  @Column({ type: 'text', nullable: true })
  current_mandate_summary!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  current_ceo!: string | null;

  @Column({ type: 'varchar', length: 200 })
  supervising_ministry!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: '100.00' })
  government_ownership_percentage!: string;

  @Column({ type: 'bigint', nullable: true })
  latest_annual_loss_rands!: string | null;

  @Column({ type: 'bigint', nullable: true })
  total_debt_rands!: string | null;

  @Column({ type: 'bigint', nullable: true })
  total_bailouts_received_rands!: string | null;

  @Column({ type: 'bigint', nullable: true })
  annual_budget_rands!: string | null;

  @Column({
    type: 'enum',
    enum: StateEntityFinancialHealth,
    enumName: 'state_entity_financial_health',
    default: StateEntityFinancialHealth.UNKNOWN,
  })
  financial_health!: StateEntityFinancialHealth;

  @Column({ type: 'varchar', length: 10, nullable: true })
  financial_health_year!: string | null;

  @Column({ type: 'int', nullable: true })
  health_score!: number | null;

  @Column({ type: 'text', nullable: true })
  health_score_rationale!: string | null;

  @Column({ type: 'boolean', default: false })
  is_in_crisis!: boolean;

  @Column({ type: 'text', nullable: true })
  crisis_summary!: string | null;

  @Column({ type: 'text', nullable: true })
  privatisation_debate!: string | null;

  @Column({
    type: 'enum',
    enum: StateEntityPrivatisationStatus,
    enumName: 'state_entity_privatisation_status',
    default: StateEntityPrivatisationStatus.NOT_DISCUSSED,
  })
  privatisation_status!: StateEntityPrivatisationStatus;

  /** Editorial link to {@link ImpactSector.slug} (human-impact layer). */
  @Column({ type: 'varchar', length: 50 })
  primary_impact_sector_slug!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => StateEntityTimeline, (t) => t.state_entity)
  timeline_entries!: StateEntityTimeline[];

  @OneToMany(() => StateEntityCommissionLink, (l) => l.state_entity)
  commission_links!: StateEntityCommissionLink[];
}
