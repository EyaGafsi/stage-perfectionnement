import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskHistory } from './shema/task-history.schema';

@Injectable()
export class TaskHistoryService {
  constructor(
    @InjectModel(TaskHistory.name) private taskHistoryModel: Model<TaskHistory>,
  ) {}

  // ✅ Enregistrer les changements de statut pour toutes les tâches
  async recordTaskStatusChange(
    taskId: number,
    status: string,
    domain?: 'IT' | 'Marketing' | 'CallCenter', // Nouveau paramètre optionnel
  ) {
    const history = new this.taskHistoryModel({
      taskId,
      status,
      domain: domain || 'IT', // Par défaut 'IT'
      changedAt: new Date(),
    });

    return history.save();
  }

  // ✅ Récupérer l'historique d'une tâche spécifique
  async getTaskHistory(taskId: number) {
    return this.taskHistoryModel
      .find({ taskId })
      .sort({ createdAt: -1 })
      .exec();
  }

  // ✅ Récupérer l'historique des tâches d'un domaine
  async getTaskHistoryByDomain(domain: 'IT' | 'Marketing' | 'CallCenter') {
    return this.taskHistoryModel
      .find({ domain })
      .sort({ createdAt: -1 })
      .exec();
  }

  // ✅ Récupérer l'historique d'une tâche avec le domaine
  async getTaskHistoryWithDomain(taskId: number, domain?: string) {
    const query: any = { taskId };
    if (domain) {
      query.domain = domain;
    }
    return this.taskHistoryModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  // Anciens endpoints (conservés pour compatibilité)
  async getSprintTasksHistory(sprintId: number) {
    return [];
  }

  async getProjectTasksHistory(projectId: number) {
    return [];
  }

  async getUserTaskHistory(userId: number) {
    return [];
  }
}