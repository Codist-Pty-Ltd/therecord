import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Law } from './law.entity';

@Entity('law_sections')
@Index('law_sections_section_number_idx', ['section_number'])
export class LawSection {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('law_sections_law_id_idx')
  @Column({ type: 'uuid' })
  law_id!: string;

  @ManyToOne(() => Law, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'law_id' })
  law!: Law;

  /** E.g. 'Section 34', 'Section 5(1)(a)'. */
  @Column({ type: 'varchar', length: 50 })
  section_number!: string;

  @Column({ type: 'varchar', length: 500 })
  section_title!: string;

  /** Child-level explanation of this specific section. */
  @Column({ type: 'text' })
  plain_english!: string;

  @Column({ type: 'text', nullable: true })
  full_text!: string | null;
}
