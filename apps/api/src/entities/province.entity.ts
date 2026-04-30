import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity('provinces')
export class Province {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  abbreviation!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  capital!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  premier_name!: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  corruption_watch_complaint_percentage!: string | null;

  @Column({ type: 'bigint', nullable: true })
  auditor_general_irregular_expenditure_rands!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  ag_report_year!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
