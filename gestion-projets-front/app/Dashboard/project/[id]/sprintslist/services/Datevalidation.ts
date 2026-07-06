// ─── dateValidation.ts ────────────────────────────────────────────────────────
// All date validation logic for tasks, sprints, and the project.
// Returns typed error objects so callers can surface precise messages.

import type { Sprint, Task } from '@/Dashboard/project/[id]/sprintslist/services/types';

export interface DateError {
  field: string;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip time portion so we compare calendar days only */
function toDay(d: string | Date): Date {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function fmt(d: string | Date): string {
  return toDay(d).toLocaleDateString('fr-FR');
}

// ─── Task date validation ─────────────────────────────────────────────────────
//
// Rule: task start and task end must both lie within [sprint.startDate, sprint.endDate].
// Also enforces that task start ≤ task end when both are provided.
//
export function validateTaskDates(
  task: Pick<Task, 'scheduledStartDate' | 'scheduledEndDate' | 'title'>,
  sprint: Pick<Sprint, 'startDate' | 'endDate' | 'name'>,
): DateError[] {
  const errors: DateError[] = [];
  if (!sprint.startDate || !sprint.endDate) return errors;

  const sStart = toDay(sprint.startDate);
  const sEnd   = toDay(sprint.endDate);

  if (task.scheduledStartDate) {
    const tStart = toDay(task.scheduledStartDate);
    if (tStart < sStart) {
      errors.push({
        field: 'scheduledStartDate',
        message: `La date de début (${fmt(tStart)}) doit être ≥ au début du sprint ${sprint.name} (${fmt(sStart)}).`,
      });
    }
    if (tStart > sEnd) {
      errors.push({
        field: 'scheduledStartDate',
        message: `La date de début (${fmt(tStart)}) doit être ≤ à la fin du sprint ${sprint.name} (${fmt(sEnd)}).`,
      });
    }
  }

  if (task.scheduledEndDate) {
    const tEnd = toDay(task.scheduledEndDate);
    if (tEnd < sStart) {
      errors.push({
        field: 'scheduledEndDate',
        message: `La date de fin (${fmt(tEnd)}) doit être ≥ au début du sprint ${sprint.name} (${fmt(sStart)}).`,
      });
    }
    if (tEnd > sEnd) {
      errors.push({
        field: 'scheduledEndDate',
        message: `La date de fin (${fmt(tEnd)}) doit être ≤ à la fin du sprint ${sprint.name} (${fmt(sEnd)}).`,
      });
    }
  }

  if (task.scheduledStartDate && task.scheduledEndDate) {
    if (toDay(task.scheduledStartDate) > toDay(task.scheduledEndDate)) {
      errors.push({
        field: 'scheduledEndDate',
        message: 'La date de fin doit être ≥ à la date de début de la tâche.',
      });
    }
  }

  return errors;
}

// ─── Sprint date validation ────────────────────────────────────────────────────
//
// Rules:
//   1. sprint start ≤ sprint end
//   2. sprint must lie within [project.startDate, project.endDate] (if provided)
//   3. sprint must NOT overlap with any other existing sprint
//      (a sprint can only start after the previous one ends)
//
export interface SprintDateValidationOptions {
  sprint: Pick<Sprint, 'id' | 'name' | 'startDate' | 'endDate'>;
  /** All OTHER sprints (exclude the one being edited) */
  otherSprints: Pick<Sprint, 'id' | 'name' | 'startDate' | 'endDate'>[];
  /** Optional project bounds */
  projectStartDate?: string;
  projectEndDate?: string;
}

export function validateSprintDates({
  sprint,
  otherSprints,
  projectStartDate,
  projectEndDate,
}: SprintDateValidationOptions): DateError[] {
  const errors: DateError[] = [];

  if (!sprint.startDate || !sprint.endDate) return errors;

  const sStart = toDay(sprint.startDate);
  const sEnd   = toDay(sprint.endDate);

  // Rule 1 — start ≤ end
  if (sStart > sEnd) {
    errors.push({
      field: 'endDate',
      message: 'La date de fin du sprint doit être ≥ à sa date de début.',
    });
    // No point checking further if the sprint itself is inverted
    return errors;
  }

  // Rule 2 — within project bounds
  if (projectStartDate) {
    const pStart = toDay(projectStartDate);
    if (sStart < pStart) {
      errors.push({
        field: 'startDate',
        message: `Le sprint ne peut pas commencer (${fmt(sStart)}) avant le projet (${fmt(pStart)}).`,
      });
    }
  }
  if (projectEndDate) {
    const pEnd = toDay(projectEndDate);
    if (sEnd > pEnd) {
      errors.push({
        field: 'endDate',
        message: `Le sprint ne peut pas se terminer (${fmt(sEnd)}) après la fin du projet (${fmt(pEnd)}).`,
      });
    }
  }

  // Rule 3 — no overlap with other sprints
  for (const other of otherSprints) {
    if (!other.startDate || !other.endDate) continue;
    const oStart = toDay(other.startDate);
    const oEnd   = toDay(other.endDate);

    // Overlap: not (sEnd < oStart || sStart > oEnd)
    const overlaps = !(sEnd < oStart || sStart > oEnd);
    if (overlaps) {
      errors.push({
        field: 'startDate',
        message: `Le sprint chevauche le sprint "${other.name}" (${fmt(oStart)} – ${fmt(oEnd)}). Un sprint doit commencer après la fin du précédent.`,
      });
    }
  }

  return errors;
}

// ─── Sort sprints by start date ascending ────────────────────────────────────

export function sortSprintsByDate<T extends { startDate: string }>(sprints: T[]): T[] {
  return [...sprints].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
}