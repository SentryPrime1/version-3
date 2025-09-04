import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scans')
export class Scan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 2048 })
  url: string;

  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  })
  status: 'pending' | 'completed' | 'failed';

  @Column({ type: 'jsonb', nullable: true })
  results: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
