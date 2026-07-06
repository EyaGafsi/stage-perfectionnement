// ─── estimationService.ts ─────────────────────────────────────────────────────
// AI estimation logic — enriched with historical member performance data.
//
// Payload sent to /predict-hours now includes:
//   • Task attributes: type, priority, storyPoints, complexityScore, riskLevel,
//     hasBlockingDependencies, dependenciesCount, memberLevel
//   • Member history: memberAvgCompletionHours, memberAvgDelayHours,
//     memberCompletedTasksCount, memberAvgReopenRate, memberCurrentWorkload,
//     memberAvgWorkLogHours, memberAvgStoryPoints
//
// If member stats are unavailable (new member, API down), the call falls back
// gracefully to the base payload — no regression.

import type { Task, ProjectMember, MemberStats } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { predictTaskDelay } from '@/Dashboard/project/[id]/sprintslist/services/delayPredictionService';

// ─── Member level lookup ──────────────────────────────────────────────────────

export function getMemberLevel(
  assignedTo: any,
  members: ProjectMember[],
): string {
  if (!assignedTo) return 'Junior';
  const id = typeof assignedTo === 'object' ? assignedTo.id : assignedTo;
  const member = members.find((m) => m.id === Number(id));
  return member?.level ?? 'Junior';
}

// ─── Fetch member stats from backend ─────────────────────────────────────────
// Returns null on error so callers can safely use the base payload as fallback.

export async function fetchMemberStats(
  memberId: any,
  authToken: string,
): Promise<MemberStats | null> {
  if (!memberId) return null;
  const id = typeof memberId === 'object' ? memberId.id : memberId;
  if (!id) return null;
  
  try {
    const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL || '';
    const res = await fetch(`${apiBase}/projects/member-stats/${Number(id)}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as MemberStats;
  } catch {
    return null;
  }
}

// ─── Single-task estimate ─────────────────────────────────────────────────────

export async function estimateTaskHours(
  task: Task,
  authToken: string,
  members: ProjectMember[] = [],
  memberStats?: MemberStats | null,
): Promise<number | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const aiBase = process.env.NEXT_PUBLIC_AI_task_DURATION_API_URL;
    if (!aiBase) return null;

    const memberLevel = getMemberLevel(task.assignedTo, members);

    // ── Base payload (always present) ─────────────────────────────────────────
    const payload: Record<string, unknown> = {
      type:     task.type.charAt(0).toUpperCase() + task.type.slice(1).toLowerCase(),
      priority: task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase(),
      storyPoints:             Number(task.storyPoints),
      complexityScore:         Number(task.complexityScore),
      riskLevel:               Number(task.riskLevel),
      hasBlockingDependencies: !!(task.dependencies && task.dependencies.trim()),
      dependenciesCount:       task.dependencies
        ? task.dependencies.split(',').filter(Boolean).length
        : 0,
      memberLevel, // required by FastAPI schema
    };

    // ── Enrichissement historique (si disponible) ─────────────────────────────
    // Ces champs permettent au modèle IA d'ajuster sa prédiction en fonction
    // des performances réelles passées du membre assigné.
    if (memberStats) {
      // Temps moyen réel de complétion des tâches par ce membre
      payload.memberAvgCompletionHours = memberStats.avgCompletionHours;

      // Retard moyen observé (heures) — indicateur de fiabilité sur les délais
      payload.memberAvgDelayHours = memberStats.avgDelayHours;

      // Nombre de tâches terminées — plus c'est élevé, plus les stats sont fiables
      payload.memberCompletedTasksCount = memberStats.completedTasksCount;

      // Taux moyen de réouverture — indicateur de qualité du travail
      payload.memberAvgReopenRate = memberStats.avgReopenRate;

      // Charge de travail actuelle — plus la charge est haute, plus la tâche prendra du temps
      payload.memberCurrentWorkload = memberStats.currentWorkload;

      // Heures réellement loguées en moyenne — reflète la cadence réelle de travail
      payload.memberAvgWorkLogHours = memberStats.avgWorkLogHours;

      // Story points moyens des tâches déjà complétées — calibre la complexité habituelle
      payload.memberAvgStoryPoints = memberStats.avgStoryPoints;
    }

    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${aiBase}/predict-hours`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[estimationService] predict-hours ${res.status}:`, body);
      return null;
    }

    const data = await res.json();
    return typeof data.estimated_hours === 'number' ? data.estimated_hours : null;
  } catch (err) {
    if (typeof timeoutId !== 'undefined') clearTimeout(timeoutId);
    console.warn('[estimationService] predict-hours error (probably timeout):', err);
    return null;
  }
}

// ─── Bulk estimate ────────────────────────────────────────────────────────────
// Fetches member stats for each distinct assignee, then estimates all tasks
// in parallel with the enriched payload.

export async function estimateAllTaskHours(
  tasks: Task[],
  authToken: string,
  members: ProjectMember[] = [],
): Promise<Task[]> {
  // 1. Collecter les IDs de membres distincts assignés
  const memberIds = [...new Set(
    tasks
      .map((t) => {
        if (!t.assignedTo) return null;
        return typeof t.assignedTo === 'object' ? Number((t.assignedTo as any).id) : Number(t.assignedTo);
      })
      .filter((id): id is number => id !== null && !isNaN(id) && id > 0),
  )];

  // 2. Fetch les stats de chaque membre en parallèle
  const statsMap = new Map<number, MemberStats | null>();
  await Promise.all(
    memberIds.map(async (id) => {
      const stats = await fetchMemberStats(id, authToken);
      statsMap.set(id, stats);
    }),
  );

  // 3. Estimer chaque tâche avec les stats du membre correspondant
  return Promise.all(
    tasks.map(async (t) => {
      if (!t.title.trim()) return t;
      let memberId = null;
      if (t.assignedTo) {
        memberId = typeof t.assignedTo === 'object' ? Number((t.assignedTo as any).id) : Number(t.assignedTo);
      }
      const stats = memberId ? (statsMap.get(memberId) ?? null) : null;
      const [hours, delayPrediction] = await Promise.all([
        estimateTaskHours(t, authToken, members, stats),
        predictTaskDelay(t, members, stats).catch(err => {
          console.error('Failed to predict delay in bulk:', err);
          return null;
        })
      ]);
      
      let delayProps = {};
      if (delayPrediction) {
        delayProps = {
          aiDelayRiskProbability: delayPrediction.risk_probability,
          aiPredictedDelayReason: delayPrediction.will_be_delayed ? delayPrediction.predicted_reason : undefined,
        };
      }

      return hours !== null ? { ...t, aiEstimatedHours: hours, ...delayProps } : { ...t, ...delayProps };
    }),
  );
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatHoursDays(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${m > 0 ? String(m).padStart(2, '0') : '00'}`;
}

// ─── Safe number helper ───────────────────────────────────────────────────────
// Converts null/undefined/NaN → 0.
export function safeHours(v: number | null | undefined): number {
  if (v === null || v === undefined || Number.isNaN(v)) return 0;
  return v;
}