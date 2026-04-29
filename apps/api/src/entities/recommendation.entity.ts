import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Subject matter of a commission / committee recommendation. */
export enum RecommendationCategory {
  PROSECUTION = 'prosecution',
  LEGISLATION = 'legislation',
  POLICY = 'policy',
  INSTITUTIONAL = 'institutional',
  DISCIPLINARY = 'disciplinary',
  FURTHER_INVESTIGATION = 'further_investigation',
  COMPENSATION = 'compensation',
  APPOINTMENT = 'appointment',
  OTHER = 'other',
}

/** Whether government / relevant bodies acted on the recommendation. */
export enum RecommendationImplementationStatus {
  IMPLEMENTED = 'implemented',
  PARTIALLY_IMPLEMENTED = 'partially_implemented',
  NOT_IMPLEMENTED = 'not_implemented',
  IN_PROGRESS = 'in_progress',
  REJECTED = 'rejected',
  UNKNOWN = 'unknown',
}

@Entity('recommendations')
@Index('recommendations_commission_id_idx', ['commission_id'])
@Index('recommendations_adhoc_committee_id_idx', ['adhoc_committee_id'])
@Index('recommendations_implementation_status_idx', ['implementation_status'])
@Index('recommendations_category_idx', ['category'])
export class Recommendation {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  commission_id!: string | null;

  @Column({ type: 'uuid', nullable: true })
  adhoc_committee_id!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reference_number!: string | null;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  full_text!: string | null;

  @Column({ type: 'text', nullable: true })
  plain_english!: string | null;

  @Column({ type: 'text', nullable: true })
  plain_english_child!: string | null;

  @Column({
    type: 'enum',
    enum: RecommendationCategory,
    enumName: 'recommendation_category',
  })
  category!: RecommendationCategory;

  @Column({ type: 'varchar', length: 300, nullable: true })
  directed_at!: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  persons_named!: string[] | null;

  @Column({
    type: 'enum',
    enum: RecommendationImplementationStatus,
    enumName: 'recommendation_implementation_status',
    default: RecommendationImplementationStatus.UNKNOWN,
  })
  implementation_status!: RecommendationImplementationStatus;

  @Column({ type: 'text', nullable: true })
  implementation_notes!: string | null;

  @Column({ type: 'date', nullable: true })
  implementation_date!: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  implementation_source_url!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  volume_reference!: string | null;

  @Column({ type: 'boolean', default: false })
  is_verified!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
