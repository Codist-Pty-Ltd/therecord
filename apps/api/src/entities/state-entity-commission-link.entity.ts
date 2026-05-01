import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { AccountabilityBody } from './accountability-body.entity';
import { AdhocCommittee } from './adhoc_committee.entity';
import { Commission } from './commission.entity';
import { SiuProclamation } from './siu_proclamation.entity';
import { StateEntity } from './state-entity.entity';

export enum StateEntityCommissionRelationshipType {
  INVESTIGATED = 'investigated',
  SUBJECT_OF = 'subject_of',
  IMPLICATED = 'implicated',
  REFORMED_BY = 'reformed_by',
  BAILOUT_LINKED = 'bailout_linked',
}

@Entity('state_entity_commission_links')
@Index('sec_link_entity_idx', ['state_entity_id'])
@Index('sec_link_commission_idx', ['commission_id'])
@Index('sec_link_adhoc_idx', ['adhoc_committee_id'])
@Index('sec_link_siu_idx', ['siu_proclamation_id'])
@Index('sec_link_body_idx', ['accountability_body_id'])
export class StateEntityCommissionLink {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'uuid' })
  state_entity_id!: string;

  @ManyToOne(() => StateEntity, (e) => e.commission_links, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'state_entity_id' })
  state_entity!: StateEntity;

  @Column({ type: 'uuid', nullable: true })
  commission_id!: string | null;

  @ManyToOne(() => Commission, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'commission_id' })
  commission!: Commission | null;

  @Column({ type: 'uuid', nullable: true })
  adhoc_committee_id!: string | null;

  @ManyToOne(() => AdhocCommittee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'adhoc_committee_id' })
  adhoc_committee!: AdhocCommittee | null;

  @Column({ type: 'uuid', nullable: true })
  siu_proclamation_id!: string | null;

  @ManyToOne(() => SiuProclamation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'siu_proclamation_id' })
  siu_proclamation!: SiuProclamation | null;

  @Column({ type: 'uuid', nullable: true })
  accountability_body_id!: string | null;

  @ManyToOne(() => AccountabilityBody, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'accountability_body_id' })
  accountability_body!: AccountabilityBody | null;

  @Column({
    type: 'enum',
    enum: StateEntityCommissionRelationshipType,
    enumName: 'state_entity_commission_relationship_type',
  })
  relationship_type!: StateEntityCommissionRelationshipType;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
