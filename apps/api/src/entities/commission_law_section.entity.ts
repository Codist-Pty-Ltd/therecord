import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { Commission } from './commission.entity';
import { LawSection } from './law_section.entity';

/**
 * How a law section relates to a commission:
 *   - `enabling`      — the section under which the commission was created.
 *   - `investigated`  — the section whose violation was being probed.
 *   - `violated`      — the section the commission found to have been violated.
 *   - `recommended`   — the section the commission recommended be amended / replaced.
 */
export enum CommissionLawSectionUsage {
  ENABLING = 'enabling',
  INVESTIGATED = 'investigated',
  VIOLATED = 'violated',
  RECOMMENDED = 'recommended',
}

/**
 * Join between {@link Commission} and {@link LawSection}. A single commission
 * can relate to a section in multiple capacities (e.g. `investigated` AND
 * `violated`), which is why the uniqueness key includes `usage_type`.
 */
@Entity('commission_law_sections')
@Unique('commission_law_sections_uidx', [
  'commission_id',
  'law_section_id',
  'usage_type',
])
@Index('commission_law_sections_usage_idx', ['usage_type'])
export class CommissionLawSection {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('commission_law_sections_commission_id_idx')
  @Column({ type: 'uuid' })
  commission_id!: string;

  @ManyToOne(() => Commission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commission_id' })
  commission!: Commission;

  @Index('commission_law_sections_law_section_id_idx')
  @Column({ type: 'uuid' })
  law_section_id!: string;

  @ManyToOne(() => LawSection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'law_section_id' })
  law_section!: LawSection;

  @Column({
    type: 'enum',
    enum: CommissionLawSectionUsage,
    enumName: 'commission_law_section_usage',
  })
  usage_type!: CommissionLawSectionUsage;
}
