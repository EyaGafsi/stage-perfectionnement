import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';
import { UpdateCallDto } from './dto/update-call.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: any;
}

@Controller('calls')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  // ---------------- CREATE ----------------
  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.AGENT_TELEPRO,
  )
  create(
    @Body() createCallDto: CreateCallDto,
    @Req() req: RequestWithUser,
  ) {
    return this.callsService.create(createCallDto, req.user);
  }

  // ---------------- FIND ALL ----------------
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.CALL_CENTER_MANAGER,
  )
  findAll(@Req() req: RequestWithUser) {
    return this.callsService.findAll(req.user);
  }

  // ---------------- FIND ONE ----------------
  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.CALL_CENTER_MANAGER,
  )
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.callsService.findOne(+id, req.user);
  }

  // ---------------- UPDATE ----------------
@Patch(':id')
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_COMPANY,
  UserRole.CALL_CENTER_MANAGER,
  UserRole.AGENT_TELEPRO,
)
update(
  @Param('id') id: string,
  @Body() dto: UpdateCallDto,
  @Req() req: RequestWithUser,
) {
  return this.callsService.update(+id, dto, req.user);
}

  // ---------------- DELETE ----------------
  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.CALL_CENTER_MANAGER,
  )
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.callsService.remove(+id, req.user);
  }
  



}

