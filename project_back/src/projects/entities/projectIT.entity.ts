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
import { SprintITEntity } from './SprintITEntity.entity';
@Entity('project_it')
export class ProjectITEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Relation One-to-One avec Project
  @OneToOne(() => ProjectEntity, project => project.itDetails, { onDelete: 'CASCADE' })
  @JoinColumn()
  project: ProjectEntity;

  @OneToMany(() => SprintITEntity, sprint => sprint.projectIT)
  sprints: SprintITEntity[];
  // 🔹 Infos techniques
  @Column({ nullable: true })
  programmingLanguages: string; // TypeScript, Python, Java, etc.

  @Column({ nullable: true })
  framework: string; // React, NestJS, Django, Spring

  @Column({ nullable: true })
  database: string; // PostgreSQL, MySQL, MongoDB

  @Column({ nullable: true })
  serverDetails: string; // AWS EC2, Docker, Kubernetes

  @Column({ nullable: true })
  architecture: string; // Microservices, Monolith, Serverless

  @Column({ nullable: true })
  apiIntegration: string; // REST, GraphQL, SOAP

  @Column({ nullable: true })
  securityRequirements: string; // OAuth2, JWT, SSL/TLS

  @Column({ nullable: true })
  devOpsRequirements: string; // CI/CD, Docker, Jenkins

  // 🔹 Infos pour planification et estimation
  @Column({ type: 'int', nullable: true })
  estimatedDurationDays: number; // durée estimée en jours

  @Column({ type: 'decimal', nullable: true, precision: 10, scale: 2 })
  estimatedCost: number; // coût estimé

  @Column({ nullable: true })
  priority: string; // High, Medium, Low

  @Column({ nullable: true })
  businessImpact: string; // Critical, Important, Normal

  @Column({ type: 'int', nullable: true })
  teamSize: number; // nombre de membres nécessaires

  @Column({ nullable: true })
  complexity: string; // Low, Medium, High

  // 🔹 Découpage des modules et livrables
  @Column({ nullable: true })
  mainModules: string; // Auth, Payment, Dashboard, etc.

  @Column({ nullable: true })
  keyDeliverables: string; // API v1, Frontend v1

  @Column({ nullable: true })
  dependencies: string; // autres projets ou services nécessaires

  @Column({ nullable: true })
  risks: string; // risques identifiés (retard, bug critique, etc.)

  @Column({ nullable: true })
  additionalNotes: string; // infos diverses, remarques, liens docs

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
