import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { Commission } from './commission.entity';
import { HistoricalEra } from './historical-era.entity';
import { HistoricalLaw } from './historical-law.entity';
import { Law } from './law.entity';
import { Person } from './person.entity';
import { Story } from './story.entity';

export enum HistoricalEventType {
  FOUNDING = 'founding',
  LAW_ENACTED = 'law_enacted',
  LAW_REPEALED = 'law_repealed',
  DISPOSSESSION = 'dispossession',
  RESISTANCE = 'resistance',
  MASSACRE = 'massacre',
  NEGOTIATION = 'negotiation',
  ELECTION = 'election',
  ECONOMIC = 'economic',
  SOCIAL = 'social',
  LIBERATION = 'liberation',
  ASSASSINATION = 'assassination',
}

export enum HistoricalEventSignificance {
  FOUNDATIONAL = 'foundational',
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
}

@Entity('historical_events')
@Index('historical_events_era_year_idx', ['era_id', 'year'])
@Index('historical_events_type_idx', ['event_type'])
export class HistoricalEvent {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid', name: 'era_id' })
  era_id!: string;

  @ManyToOne(() => HistoricalEra, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'era_id' })
  era!: HistoricalEra;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'year_display' })
  year_display!: string | null;

  @Column({
    type: 'enum',
    enum: HistoricalEventType,
    enumName: 'historical_event_type',
    name: 'event_type',
  })
  event_type!: HistoricalEventType;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', name: 'plain_english_child' })
  plain_english_child!: string;

  @Column({
    type: 'enum',
    enum: HistoricalEventSignificance,
    enumName: 'historical_event_significance',
    default: HistoricalEventSignificance.HIGH,
  })
  significance!: HistoricalEventSignificance;

  @Column({ type: 'boolean', default: true, name: 'is_verified' })
  is_verified!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'source_attribution' })
  source_attribution!: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'related_law_id' })
  related_law_id!: string | null;

  @ManyToOne(() => Law, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'related_law_id' })
  related_law!: Law | null;

  @Column({ type: 'uuid', nullable: true, name: 'related_historical_law_id' })
  related_historical_law_id!: string | null;

  @ManyToOne(() => HistoricalLaw, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'related_historical_law_id' })
  related_historical_law!: HistoricalLaw | null;

  @Column({ type: 'uuid', nullable: true, name: 'related_commission_id' })
  related_commission_id!: string | null;

  @ManyToOne(() => Commission, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'related_commission_id' })
  related_commission!: Commission | null;

  @Column({ type: 'uuid', nullable: true, name: 'related_person_id' })
  related_person_id!: string | null;

  @ManyToOne(() => Person, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'related_person_id' })
  related_person!: Person | null;

  @Column({ type: 'uuid', nullable: true, name: 'related_story_id' })
  related_story_id!: string | null;

  @ManyToOne(() => Story, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'related_story_id' })
  related_story!: Story | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
