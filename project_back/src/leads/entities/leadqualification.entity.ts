import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  OneToMany,
  OneToOne,
  JoinColumn 
} from 'typeorm';
import { LeadInformationEntity } from './lead.entity';

export enum InterestLevel {
  COLD = 'cold',
  WARM = 'warm',
  HOT = 'hot',
}
export enum STATUS {
NEW ='new',
CONTACTED='contacted',
QUALIFIED='qualified',
LOST='lost',
}
@Entity('lead_qualification')
export class LeadQualificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => LeadInformationEntity, leadInfo => leadInfo.qualification)
  @JoinColumn()
  leadInformation: LeadInformationEntity;


  @Column({
    type: 'enum',
    enum: STATUS,
    default: STATUS.NEW,
  })
  status: string;


  @Column({
    type: 'enum',
    enum: InterestLevel,
    default:InterestLevel.COLD,
    nullable: true,
  })
  interestLevel: InterestLevel;

  @Column({ nullable: true })
  budget: string;

  @Column({ nullable: true })
  need: string;

  @Column({ nullable: true })
  decisionMaker: boolean;

  // Target pour ML
  @Column({ default: false })
  converted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
