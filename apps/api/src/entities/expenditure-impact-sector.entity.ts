import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

import { ImpactSector } from './impact-sector.entity';
import { PublicExpenditureRecord } from './public-expenditure-record.entity';

/**
 * Join: what a diverted expenditure could have delivered in a given sector.
 */
@Entity('expenditure_impact_sectors')
@Unique('expenditure_impact_sectors_exp_sector_uidx', [
  'expenditure_record_id',
  'sector_id',
])
@Index('expenditure_impact_sectors_exp_id_idx', ['expenditure_record_id'])
@Index('expenditure_impact_sectors_sector_id_idx', ['sector_id'])
export class ExpenditureImpactSector {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid' })
  expenditure_record_id!: string;

  @ManyToOne(() => PublicExpenditureRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expenditure_record_id' })
  expenditure_record!: PublicExpenditureRecord;

  @Column({ type: 'uuid' })
  sector_id!: string;

  @ManyToOne(() => ImpactSector, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sector_id' })
  sector!: ImpactSector;

  @Column({ type: 'text' })
  what_was_not_built!: string;

  @Column({ type: 'text', nullable: true })
  alternative_use_description!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
