import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SiuProclamation } from './siu_proclamation.entity';

/**
 * Lifecycle of a single Special Tribunal case.
 *
 * Mirrors how the Tribunal itself classifies matters. `appeal_pending`
 * is a separate state from `judgment_delivered` because Tribunal
 * judgments are appealable directly to the Supreme Court of Appeal —
 * "judgment delivered" doesn't necessarily mean the matter is closed.
 */
export enum TribunalCaseStatus {
  PENDING = 'pending',
  HEARING = 'hearing',
  JUDGMENT_DELIVERED = 'judgment_delivered',
  SETTLED = 'settled',
  WITHDRAWN = 'withdrawn',
  APPEAL_PENDING = 'appeal_pending',
}

/**
 * One civil case brought by the SIU in the Special Tribunal.
 *
 * Case numbers follow the Tribunal's own format `<province><nn>/<year>` —
 * e.g. `'GP01/2021'` (Gauteng case 1 of 2021), `'MP03/2021'`
 * (Mpumalanga case 3 of 2021). The slash is preserved verbatim because
 * that is how the case is cited in court papers; the controller layer
 * is responsible for accepting URL-safe variants.
 */
@Entity('special_tribunal_cases')
@Index('special_tribunal_cases_status_idx', ['status'])
@Index('special_tribunal_cases_proclamation_id_idx', ['proclamation_id'])
export class SpecialTribunalCase {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid' })
  proclamation_id!: string;

  @ManyToOne(() => SiuProclamation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proclamation_id' })
  proclamation!: SiuProclamation;

  @Index('special_tribunal_cases_case_number_uidx', { unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  case_number!: string;

  /**
   * Long-form case title — e.g.
   * `'Special Investigating Unit and SABC vs George Hlaudi Motsoeneng'`.
   */
  @Column({ type: 'varchar', length: 1000 })
  case_title!: string;

  /** Rand value of the civil claim, stored as bigint (whole rands). */
  @Column({ type: 'bigint', nullable: true })
  value_rands!: string | null;

  /**
   * Names of the entities / individuals being sued. Free-text array
   * (not FKs) because respondents include companies, trusts and
   * organs of state that we do not model as Person/Organisation rows.
   */
  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'::text[]",
  })
  respondents!: string[];

  /**
   * What the SIU is asking the Tribunal to do — e.g. "set aside the
   * 2018 PPE contract; recover R47m paid to Royal Bhaca Projects;
   * declare the directors delinquent under section 162 of the
   * Companies Act".
   */
  @Column({ type: 'text' })
  nature_of_claim!: string;

  @Column({ type: 'date', nullable: true })
  filed_date!: string | null;

  @Column({
    type: 'enum',
    enum: TribunalCaseStatus,
    enumName: 'tribunal_case_status',
    default: TribunalCaseStatus.PENDING,
  })
  status!: TribunalCaseStatus;

  @Column({ type: 'text', nullable: true })
  outcome_summary!: string | null;

  /** Rand value actually recovered from this case (whole rands). */
  @Column({ type: 'bigint', nullable: true })
  amount_recovered_rands!: string | null;

  @Column({ type: 'date', nullable: true })
  judgment_date!: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  judgment_url!: string | null;

  @Column({ type: 'text', nullable: true })
  plain_english_outcome!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
