import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany 
} from 'typeorm';
import { ProjectMarketingEntity } from './projectMarketing.entity';
import { TaskMarketingEntity } from './TaskMarketingEntity.entity';

@Entity('sprints_marketing')
export class SprintMarketingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => ProjectMarketingEntity, project => project.sprints, { onDelete: 'CASCADE' })
  project: ProjectMarketingEntity;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: 'planned' })
  status: string; // 'planned', 'active', 'completed', 'cancelled'

  @Column({ type: 'int', nullable: true })
  totalBudget: number; // Budget alloué au sprint

  @Column({ type: 'int', default: 0 })
  spentBudget: number; // Budget dépensé

  @Column({ nullable: true })
  campaignType: string; // Email, Social Media, SEO, PPC, etc.

  @Column({ nullable: true })
  targetAudience: string; // Public cible

  @Column({ type: 'int', nullable: true })
  expectedReach: number; // Portée attendue

  @Column({ type: 'int', nullable: true })
  expectedLeads: number; // Leads attendus

  @Column({ type: 'int', nullable: true })
  expectedConversions: number; // Conversions attendues

  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 2 })
  expectedROI: number; // ROI attendu (%)

  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 2 })
  expectedCTR: number; // CTR attendu (%)

  @Column({ nullable: true })
  channels: string; // Canaux de marketing (JSON stringifié ou texte)

  @Column({ nullable: true })
  priority: string; // High, Medium, Low

  @Column({ nullable: true })
  goals: string; // Objectifs du sprint

  @Column({ nullable: true })
  complexity: string; // Low, Medium, High

  @Column({ nullable: true })
  risks: string; // Risques identifiés

  @Column({ nullable: true })
  dependencies: string; // Dépendances

  @Column({ nullable: true })
  additionalNotes: string;

  @OneToMany(() => TaskMarketingEntity, task => task.sprint)
  tasks: TaskMarketingEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}