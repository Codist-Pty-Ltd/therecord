import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SubscriberStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  UNSUBSCRIBED = 'unsubscribed',
}

@Entity('subscribers')
@Index('subscribers_status_idx', ['status'])
export class Subscriber {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  name!: string | null;

  @Column({
    type: 'enum',
    enum: SubscriberStatus,
    enumName: 'subscriber_status',
    default: SubscriberStatus.PENDING,
  })
  status!: SubscriberStatus;

  @Column({ type: 'uuid', nullable: true })
  confirm_token!: string | null;

  @Column({ type: 'uuid' })
  unsubscribe_token!: string;

  @Column({ type: 'timestamptz', nullable: true })
  confirmed_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  unsubscribed_at!: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  source!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_email_sent_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
