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
import { Person } from './person.entity';

/**
 * The role a person plays in relation to an ad hoc committee.
 *
 * Deliberately parallel to {@link CommissionPersonRole} but distinct —
 * committees lack `evidence_leader`, `commissioner`, and `established_by`
 * (the National Assembly itself is the establisher and is not modelled as
 * a Person). Committees add `member` — elected MPs who sit on the
 * committee but are neither chair nor secretary.
 */
export enum AdhocCommitteePersonRole {
  CHAIR = 'chair',
  MEMBER = 'member',
  WITNESS = 'witness',
  IMPLICATED = 'implicated',
  LEGAL_REP = 'legal_rep',
  SECRETARY = 'secretary',
}

/**
 * Join between {@link AdhocCommittee} and {@link Person}. Like
 * {@link CommissionPerson}, uniqueness is `(committee, person, role)` so
 * the same human can sit on the committee under multiple roles (a member
 * who is later implicated).
 *
 * Unlike commission_people, we also record `party_affiliation` — who
 * sits on a parliamentary committee is a political question, and readers
 * need to see which parties appointed which members.
 */
@Entity('adhoc_committee_people')
@Unique('adhoc_committee_people_uidx', [
  'adhoc_committee_id',
  'person_id',
  'role',
])
@Index('adhoc_committee_people_role_idx', ['role'])
export class AdhocCommitteePerson {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('adhoc_committee_people_committee_id_idx')
  @Column({ type: 'uuid' })
  adhoc_committee_id!: string;

  @ManyToOne(() => AdhocCommittee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adhoc_committee_id' })
  committee!: AdhocCommittee;

  @Index('adhoc_committee_people_person_id_idx')
  @Column({ type: 'uuid' })
  person_id!: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id' })
  person!: Person;

  @Column({
    type: 'enum',
    enum: AdhocCommitteePersonRole,
    enumName: 'adhoc_committee_person_role',
  })
  role!: AdhocCommitteePersonRole;

  /**
   * Party the member represents. Meaningful for role=MEMBER / CHAIR;
   * nullable because witnesses and legal reps typically have none.
   * Free-text (not an enum) so new parties don't need a migration.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  party_affiliation!: string | null;

  /** Editorial note on what this person said / what they were accused of. */
  @Column({ type: 'text', nullable: true })
  summary!: string | null;
}
