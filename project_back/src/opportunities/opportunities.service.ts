import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpportunityEntity } from './entities/opportunity.entity';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { LeadInformationEntity } from 'src/leads/entities/lead.entity';
import { UserEntity, UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(OpportunityEntity)
    private oppRepo: Repository<OpportunityEntity>,

    @InjectRepository(LeadInformationEntity)
    private leadRepo: Repository<LeadInformationEntity>,

    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  // ---------------- CREATE ----------------
  async create(dto: CreateOpportunityDto, user: UserEntity) {
    if (!user.company) {
      throw new ForbiddenException('User has no company');
    }

    // seul AGENT_TELEPRO peut créer
    if (user.role !== UserRole.AGENT_TELEPRO) {
      throw new ForbiddenException('Only telepro can create opportunity');
    }

    const lead = await this.leadRepo.findOne({
      where: {
        id: dto.leadId,
        company: { id: user.company.id },
      },
      relations: ['opportunity'],
    });

    if (!lead) {
      throw new NotFoundException('Lead not found in your company');
    }

    if (lead.opportunity) {
      throw new ForbiddenException('Lead already has an opportunity');
    }

    let assignedTo: UserEntity | null = null;
    if (dto.assignedToId) {
      assignedTo = await this.userRepo.findOne({
        where: {
          id: dto.assignedToId,
          company: { id: user.company.id } ,
          role: UserRole.COMMERCIAL,
        },
      });

      if (!assignedTo) {
        throw new NotFoundException('Commercial not found');
      }
    }

    const opportunity = this.oppRepo.create({
      lead,
      company: user.company || null,
      createdBy: user,
      assignedTo,
      estimatedValue: dto.estimatedValue,
    });

    return this.oppRepo.save(opportunity);
  }

  // ---------------- FIND ALL ----------------
  async findAll(user: UserEntity) {
    if (!user.company?.id) {
     throw new ForbiddenException('User has no company');
}
    return this.oppRepo.find({
      where: {
        company: { id: user.company.id },
      },
      relations: ['lead', 'createdBy', 'assignedTo'],
    });
  }

  // ---------------- FIND ONE ----------------
  async findOne(id: number, user: UserEntity) {
    if (!user.company?.id) {
  throw new ForbiddenException('User has no company');
}
    const opp = await this.oppRepo.findOne({
      where: {
        id,
        company: { id: user.company.id },
      },
      relations: ['lead', 'createdBy', 'assignedTo'],
    });

    if (!opp) {
      throw new NotFoundException('Opportunity not found');
    }

    // COMMERCIAL → seulement assigné
    if (
      user.role === UserRole.COMMERCIAL &&
      opp.assignedTo?.id !== user.id
    ) {
      throw new ForbiddenException();
    }

    // AGENT_TELEPRO → seulement créées
    if (
      user.role === UserRole.AGENT_TELEPRO &&
      opp.createdBy.id !== user.id
    ) {
      throw new ForbiddenException();
    }

    return opp;
  }

  // ---------------- UPDATE ----------------
  async update(id: number, dto: UpdateOpportunityDto, user: UserEntity) {
    if (!user.company?.id) {
  throw new ForbiddenException('User has no company');
}
    const opp = await this.findOne(id, user);

    if (
      user.role === UserRole.COMMERCIAL &&
      opp.assignedTo?.id !== user.id
    ) {
      throw new ForbiddenException();
    }

    if (
      user.role === UserRole.AGENT_TELEPRO
    ) {
      throw new ForbiddenException('Telepro cannot update opportunity');
    }

    if (dto.assignedToId) {
      const commercial = await this.userRepo.findOne({
        where: {
          id: dto.assignedToId,
          company: { id: user.company.id },
          role: UserRole.COMMERCIAL,
        },
      });

      if (!commercial) {
        throw new NotFoundException('Commercial not found');
      }

      opp.assignedTo = commercial;
    }

    this.oppRepo.merge(opp, dto);
    return this.oppRepo.save(opp);
  }

  // ---------------- DELETE ----------------
// ---------------- DELETE ----------------
async remove(id: number, user: UserEntity) {
  // Seuls SUPER_ADMIN, ADMIN_COMPANY et MANAGER peuvent supprimer
  if (
    ![
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN_COMPANY,
      UserRole.MANAGER,
    ].includes(user.role)
  ) {
    throw new ForbiddenException('You are not allowed to delete opportunities');
  }

  const opp = await this.findOne(id, user);

  // Vérification company pour ADMIN_COMPANY et MANAGER
  if (
    user.role !== UserRole.SUPER_ADMIN &&
    opp.company?.id !== user.company?.id
  ) {
    throw new ForbiddenException('You can only delete opportunities in your company');
  }

  return this.oppRepo.remove(opp);
}

}
