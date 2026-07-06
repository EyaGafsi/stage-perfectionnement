// ─── callcenterProjectMetrics.ts ─────────────────────────────────────────────

import type { SprintCallCenter, ProjectMember } from './Types';
import { safeNum } from './Callcenterestimationservice';

export interface CallCenterProjectMetrics {
  totalHours:      number;
  teamSize:        number;
  durationDays:    number;
  estimatedBudget: number;
}

export function computeCallCenterProjectMetrics(
  sprints:        SprintCallCenter[],
  members:        ProjectMember[],
  memberCount:    number,
): CallCenterProjectMetrics {
  // Total heures = somme des estimatedHours de toutes les tâches
  const totalHours = sprints.reduce(
    (sum, s) =>
      sum +
      s.tasks.reduce(
        (ts, t) => ts + safeNum(t.aiEstimatedHours ?? t.estimatedHours),
        0,
      ),
    0,
  );

  const teamSize = Math.max(memberCount, 1);

  // Durée = totalHours / 8h par jour / teamSize  (même formule que marketing)
  const durationDays = totalHours > 0
    ? Math.max(Math.ceil(totalHours / 8 / teamSize), 1)
    : 0;

  // Budget estimé fallback (avant appel API)
  const estimatedBudget = sprints.reduce(
    (sum, s) => sum + safeNum(s.budgetAllocated),
    0,
  );

  return { totalHours, teamSize, durationDays, estimatedBudget };
}