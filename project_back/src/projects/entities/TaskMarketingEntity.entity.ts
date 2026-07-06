import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import { SprintMarketingEntity } from './SprintMarketingEntity.entity';

export enum TaskMarketingType {
  CAMPAIGN = 'CAMPAIGN',
  CONTENT_CREATION = 'CONTENT_CREATION',
  SEO = 'SEO',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  EMAIL = 'EMAIL',
  PPC = 'PPC',
  ANALYTICS = 'ANALYTICS',
  DESIGN = 'DESIGN',
  COPYWRITING = 'COPYWRITING',
  OTHER = 'OTHER',
}

export enum TaskMarketingStatus {
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export enum TaskMarketingPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('tasks_marketing')
export class TaskMarketingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: TaskMarketingType, default: TaskMarketingType.CAMPAIGN })
  type: TaskMarketingType;

  @Column({ type: 'enum', enum: TaskMarketingStatus, default: TaskMarketingStatus.TO_DO })
  @Index()
  status: TaskMarketingStatus;

  @Column({ type: 'enum', enum: TaskMarketingPriority, nullable: true })
  priority: TaskMarketingPriority;

  @Column({ type: 'int', nullable: true })
  estimatedHours: number;

  @Column({ type: 'decimal', nullable: true, precision: 10, scale: 2 })
  budget: number; // Budget pour cette tâche

  @Column({ type: 'int', nullable: true })
  expectedViews: number; // Vues attendues

  @Column({ type: 'int', nullable: true })
  expectedClicks: number; // Clics attendus

  @Column({ type: 'int', nullable: true })
  expectedLeads: number; // Leads attendus

  @Column({ type: 'int', nullable: true })
  expectedConversions: number; // Conversions attendues

  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 2 })
  expectedCTR: number; // CTR attendu (%)

  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 2 })
  expectedConversionRate: number; // Conversion rate attendu (%)

  @Column({ nullable: true })
  platforms: string; // Plateformes concernées (JSON stringifié)

  @Column({ nullable: true })
  channel: string; // Canal marketing (Facebook, Google, LinkedIn, etc.)

  @Column({ type: 'int', default: 0 })
  complexityScore: number; // 1 → 5

  @Column({ type: 'int', default: 0 })
  riskLevel: number; // 1 → 5

  @Column({ nullable: true, type: 'text' })
  dependencies: string;

  @Column({ nullable: true, type: 'text' })
  risks: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  assignedTo: UserEntity;

  @ManyToOne(() => SprintMarketingEntity, (sprint) => sprint.tasks, { onDelete: 'CASCADE' })
  sprint: SprintMarketingEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  reporter: UserEntity;

  @Column({ nullable: true })
  additionalNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledEndDate: Date;
    @Column({ type: 'timestamp', nullable: true })
  scheduledStartDate: Date;

  @Column({ type: 'decimal', nullable: true, precision: 10, scale: 2 })
  delayHours: number; // Retard automatique

  @Column({ type: 'int', default: 0 })
  reopenCount: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  delayReason: string;
}