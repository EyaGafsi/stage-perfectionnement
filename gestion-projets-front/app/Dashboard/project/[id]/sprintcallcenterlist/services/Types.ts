// ─── Types.ts — CallCenter Sprints & Tasks ───────────────────────────────────

export type TaskCallCenterType =
  | 'OUTBOUND' | 'INBOUND' | 'FOLLOW_UP' | 'SURVEY' | 'APPOINTMENT'
  | 'RETENTION' | 'UPSELL' | 'SUPPORT' | 'TRAINING' | 'QA' | 'OTHER';

export type TaskCallCenterStatus =
  | 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export type TaskCallCenterPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProjectMember {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  level?: string;
}

export interface TaskCallCenter {
  id?: number;
  title: string;
  description?: string;
  type: TaskCallCenterType;
  status: TaskCallCenterStatus;
  priority: TaskCallCenterPriority;
  estimatedHours?: number;
  aiEstimatedHours?: number;
  targetAgentCount?: number;
  expectedCallsPerAgent?: number;
  targetConversionRate?: number;
  qualityScoreTarget?: number;
  scriptContent?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  completedAt?: string;
  delayHours?: number;
  complexityScore?: number;
  riskLevel?: number;
  assignedTo?: number | { id: number } | string;
}

export interface SprintCallCenter {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  targetAgents?: number;
  expectedCallVolume?: number;
  targetConversionRate?: number;
  budgetAllocated?: number;
  qualityScoreTarget?: number;
  trainingContent?: string;
  scriptTemplates?: string;
  goals?: string;
  priority?: string;
  complexity?: string;
  tasks: TaskCallCenter[];
}

export function getEmptyTask(): TaskCallCenter {
  return {
    title: '',
    description: '',
    type: 'OUTBOUND',
    status: 'TO_DO',
    priority: 'MEDIUM',
    estimatedHours: 0,
    targetAgentCount: 0,
    expectedCallsPerAgent: 0,
    targetConversionRate: 0,
    qualityScoreTarget: 0,
    scriptContent: '',
    scheduledStartDate: '',
    scheduledEndDate: '',
    complexityScore: 0,
    riskLevel: 0,
    assignedTo: '',
  };
}

export function getEmptySprint(): SprintCallCenter {
  return {
    name: '',
    startDate: '',
    endDate: '',
    status: 'planned',
    targetAgents: 0,
    expectedCallVolume: 0,
    targetConversionRate: 0,
    budgetAllocated: 0,
    qualityScoreTarget: 0,
    trainingContent: '',
    scriptTemplates: '',
    goals: '',
    priority: 'Medium',
    complexity: 'Medium',
    tasks: [],
  };
}

export const inputClass =
  'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 ' +
  'focus:bg-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none';

export const labelClass =
  'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5';