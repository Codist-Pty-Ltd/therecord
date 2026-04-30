import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Reference row: one of eight civic-life lenses (housing, water, health, etc.).
 * Seeded by migration — not user-generated.
 */
@Entity('impact_sectors')
export class ImpactSector {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  icon!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  constitutional_right!: string | null;

  @Column({ type: 'text' })
  what_was_promised!: string;

  @Column({ type: 'text' })
  ground_reality!: string;

  @Column({ type: 'text' })
  plain_english_child!: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  stat_headline!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  stat_value!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stat_label!: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  stat_source!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  stat_year!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
