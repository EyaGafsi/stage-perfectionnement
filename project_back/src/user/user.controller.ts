import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './entities/user.entity';
import { Request } from 'express';
import { CompanyEntity } from 'src/companies/entities/company.entity';
import { ROLE_CREATION_RULES } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * ✅ Déterminer si un utilisateur peut gérer un autre utilisateur
   * basé sur ROLE_CREATION_RULES (qui peut créer peut aussi lire, modifier, supprimer)
   */
  private canManageUser(requester: any, targetUser: any): boolean {
    // Super admin peut tout faire
    if (requester.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // L'utilisateur peut se gérer lui-même
    if (requester.id === targetUser.id) {
      return true;
    }

    // Vérifier que la cible est dans la même company
    if (targetUser.company?.id !== requester.companyId) {
      return false;
    }

    // Vérifier si le rôle de la cible est dans les rôles gérables par le requester
    const manageableRoles = ROLE_CREATION_RULES[requester.role as keyof typeof ROLE_CREATION_RULES] || [];
    return manageableRoles.includes(targetUser.role);
  }

  // -------------------- LISTER TOUS LES UTILISATEURS --------------------
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT,
    UserRole.MEMBER,
  )
  async findAll(@Req() req: Request) {
    const requester = req['user'];
    if (!requester) {
      throw new BadRequestException('Requester not found in request');
    }

    // Super admin voit tout
    if (requester.role === UserRole.SUPER_ADMIN) {
      return this.userService.findAll();
    }

    // Tous les autres rôles : on récupère uniquement les users de la même company
    const companyId = requester.companyId;
    if (!companyId) {
      throw new BadRequestException('Requester has no companyId');
    }

    const allUsersInCompany = await this.userService.findByCompany(companyId);

    // Rôles gérables selon ROLE_CREATION_RULES
    const manageableRoles = ROLE_CREATION_RULES[requester.role as keyof typeof ROLE_CREATION_RULES] || [];

    // Si aucun rôle gérable => ne voit que lui-même
    if (manageableRoles.length === 0) {
      return allUsersInCompany.filter(u => u.id === requester.id);
    }

    // Filtrer par rôles gérables + lui-même
    return allUsersInCompany.filter(u => 
      manageableRoles.includes(u.role) || u.id === requester.id
    );
  }

  // -------------------- RÉCUPÉRER UN UTILISATEUR PAR ID --------------------
  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT,
    UserRole.MEMBER,
  )
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const requester = req['user'];
    const targetUser = await this.userService.findById(id);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // ✅ Utiliser canManageUser pour vérifier les permissions
    if (!this.canManageUser(requester, targetUser)) {
      throw new ForbiddenException('You cannot access this user');
    }

    return targetUser;
  }

  // -------------------- CRÉER UN UTILISATEUR --------------------
  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,
  )
  async create(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    const creator = req['user'];
    if (!creator) {
      throw new BadRequestException('Requester not found in request');
    }

    const desiredRole = createUserDto.role ?? UserRole.MEMBER;
    const allowedRoles = ROLE_CREATION_RULES[creator.role] ?? [];

    if (!allowedRoles.includes(desiredRole)) {
      throw new ForbiddenException(`Role ${creator.role} cannot create ${desiredRole}`);
    }

    // Forcer companyId côté serveur sauf pour SUPER_ADMIN
    let companyId: number | undefined;
    if (creator.role === UserRole.SUPER_ADMIN) {
      companyId = createUserDto.companyId;
      if (!companyId) {
        throw new BadRequestException('companyId is required when creating user as SUPER_ADMIN');
      }
    } else {
      // Ignorer la valeur envoyée par le front
      companyId = creator.companyId;
      if (!companyId) {
        throw new BadRequestException('Creator has no companyId');
      }
    }

    const payload = {
      ...createUserDto,
      role: desiredRole,
      company: companyId ? ({ id: companyId } as CompanyEntity) : null,
    };

    return this.userService.create(payload);
  }

  // -------------------- METTRE À JOUR UN UTILISATEUR --------------------
  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT,
    UserRole.MEMBER,
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    const requester = req['user'];
    const targetUser = await this.userService.findById(id);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // ✅ Utiliser canManageUser pour vérifier les permissions
    if (!this.canManageUser(requester, targetUser)) {
      throw new ForbiddenException('You cannot update this user');
    }

    // Super admin peut tout modifier
    if (requester.role === UserRole.SUPER_ADMIN) {
      return this.userService.update(id, updateUserDto);
    }

    // ADMIN_COMPANY : ne peut pas changer role ni companyId
    if (requester.role === UserRole.ADMIN_COMPANY) {
      delete updateUserDto.role;
      delete updateUserDto.companyId;
    }

    // Forcer companyId côté serveur si le requester n'est pas SUPER_ADMIN
    if (requester.role !== UserRole.SUPER_ADMIN) {
      delete updateUserDto.companyId;
    }

    // Ignorer memberlevel si le rôle n'est pas MEMBER
    if (updateUserDto.role && updateUserDto.role !== UserRole.MEMBER) {
      delete updateUserDto.memberlevel;
    }

    return this.userService.update(id, updateUserDto);
  }

  // -------------------- SUPPRIMER UN UTILISATEUR --------------------
  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,
  )
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const requester = req['user'];
    const targetUser = await this.userService.findById(id);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // ✅ Utiliser canManageUser pour vérifier les permissions
    if (!this.canManageUser(requester, targetUser)) {
      throw new ForbiddenException('You cannot delete this user');
    }

    // ✅ Empêcher l'auto-suppression
    if (requester.id === targetUser.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    return this.userService.remove(id);
  }
}