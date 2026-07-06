// ─── projectMetrics.ts ────────────────────────────────────────────────────────
// Computes project-level metrics from sprints + team data.
//
// KEY FORMULA (mirrors the DB write in SprintsPage):
//   totalHours       = Σ (aiEstimatedHours ?? estimatedHours ?? 0) for ALL tasks
//   teamSize         = distinct assigned member count (min 1)
//   durationDays     = ceil(totalHours / 8 / teamSize)   ← estimatedDurationDays
//   estimatedCost    = Σ (hours × member hourly rate)    ← local fallback only
//
// The REAL cost is obtained by passing durationDays + teamSize to the AI cost
// API in SprintsPage → estimateProjectCost().  estimatedCost here is only a
// synchronous fallback used when the API is unavailable.

import type { Sprint, Task, ProjectMember } from './types';

// ─── Hourly rate by level (fallback cost only) ────────────────────────────────
const HOURLY_RATE: Record<string, number> = {
  Junior: 25,
  Mid:    45,
  Senior: 70,
  Expert: 95,
};
const DEFAULT_RATE = 40;

function getMemberRate(
  memberId: number | string | undefined,
  members: ProjectMember[],
): number {
  if (!memberId) return DEFAULT_RATE;
  const m = members.find((mb) => mb.id === Number(memberId));
  return HOURLY_RATE[m?.level ?? ''] ?? DEFAULT_RATE;
}

