import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { Request } from 'express';
import { LeadInformationEntity } from './entities/lead.entity';
import { LeadQualificationEntity } from './entities/leadqualification.entity';

interface RequestWithUser extends Request {
  user: any;
}
@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.MARKETING_AGENT,
    UserRole.COMMERCIAL,
  )
  create(@Body() createLeadDto: CreateLeadDto, @Req() req: RequestWithUser) {
    return this.leadsService.create(createLeadDto, req.user);
  }

@Get()
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_COMPANY,
  UserRole.MANAGER,
  UserRole.SALES_MANAGER,
  UserRole.CALL_CENTER_MANAGER,
)
findAll(@Req() req: RequestWithUser) {
  return this.leadsService.findAll(req.user);
}

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
  )
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.leadsService.findOne(+id, req.user);
  }

  // ---------------- UPDATE LEAD INFO ----------------
  @Patch(':id/info')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
  )
  updateInfo(@Param('id') id: string, @Body() data: Partial<LeadInformationEntity>, @Req() req: RequestWithUser) {
    return this.leadsService.updateLeadInfo(+id, data, req.user);
  }

  // ---------------- UPDATE LEAD QUALIFICATION ----------------
  @Patch(':id/qualification')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.COMMERCIAL,
    UserRole.AGENT_TELEPRO,
    UserRole.MARKETING_AGENT,
  )
  updateQualification(@Param('id') id: string, @Body() data: Partial<LeadQualificationEntity>, @Req() req: RequestWithUser) {
    return this.leadsService.updateLeadQualification(+id, data, req.user);
  }

  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
  )
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.leadsService.remove(+id, req.user);
  }
}

