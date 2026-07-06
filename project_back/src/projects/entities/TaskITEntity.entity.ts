import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import { SprintITEntity } from './SprintITEntity.entity';
 
export enum TaskType {
  FEATURE = 'FEATURE',
  BUG = 'BUG',
  IMPROVEMENT = 'IMPROVEMENT',
  TASK = 'TASK',
  STORY = 'STORY',
}
 
export enum TaskStatus {
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}
 
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
 
@Entity('tasks_it')
export class TaskITEntity {
  @PrimaryGeneratedColumn()
  id: number;
 
  @Column()
  title: string;
 
  @Column({ nullable: true, type: 'text' })
  description: string;
 
  @Column({ type: 'enum', enum: TaskType, default: TaskType.FEATURE })
  type: TaskType;
 
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TO_DO })
  @Index()
  status: TaskStatus;
 
  @Column({ type: 'enum', enum: TaskPriority, nullable: true })
  priority: TaskPriority;
 
  @Column({ type: 'int', nullable: true })
  storyPoints: number;
 
  @Column({ type: 'decimal', nullable: true, precision: 7, scale: 2 })
  estimatedHours: number;

  @Column({ type: 'decimal', nullable: true, precision: 7, scale: 2 })
  aiEstimatedHours: number;

  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 4 })
  aiDelayRiskProbability: number;

  @Column({ type: 'text', nullable: true })
  aiPredictedDelayReason: string;
 
  @Column({ type: 'int', nullable: true })
  complexityScore: number; // 1 → 5
 
  @Column({ type: 'int', nullable: true })
  riskLevel: number; // 1 → 5
 
  @Column({ type: 'int', default: 0 })
  dependenciesCount: number;
 
  @Column({ type: 'boolean', default: false })
  hasBlockingDependencies: boolean;
 
  // Champs textuels utilisés dans le DTO (stockés comme texte)
  @Column({ nullable: true, type: 'text' })
  dependencies: string;
 
  @Column({ nullable: true, type: 'text' })
  risks: string;
 
  @Column({ nullable: true })
  complexity: string; // 'Low' | 'Medium' | 'High'
 
  @ManyToOne(() => UserEntity, { nullable: true })
  assignedTo: UserEntity;
 
  @ManyToOne(() => SprintITEntity, (sprint) => sprint.tasks, { onDelete: 'CASCADE' })
  sprint: SprintITEntity;
 
  @ManyToOne(() => UserEntity, { nullable: true })
  reporter: UserEntity;
 
  @Column({ nullable: true })
  additionalNotes: string;
 
  @CreateDateColumn()
  createdAt: Date;
 
  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;
 
  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;
 
  @Column({ type: 'decimal', nullable: true, precision: 10, scale: 2 })
  durationHours: number;
 
  @Column({ type: 'int', default: 0 })
  commentsCount: number;
 
  @Column({ type: 'int', default: 0 })
  reopenCount: number;
 
  @Column({ type: 'int', default: 0 })
  attachmentsCount: number;
 
  @Column({ type: 'decimal', nullable: true, precision: 10, scale: 2 })
  workLogHours: number;
  @Column({ type: 'timestamp', nullable: true })
  scheduledStartDate: Date;  // ← Date planifiée de début (saisie utilisateur)

  @Column({ type: 'timestamp', nullable: true })
  scheduledEndDate: Date; // Date limite

  @Column({ type: 'timestamp', nullable: true })
  actualEndDate: Date; // Quand marqué DONE

  @Column({ type: 'decimal', nullable: true, precision: 10, scale: 2 })
  delayHours: number; // Retard automatique (positif=retard, négatif=avance)

  @Column({ type: 'text', nullable: true })
  delayReason: string;
}