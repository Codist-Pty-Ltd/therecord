import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { HistoricalEra } from './historical-era.entity';

export enum HistoricalLawCategory {
  LAND = 'land',
  LABOUR = 'labour',
  EDUCATION = 'education',
  MOVEMENT = 'movement',
  POLITICAL = 'political',
  CLASSIFICATION = 'classification',
  HOUSING = 'housing',
  AMENITIES = 'amenities',
  SECURITY = 'security',
  ECONOMY = 'economy',
}

export enum HistoricalLawStatus {
  ACTIVE = 'active',
  REPEALED = 'repealed',
  REPLACED = 'replaced',
}

@Entity('historical_laws')
@Index('historical_laws_era_year_idx', ['era_id', 'year_enacted'])
@Index('historical_laws_slug_idx', ['slug'])
export class HistoricalLaw {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid', name: 'era_id' })
  era_id!: string;

  @ManyToOne(() => HistoricalEra, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'era_id' })
  era!: HistoricalEra;

  @Column({ type: 'int', name: 'year_enacted' })
  year_enacted!: number;

  @Column({ type: 'int', nullable: true, name: 'year_repealed' })
  year_repealed!: number | null;

  @Column({ type: 'varchar', length: 300 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'full_name' })
  full_name!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'act_number' })
  act_number!: string | null;

  @Column({ type: 'varchar', length: 300, unique: true })
  slug!: string;

  @Column({
    type: 'enum',
    enum: HistoricalLawCategory,
    enumName: 'historical_law_category',
  })
  category!: HistoricalLawCategory;

  @Column({
    type: 'enum',
    enum: HistoricalLawStatus,
    enumName: 'historical_law_status',
    default: HistoricalLawStatus.REPEALED,
  })
  status!: HistoricalLawStatus;

  @Column({ type: 'varchar', length: 300, nullable: true, name: 'replaced_by' })
  replaced_by!: string | null;

  @Column({ type: 'text', name: 'what_it_did' })
  what_it_did!: string;

  @Column({ type: 'text', name: 'plain_english_child' })
  plain_english_child!: string;

  @Column({ type: 'text', name: 'plain_english_layperson' })
  plain_english_layperson!: string;

  @Column({ type: 'text', name: 'impact_summary' })
  impact_summary!: string;

  @Column({ type: 'text', nullable: true, name: 'constitutional_violation' })
  constitutional_violation!: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_foundational' })
  is_foundational!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
