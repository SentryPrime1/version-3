import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('scans')
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Scan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 2048 })
  @Index()
  url: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  userId: string;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  @Index()
  status: string;

  @Column({ type: 'json', nullable: true })
  options?: any;

  @Column({ type: 'json', nullable: true })
  results?: any;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @Column({ type: 'int', default: 0 })
  violationsCount: number;

  @Column({ type: 'int', default: 0 })
  warningsCount: number;

  @Column({ type: 'int', default: 0 })
  passedCount: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', nullable: true })
  processingTimeMs?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties for computed values
  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get isFailed(): boolean {
    return this.status === 'failed';
  }

  get isPending(): boolean {
    return this.status === 'pending';
  }

  get isProcessing(): boolean {
    return this.status === 'processing';
  }

  get totalIssues(): number {
    return this.violationsCount + this.warningsCount;
  }

  get successRate(): number {
    const total = this.violationsCount + this.warningsCount + this.passedCount;
    return total > 0 ? (this.passedCount / total) * 100 : 0;
  }
}

