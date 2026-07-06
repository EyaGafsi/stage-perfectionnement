import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { MemberProfileService } from './member-profile.service';
import { CreateMemberProfileDto, UpdateMemberProfileDto } from './dto/create-member-profile.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';

interface RequestWithUser extends Request {
  user?: any;
}

@Controller('member-profiles')
export class MemberProfileController {
  constructor(private readonly profileService: MemberProfileService) {}

  /**
   * ✅ Récupérer MON profil (accessible à tous les utilisateurs)
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: RequestWithUser) {
    return this.profileService.getMyProfile(req.user.id);
  }

  /**
   * ✅ Récupérer le profil d'un MEMBER
   * - SUPER_ADMIN: peut voir tout
   * - ADMIN_COMPANY/HR_MANAGER: peuvent voir les profils de leur compagnie
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN_COMPANY,
    UserRole.HR_MANAGER,
    UserRole.SUPER_ADMIN,
    UserRole.MEMBER,
    UserRole.PROJECT_MANAGER,
  )
  @Get(':userId')
  async getProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.profileService.getProfile(userId, req.user.id);
  }

  /**
   * ✅ Créer un profil pour un MEMBER
   * - SUPER_ADMIN: peut créer pour n'importe quel MEMBER
   * - ADMIN_COMPANY/HR_MANAGER: peuvent créer pour les MEMBERS de leur compagnie
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN_COMPANY, UserRole.SUPER_ADMIN)
  @Post()
  async createProfile(
    @Body() dto: CreateMemberProfileDto,
    @Req() req: RequestWithUser,
  ) {
    return this.profileService.create(dto, req.user.id);
  }

  /**
   * ✅ Mettre à jour le profil d'un MEMBER
   * - SUPER_ADMIN: peut modifier tout
   * - ADMIN_COMPANY/HR_MANAGER: peuvent modifier les profils de leur compagnie
   * - L'utilisateur peut modifier son propre profil
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':userId')
  async updateProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateMemberProfileDto,
    @Req() req: RequestWithUser,
  ) {
    // L'utilisateur peut modifier son propre profil
    if (userId === req.user.id) {
      return this.profileService.updateProfile(userId, dto, req.user.id);
    }

    // Sinon vérifier les permissions avec le rôle
    return this.profileService.updateProfile(userId, dto, req.user.id);
  }

  /**
   * ✅ Récupérer tous les profils
   * - SUPER_ADMIN: voit tous les profils
   * - ADMIN_COMPANY/HR_MANAGER: voient les profils de leur compagnie
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_COMPANY, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN)
  @Get()
  async getAllProfiles(@Req() req: RequestWithUser) {
    return this.profileService.getAllProfiles(req.user.id);
  }
}