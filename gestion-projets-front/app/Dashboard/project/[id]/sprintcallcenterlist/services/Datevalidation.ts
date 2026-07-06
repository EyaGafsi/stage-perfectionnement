// ─── Datevalidation.ts ───────────────────────────────────────────────────────

import type { SprintMarketing } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';

export const toDay = (v: string | Date | null | undefined): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const fmt = (d: Date) =>
  d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ── Generic sprint shape ──────────────────────────────────────────────────────
export type SprintLike = {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
};

// ── Task date validation ──────────────────────────────────────────────────────
export const validateTaskDates = (
  taskStart:   string | Date | null | undefined,
  taskEnd:     string | Date | null | undefined,
  sprintStart: string | Date | null | undefined,
  sprintEnd:   string | Date | null | undefined,
): string | null => {
  const ts = toDay(taskStart);
  const te = toDay(taskEnd);
  const ss = toDay(sprintStart);
  const se = toDay(sprintEnd);

  if (ts && te && ts > te)
    return 'La date de début de la tâche doit être antérieure à sa date de fin.';
  if (ts && ss && ts < ss)
    return `La tâche ne peut pas commencer avant le sprint (${fmt(ss)}).`;
  if (ts && se && ts > se)
    return `La tâche ne peut pas commencer après la fin du sprint (${fmt(se)}).`;
  if (te && ss && te < ss)
    return `La tâche ne peut pas se terminer avant le début du sprint (${fmt(ss)}).`;
  if (te && se && te > se)
    return `La tâche ne peut pas dépasser la fin du sprint (${fmt(se)}).`;

  return null;
};

// ── Generic sprint date validation (Marketing + CallCenter) ──────────────────
export const validateSprintDatesGeneric = (
  sprintId:     number | undefined,
  sprintStart:  string | Date | null | undefined,
  sprintEnd:    string | Date | null | undefined,
  projectStart: string | Date | null | undefined,
  projectEnd:   string | Date | null | undefined,
  allSprints:   SprintLike[] = [],
): string | null => {
  const ss = toDay(sprintStart);
  const se = toDay(sprintEnd);
  const ps = toDay(projectStart);
  const pe = toDay(projectEnd);

  if (!ss || !se) return null;

  if (ss >= se)
    return 'La date de début du sprint doit être antérieure à sa date de fin.';
  if (ps && ss < ps)
    return `Le sprint ne peut pas commencer avant le projet (${fmt(ps)}).`;
  if (pe && se > pe)
    return `Le sprint ne peut pas se terminer après le projet (${fmt(pe)}).`;

  for (const other of allSprints) {
    if (other.id && other.id === sprintId) continue;
    const os = toDay(other.startDate);
    const oe = toDay(other.endDate);
    if (!os || !oe) continue;
    if (ss < oe && se > os)
      return `Ce sprint chevauche le sprint "${other.name}" (${fmt(os)} – ${fmt(oe)}). Les sprints ne peuvent pas se chevaucher.`;
  }
  return null;
};

// ── Marketing-specific (keeps backward compat) ────────────────────────────────
export const validateSprintDates = (
  sprintId:     number | undefined,
  sprintStart:  string | Date | null | undefined,
  sprintEnd:    string | Date | null | undefined,
  projectStart: string | Date | null | undefined,
  projectEnd:   string | Date | null | undefined,
  allSprints:   SprintMarketing[] = [],
): string | null =>
  validateSprintDatesGeneric(sprintId, sprintStart, sprintEnd, projectStart, projectEnd, allSprints);