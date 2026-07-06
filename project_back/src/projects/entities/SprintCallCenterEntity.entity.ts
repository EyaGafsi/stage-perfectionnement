import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany 
} from 'typeorm';
import { ProjectCallCenterEntity } from './projectCallCenter.entity';
import { TaskCallCenterEntity } from './TaskCallCenterEntity.entity';

@Entity('sprints_callcenter')
export class SprintCallCenterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => ProjectCallCenterEntity, project => project.sprints, { onDelete: 'CASCADE' })
  project: ProjectCallCenterEntity;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: 'planned' })
  status: string;

  @Column({ type: 'int', nullable: true })
  targetAgents: number;

  @Column({ type: 'int', nullable: true })
  expectedCallVolume: number;

  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 2 })
  targetConversionRate: number;

  @Column({ type: 'int', nullable: true })
  budgetAllocated: number;

  @Column({ type: 'int', nullable: true })
  qualityScoreTarget: number;

  @Column({ nullable: true })
  priority: string;

  @Column({ nullable: true })
  trainingContent: string;

  @Column({ nullable: true })
  scriptTemplates: string;

  @Column({ nullable: true })
  goals: string;

  @Column({ nullable: true })
  complexity: string;

  @Column({ nullable: true })
  risks: string;

  @Column({ nullable: true })
  dependencies: string;

  @Column({ nullable: true })
  additionalNotes: string;

  @OneToMany(() => TaskCallCenterEntity, task => task.sprint)
  tasks: TaskCallCenterEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}