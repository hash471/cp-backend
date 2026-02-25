import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { ComplaintStatus } from '../enums/complaint-status.enum';
import { Gender } from '../enums/gender.enum';
import { ComplaintLog } from './complaint-log.entity';

@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  complaintNumber: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  policeStation: string;

  @Column({ nullable: true })
  citizenName: string;

  @Column({ nullable: true })
  mobileNumber: string;

  @Column({ type: 'varchar', nullable: true })
  gender: Gender;

  @Column({ nullable: true })
  aadharNumber: string;

  @Column({ nullable: true })
  fatherOrMotherName: string;

  @Column({ type: 'text', nullable: true })
  permanentAddress: string;

  @Column({ type: 'text', nullable: true })
  presentAddress: string;

  @Column({ nullable: true })
  pincode: string;

  @Column({ type: 'text', nullable: true })
  locationOfIncident: string;

  @Column({ type: 'text', nullable: true })
  complaintSummary: string;

  @Column({
    type: 'varchar',
    default: ComplaintStatus.NEW,
  })
  status: ComplaintStatus;

  @Column({ nullable: true })
  kioskNumber: string;

  @Column({ nullable: true })
  kioskLocation: string;

  @Column({ nullable: true })
  firNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ComplaintLog, (log) => log.complaint, { cascade: true })
  logs: ComplaintLog[];

  @BeforeInsert()
  generateComplaintNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = this.kioskNumber ? `${this.kioskNumber}-` : '';
    this.complaintNumber = `${prefix}CP-${timestamp}-${random}`;
  }
}
