import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Zone } from '../../officers/enums/zone.enum';
import { SubDivision } from '../../officers/enums/sub-division.enum';
import { StationType } from '../enums/station-type.enum';

@Entity('police_stations')
export class PoliceStation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  pincode: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', default: StationType.LAW_AND_ORDER })
  type: StationType;

  @Column({ type: 'varchar', nullable: true })
  zone: Zone | null;

  @Column({ type: 'varchar', nullable: true })
  subDivision: SubDivision | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
