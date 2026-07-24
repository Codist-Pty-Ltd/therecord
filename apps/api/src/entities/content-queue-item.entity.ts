import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ContentQueueSource {
  SIU = 'SIU',
  SAFLII = 'SAFLII',
  YOUTUBE = 'YOUTUBE',
  GAZETTE = 'GAZETTE',
  RSS = 'RSS',
}

export enum ContentQueueStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  PUBLISHED = 'published',
  IGNORED = 'ignored',
}

export type ContentQueueRelatedEntities = {
  people?: string[];
  commissions?: string[];
  siu?: string[];
};

@Entity('content_queue')
@Index('content_queue_status_idx', ['status'])
@Index('content_queue_source_idx', ['source'])
export class ContentQueueItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'varchar', length: 32 })
  source!: string;

  @Column({ type: 'text', nullable: true })
  source_url!: string | null;

  @Column({ type: 'double precision', default: 0 })
  relevance_score!: number;

  @Column({ type: 'varchar', length: 32, default: 'new_story' })
  suggested_action!: string;

  @Column({ type: 'jsonb', default: {} })
  related_entities!: ContentQueueRelatedEntities;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ type: 'varchar', length: 32, default: ContentQueueStatus.PENDING })
  status!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reviewed_by!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  story_id!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
