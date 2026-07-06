import { Injectable, NotFoundException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallEntity } from './entities/call.entity';
import { CreateCallDto } from './dto/create-call.dto';
import { UpdateCallDto } from './dto/update-call.dto';
import { LeadInformationEntity } from 'src/leads/entities/lead.entity';
import { UserEntity, UserRole } from 'src/user/entities/user.entity';
import { ScriptEntity } from './entities/scripts.entity';
import { CallStatus } from './entities/call.entity';
@Injectable()
export class CallsService {
  constructor(
    @InjectRepository(CallEntity)
    private callRepo: Repository<CallEntity>,

    @InjectRepository(LeadInformationEntity)
    private leadRepo: Repository<LeadInformationEntity>,

    @InjectRepository(ScriptEntity)
    private scriptRepo: Repository<ScriptEntity>,
  ) {}

  // ---------------- CREATE ----------------
  async create(createCallDto: CreateCallDto, user: any) {
  if (!user.company) {
    throw new NotFoundException('User has no company');
  }

  const lead = await this.leadRepo.findOne({
    where: {
      id: createCallDto.leadId,
      company: { id: user.company.id },
    },
  });

  if (!lead) {
    throw new NotFoundException('Lead not found in your company');
  }

  let script: ScriptEntity | null = null;

  if (createCallDto.scriptId) {
    script = await this.scriptRepo.findOne({
      where: { id: createCallDto.scriptId },
    });

    if (!script) {
      throw new NotFoundException('Script not found');
    }
  }

  const call = this.callRepo.create({
    lead,
    agent: user,
    company: user.company, 
    script, 
    startTime: createCallDto.startTime,
    endTime: createCallDto.endTime,
    duration: createCallDto.duration,
    outcome: createCallDto.outcome,
    notes: createCallDto.notes,
  });

  return this.callRepo.save(call);
}

  // ---------------- FIND ALL ----------------
  async findAll(user: any) {
    return this.callRepo.find({
      where: {
        lead: {
          company: { id: user.company.id },
        },
      },
      relations: ['lead', 'agent', 'script'],
    });
  }

  // ---------------- FIND ONE ----------------
  async findOne(id: number, user: any) {
    const call = await this.callRepo.findOne({
      where: {
        id,
        lead: {
          company: { id: user.company.id },
        },
      },
      relations: ['lead', 'agent', 'script'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    return call;
  }

  // ---------------- UPDATE ----------------
async update(id: number, dto: UpdateCallDto, user: any) {
  const call = await this.findOne(id, user);

  // 🔐 TELEPRO → uniquement ses appels
  if (
    user.role === UserRole.AGENT_TELEPRO &&
    call.agent.id !== user.id
  ) {
    throw new ForbiddenException('Not your call');
  }

  // 🔒 Champs interdits au TELEPRO
  if (user.role === UserRole.AGENT_TELEPRO) {
    delete dto.agentId;
    delete dto.scriptId;
  }

  // 👑 ADMIN / MANAGER → peut changer l’agent
  if (dto.agentId && user.role !== UserRole.AGENT_TELEPRO) {
    call.agent = { id: dto.agentId } as any;
  }

  // 👑 ADMIN / MANAGER → peut changer le script
  if (dto.scriptId && user.role !== UserRole.AGENT_TELEPRO) {
    call.script = { id: dto.scriptId } as any;
  }

  // 🤖 logique auto
  if (dto.status === CallStatus.DONE && !dto.endTime) {
    dto.endTime = new Date();
  }

  this.callRepo.merge(call, dto);
  return this.callRepo.save(call);
}

  // ---------------- DELETE ----------------
  async remove(id: number, user: any) {
    const call = await this.findOne(id, user);
    return this.callRepo.remove(call);
  }
}

