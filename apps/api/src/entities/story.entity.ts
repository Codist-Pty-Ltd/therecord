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
import { AccountabilityBody } from './accountability-body.entity';
import { ImpactSector } from './impact-sector.entity';
import { AdhocCommittee } from './adhoc_committee.entity';
import { Commission } from './commission.entity';
import { Municipality } from './municipality.entity';
import { Province } from './province.entity';
import { SiuProclamation } from './siu_proclamation.entity';
import { StateEntity } from './state-entity.entity';

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

export enum StoryCategory {
  TENDER_FRAUD = 'tender_fraud',
  HOUSING_CORRUPTION = 'housing_corruption',
  CONSTRUCTION_MAFIA = 'construction_mafia',
  WATER_SANITATION = 'water_sanitation',
  HEALTH_CORRUPTION = 'health_corruption',
  EDUCATION_CORRUPTION = 'education_corruption',
  SOCIAL_GRANTS_FRAUD = 'social_grants_fraud',
  POLICE_MISCONDUCT = 'police_misconduct',
  ENERGY_CORRUPTION = 'energy_corruption',
  STATE_CAPTURE = 'state_capture',
  WHISTLEBLOWER = 'whistleblower',
  GANG_LINKED_CORRUPTION = 'gang_linked_corruption',
  OTHER = 'other',
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

  /**
   * Optional link to an {@link AccountabilityBody} (Scorpions, Hawks, IDAC, AFU)
   * when the story is centered on that unit’s mandate or a case it handled.
   */
  @Index('stories_accountability_body_id_idx')
  @Column({ type: 'uuid', nullable: true })
  accountability_body_id!: string | null;

  @ManyToOne(() => AccountabilityBody, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'accountability_body_id' })
  accountability_body!: AccountabilityBody | null;

  /**
   * Editorial “headline” sector for quick UI — the single most affected lens
   * from {@link ImpactSector}. Detail rows live in `story_impact_sectors`.
   */
  @Index('stories_primary_impact_sector_id_idx')
  @Column({ type: 'uuid', nullable: true })
  primary_impact_sector_id!: string | null;

  @ManyToOne(() => ImpactSector, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'primary_impact_sector_id' })
  primary_impact_sector!: ImpactSector | null;

  /**
   * Optional link to a {@link StateEntity} when the story is centred on that SOE / schedule entity.
   */
  @Index('stories_state_entity_id_idx')
  @Column({ type: 'uuid', nullable: true })
  state_entity_id!: string | null;

  @ManyToOne(() => StateEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'state_entity_id' })
  state_entity!: StateEntity | null;

  /**
   * Optional geographic scope — province-level accountability (e.g. AG water
   * sector losses reported per province).
   */
  @Index('stories_province_id_idx')
  @Column({ type: 'uuid', nullable: true })
  province_id!: string | null;

  @ManyToOne(() => Province, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'province_id' })
  province!: Province | null;

  /**
   * Optional municipal scope — metro, local or district municipality linked
   * to this story (Cape Town contracts, eThekwini, etc.).
   */
  @Index('stories_municipality_id_idx')
  @Column({ type: 'uuid', nullable: true })
  municipality_id!: string | null;

  @ManyToOne(() => Municipality, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'municipality_id' })
  municipality!: Municipality | null;

  /**
   * Editorial taxonomy for provincial / municipal corruption and related threads.
   */
  @Column({
    type: 'enum',
    enum: StoryCategory,
    enumName: 'story_category',
    nullable: true,
  })
  story_category!: StoryCategory | null;

  /**
   * Cached sum of {@link PublicExpenditureRecord} amounts for this story
   * (whole rands). Maintained when expenditure rows are written.
   */
  @Column({ type: 'bigint', nullable: true })
  total_amount_rands!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
