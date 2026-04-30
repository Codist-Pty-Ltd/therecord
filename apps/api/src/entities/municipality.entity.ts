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
import { Province } from './province.entity';

export enum MunicipalityType {
  METROPOLITAN = 'metropolitan',
  LOCAL = 'local',
  DISTRICT = 'district',
}

export enum AgAuditOutcome {
  CLEAN = 'clean',
  UNQUALIFIED_WITH_FINDINGS = 'unqualified_with_findings',
  QUALIFIED = 'qualified',
  ADVERSE = 'adverse',
  DISCLAIMER = 'disclaimer',
  OUTSTANDING = 'outstanding',
}

@Entity('municipalities')
export class Municipality {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  short_name!: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug!: string;

  @Column({
    type: 'enum',
    enum: MunicipalityType,
    enumName: 'municipality_type',
  })
  municipality_type!: MunicipalityType;

  @Index('municipalities_province_fk')
  @Column({ type: 'uuid' })
  province_id!: string;

  @ManyToOne(() => Province, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'province_id' })
  province!: Province;

  @Column({ type: 'varchar', length: 200, nullable: true })
  mayor_name!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  governing_party!: string | null;

  @Column({ type: 'bigint', nullable: true })
  annual_budget_rands!: string | null;

  @Column({
    type: 'enum',
    enum: AgAuditOutcome,
    enumName: 'ag_audit_outcome',
    nullable: true,
  })
  ag_audit_outcome!: AgAuditOutcome | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  ag_audit_year!: string | null;

  @Column({ type: 'bigint', nullable: true })
  ag_irregular_expenditure_rands!: string | null;

  @Column({ type: 'text', nullable: true })
  plain_english_audit_outcome!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
