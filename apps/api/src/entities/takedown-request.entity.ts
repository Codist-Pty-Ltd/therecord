import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TakedownRequestType {
  COPYRIGHT = 'copyright',
  FACTUAL_CORRECTION = 'factual_correction',
  POPIA_ACCESS = 'popia_access',
  POPIA_DELETION = 'popia_deletion',
  POPIA_OBJECTION = 'popia_objection',
  OTHER = 'other',
}

export enum TakedownRequestStatus {
  RECEIVED = 'received',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

@Entity('takedown_requests')
export class TakedownRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 40 })
  request_type!: TakedownRequestType;

  @Column({ type: 'varchar', length: 300 })
  requestor_name!: string;

  @Column({ type: 'varchar', length: 300 })
  requestor_email!: string;

  @Column({ type: 'varchar', length: 2000 })
  content_url!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 32, default: TakedownRequestStatus.RECEIVED })
  status!: TakedownRequestStatus;

  @Column({ type: 'text', nullable: true })
  resolution_notes!: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  received_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
