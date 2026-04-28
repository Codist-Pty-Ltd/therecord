import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { Person } from './person.entity';
import { Story } from './story.entity';

@Entity('story_people')
@Unique('story_people_story_person_uidx', ['story_id', 'person_id'])
export class StoryPerson {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('story_people_story_id_idx')
  @Column({ type: 'uuid' })
  story_id!: string;

  @ManyToOne(() => Story, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story!: Story;

  @Index('story_people_person_id_idx')
  @Column({ type: 'uuid' })
  person_id!: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id' })
  person!: Person;

  /** Role this person plays within the story — e.g. 'whistleblower', 'accused', 'chair', 'witness'. */
  @Column({ type: 'varchar', length: 200 })
  role_in_story!: string;

  @Column({ type: 'boolean', default: false })
  is_key_figure!: boolean;
}
