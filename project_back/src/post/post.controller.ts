import {
  Controller,
  Get,
  Post as HttpPost,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { PostsService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApplyPostDto } from './dto/apply-post.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';

interface RequestWithUser extends Request {
  user?: { id?: string; role?: string; companyId?: string };
}

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.postsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.postsService.findOne(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @HttpPost()
  create(@Body() dto: CreatePostDto, @Req() req: RequestWithUser) {
    if (!req.user?.id)
      throw new UnauthorizedException('Utilisateur non authentifié');
    return this.postsService.create(
      dto,
      req.user.id,
      req.user.role,
      req.user.companyId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @Req() req: RequestWithUser,
  ) {
    return this.postsService.update(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.postsService.remove(id, req.user);
  }

  // ✅ Route publique — JSON uniquement, pas de fichier
  @HttpPost(':id/apply')
  async apply(@Param('id') id: string, @Body() dto: ApplyPostDto) {
    return this.postsService.applyToPost(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Get(':id/applicants')
  getApplicants(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.postsService.getApplicantsWithScores(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Delete(':id/applicants/:email')
  removeApplicant(
    @Param('id') id: string,
    @Param('email') email: string,
    @Req() req: RequestWithUser,
  ) {
    return this.postsService.removeApplicant(id, email, req.user);
  }
}