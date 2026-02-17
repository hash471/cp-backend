import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../enums/role.enum';
import { Zone } from '../enums/zone.enum';
import { SubDivision } from '../enums/sub-division.enum';

@Entity('officers')
export class Officer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  username: string;

  @Column()
  mobileNumber: string;

  @Column()
  password: string;

  @Column({ type: 'varchar' })
  role: Role;

  @Column({ type: 'varchar', nullable: true })
  zone: Zone | null;

  @Column({ type: 'varchar', nullable: true })
  subDivision: SubDivision | null;

  @Column({ type: 'varchar', nullable: true })
  policeStation: string | null;

  @Column({ type: 'varchar', nullable: true })
  designation: string;

  @Column({ type: 'varchar', nullable: true })
  badgeNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
