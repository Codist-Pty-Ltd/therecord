import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

/**
 * The Special Tribunal as an institution — a singleton.
 *
 * Established in April 2019 under section 2 of the SIU Act, the Special
 * Tribunal is a court-like body whose entire jurisdiction is civil matters
 * arising from SIU investigations: contract cancellation, asset forfeiture
 * and money recovery. Before its creation the SIU had to take everything
 * to mainstream High Courts; the Tribunal exists to fast-track those
 * matters.
 *
 * Like {@link SiuBody}, only one row exists. It carries the institutional
 * metadata the API joins against when surfacing tribunal cases.
 */
@Entity('special_tribunal')
export class SpecialTribunal {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'varchar', length: 200, default: 'Special Tribunal' })
  name!: string;

  @Column({ type: 'date', default: '2019-04-05' })
  established_date!: string;

  @Column({
    type: 'varchar',
    length: 300,
    default:
      'Special Investigating Units and Special Tribunals Act 74 of 1996 Section 2',
  })
  enabling_legislation!: string;

  @Column({ type: 'text' })
  plain_english_summary!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  website_url!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
