import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  ManyToMany,
  OneToMany,
  JoinColumn 
} from 'typeorm';
import { ProjectEntity } from 'src/projects/entities/project.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';
import {TaskITEntity} from 'src/projects/entities/TaskITEntity.entity'; 

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN_COMPANY = 'admin_company',

  MANAGER = 'manager',
  PROJECT_MANAGER = 'project_manager',

  CALL_CENTER_MANAGER = 'call_center_manager',
  SALES_MANAGER = 'sales_manager',
  MARKETING_MANAGER = 'marketing_manager',
  QUALITY_MANAGER = 'quality_manager',
  HR_MANAGER = 'hr_manager',

  AGENT_TELEPRO = 'agent_telepro',
  COMMERCIAL = 'commercial',
  MARKETING_AGENT = 'marketing_agent',
  QUALITE_AGENT = 'qualite_agent',
  TECH_SUPPORT = 'tech_support',

  MEMBER = 'member',
}

export enum MemberLevel {
  JUNIOR = 'junior',
  SENIOR = 'senior',
  EXPERT = 'expert',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  numtel: string;

  @Column({ nullable: false })
  fullname: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: MemberLevel,
    nullable: true,
  })
  memberlevel?: MemberLevel | null;
  @Column({ nullable: true })
  cvlink: string;

  @Column({ nullable: true })
  companyId?: number | null;
  @ManyToOne(() => CompanyEntity, company => company.users, {
    nullable: true, 
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'companyId' })
  company?: CompanyEntity | null;
  @OneToMany(() => ProjectEntity, project => project.createdBy)
  createdProjects: ProjectEntity[];

  // 🔹 Les projets que cet utilisateur GÈRE (Project Manager)
  @OneToMany(() => ProjectEntity, project => project.projectManager)
  managedProjects: ProjectEntity[];

  // 🔹 Les projets où cet utilisateur est MEMBRE (ManyToMany inverse)
  @ManyToMany(() => ProjectEntity, project => project.assignedTo)
  assignedProjects: ProjectEntity[];
  // user entity (extrait)
  @OneToMany(() => TaskITEntity, task => task.assignedTo)
  assignedTasks?: TaskITEntity[];


  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



export const ROLE_CREATION_RULES: Partial<Record<UserRole, UserRole[]>> = {
  [UserRole.SUPER_ADMIN]: Object.values(UserRole),

  [UserRole.ADMIN_COMPANY]: [
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,

    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT,
    UserRole.MEMBER,
  ],

  [UserRole.MANAGER]: [
    UserRole.MEMBER,
    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT,
    UserRole.PROJECT_MANAGER,
  ],

  [UserRole.PROJECT_MANAGER]: [UserRole.MEMBER],

  [UserRole.CALL_CENTER_MANAGER]: [UserRole.AGENT_TELEPRO],
  [UserRole.SALES_MANAGER]: [UserRole.COMMERCIAL],
  [UserRole.MARKETING_MANAGER]: [UserRole.MARKETING_AGENT],
  [UserRole.QUALITY_MANAGER]: [UserRole.QUALITE_AGENT],
  [UserRole.HR_MANAGER]: [
    UserRole.MEMBER,
    UserRole.PROJECT_MANAGER,
  ],
};
