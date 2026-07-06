'use client';
// ─── Types.ts — Marketing Sprints & Tasks ─────────────────────────────────────
export type TaskMarketingType =
  | 'ANALYTICS' | 'CAMPAIGN' | 'CONTENT_CREATION' | 'COPYWRITING'
  | 'DESIGN' | 'EMAIL' | 'PPC' | 'SEO' | 'SOCIAL_MEDIA' | 'OTHER';
export type TaskMarketingStatus =
  | 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export type TaskMarketingPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProjectMember {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  fullname?: string;
  email: string;
  level?: string;
}

export interface TaskMarketing {
  id?: number;
  title: string;
  description?: string;
  type: TaskMarketingType;
  status: TaskMarketingStatus;
  priority: TaskMarketingPriority;
  estimatedHours?: number;
  aiEstimatedHours?: number;
  budget?: number;
  expectedViews?: number;
  expectedClicks?: number;
  expectedLeads?: number;
  expectedConversions?: number;
  expectedCTR?: number;
  channel?: string;
  // ✅ Both dates present
  scheduledStartDate?: string | null;
  scheduledEndDate?: string | null;
  completedAt?: string;
  delayHours?: number;
  assignedTo?: number | { id: number; fullname?: string; email?: string } | string;
  // AI model inputs
  cost?: number;
  impressions?: number;
  score?: number;
  complexity?: number;
  effort?: number;
}

export interface SprintMarketing {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  totalBudget?: number;
  spentBudget?: number;
  campaignType?: string;
  targetAudience?: string;
  expectedReach?: number;
  expectedLeads?: number;
  expectedConversions?: number;
  expectedROI?: number;
  expectedCTR?: number;
  channels?: string;
  priority?: string;
  complexity?: string;
  goals?: string;
  risks?: string;
  dependencies?: string;
  additionalNotes?: string;
  tasks: TaskMarketing[];
}

// ─── Acceptable values for ML model categorical inputs ────────────────────────

export const TASK_TYPE_OPTIONS: TaskMarketingType[] = [
  'ANALYTICS', 'CAMPAIGN', 'CONTENT_CREATION', 'COPYWRITING',
  'DESIGN', 'EMAIL', 'PPC', 'SEO', 'SOCIAL_MEDIA', 'OTHER',
];

export const TASK_STATUS_OPTIONS: { value: TaskMarketingStatus; label: string }[] = [
  { value: 'TO_DO',       label: 'À faire' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'IN_REVIEW',   label: 'En révision' },
  { value: 'DONE',        label: 'Fait' },
  { value: 'BLOCKED',     label: 'Bloqué' },
];

export const TASK_PRIORITY_OPTIONS: { value: TaskMarketingPriority; label: string }[] = [
  { value: 'LOW',      label: 'Basse' },
  { value: 'MEDIUM',   label: 'Moyenne' },
  { value: 'HIGH',     label: 'Haute' },
  { value: 'CRITICAL', label: 'Critique' },
];

/** Channels accepted by the ML model (ch_* one-hot columns) */
export const CHANNEL_OPTIONS: string[] = [
  'App', 'Bing', 'Creative', 'Display', 'Email', 'Facebook', 'Google',
  'Instagram', 'Internal', 'LinkedIn', 'Multi', 'Native', 'Pinterest',
  'Programmatic', 'Push', 'SMS', 'Snapchat', 'Social', 'Spotify', 'TV',
  'TikTok', 'Twitter', 'Website', 'YouTube',
];

export const CAMPAIGN_TYPE_OPTIONS: string[] = [
  'Email', 'Social Media', 'SEO', 'PPC', 'Content',
  'Video', 'Influencer', 'Event', 'PR', 'Mixed',
];

// ─── Validation helpers ────────────────────────────────────────────────────────

/**
 * Returns true if the channel value contains only ML-accepted channel names.
 * Accepts semicolon-separated list (e.g. "Google;Facebook;Email").
 */
