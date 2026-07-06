import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LeadInformationEntity } from './entities/lead.entity';
import { LeadQualificationEntity } from './entities/leadqualification.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UserRole } from '../user/entities/user.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(LeadInformationEntity)
    private leadInfoRepo: Repository<LeadInformationEntity>,

    @InjectRepository(LeadQualificationEntity)
    private leadQualifRepo: Repository<LeadQualificationEntity>,
  ) {}

  // ---------------- CREATE ----------------
  async create(createLeadDto: CreateLeadDto, user: any) {

    let targetCompany = user.company;


  if (user.role === 'super_admin' && createLeadDto.leadInfo['companyId']) {

  }

  if (!targetCompany) throw new NotFoundException('No company associated');

  const leadInfo = this.leadInfoRepo.create({
    ...createLeadDto.leadInfo,
    company: targetCompany, 
    assignedTo: user,
  });


    await this.leadInfoRepo.save(leadInfo);

    if (createLeadDto.leadQualification) {
      const qualification = this.leadQualifRepo.create({
        ...createLeadDto.leadQualification,
        leadInformation: leadInfo,
      });
      await this.leadQualifRepo.save(qualification);
      leadInfo.qualification = qualification;
    }

    return this.leadInfoRepo.save(leadInfo);
  }

  // ---------------- FIND ALL ----------------
async findAll(user: any) {
  if (user.role === UserRole.SUPER_ADMIN) {
    // SUPER_ADMIN : tous les leads, sans filtre sur la company
    return this.leadInfoRepo.find({
      relations: ['qualification', 'calls', 'opportunity'],
    });
  }

  // Autres rôles : filtre par company
  return this.leadInfoRepo.find({
    where: { company: { id: user.company.id } },
    relations: ['qualification', 'calls', 'opportunity'],
  });
}


  // ---------------- FIND ONE ----------------
async findOne(id: number, user: any) {
  let lead;

  if (user.role === UserRole.SUPER_ADMIN) {
    // SUPER_ADMIN : tous les leads, sans filtre sur la company
    lead = await this.leadInfoRepo.findOne({
      where: { id },
      relations: ['qualification', 'calls', 'opportunity'],
    });
  } else {
    // Autres rôles : filtre par company
    lead = await this.leadInfoRepo.findOne({
      where: { id, company: { id: user.company.id } },
      relations: ['qualification', 'calls', 'opportunity'],
    });
  }

  if (!lead) throw new NotFoundException('Lead not found');
  return lead;
}

  // ---------------- UPDATE LEAD INFO ----------------
  async updateLeadInfo(id: number, data: Partial<LeadInformationEntity>, user: any) {
    const lead = await this.findOne(id, user);

    // Vérifier les droits : seuls les roles supérieurs peuvent modifier leadInfo
    const allowedRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN_COMPANY,
      UserRole.MANAGER,
      UserRole.SALES_MANAGER,
      UserRole.CALL_CENTER_MANAGER,
    ];

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Vous ne pouvez pas modifier les informations générales du lead');
    }

    this.leadInfoRepo.merge(lead, data);
    return this.leadInfoRepo.save(lead);
  }

  // ---------------- UPDATE LEAD QUALIFICATION ----------------
  async updateLeadQualification(id: number, data: Partial<LeadQualificationEntity>, user: any) {
    const lead = await this.findOne(id, user);

    // Vérifier les droits
    const allowedRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN_COMPANY,
      UserRole.MANAGER,
      UserRole.SALES_MANAGER,
      UserRole.CALL_CENTER_MANAGER,
      UserRole.COMMERCIAL,
      UserRole.AGENT_TELEPRO,
      UserRole.MARKETING_AGENT,
    ];

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à modifier la qualification");
    }

    // Optionnel : empêcher les télépros de modifier avant le premier appel
    const isTelepro = [UserRole.AGENT_TELEPRO, UserRole.COMMERCIAL].includes(user.role);
    if (isTelepro && (!lead.calls || lead.calls.length === 0)) {
      throw new BadRequestException("La qualification ne peut être modifiée qu'après le premier appel");
    }

    if (lead.qualification) {
      this.leadQualifRepo.merge(lead.qualification, data);
      await this.leadQualifRepo.save(lead.qualification);
    } else {
      const qualification = this.leadQualifRepo.create({ ...data, leadInformation: lead });
      await this.leadQualifRepo.save(qualification);
      lead.qualification = qualification;
    }

    return this.leadInfoRepo.save(lead);
  }

  // ---------------- DELETE ----------------
  async remove(id: number, user: any) {
    const lead = await this.findOne(id, user);
    return this.leadInfoRepo.remove(lead);
  }
}
