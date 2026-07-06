import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToMany 
} from 'typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import { ProjectEntity } from 'src/projects/entities/project.entity';

@Entity('companies')
export class CompanyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  // 🔹 Relations avec les utilisateurs
  @OneToMany(() => UserEntity, user => user.company)
  users: UserEntity[];

  // 🔹 Relations avec les projets
  @OneToMany(() => ProjectEntity, project => project.company)
  projects: ProjectEntity[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
