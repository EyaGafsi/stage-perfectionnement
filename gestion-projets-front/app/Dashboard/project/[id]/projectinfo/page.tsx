'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, Cpu, Calendar, Users, Clock, DollarSign,
  TrendingUp, CheckCircle2, Loader2, BarChart3,
  Zap, Target, ChevronDown, ChevronUp, AlertTriangle,
  Circle, Activity, PieChart, GitBranch,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
  PieChart as RePieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────────
type TaskType     = 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'TASK' | 'STORY';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type TaskStatus   = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
type SprintStatus = 'planned' | 'in_progress' | 'completed';
type SprintComplexity = 'Low' | 'Medium' | 'High';

interface Task {
  id?: number;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  storyPoints: number;
  estimatedHours: number;
  aiEstimatedHours?: number;
  complexityScore: number;
  riskLevel: number;
  dependencies: string;
}

interface Sprint {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  complexity: SprintComplexity;
  tasks: Task[];
}

interface ProjectDetails {
  project: {
    programmingLanguages: string;
    framework: string;
    database: string;
    serverDetails: string;
    architecture: string;
    apiIntegration: string;
    securityRequirements: string;
    devOpsRequirements: string;
    estimatedDurationDays: number;
    priority: string;
    businessImpact: string;
    startDate: string;
    endDate: string;
    itDetails?: { teamSize: number; estimatedCost?: number };
    assignedTo: { id: number; name?: string; firstName?: string; lastName?: string }[];
  };
}

interface ProjectEstimationResult {
  totalHours: number;
  totalDays: number;
  estimatedEndDate: Date;
  dailyRate: number;
  manpowerCost: number;
  infraCost: number;
  totalCost: number;
  teamSize: number;
  hoursPerDay: number;
  projectCost: number;
  costSource: 'ai' | 'fallback';
}

interface TaskTimeline {
  taskId: string;
  taskTitle: string;
  startDate: Date;
  endDate: Date;
  estimatedHours: number;
  progress: number;
  status: TaskStatus;
}

// ── Sprint status — derived from real task statuses ───────────────────────────
function computeSprintStatus(sprint: Sprint): SprintStatus {
  const tasks = sprint.tasks;
  if (!tasks.length) return 'planned';

  const allDone = tasks.every((t) => t.status === 'DONE');
  if (allDone) return 'completed';

  const someActive = tasks.some(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW',
  );
  const now   = new Date();
  const start = new Date(sprint.startDate);
  const end   = new Date(sprint.endDate);
  const dateActive = now >= start && now <= end;

  if (someActive || dateActive) return 'in_progress';
  return 'planned';
}

// ── XGBoost payload normalizers ───────────────────────────────────────────────
function normalizeBusinessImpact(raw: string): string {
  const b = (raw || '').toLowerCase();
  if (b.includes('critical')) return 'Critical';
  if (b.includes('high'))     return 'High';
  if (b.includes('medium'))   return 'Medium';
  return 'Low';
}

