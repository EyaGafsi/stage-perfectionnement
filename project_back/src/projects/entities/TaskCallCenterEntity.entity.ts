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
import { SprintCallCenterEntity } from './SprintCallCenterEntity.entity';

export enum TaskCallCenterType {
  // ── Nouveaux types frontend ──
  OUTBOUND    = 'OUTBOUND',
  INBOUND     = 'INBOUND',
  FOLLOW_UP   = 'FOLLOW_UP',
  SURVEY      = 'SURVEY',
  APPOINTMENT = 'APPOINTMENT',
  RETENTION   = 'RETENTION',
  UPSELL      = 'UPSELL',
  SUPPORT     = 'SUPPORT',
  QA          = 'QA',
  OTHER       = 'OTHER',
  // ── Anciens types du modèle ML (gardés pour compatibilité DB) ──
  TRAINING          = 'TRAINING',
  CAMPAIGN          = 'CAMPAIGN',
  QUALITY_ASSURANCE = 'QUALITY_ASSURANCE',
  SCRIPTING         = 'SCRIPTING',
  COACHING          = 'COACHING',
  REPORTING         = 'REPORTING',
  SYSTEM_SETUP      = 'SYSTEM_SETUP',
}

export enum TaskCallCenterStatus {
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export enum TaskCallCenterPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('tasks_callcenter')
export class TaskCallCenterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: TaskCallCenterType, default: TaskCallCenterType.TRAINING })
  type: TaskCallCenterType;

  @Column({ type: 'enum', enum: TaskCallCenterStatus, default: TaskCallCenterStatus.TO_DO })
  @Index()
  status: TaskCallCenterStatus;

  @Column({ type: 'enum', enum: TaskCallCenterPriority, nullable: true })
  priority: TaskCallCenterPriority;

  @Column({ type: 'int', nullable: true })
  estimatedHours: number;

  @Column({ type: 'int', nullable: true })
  targetAgentCount: number; // Nombre d'agents à former/coacher

  @Column({ type: 'int', nullable: true })
  expectedCallsPerAgent: number; // Appels par agent

  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 2 })
  targetConversionRate: number; // Taux de conversion (%)

  @Column({ type: 'int', nullable: true })
  qualityScoreTarget: number; // Score de qualité cible (0-100)

  @Column({ nullable: true, type: 'text' })
  scriptContent: string; // Contenu du script

  @Column({ nullable: true, type: 'text' })
  trainingMaterial: string; // Matériel de formation

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

  @ManyToOne(() => SprintCallCenterEntity, (sprint) => sprint.tasks, { onDelete: 'CASCADE' })
  sprint: SprintCallCenterEntity;

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
  scheduledStartDate: Date;   // ← add this after scheduledEndDate

  @Column({ type: 'timestamp', nullable: true })
  scheduledEndDate: Date;

  @Column({ type: 'decimal', nullable: true, precision: 10, scale: 2 })
  delayHours: number; // Retard automatique

  @Column({ type: 'int', default: 0 })
  reopenCount: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  delayReason: string;
}