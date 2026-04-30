import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Classification of a statutory or operational accountability unit that is
 * neither a commission of inquiry nor the SIU — e.g. Scorpions, Hawks, AFU.
 */
export enum AccountabilityBodyType {
  INVESTIGATIVE_UNIT = 'investigative_unit',
  PROSECUTORIAL_UNIT = 'prosecutorial_unit',
  ASSET_RECOVERY_UNIT = 'asset_recovery_unit',
  OVERSIGHT_BODY = 'oversight_body',
  HYBRID = 'hybrid',
}

export enum AccountabilityBodyStatus {
  ACTIVE = 'active',
  DISBANDED = 'disbanded',
  RESTRUCTURED = 'restructured',
  ABSORBED = 'absorbed',
}

/** One leadership row inside {@link AccountabilityBody.leadership_history} JSONB. */
export interface AccountabilityBodyLeadershipEntry {
  name: string;
  title: string;
  period_start: string | null;
  period_end: string | null;
}

/**
 * Special police / prosecutorial / asset-recovery units with their own lifecycle,
 * mandate text, and measurable outcomes — distinct from commissions and SIU.
 */
@Entity('accountability_bodies')
export class AccountabilityBody {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  popular_name!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  abbreviation!: string;

  @Index('accountability_bodies_slug_uidx', { unique: true })
  @Column({ type: 'varchar', length: 200, unique: true })
  slug!: string;

  @Column({
    type: 'enum',
    enum: AccountabilityBodyType,
    enumName: 'accountability_body_type',
  })
  body_type!: AccountabilityBodyType;

  @Column({ type: 'varchar', length: 200, nullable: true })
  parent_organisation!: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  enabling_legislation!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  constitution_section!: string | null;

  @Column({
    type: 'enum',
    enum: AccountabilityBodyStatus,
    enumName: 'accountability_body_status',
  })
  status!: AccountabilityBodyStatus;

  @Column({ type: 'date' })
  established_date!: string;

  @Column({ type: 'date', nullable: true })
  announced_date!: string | null;

  @Column({ type: 'date', nullable: true })
  operational_date!: string | null;

  @Column({ type: 'date', nullable: true })
  disbanded_date!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  replaced_by!: string | null;

  @Column({ type: 'text', nullable: true })
  disbanded_reason!: string | null;

  @Column({ type: 'text' })
  mandate_summary!: string;

  @Column({ type: 'text' })
  plain_english_summary!: string;

  @Column({ type: 'text' })
  plain_english_child!: string;

  @Column({ type: 'text', nullable: true })
  tactics!: string | null;

  @Column({ type: 'text', nullable: true })
  distinguishing_features!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  leadership_history!: AccountabilityBodyLeadershipEntry[] | null;

  @Column({ type: 'int', nullable: true })
  total_investigations!: number | null;

  @Column({ type: 'int', nullable: true })
  total_prosecutions!: number | null;

  @Column({ type: 'int', nullable: true })
  total_convictions!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  conviction_rate_percentage!: string | null;

  @Column({ type: 'int', nullable: true })
  total_arrests!: number | null;

  @Column({ type: 'bigint', nullable: true })
  assets_seized_rands!: string | null;

  @Column({ type: 'bigint', nullable: true })
  financial_losses_recovered_rands!: string | null;

  @Column({ type: 'int', nullable: true })
  cases_transferred_on_dissolution!: number | null;

  @Column({ type: 'int', nullable: true })
  staff_count_at_peak!: number | null;

  @Column({ type: 'bigint', nullable: true })
  annual_budget_rands!: string | null;

  @Column({ type: 'text', nullable: true })
  legacy_summary!: string | null;

  @Column({ type: 'text', nullable: true })
  cases_outcome_after_transfer!: string | null;

  @Column({ type: 'boolean', nullable: true })
  was_political_disbanding!: boolean | null;

  @Column({ type: 'text', nullable: true })
  political_disbanding_evidence!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
