import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  OneToMany,
  OneToOne,
  JoinColumn,

} from 'typeorm';
import { LeadInformationEntity } from 'src/leads/entities/lead.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';
@Entity('opportunities')
export class OpportunityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => LeadInformationEntity, lead => lead.opportunity)
  @JoinColumn()
  lead: LeadInformationEntity;
@ManyToOne(() => CompanyEntity)
company: CompanyEntity;

  @ManyToOne(() => UserEntity)
  createdBy: UserEntity; // AGENT_TELEPRO

@ManyToOne(() => UserEntity, { nullable: true })
assignedTo?: UserEntity | null;

  @Column({
    type: 'enum',
    enum: ['open', 'won', 'lost'],
    default: 'open',
  })
  status: string;

  @Column({ nullable: true })
  estimatedValue: number;

  @CreateDateColumn()
  createdAt: Date;
}

