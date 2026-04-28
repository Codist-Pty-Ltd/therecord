import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Domain of public life a commission sits in. Superset of {@link StoryDomain}
 * because commissions can probe areas that are not themselves a "story beat"
 * on The Record (e.g. the TRC was a human-rights inquiry, the Myeni /
 * Mpati commissions were financial, the Zondo commission straddled several).
 */
export enum CommissionDomain {
  CRIMINAL_JUSTICE = 'criminal_justice',
  POLITICS = 'politics',
  ORGANISED_CRIME = 'organised_crime',
  BUSINESS = 'business',
  LABOUR = 'labour',
  HUMAN_RIGHTS = 'human_rights',
  FINANCIAL = 'financial',
  EDUCATION = 'education',
  POLICING = 'policing',
  /** Mass-casualty / public-order incidents — Marikana, Ellis Park, etc. */
  PUBLIC_SAFETY = 'public_safety',
  /** Commissions whose primary focus is bribery, fraud or state capture. */
  CORRUPTION = 'corruption',
}

export enum CommissionStatus {
  ACTIVE = 'active',
  CONCLUDED = 'concluded',
  PENDING_REPORT = 'pending_report',
  STALLED = 'stalled',
  /** Commission concluded without ever delivering a final report. */
  NEVER_REPORTED = 'never_reported',
}

/**
 * A commission of inquiry as a first-class, long-lived entity. Commissions
 * exist independently of any single story — stories are what happens WITHIN
 * or ADJACENT TO a commission. See `story.commission_id` for the back-link.
 *
 * This is deliberately distinct from {@link Investigation}: Investigations
 * are story-scoped (a child of one story), whereas Commissions are
 * domain-scoped reference entities that many stories can link to.
 */
@Entity('commissions')
@Index('commissions_domain_idx', ['domain'])
@Index('commissions_status_idx', ['status'])
export class Commission {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  /** Everyday name — e.g. `'Zondo Commission'`, `'Marikana Commission'`. */
  @Column({ type: 'varchar', length: 100 })
  popular_name!: string;

  /** Full legal name — e.g. `'Judicial Commission of Inquiry into Allegations of State Capture...'`. */
  @Column({ type: 'varchar', length: 1000 })
  full_name!: string;

  @Index('commissions_slug_uidx', { unique: true })
  @Column({ type: 'varchar', length: 200, unique: true })
  slug!: string;

  @Column({
    type: 'enum',
    enum: CommissionDomain,
    enumName: 'commission_domain',
  })
  domain!: CommissionDomain;

  /** E.g. `'Commissions Act 8 of 1947 Section 1'`. */
  @Column({ type: 'varchar', length: 500 })
  enabling_legislation!: string;

  /** The constitutional provision invoked to establish it — e.g. `'Section 84(2)(f)'`. */
  @Column({ type: 'varchar', length: 100 })
  constitution_section_invoked!: string;

  /** One-paragraph editorial summary of why the commission exists. */
  @Column({ type: 'text' })
  reason_summary!: string;

  /** Child-level explanation — the same paragraph a 10-year-old could follow. */
  @Column({ type: 'text' })
  plain_english_summary!: string;

  @Column({ type: 'varchar', length: 300 })
  chair_name!: string;

  @Column({ type: 'date', nullable: true })
  announced_date!: string | null;

  @Column({ type: 'date', nullable: true })
  hearings_started!: string | null;

  @Column({ type: 'date', nullable: true })
  concluded_date!: string | null;

  @Column({ type: 'date', nullable: true })
  report_released_date!: string | null;

  @Column({
    type: 'enum',
    enum: CommissionStatus,
    enumName: 'commission_status',
    default: CommissionStatus.ACTIVE,
  })
  status!: CommissionStatus;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  official_url!: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  report_url!: string | null;

  /**
   * Total cost in ZAR. Stored as bigint because some commissions (Zondo:
   * ~R1bn) exceed the signed 32-bit integer range. TypeORM maps bigint to
   * `string` in JS to preserve precision — cast on read as needed.
   */
  @Column({ type: 'bigint', nullable: true })
  cost_rands!: string | null;

  @Column({ type: 'int', nullable: true })
  total_hearing_days!: number | null;

  /** What the commission ultimately produced / concluded. Filled in after report. */
  @Column({ type: 'text', nullable: true })
  outcome_summary!: string | null;

  /** Did anyone actually get charged as a result? Null until the commission reports. */
  @Column({ type: 'boolean', nullable: true })
  produced_prosecutions!: boolean | null;

  /**
   * The president under whose authority the commission was established.
   * Null for commissions established by a provincial Premier (Khayelitsha),
   * the South African Human Rights Commission (s9 HR Commission Act) or
   * any other non-presidential authority.
   */
  @Column({ type: 'varchar', length: 200, nullable: true })
  president_who_established!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
