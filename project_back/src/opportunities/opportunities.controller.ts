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
} from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('opportunities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OpportunitiesController {
  constructor(private readonly service: OpportunitiesService) {}

  // CREATE
  @Post()
  @Roles(UserRole.AGENT_TELEPRO)
  create(@Body() dto: CreateOpportunityDto, @Req() req) {
    return this.service.create(dto, req.user);
  }

  // FIND ALL
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.COMMERCIAL,
    UserRole.AGENT_TELEPRO,
  )
  findAll(@Req() req) {
    return this.service.findAll(req.user);
  }

  // FIND ONE
  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.COMMERCIAL,
    UserRole.AGENT_TELEPRO,
  )
  findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOne(+id, req.user);
  }

  // UPDATE
  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.COMMERCIAL,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
    @Req() req,
  ) {
    return this.service.update(+id, dto, req.user);
  }

  // DELETE
  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
  )
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(+id, req.user);
  }
}
