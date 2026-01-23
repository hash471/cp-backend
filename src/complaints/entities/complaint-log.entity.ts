import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ComplaintStatus } from '../enums/complaint-status.enum';
import { Complaint } from './complaint.entity';

@Entity('complaint_logs')
export class ComplaintLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  complaintId: string;

  @ManyToOne(() => Complaint, (complaint) => complaint.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'complaintId' })
  complaint: Complaint;

  @Column({ type: 'varchar', nullable: true })
  previousStatus: ComplaintStatus | null;

  @Column({ type: 'varchar' })
  newStatus: ComplaintStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  updatedBy: string;

  @Column({ type: 'text', nullable: true })
  changeDescription: string;

  @CreateDateColumn()
  createdAt: Date;
}
