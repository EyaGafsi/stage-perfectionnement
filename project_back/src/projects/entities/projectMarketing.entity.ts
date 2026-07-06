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
import { SprintMarketingEntity } from './SprintMarketingEntity.entity';
@Entity('project_marketing')
export class ProjectMarketingEntity {
  @PrimaryGeneratedColumn()
  id: number;


  @OneToOne(() => ProjectEntity, project => project.marketingDetails, { onDelete: 'CASCADE' })
  @JoinColumn()
  project: ProjectEntity;

  
  @Column({ nullable: true })
  campaignType: string; 

  @Column({ nullable: true })
  targetAudience: string; 

  @Column({ nullable: true })
  channels: string; 

  @Column({ type: 'int', nullable: true })
  estimatedDurationDays: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedBudget: number;

  @Column({ nullable: true })
  priority: string;

  @Column({ nullable: true })
  businessImpact: string; // Critical, Important, Normal

  // Équipe & ressources
  @Column({ type: 'int', nullable: true })
  teamSize: number;

  @Column({ nullable: true })
  mainGoals: string; // Ex: Leads, Trafic, Conversion

  @Column({ nullable: true })
  keyDeliverables: string; // Landing pages, visuels, rapports KPI

  // Suivi performance
  @Column({ nullable: true })
  metrics: string; // CTR, ROI, Engagement, Conversion Rate

  @Column({ nullable: true })
  dependencies: string; // Autres campagnes ou projets nécessaires

  @Column({ nullable: true })
  risks: string; // Faible engagement, dépassement budget

  @Column({ nullable: true })
  additionalNotes: string;
   @OneToMany(() => SprintMarketingEntity, sprint => sprint.project)
  sprints: SprintMarketingEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
