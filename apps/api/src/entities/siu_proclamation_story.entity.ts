import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { SiuProclamation } from './siu_proclamation.entity';
import { Story } from './story.entity';

/**
 * Join between {@link SiuProclamation} and {@link Story}.
 *
 * A proclamation typically generates several stories on The Record over
 * time (the activation announcement, an interim report, individual
 * tribunal cases, the final report). The relationship is many-to-many
 * because a single story can also reference more than one proclamation
 * (Digital Vibes was the subject of two distinct proclamations, R23 of
 * 2020 and an amending one).
 *
 * Uniqueness is `(proclamation, story)` to prevent duplicate links.
 */
@Entity('siu_proclamation_stories')
@Unique('siu_proclamation_stories_uidx', ['proclamation_id', 'story_id'])
export class SiuProclamationStory {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('siu_proclamation_stories_proclamation_id_idx')
  @Column({ type: 'uuid' })
  proclamation_id!: string;

  @ManyToOne(() => SiuProclamation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proclamation_id' })
  proclamation!: SiuProclamation;

  @Index('siu_proclamation_stories_story_id_idx')
  @Column({ type: 'uuid' })
  story_id!: string;

  @ManyToOne(() => Story, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story!: Story;
}
