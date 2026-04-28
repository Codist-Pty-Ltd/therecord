import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { AdhocCommittee } from './adhoc_committee.entity';
import { LawSection } from './law_section.entity';

/**
 * How a law section relates to an ad hoc committee:
 *   - `enabling`         — the rule / provision under which the committee
 *                          was established (e.g. s55(2) + NA Rule 253).
 *   - `investigated`     — the section whose alleged violation the
 *                          committee is examining.
 *   - `amended`          — the section the committee ultimately amended
 *                          (used once the committee has reported).
 *   - `being_processed`  — the committee is currently considering a bill
 *                          that amends this section; it has NOT yet been
 *                          voted through. This is the main distinguisher
 *                          from {@link CommissionLawSectionUsage}.
 */
export enum AdhocCommitteeLawSectionUsage {
  ENABLING = 'enabling',
  INVESTIGATED = 'investigated',
  AMENDED = 'amended',
  BEING_PROCESSED = 'being_processed',
}

/**
 * Join between {@link AdhocCommittee} and {@link LawSection}. A single
 * committee can relate to a section in multiple capacities (e.g. it is
 * BEING_PROCESSED while the bill is in committee, then flips to AMENDED
 * after assent), which is why the uniqueness key includes `usage_type`.
 */
@Entity('adhoc_committee_law_sections')
@Unique('adhoc_committee_law_sections_uidx', [
  'adhoc_committee_id',
  'law_section_id',
  'usage_type',
])
@Index('adhoc_committee_law_sections_usage_idx', ['usage_type'])
export class AdhocCommitteeLawSection {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('adhoc_committee_law_sections_committee_id_idx')
  @Column({ type: 'uuid' })
  adhoc_committee_id!: string;

  @ManyToOne(() => AdhocCommittee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adhoc_committee_id' })
  committee!: AdhocCommittee;

  @Index('adhoc_committee_law_sections_law_section_id_idx')
  @Column({ type: 'uuid' })
  law_section_id!: string;

  @ManyToOne(() => LawSection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'law_section_id' })
  law_section!: LawSection;

  @Column({
    type: 'enum',
    enum: AdhocCommitteeLawSectionUsage,
    enumName: 'adhoc_committee_law_section_usage',
  })
  usage_type!: AdhocCommitteeLawSectionUsage;
}
