import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Story } from './story.entity';

@Entity('articles')
@Index('articles_published_at_idx', ['published_at'])
@Index('articles_ai_processed_idx', ['ai_processed'])
export class Article {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('articles_story_id_idx')
  @Column({ type: 'uuid' })
  story_id!: string;

  @ManyToOne(() => Story, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story!: Story;

  /** Publisher name — e.g. 'Daily Maverick', 'News24', 'GroundUp'. */
  @Column({ type: 'varchar', length: 200 })
  source_name!: string;

  @Column({ type: 'varchar', length: 2000 })
  source_url!: string;

  @Column({ type: 'varchar', length: 1000 })
  headline!: string;

  @Column({ type: 'timestamptz' })
  published_at!: Date;

  /**
   * Short excerpt of the article for attribution and context.
   * HARD CAP at 500 characters — never store more than fair-use permits.
   */
  @Column({ type: 'varchar', length: 500 })
  content_snippet!: string;

  @Column({ type: 'boolean', default: false })
  ai_processed!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
