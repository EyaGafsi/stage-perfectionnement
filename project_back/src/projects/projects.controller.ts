import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Param, 
  Body, 
  Delete, 
  ParseIntPipe,
  UseGuards,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserEntity, UserRole } from 'src/user/entities/user.entity';
import { CreateProjectCallCenterDto } from './dto/create-project-callcenter.dto';
import { CreateProjectMarketingDto } from './dto/create-project-marketing.dto';
import { ProjectITDto } from './dto/create-project-it.dto';
import { CreateTaskITDto } from './dto/create-task-it.dto';
import { CreateSprintITDto } from './dto/create-sprint-it.dto';
import { AddMembersByMemberDto } from './dto/add-members-by-member.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Query } from '@nestjs/common';
import { TaskHistoryService } from 'src/taskhystory/task-history.service';
import { UpdateSprintITDto } from './dto/update-sprint-it.dto';
import { UpdateTaskITDto } from './dto/update-task-it.dto';
import { CreateSprintMarketingDto, CreateTaskMarketingDto } from './dto/create-sprint-marketing.dto';
import { UpdateSprintMarketingDto } from './dto/update-sprint-marketing.dto';
import { UpdateTaskMarketingDto } from './dto/update-task-marketing.dto';
import { CreateSprintCallCenterDto, CreateTaskCallCenterDto } from './dto/create-sprint-callcenter.dto';
import { UpdateSprintCallCenterDto } from './dto/update-sprint-callcenter.dto';
import { UpdateTaskCallCenterDto } from './dto/update-task-callcenter.dto';

