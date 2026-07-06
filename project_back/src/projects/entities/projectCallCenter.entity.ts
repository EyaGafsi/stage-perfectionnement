import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { SprintCallCenterEntity } from './SprintCallCenterEntity.entity';
@Entity('project_callcenter')
export class ProjectCallCenterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => ProjectEntity, project => project.callCenterDetails, { onDelete: 'CASCADE' })
  @JoinColumn()
  project: ProjectEntity;

  @Column({ type: 'int', nullable: true })
  numberOfAgents: number;

  @Column({ type: 'int', nullable: true })
  numberOfCallsPerDay: number;

  @Column({ nullable: true })
  callTypes: string; // ex: "Tech;Support;Sales"

  // ── MODIFIÉ : était string, maintenant int (secondes) ──
  @Column({ type: 'int', nullable: true })
  slaTargetSeconds: number;

  // ── MODIFIÉ : était string, maintenant float (secondes) ──
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  averageHandleTimeSec: number;

  @Column({ type: 'int', nullable: true })
  estimatedDurationDays: number;

  // ── NOUVEAU ──
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  CSAT: number;

  // ── NOUVEAU ──
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  FCR: number;

  // ── NOUVEAU ──
  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  risksScore: number;

  @Column({ nullable: true })
  dependencies: string; // ex: "AI;CRM;IVR"

  @Column({ nullable: true })
  mainGoals: string;

  @Column({ nullable: true })
  additionalNotes: string;

  @Column({ type: 'int', nullable: true })
  teamSize: number;
  @Column({ type: 'int', nullable: true })
  estimatedBudget: number;

  @Column({ nullable: true })
  priority: string;
  @OneToMany(() => SprintCallCenterEntity, sprint => sprint.project)
  sprints: SprintCallCenterEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}