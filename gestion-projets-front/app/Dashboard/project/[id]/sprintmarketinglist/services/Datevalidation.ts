// ─── Datevalidation.ts ────────────────────────────────────────────────────────
// Règles :
//   1. Sprint doit être DANS les bornes du projet
//   2. Deux sprints ne peuvent pas se chevaucher (overlap ou union)
//   3. Tâche doit être DANS les bornes du sprint qui la contient

import type { SprintMarketing } from './Types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDay = (v: string | null | undefined): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  d.setHours(0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
};

const fmt = (d: Date) =>
  d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ─── 1. SPRINT DATE VALIDATION ────────────────────────────────────────────────
/**
 * Valide les dates d'un sprint :
 * - start < end
 * - [start, end] ⊆ [projectStart, projectEnd]
 * - Pas de chevauchement avec les autres sprints (self exclu par id)
 *
 * Retourne un message d'erreur ou null si tout est OK.
 */
export function validateSprintDates(
  selfId:           number | undefined,
  startDate:        string | null | undefined,
  endDate:          string | null | undefined,
  projectStartDate: string | null | undefined,
  projectEndDate:   string | null | undefined,
  allSprints:       SprintMarketing[],
): string | null {

  const start = toDay(startDate);
  const end   = toDay(endDate);

  // ── Présence ────────────────────────────────────────────────────────────────
  if (!start) return 'La date de début du sprint est requise.';
  if (!end)   return 'La date de fin du sprint est requise.';

  // ── Cohérence interne ────────────────────────────────────────────────────────
  if (start > end)
    return 'La date de début du sprint doit être antérieure à la date de fin.';

  // ── Bornes du projet ─────────────────────────────────────────────────────────
  const projStart = toDay(projectStartDate);
  const projEnd   = toDay(projectEndDate);

  if (projStart && start < projStart)
    return `Le sprint ne peut pas commencer avant le projet (${fmt(projStart)}).`;

  if (projEnd && end > projEnd)
    return `Le sprint ne peut pas se terminer après la fin du projet (${fmt(projEnd)}).`;

  // ── Chevauchement avec les autres sprints ────────────────────────────────────
  for (const sp of allSprints) {
    if (sp.id === selfId) continue;          // exclure le sprint lui-même (mode édition)

    const spStart = toDay(sp.startDate);
    const spEnd   = toDay(sp.endDate);

    if (!spStart || !spEnd) continue;

    // Overlap : [A.start, A.end] ∩ [B.start, B.end] ≠ ∅
    //           ⟺  A.start <= B.end  &&  B.start <= A.end
    const overlaps = start <= spEnd && spStart <= end;

    if (overlaps)
      return (
        `Ce sprint chevauche le sprint "${sp.name}" ` +
        `(${fmt(spStart)} – ${fmt(spEnd)}). ` +
        `Deux sprints ne peuvent pas couvrir la même période.`
      );
  }

  return null;
}

// ─── 2. TASK DATE VALIDATION ──────────────────────────────────────────────────
/**
 * Valide les dates d'une tâche :
 * - start < end
 * - [taskStart, taskEnd] ⊆ [sprintStart, sprintEnd]
 *
 * Retourne un message d'erreur ou null si tout est OK.
 */
export function validateTaskDates(
  taskStart:   string | null | undefined,
  taskEnd:     string | null | undefined,
  sprintStart: string | null | undefined,
  sprintEnd:   string | null | undefined,
): string | null {

  const tStart  = toDay(taskStart);
  const tEnd    = toDay(taskEnd);
  const spStart = toDay(sprintStart);
  const spEnd   = toDay(sprintEnd);

  // ── Si aucune date de tâche → pas d'erreur (champs optionnels) ──────────────
  if (!tStart && !tEnd) return null;

  // ── Cohérence interne ────────────────────────────────────────────────────────
  if (tStart && tEnd && tStart > tEnd)
    return 'La date de début de la tâche doit être antérieure à sa date de fin.';

  // ── Borne inférieure du sprint ───────────────────────────────────────────────
  if (tStart && spStart && tStart < spStart)
    return `La tâche ne peut pas commencer avant le sprint (${fmt(spStart)}).`;

  // ── Borne supérieure du sprint ───────────────────────────────────────────────
  if (tEnd && spEnd && tEnd > spEnd)
    return `La tâche ne peut pas se terminer après le sprint (${fmt(spEnd)}).`;

  return null;
}