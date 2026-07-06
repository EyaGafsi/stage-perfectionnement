import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberProfileEntity, TaskSnapshot } from './entities/member-profile.entity';
import { TaskITEntity, TaskStatus as ITTaskStatus } from 'src/projects/entities/TaskITEntity.entity';
import { TaskMarketingEntity } from 'src/projects/entities/TaskMarketingEntity.entity';
import { TaskCallCenterEntity } from 'src/projects/entities/TaskCallCenterEntity.entity';

// ─── Types internes ───────────────────────────────────────────────────────────

interface NormalizedTask {
  taskId: number;
  domain: 'IT' | 'Marketing' | 'CallCenter';
  title: string;
  scheduledEndDate: Date | null;
  completedAt: Date | null; // date réelle de fin (actualEndDate ou completedAt selon le domaine)
}

interface DomainStats {
  tasksDone: number;
  score: number;
  avgDelay: number;
  onTimeCount: number;
  earlyCount: number;
  lateCount: number;
  totalDelayHours: number;
}

// ─── Constantes de scoring ────────────────────────────────────────────────────

/**
 * Barème de points par tâche :
 *   - Rendue en avance (delayHours < 0)  → 120 pts
 *   - Rendue à temps   (delayHours === 0) → 100 pts
 *   - Retard ≤ 4h                         → 80 pts
 *   - Retard ≤ 24h                        → 60 pts
 *   - Retard ≤ 72h                        → 40 pts
 *   - Retard > 72h                        → 20 pts
 *   - Pas de scheduledEndDate             → 50 pts (bonus neutre)
 */
function computePointsForTask(delayHours: number | null): number {
  if (delayHours === null) return 50;
  if (delayHours < 0) return 120;
  if (delayHours === 0) return 100;
  if (delayHours <= 4) return 80;
  if (delayHours <= 24) return 60;
  if (delayHours <= 72) return 40;
  return 20;
}

/**
 * Grille de grades basée sur le score moyen par tâche (0-120) :
 *   A+ ≥ 110 | A ≥ 95 | B ≥ 75 | C ≥ 55 | D ≥ 35 | F < 35
 */
