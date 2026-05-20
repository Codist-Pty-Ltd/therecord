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

export enum HistoricalStatType {
  INCOME_GAP = 'income_gap',
  WEALTH_GAP = 'wealth_gap',
  LAND_OWNERSHIP = 'land_ownership',
  UNEMPLOYMENT = 'unemployment',
  POVERTY = 'poverty',
  EDUCATION = 'education',
  LIFE_EXPECTANCY = 'life_expectancy',
  POPULATION = 'population',
  OTHER = 'other',
}

@Entity('historical_statistics')
@Index('historical_statistics_era_idx', ['era_id'])
export class HistoricalStatistic {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid', name: 'era_id' })
  era_id!: string;

  @ManyToOne(() => HistoricalEra, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'era_id' })
  era!: HistoricalEra;

  @Column({
    type: 'enum',
    enum: HistoricalStatType,
    enumName: 'historical_stat_type',
    name: 'stat_type',
  })
  stat_type!: HistoricalStatType;

  @Column({ type: 'varchar', length: 200 })
  label!: string;

  @Column({ type: 'varchar', length: 100 })
  value!: string;

  @Column({ type: 'text', name: 'value_context' })
  value_context!: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'year_or_period' })
  year_or_period!: string | null;

  @Column({ type: 'varchar', length: 300 })
  source!: string;

  @Column({ type: 'text', name: 'plain_english_child' })
  plain_english_child!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