interface RequestWithUser extends Request {
  user?: UserEntity;
}

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly taskHistoryService: TaskHistoryService,
  ) {}

  // 🔹 Créer un projet (Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @Post()
  async createProject(
    @Body() dto: CreateProjectDto,
    @Req() req: RequestWithUser,
  ) {
    const manager = req.user as UserEntity;
    return this.projectsService.create(dto, manager);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Patch(':projectId/add-members-by-member')
  async addMembersByMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: AddMembersByMemberDto,
    @Req() req: RequestWithUser,
  ) {
    const requester = req.user as UserEntity;
    return this.projectsService.addMembersByProjectMember(projectId, dto.memberIds, requester);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/details')
  async getProjectDetails(
    @Param('id', ParseIntPipe) id: number,
    @Query('memberSearch') memberSearch?: string,
    @Query('includeDomainDetails') includeDomainDetails?: string,
  ) {
    const includeDomain = includeDomainDetails === undefined ? true : includeDomainDetails === 'true';
    return this.projectsService.getProjectDetails(id, { memberSearch, includeDomainDetails: includeDomain });
  }

  // 🔹 Affecter un Project Manager à un projet (Manager only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @Patch(':projectId/assign-pm/:pmId')
  async assignProjectManager(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pmId', ParseIntPipe) pmId: number,
    @Req() req: RequestWithUser,
  ) {
    const manager = req.user as UserEntity;
    return this.projectsService.assignProjectManager(projectId, pmId, manager);
  }

  // 🔹 Ajouter des membres à un projet (Project Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Patch(':projectId/add-members')
  async addMembers(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body('memberIds') memberIds: number[],
    @Req() req: RequestWithUser,
  ) {
    const projectManager = req.user as UserEntity;
    return this.projectsService.addMembers(projectId, memberIds, projectManager);
  }

  // ─────────────────────────────────────────────────────────────────
  // 🔹 Détails domaine — PATCH pour upsert (create or update)
  // ─────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.PROJECT_MANAGER)
  @Patch(':projectId/it-details')           // ← PATCH
  async addITDetails(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: ProjectITDto,
  ) {
    return this.projectsService.upsertITDetails(projectId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.PROJECT_MANAGER)
  @Patch(':projectId/marketing-details')    // ← PATCH
  async addMarketingDetails(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateProjectMarketingDto,
  ) {
    return this.projectsService.upsertMarketingDetails(projectId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.PROJECT_MANAGER)
  @Patch(':projectId/callcenter-details')
async addCallCenterDetails(
  @Param('projectId', ParseIntPipe) projectId: number,
  @Body() dto: CreateProjectCallCenterDto,
) {
  console.log('📦 DTO reçu:', JSON.stringify(dto)); // ← ajoute ça
  return this.projectsService.upsertCallCenterDetails(projectId, dto);
}
  // 🔹 Initialiser automatiquement les détails selon le domaine
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.PROJECT_MANAGER)
  @Post(':projectId/init-domain')
  async initializeDomain(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: ProjectITDto | CreateProjectMarketingDto | CreateProjectCallCenterDto,
  ) {
    const project = await this.projectsService.findOne(projectId);
    return this.projectsService.initializeDomainDetails(project, dto);
  }

  // 🔹 Voir tous les projets (authentifié)
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req) {
    const user = req.user;
    return this.projectsService.findAll(user);
  }

  // 🔹 Voir un projet (authentifié)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  // 🔹 Mettre à jour un projet (Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':projectId/marketing-sprints')
  async getMarketingSprints(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectsService.getMarketingSprintsOfProject(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':projectId/callcenter-sprints')
  async getCallCenterSprints(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectsService.getCallCenterSprintsOfProject(projectId);
  }

  // 🔹 Supprimer un projet (Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }

  // 🔹 Affecter une tâche d'un sprint à un membre (Project Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Patch('task/:taskId/assign/:memberId')
  async assignTaskToMember(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Req() req: RequestWithUser,
  ) {
    const projectManager = req.user as UserEntity;
    return this.projectsService.assignTaskToMember(taskId, memberId, projectManager);
  }

  // 🔹 Récupérer tous les sprints d'un projet IT
  @UseGuards(JwtAuthGuard)
  @Get(':projectId/sprints')
  async getSprints(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectsService.getSprintsOfProjectIT(projectId);
  }

  // 🔹 Récupérer toutes les tâches d'un sprint
  @UseGuards(JwtAuthGuard)
  @Get('sprint/:sprintId/tasks')
  async getTasksOfSprint(@Param('sprintId', ParseIntPipe) sprintId: number) {
    return this.projectsService.getTasksOfSprint(sprintId);
  }

  // 🔹 Affecter un Project Manager à un projet (Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @Patch(':projectId/assign-to-pm/:pmId')
  async assignProjectToPM(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pmId', ParseIntPipe) pmId: number,
    @Req() req: RequestWithUser,
  ) {
    const manager = req.user as UserEntity;
    return this.projectsService.assignProjectToPM(projectId, pmId, manager);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Post(':projectId/sprints')
  async createSprintsWithTasks(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() sprintsDto: CreateSprintITDto[],
  ) {
    return this.projectsService.createSprintsWithTasks(projectId, sprintsDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sprints/:sprintId')
  async getSprintById(@Param('sprintId', ParseIntPipe) sprintId: number) {
    return this.projectsService.getSprintById(sprintId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Patch('sprints/:sprintId')
  async updateSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Body() dto: UpdateSprintITDto,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.updateSprint(sprintId, dto, req.user as UserEntity);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Delete('sprints/:sprintId')
  async deleteSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.deleteSprint(sprintId, req.user as UserEntity);
  }

  // ============================================================
  // TÂCHES IT
  // ============================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Post('sprints/:sprintId/tasks')
  async addTaskToSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Body() taskDto: CreateTaskITDto,
  ) {
    console.log('--- addTaskToSprint RECEIVED DTO ---', taskDto);
    return this.projectsService.addTaskToSprint(sprintId, taskDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId')
  async getTaskById(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.projectsService.getTaskById(taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Patch('tasks/:taskId')
  async updateTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateTaskITDto,
    @Req() req: RequestWithUser,
  ) {
    console.log('--- updateTask RECEIVED DTO ---', dto);
    return this.projectsService.updateTask(taskId, dto, req.user as UserEntity);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Delete('tasks/:taskId')
  async deleteTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.deleteTask(taskId, req.user as UserEntity);
  }

  @Get('developer/:developerId/delay-stats')
  async getDeveloperDelayStats(@Param('developerId', ParseIntPipe) developerId: number) {
    return this.projectsService.getDeveloperDelayStats(developerId);
  }

  @Get('tasks/:taskId/delay-info')
  async getTaskDelayInfo(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.projectsService.getTaskDelayInfo(taskId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId/history')
  async getTaskHistory(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.taskHistoryService.getTaskHistory(taskId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('tasks/:taskId/status')
  async updateTaskStatus(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body('status') status: string,
    @Body('delayReason') delayReason: string | undefined,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.updateTaskStatus(taskId, status, delayReason, req.user as UserEntity);
  }

  // ════════════════════════════════════════════════════════════════════
  // 📊 MARKETING SPRINTS
  // ════════════════════════════════════════════════════════════════════

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Post(':projectId/marketing-sprints')
  async createMarketingSprints(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() sprintsDto: CreateSprintMarketingDto[],
  ) {
    return this.projectsService.createMarketingSprints(projectId, sprintsDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('marketing-sprints/:sprintId')
  async getMarketingSprintById(@Param('sprintId', ParseIntPipe) sprintId: number) {
    return this.projectsService.getMarketingSprintById(sprintId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Patch('marketing-sprints/:sprintId')
  async updateMarketingSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Body() dto: UpdateSprintMarketingDto,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.updateMarketingSprint(sprintId, dto, req.user as UserEntity);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Delete('marketing-sprints/:sprintId')
  async deleteMarketingSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.deleteMarketingSprint(sprintId, req.user as UserEntity);
  }

  // 📊 MARKETING TASKS

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Post('marketing-sprints/:sprintId/tasks')
  async addTaskToMarketingSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Body() taskDto: CreateTaskMarketingDto,
  ) {
    return this.projectsService.addTaskToMarketingSprint(sprintId, taskDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('marketing-tasks/:taskId')
  async getMarketingTaskById(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.projectsService.getMarketingTaskById(taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Patch('marketing-tasks/:taskId')
  async updateMarketingTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateTaskMarketingDto,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.updateMarketingTask(taskId, dto, req.user as UserEntity);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Delete('marketing-tasks/:taskId')
  async deleteMarketingTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.deleteMarketingTask(taskId, req.user as UserEntity);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('marketing-tasks/:taskId/status')
  async updateMarketingTaskStatus(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body('status') status: string,
    @Body('delayReason') delayReason: string | undefined,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.updateMarketingTaskStatus(taskId, status, delayReason, req.user as UserEntity);
  }

  // ════════════════════════════════════════════════════════════════════
  // 📞 CALLCENTER SPRINTS
  // ════════════════════════════════════════════════════════════════════

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Post(':projectId/callcenter-sprints')
  async createCallCenterSprints(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() sprintsDto: CreateSprintCallCenterDto[],
  ) {
    return this.projectsService.createCallCenterSprints(projectId, sprintsDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('callcenter-sprints/:sprintId')
  async getCallCenterSprintById(@Param('sprintId', ParseIntPipe) sprintId: number) {
    return this.projectsService.getCallCenterSprintById(sprintId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Patch('callcenter-sprints/:sprintId')
  async updateCallCenterSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Body() dto: UpdateSprintCallCenterDto,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.updateCallCenterSprint(sprintId, dto, req.user as UserEntity);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Delete('callcenter-sprints/:sprintId')
  async deleteCallCenterSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.deleteCallCenterSprint(sprintId, req.user as UserEntity);
  }

  // 📞 CALLCENTER TASKS

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Post('callcenter-sprints/:sprintId/tasks')
  async addTaskToCallCenterSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Body() taskDto: CreateTaskCallCenterDto,
  ) {
    return this.projectsService.addTaskToCallCenterSprint(sprintId, taskDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('callcenter-tasks/:taskId')
  async getCallCenterTaskById(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.projectsService.getCallCenterTaskById(taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Patch('callcenter-tasks/:taskId')
  async updateCallCenterTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateTaskCallCenterDto,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.updateCallCenterTask(taskId, dto, req.user as UserEntity);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Delete('callcenter-tasks/:taskId')
  async deleteCallCenterTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.deleteCallCenterTask(taskId, req.user as UserEntity);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('callcenter-tasks/:taskId/status')
  async updateCallCenterTaskStatus(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body('status') status: string,
    @Body('delayReason') delayReason: string | undefined,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.updateCallCenterTaskStatus(taskId, status, delayReason, req.user as UserEntity);
  }
@UseGuards(JwtAuthGuard)
@Get('by-member')
async findAlluser(
  @Req() req: RequestWithUser,
  @Query('assignedMemberId') assignedMemberId?: string,
) {
  const user = req.user as UserEntity;
  return this.projectsService.findAlluser(user, assignedMemberId);
}
@UseGuards(JwtAuthGuard)
@Get('member/:memberId/projects')
async getMemberProjects(
  @Param('memberId', ParseIntPipe) memberId: number,
) {
  return this.projectsService.getMemberProjects(memberId);
}

  // ─── Stats historiques d'un membre pour l'estimation IA ───────────────────
  @UseGuards(JwtAuthGuard)
  @Get('member-stats/:memberId')
  async getMemberStats(
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.projectsService.getMemberStats(memberId);
  }
}