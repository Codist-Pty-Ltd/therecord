import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

export enum LawCategory {
  CORRUPTION = 'corruption',
  POLICING = 'policing',
  PROSECUTION = 'prosecution',
  ORGANISED_CRIME = 'organised_crime',
  WHISTLEBLOWER = 'whistleblower',
  CONSTITUTIONAL = 'constitutional',
  OTHER = 'other',
}

@Entity('laws')
@Index('laws_short_name_idx', ['short_name'])
@Index('laws_category_idx', ['category'])
export class Law {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'varchar', length: 500 })
  name!: string;

  /** Common short name — e.g. 'PRECCA', 'SAPS Act', 'POCA'. */
  @Column({ type: 'varchar', length: 50 })
  short_name!: string;

  /** Act number — e.g. '12 of 2004'. */
  @Column({ type: 'varchar', length: 100 })
  act_number!: string;

  @Column({
    type: 'enum',
    enum: LawCategory,
    enumName: 'law_category',
  })
  category!: LawCategory;

  /** Plain-English explanation of what this law means, readable by a child. */
  @Column({ type: 'text' })
  plain_english!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  full_text_url!: string | null;
}