function computeGrade(avgScore: number): string {
  if (avgScore >= 110) return 'A+';
  if (avgScore >= 95) return 'A';
  if (avgScore >= 75) return 'B';
  if (avgScore >= 55) return 'C';
  if (avgScore >= 35) return 'D';
  return 'F';
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class MemberProfileScoringService {
  constructor(
    @InjectRepository(MemberProfileEntity)
    private profileRepo: Repository<MemberProfileEntity>,

    @InjectRepository(TaskITEntity)
    private taskITRepo: Repository<TaskITEntity>,

    @InjectRepository(TaskMarketingEntity)
    private taskMarketingRepo: Repository<TaskMarketingEntity>,

    @InjectRepository(TaskCallCenterEntity)
    private taskCallCenterRepo: Repository<TaskCallCenterEntity>,
  ) {}

  // ─── Point d'entrée principal ─────────────────────────────────────────────

  /**
   * Recalcule le score du membre identifié par `userId`,
   * persiste les résultats dans `MemberProfileEntity` et retourne le profil mis à jour.
   *
   * Appelé automatiquement depuis :
   *   - MemberProfileService.getMyProfile()
   *   - MemberProfileService.getProfile()
   */
  async computeAndPersist(userId: number): Promise<MemberProfileEntity | null> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) return null;

    // 1. Récupérer toutes les tâches DONE des 3 domaines
    const [itTasks, marketingTasks, callCenterTasks] = await Promise.all([
      this.fetchITTasks(userId),
      this.fetchMarketingTasks(userId),
      this.fetchCallCenterTasks(userId),
    ]);

    // 2. Normaliser en un format commun
    const allTasks: NormalizedTask[] = [
      ...itTasks,
      ...marketingTasks,
      ...callCenterTasks,
    ];

    if (allTasks.length === 0) {
      // Aucune tâche complétée → on remet à zéro et on retourne
      return this.resetScore(profile);
    }

    // 3. Calculer le délai (en heures) pour chaque tâche
    const tasksWithDelay = allTasks.map((t) => ({
      ...t,
      delayHours: this.calcDelayHours(t.scheduledEndDate, t.completedAt),
      points: 0, // sera rempli juste après
    }));

    tasksWithDelay.forEach((t) => {
      t.points = computePointsForTask(t.delayHours);
    });

    // 4. Statistiques globales
    const global = this.aggregateStats(tasksWithDelay);

    // 5. Statistiques par domaine
    const it = this.aggregateStats(tasksWithDelay.filter((t) => t.domain === 'IT'));
    const marketing = this.aggregateStats(tasksWithDelay.filter((t) => t.domain === 'Marketing'));
    const callCenter = this.aggregateStats(tasksWithDelay.filter((t) => t.domain === 'CallCenter'));

    // 6. Score global = moyenne des points (ramené sur 100 pour lisibilité optionnelle)
    const globalScore =
      global.tasksDone > 0
        ? Math.round((global.totalPoints / global.tasksDone) * 100) / 100
        : 0;

    const grade = computeGrade(globalScore);

    // 7. Snapshot des 10 dernières tâches (triées par completedAt desc)
    const recentTasksSnapshot: TaskSnapshot[] = tasksWithDelay
      .filter((t) => t.completedAt !== null)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
      .slice(0, 10)
      .map((t) => ({
        taskId: t.taskId,
        domain: t.domain,
        title: t.title,
        delayHours: t.delayHours ?? 0,
        completedAt: t.completedAt!.toISOString(),
        points: t.points,
      }));

    // 8. Évolution du score (delta vs valeur précédente)
    const previousScore = Number(profile.globalScore) || 0;
    const scoreEvolution =
      Math.round((globalScore - previousScore) * 100) / 100;

    // 9. Persister
    Object.assign(profile, {
      // Global
      globalScore,
      grade,
      totalTasksDone: global.tasksDone,
      onTimeCount: global.onTimeCount,
      earlyCount: global.earlyCount,
      lateCount: global.lateCount,
      avgDelayHours: global.avgDelay,
      totalDelayHours: global.totalDelayHours,
      onTimeRate:
        global.tasksDone > 0
          ? Math.round(((global.onTimeCount + global.earlyCount) / global.tasksDone) * 10000) / 10000
          : 0,

      // IT
      itTasksDone: it.tasksDone,
      itScore: it.tasksDone > 0 ? Math.round((it.totalPoints / it.tasksDone) * 100) / 100 : 0,
      itAvgDelay: it.avgDelay,

      // Marketing
      marketingTasksDone: marketing.tasksDone,
      marketingScore:
        marketing.tasksDone > 0
          ? Math.round((marketing.totalPoints / marketing.tasksDone) * 100) / 100
          : 0,
      marketingAvgDelay: marketing.avgDelay,

      // CallCenter
      callCenterTasksDone: callCenter.tasksDone,
      callCenterScore:
        callCenter.tasksDone > 0
          ? Math.round((callCenter.totalPoints / callCenter.tasksDone) * 100) / 100
          : 0,
      callCenterAvgDelay: callCenter.avgDelay,

      // Meta
      recentTasksSnapshot,
      scoreEvolution,
      scoreUpdatedAt: new Date(),
    });

    return this.profileRepo.save(profile);
  }

  // ─── Récupération des tâches par domaine ─────────────────────────────────

  private async fetchITTasks(userId: number): Promise<NormalizedTask[]> {
    const tasks = await this.taskITRepo.find({
      where: {
        assignedTo: { id: userId },
        status: ITTaskStatus.DONE,
      },
      select: ['id', 'title', 'scheduledEndDate', 'actualEndDate'],
    });

    return tasks.map((t) => ({
      taskId: t.id,
      domain: 'IT',
      title: t.title,
      scheduledEndDate: t.scheduledEndDate ?? null,
      completedAt: t.actualEndDate ?? null,
    }));
  }

  private async fetchMarketingTasks(userId: number): Promise<NormalizedTask[]> {
    const tasks = await this.taskMarketingRepo.find({
      where: {
        assignedTo: { id: userId },
        status: 'DONE' as any,
      },
      select: ['id', 'title', 'scheduledEndDate', 'completedAt'],
    });

    return tasks.map((t) => ({
      taskId: t.id,
      domain: 'Marketing',
      title: t.title,
      scheduledEndDate: t.scheduledEndDate ?? null,
      completedAt: t.completedAt ?? null,
    }));
  }

  private async fetchCallCenterTasks(userId: number): Promise<NormalizedTask[]> {
    const tasks = await this.taskCallCenterRepo.find({
      where: {
        assignedTo: { id: userId },
        status: 'DONE' as any,
      },
      select: ['id', 'title', 'scheduledEndDate', 'completedAt'],
    });

    return tasks.map((t) => ({
      taskId: t.id,
      domain: 'CallCenter',
      title: t.title,
      scheduledEndDate: t.scheduledEndDate ?? null,
      completedAt: t.completedAt ?? null,
    }));
  }

  // ─── Helpers de calcul ────────────────────────────────────────────────────

  /**
   * Calcule le délai en heures entre la date prévue et la date réelle.
   * Résultat négatif = avance, positif = retard, null = impossible à calculer.
   */
  private calcDelayHours(
    scheduledEnd: Date | null,
    completedAt: Date | null,
  ): number | null {
    if (!scheduledEnd || !completedAt) return null;
    const diffMs = completedAt.getTime() - scheduledEnd.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }

  private aggregateStats(
    tasks: Array<{ delayHours: number | null; points: number }>,
  ): DomainStats & { totalPoints: number } {
    const tasksDone = tasks.length;
    let totalDelayHours = 0;
    let onTimeCount = 0;
    let earlyCount = 0;
    let lateCount = 0;
    let totalPoints = 0;
    let tasksWithDelay = 0;

    for (const t of tasks) {
      totalPoints += t.points;

      if (t.delayHours === null) continue; // pas de date prévue

      tasksWithDelay++;
      totalDelayHours += t.delayHours;

      if (t.delayHours < 0) earlyCount++;
      else if (t.delayHours === 0) onTimeCount++;
      else lateCount++;
    }

    const avgDelay =
      tasksWithDelay > 0
        ? Math.round((totalDelayHours / tasksWithDelay) * 100) / 100
        : 0;

    return {
      tasksDone,
      score: tasksDone > 0 ? Math.round((totalPoints / tasksDone) * 100) / 100 : 0,
      avgDelay,
      onTimeCount,
      earlyCount,
      lateCount,
      totalDelayHours: Math.round(totalDelayHours * 100) / 100,
      totalPoints,
    };
  }

  private async resetScore(profile: MemberProfileEntity): Promise<MemberProfileEntity> {
    Object.assign(profile, {
      globalScore: 0,
      grade: 'F',
      totalTasksDone: 0,
      onTimeCount: 0,
      earlyCount: 0,
      lateCount: 0,
      avgDelayHours: 0,
      totalDelayHours: 0,
      onTimeRate: 0,
      itTasksDone: 0, itScore: 0, itAvgDelay: 0,
      marketingTasksDone: 0, marketingScore: 0, marketingAvgDelay: 0,
      callCenterTasksDone: 0, callCenterScore: 0, callCenterAvgDelay: 0,
      recentTasksSnapshot: null,
      scoreEvolution: 0,
      scoreUpdatedAt: new Date(),
    });
    return this.profileRepo.save(profile);
  }
}