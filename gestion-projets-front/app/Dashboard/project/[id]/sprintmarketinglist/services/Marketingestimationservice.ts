'use client';
// ─── Marketingestimationservice.ts ───────────────────────────────────────────

import type { TaskMarketing } from './Types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const safeNum = (v: unknown): number => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};

export const formatHours = (h: number): string => {
  if (h < 1) return `${Math.round(h * 60)}min`;
  if (Number.isInteger(h)) return `${h}h`;
  return `${h.toFixed(1)}h`;
};

// ─── serializeTask ────────────────────────────────────────────────────────────

export const serializeTask = (task: TaskMarketing): Record<string, unknown> => {
  let assignedToPayload: { id: number } | undefined;

  if (task.assignedTo != null && task.assignedTo !== '' && task.assignedTo !== '0') {
    const rawId =
      typeof task.assignedTo === 'object' && 'id' in task.assignedTo
        ? (task.assignedTo as { id: number }).id
        : Number(task.assignedTo);

    if (rawId && isFinite(rawId)) {
      assignedToPayload = { id: rawId };
    }
  }

  const toISO = (d: string | null | undefined): string | null => {
    if (!d) return null;
    try { return new Date(d).toISOString(); }
    catch { return null; }
  };

  const estimatedHours =
    task.aiEstimatedHours != null
      ? Math.round(safeNum(task.aiEstimatedHours))
      : task.estimatedHours != null
        ? Math.round(safeNum(task.estimatedHours))
        : undefined;

  let computedDelay = Number(task.delayHours ?? 0) || 0;
  if (task.status !== 'DONE' && task.scheduledEndDate) {
    const endDate = new Date(task.scheduledEndDate);
    const now = new Date();
    if (!isNaN(endDate.getTime()) && now > endDate) {
      computedDelay = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60);
    }
  }

  return {
    title:       task.title,
    description: task.description ?? '',
    type:        task.type,
    status:      task.status,
    priority:    task.priority,
    channel:     task.channel ?? '',

    scheduledStartDate: toISO(task.scheduledStartDate),
    scheduledEndDate:   toISO(task.scheduledEndDate),

    estimatedHours,

    budget: task.budget != null ? safeNum(task.budget) : undefined,
    cost:   task.cost   != null ? safeNum(task.cost)   : undefined,

    expectedViews:       task.expectedViews       != null ? safeNum(task.expectedViews)       : undefined,
    impressions:         task.impressions          != null ? safeNum(task.impressions)          : undefined,
    expectedClicks:      task.expectedClicks       != null ? safeNum(task.expectedClicks)      : undefined,
    expectedLeads:       task.expectedLeads        != null ? safeNum(task.expectedLeads)       : undefined,
    expectedConversions: task.expectedConversions  != null ? safeNum(task.expectedConversions) : undefined,
    expectedCTR:         task.expectedCTR          != null ? safeNum(task.expectedCTR)         : undefined,

    score:           task.score           != null ? safeNum(task.score)           : undefined,
    complexityScore: task.complexityScore != null ? safeNum(task.complexityScore) : task.complexity != null ? safeNum(task.complexity) : undefined,
    riskLevel:       task.riskLevel       != null ? safeNum(task.riskLevel)       : task.effort     != null ? safeNum(task.effort)     : undefined,

    assignedTo: assignedToPayload ?? null,
    delayHours: computedDelay,
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_PREDICT_URL = process.env.NEXT_PUBLIC_AI_MARKETING_URL;

// Valeurs acceptées par le modèle ML (ch_* one-hot) — ordre identique au mlb.classes_
const CHANNEL_OPTIONS = [
  'App', 'Bing', 'Creative', 'Display', 'Email', 'Facebook', 'Google',
  'Instagram', 'Internal', 'LinkedIn', 'Multi', 'Native', 'Pinterest',
  'Programmatic', 'Push', 'SMS', 'Snapchat', 'Social', 'Spotify', 'TV',
  'TikTok', 'Twitter', 'Website', 'YouTube',
];

// Mapping premier canal → channel_group catégoriel attendu par le pipeline sklearn
const CHANNEL_GROUP_MAP: Record<string, string> = {
  'Google':       'SEM',
  'Bing':         'SEM',
  'Facebook':     'Social',
  'Instagram':    'Social',
  'TikTok':       'Social',
  'Twitter':      'Social',
  'LinkedIn':     'Social',
  'Snapchat':     'Social',
  'Pinterest':    'Social',
  'Social':       'Social',
  'YouTube':      'Video',
  'Spotify':      'Audio',
  'Email':        'Email',
  'Push':         'Retention',
  'SMS':          'Retention',
  'Display':      'Programmatic',
  'Programmatic': 'Programmatic',
  'Native':       'Content',
  'Creative':     'Creative',
  'Multi':        'Multi',
  'App':          'Performance',
  'Website':      'Direct',
  'Internal':     'Ops',
};

// ─── AI estimation (single task) ─────────────────────────────────────────────

export async function estimateMarketingTaskHours(
  task: TaskMarketing,
): Promise<number | null> {
  try {
    // ── Canaux actifs ─────────────────────────────────────────────────────────
    const activeChannels = (task.channel ?? '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    // ── ch_* one-hot (24 colonnes) ────────────────────────────────────────────
    const channelOneHot = Object.fromEntries(
      CHANNEL_OPTIONS.map((ch) => [`ch_${ch}`, activeChannels.includes(ch) ? 1 : 0]),
    );

    // ── channel_group catégoriel ──────────────────────────────────────────────
    const firstChannel = activeChannels[0] ?? '';
    const channelGroup = CHANNEL_GROUP_MAP[firstChannel] ?? 'Social';

    // ── Payload aligné sur les colonnes d'entraînement ────────────────────────
    const payload = {
      // Catégorielles (OneHotEncoding dans le pipeline sklearn)
      task_type:     task.type,
      status:        task.status,
      priority:      task.priority,
      channel_group: channelGroup,

      // ✅ CORRECTION : mapping correct frontend → colonnes d'entraînement
      cost:        safeNum(task.budget ?? task.cost),           // budget du dataset
      impressions: safeNum(task.impressions ?? task.expectedViews), // expectedViews
      clicks:      safeNum(task.expectedClicks),
      conversions: safeNum(task.expectedConversions),
      leads:       safeNum(task.expectedLeads),
      score:       safeNum(task.complexity ?? 3),  // complexityScore (1-5)
      ctr:         safeNum(task.expectedCTR),
      complexity:  safeNum(task.complexity ?? 3),
      effort:      safeNum(task.effort ?? 2),      // riskLevel proxy
      unused1:     0,
      flag:        0,
      id:          0,

      // ch_* one-hot
      ...channelOneHot,

      // channels brut — le serveur le transforme via mlb
      channels: task.channel ?? '',
    };

    const res = await fetch(AI_PREDICT_URL!, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ data: payload }),
    });

    if (!res.ok) {
      console.error('[AI estimate]', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    console.log('[AI estimate] réponse brute:', data);

    // L'API retourne déjà des heures (actualDurationHours = heures)
    const raw = data.prediction ?? data.estimated_hours;

    // Ignorer prédictions invalides (tâche marketing : 0.5h – 500h max)
    if (typeof raw !== 'number' || raw <= 0 || raw > 500) {
      console.warn('[AI estimate] valeur hors plage ignorée:', raw);
      return null;
    }

    return Math.round(raw * 100) / 100;
  } catch (err) {
    console.error('[AI estimate] error:', err);
    return null;
  }
}

// ─── AI estimation (batch) ────────────────────────────────────────────────────

export async function estimateAllMarketingTasks(
  tasks: TaskMarketing[],
): Promise<TaskMarketing[]> {
  const results = await Promise.allSettled(
    tasks.map((t) => estimateMarketingTaskHours(t)),
  );

  return tasks.map((task, i) => {
    const result = results[i];
    const hours =
      result.status === 'fulfilled' && result.value != null
        ? result.value
        : null;
    return hours != null
      ? { ...task, aiEstimatedHours: hours, estimatedHours: hours }
      : task;
  });
}