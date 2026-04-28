import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Story } from './story.entity';

export enum InvestigationType {
  JUDICIAL_COMMISSION = 'judicial_commission',
  PARLIAMENTARY_COMMITTEE = 'parliamentary_committee',
  SAPS_INTERNAL = 'saps_internal',
  IPID = 'ipid',
  NPA = 'npa',
  OTHER = 'other',
}

export enum InvestigationStatus {
  ACTIVE = 'active',
  CONCLUDED = 'concluded',
  PENDING_REPORT = 'pending_report',
  STALLED = 'stalled',
}

@Entity('investigations')
@Index('investigations_investigation_type_idx', ['investigation_type'])
@Index('investigations_status_idx', ['status'])
export class Investigation {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('investigations_story_id_idx')
  @Column({ type: 'uuid' })
  story_id!: string;

  @ManyToOne(() => Story, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story!: Story;

  /** Official name — e.g. 'Madlanga Commission', 'Ad Hoc Committee on SAPS'. */
  @Column({ type: 'varchar', length: 500 })
  name!: string;

  @Column({
    type: 'enum',
    enum: InvestigationType,
    enumName: 'investigation_type',
  })
  investigation_type!: InvestigationType;

  /** Who established it — e.g. 'President Ramaphosa', 'National Assembly'. */
  @Column({ type: 'varchar', length: 300 })
  established_by!: string;

  /** Statute or rule that grants authority — e.g. 'Commissions Act / NA Rule 253'. */
  @Column({ type: 'varchar', length: 500 })
  legal_basis!: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  chair_name!: string | null;

  @Column({
    type: 'enum',
    enum: InvestigationStatus,
    enumName: 'investigation_status',
    default: InvestigationStatus.ACTIVE,
  })
  status!: InvestigationStatus;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  official_url!: string | null;

  /** ISO date string (YYYY-MM-DD). */
  @Column({ type: 'date', nullable: true })
  started_at!: string | null;

  /** ISO date string (YYYY-MM-DD). */
  @Column({ type: 'date', nullable: true })
  concluded_at!: string | null;
}
