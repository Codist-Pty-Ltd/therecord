import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { Person } from './person.entity';
import { SiuProclamation } from './siu_proclamation.entity';

/**
 * The role a person plays in relation to an SIU proclamation.
 *
 * The constitutional `INVESTIGATED` / `IMPLICATED` distinction matters
 * editorially — being named in a SIU investigation is not the same as
 * being implicated in wrongdoing. The frontend renders the two badges
 * differently for that reason.
 *
 * The downstream chain (`REFERRED_TO_NPA`, `REFERRED_DISCIPLINARY`) is
 * modelled per-person rather than as a global counter on the outcome
 * row so a single person can be tagged with the specific consequence
 * they faced.
 */
export enum SiuPersonRole {
  /** Subject of the investigation; named in the proclamation scope. */
  INVESTIGATED = 'investigated',
  /** Found by the SIU to have been involved in wrongdoing. */
  IMPLICATED = 'implicated',
  /** Came forward with information that triggered or supported the probe. */
  WHISTLEBLOWER = 'whistleblower',
  /** Referred to the National Prosecuting Authority for criminal charges. */
  REFERRED_TO_NPA = 'referred_to_npa',
  /** Referred to a department head for disciplinary action. */
  REFERRED_DISCIPLINARY = 'referred_disciplinary',
  /** Subsequently convicted in a downstream criminal matter. */
  CONVICTED = 'convicted',
  /** Subsequently acquitted in a downstream criminal matter. */
  ACQUITTED = 'acquitted',
}

/**
 * Join between {@link SiuProclamation} and {@link Person}.
 *
 * Uniqueness is `(proclamation, person, role)` so a single human can
 * carry multiple rows against the same proclamation as the matter
 * progresses (investigated → implicated → referred_to_npa → convicted
 * is a common arc). Each row is one chapter of that arc.
 */
@Entity('siu_proclamation_people')
@Unique('siu_proclamation_people_uidx', ['proclamation_id', 'person_id', 'role'])
@Index('siu_proclamation_people_role_idx', ['role'])
export class SiuProclamationPerson {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Index('siu_proclamation_people_proclamation_id_idx')
  @Column({ type: 'uuid' })
  proclamation_id!: string;

  @ManyToOne(() => SiuProclamation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proclamation_id' })
  proclamation!: SiuProclamation;

  @Index('siu_proclamation_people_person_id_idx')
  @Column({ type: 'uuid' })
  person_id!: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id' })
  person!: Person;

  @Column({
    type: 'enum',
    enum: SiuPersonRole,
    enumName: 'siu_person_role',
  })
  role!: SiuPersonRole;

  /** Editorial note on what this person did / what was found about them. */
  @Column({ type: 'text', nullable: true })
  summary!: string | null;
}