// ─── Task effective hours ─────────────────────────────────────────────────────
// Always prefer the AI estimate; fall back to the manual value.
export function taskEffectiveHours(task: Task): number {
  const ai     = task.aiEstimatedHours;
  const manual = task.estimatedHours;
  if (ai     != null && !isNaN(Number(ai)))     return Number(ai);
  if (manual != null && !isNaN(Number(manual))) return Number(manual);
  return 0;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProjectMetrics {
  /** Σ effective hours across ALL tasks in ALL sprints */
  totalHours: number;
  /** distinct assigned-member count (≥ 1) */
  teamSize: number;
  /**
   * Estimated project duration in working days.
   * Formula: ceil(totalHours / 8 / teamSize)
   * This is the value written to ProjectITEntity.estimatedDurationDays
   * AND forwarded to the AI cost model.
   */
  durationDays: number;
  /**
   * Rate-based cost fallback (hours × member rate).
   * Overwritten by the AI cost API result in SprintsPage before DB write.
   */
  estimatedCost: number;
  sprintMetrics: SprintMetric[];
  warnings: ValidationWarning[];
}

export interface SprintMetric {
  sprintId: number;
  sprintName: string;
  totalHours: number;
  /** Calendar length of the sprint in days */
  durationDays: number;
  taskWarnings: TaskWarning[];
}

export interface TaskWarning {
  taskId?: number;
  taskTitle: string;
  message: string;
}

export interface ValidationWarning {
  sprintId?: number;
  sprintName?: string;
  message: string;
  severity: 'error' | 'warning';
}

// ─── Main computation ─────────────────────────────────────────────────────────
export function computeProjectMetrics(
  sprints: Sprint[],
  members: ProjectMember[],
  forcedTeamSize?: number,
): ProjectMetrics {
  const warnings: ValidationWarning[] = [];

  // ── 1. Collect ALL tasks from every sprint ─────────────────────────────────
  const allTasks: Task[] = sprints.flatMap((s) => s.tasks ?? []);

  // ── 2. Total hours — Σ aiEstimatedHours (or estimatedHours) ──────────────
  const totalHours = allTasks.reduce(
    (sum, t) => sum + taskEffectiveHours(t),
    0,
  );

  // ── 3. Team size — distinct assigned members across all tasks ─────────────
  const assignedIds = new Set(
    allTasks
      .map((t) => (t.assignedTo ? Number(t.assignedTo) : null))
      .filter((id): id is number => id !== null && id > 0),
  );

  // ✅ priorité : forcedTeamSize → assignedIds → min 1
  const teamSize = forcedTeamSize && forcedTeamSize > 0
    ? forcedTeamSize
    : Math.max(assignedIds.size, 1);

  // ── 6. Project date bounds ─────────────────────────────────────────────────
  const sprintDates = sprints
    .filter((s) => s.startDate && s.endDate)
    .map((s) => ({
      start: new Date(s.startDate),
      end:   new Date(s.endDate),
    }));

  const projectStart = sprintDates.length
    ? new Date(Math.min(...sprintDates.map((d) => d.start.getTime())))
    : null;
  const projectEnd = sprintDates.length
    ? new Date(Math.max(...sprintDates.map((d) => d.end.getTime())))
    : null;

  const projectCalDays = projectStart && projectEnd
    ? Math.ceil((projectEnd.getTime() - projectStart.getTime()) / 86_400_000) + 1
    : 0;

  // ── 4. Project duration (working days) ────────────────────────────────────
  //   estimatedDurationDays = ceil(totalHours / 8 / teamSize)
  //   This is the PRIMARY metric forwarded to the AI cost model.
  const durationDays =
    totalHours > 0 
      ? Math.ceil(totalHours / 8 / teamSize) 
      : projectCalDays;

  // ── 5. Local cost fallback (hours × member rate) ──────────────────────────
  //   SprintsPage replaces this with the AI cost API result before DB write.
  const estimatedCost = allTasks.reduce((sum, t) => {
    const hours = taskEffectiveHours(t);
    const rate  = getMemberRate(t.assignedTo, members);
    return sum + hours * rate;
  }, 0);

  // ── 7. Per-sprint metrics + validation ────────────────────────────────────
  const sprintMetrics: SprintMetric[] = sprints.map((sprint) => {
    const tasks = sprint.tasks ?? [];
    const sprintHours = tasks.reduce((s, t) => s + taskEffectiveHours(t), 0);
    const taskWarnings: TaskWarning[] = [];

    const sprintStart = sprint.startDate ? new Date(sprint.startDate) : null;
    const sprintEnd   = sprint.endDate   ? new Date(sprint.endDate)   : null;

    // Sprint calendar duration (days)
    const calDays =
      sprintStart && sprintEnd
        ? Math.ceil(
            (sprintEnd.getTime() - sprintStart.getTime()) / 86_400_000,
          ) + 1
        : 0;

    // Sprint working-day capacity = calDays × teamSize × 8 h/day
    const sprintCapacityHours = calDays * teamSize * 8;

    if (sprintCapacityHours > 0 && sprintHours > sprintCapacityHours) {
      warnings.push({
        sprintId:   sprint.id,
        sprintName: sprint.name,
        message: `Sprint "${sprint.name}" dépasse sa capacité : ${sprintHours.toFixed(1)}h estimées pour ${sprintCapacityHours}h disponibles.`,
        severity: 'warning',
      });
    }

    // Task date validation vs sprint bounds
    for (const task of tasks) {
      if (!task.scheduledStartDate && !task.scheduledEndDate) continue;

      const tStart = task.scheduledStartDate
        ? new Date(task.scheduledStartDate)
        : null;
      const tEnd = task.scheduledEndDate
        ? new Date(task.scheduledEndDate)
        : null;

      if (sprintStart && sprintEnd) {
        if (tStart && (tStart < sprintStart || tStart > sprintEnd)) {
          taskWarnings.push({
            taskId:    task.id,
            taskTitle: task.title,
            message: `Début (${tStart.toLocaleDateString('fr-FR')}) hors de la plage du sprint.`,
          });
        }
        if (tEnd && (tEnd < sprintStart || tEnd > sprintEnd)) {
          taskWarnings.push({
            taskId:    task.id,
            taskTitle: task.title,
            message: `Fin (${tEnd.toLocaleDateString('fr-FR')}) hors de la plage du sprint.`,
          });
        }
      }
    }

    if (taskWarnings.length) {
      warnings.push({
        sprintId:   sprint.id,
        sprintName: sprint.name,
        message: `${taskWarnings.length} tâche(s) ont des dates hors plage dans "${sprint.name}".`,
        severity: 'error',
      });
    }

    // Sprint vs estimated project end
    if (projectStart && projectEnd && durationDays > 0) {
      const projectEndEstimated = new Date(
        projectStart.getTime() + durationDays * 86_400_000,
      );
      if (sprintEnd && sprintEnd > projectEndEstimated) {
        warnings.push({
          sprintId:   sprint.id,
          sprintName: sprint.name,
          message: `Sprint "${sprint.name}" se termine après la durée estimée du projet (${projectEndEstimated.toLocaleDateString('fr-FR')}).`,
          severity: 'warning',
        });
      }
    }

    return {
      sprintId:     sprint.id ?? 0,
      sprintName:   sprint.name,
      totalHours:   sprintHours,
      durationDays: calDays,
      taskWarnings,
    };
  });

  return {
    totalHours,
    teamSize,
    durationDays,
    estimatedCost,
    sprintMetrics,
    warnings,
  };
}