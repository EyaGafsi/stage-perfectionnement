import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  OneToMany 
} from 'typeorm';
import { LeadInformationEntity } from 'src/leads/entities/lead.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { ScriptEntity } from './scripts.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';

export enum CallOutcome {
  NO_ANSWER = 'no_answer',
  INTERESTED = 'interested',
  CALLBACK = 'callback',
  REFUSED = 'refused',
}
export enum CallStatus {
  PLANNED = 'planned',
  DONE = 'done',
  MISSED = 'missed',
}

@Entity('calls')
export class CallEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LeadInformationEntity, lead => lead.calls)
  lead: LeadInformationEntity;

  @ManyToOne(() => UserEntity)
  agent: UserEntity; // AGENT_TELEPRO
  @ManyToOne(() => CompanyEntity)
   company: CompanyEntity;


  @ManyToOne(() => ScriptEntity, { nullable: true })
  script: ScriptEntity | null;
@Column({
  type: 'enum',
  enum: CallStatus,
  default: CallStatus.PLANNED,
})
status: CallStatus;
  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ nullable: true })
  duration: number;

  @Column({
    type: 'enum',
    enum:CallOutcome,
    nullable: true,
  })
  outcome: string;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
