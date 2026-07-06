import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProjectEntity } from './entities/project.entity';
import { UserEntity, UserRole } from 'src/user/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectITEntity } from './entities/projectIT.entity';
import { ProjectMarketingEntity } from './entities/projectMarketing.entity';
import { ProjectCallCenterEntity } from './entities/projectCallCenter.entity';
import { CreateProjectCallCenterDto } from './dto/create-project-callcenter.dto';
import { CreateProjectMarketingDto } from './dto/create-project-marketing.dto';
import { ProjectITDto } from './dto/create-project-it.dto';
import { SprintITEntity } from './entities/SprintITEntity.entity';
import { TaskITEntity } from './entities/TaskITEntity.entity';
import { CreateSprintITDto } from './dto/create-sprint-it.dto';
import { CreateTaskITDto } from './dto/create-task-it.dto';
import { UpdateSprintITDto } from './dto/update-sprint-it.dto';
import { UpdateTaskITDto } from './dto/update-task-it.dto';
import { TaskStatus } from './entities/TaskITEntity.entity';
import { TaskHistoryService } from 'src/taskhystory/task-history.service';
import { SprintMarketingEntity } from './entities/SprintMarketingEntity.entity';
import { TaskMarketingEntity } from './entities/TaskMarketingEntity.entity';
import { SprintCallCenterEntity } from './entities/SprintCallCenterEntity.entity';
import { TaskCallCenterEntity } from './entities/TaskCallCenterEntity.entity';
import { CreateSprintMarketingDto } from './dto/create-sprint-marketing.dto';
import { CreateTaskMarketingDto } from './dto/create-sprint-marketing.dto';
import { CreateSprintCallCenterDto } from './dto/create-sprint-callcenter.dto';
import { CreateTaskCallCenterDto } from './dto/create-sprint-callcenter.dto';
import { UpdateSprintMarketingDto } from './dto/update-sprint-marketing.dto';
import { UpdateTaskMarketingDto } from './dto/update-task-marketing.dto';
import { UpdateSprintCallCenterDto } from './dto/update-sprint-callcenter.dto';
import { UpdateTaskCallCenterDto } from './dto/update-task-callcenter.dto';
import { TaskMarketingStatus } from './entities/TaskMarketingEntity.entity';
import { TaskCallCenterStatus } from './entities/TaskCallCenterEntity.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private projectRepo: Repository<ProjectEntity>,

    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,

    @InjectRepository(ProjectITEntity)
    private projectITRepo: Repository<ProjectITEntity>,

    @InjectRepository(ProjectMarketingEntity)
    private projectMarketingRepo: Repository<ProjectMarketingEntity>,

    @InjectRepository(ProjectCallCenterEntity)
    private projectCallCenterRepo: Repository<ProjectCallCenterEntity>,

    @InjectRepository(SprintITEntity)
    private sprintITRepo: Repository<SprintITEntity>,

    @InjectRepository(TaskITEntity)
    private taskITRepo: Repository<TaskITEntity>,

    @InjectRepository(SprintMarketingEntity)
    private sprintMarketingRepo: Repository<SprintMarketingEntity>,

    @InjectRepository(TaskMarketingEntity)
    private taskMarketingRepo: Repository<TaskMarketingEntity>,

    @InjectRepository(SprintCallCenterEntity)
    private sprintCallCenterRepo: Repository<SprintCallCenterEntity>,

    @InjectRepository(TaskCallCenterEntity)
    private taskCallCenterRepo: Repository<TaskCallCenterEntity>,

    private taskHistoryService: TaskHistoryService,
  ) {}

  async create(dto: CreateProjectDto, creator: UserEntity) {
    const managerWithCompany = await this.userRepo.findOne({
      where: { id: creator.id },
      relations: ['company'],
    });

    if (!managerWithCompany || !managerWithCompany.company) {
      throw new ForbiddenException("L'administrateur n'a pas de compagnie associée.");
    }

    const { projectManagerId, ...projectData } = dto;

    const project = this.projectRepo.create({
      ...projectData,
      createdBy: managerWithCompany,
      company: managerWithCompany.company,
    });

    if (projectManagerId) {
      const pm = await this.userRepo.findOne({
        where: { id: projectManagerId, role: UserRole.PROJECT_MANAGER },
      });
      if (!pm) {
        throw new NotFoundException(`Le Project Manager avec l'ID ${projectManagerId} n'existe pas.`);
      }
      project.projectManager = pm;
    }

    return this.projectRepo.save(project);
  }

  async addMembersByProjectMember(
    projectId: number,
    memberIds: number[],
    requester: UserEntity,
  ) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['assignedTo', 'company', 'projectManager'],
    });

    if (!project) throw new NotFoundException('Project not found');

    const isAssigned = (project.assignedTo || []).some(u => u.id === requester.id);
    if (!isAssigned && project.projectManager?.id !== requester.id) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (!project.company) throw new NotFoundException('Project company not found');

    const members = await this.userRepo.find({
      where: { id: In(memberIds), company: { id: project.company.id } },
    });

    if (!members || members.length === 0) {
      throw new NotFoundException('No valid members found to add');
    }

    const existing = project.assignedTo || [];
    const existingIds = new Set(existing.map(u => u.id));
    const toAdd = members.filter(m => !existingIds.has(m.id));

    if (toAdd.length > 0) {
      await this.projectRepo
        .createQueryBuilder()
        .relation(ProjectEntity, 'assignedTo')
        .of(projectId)
        .add(toAdd);
    }

    const saved = await this.findOne(projectId);

    return {
      message: 'Members added successfully',
      added: toAdd.map(m => ({ id: m.id, email: m.email, fullname: m.fullname })),
      projectId: saved.id,
    };
  }

  async getProjectDetails(
    projectId: number,
    options?: { memberSearch?: string; includeDomainDetails?: boolean },
  ) {
    const includeDomain = options?.includeDomainDetails ?? true;

    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: [
        'createdBy', 'projectManager', 'assignedTo', 'company',
        'itDetails', 'marketingDetails', 'callCenterDetails',
      ],
    });

    if (!project) throw new NotFoundException('Project not found');

    let filteredMembers = project.assignedTo || [];
    if (options?.memberSearch && options.memberSearch.trim().length > 0) {
      const q = options.memberSearch.trim().toLowerCase();
      filteredMembers = filteredMembers.filter(u => {
        const name = (u.fullname || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    let domainDetails:
      | ProjectITEntity
      | ProjectMarketingEntity
      | ProjectCallCenterEntity
      | null = null;

    if (includeDomain) {
      switch (project.domain) {
        case 'IT':
          domainDetails = project.itDetails ?? null;
          break;
        case 'Marketing':
          domainDetails = project.marketingDetails ?? null;
          break;
        case 'CallCenter':
          domainDetails = project.callCenterDetails ?? null;
          break;
        default:
          domainDetails = null;
      }
    }

    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        domain: project.domain,
        startDate: project.startDate,
        endDate: project.endDate,
        company: project.company ? { id: project.company.id, name: project.company.name } : null,
        createdBy: project.createdBy
          ? { id: project.createdBy.id, name: project.createdBy.fullname, email: project.createdBy.email }
          : null,
        projectManager: project.projectManager
          ? { id: project.projectManager.id, fullname: project.projectManager.fullname, email: project.projectManager.email }
          : null,
        assignedTo: filteredMembers.map(u => ({ id: u.id, name: u.fullname, email: u.email })),
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      domainDetails,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // ✅ UPSERT domain details — reçoit directement le projectId
  //    → cherche l'enregistrement existant par project.id
  //    → met à jour si trouvé, crée sinon
  // ─────────────────────────────────────────────────────────────────

  async upsertCallCenterDetails(projectId: number, dto: CreateProjectCallCenterDto) {
    // 1. Charger le projet (nécessaire pour la relation FK)
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    // 2. Chercher l'enregistrement existant par project.id (pas par l'id de la fiche)
    const existing = await this.projectCallCenterRepo.findOne({
      where: { project: { id: projectId } },
    });

    if (existing) {
      // UPDATE — ne mettre à jour que les champs envoyés (non-undefined)
      Object.assign(existing, dto);
      return this.projectCallCenterRepo.save(existing);
    }

    // INSERT — première fois
    const details = this.projectCallCenterRepo.create({ ...dto, project });
    return this.projectCallCenterRepo.save(details);
  }

  async upsertITDetails(projectId: number, dto: ProjectITDto) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const existing = await this.projectITRepo.findOne({
      where: { project: { id: projectId } },
    });

    if (existing) {
      Object.assign(existing, dto);
      return this.projectITRepo.save(existing);
    }

    const details = this.projectITRepo.create({ ...dto, project });
    return this.projectITRepo.save(details);
  }

  async upsertMarketingDetails(projectId: number, dto: CreateProjectMarketingDto) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const existing = await this.projectMarketingRepo.findOne({
      where: { project: { id: projectId } },
    });

    if (existing) {
      Object.assign(existing, dto);
      return this.projectMarketingRepo.save(existing);
    }

    const details = this.projectMarketingRepo.create({ ...dto, project });
    return this.projectMarketingRepo.save(details);
  }

  // ─────────────────────────────────────────────────────────────────
  // Anciennes méthodes gardées pour init-domain (compatibilité)
  // ─────────────────────────────────────────────────────────────────

  async addITDetails(project: ProjectEntity, dto: ProjectITDto) {
    return this.upsertITDetails(project.id, dto);
  }

  async addMarketingDetails(project: ProjectEntity, dto: CreateProjectMarketingDto) {
    return this.upsertMarketingDetails(project.id, dto);
  }

  async addCallCenterDetails(project: ProjectEntity, dto: CreateProjectCallCenterDto) {
    return this.upsertCallCenterDetails(project.id, dto);
  }

  async initializeDomainDetails(project: ProjectEntity, dto: any) {
    switch (project.domain) {
      case 'IT':
        return this.upsertITDetails(project.id, dto as ProjectITDto);
      case 'Marketing':
        return this.upsertMarketingDetails(project.id, dto as CreateProjectMarketingDto);
      case 'CallCenter':
        return this.upsertCallCenterDetails(project.id, dto as CreateProjectCallCenterDto);
      default:
        return null;
    }
  }

  async assignProjectManager(projectId: number, pmId: number, manager: UserEntity) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['company', 'manager'],
    });
    if (!project) throw new NotFoundException('Project not found');

    if (!manager || !manager.company || project.company.id !== manager.company.id) {
      throw new ForbiddenException('You cannot assign PM to a project from another company');
    }

    const pm = await this.userRepo.findOne({
      where: { id: pmId, role: UserRole.PROJECT_MANAGER },
      relations: ['company'],
    });
    if (!pm) throw new NotFoundException('Project Manager not found');
    if (!pm.company || pm.company.id !== manager.company.id) {
      throw new ForbiddenException('PM belongs to a different company');
    }

    project.projectManager = pm;
    return this.projectRepo.save(project);
  }

  async addMembers(projectId: number, memberIds: number[], projectManager: UserEntity) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['assignedTo', 'company', 'projectManager', 'createdBy'],
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.projectManager?.id !== projectManager.id) {
      throw new ForbiddenException('You are not the Project Manager of this project');
    }
    if (!project.company) throw new NotFoundException('Project company not found');

    const members = await this.userRepo.find({
      where: { id: In(memberIds), company: { id: project.company.id } },
    });

    if (members.length > 0) {
      await this.projectRepo
        .createQueryBuilder()
        .relation(ProjectEntity, 'assignedTo')
        .of(projectId)
        .add(members);
    }

    return this.findOne(projectId);
  }

  async findAll(user: UserEntity) {
    const relations = ['createdBy', 'projectManager', 'assignedTo', 'company'];

    if (user.role === UserRole.SUPER_ADMIN) {
      return this.projectRepo.find({ relations });
    }
    if (!user.companyId) return [];

    if (user.role === UserRole.ADMIN_COMPANY) {
      return this.projectRepo.find({
        where: { company: { id: user.companyId as number } },
        relations,
      });
    }
    if (user.role === UserRole.MANAGER) {
      return this.projectRepo.find({ where: { createdBy: { id: user.id } }, relations });
    }
    if (user.role === UserRole.PROJECT_MANAGER) {
      return this.projectRepo.find({ where: { projectManager: { id: user.id } }, relations });
    }
    return this.projectRepo.find({ where: { assignedTo: { id: user.id } }, relations });
  }

  async findOne(id: number) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['createdBy', 'projectManager', 'assignedTo', 'company'],
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: number, dto: UpdateProjectDto) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['projectManager', 'company'],
    });
    if (!project) throw new NotFoundException('Project not found');

    if (dto.projectManagerId !== undefined) {
      if (dto.projectManagerId && dto.projectManagerId !== null) {
        const pm = await this.userRepo.findOne({
          where: { id: dto.projectManagerId, role: UserRole.PROJECT_MANAGER },
        });
        if (!pm) throw new NotFoundException(`Project Manager not found`);
        project.projectManager = pm;
      }
      const { projectManagerId, ...rest } = dto;
      Object.assign(project, rest);
    } else {
      Object.assign(project, dto);
    }

    return this.projectRepo.save(project);
  }

  async getMarketingSprintsOfProject(projectId: number): Promise<SprintMarketingEntity[]> {
    const project = await this.projectMarketingRepo.findOne({
      where: { id: projectId },
      relations: ['sprints', 'sprints.tasks', 'sprints.tasks.assignedTo'],
    });
    if (!project) throw new NotFoundException('Marketing Project not found');
    return project.sprints ?? [];
  }

  async getCallCenterSprintsOfProject(projectId: number): Promise<SprintCallCenterEntity[]> {
    const project = await this.projectCallCenterRepo.findOne({
      where: { id: projectId },
      relations: ['sprints', 'sprints.tasks', 'sprints.tasks.assignedTo'],
    });
    if (!project) throw new NotFoundException('CallCenter Project not found');
    return project.sprints ?? [];
  }

  async remove(id: number) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    await this.projectRepo.remove(project);
    return { message: 'Project removed successfully' };
  }

