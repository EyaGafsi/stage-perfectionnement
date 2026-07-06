import { 
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, 
  UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, OneToOne 
} from 'typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';
import { ProjectCallCenterEntity } from './projectCallCenter.entity';
import { ProjectMarketingEntity } from './projectMarketing.entity';
import { ProjectITEntity } from './projectIT.entity';

export enum ProjectStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum ProjectDomain {
  IT = 'IT',
  MARKETING = 'Marketing',
  CALLCENTER = 'CallCenter',
}

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.PLANNED })
  status: ProjectStatus;

  @Column({ type: 'enum', enum: ProjectDomain })
  domain: ProjectDomain;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @ManyToOne(() => CompanyEntity, company => company.projects, { nullable: false, onDelete: 'CASCADE' })
  company: CompanyEntity;

  // 🔹 CELUI QUI CRÉE (Le Manager Admin)
  @ManyToOne(() => UserEntity)
  createdBy: UserEntity; 

  // 🔹 CELUI QUI EST AFFECTÉ (Le Project Manager)
  @ManyToOne(() => UserEntity, user => user.managedProjects, { nullable: true, onDelete: 'SET NULL' })
  projectManager: UserEntity;

  @ManyToMany(() => UserEntity)
  @JoinTable({
    name: 'project_members',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  assignedTo: UserEntity[];

  @OneToOne(() => ProjectCallCenterEntity, detail => detail.project, { cascade: true })
  callCenterDetails: ProjectCallCenterEntity;

  @OneToOne(() => ProjectMarketingEntity, detail => detail.project, { cascade: true })
  marketingDetails: ProjectMarketingEntity;

  @OneToOne(() => ProjectITEntity, detail => detail.project, { cascade: true })
  itDetails: ProjectITEntity;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}