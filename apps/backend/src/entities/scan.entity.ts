import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scans')
export class Scan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  userId: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'json', nullable: true })
  options?: any;

  @Column({ type: 'json', nullable: true })
  results?: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
