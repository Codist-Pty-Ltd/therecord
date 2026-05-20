import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity('historical_eras')
@Index('historical_eras_order_idx', ['order_index'])
export class HistoricalEra {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  period!: string;

  @Column({ type: 'int', name: 'order_index' })
  order_index!: number;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ type: 'text', name: 'plain_english_child' })
  plain_english_child!: string;

  @Column({ type: 'text', name: 'plain_english_layperson' })
  plain_english_layperson!: string;

  /** Constitutional / doctrinal framing (maps to Bill of Rights where relevant). */
  @Column({ type: 'text', name: 'plain_english_legal' })
  plain_english_legal!: string;

  @Column({ type: 'varchar', length: 300, nullable: true, name: 'key_theme' })
  key_theme!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  icon!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
