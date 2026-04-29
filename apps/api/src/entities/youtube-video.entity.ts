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
import { AdhocCommittee } from './adhoc_committee.entity';
import { Commission } from './commission.entity';
import { Story } from './story.entity';
import { SiuProclamation } from './siu_proclamation.entity';

export enum YoutubeVideoReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum YoutubeVideoType {
  NEWS_REPORT = 'news_report',
  PARLIAMENTARY = 'parliamentary',
  COMMISSION_HEARING = 'commission_hearing',
  DOCUMENTARY = 'documentary',
  ANALYSIS = 'analysis',
  INTERVIEW = 'interview',
  OTHER = 'other',
}

@Entity('youtube_videos')
@Index('youtube_videos_status_idx', ['status'])
@Index('youtube_videos_commission_id_idx', ['commission_id'])
@Index('youtube_videos_story_id_idx', ['story_id'])
export class YoutubeVideo {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  youtube_id!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  channel_name!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  channel_id!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  published_at!: Date | null;

  @Column({ type: 'int', nullable: true })
  duration_seconds!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail_url!: string | null;

  @Column({ type: 'bigint', nullable: true })
  view_count!: string | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: '0',
  })
  relevance_score!: string;

  @Column({ type: 'text', nullable: true })
  relevance_reason!: string | null;

  @Column({
    type: 'enum',
    enum: YoutubeVideoReviewStatus,
    enumName: 'youtube_video_review_status',
    default: YoutubeVideoReviewStatus.PENDING,
  })
  status!: YoutubeVideoReviewStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reviewed_by!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at!: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejection_reason!: string | null;

  @Column({
    type: 'enum',
    enum: YoutubeVideoType,
    enumName: 'youtube_video_type',
    default: YoutubeVideoType.OTHER,
  })
  video_type!: YoutubeVideoType;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language!: string;

  @Column({ type: 'uuid', nullable: true })
  commission_id!: string | null;

  @ManyToOne(() => Commission, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'commission_id' })
  commission!: Commission | null;

  @Column({ type: 'uuid', nullable: true })
  adhoc_committee_id!: string | null;

  @ManyToOne(() => AdhocCommittee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'adhoc_committee_id' })
  adhoc_committee!: AdhocCommittee | null;

  @Column({ type: 'uuid', nullable: true })
  story_id!: string | null;

  @ManyToOne(() => Story, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'story_id' })
  story!: Story | null;

  @Column({ type: 'uuid', nullable: true })
  siu_proclamation_id!: string | null;

  @ManyToOne(() => SiuProclamation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'siu_proclamation_id' })
  siu_proclamation!: SiuProclamation | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
