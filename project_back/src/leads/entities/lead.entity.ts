import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  OneToMany,
  OneToOne, 
} from 'typeorm';
import { OpportunityEntity } from 'src/opportunities/entities/opportunity.entity';
import { LeadQualificationEntity } from './leadqualification.entity';
import { CallEntity } from 'src/calls/entities/call.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';
import { UserEntity } from 'src/user/entities/user.entity';
@Entity('lead_information')
export class LeadInformationEntity {
  @PrimaryGeneratedColumn()
  id: number;


  @Column()
  fullname: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  // Origine / canal
  @Column({ nullable: true })
  leadOrigin: string;

  @Column({ nullable: true })
  leadSource: string;

  @Column({ default: false })
  doNotEmail: boolean;

  @Column({ default: false })
  doNotCall: boolean;

  // Comportement web
  @Column({ nullable: true })
  totalVisits: number;

  @Column({ nullable: true })
  totalTimeOnWebsite: number;

  @Column({ nullable: true })
  pageViewsPerVisit: number;

  // Dernière activité
  @Column({ nullable: true })
  lastActivity: string;

  // Profil
  @Column({ nullable: true })
  specialization: string;

  @Column({ nullable: true })
  currentOccupation: string;

  @Column({ nullable: true })
  search: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @ManyToOne(() => UserEntity)
  assignedTo: UserEntity;
  @ManyToOne(() => CompanyEntity)
  company: CompanyEntity;

  @OneToOne(() => LeadQualificationEntity, qualification => qualification.leadInformation)
  qualification: LeadQualificationEntity;

@OneToMany(() => CallEntity, call => call.lead)
calls: CallEntity[];

@OneToOne(() => OpportunityEntity, opportunity => opportunity.lead)
opportunity: OpportunityEntity;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
