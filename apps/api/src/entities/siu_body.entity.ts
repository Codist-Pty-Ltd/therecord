import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

/**
 * The Special Investigating Unit as an institution — a singleton.
 *
 * The SIU sits in a category of its own: an *executive statutory* body
 * that, unlike a {@link Commission} of inquiry, is permanent, and unlike
 * an {@link AdhocCommittee}, can recover money via the Special Tribunal.
 * It is activated per investigation by a Presidential {@link SiuProclamation};
 * the body itself never goes away.
 *
 * Because there is only ever one SIU, the table holds a single row and
 * exists primarily so the institution's metadata (mandate, hotline, head)
 * has a stable home that the API can join against without hard-coding
 * those fields in app code.
 */
@Entity('siu_body')
export class SiuBody {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({
    type: 'varchar',
    length: 200,
    default: 'Special Investigating Unit',
  })
  name!: string;

  @Column({ type: 'varchar', length: 10, default: 'SIU' })
  abbreviation!: string;

  @Column({
    type: 'varchar',
    length: 200,
    default: 'Special Investigating Units and Special Tribunals Act 74 of 1996',
  })
  enabling_legislation!: string;

  /**
   * Date the SIU was established by Presidential Proclamation R24 of 1997
   * (signed by Nelson Mandela). Stored as a Postgres `date` so it formats
   * cleanly as `YYYY-MM-DD` in API responses.
   */
  @Column({ type: 'date', default: '1997-07-14' })
  established_date!: string;

  @Column({
    type: 'varchar',
    length: 200,
    default:
      'Rentmeester Building, 74 Watermeyer Street, Meyerspark, Pretoria',
  })
  headquarters!: string;

  @Column({ type: 'varchar', length: 50, default: '0800 037 774' })
  hotline!: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  current_head!: string | null;

  @Column({
    type: 'varchar',
    length: 200,
    default: 'https://www.siu.org.za',
  })
  website_url!: string;

  /** Editorial summary of the SIU's mandate and powers. */
  @Column({ type: 'text' })
  mandate_summary!: string;

  /** Child-level paragraph — what the SIU does in plain English. */
  @Column({ type: 'text' })
  plain_english_summary!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