async getSprintsOfProjectIT(projectId: number): Promise<SprintITEntity[]> {
  const projectIT = await this.projectITRepo.findOne({
    where: { project: { id: projectId } },
    relations: ['sprints', 'sprints.tasks', 'sprints.tasks.assignedTo'],
  });
  
  console.log('projectIT trouvé:', projectIT?.id);
  console.log('sprints count:', projectIT?.sprints?.length);
  console.log('tasks[0] assignedTo:', projectIT?.sprints?.[0]?.tasks?.[0]?.assignedTo);
  
  if (!projectIT) throw new NotFoundException('Project IT not found');
  return projectIT.sprints ?? [];
}

  async getTasksOfSprint(sprintId: number): Promise<TaskITEntity[]> {
    const sprint = await this.sprintITRepo.findOne({
      where: { id: sprintId },
      relations: ['tasks','tasks.assignedTo'],
    });
    if (!sprint) throw new NotFoundException('Sprint not found');
    return sprint.tasks;
  }

  async createSprintsWithTasks(
    projectId: number,
    sprintsDto: CreateSprintITDto[],
  ): Promise<SprintITEntity[]> {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('!!! NEW CODE IS RUNNING IN BACKEND !!!');
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    const projectIT = await this.projectITRepo.findOne({ where: { id: projectId } });
    if (!projectIT) throw new NotFoundException('Project IT not found');

    const createdSprints: SprintITEntity[] = [];

    for (const sprintDto of sprintsDto) {
      const sprint = this.sprintITRepo.create({
        name: sprintDto.name,
        startDate: new Date(sprintDto.startDate),
        endDate: new Date(sprintDto.endDate),
        status: sprintDto.status || 'planned',
        totalStoryPoints: sprintDto.totalStoryPoints,
        priority: sprintDto.priority,
        risks: sprintDto.risks,
        dependencies: sprintDto.dependencies,
        teamSize: sprintDto.teamSize,
        complexity: sprintDto.complexity,
        additionalNotes: sprintDto.additionalNotes,
        projectIT: projectIT,
      });

      const savedSprint = await this.sprintITRepo.save(sprint);

      if (sprintDto.tasks && sprintDto.tasks.length > 0) {
        for (const taskDto of sprintDto.tasks) {
          const task = this.taskITRepo.create({
            title: taskDto.title,
            description: taskDto.description,
            type: taskDto.type,
            status: taskDto.status,
            priority: taskDto.priority,
            storyPoints: taskDto.storyPoints,
            estimatedHours: taskDto.estimatedHours,
            dependencies: taskDto.dependencies,
            risks: taskDto.risks,
            complexity: taskDto.complexity,
            additionalNotes: taskDto.additionalNotes,
            complexityScore: taskDto.complexityScore,
            riskLevel: taskDto.riskLevel,
            delayReason: taskDto.delayReason,
            delayHours: taskDto.delayHours,
            scheduledStartDate: taskDto.scheduledStartDate ? new Date(taskDto.scheduledStartDate as string) : null as any,
            scheduledEndDate: taskDto.scheduledEndDate ? new Date(taskDto.scheduledEndDate as string) : null as any,
            sprint: savedSprint,
          });
          const assigneeId = taskDto.assignedTo?.id || taskDto.assignedToId;
          if (assigneeId) {
            const member = await this.userRepo.findOne({ where: { id: assigneeId } });
            if (member) {
              task.assignedTo = member;
            }
          }
          await this.taskITRepo.save(task);
        }
      }

      createdSprints.push(savedSprint);
    }

    return createdSprints;
  }

  async addTaskToSprint(sprintId: number, taskDto: CreateTaskITDto): Promise<TaskITEntity> {
    const sprint = await this.sprintITRepo.findOne({
      where: { id: sprintId },
      relations: ['tasks'],
    });
    if (!sprint) throw new NotFoundException('Sprint IT not found');

    const task = this.taskITRepo.create({
      title: taskDto.title,
      description: taskDto.description,
      type: taskDto.type,
      status: taskDto.status,
      priority: taskDto.priority,
      storyPoints: taskDto.storyPoints,
      estimatedHours: taskDto.estimatedHours,
      dependencies: taskDto.dependencies,
      risks: taskDto.risks,
      complexity: taskDto.complexity,
      additionalNotes: taskDto.additionalNotes,
      complexityScore: taskDto.complexityScore,
      riskLevel: taskDto.riskLevel,
      delayReason: taskDto.delayReason,
      delayHours: taskDto.delayHours,
      scheduledStartDate: taskDto.scheduledStartDate ? new Date(taskDto.scheduledStartDate as string) : null as any,
      scheduledEndDate: taskDto.scheduledEndDate ? new Date(taskDto.scheduledEndDate as string) : null as any,
      sprint: sprint,
    });

    const assigneeId = taskDto.assignedTo?.id || taskDto.assignedToId;
    if (assigneeId) {
      const member = await this.userRepo.findOne({ where: { id: assigneeId } });
      if (member) {
        task.assignedTo = member;
      }
    }

    return this.taskITRepo.save(task);
  }

  async assignTaskToMember(
    taskId: number,
    memberId: number,
    projectManager: UserEntity,
  ): Promise<TaskITEntity> {
    const task = await this.taskITRepo.findOne({
      where: { id: taskId },
      relations: ['sprint', 'sprint.projectIT', 'sprint.projectIT.project'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const projectIT = task.sprint.projectIT;
    if (!projectIT || !projectIT.project) {
      throw new NotFoundException('Project IT or parent project not found');
    }

    const project = await this.projectRepo.findOne({
      where: { id: projectIT.project.id },
      relations: ['manager', 'manager.company'],
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.projectManager?.id !== projectManager.id) {
      throw new ForbiddenException('You are not the Project Manager of this project');
    }
    if (!project.company) {
      throw new NotFoundException('Project manager or company not configured for this project');
    }

    const member = await this.userRepo.findOne({
      where: { id: memberId, company: { id: project.company.id } },
    });
    if (!member) throw new NotFoundException('Member not found in your company');

    task.assignedTo = member;
    return this.taskITRepo.save(task);
  }

  async assignProjectToPM(
    projectId: number,
    pmId: number,
    manager: UserEntity,
  ): Promise<ProjectEntity> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['company', 'manager'],
    });
    if (!project) throw new NotFoundException('Project not found');
    if (!manager || !manager.company || project.company.id !== manager.company.id) {
      throw new ForbiddenException('You cannot assign a PM to a project from another company');
    }

    const pm = await this.userRepo.findOne({
      where: { id: pmId, role: UserRole.PROJECT_MANAGER },
      relations: ['company'],
    });
    if (!pm) throw new NotFoundException('Project Manager not found');
    if (!pm.company || pm.company.id !== manager.company.id) {
      throw new ForbiddenException('The PM belongs to a different company');
    }

    project.projectManager = pm;
    return this.projectRepo.save(project);
  }

  async getSprintById(sprintId: number): Promise<SprintITEntity> {
    const sprint = await this.sprintITRepo.findOne({
      where: { id: sprintId },
      relations: ['tasks', 'tasks.assignedTo'],
    });
    if (!sprint) throw new NotFoundException(`Sprint #${sprintId} introuvable`);
    return sprint;
  }

  async updateSprint(sprintId: number, dto: UpdateSprintITDto, user: UserEntity): Promise<SprintITEntity> {
    const sprint = await this.getSprintById(sprintId);
    Object.assign(sprint, dto);
    return this.sprintITRepo.save(sprint);
  }

  async deleteSprint(sprintId: number, user: UserEntity): Promise<{ message: string }> {
    const sprint = await this.getSprintById(sprintId);
    await this.sprintITRepo.remove(sprint);
    return { message: `Sprint #${sprintId} supprimé avec succès` };
  }

  async getTaskById(taskId: number): Promise<TaskITEntity> {
    const task = await this.taskITRepo.findOne({
      where: { id: taskId },
      relations: ['assignedTo', 'sprint' ,],
    });
    if (!task) throw new NotFoundException(`Tâche #${taskId} introuvable`);
    return task;
  }

  async deleteTask(taskId: number, user: UserEntity): Promise<{ message: string }> {
    const task = await this.getTaskById(taskId);
    await this.taskITRepo.remove(task);
    return { message: `Tâche #${taskId} supprimée avec succès` };
  }

  async updateTaskStatus(taskId: number, status: string, delayReason: string | undefined, user: UserEntity): Promise<TaskITEntity> {
    const task = await this.getTaskById(taskId);
    task.status = status as TaskStatus;
    
    if (delayReason !== undefined) {
      task.delayReason = delayReason;
    }
    
    if (status === 'DONE' && !task.actualEndDate) {
      task.actualEndDate = new Date();
      if (task.scheduledEndDate) {
        const scheduledEnd = task.scheduledEndDate instanceof Date
          ? task.scheduledEndDate
          : new Date(task.scheduledEndDate);
        const delayMs = task.actualEndDate.getTime() - scheduledEnd.getTime();
        task.delayHours = Math.round((delayMs / (1000 * 60 * 60)) * 100) / 100;
      }
    }

    await this.taskHistoryService.recordTaskStatusChange(task.id, status, 'IT');
    return this.taskITRepo.save(task);
  }

  async updateTask(taskId: number, dto: UpdateTaskITDto, user: UserEntity): Promise<TaskITEntity> {
    const task = await this.getTaskById(taskId);
    const { assignedTo, ...rest } = dto as any;
    const previousStatus = task.status;

    Object.assign(task, rest);

    // Convert date strings to Date objects for timestamp columns
    if (rest.scheduledStartDate !== undefined) {
      task.scheduledStartDate = rest.scheduledStartDate ? new Date(rest.scheduledStartDate) : null as any;
    }
    if (rest.scheduledEndDate !== undefined) {
      task.scheduledEndDate = rest.scheduledEndDate ? new Date(rest.scheduledEndDate) : null as any;
    }

    if (assignedTo?.id) {
      const member = await this.userRepo.findOne({ where: { id: assignedTo.id } });
      if (!member) throw new NotFoundException(`Membre #${assignedTo.id} introuvable`);
      task.assignedTo = member;
    } else if (assignedTo === null || (dto as any).assignedToId === null || assignedTo?.id === null) {
      task.assignedTo = null as any;
    }

    if (dto.status && dto.status !== previousStatus) {
      await this.taskHistoryService.recordTaskStatusChange(task.id, dto.status as string, 'IT');
    }

// ✅ Après
if (dto.status === 'DONE' && !task.actualEndDate) {
  task.actualEndDate = new Date();
  if (task.scheduledEndDate) {
    const scheduledEnd = task.scheduledEndDate instanceof Date
      ? task.scheduledEndDate
      : new Date(task.scheduledEndDate);         // ← convertit string → Date
    const delayMs = task.actualEndDate.getTime() - scheduledEnd.getTime();
    task.delayHours = Math.round((delayMs / (1000 * 60 * 60)) * 100) / 100;
  }
}
    

    return this.taskITRepo.save(task);
  }

  async getDeveloperDelayStats(developerId: number) {
    const tasks = await this.taskITRepo.find({
      where: { assignedTo: { id: developerId }, status: TaskStatus.DONE },
    });

    const totalDelay = tasks.reduce((sum, t) => sum + (t.delayHours || 0), 0);
    const onTimeCount = tasks.filter(t => (t.delayHours || 0) <= 0).length;

    return {
      developerId,
      totalTasks: tasks.length,
      onTimeCount,
      lateCount: tasks.length - onTimeCount,
      totalDelayHours: totalDelay,
      averageDelay: tasks.length > 0 ? Math.round((totalDelay / tasks.length) * 100) / 100 : 0,
      isPerforming: tasks.length > 0 && onTimeCount / tasks.length >= 0.8,
    };
  }

  async getTaskDelayInfo(taskId: number) {
    const task = await this.getTaskById(taskId);
    return {
      taskId: task.id,
      title: task.title,
      scheduledEnd: task.scheduledEndDate,
      actualEnd: task.actualEndDate,
      delayHours: task.delayHours || 0,
      status: !task.actualEndDate
        ? '⏳ Non complété'
        : (task.delayHours || 0) > 0
          ? `⚠️ En retard de ${task.delayHours}h`
          : `✅ Avance de ${Math.abs(task.delayHours || 0)}h`,
    };
  }

  // ════════════════════════════════════════════════════════════════════
  // 📊 MARKETING SPRINTS & TASKS
  // ════════════════════════════════════════════════════════════════════

  async createMarketingSprints(
    projectId: number,
    sprintsDto: CreateSprintMarketingDto[],
  ): Promise<SprintMarketingEntity[]> {
    const project = await this.projectMarketingRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Marketing Project not found');

    const createdSprints: SprintMarketingEntity[] = [];

    for (const sprintDto of sprintsDto) {
      const sprint = this.sprintMarketingRepo.create({
        name: sprintDto.name,
        startDate: new Date(sprintDto.startDate ?? new Date()),
        endDate: new Date(sprintDto.endDate ?? new Date()),
        status: 'planned',
        totalBudget: sprintDto.totalBudget,
        campaignType: sprintDto.campaignType,
        targetAudience: sprintDto.targetAudience,
        expectedReach: sprintDto.expectedReach,
        expectedLeads: sprintDto.expectedLeads,
        expectedROI: sprintDto.expectedROI,
        channels: sprintDto.channels,
        goals: sprintDto.goals,
        project,
      });

      const savedSprint = await this.sprintMarketingRepo.save(sprint);

      if (sprintDto.tasks && sprintDto.tasks.length > 0) {
        for (const taskDto of sprintDto.tasks) {
          const task = new TaskMarketingEntity();
          task.title = taskDto.title;
          task.description = taskDto.description ?? '';
          task.type = taskDto.type as any ?? '';
          task.status = (taskDto.status || 'TO_DO') as any;
          task.priority = taskDto.priority as any ?? '';
          task.estimatedHours = Math.round(taskDto.estimatedHours ?? 0);
          task.budget = taskDto.budget ?? 0;
          task.expectedViews = taskDto.expectedViews ?? 0;
          task.expectedClicks = taskDto.expectedClicks ?? 0;
          task.expectedLeads = taskDto.expectedLeads ?? 0;
          task.expectedConversions = taskDto.expectedConversions ?? 0;
          task.expectedCTR = taskDto.expectedCTR as any ?? 0;
          task.channel = taskDto.channel ?? '';
          task.scheduledStartDate = taskDto.scheduledStartDate ? new Date(taskDto.scheduledStartDate as unknown as string) : null as any;
          task.scheduledEndDate = taskDto.scheduledEndDate ? new Date(taskDto.scheduledEndDate as unknown as string) : null as any;
          task.complexityScore = taskDto.complexityScore ?? 0;
          task.riskLevel = taskDto.riskLevel ?? 0;
          task.delayReason = taskDto.delayReason ?? '';
          task.delayHours = taskDto.delayHours ?? 0;
          task.sprint = savedSprint;
          const assigneeId = taskDto.assignedTo?.id || taskDto.assignedToId;
          if (assigneeId) {
            const member = await this.userRepo.findOne({ where: { id: assigneeId } });
            if (member) {
              task.assignedTo = member;
            }
          }
          await this.taskMarketingRepo.save(task);
        }
      }

      createdSprints.push(savedSprint);
    }

    return createdSprints;
  }

  async addTaskToMarketingSprint(
    sprintId: number,
    taskDto: CreateTaskMarketingDto,
  ): Promise<TaskMarketingEntity> {
    const sprint = await this.sprintMarketingRepo.findOne({ where: { id: sprintId } });
    if (!sprint) throw new NotFoundException('Marketing Sprint not found');

    const task = new TaskMarketingEntity();
    task.title = taskDto.title;
    task.description = taskDto.description ?? '';
    task.type = taskDto.type as any ?? '';
    task.status = (taskDto.status || 'TO_DO') as any;
    task.priority = taskDto.priority as any ?? '';
    task.estimatedHours = Math.round(taskDto.estimatedHours ?? 0);
    task.budget = taskDto.budget ?? 0;
    task.expectedViews = taskDto.expectedViews ?? 0;
    task.expectedClicks = taskDto.expectedClicks ?? 0;
    task.expectedLeads = taskDto.expectedLeads ?? 0;
    task.expectedConversions = taskDto.expectedConversions ?? 0;
    task.expectedCTR = taskDto.expectedCTR as any ?? 0;
    task.channel = taskDto.channel ?? '';
    task.scheduledStartDate = taskDto.scheduledStartDate ? new Date(taskDto.scheduledStartDate as unknown as string) : null as any;
    task.scheduledEndDate = taskDto.scheduledEndDate ? new Date(taskDto.scheduledEndDate as unknown as string) : null as any;
    task.complexityScore = taskDto.complexityScore ?? 0;
    task.riskLevel = taskDto.riskLevel ?? 0;
    task.delayReason = taskDto.delayReason ?? '';
    task.delayHours = taskDto.delayHours ?? 0;
    task.sprint = sprint;
    const assigneeId = taskDto.assignedTo?.id || taskDto.assignedToId;
    if (assigneeId) {
      const member = await this.userRepo.findOne({ where: { id: assigneeId } });
      if (member) {
        task.assignedTo = member;
      }
    }

    return this.taskMarketingRepo.save(task);
  }

  async getMarketingSprintById(sprintId: number): Promise<SprintMarketingEntity> {
    const sprint = await this.sprintMarketingRepo.findOne({
      where: { id: sprintId },
      relations: ['tasks', 'tasks.assignedTo'],
    });
    if (!sprint) throw new NotFoundException(`Marketing Sprint #${sprintId} not found`);
    return sprint;
  }

  async updateMarketingSprint(
    sprintId: number,
    dto: UpdateSprintMarketingDto,
    user: UserEntity,
  ): Promise<SprintMarketingEntity> {
    const sprint = await this.getMarketingSprintById(sprintId);
    Object.assign(sprint, dto);
    return this.sprintMarketingRepo.save(sprint);
  }

  async deleteMarketingSprint(sprintId: number, user: UserEntity): Promise<{ message: string }> {
    const sprint = await this.getMarketingSprintById(sprintId);
    await this.sprintMarketingRepo.remove(sprint);
    return { message: `Marketing Sprint #${sprintId} deleted successfully` };
  }

  async getMarketingTaskById(taskId: number): Promise<TaskMarketingEntity> {
    const task = await this.taskMarketingRepo.findOne({
      where: { id: taskId },
      relations: ['assignedTo', 'sprint','sprint.tasks', 'sprint.tasks.assignedTo'],
    });
    if (!task) throw new NotFoundException(`Marketing Task #${taskId} not found`);
    return task;
  }

  async updateMarketingTaskStatus(
    taskId: number,
    status: string,
    delayReason: string | undefined,
    user: UserEntity,
  ): Promise<TaskMarketingEntity> {
    const task = await this.getMarketingTaskById(taskId);
    task.status = status as any;
    
    if (delayReason !== undefined) {
      task.delayReason = delayReason;
    }
    
    if (status === 'DONE' && !task.completedAt) {
      task.completedAt = new Date();
      if (task.scheduledEndDate) {
        const scheduledEnd = task.scheduledEndDate instanceof Date
          ? task.scheduledEndDate
          : new Date(task.scheduledEndDate);
        const delayMs = task.completedAt.getTime() - scheduledEnd.getTime();
        task.delayHours = Math.round((delayMs / (1000 * 60 * 60)) * 100) / 100;
      }
    }

    await this.taskHistoryService.recordTaskStatusChange(task.id, status, 'Marketing');
    return this.taskMarketingRepo.save(task);
  }

  async updateMarketingTask(
    taskId: number,
    dto: UpdateTaskMarketingDto,
    user: UserEntity,
  ): Promise<TaskMarketingEntity> {
    const task = await this.getMarketingTaskById(taskId);
    const { assignedTo, ...rest } = dto as any;
    const previousStatus = task.status;

    Object.assign(task, rest);

    // Convert date strings to Date objects for timestamp columns
    if (rest.scheduledStartDate !== undefined) {
      task.scheduledStartDate = rest.scheduledStartDate ? new Date(rest.scheduledStartDate) : null as any;
    }
    if (rest.scheduledEndDate !== undefined) {
      task.scheduledEndDate = rest.scheduledEndDate ? new Date(rest.scheduledEndDate) : null as any;
    }

    if (assignedTo?.id) {
      const member = await this.userRepo.findOne({ where: { id: assignedTo.id } });
      if (!member) throw new NotFoundException(`Member #${assignedTo.id} not found`);
      task.assignedTo = member;
    } else if (assignedTo === null || (dto as any).assignedToId === null || assignedTo?.id === null) {
      task.assignedTo = null as any;
    }

    if (dto.status && dto.status !== previousStatus) {
      await this.taskHistoryService.recordTaskStatusChange(task.id, dto.status as string, 'Marketing');
    }

    if (dto.status === 'DONE' && !task.completedAt) {
      task.completedAt = new Date();
      if (task.scheduledEndDate) {
        const scheduledEnd = task.scheduledEndDate instanceof Date
          ? task.scheduledEndDate
          : new Date(task.scheduledEndDate);
        const delayMs = task.completedAt.getTime() - scheduledEnd.getTime();
        task.delayHours = Math.round((delayMs / (1000 * 60 * 60)) * 100) / 100;
      }
    }

    return this.taskMarketingRepo.save(task);
  }

  async deleteMarketingTask(taskId: number, user: UserEntity): Promise<{ message: string }> {
    const task = await this.getMarketingTaskById(taskId);
    await this.taskMarketingRepo.remove(task);
    return { message: `Marketing Task #${taskId} deleted successfully` };
  }

  // ════════════════════════════════════════════════════════════════════
  // 📞 CALLCENTER SPRINTS & TASKS
  // ════════════════════════════════════════════════════════════════════

  async createCallCenterSprints(
    projectId: number,
    sprintsDto: CreateSprintCallCenterDto[],
  ): Promise<SprintCallCenterEntity[]> {
    const project = await this.projectCallCenterRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('CallCenter Project not found');

    const createdSprints: SprintCallCenterEntity[] = [];

    for (const sprintDto of sprintsDto) {
      const sprint = new SprintCallCenterEntity();
      sprint.name = sprintDto.name;
      sprint.startDate = new Date(sprintDto.startDate);
      sprint.endDate = new Date(sprintDto.endDate);
      sprint.status = 'planned';
      sprint.targetAgents = sprintDto.targetAgents;
      sprint.expectedCallVolume = sprintDto.expectedCallVolume;
      sprint.targetConversionRate = sprintDto.targetConversionRate;
      sprint.budgetAllocated = sprintDto.budgetAllocated;
      sprint.qualityScoreTarget = sprintDto.qualityScoreTarget;
      sprint.trainingContent = sprintDto.trainingContent;
      sprint.scriptTemplates = sprintDto.scriptTemplates;
      sprint.goals = sprintDto.goals;
      sprint.project = project;

      const savedSprint = await this.sprintCallCenterRepo.save(sprint);

      if (sprintDto.tasks && sprintDto.tasks.length > 0) {
        for (const taskDto of sprintDto.tasks) {
          const task = new TaskCallCenterEntity();
          task.title = taskDto.title;
          task.description = taskDto.description;
          task.type = taskDto.type as any;
          task.status = (taskDto.status || 'TO_DO') as any;
          task.priority = taskDto.priority as any;
          task.estimatedHours = taskDto.estimatedHours;
          task.targetAgentCount = taskDto.targetAgentCount;
          task.expectedCallsPerAgent = taskDto.expectedCallsPerAgent;
          task.targetConversionRate = taskDto.targetConversionRate;
          task.qualityScoreTarget = taskDto.qualityScoreTarget;
          task.scriptContent = taskDto.scriptContent;
          task.scheduledStartDate = taskDto.scheduledStartDate
            ? new Date(taskDto.scheduledStartDate)
            : null as any;
          task.scheduledEndDate = taskDto.scheduledEndDate
            ? new Date(taskDto.scheduledEndDate)
            : null as any;
          task.complexityScore = taskDto.complexityScore ?? 0;
          task.riskLevel = taskDto.riskLevel ?? 0;
          task.delayReason = taskDto.delayReason ?? '';
          task.delayHours = taskDto.delayHours ?? 0;
          task.sprint = savedSprint;
          const assigneeId = taskDto.assignedTo?.id || taskDto.assignedToId;
          if (assigneeId) {
            const member = await this.userRepo.findOne({ where: { id: assigneeId } });
            if (member) {
              task.assignedTo = member;
            }
          }
          await this.taskCallCenterRepo.save(task);
        }
      }

      createdSprints.push(savedSprint);
    }

    return createdSprints;
  }

  async addTaskToCallCenterSprint(
    sprintId: number,
    taskDto: CreateTaskCallCenterDto,
  ): Promise<TaskCallCenterEntity> {
    const sprint = await this.sprintCallCenterRepo.findOne({ where: { id: sprintId } });
    if (!sprint) throw new NotFoundException('CallCenter Sprint not found');

    const task = new TaskCallCenterEntity();
    task.title = taskDto.title;
    task.description = taskDto.description;
    task.type = taskDto.type as any;
    task.status = (taskDto.status || 'TO_DO') as any;
    task.priority = taskDto.priority as any;
    task.estimatedHours = taskDto.estimatedHours;
    task.targetAgentCount = taskDto.targetAgentCount;
    task.expectedCallsPerAgent = taskDto.expectedCallsPerAgent;
    task.targetConversionRate = taskDto.targetConversionRate;
    task.qualityScoreTarget = taskDto.qualityScoreTarget;
    task.scriptContent = taskDto.scriptContent;
    task.scheduledStartDate = taskDto.scheduledStartDate
      ? new Date(taskDto.scheduledStartDate)
      : null as any;
    task.scheduledEndDate = taskDto.scheduledEndDate
      ? new Date(taskDto.scheduledEndDate)
      : null as any;
    task.complexityScore = taskDto.complexityScore ?? 0;
    task.riskLevel = taskDto.riskLevel ?? 0;
    task.delayReason = taskDto.delayReason ?? '';
    task.delayHours = taskDto.delayHours ?? 0;
    task.sprint = sprint;
    const assigneeId = taskDto.assignedTo?.id || taskDto.assignedToId;
    if (assigneeId) {
      const member = await this.userRepo.findOne({ where: { id: assigneeId } });
      if (member) {
        task.assignedTo = member;
      }
    }

    return this.taskCallCenterRepo.save(task);
  }

  async getCallCenterSprintById(sprintId: number): Promise<SprintCallCenterEntity> {
    const sprint = await this.sprintCallCenterRepo.findOne({
      where: { id: sprintId },
      relations: ['tasks', 'tasks.assignedTo'],
    });
    if (!sprint) throw new NotFoundException(`CallCenter Sprint #${sprintId} not found`);
    return sprint;
  }
async updateCallCenterSprint(
  sprintId: number,
  dto: UpdateSprintCallCenterDto,
  user: UserEntity,
): Promise<SprintCallCenterEntity> {
  const sprint = await this.getCallCenterSprintById(sprintId);
  const { startDate, endDate, ...rest } = dto as any;

  Object.assign(sprint, rest);
  if (startDate) sprint.startDate = new Date(startDate);  // ← convertir
  if (endDate)   sprint.endDate   = new Date(endDate);    // ← convertir

  return this.sprintCallCenterRepo.save(sprint);
}

  async deleteCallCenterSprint(sprintId: number, user: UserEntity): Promise<{ message: string }> {
    const sprint = await this.getCallCenterSprintById(sprintId);
    await this.sprintCallCenterRepo.remove(sprint);
    return { message: `CallCenter Sprint #${sprintId} deleted successfully` };
  }

  async getCallCenterTaskById(taskId: number): Promise<TaskCallCenterEntity> {
    const task = await this.taskCallCenterRepo.findOne({
      where: { id: taskId },
      relations: ['assignedTo', 'sprint'],
    });
    if (!task) throw new NotFoundException(`CallCenter Task #${taskId} not found`);
    return task;
  }

  async updateCallCenterTaskStatus(
    taskId: number,
    status: string,
    delayReason: string | undefined,
    user: UserEntity,
  ): Promise<TaskCallCenterEntity> {
    const task = await this.getCallCenterTaskById(taskId);
    task.status = status as any;
    
    if (delayReason !== undefined) {
      task.delayReason = delayReason;
    }
    
    if (status === 'DONE' && !task.completedAt) {
      task.completedAt = new Date();
      if (task.scheduledEndDate) {
        const scheduledEnd = task.scheduledEndDate instanceof Date
          ? task.scheduledEndDate
          : new Date(task.scheduledEndDate);
        const delayMs = task.completedAt.getTime() - scheduledEnd.getTime();
        task.delayHours = Math.round((delayMs / (1000 * 60 * 60)) * 100) / 100;
      }
    }

    await this.taskHistoryService.recordTaskStatusChange(task.id, status, 'CallCenter');
    return this.taskCallCenterRepo.save(task);
  }

  async updateCallCenterTask(
  taskId: number,
  dto: UpdateTaskCallCenterDto,
  user: UserEntity,
): Promise<TaskCallCenterEntity> {
  const task = await this.getCallCenterTaskById(taskId);
  const { assignedTo, scheduledStartDate, scheduledEndDate, ...rest } = dto as any;
  const previousStatus = task.status;

  Object.assign(task, rest);

  // ← convertir les strings ISO en Date pour TypeORM
  if (scheduledStartDate !== undefined) {
    task.scheduledStartDate = scheduledStartDate ? new Date(scheduledStartDate) : null as any;
  }
  if (scheduledEndDate !== undefined) {
    task.scheduledEndDate = scheduledEndDate ? new Date(scheduledEndDate) : null as any;
  }

  const rawAssigneeId = assignedTo?.id || (dto as any).assignedToId;
  if (rawAssigneeId) {
    const member = await this.userRepo.findOne({ where: { id: rawAssigneeId } });
    if (!member) throw new NotFoundException(`Member #${rawAssigneeId} not found`);
    task.assignedTo = member;
  } else if (assignedTo === null || (dto as any).assignedToId === null || assignedTo?.id === null) {
    task.assignedTo = null as any;
  }

  if (dto.status && dto.status !== previousStatus) {
    await this.taskHistoryService.recordTaskStatusChange(task.id, dto.status as string, 'CallCenter');
  }

    if (dto.status === 'DONE' && !task.completedAt) {
      task.completedAt = new Date();
      if (task.scheduledEndDate) {
        const scheduledEnd = task.scheduledEndDate instanceof Date
          ? task.scheduledEndDate
          : new Date(task.scheduledEndDate);
        const delayMs = task.completedAt.getTime() - scheduledEnd.getTime();
        task.delayHours = Math.round((delayMs / (1000 * 60 * 60)) * 100) / 100;
      }
    }

  return this.taskCallCenterRepo.save(task);
}

  async deleteCallCenterTask(taskId: number, user: UserEntity): Promise<{ message: string }> {
    const task = await this.getCallCenterTaskById(taskId);
    await this.taskCallCenterRepo.remove(task);
    return { message: `CallCenter Task #${taskId} deleted successfully` };
  }
  async findAlluser(user: UserEntity, assignedMemberId?: string) {
  const relations = ['createdBy', 'projectManager', 'assignedTo', 'company'];

  // AJOUT : Si le frontend demande les projets d'un membre spécifique
  if (assignedMemberId) {
    const memberId = parseInt(assignedMemberId, 10);
    return this.projectRepo.find({
      where: { assignedTo: { id: memberId } },
      relations,
    });
  }

  // LOGIQUE EXISTANTE : Si aucun paramètre n'est passé, on garde le comportement par défaut
  if (user.role === UserRole.SUPER_ADMIN) {
    return this.projectRepo.find({ relations });
  }
  if (!user.companyId) return [];

  if (user.role === UserRole.ADMIN_COMPANY || user.role === UserRole.HR_MANAGER) {
    return this.projectRepo.find({
      where: { company: { id: user.companyId as number } },
      relations,
    });
  }
  if (user.role === UserRole.MANAGER) {
    return this.projectRepo.find({ where: { createdBy: { id: user.id } }, relations });
  }
  if (user.role === UserRole.PROJECT_MANAGER) {
    return this.projectRepo.find({ where: { projectManager: { id: user.id } }, relations });
  }
  
  return this.projectRepo.find({ where: { assignedTo: { id: user.id } }, relations });
}
async getMemberProjects(memberId: number) {
  const projects = await this.projectRepo.find({
    where: { assignedTo: { id: memberId } },
    relations: [
      'createdBy', 'projectManager', 'assignedTo', 'company',
      'itDetails',
      'marketingDetails',
      'callCenterDetails',
    ],
  });

  return projects.map(p => ({
    id: p.id,
    name: p.name,
    domain: p.domain,
    status: p.status,
    domainDetails:
      p.domain === 'IT'         ? p.itDetails         ?? null :
      p.domain === 'Marketing'  ? p.marketingDetails  ?? null :
      p.domain === 'CallCenter' ? p.callCenterDetails ?? null :
      null,
  }));
}

  // ─── Member historical performance stats ──────────────────────────────────
  // Used by the AI estimation payload to improve prediction accuracy.
  // Aggregates all completed IT tasks assigned to the given member across
  // all projects in the system.
  async getMemberStats(memberId: number): Promise<{
    completedTasksCount: number;
    avgCompletionHours: number;
    avgDelayHours: number;
    avgReopenRate: number;
    avgWorkLogHours: number;
    currentWorkload: number;
    avgStoryPoints: number;
    frequentDelayReason: string | null;
  }> {
    // ── Tâches terminées du membre ────────────────────────────────────────────
    const doneTasks = await this.taskITRepo
      .createQueryBuilder('task')
      .where('task.assignedToId = :memberId', { memberId })
      .andWhere('task.status = :status', { status: 'DONE' })
      .select([
        'task.durationHours   AS task_durationHours',
        'task.delayHours      AS task_delayHours',
        'task.reopenCount     AS task_reopenCount',
        'task.workLogHours    AS task_workLogHours',
        'task.storyPoints     AS task_storyPoints',
        'task.delayReason     AS task_delayReason',
      ])
      .getRawMany();

    const completedTasksCount = doneTasks.length;

    const avgCompletionHours =
      completedTasksCount === 0 ? 0
      : doneTasks.reduce((s, t) => s + (Number(t.task_durationHours) || 0), 0) / completedTasksCount;

    const avgDelayHours =
      completedTasksCount === 0 ? 0
      : doneTasks.reduce((s, t) => s + Math.max(0, Number(t.task_delayHours) || 0), 0) / completedTasksCount;

    const avgReopenRate =
      completedTasksCount === 0 ? 0
      : doneTasks.reduce((s, t) => s + (Number(t.task_reopenCount) || 0), 0) / completedTasksCount;

    const avgWorkLogHours =
      completedTasksCount === 0 ? 0
      : doneTasks.reduce((s, t) => s + (Number(t.task_workLogHours) || 0), 0) / completedTasksCount;

    const avgStoryPoints =
      completedTasksCount === 0 ? 0
      : doneTasks.reduce((s, t) => s + (Number(t.task_storyPoints) || 0), 0) / completedTasksCount;

    // Calcul de la raison de retard la plus fréquente
    const delayReasonsCount = doneTasks.reduce((acc, t) => {
      if (t.task_delayReason) {
        acc[t.task_delayReason] = (acc[t.task_delayReason] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    let frequentDelayReason: string | null = null;
    let maxCount = 0;
    for (const [reason, count] of Object.entries(delayReasonsCount)) {
      const c = count as number;
      if (c > maxCount) {
        maxCount = c;
        frequentDelayReason = reason;
      }
    }

    // ── Charge actuelle (tâches non terminées) ────────────────────────────────
    const currentWorkload = await this.taskITRepo
      .createQueryBuilder('task')
      .where('task.assignedToId = :memberId', { memberId })
      .andWhere('task.status IN (:...statuses)', { statuses: ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'] })
      .getCount();

    return {
      completedTasksCount,
      avgCompletionHours: Math.round(avgCompletionHours * 100) / 100,
      avgDelayHours:      Math.round(avgDelayHours      * 100) / 100,
      avgReopenRate:      Math.round(avgReopenRate       * 100) / 100,
      avgWorkLogHours:    Math.round(avgWorkLogHours     * 100) / 100,
      currentWorkload,
      avgStoryPoints:     Math.round(avgStoryPoints      * 100) / 100,
      frequentDelayReason,
    };
  }
}