export function isValidChannel(value: string): boolean {
  if (!value) return true;
  const parts = value.split(';').map((s) => s.trim()).filter(Boolean);
  return parts.every((p) => CHANNEL_OPTIONS.includes(p));
}

/**
 * Validate that task dates fit within sprint dates.
 * Returns an error message or null if valid.
 */
export function validateTaskDates(
  taskStart: string | null | undefined,
  taskEnd: string | null | undefined,
  sprintStart: string,
  sprintEnd: string,
): string | null {
  const sStart = new Date(sprintStart);
  const sEnd   = new Date(sprintEnd);

  if (taskStart) {
    const tStart = new Date(taskStart);
    if (tStart < sStart) return `La date de début de la tâche (${taskStart}) est avant le début du sprint.`;
    if (tStart > sEnd)   return `La date de début de la tâche (${taskStart}) dépasse la fin du sprint.`;
  }
  if (taskEnd) {
    const tEnd = new Date(taskEnd);
    if (tEnd > sEnd)     return `La date de fin de la tâche (${taskEnd}) dépasse la fin du sprint.`;
    if (taskStart && tEnd < new Date(taskStart)) return `La date de fin de la tâche est avant sa date de début.`;
  }
  return null;
}

/**
 * Validate that a sprint does not overlap with existing sprints.
 * Returns an error message or null if valid.
 */
export function validateSprintOverlap(
  newStart: string,
  newEnd:   string,
  existingSprints: SprintMarketing[],
  excludeId?: number,
): string | null {
  const nStart = new Date(newStart);
  const nEnd   = new Date(newEnd);

  if (nEnd <= nStart) return 'La date de fin du sprint doit être après sa date de début.';

  for (const s of existingSprints) {
    if (s.id === excludeId) continue;
    const sStart = new Date(s.startDate);
    const sEnd   = new Date(s.endDate);
    // overlap: nStart < sEnd AND nEnd > sStart
    if (nStart < sEnd && nEnd > sStart) {
      return `Ce sprint chevauche le sprint "${s.name}" (${s.startDate.split('T')[0]} – ${s.endDate.split('T')[0]}).`;
    }
  }
  return null;
}

/**
 * Validate sprint dates fit within project dates.
 */
export function validateSprintWithinProject(
  sprintStart: string,
  sprintEnd:   string,
  projectStart?: string | null,
  projectEnd?:   string | null,
): string | null {
  if (!projectStart && !projectEnd) return null;

  const sStart = new Date(sprintStart);
  const sEnd   = new Date(sprintEnd);

  if (projectStart) {
    const pStart = new Date(projectStart);
    if (sStart < pStart) return `Le sprint commence avant le début du projet (${projectStart.split('T')[0]}).`;
  }
  if (projectEnd) {
    const pEnd = new Date(projectEnd);
    if (sEnd > pEnd) return `Le sprint dépasse la date de fin du projet (${projectEnd.split('T')[0]}).`;
  }
  return null;
}

// ─── Empty factories ───────────────────────────────────────────────────────────

export function getEmptyTask(): TaskMarketing {
  return {
    title: '',
    description: '',
    type: 'SEO',
    status: 'TO_DO',
    priority: 'MEDIUM',
    estimatedHours: 0,
    budget: 0,
    expectedViews: 0,
    expectedClicks: 0,
    expectedLeads: 0,
    expectedConversions: 0,
    expectedCTR: 0,
    channel: '',
    scheduledStartDate: null,
    scheduledEndDate: null,
    assignedTo: '',
    cost: 0,
    impressions: 0,
    score: 3,
    complexity: 3,
    effort: 2,
  };
}

export function getEmptySprint(): SprintMarketing {
  return {
    name: '',
    startDate: '',
    endDate: '',
    status: 'planned',
    totalBudget: 0,
    campaignType: '',
    targetAudience: '',
    expectedReach: 0,
    expectedLeads: 0,
    expectedROI: 0,
    channels: '',
    goals: '',
    priority: 'Medium',
    complexity: 'Medium',
    tasks: [],
  };
}

export const inputClass =
  'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 ' +
  'focus:bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none';

export const labelClass =
  'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5';
