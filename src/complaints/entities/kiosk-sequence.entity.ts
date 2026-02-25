import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from 'typeorm';

@Entity('kiosk_sequences')
@Unique(['kioskNumber', 'date'])
export class KioskSequence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  kioskNumber: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: 0 })
  currentNumber: number;
}
