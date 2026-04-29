import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Published or governing document for a commission, committee, or SIU matter. */
export enum CommissionReportType {
  FINAL_REPORT = 'final_report',
  INTERIM_REPORT = 'interim_report',
  SUPPLEMENTARY_REPORT = 'supplementary_report',
  TERMS_OF_REFERENCE = 'terms_of_reference',
  EXECUTIVE_SUMMARY = 'executive_summary',
  RECOMMENDATIONS_ONLY = 'recommendations_only',
  MINORITY_REPORT = 'minority_report',
}

@Entity('commission_reports')
@Index('commission_reports_commission_id_idx', ['commission_id'])
@Index('commission_reports_adhoc_committee_id_idx', ['adhoc_committee_id'])
@Index('commission_reports_siu_proclamation_id_idx', ['siu_proclamation_id'])
@Index('commission_reports_report_type_idx', ['report_type'])
export class CommissionReport {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  commission_id!: string | null;

  @Column({ type: 'uuid', nullable: true })
  adhoc_committee_id!: string | null;

  @Column({ type: 'uuid', nullable: true })
  siu_proclamation_id!: string | null;

  @Column({ type: 'int', nullable: true })
  volume_number!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  volume_title!: string | null;

  @Column({
    type: 'enum',
    enum: CommissionReportType,
    enumName: 'commission_report_type',
  })
  report_type!: CommissionReportType;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'date', nullable: true })
  published_date!: string | null;

  @Column({ type: 'int', nullable: true })
  page_count!: number | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  file_size_mb!: string | null;

  @Column({ type: 'varchar', length: 2000 })
  source_url!: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  mirror_url!: string | null;

  @Column({ type: 'boolean', default: false })
  is_verified!: boolean;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language!: string;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  key_findings!: string[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
