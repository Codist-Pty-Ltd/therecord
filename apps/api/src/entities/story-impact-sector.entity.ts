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
import { Story } from './story.entity';

export enum ImpactSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Join: how a single story affected one impact sector, with a causal chain.
 */
@Entity('story_impact_sectors')
@Unique('story_impact_sectors_story_sector_uidx', ['story_id', 'sector_id'])
@Index('story_impact_sectors_story_id_idx', ['story_id'])
@Index('story_impact_sectors_sector_id_idx', ['sector_id'])
export class StoryImpactSector {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid' })
  story_id!: string;

  @ManyToOne(() => Story, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story!: Story;

  @Column({ type: 'uuid' })
  sector_id!: string;

  @ManyToOne(() => ImpactSector, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sector_id' })
  sector!: ImpactSector;

  @Column({ type: 'text', array: true })
  impact_chain!: string[];

  @Column({
    type: 'enum',
    enum: ImpactSeverity,
    enumName: 'impact_severity',
    default: ImpactSeverity.MEDIUM,
  })
  impact_severity!: ImpactSeverity;

  @Column({ type: 'bigint', nullable: true })
  amount_diverted_rands!: string | null;

  @Column({ type: 'bigint', nullable: true })
  people_affected_estimate!: string | null;

  @Column({ type: 'text', nullable: true })
  plain_english_impact!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
