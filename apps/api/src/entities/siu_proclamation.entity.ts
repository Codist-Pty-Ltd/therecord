import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdhocCommittee } from './adhoc_committee.entity';
import { Commission, CommissionDomain } from './commission.entity';
import { SiuProclamationLawSection } from './siu_proclamation_law_section.entity';

/**
 * Lifecycle of an SIU investigation.
 *
 * Distinct from {@link CommissionStatus} on purpose — proclamations have
 * a fourth post-conclusion stage that commissions don't: the SIU's report
 * can be submitted while *civil litigation in the Special Tribunal still
 * runs for years afterwards* (Digital Vibes is the canonical example).
 */
export enum ProclamationStatus {
  /** Investigation ongoing, evidence still being gathered. */
  ACTIVE = 'active',
  /** SIU completed the investigative work. */
  CONCLUDED = 'concluded',
  /** Final report submitted to the President; departmental actions pending. */
  REPORT_SUBMITTED = 'report_submitted',
  /**
   * Investigation concluded but Special Tribunal / High Court matters
   * are still being litigated (asset recovery, contract cancellation).
   */
  LITIGATION_ONGOING = 'litigation_ongoing',
}

/**
 * A Presidential Proclamation activating an SIU investigation.
 *
 * Each proclamation has a unique number (e.g. `R23 of 2020` for the COVID
 * PPE investigation). One proclamation can cover multiple state institutions
 * and span multiple years; it is the authoritative *trigger document* for
 * everything the SIU subsequently does on a matter.
 *
 * Cross-link policy:
 *   • {@link related_commission_id} is set when the proclamation followed
 *     directly from a commission of inquiry's findings (e.g. Transnet
 *     proclamations downstream of the Zondo Commission).
 *   • {@link related_adhoc_committee_id} is set when an ad hoc committee
 *     ran in parallel on the same matter.
 *   • Either can be null — many proclamations stand alone (PPE, Digital
 *     Vibes were activated without a prior commission).
 */
@Entity('siu_proclamations')
@Index('siu_proclamations_status_idx', ['status'])
@Index('siu_proclamations_domain_idx', ['domain'])
@Index('siu_proclamations_signed_date_idx', ['signed_date'])
@Index('siu_proclamations_related_commission_id_idx', ['related_commission_id'])
@Index('siu_proclamations_related_adhoc_committee_id_idx', [
  'related_adhoc_committee_id',
])
export class SiuProclamation {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  /**
   * Gazetted proclamation number — e.g. `'R23 of 2020'`, `'R228 of 2024'`.
   * Stored verbatim (with the `R` prefix and the year) because that is
   * how the document is cited in court papers and SIU annual reports.
   */
  @Column({ type: 'varchar', length: 50 })
  proclamation_number!: string;

  /** URL-safe handle — e.g. `'proclamation-r23-2020-ppe'`. */
  @Index('siu_proclamations_slug_uidx', { unique: true })
  @Column({ type: 'varchar', length: 200, unique: true })
  slug!: string;

  /** Editorial title — what The Record calls this proclamation. */
  @Column({ type: 'varchar', length: 500 })
  title!: string;

  /** Verbatim title from the Government Gazette. */
  @Column({ type: 'varchar', length: 2000, nullable: true })
  full_title!: string | null;

  /** Government Gazette number the proclamation appeared in. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  gazette_number!: string | null;

  /** Date the President signed the proclamation. */
  @Column({ type: 'date', nullable: true })
  signed_date!: string | null;

  /** Date the proclamation was published in the Government Gazette. */
  @Column({ type: 'date', nullable: true })
  published_date!: string | null;

  /**
   * Reuses the same 11-value taxonomy as {@link Commission}/{@link AdhocCommittee}
   * so that SIU proclamations can be cross-listed with executive and
   * legislative oversight under a single domain chip on the frontend.
   */
  @Column({
    type: 'enum',
    enum: CommissionDomain,
    enumName: 'commission_domain',
  })
  domain!: CommissionDomain;

  /** What institutions / contracts / time periods are being investigated. */
  @Column({ type: 'text' })
  investigation_scope!: string;

  /**
   * Child-level paragraph — what was being stolen, from whom, and over
   * what period. This is the line that powers the "explain it to me"
   * panel on the frontend.
   */
  @Column({ type: 'text' })
  plain_english_summary!: string;

  /** Name of the President who signed — e.g. `'Cyril Ramaphosa'`. */
  @Column({ type: 'varchar', length: 200 })
  president_who_signed!: string;

  /** Earliest date of conduct being investigated. */
  @Column({ type: 'date', nullable: true })
  period_covered_start!: string | null;

  /** Latest date of conduct being investigated. */
  @Column({ type: 'date', nullable: true })
  period_covered_end!: string | null;

  @Column({
    type: 'enum',
    enum: ProclamationStatus,
    enumName: 'proclamation_status',
    default: ProclamationStatus.ACTIVE,
  })
  status!: ProclamationStatus;

  /**
   * Optional FK to a {@link Commission} whose findings triggered this
   * proclamation (Zondo → Transnet, Bosasa, etc.). Nullable — most
   * proclamations stand alone.
   *
   * ON DELETE SET NULL: if the commission is removed, the proclamation
   * survives as an independent SIU record.
   */
  @Column({ type: 'uuid', nullable: true })
  related_commission_id!: string | null;

  @ManyToOne(() => Commission, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'related_commission_id' })
  related_commission!: Commission | null;

  /**
   * Optional FK to an {@link AdhocCommittee} running in parallel on the
   * same matter. Nullable — most proclamations don't have a paired
   * legislative inquiry.
   *
   * ON DELETE SET NULL: same rationale as {@link related_commission_id}.
   */
  @Column({ type: 'uuid', nullable: true })
  related_adhoc_committee_id!: string | null;

  @ManyToOne(() => AdhocCommittee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'related_adhoc_committee_id' })
  related_adhoc_committee!: AdhocCommittee | null;

  /** Link to the gazetted proclamation PDF, if available. */
  @Column({ type: 'varchar', length: 2000, nullable: true })
  official_url!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(
    () => SiuProclamationLawSection,
    (link) => link.proclamation,
  )
  law_section_links!: SiuProclamationLawSection[];
}
