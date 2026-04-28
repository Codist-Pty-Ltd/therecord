import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SiuProclamation } from './siu_proclamation.entity';

/**
 * The financial + referral outcome of one SIU proclamation.
 *
 * This table holds the only data in the entire schema that answers the
 * question South African readers most want answered: *did we get any of
 * the money back, and what happened to the people responsible?* All
 * monetary fields are stored as bigint cents-scaled rands (i.e. the
 * literal Rand value as an integer; "R389 million" → `389_000_000`).
 *
 * Modelled as a OneToOne with {@link SiuProclamation} so a single
 * proclamation has at most one outcome row — outcomes are amended in
 * place over time as the SIU updates its figures, not appended.
 */
@Entity('siu_investigation_outcomes')
export class SiuInvestigationOutcome {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  /**
   * UNIQUE FK back to the proclamation — enforced both by the column
   * uniqueness here and by a database-level UNIQUE constraint declared
   * in the migration. There is exactly one outcome record per proclamation.
   */
  @Index('siu_investigation_outcomes_proclamation_id_uidx', { unique: true })
  @Column({ type: 'uuid' })
  proclamation_id!: string;

  @OneToOne(() => SiuProclamation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proclamation_id' })
  proclamation!: SiuProclamation;

  // ----------------------------------------------------------- financial
  //
  // All values are ZAR (South African Rands) stored as bigint. We accept
  // bigint over numeric(15,2) because every figure the SIU publishes is
  // rounded to whole rands in their annual reports — there is no kobo /
  // cent precision to preserve.

  /** Total Rand value of contracts/transactions investigated. */
  @Column({ type: 'bigint', nullable: true })
  total_value_investigated!: string | null;

  /** Confirmed irregular / fruitless / wasteful expenditure identified. */
  @Column({ type: 'bigint', nullable: true })
  financial_losses_identified!: string | null;

  /** Cash plus the value of assets actually recovered. */
  @Column({ type: 'bigint', nullable: true })
  actual_recovered_rands!: string | null;

  /** Future losses prevented (contracts cancelled before payment). */
  @Column({ type: 'bigint', nullable: true })
  losses_prevented_rands!: string | null;

  /** Total value of matters enrolled in the Special Tribunal. */
  @Column({ type: 'bigint', nullable: true })
  civil_litigation_value_rands!: string | null;

  /** Value of contracts declared invalid by the Tribunal or High Court. */
  @Column({ type: 'bigint', nullable: true })
  contracts_set_aside_value!: string | null;

  // ------------------------------------------------------------- referrals
  //
  // The SIU itself cannot prosecute or discipline. These counters track
  // the three downstream chains: NPA (criminal prosecution), Hawks
  // (criminal investigation), and departmental heads (administrative
  // discipline).

  @Column({ type: 'integer', default: 0 })
  referrals_to_npa!: number;

  @Column({ type: 'integer', default: 0 })
  referrals_to_hawks!: number;

  @Column({ type: 'integer', default: 0 })
  referrals_to_departments!: number;

  @Column({ type: 'integer', default: 0 })
  employees_referred_disciplinary!: number;

  @Column({ type: 'integer', default: 0 })
  employees_dismissed!: number;

  @Column({ type: 'integer', default: 0 })
  special_tribunal_cases_filed!: number;

  // ------------------------------------------------------------- narrative

  /** Editorial summary of what the SIU found. */
  @Column({ type: 'text', nullable: true })
  outcome_summary!: string | null;

  /**
   * Child-level outcome paragraph — e.g. "Of the R1 billion stolen, we
   * got R389 million back. Three officials were dismissed; two are
   * being prosecuted by the NPA."
   */
  @Column({ type: 'text', nullable: true })
  plain_english_outcome!: string | null;

  /** Date the SIU report was submitted to the President. */
  @Column({ type: 'date', nullable: true })
  report_submitted_date!: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  report_url!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
