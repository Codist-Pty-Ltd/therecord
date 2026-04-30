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
import { Story } from './story.entity';

export enum SimilarityReason {
  SAME_PROVINCE = 'same_province',
  SAME_MUNICIPALITY = 'same_municipality',
  SAME_SECTOR = 'same_sector',
  SAME_ACCUSED = 'same_accused',
  SAME_CATEGORY = 'same_category',
  SAME_PATTERN = 'same_pattern',
}

@Entity('similar_stories')
@Unique('similar_stories_story_similar_uidx', ['story_id', 'similar_story_id'])
@Index('similar_stories_story_id_idx', ['story_id'])
@Index('similar_stories_similar_story_id_idx', ['similar_story_id'])
export class SimilarStory {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid' })
  story_id!: string;

  @ManyToOne(() => Story, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story!: Story;

  @Column({ type: 'uuid' })
  similar_story_id!: string;

  @ManyToOne(() => Story, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'similar_story_id' })
  similar_story!: Story;

  @Column({
    type: 'enum',
    enum: SimilarityReason,
    enumName: 'similarity_reason',
  })
  similarity_reason!: SimilarityReason;

  @Column({ type: 'text', nullable: true })
  similarity_note!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
