// ─── marketingProjectMetrics.ts ──────────────────────────────────────────────

import type { SprintMarketing, TaskMarketing, ProjectMember } from './Types';

export interface MarketingProjectMetrics {
  totalHours: number;
  teamSize: number;
  durationDays: number;
  estimatedBudget: number;
}

function taskEffectiveHours(task: TaskMarketing): number {
  const ai     = task.aiEstimatedHours;
  const manual = task.estimatedHours;
  if (ai     != null && !isNaN(Number(ai)))     return Number(ai);
  if (manual != null && !isNaN(Number(manual))) return Number(manual);
  return 0;
}

export function computeMarketingProjectMetrics(
  sprints: SprintMarketing[],
  members: ProjectMember[],
  forcedTeamSize?: number,
): MarketingProjectMetrics {
  const allTasks: TaskMarketing[] = sprints.flatMap((s) => s.tasks ?? []);

  // Σ heures estimées
  const totalHours = allTasks.reduce((sum, t) => sum + taskEffectiveHours(t), 0);

  // teamSize = membres du projet (même logique IT)
  const teamSize = forcedTeamSize && forcedTeamSize > 0
    ? forcedTeamSize
    : Math.max(members.length, 1);

  // ceil(totalHours / 8 / teamSize)
  const durationDays = totalHours > 0
    ? Math.ceil(totalHours / 8 / teamSize)
    : 0;

  // budget total des sprints comme fallback local
  const estimatedBudget = sprints.reduce(
    (sum, s) => sum + Number(s.totalBudget ?? 0), 0,
  );

  return { totalHours, teamSize, durationDays, estimatedBudget };
}