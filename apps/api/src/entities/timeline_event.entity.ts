import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Story } from './story.entity';

export enum EventType {
  INCIDENT = 'incident',
  PRESS_CONFERENCE = 'press_conference',
  ARREST = 'arrest',
  CHARGE_FILED = 'charge_filed',
  COMMISSION_ESTABLISHED = 'commission_established',
  HEARING = 'hearing',
  JUDGMENT = 'judgment',
  SUSPENSION = 'suspension',
  RESIGNATION = 'resignation',
  STATEMENT = 'statement',
  ACQUITTAL = 'acquittal',
  OTHER = 'other',
}

export enum EventSignificance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('timeline_events')
@Index('timeline_events_story_date_idx', ['story_id', 'event_date'])
@Index('timeline_events_event_type_idx', ['event_type'])
export class TimelineEvent {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('timeline_events_story_id_idx')
  @Column({ type: 'uuid' })
  story_id!: string;

  @ManyToOne(() => Story, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story!: Story;

  /** ISO date string (YYYY-MM-DD). Postgres `date` type — no time component. */
  @Column({ type: 'date' })
  event_date!: string;

  @Column({
    type: 'enum',
    enum: EventType,
    enumName: 'timeline_event_type',
  })
  event_type!: EventType;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  /** Child-level plain-English explanation of what happened in this event. */
  @Column({ type: 'text' })
  plain_english!: string;

  @Column({
    type: 'enum',
    enum: EventSignificance,
    enumName: 'timeline_event_significance',
    default: EventSignificance.MEDIUM,
  })
  significance!: EventSignificance;

  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'::text[]",
  })
  source_urls!: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
