import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards,Req } from '@nestjs/common';
import { ScriptsService } from './scripts.service';
import { CreateScriptDto } from './dto/create-script.dto';
import { UpdateScriptDto } from './dto/update-script.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
interface RequestWithUser extends Request {
  user: any;
}
@Controller('scripts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScriptsController {
  constructor(private readonly scriptsService: ScriptsService) {}

  // ---------------- CREATE ----------------
  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.CALL_CENTER_MANAGER,
  )
  create(
    @Body() createScriptDto: CreateScriptDto,
    @Req() req: RequestWithUser,
  ) {
    return this.scriptsService.create(createScriptDto, req.user);
  }

  // ---------------- FIND ALL ----------------
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.CALL_CENTER_MANAGER,
  )
  findAll(@Req() req: RequestWithUser) {
    return this.scriptsService.findAll(req.user);
  }

  // ---------------- FIND ONE ----------------
  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.CALL_CENTER_MANAGER,
  )
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.scriptsService.findOne(+id, req.user);
  }

  // ---------------- UPDATE ----------------
  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.CALL_CENTER_MANAGER,
  )
  update(
    @Param('id') id: string,
    @Body() updateScriptDto: UpdateScriptDto,
    @Req() req: RequestWithUser,
  ) {
    return this.scriptsService.update(+id, updateScriptDto, req.user);
  }

  // ---------------- DELETE ----------------
  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.CALL_CENTER_MANAGER,
  )
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.scriptsService.remove(+id, req.user);
  }
}
