import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TransformationPolicyStatus {
  ACTIVE = 'active',
  AMENDED = 'amended',
  CHALLENGED = 'challenged',
  PARTIALLY_STRUCK = 'partially_struck',
  REPEALED = 'repealed',
}

/**
 * Major legislative / policy threads that are not commissions of inquiry
 * but deserve the same structured explainer treatment (history, law, debate).
 */
@Entity('transformation_policies')
@Index('transformation_policies_slug_uidx', { unique: true })
export class TransformationPolicy {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  abbreviation!: string | null;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug!: string;

  /** e.g. enabling Act citation(s). */
  @Column({ type: 'varchar', length: 300, nullable: true })
  enabling_act!: string | null;

  @Column({
    type: 'enum',
    enum: TransformationPolicyStatus,
    enumName: 'transformation_policy_status',
  })
  status!: TransformationPolicyStatus;

  @Column({ type: 'text' })
  purpose_summary!: string;

  @Column({ type: 'text' })
  plain_english_child!: string;

  @Column({ type: 'text' })
  plain_english_layperson!: string;

  @Column({ type: 'text' })
  plain_english_legal!: string;

  @Column({ type: 'text' })
  historical_context!: string;

  @Column({ type: 'text' })
  arguments_for!: string;

  @Column({ type: 'text' })
  arguments_against!: string;

  @Column({ type: 'text', nullable: true })
  current_legal_challenges!: string | null;

  @Column({ type: 'text' })
  impact_on_ordinary_people!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
