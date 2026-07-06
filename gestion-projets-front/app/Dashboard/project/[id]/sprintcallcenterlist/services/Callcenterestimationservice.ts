// ─── Callcenterestimationservice.ts ──────────────────────────────────────────

import type { TaskCallCenter } from './Types';

const FASTAPI_URL ='https://callcenter-task-duration-estimator.onrender.com';

// ── Mapping types frontend → valeurs connues du modèle ML ────────────────────
const TYPE_MAP: Record<string, string> = {
  OUTBOUND:          'campaign',
  INBOUND:           'campaign',
  FOLLOW_UP:         'coaching',
  SURVEY:            'reporting',
  APPOINTMENT:       'scripting',
  RETENTION:         'coaching',
  UPSELL:            'scripting',
  SUPPORT:           'quality_assurance',
  TRAINING:          'training',
  QA:                'quality_assurance',
  OTHER:             'other',
  // anciens types — compatibilité données existantes
  CAMPAIGN:          'campaign',
  QUALITY_ASSURANCE: 'quality_assurance',
  SCRIPTING:         'scripting',
  COACHING:          'coaching',
  REPORTING:         'reporting',
  SYSTEM_SETUP:      'system_setup',
};

const STATUS_MAP: Record<string, string> = {
  TO_DO:       'to_do',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW:   'in_review',
  DONE:        'done',
  BLOCKED:     'to_do',
};

const PRIORITY_MAP: Record<string, string> = {
  LOW:      'low',
  MEDIUM:   'medium',
  HIGH:     'high',
  CRITICAL: 'critical',
};

export async function estimateCallCenterTaskHours(
  task: TaskCallCenter,
): Promise<number | null> {
  try {
    const payload = {
      type:                  TYPE_MAP[task.type]         ?? 'other',
      priority:              PRIORITY_MAP[task.priority] ?? 'medium',
      status:                STATUS_MAP[task.status]     ?? 'to_do',
      complexityScore:       safeNum(task.complexityScore),
      riskLevel:             safeNum(task.riskLevel),
      targetAgentCount:      safeNum(task.targetAgentCount),
      expectedCallsPerAgent: safeNum(task.expectedCallsPerAgent),
      targetConversionRate:  safeNum(task.targetConversionRate),
      qualityScoreTarget:    safeNum(task.qualityScoreTarget),
      dependenciesCount:     0,
      reopenCount:           0,
      delayHours:            0,
    };

    const res = await fetch(`${FASTAPI_URL}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.estimatedHours === 'number'
      ? Math.round(data.estimatedHours * 10) / 10
      : null;
  } catch (err) {
    console.error('[callCenterEstimation] error:', err);
    return null;
  }
}

export async function estimateAllCallCenterTasks(
  tasks: TaskCallCenter[],
): Promise<TaskCallCenter[]> {
  return Promise.all(
    tasks.map(async (t) => {
      if (!t.title.trim()) return t;
      const hours = await estimateCallCenterTaskHours(t);
      return hours !== null
        ? { ...t, aiEstimatedHours: hours, estimatedHours: hours }
        : t;
    }),
  );
}

export function formatHours(h: number): string {
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h${mins > 0 ? String(mins).padStart(2, '0') : ''}`;
}

export function safeNum(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export function resolveAssignedToId(val: unknown): number | null {
  if (!val) return null;
  if (typeof val === 'object' && val !== null && 'id' in val)
    return Number((val as any).id);
  const n = Number(val);
  return isNaN(n) || n === 0 ? null : n;
}

export function serializeTask(t: TaskCallCenter): Record<string, unknown> {
  let computedDelay = Number(t.delayHours ?? 0) || 0;
  if (t.status !== 'DONE' && t.scheduledEndDate) {
    const endDate = new Date(t.scheduledEndDate);
    const now = new Date();
    if (!isNaN(endDate.getTime()) && now > endDate) {
      computedDelay = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60);
    }
  }

  return {
    title:                 t.title,
    description:           t.description    || null,
    type:                  t.type,
    status:                t.status,
    priority:              t.priority,
    estimatedHours: Math.round(safeNum(t.aiEstimatedHours ?? t.estimatedHours)),
    targetAgentCount:      safeNum(t.targetAgentCount),
    expectedCallsPerAgent: safeNum(t.expectedCallsPerAgent),
    targetConversionRate:  safeNum(t.targetConversionRate),
    qualityScoreTarget:    safeNum(t.qualityScoreTarget),
    complexityScore:       safeNum(t.complexityScore),   
    riskLevel:             safeNum(t.riskLevel), 
    scriptContent:         t.scriptContent  || null,
    scheduledStartDate:    t.scheduledStartDate
                             ? new Date(t.scheduledStartDate).toISOString()
                             : null,
    scheduledEndDate:      t.scheduledEndDate
                             ? new Date(t.scheduledEndDate).toISOString()
                             : null,
    assignedToId:          resolveAssignedToId(t.assignedTo) ?? undefined,
    delayHours:            computedDelay,
  };
}