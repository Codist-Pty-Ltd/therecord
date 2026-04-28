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
import { Commission, CommissionDomain } from './commission.entity';

/**
 * What kind of work the committee was struck to do. Deliberately distinct
 * from {@link CommissionDomain} / {@link CommissionStatus} — an ad hoc
 * committee can be created to process a bill (no wrongdoing alleged) or
 * to investigate misconduct (the SABC, Nkandla, Mkhwanazi cases), and the
 * two situations have materially different editorial framing.
 */
export enum AdhocCommitteeCategory {
  /** Investigating alleged wrongdoing by office-bearers / state organs. */
  ACCOUNTABILITY = 'accountability',
  /** Ad hoc committee convened to amend the Constitution (s74 process). */
  CONSTITUTIONAL_AMENDMENT = 'constitutional_amendment',
  /** Processing a bill — Secrecy Bill, Party Funding Act. */
  LEGISLATION = 'legislation',
  /** Filling Chapter 9 institution seats (Public Protector, IEC, HRC, etc.). */
  APPOINTMENTS = 'appointments',
  /** Response to a national disaster (KZN floods, COVID, etc.). */
  DISASTER_RESPONSE = 'disaster_response',
  /** General oversight not fitting the categories above. */
  OVERSIGHT = 'oversight',
  OTHER = 'other',
}

export enum AdhocCommitteeStatus {
  /** Currently sitting, taking evidence, or debating. */
  ACTIVE = 'active',
  /** Finished work and reported. */
  CONCLUDED = 'concluded',
  /**
   * Mandate expired because Parliament was dissolved before the committee
   * could report. Distinct from CONCLUDED — nothing was delivered.
   */
  LAPSED = 'lapsed',
  /** Mandate explicitly completed and the committee wound itself up. */
  MANDATE_COMPLETED = 'mandate_completed',
}

/**
 * A Parliamentary Ad Hoc Committee as a first-class entity.
 *
 * This is the LEGISLATIVE branch's answer to a {@link Commission} of inquiry
 * (which is an EXECUTIVE instrument under s84(2)(f) + the Commissions Act).
 *
 * Why they must live in their own table:
 *   • Established by the National Assembly under s55(2) of the Constitution
 *     and NA Rules (Rule 253), not by the President.
 *   • Outputs a report to the National Assembly, not to the President.
 *   • Ceases to exist on the dissolution of Parliament (unlike commissions,
 *     which survive across Parliaments until their mandate is complete).
 *   • Not governed by the Commissions Act 8 of 1947.
 *
 * A story can be linked to BOTH a commission and an ad hoc committee when
 * the executive and the legislature run parallel inquiries on the same
 * matter — Mkhwanazi is the canonical example (Madlanga Commission +
 * Parliamentary Ad Hoc Committee on the same allegations).
 */
@Entity('adhoc_committees')
@Index('adhoc_committees_domain_idx', ['domain'])
@Index('adhoc_committees_status_idx', ['status'])
@Index('adhoc_committees_parliament_term_idx', ['parliament_term'])
export class AdhocCommittee {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  /** Everyday name — e.g. `'Nkandla Ad Hoc Committee'`, `'Mkhwanazi Ad Hoc Committee'`. */
  @Column({ type: 'varchar', length: 200 })
  popular_name!: string;

  /**
   * Full formal name as it appears in the NA order paper — e.g.
   * `'Ad Hoc Committee on Police Minister's Report on the Security
   *   Upgrades at the President's Private Home'`.
   */
  @Column({ type: 'varchar', length: 1000 })
  full_name!: string;

  @Index('adhoc_committees_slug_uidx', { unique: true })
  @Column({ type: 'varchar', length: 300, unique: true })
  slug!: string;

  /** Which Parliament struck the committee — e.g. `'5th Parliament'`. */
  @Column({ type: 'varchar', length: 50, nullable: true })
  parliament_term!: string | null;

  /** Year span of that Parliament — e.g. `'2014-2019'`, `'2024-2029'`. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  parliament_years!: string | null;

  /**
   * Reuses {@link CommissionDomain} on purpose — the same taxonomy that
   * powers the /commissions and /stories pages also filters committees so
   * the frontend can cross-list executive and legislative oversight side
   * by side under a single domain chip (e.g. "Policing").
   */
  @Column({
    type: 'enum',
    enum: CommissionDomain,
    enumName: 'commission_domain',
  })
  domain!: CommissionDomain;

  @Column({
    type: 'enum',
    enum: AdhocCommitteeCategory,
    enumName: 'adhoc_committee_category',
  })
  category!: AdhocCommitteeCategory;

  /** The body that struck the committee. Defaults to the National Assembly. */
  @Column({ type: 'varchar', length: 200, default: 'National Assembly' })
  established_by!: string;

  /**
   * The NA / Joint Rule under which the committee was established — e.g.
   * `'National Assembly Rule 253'` or `'Joint Rule 138'` for joint committees.
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  enabling_provision!: string | null;

  /** True for joint committees that include both NA and NCOP members. */
  @Column({ type: 'boolean', default: false })
  is_joint_committee!: boolean;

  @Column({ type: 'varchar', length: 300, nullable: true })
  chair_name!: string | null;

  /** Editorial summary of what the committee was asked to do. */
  @Column({ type: 'text' })
  mandate_summary!: string;

  /** Child-level explanation — same paragraph a 10-year-old could follow. */
  @Column({ type: 'text' })
  plain_english_summary!: string;

  @Column({ type: 'date', nullable: true })
  announced_date!: string | null;

  @Column({ type: 'date', nullable: true })
  first_meeting_date!: string | null;

  @Column({ type: 'date', nullable: true })
  concluded_date!: string | null;

  @Column({ type: 'date', nullable: true })
  report_adopted_date!: string | null;

  @Column({
    type: 'enum',
    enum: AdhocCommitteeStatus,
    enumName: 'adhoc_committee_status',
    default: AdhocCommitteeStatus.ACTIVE,
  })
  status!: AdhocCommitteeStatus;

  @Column({ type: 'text', nullable: true })
  outcome_summary!: string | null;

  /** Did the committee's work end in a law change? Null until reported. */
  @Column({ type: 'boolean', nullable: true })
  produced_legislative_change!: boolean | null;

  /** Did anyone face consequences (resignation, censure, dismissal)? */
  @Column({ type: 'boolean', nullable: true })
  produced_accountability_action!: boolean | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  report_url!: string | null;

  /** parliament.gov.za link to the committee's landing page. */
  @Column({ type: 'varchar', length: 2000, nullable: true })
  parliament_url!: string | null;

  /**
   * When the legislature and the executive are investigating the SAME
   * matter, this is the back-link from the committee to the paired
   * commission (many-to-one: one commission can have several ad hoc
   * committees overlaying it over time).
   *
   * ON DELETE SET NULL: if the commission record is removed, the ad hoc
   * committee survives as a standalone legislative record.
   */
  @Index('adhoc_committees_related_commission_id_idx')
  @Column({ type: 'uuid', nullable: true })
  related_commission_id!: string | null;

  @ManyToOne(() => Commission, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'related_commission_id' })
  related_commission!: Commission | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
