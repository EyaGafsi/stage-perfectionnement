import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtValidatedUser } from '../auth/auth.service';
import { Request } from 'express';
import { UserRole } from '../user/entities/user.entity';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // -------------------- CREATE COMPANY --------------------
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN) // Seul SUPER_ADMIN peut créer une société
async create(@Body() createCompanyDto: CreateCompanyDto) {
  return this.companiesService.create(createCompanyDto);
}


  // -------------------- GET ALL COMPANIES --------------------
  @Get()
  async findAll(@Req() req: Request) {
    const user: JwtValidatedUser = req['user'];

    if (user.role === UserRole.SUPER_ADMIN) {
      return this.companiesService.findAll();
    }

    // Pour les autres, retourner seulement la société de l'utilisateur
    if (!user.companyId) throw new ForbiddenException('You do not belong to any company');
    return [await this.companiesService.findById(user.companyId)];
  }

  // -------------------- GET COMPANY BY ID --------------------
  @Get(':id')
  async findOne(@Param('id') id: number, @Req() req: Request) {
    const user: JwtValidatedUser = req['user'];
    const company = await this.companiesService.findById(Number(id));

    // Vérifier l'accès
    if (user.role !== UserRole.SUPER_ADMIN && company.id !== user.companyId) {
      throw new ForbiddenException('You do not have access to this company');
    }

    return company;
  }

  // -------------------- UPDATE COMPANY --------------------
  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateCompanyDto: UpdateCompanyDto, @Req() req: Request) {
    const user: JwtValidatedUser = req['user'];

    if (user.role === UserRole.SUPER_ADMIN) {
      return this.companiesService.update(Number(id), updateCompanyDto);
    }

    // ADMIN_COMPANY peut seulement modifier sa propre société
    if (user.role === UserRole.ADMIN_COMPANY && user.companyId === Number(id)) {
      return this.companiesService.update(Number(id), updateCompanyDto);
    }

    throw new ForbiddenException('You do not have permission to update this company');
  }

  // -------------------- DELETE COMPANY --------------------
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN) // Seul SUPER_ADMIN peut supprimer
  async remove(@Param('id') id: number) {
    return this.companiesService.remove(Number(id));
  }
}