function deriveDominantComplexity(
  sprints: Sprint[],
  fallbackPriority: string,
): string {
  if (sprints.length) {
    const counts: Record<string, number> = {};
    sprints.forEach((s) => {
      const c = s.complexity || 'Medium';
      counts[c] = (counts[c] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }
  const p = (fallbackPriority || '').toLowerCase();
  if (p === 'critical' || p === 'high') return 'High';
  if (p === 'medium') return 'Medium';
  return 'Low';
}

function deriveMainModules(architecture: string, framework: string): string {
  return 'Traffic-Control';
}

// ── Auth token ─────────────────────────────────────────────────────────────────
const getAuthToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '';

// ── Cost estimation (FastAPI / XGBoost) ──────────────────────────────────────
async function estimateProjectCost(
  projectDetails: ProjectDetails,
  sprints: Sprint[],
  totalDays: number,
): Promise<{ cost: number | null; payload: Record<string, unknown> }> {
  const p = projectDetails.project;

  const teamSize =
    (p.assignedTo?.length ?? 0) > 0
      ? p.assignedTo.length
      : p.itDetails?.teamSize ?? 1;

  const estimatedDurationDays = Math.max(Math.ceil(isNaN(totalDays) ? 1 : totalDays), 1);

  const payload: Record<string, unknown> = {
    programmingLanguages: p.programmingLanguages || 'Python',
    framework:            p.framework            || 'FastAPI',
    database:             p.database             || 'PostgreSQL',
    serverDetails:        p.serverDetails        || 'AWS EC2',
    architecture:         p.architecture         || 'Microservices',
    apiIntegration:       p.apiIntegration       || 'REST',
    securityRequirements: p.securityRequirements || 'OAuth2',
    devOpsRequirements:   p.devOpsRequirements   || 'Kubernetes',
    estimatedDurationDays,
    priority:       p.priority || 'High',
    businessImpact: normalizeBusinessImpact(p.businessImpact),
    teamSize,
    complexity: deriveDominantComplexity(sprints, p.priority),
    mainModules: deriveMainModules(p.architecture, p.framework),
  };

  try {
    const costApiBase = process.env.NEXT_PUBLIC_COST_ESTIMATION_API_URL;

    if (!costApiBase) {
      console.error('❌ Missing NEXT_PUBLIC_COST_ESTIMATION_API_URL');
      return { cost: null, payload };
    }

    console.log('📤 Payload sent to XGBoost model:', payload);

    const res = await fetch(`${costApiBase}/predict-cost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`❌ Cost API responded with status ${res.status}`);
      return { cost: null, payload };
    }

    const data = await res.json();
    console.log('📦 Model response:', JSON.stringify(data));

    const cost =
      typeof data.estimated_cost === 'number' ? data.estimated_cost : null;

    return { cost, payload };
  } catch (error) {
    console.error('❌ Cost estimation request failed:', error);
    return { cost: null, payload };
  }
}

// ── Date helpers ───────────────────────────────────────────────────────────────
function addWorkingDays(startDate: Date, days: number): Date {
  const date = new Date(startDate);
  let remaining = Math.ceil(days);
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

// ── Tooltip formatter helper ───────────────────────────────────────────────────
// Recharts ValueType = number | string | (string | number)[] | undefined
// We need to safely coerce it to a displayable number.
function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const TYPE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  FEATURE:     { bg: '#eef2ff', color: '#3730a3', border: '#c7d2fe' },
  BUG:         { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  IMPROVEMENT: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  TASK:        { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  STORY:       { bg: '#f5f3ff', color: '#5b21b6', border: '#ddd6fe' },
};

const PRIORITY_STYLE: Record<string, { color: string; dot: string }> = {
  LOW:      { color: '#6b7280', dot: '#9ca3af' },
  MEDIUM:   { color: '#b45309', dot: '#f59e0b' },
  HIGH:     { color: '#b45309', dot: '#f97316' },
  CRITICAL: { color: '#991b1b', dot: '#ef4444' },
};

const STATUS_STYLE: Record<TaskStatus, { bg: string; color: string; label: string }> = {
  TO_DO:       { bg: '#f3f4f6', color: '#4b5563',  label: 'À faire'     },
  IN_PROGRESS: { bg: '#eff6ff', color: '#1d4ed8',  label: 'En cours'    },
  IN_REVIEW:   { bg: '#fffbeb', color: '#92400e',  label: 'En révision' },
  DONE:        { bg: '#f0fdf4', color: '#166534',  label: 'Terminée'    },
  BLOCKED:     { bg: '#fef2f2', color: '#991b1b',  label: 'Bloquée'     },
};

const CHART_COLORS = {
  status: {
    DONE:        '#10b981',
    IN_PROGRESS: '#4f46e5',
    IN_REVIEW:   '#f59e0b',
    TO_DO:       '#9ca3af',
    BLOCKED:     '#ef4444',
  },
  risk:  ['#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444'],
  cost:  ['#4f46e5', '#0891b2'],
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function SprintStatusBadge({ status }: { status: SprintStatus }) {
  const map: Record<SprintStatus, { label: string; bg: string; color: string }> = {
    completed:   { label: 'Terminé',   bg: '#e8f5ee', color: '#1a6640' },
    in_progress: { label: 'En cours',  bg: '#fff3e0', color: '#b05d00' },
    planned:     { label: 'Planifié',  bg: '#f3f4f6', color: '#4b5563' },
  };
  const s = map[status];
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600,
      padding: '3px 9px', borderRadius: 20,
    }}>{s.label}</span>
  );
}

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.TO_DO;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 10, fontWeight: 600,
      padding: '2px 7px', borderRadius: 5,
    }}>{s.label}</span>
  );
}

function KpiCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string; accent: string;
}) {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #e5e3de',
      borderRadius: 14,
      padding: '1.1rem 1.2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        <span style={{
          fontSize: 11, color: '#9ca3af', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#111', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>{sub}</div>
    </div>
  );
}

const ChartTooltipStyle = {
  background: '#fff',
  border: '0.5px solid #e5e3de',
  borderRadius: 8,
  fontSize: 12,
  color: '#111',
};

// ── Best practices panel ───────────────────────────────────────────────────────
function BestPractices({
  sprint,
  computedStatus,
}: {
  sprint: Sprint;
  computedStatus: SprintStatus;
}) {
  const tips: { icon: string; text: string; type: 'warn' | 'ok' | 'info' }[] = [];

  const highRisk   = sprint.tasks.filter((t) => t.riskLevel >= 3);
  const bugs       = sprint.tasks.filter((t) => t.type === 'BUG');
  const aiDiff     = sprint.tasks.some(
    (t) => t.aiEstimatedHours && t.aiEstimatedHours > t.estimatedHours,
  );
  const totalSP    = sprint.tasks.reduce((a, t) => a + (Number(t.storyPoints) || 0), 0);
  const blocked    = sprint.tasks.filter((t) => t.status === 'BLOCKED');
  const donePct    = sprint.tasks.length
    ? Math.round(
        (sprint.tasks.filter((t) => t.status === 'DONE').length / sprint.tasks.length) * 100,
      )
    : 0;

  if (blocked.length > 0)
    tips.push({
      icon: '🚫',
      type: 'warn',
      text: `${blocked.length} tâche(s) bloquée(s) (${blocked.map((t) => t.title).join(', ')}). Résolvez les dépendances en priorité.`,
    });
  if (highRisk.length > 0)
    tips.push({
      icon: '⚠',
      type: 'warn',
      text: `${highRisk.length} tâche(s) à haut risque. Affecter des développeurs seniors et prévoir du temps tampon.`,
    });
  if (bugs.length > 1)
    tips.push({
      icon: '🐛',
      type: 'warn',
      text: `${bugs.length} bugs dans un seul sprint — envisagez une session dédiée au début pour réduire le context-switching.`,
    });
  if (aiDiff)
    tips.push({
      icon: '🤖',
      type: 'info',
      text: "Les estimations IA dépassent les estimations manuelles — elles intègrent l'intégration, les tests et la revue de code.",
    });
  if (totalSP > 30)
    tips.push({
      icon: '📦',
      type: 'warn',
      text: `${totalSP} SP dépasse la capacité typique (20–25 SP). Déplacez la tâche la moins prioritaire au sprint suivant.`,
    });
  if (computedStatus === 'in_progress')
    tips.push({
      icon: '🔄',
      type: 'info',
      text: `Sprint en cours à ${donePct}% — stand-up quotidien recommandé pour détecter les blockers.`,
    });
  if (computedStatus === 'planned')
    tips.push({
      icon: '📋',
      type: 'info',
      text: "Pré-sprint : affinez toutes les tâches lors d'un backlog grooming pour aligner les estimations.",
    });
  if (computedStatus === 'completed')
    tips.push({
      icon: '✅',
      type: 'ok',
      text: 'Sprint terminé ! Organisez une rétrospective pour capitaliser sur les bonnes pratiques.',
    });
  if (tips.length === 0)
    tips.push({
      icon: '✅',
      type: 'ok',
      text: 'Sprint équilibré. Maintenez la charge en SP et revoyez les estimations IA avant le planning poker.',
    });

  const colors = {
    warn: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
    ok:   { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
      <div style={{
        fontSize: 11, color: '#9ca3af', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
      }}>
        Bonnes pratiques
      </div>
      {tips.map((tip, i) => {
        const c = colors[tip.type];
        return (
          <div key={i} style={{
            background: c.bg, border: `0.5px solid ${c.border}`,
            borderRadius: 10, padding: '10px 14px',
            fontSize: 12, color: c.text, lineHeight: 1.6,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{tip.icon}</span>
            <span>{tip.text}</span>
          </div>
        );
      })}
    </div>
  );
}

function Section({
  icon, title, badge, children,
}: {
  icon: React.ReactNode; title: string; badge?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '0.5px solid #e5e3de', overflow: 'hidden', marginBottom: 16,
    }}>
      <div style={{
        padding: '1rem 1.25rem', borderBottom: '0.5px solid #f3f4f6',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {icon}
        <span style={{
          fontSize: 11, color: '#9ca3af', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>{title}</span>
        {badge}
      </div>
      {children}
    </div>
  );
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9ca3af' }}>
          <span style={{
            width: 10, height: 10, borderRadius: 2,
            background: item.color, display: 'inline-block',
          }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SprintEstimationPage() {
  const params    = useParams() as { id?: string };
  const projectId = params?.id;
  const router    = useRouter();

  const [sprints,        setSprints]        = useState<Sprint[]>([]);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [estimation,     setEstimation]     = useState<ProjectEstimationResult | null>(null);
  const [lastPayload,    setLastPayload]     = useState<Record<string, unknown> | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [estimating,     setEstimating]     = useState(false);
  const [estimationDone, setEstimationDone] = useState(false);
  const [expandedSprint, setExpandedSprint] = useState<number | null>(null);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      if (!projectId) return;
      setLoading(true);
      const token   = getAuthToken();
      const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL;
      try {
        const [sprintsRes, detailsRes] = await Promise.all([
          fetch(`${apiBase}/projects/${projectId}/sprints`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiBase}/projects/${projectId}/details`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (sprintsRes.ok) {
          const raw: Sprint[] = await sprintsRes.json();
          setSprints(raw.map((s) => ({
            ...s,
            complexity: s.complexity || 'Medium',
            tasks: s.tasks.map((t) => ({
              ...t,
              status:            t.status || 'TO_DO',
              estimatedHours:    Number(t.estimatedHours)    || 0,
              aiEstimatedHours:  t.aiEstimatedHours != null
                                   ? Number(t.aiEstimatedHours) || 0
                                   : undefined,
              storyPoints:       Number(t.storyPoints)       || 0,
              complexityScore:   Number(t.complexityScore)   || 0,
              riskLevel:         Number(t.riskLevel)         || 0,
            })),
          })));
        }
        if (detailsRes.ok) setProjectDetails(await detailsRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [projectId]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const sprintsWithStatus = sprints.map((s) => ({
    ...s,
    computedStatus: computeSprintStatus(s),
  }));

  const allTasks = sprintsWithStatus.flatMap((s) =>
    s.tasks.map((t) => ({
      ...t,
      sprintName:   s.name,
      sprintStatus: s.computedStatus,
    })),
  );

  const teamSize =
    (projectDetails?.project?.assignedTo?.length ?? 0) > 0
      ? projectDetails!.project.assignedTo.length
      : projectDetails?.project?.itDetails?.teamSize ?? 1;

  // ── Chart data ──────────────────────────────────────────────────────────────
  const statusChartData = (() => {
    const counts: Partial<Record<TaskStatus, number>> = {};
    allTasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name:  STATUS_STYLE[status as TaskStatus]?.label || status,
      value: count,
      color: CHART_COLORS.status[status as TaskStatus] || '#9ca3af',
    }));
  })();

  const riskChartData = [1, 2, 3, 4, 5].map((level) => ({
    name:   `Risque ${level}`,
    tâches: allTasks.filter((t) => t.riskLevel === level).length,
    fill:   CHART_COLORS.risk[level - 1],
  }));

  const sortedSprints = [...sprintsWithStatus].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const velocityData = sortedSprints.map((s) => {
    const planned  = s.tasks.reduce((a, t) => a + (Number(t.storyPoints) || 0), 0);
    const realised = s.tasks
      .filter((t) => t.status === 'DONE')
      .reduce((a, t) => a + (Number(t.storyPoints) || 0), 0);
    return {
      name:    s.name.replace('Sprint ', 'S'),
      Prévu:   planned,
      Réalisé: s.computedStatus === 'planned' ? null : realised,
    };
  });

  let cumTotal     = 0;
  let cumCompleted = 0;
  const burnUpData = sortedSprints.map((sprint) => {
    const sprintPoints = sprint.tasks.reduce((s, t) => s + (Number(t.storyPoints) || 0), 0);
    cumTotal += sprintPoints;
    if (sprint.computedStatus === 'completed') {
      cumCompleted += sprint.tasks
        .filter((t) => t.status === 'DONE')
        .reduce((s, t) => s + (Number(t.storyPoints) || 0), 0);
    }
    return {
      name:    sprint.name,
      date:    new Date(sprint.endDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      Prévu:   cumTotal,
      Réalisé: sprint.computedStatus === 'planned' ? null : cumCompleted,
    };
  });

  const costChartData = estimation
    ? [
        { name: "Main d'œuvre", value: estimation.manpowerCost, color: CHART_COLORS.cost[0] },
        { name: 'Infrastructure', value: estimation.infraCost,  color: CHART_COLORS.cost[1] },
      ]
    : [];

  // ── Run estimation ──────────────────────────────────────────────────────────
  const runEstimation = async () => {
    setEstimating(true);
    setEstimationDone(false);

    const hoursPerDay = 8;

    const totalHours = allTasks.reduce(
      (sum, t) => sum + (Number(t.aiEstimatedHours) || Number(t.estimatedHours) || 0),
      0,
    );
    const totalDays    = totalHours / hoursPerDay / teamSize;
    const dailyRate    = 350;
    const manpowerCost = Math.round(Math.ceil(totalDays) * teamSize * dailyRate);
    const infraCost    = Math.round(manpowerCost * 0.18);

    const startDate        = projectDetails?.project?.startDate
      ? new Date(projectDetails.project.startDate)
      : new Date();
    const estimatedEndDate = addWorkingDays(startDate, totalDays);

    let projectCost: number           = 0;
    let costSource: 'ai' | 'fallback' = 'fallback';

    if (projectDetails) {
      const { cost, payload } = await estimateProjectCost(
        projectDetails,
        sprints,
        totalDays,
      );
      setLastPayload(payload);

      if (cost && cost > 0) {
        projectCost = cost;
        costSource  = 'ai';
      } else {
        projectCost = manpowerCost + infraCost;
        costSource  = 'fallback';
      }
    }

    setEstimation({
      totalHours,
      totalDays,
      estimatedEndDate,
      dailyRate,
      manpowerCost,
      infraCost,
      totalCost:   manpowerCost + infraCost,
      teamSize,
      hoursPerDay,
      projectCost,
      costSource,
    });
    setEstimating(false);
    setEstimationDone(true);
  };

  // ── Task timelines ──────────────────────────────────────────────────────────
  const generateTaskTimeline = (): TaskTimeline[] => {
    const projectStart = projectDetails?.project?.startDate
      ? new Date(projectDetails.project.startDate)
      : new Date();
    const timelines: TaskTimeline[] = [];
    let cumulativeHours = 0;

    allTasks.forEach((task, idx) => {
      const taskHours = task.aiEstimatedHours || task.estimatedHours || 0;
      const taskDays  = taskHours / 8 / teamSize;
      const startDate = addWorkingDays(projectStart, cumulativeHours / 8 / teamSize);
      const endDate   = addWorkingDays(startDate, taskDays);
      const today     = new Date();

      let progress = 0;
      if (task.status === 'DONE')           progress = 100;
      else if (task.status === 'IN_REVIEW') progress = 80;
      else if (task.status === 'IN_PROGRESS') {
        const totalMs   = endDate.getTime() - startDate.getTime();
        const elapsedMs = today.getTime()   - startDate.getTime();
        progress = Math.min(75, Math.max(10, Math.round((elapsedMs / totalMs) * 100)));
      } else if (task.status === 'BLOCKED') {
        progress = 15;
      }

      timelines.push({
        taskId:         `${task.id ?? idx}`,
        taskTitle:      task.title,
        startDate,
        endDate,
        estimatedHours: taskHours,
        progress,
        status:         task.status,
      });
      cumulativeHours += taskHours;
    });
    return timelines;
  };

  const taskTimelines = estimationDone ? generateTaskTimeline() : [];

  const sectionBadge = (count: number) => (
    <span style={{
      background: '#f3f4f6', color: '#6b7280',
      borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
    }}>{count}</span>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f7f4',
      fontFamily: '"DM Sans", "Segoe UI", sans-serif',
      color: '#1a1a1a',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#9ca3af', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 500, marginBottom: 20,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            <ChevronLeft size={16} /> Retour
          </button>

          <div style={{
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: '#111',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Cpu size={18} color="#fff" />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#111' }}>
                  Estimation du Projet
                </h1>
              </div>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: 13 }}>
                {allTasks.length} tâches · {sprints.length} sprints · {teamSize} membres
              </p>
            </div>

            <button
              onClick={runEstimation}
              disabled={estimating || loading || allTasks.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 10,
                background: estimating ? '#e5e7eb' : '#111',
                border: 'none',
                color: estimating ? '#9ca3af' : '#fff',
                fontSize: 14, fontWeight: 600,
                cursor: estimating ? 'not-allowed' : 'pointer',
                transition: 'opacity .15s',
              }}
            >
              {estimating ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Calcul…</>
              ) : estimationDone ? (
                <><CheckCircle2 size={16} /> Recalculer</>
              ) : (
                <><Zap size={16} /> Lancer l'estimation</>
              )}
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader2 size={32} color="#111" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#9ca3af', marginTop: 12, fontSize: 14 }}>Chargement…</p>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Row 1: Status pie + Risk bar ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

              <div style={{
                background: '#fff', borderRadius: 14,
                border: '0.5px solid #e5e3de', padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <PieChart size={15} color="#9ca3af" />
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Statuts des tâches
                  </span>
                </div>
                <ChartLegend items={statusChartData.map((d) => ({ label: `${d.name} (${d.value})`, color: d.color }))} />
                <ResponsiveContainer width="100%" height={180}>
                  <RePieChart>
                    <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    {/* ✅ FIX: cast value via toNum() helper to avoid ValueType mismatch */}
                    <Tooltip
                      contentStyle={ChartTooltipStyle}
                      formatter={(value, name) => [`${toNum(value)} tâches`, String(name)]}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                background: '#fff', borderRadius: 14,
                border: '0.5px solid #e5e3de', padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <AlertTriangle size={15} color="#9ca3af" />
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Distribution des risques
                  </span>
                </div>
                <ChartLegend items={[
                  { label: 'Faible (1-2)', color: '#10b981' },
                  { label: 'Moyen (3)',    color: '#f59e0b' },
                  { label: 'Élevé (4-5)', color: '#ef4444' },
                ]} />
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={riskChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    {/* ✅ FIX: cast value via toNum() helper */}
                    <Tooltip
                      contentStyle={ChartTooltipStyle}
                      formatter={(value) => [`${toNum(value)} tâche(s)`, 'Tâches']}
                    />
                    <Bar dataKey="tâches" radius={[4, 4, 0, 0]}>
                      {riskChartData.map((entry, index) => (
                        <Cell key={`risk-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Row 2: Velocity + Burn-up ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

              <div style={{
                background: '#fff', borderRadius: 14,
                border: '0.5px solid #e5e3de', padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Activity size={15} color="#9ca3af" />
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Vélocité par sprint (SP)
                  </span>
                </div>
                <ChartLegend items={[
                  { label: 'Prévu',   color: '#d1d5db' },
                  { label: 'Réalisé', color: '#4f46e5' },
                ]} />
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={velocityData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                    {/* ✅ FIX: cast value via toNum() helper */}
                    <Tooltip
                      contentStyle={ChartTooltipStyle}
                      formatter={(value, name) => [`${toNum(value)} SP`, String(name)]}
                    />
                    <Bar dataKey="Prévu"   fill="#e5e7eb" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Réalisé" fill="#4f46e5" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                background: '#fff', borderRadius: 14,
                border: '0.5px solid #e5e3de', padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <TrendingUp size={15} color="#9ca3af" />
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Avancement global (Burn-up)
                  </span>
                </div>
                <ChartLegend items={[
                  { label: 'Prévu',   color: '#d1d5db' },
                  { label: 'Réalisé', color: '#4f46e5' },
                ]} />
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={burnUpData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="date" stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={ChartTooltipStyle} />
                    <Line type="monotone" dataKey="Prévu" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="5 4" dot={{ r: 3, fill: '#d1d5db' }} legendType="none" />
                    <Line type="monotone" dataKey="Réalisé" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} connectNulls={false} legendType="none" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── KPIs + cost (after estimation) ── */}
            {estimationDone && estimation && (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: 12, marginBottom: 16,
                }}>
                  <KpiCard
                    icon={<Clock size={18} color="#4f46e5" />}
                    label="Total heures"
                    value={formatHours(estimation.totalHours)}
                    sub={`${allTasks.length} tâches`}
                    accent="#4f46e5"
                  />
                  <KpiCard
                    icon={<Calendar size={18} color="#0891b2" />}
                    label="Durée"
                    value={`${Math.ceil(estimation.totalDays)} j`}
                    sub={`${estimation.teamSize} dev × ${estimation.hoursPerDay}h/j`}
                    accent="#0891b2"
                  />
                  <KpiCard
                    icon={<Target size={18} color="#059669" />}
                    label="Date de fin"
                    value={formatDateShort(estimation.estimatedEndDate)}
                    sub={formatDate(estimation.estimatedEndDate).split(',')[0]}
                    accent="#059669"
                  />
                  <KpiCard
                    icon={<DollarSign size={18} color="#d97706" />}
                    label={estimation.costSource === 'ai' ? 'Coût projet (IA)' : 'Coût projet (estimé)'}
                    value={`${estimation.projectCost.toLocaleString('fr-FR')} dt`}
                    sub={estimation.costSource === 'ai' ? '✓ Modèle XGBoost' : 'Calcul manpower (fallback)'}
                    accent="#d97706"
                  />
                </div>

                {/* Row 3: Cost pie + Gantt */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

                  <div style={{
                    background: '#fff', borderRadius: 14,
                    border: '0.5px solid #e5e3de', padding: '1.25rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <DollarSign size={15} color="#9ca3af" />
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Répartition du coût
                      </span>
                    </div>
                    <ChartLegend items={costChartData.map((d) => ({
                      label: `${d.name} — ${d.value.toLocaleString('fr-FR')} dt`,
                      color: d.color,
                    }))} />
                    <ResponsiveContainer width="100%" height={180}>
                      <RePieChart>
                        <Pie data={costChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                          {costChartData.map((entry, index) => (
                            <Cell key={`cost-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        {/* ✅ FIX: cast value via toNum() helper */}
                        <Tooltip
                          contentStyle={ChartTooltipStyle}
                          formatter={(value, name) => [`${toNum(value).toLocaleString('fr-FR')} dt`, String(name)]}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{
                    background: '#fff', borderRadius: 14,
                    border: '0.5px solid #e5e3de', padding: '1.25rem',
                    overflowY: 'auto', maxHeight: 340,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                      <BarChart3 size={15} color="#9ca3af" />
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Planning des tâches
                      </span>
                    </div>
                    {taskTimelines.map((tt) => {
                      const barColor =
                        tt.status === 'DONE'        ? '#10b981' :
                        tt.status === 'IN_PROGRESS' ? '#4f46e5' :
                        tt.status === 'IN_REVIEW'   ? '#f59e0b' :
                        tt.status === 'BLOCKED'     ? '#ef4444' : '#e5e7eb';
                      return (
                        <div key={tt.taskId} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{
                              fontSize: 11, color: '#374151',
                              maxWidth: 140, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{tt.taskTitle}</span>
                            <span style={{ fontSize: 10, color: '#9ca3af' }}>
                              {formatDateShort(tt.startDate)} → {formatDateShort(tt.endDate)}
                            </span>
                          </div>
                          <div style={{ height: 16, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                              width: `${tt.progress}%`, height: '100%',
                              background: barColor, borderRadius: 4,
                              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                              paddingRight: 4, transition: 'width .3s ease',
                            }}>
                              {tt.progress > 10 && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>
                                  {tt.progress}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cost detail table */}
                <div style={{
                  background: '#fff', borderRadius: 14,
                  border: '0.5px solid #e5e3de', padding: '1.25rem',
                  marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <DollarSign size={15} color="#9ca3af" />
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Détail du coût
                    </span>
                  </div>

                  {estimation.costSource === 'fallback' && (
                    <div style={{
                      marginBottom: 10, padding: '8px 12px',
                      background: '#fffbeb', border: '0.5px solid #fde68a',
                      borderRadius: 8, fontSize: 12, color: '#92400e',
                      display: 'flex', gap: 6, alignItems: 'center',
                    }}>
                      <AlertTriangle size={13} color="#f59e0b" />
                      Le modèle XGBoost a retourné 0. Coût calculé par manpower (jours × équipe × taux).
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    {[
                      { label: 'Heures totales',            value: formatHours(estimation.totalHours) },
                      { label: 'Durée (jours)',              value: `${Math.ceil(estimation.totalDays)} j` },
                      { label: 'Équipe',                    value: `${estimation.teamSize} dev` },
                      { label: 'Taux journalier',           value: `${estimation.dailyRate} dt/dev/j` },
                      { label: "Coût main d'œuvre",         value: `${estimation.manpowerCost.toLocaleString('fr-FR')} dt` },
                      { label: 'Coût infrastructure (~18%)', value: `${estimation.infraCost.toLocaleString('fr-FR')} dt` },
                      {
                        label: estimation.costSource === 'ai' ? 'Coût projet (XGBoost ✓)' : 'Coût projet (manpower)',
                        value: `${estimation.projectCost.toLocaleString('fr-FR')} dt`,
                      },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#f8f7f4', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* XGBoost payload inspector */}
                {lastPayload && (
                  <div style={{
                    background: '#fff', borderRadius: 14,
                    border: '0.5px solid #e5e3de', padding: '1.25rem',
                    marginBottom: 16,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <GitBranch size={15} color="#9ca3af" />
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Payload envoyé au modèle XGBoost
                      </span>
                    </div>
                    <pre style={{
                      margin: 0, padding: '12px 14px',
                      background: '#f8f7f4', borderRadius: 10,
                      fontSize: 12, lineHeight: 1.7, color: '#374151',
                      overflow: 'auto', maxHeight: 280,
                    }}>
                      {JSON.stringify(lastPayload, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}

            {/* ── Sprints list ── */}
            <div style={{
              background: '#fff', borderRadius: 14,
              border: '0.5px solid #e5e3de', overflow: 'hidden', marginBottom: 16,
            }}>
              <div style={{
                padding: '1rem 1.25rem', borderBottom: '0.5px solid #f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={15} color="#9ca3af" />
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Sprints
                  </span>
                  {sectionBadge(sprintsWithStatus.length)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['completed', 'in_progress', 'planned'] as SprintStatus[]).map((st) => {
                    const count = sprintsWithStatus.filter((s) => s.computedStatus === st).length;
                    if (!count) return null;
                    return <SprintStatusBadge key={st} status={st} />;
                  })}
                </div>
              </div>

              {sprintsWithStatus.map((sprint, si) => {
                const isOpen    = expandedSprint === sprint.id;
                const doneTasks = sprint.tasks.filter((t) => t.status === 'DONE').length;
                const pct       = sprint.tasks.length
                  ? Math.round((doneTasks / sprint.tasks.length) * 100)
                  : 0;
                const totalSP   = sprint.tasks.reduce((a, t) => a + (Number(t.storyPoints) || 0), 0);
                const totalH    = sprint.tasks.reduce(
                  (a, t) => a + (Number(t.aiEstimatedHours) || Number(t.estimatedHours) || 0), 0,
                );
                const barColor  =
                  sprint.computedStatus === 'completed'   ? '#10b981' :
                  sprint.computedStatus === 'in_progress' ? '#4f46e5' : '#e5e7eb';

                return (
                  <div key={sprint.id ?? si} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                    <div
                      onClick={() => setExpandedSprint(isOpen ? null : (sprint.id ?? si))}
                      style={{
                        padding: '1rem 1.25rem', cursor: 'pointer',
                        background: isOpen ? '#fafaf8' : 'transparent',
                        transition: 'background .15s',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}
                      onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = '#fafaf8'; }}
                      onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{sprint.name}</span>
                          <SprintStatusBadge status={sprint.computedStatus} />
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            {formatDateShort(new Date(sprint.startDate))} — {formatDateShort(new Date(sprint.endDate))}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 7px',
                            borderRadius: 5, background: '#f3f4f6', color: '#6b7280',
                          }}>
                            Complexité : {sprint.complexity}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            flex: 1, height: 4, background: '#f3f4f6',
                            borderRadius: 2, overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${pct}%`, height: '100%',
                              background: barColor, borderRadius: 2,
                              transition: 'width .4s',
                            }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                            {doneTasks}/{sprint.tasks.length} tâches · {totalSP} SP · {formatHours(totalH)}
                          </span>
                        </div>
                      </div>
                      {isOpen
                        ? <ChevronUp size={16} color="#9ca3af" />
                        : <ChevronDown size={16} color="#9ca3af" />}
                    </div>

                    {isOpen && (
                      <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '0.5px solid #f3f4f6' }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                          gap: 8, margin: '1rem 0',
                        }}>
                          {[
                            { label: 'Tâches',       value: sprint.tasks.length },
                            { label: 'Terminées',    value: doneTasks },
                            { label: 'En cours',     value: sprint.tasks.filter((t) => t.status === 'IN_PROGRESS').length },
                            { label: 'Bloquées',     value: sprint.tasks.filter((t) => t.status === 'BLOCKED').length },
                            { label: 'Story points', value: totalSP },
                            { label: 'Heures est.',  value: formatHours(sprint.tasks.reduce((a,t) => a + (Number(t.aiEstimatedHours) || Number(t.estimatedHours) || 0), 0)) },
                            { label: 'Risque élevé', value: sprint.tasks.filter((t) => t.riskLevel >= 3).length },
                            { label: 'Avancement',   value: `${pct}%` },
                          ].map(({ label, value }) => (
                            <div key={label} style={{
                              background: '#f8f7f4', borderRadius: 8,
                              padding: '8px 10px', textAlign: 'center',
                            }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{value}</div>
                              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{label}</div>
                            </div>
                          ))}
                        </div>

                        <div style={{ marginBottom: 4 }}>
                          <div style={{
                            fontSize: 11, color: '#9ca3af', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
                          }}>
                            Tâches
                          </div>
                          {sprint.tasks.map((task, ti) => {
                            const ts = TYPE_STYLE[task.type] || TYPE_STYLE.TASK;
                            const ps = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.MEDIUM;
                            const h  = task.aiEstimatedHours || task.estimatedHours || 0;
                            const aiDelta =
                              task.aiEstimatedHours && task.aiEstimatedHours !== task.estimatedHours
                                ? task.aiEstimatedHours - task.estimatedHours
                                : 0;

                            return (
                              <div
                                key={task.id ?? ti}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '8px 0',
                                  borderBottom: ti < sprint.tasks.length - 1
                                    ? '0.5px solid #f3f4f6' : 'none',
                                  opacity: task.status === 'DONE' ? 0.6 : 1,
                                  transition: 'opacity .2s',
                                }}
                              >
                                {task.status === 'DONE'
                                  ? <CheckCircle2 size={15} color="#10b981" />
                                  : task.status === 'BLOCKED'
                                    ? <AlertTriangle size={15} color="#ef4444" />
                                    : <Circle size={15} color="#d1d5db" />
                                }
                                <span style={{
                                  background: ts.bg, color: ts.color,
                                  border: `0.5px solid ${ts.border}`,
                                  fontSize: 10, fontWeight: 600,
                                  padding: '2px 7px', borderRadius: 5,
                                  flexShrink: 0, minWidth: 64, textAlign: 'center',
                                }}>
                                  {task.type}
                                </span>
                                <TaskStatusBadge status={task.status} />
                                <span style={{
                                  fontSize: 13, color: '#111', flex: 1,
                                  textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
                                }}>
                                  {task.title}
                                </span>
                                <span
                                  style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: ps.dot, flexShrink: 0,
                                  }}
                                  title={`Priorité: ${task.priority}`}
                                />
                                <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  {formatHours(task.estimatedHours)}
                                  {task.aiEstimatedHours && task.aiEstimatedHours !== task.estimatedHours && (
                                    <span style={{ color: '#4f46e5', marginLeft: 4, fontSize: 11 }}>
                                      → {formatHours(task.aiEstimatedHours)}
                                      {aiDelta > 0
                                        ? <span style={{ color: '#d97706' }}> +{aiDelta}h</span>
                                        : <span style={{ color: '#10b981' }}> {aiDelta}h</span>
                                      }
                                    </span>
                                  )}
                                </span>
                                {task.riskLevel >= 3 && (
                                 <span title={`Risque: ${task.riskLevel}/5`}>
  <AlertTriangle size={13} color="#f59e0b" />
</span>
                                )}
                                <span style={{
                                  background: '#f3f4f6', color: '#6b7280',
                                  fontSize: 10, fontWeight: 600,
                                  padding: '2px 6px', borderRadius: 20, flexShrink: 0,
                                }}>
                                  {task.storyPoints} SP
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <BestPractices sprint={sprint} computedStatus={sprint.computedStatus} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── All tasks table ── */}
            <div style={{
              background: '#fff', borderRadius: 14,
              border: '0.5px solid #e5e3de', overflow: 'hidden',
            }}>
              <div style={{
                padding: '1rem 1.25rem', borderBottom: '0.5px solid #f3f4f6',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <BarChart3 size={15} color="#9ca3af" />
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Toutes les tâches
                </span>
                {sectionBadge(allTasks.length)}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>
                  {allTasks.filter((t) => t.status === 'DONE').length} terminées ·{' '}
                  {allTasks.filter((t) => t.status === 'BLOCKED').length} bloquées
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#fafaf8' }}>
                      {['', 'Tâche', 'Sprint', 'Type', 'Statut', 'Priorité', 'Heures est.', 'Heures IA', 'SP', 'Risque'].map((h) => (
                        <th key={h} style={{
                          padding: '9px 14px', textAlign: 'left',
                          color: '#9ca3af', fontWeight: 600, fontSize: 11,
                          textTransform: 'uppercase', letterSpacing: 0.4,
                          borderBottom: '0.5px solid #f3f4f6', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allTasks.map((task, idx) => {
                      const ts = TYPE_STYLE[task.type] || TYPE_STYLE.TASK;
                      const ps = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.MEDIUM;
                      return (
                        <tr
                          key={`${task.id ?? idx}`}
                          style={{ borderBottom: '0.5px solid #f3f4f6', opacity: task.status === 'DONE' ? 0.55 : 1 }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fafaf8')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '9px 14px' }}>
                            {task.status === 'DONE'
                              ? <CheckCircle2 size={15} color="#10b981" />
                              : task.status === 'BLOCKED'
                                ? <AlertTriangle size={14} color="#ef4444" />
                                : <Circle size={15} color="#d1d5db" />
                            }
                          </td>
                          <td style={{
                            padding: '9px 14px', fontWeight: 500,
                            color: task.status === 'DONE' ? '#9ca3af' : '#111',
                            textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
                          }}>{task.title}</td>
                          <td style={{ padding: '9px 14px', color: '#9ca3af', fontSize: 12 }}>{task.sprintName}</td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{
                              background: ts.bg, color: ts.color,
                              border: `0.5px solid ${ts.border}`,
                              borderRadius: 5, padding: '2px 7px',
                              fontSize: 10, fontWeight: 600,
                            }}>{task.type}</span>
                          </td>
                          <td style={{ padding: '9px 14px' }}>
                            <TaskStatusBadge status={task.status} />
                          </td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: ps.color }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ps.dot }} />
                              {task.priority}
                            </span>
                          </td>
                          <td style={{ padding: '9px 14px', color: '#6b7280', fontSize: 12 }}>
                            {formatHours(task.estimatedHours)}
                          </td>
                          <td style={{ padding: '9px 14px', color: '#4f46e5', fontWeight: 600, fontSize: 12 }}>
                            {task.aiEstimatedHours ? formatHours(task.aiEstimatedHours) : '—'}
                          </td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{
                              background: '#f3f4f6', color: '#6b7280',
                              borderRadius: 20, padding: '2px 7px',
                              fontSize: 11, fontWeight: 600,
                            }}>{task.storyPoints}</span>
                          </td>
                          <td style={{ padding: '9px 14px' }}>
                            {task.riskLevel >= 3
                              ? <AlertTriangle size={14} color="#f59e0b" />
                              : <CheckCircle2  size={14} color="#10b981" />
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}