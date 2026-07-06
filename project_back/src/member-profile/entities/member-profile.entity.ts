import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';

export enum EmploymentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
}

export enum DepartureReason {
  RESIGNATION = 'resignation',
  TERMINATION = 'termination',
  END_OF_CONTRACT = 'end_of_contract',
  RETIREMENT = 'retirement',
  OTHER = 'other',
}

export enum ContractType {
  CDI = 'cdi',
  CDD = 'cdd',
  STAGE = 'stage',
  FREELANCE = 'freelance',
}

// Interface du snapshot de tâche stocké en JSONB
export interface TaskSnapshot {
  taskId: number;
  domain: 'IT' | 'Marketing' | 'CallCenter';
  title: string;
  delayHours: number;    // négatif = avance, positif = retard
  completedAt: string;   // ISO string
  points: number;        // points calculés pour cette tâche
}

@Entity('member_profiles')
@Index(['userId'], { unique: true })
@Index(['employmentStatus'])
@Index(['performanceRating'])
@Index(['attendanceRate'])
export class MemberProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // ── 1️⃣ Relations ────────────────────────────────────────────────────────
  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  userId: number;

  @ManyToOne(() => CompanyEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'companyId' })
  company: CompanyEntity | null;

  @Column({ nullable: true })
  companyId: number | null;

  // ── 2️⃣ Emploi ───────────────────────────────────────────────────────────
  @Column({ type: 'enum', enum: ContractType, default: ContractType.CDI })
  contractType: ContractType;

  @Column({ type: 'date' })
  hireDate: Date;

  @Column({ type: 'enum', enum: EmploymentStatus, default: EmploymentStatus.ACTIVE })
  employmentStatus: EmploymentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  position: string | null;

  // ── 3️⃣ Salaire ──────────────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseSalary: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  bonuses: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCompensation: number;

  // ── 4️⃣ Performance RH ───────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  performanceRating: number;

  @Column({ type: 'integer', default: 0 })
  projectsCompleted: number;

  // ── 5️⃣ Assiduité ────────────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  attendanceRate: number;

  @Column({ type: 'smallint', default: 0 })
  absenceCount: number;

  // ── 6️⃣ Départ ───────────────────────────────────────────────────────────
  @Column({ type: 'date', nullable: true })
  deactivationDate: Date | null;

  @Column({ type: 'enum', enum: DepartureReason, nullable: true })
  departureReason: DepartureReason | null;

  // ── 7️⃣ Score de performance tâches ─────────────────────────────────────
  // Score global calculé côté front et envoyé via PATCH /member-profiles/:userId/score

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  globalScore: number;

  @Column({ type: 'varchar', length: 3, default: 'F' })
  grade: string;                   // A+, A, B, C, D, F

  @Column({ type: 'integer', default: 0 })
  totalTasksDone: number;

  @Column({ type: 'integer', default: 0 })
  onTimeCount: number;

  @Column({ type: 'integer', default: 0 })
  earlyCount: number;

  @Column({ type: 'integer', default: 0 })
  lateCount: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  avgDelayHours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDelayHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  onTimeRate: number;

  // Scores par domaine
  @Column({ type: 'integer', default: 0 })
  itTasksDone: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  itScore: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  itAvgDelay: number;

  @Column({ type: 'integer', default: 0 })
  marketingTasksDone: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  marketingScore: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  marketingAvgDelay: number;

  @Column({ type: 'integer', default: 0 })
  callCenterTasksDone: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  callCenterScore: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  callCenterAvgDelay: number;

  // Snapshot des 10 dernières tâches complétées (JSONB)
  @Column({ type: 'jsonb', nullable: true })
  recentTasksSnapshot: TaskSnapshot[] | null;

  // Delta score depuis le dernier enregistrement
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  scoreEvolution: number | null;

  // Date du dernier calcul de score
  @Column({ type: 'timestamptz', nullable: true })
  scoreUpdatedAt: Date | null;

  // ── 8️⃣ Timestamps ───────────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}