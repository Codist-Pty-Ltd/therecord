import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('constitution_sections')
@Index('constitution_sections_chapter_idx', ['chapter_number'])
export class ConstitutionSection {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'int' })
  chapter_number!: number;

  @Index('constitution_sections_section_number_uidx', { unique: true })
  @Column({ type: 'int', unique: true })
  section_number!: number;

  @Column({ type: 'varchar', length: 500 })
  section_title!: string;

  /** Child-level plain-English explanation of this constitutional section. */
  @Column({ type: 'text' })
  plain_english!: string;

  @Column({ type: 'text', nullable: true })
  full_text!: string | null;
}
