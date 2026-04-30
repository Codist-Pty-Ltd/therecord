import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { AccountabilityBody } from './accountability-body.entity';
import { Story } from './story.entity';

export enum AccountabilityBodyCaseOutcome {
  CONVICTED = 'convicted',
  ACQUITTED = 'acquitted',
  CHARGES_WITHDRAWN = 'charges_withdrawn',
  TRANSFERRED_TO_HAWKS = 'transferred_to_hawks',
  TRANSFERRED_TO_NPA = 'transferred_to_npa',
  STILL_PENDING = 'still_pending',
  DIED_BEFORE_VERDICT = 'died_before_verdict',
  FLED_JURISDICTION = 'fled_jurisdiction',
  NEVER_CHARGED = 'never_charged',
  PLEA_DEAL = 'plea_deal',
}

export enum AccountabilityBodyCaseSignificance {
  LANDMARK = 'landmark',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * A notable prosecution handled by an {@link AccountabilityBody}, with optional
 * link to a {@link Story} when the matter is tracked as a thread on The Record.
 */
@Entity('accountability_body_cases')
@Index('accountability_body_cases_body_id_idx', ['body_id'])
@Index('accountability_body_cases_story_id_idx', ['story_id'])
export class AccountabilityBodyCase {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid' })
  body_id!: string;

  @ManyToOne(() => AccountabilityBody, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'body_id' })
  body!: AccountabilityBody;

  @Column({ type: 'uuid', nullable: true })
  story_id!: string | null;

  @ManyToOne(() => Story, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'story_id' })
  story!: Story | null;

  @Column({ type: 'varchar', length: 300 })
  case_name!: string;

  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'::text[]",
  })
  accused_names!: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  charge_summary!: string | null;

  @Column({ type: 'int' })
  case_year_start!: number;

  @Column({ type: 'int', nullable: true })
  case_year_end!: number | null;

  @Column({
    type: 'enum',
    enum: AccountabilityBodyCaseOutcome,
    enumName: 'accountability_body_case_outcome',
  })
  outcome!: AccountabilityBodyCaseOutcome;

  @Column({ type: 'text', nullable: true })
  outcome_detail!: string | null;

  @Column({
    type: 'enum',
    enum: AccountabilityBodyCaseSignificance,
    enumName: 'accountability_body_case_significance',
    default: AccountabilityBodyCaseSignificance.MEDIUM,
  })
  significance!: AccountabilityBodyCaseSignificance;

  @Column({ type: 'bigint', nullable: true })
  value_rands!: string | null;

  @Column({ type: 'text', nullable: true })
  plain_english!: string | null;

  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'::text[]",
  })
  law_sections_applied!: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
