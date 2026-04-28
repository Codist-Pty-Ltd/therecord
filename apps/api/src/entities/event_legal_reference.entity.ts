import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ConstitutionSection } from './constitution_section.entity';
import { LawSection } from './law_section.entity';
import { TimelineEvent } from './timeline_event.entity';

@Entity('event_legal_references')
export class EventLegalReference {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('event_legal_references_event_id_idx')
  @Column({ type: 'uuid' })
  event_id!: string;

  @ManyToOne(() => TimelineEvent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event!: TimelineEvent;

  @Index('event_legal_references_law_section_id_idx')
  @Column({ type: 'uuid', nullable: true })
  law_section_id!: string | null;

  @ManyToOne(() => LawSection, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'law_section_id' })
  law_section!: LawSection | null;

  @Index('event_legal_references_constitution_section_id_idx')
  @Column({ type: 'uuid', nullable: true })
  constitution_section_id!: string | null;

  @ManyToOne(() => ConstitutionSection, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'constitution_section_id' })
  constitution_section!: ConstitutionSection | null;

  /** Why this law or constitutional section applies to this particular event. */
  @Column({ type: 'text' })
  relevance!: string;

  @Column({ type: 'boolean', default: false })
  alleged_violation!: boolean;
}
