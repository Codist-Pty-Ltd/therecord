import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdhocCommittee } from './adhoc_committee.entity';
import { Commission } from './commission.entity';
import { SiuProclamation } from './siu_proclamation.entity';

export enum StoryDomain {
  CRIMINAL_JUSTICE = 'criminal_justice',
  POLITICS = 'politics',
  ORGANISED_CRIME = 'organised_crime',
  BUSINESS = 'business',
  LABOUR = 'labour',
}

export enum StoryStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  DORMANT = 'dormant',
}

@Entity('stories')
@Index('stories_domain_idx', ['domain'])
@Index('stories_status_idx', ['status'])
export class Story {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Index('stories_slug_uidx', { unique: true })
  @Column({ type: 'varchar', length: 500, unique: true })
  slug!: string;

  @Column({
    type: 'enum',
    enum: StoryDomain,
    enumName: 'story_domain',
  })
  domain!: StoryDomain;

  @Column({
    type: 'enum',
    enum: StoryStatus,
    enumName: 'story_status',
    default: StoryStatus.ACTIVE,
  })
  status!: StoryStatus;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  /** Plain-English summary — written so a child could understand the story. */
  @Column({ type: 'text', nullable: true })
  plain_english_summary!: string | null;

  /**
   * Optional back-link to a {@link Commission} this story belongs to.
   * Set when the story lives *inside* a commission (e.g. a specific day of
   * Zondo hearings, or a particular implicated party's story at Marikana).
   * Left null when the story is not commission-scoped.
   *
   * ON DELETE SET NULL: if the commission record is removed the story
   * survives as a standalone thread.
   */
  @Index('stories_commission_id_idx')
  @Column({ type: 'uuid', nullable: true })
  commission_id!: string | null;

  @ManyToOne(() => Commission, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'commission_id' })
  commission!: Commission | null;

  /**
   * Optional back-link to an {@link AdhocCommittee} this story belongs to.
   * Independent of `commission_id`: a story can belong to a commission, a
   * committee, both (Mkhwanazi — Madlanga Commission + parallel ad hoc),
   * or neither (ordinary reporting). Keeping the two FKs separate
   * preserves the executive/legislature distinction in the graph.
   *
   * ON DELETE SET NULL: if the committee record is removed the story
   * survives as a standalone thread.
   */
  @Index('stories_adhoc_committee_id_idx')
  @Column({ type: 'uuid', nullable: true })
  adhoc_committee_id!: string | null;

  @ManyToOne(() => AdhocCommittee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'adhoc_committee_id' })
  adhoc_committee!: AdhocCommittee | null;

  /**
   * Optional back-link to an {@link SiuProclamation} this story belongs to.
   * Independent of `commission_id` and `adhoc_committee_id`: a story can
   * be linked to all three at once when an executive commission, a
   * parliamentary ad hoc committee and an SIU investigation all touch
   * the same matter (Transnet looting → Zondo Commission + Eskom Ad Hoc
   * Committee + Proclamation R8 of 2018 is the canonical 3-way example).
   *
   * ON DELETE SET NULL: if the proclamation is removed the story
   * survives as a standalone thread.
   */
  @Index('stories_siu_proclamation_id_idx')
  @Column({ type: 'uuid', nullable: true })
  siu_proclamation_id!: string | null;

  @ManyToOne(() => SiuProclamation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'siu_proclamation_id' })
  siu_proclamation!: SiuProclamation | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
