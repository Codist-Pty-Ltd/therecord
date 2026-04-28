import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PersonStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CHARGED = 'charged',
  ACQUITTED = 'acquitted',
  RESIGNED = 'resigned',
  UNKNOWN = 'unknown',
}

@Entity('people')
@Index('people_full_name_idx', ['full_name'])
@Index('people_status_idx', ['status'])
export class Person {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'varchar', length: 300 })
  full_name!: string;

  /** Known aliases, surnames, titles — e.g. ["Mkhwanazi", "Lucky", "Lt Gen Mkhwanazi"]. */
  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'::text[]",
  })
  aliases!: string[];

  @Column({ type: 'varchar', length: 300, nullable: true })
  current_role!: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  organisation!: string | null;

  @Column({
    type: 'enum',
    enum: PersonStatus,
    enumName: 'person_status',
    default: PersonStatus.UNKNOWN,
  })
  status!: PersonStatus;

  @Column({ type: 'text', nullable: true })
  profile_summary!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
