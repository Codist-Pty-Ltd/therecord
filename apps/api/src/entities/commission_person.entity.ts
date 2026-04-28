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
import { Person } from './person.entity';

/**
 * The role a person plays in relation to a commission. A single person can
 * hold several roles across different commissions (e.g. Madlanga was `chair`
 * of his own commission; as a retired judge he has been `witness` in others).
 */
export enum CommissionPersonRole {
  CHAIR = 'chair',
  EVIDENCE_LEADER = 'evidence_leader',
  WITNESS = 'witness',
  IMPLICATED = 'implicated',
  LEGAL_REP = 'legal_rep',
  COMMISSIONER = 'commissioner',
  SECRETARY = 'secretary',
  /**
   * The person the inquiry is examining — used for fitness / misconduct
   * inquiries (Ginwala/Pikoli, Mokgoro/Jiba, Cassim/Nxasana).
   */
  SUBJECT_OF_INQUIRY = 'subject_of_inquiry',
  /** The President / Premier / statutory authority that set the commission up. */
  ESTABLISHED_BY = 'established_by',
}

/**
 * Join between {@link Commission} and {@link Person}. A person can appear in
 * the same commission under multiple roles (a witness who is later
 * implicated), hence `role` is part of the uniqueness key.
 */
@Entity('commission_people')
@Unique('commission_people_uidx', ['commission_id', 'person_id', 'role'])
@Index('commission_people_role_idx', ['role'])
export class CommissionPerson {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('commission_people_commission_id_idx')
  @Column({ type: 'uuid' })
  commission_id!: string;

  @ManyToOne(() => Commission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commission_id' })
  commission!: Commission;

  @Index('commission_people_person_id_idx')
  @Column({ type: 'uuid' })
  person_id!: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id' })
  person!: Person;

  @Column({
    type: 'enum',
    enum: CommissionPersonRole,
    enumName: 'commission_person_role',
  })
  role!: CommissionPersonRole;

  /** What this person's role / testimony covered — free-text editorial note. */
  @Column({ type: 'text', nullable: true })
  summary!: string | null;
}
