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

import { Commission } from './commission.entity';
import { ImpactSector } from './impact-sector.entity';

/**
 * Join: how a commission’s subject matter intersects with human-impact sectors.
 */
@Entity('commission_impact_sectors')
@Unique('commission_impact_sectors_commission_sector_uidx', [
  'commission_id',
  'sector_id',
])
@Index('commission_impact_sectors_commission_id_idx', ['commission_id'])
@Index('commission_impact_sectors_sector_id_idx', ['sector_id'])
export class CommissionImpactSector {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid' })
  commission_id!: string;

  @ManyToOne(() => Commission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commission_id' })
  commission!: Commission;

  @Column({ type: 'uuid' })
  sector_id!: string;

  @ManyToOne(() => ImpactSector, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sector_id' })
  sector!: ImpactSector;

  @Column({ type: 'text' })
  impact_summary!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
