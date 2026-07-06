import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany 
} from 'typeorm';
import { ProjectITEntity } from './projectIT.entity';
import { TaskITEntity } from './TaskITEntity.entity';

@Entity('sprints_it')
export class SprintITEntity {
  @PrimaryGeneratedColumn()
  id: number;


  @Column()
  name: string;


  @ManyToOne(() => ProjectITEntity, projectIT => projectIT.sprints, { onDelete: 'CASCADE' })
  projectIT: ProjectITEntity;


  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;


  @Column({ default: 'planned' })
  status: string;

  @Column({ type: 'int', nullable: true })
  totalStoryPoints: number;

  @Column({ nullable: true })
  priority: string;

  @Column({ nullable: true })
  risks: string;

  @Column({ nullable: true })
  dependencies: string;

  @Column({ type: 'int', nullable: true })
  teamSize: number;

  @Column({ nullable: true })
  complexity: string;

  @Column({ nullable: true })
  additionalNotes: string;

  @OneToMany(() => TaskITEntity, task => task.sprint)
  tasks: TaskITEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
