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
import { Municipality } from './municipality.entity';
import { Province } from './province.entity';
import { Story } from './story.entity';

export enum AmountQualifier {
  EXACT = 'exact',
  APPROXIMATE = 'approximate',
  MINIMUM = 'minimum',
  MAXIMUM = 'maximum',
  UNDER_INVESTIGATION = 'under_investigation',
}

export enum ExpenditureType {
  STOLEN = 'stolen',
  ALLEGEDLY_STOLEN = 'allegedly_stolen',
  FRUITLESS_WASTEFUL = 'fruitless_wasteful',
  IRREGULAR = 'irregular',
  UNDER_INVESTIGATION = 'under_investigation',
  RECOVERED = 'recovered',
  PREVENTED = 'prevented',
}

export enum ExpenditureSector {
  HOUSING = 'housing',
  CONSTRUCTION_ROADS = 'construction_roads',
  WATER_SANITATION = 'water_sanitation',
  HEALTH = 'health',
  EDUCATION = 'education',
  SOCIAL_GRANTS = 'social_grants',
  POLICE_SECURITY = 'police_security',
  ENERGY = 'energy',
  TRANSPORT = 'transport',
  OTHER_PROCUREMENT = 'other_procurement',
  STATE_OWNED_ENTERPRISE = 'state_owned_enterprise',
  OTHER = 'other',
}

@Entity('public_expenditure_records')
@Index('public_expenditure_records_story_id_idx', ['story_id'])
@Index('public_expenditure_records_province_id_idx', ['province_id'])
@Index('public_expenditure_records_municipality_id_idx', ['municipality_id'])
@Index('public_expenditure_records_expenditure_type_idx', ['expenditure_type'])
@Index('public_expenditure_records_sector_idx', ['sector'])
@Index('public_expenditure_records_amount_rands_idx', ['amount_rands'])
export class PublicExpenditureRecord {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('public_expenditure_records_story_fk')
  @Column({ type: 'uuid' })
  story_id!: string;

  @ManyToOne(() => Story, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story!: Story;

  @Index('public_expenditure_records_province_fk')
  @Column({ type: 'uuid', nullable: true })
  province_id!: string | null;

  @ManyToOne(() => Province, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'province_id' })
  province!: Province | null;

  @Index('public_expenditure_records_municipality_fk')
  @Column({ type: 'uuid', nullable: true })
  municipality_id!: string | null;

  @ManyToOne(() => Municipality, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'municipality_id' })
  municipality!: Municipality | null;

  @Column({ type: 'bigint' })
  amount_rands!: string;

  @Column({
    type: 'enum',
    enum: AmountQualifier,
    enumName: 'amount_qualifier',
    default: AmountQualifier.APPROXIMATE,
  })
  amount_qualifier!: AmountQualifier;

  @Column({
    type: 'enum',
    enum: ExpenditureType,
    enumName: 'expenditure_type',
  })
  expenditure_type!: ExpenditureType;

  @Column({
    type: 'enum',
    enum: ExpenditureSector,
    enumName: 'expenditure_sector',
  })
  sector!: ExpenditureSector;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  plain_english!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  source_document!: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  source_url!: string | null;

  @Column({ type: 'date', nullable: true })
  reference_date!: string | null;

  @Column({ type: 'boolean', default: false })
  is_verified!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
