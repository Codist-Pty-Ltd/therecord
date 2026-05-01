import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { StateEntity } from './state-entity.entity';

export enum StateEntityTimelineEventType {
  ESTABLISHED = 'established',
  MAJOR_ACHIEVEMENT = 'major_achievement',
  FINANCIAL_CRISIS = 'financial_crisis',
  CORRUPTION_EXPOSED = 'corruption_exposed',
  BAILOUT_RECEIVED = 'bailout_received',
  LEADERSHIP_CHANGE = 'leadership_change',
  RESTRUCTURING = 'restructuring',
  SERVICE_COLLAPSE = 'service_collapse',
  LEGAL_ACTION = 'legal_action',
  POLICY_CHANGE = 'policy_change',
  PRIVATISATION_MOVE = 'privatisation_move',
  RECOVERY = 'recovery',
}

export enum StateEntityTimelineSignificance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('state_entity_timeline')
@Index('state_entity_timeline_entity_year_idx', ['state_entity_id', 'year'])
@Index('state_entity_timeline_event_type_idx', ['event_type'])
export class StateEntityTimeline {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('state_entity_timeline_state_entity_id_idx')
  @Column({ type: 'uuid' })
  state_entity_id!: string;

  @ManyToOne(() => StateEntity, (e) => e.timeline_entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'state_entity_id' })
  state_entity!: StateEntity;

  @Column({ type: 'int' })
  year!: number;

  @Column({
    type: 'enum',
    enum: StateEntityTimelineEventType,
    enumName: 'state_entity_timeline_event_type',
  })
  event_type!: StateEntityTimelineEventType;

  @Column({ type: 'varchar', length: 300 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  plain_english!: string | null;

  @Column({ type: 'bigint', nullable: true })
  amount_rands!: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  source_url!: string | null;

  @Column({
    type: 'enum',
    enum: StateEntityTimelineSignificance,
    enumName: 'state_entity_timeline_significance',
    default: StateEntityTimelineSignificance.MEDIUM,
  })
  significance!: StateEntityTimelineSignificance;

  @Column({ type: 'varchar', length: 200, nullable: true })
  related_commission_slug!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  related_siu_proclamation_slug!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  related_story_slug!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
