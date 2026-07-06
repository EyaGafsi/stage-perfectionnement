import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService, JwtValidatedUser } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Request } from 'express';
import { UserRole } from '../user/entities/user.entity';

interface RequestWithUser extends Request {
  user: JwtValidatedUser;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // -------------------- SIGNIN --------------------
  @Post('signin')
  async signin(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    return this.authService.signin(email, password);
  }

  // -------------------- SIGNUP SUPER_ADMIN --------------------
  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    // Création du SUPER_ADMIN initial uniquement
    return this.authService.signup(createUserDto);
  }

  // -------------------- ROUTE TEST ADMIN --------------------
  @Get('admin-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_COMPANY)
  getAdminData(@Req() req: RequestWithUser) {
    return {
      message: 'Données réservées aux SUPER_ADMIN et ADMIN_COMPANY',
      user: req.user,
    };
  }

  // -------------------- ROUTE TEST MEMBRE / AGENT --------------------
  @Get('member-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.MEMBER,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.ADMIN_COMPANY,
    UserRole.SUPER_ADMIN,
    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
  )
  getMemberData(@Req() req: RequestWithUser) {
    return {
      message: 'Données accessibles aux membres, agents et admins',
      user: req.user,
    };
  }
}
