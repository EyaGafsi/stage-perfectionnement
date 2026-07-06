import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  OneToMany 
} from 'typeorm';
import { CompanyEntity } from 'src/companies/entities/company.entity';
@Entity('scripts')
export class ScriptEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => CompanyEntity)
   company: CompanyEntity;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ default: true })
  isActive: boolean;
}
