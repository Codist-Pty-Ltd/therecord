import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ConstitutionSection } from './constitution_section.entity';
import { LawSection } from './law_section.entity';
import { SiuProclamation } from './siu_proclamation.entity';

/**
 * How a statute or constitutional section relates to an SIU proclamation.
 * Intentionally distinct from {@link CommissionLawSectionUsage} — SIU adds
 * `recovered_under` and never uses `recommended`.
 */
export enum SiuLawSectionUsage {
  ENABLING = 'enabling',
  INVESTIGATED = 'investigated',
  VIOLATED = 'violated',
  RECOVERED_UNDER = 'recovered_under',
}

@Entity('siu_proclamation_law_sections')
@Index('idx_siu_proc_law_proclamation', ['proclamation_id'])
@Index('idx_siu_proc_law_section', ['law_section_id'])
@Index('idx_siu_proc_law_constitution', ['constitution_section_id'])
export class SiuProclamationLawSection {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid' })
  proclamation_id!: string;

  @ManyToOne(() => SiuProclamation, (p) => p.law_section_links, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'proclamation_id' })
  proclamation!: SiuProclamation;

  @Column({ type: 'uuid', nullable: true })
  law_section_id!: string | null;

  @ManyToOne(() => LawSection, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'law_section_id' })
  law_section!: LawSection | null;

  @Column({ type: 'uuid', nullable: true })
  constitution_section_id!: string | null;

  @ManyToOne(() => ConstitutionSection, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'constitution_section_id' })
  constitution_section!: ConstitutionSection | null;

  @Column({ type: 'varchar', length: 50 })
  usage_type!: SiuLawSectionUsage;

  @Column({ type: 'text', nullable: true })
  relevance!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
