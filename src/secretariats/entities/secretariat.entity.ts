import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A secretariat (ward / grama-ward sachivalayam) that belongs to a police station.
 * Linked to a police station by name (`policeStation`), matching how complaints and
 * officers reference stations throughout this codebase.
 */
@Entity('secretariats')
@Index(['policeStation', 'name'])
export class Secretariat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  /** Name of the police station this secretariat belongs to (matches PoliceStation.name). */
  @Column()
  @Index()
  policeStation: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
