'use client';
// ─── CallCenterDashboardPage.tsx ──────────────────────────────────────────────
// Dashboard en lecture (données réelles sprints/tâches/projet) · Design Blue/Indigo

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Clock, Users, Target, DollarSign,
  CheckCircle, AlertTriangle, AlertCircle, BarChart2,
  Calendar, ChevronRight, Activity, PhoneCall,
  ListTodo, Cpu, Smile, Headset, Gauge,
} from 'lucide-react';

// ─── Types (locales, alignées sur le domaine Call Center) ────────────────────
interface TaskCallCenter {
  id?: number;
  title: string;
  status: string;
  priority: string;
  type: string;
  estimatedHours?: number;
  aiEstimatedHours?: number;
  delayHours?: number;
  assignedTo?: unknown;
  scheduledStartDate?: string | null;
  scheduledEndDate?: string | null;
  completedAt?: string | null;
}

interface SprintCallCenter {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  priority?: string;
  complexity?: string;
  targetAgents?: number;
  expectedCallVolume?: number;
  targetConversionRate?: number;
  budgetAllocated?: number;
  qualityScoreTarget?: number;
  trainingContent?: string;
  scriptTemplates?: string;
  goals?: string;
  tasks: TaskCallCenter[];
}

interface ProjectMember {
  id: number;
  fullname?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  level?: string;
}

interface CcProjectDetails {
  id?: number;
  CSAT?: number;
  FCR?: number;
  numberOfCallsPerDay?: number;
  averageHandleTimeSec?: number;
  slaTargetSeconds?: number;
  risksScore?: number;
  dependencies?: string;
  callTypes?: string;
  numberOfAgents?: number;
  estimatedBudget?: number;
  estimatedDurationDays?: number;
  teamSize?: number;
}

// ─── Design tokens (cohérent avec CallCenterSprintsPage : blue / indigo) ─────
const C = {
  blue:    '#2563eb',
  blueL:   '#bfdbfe',
  blueD:   '#1d4ed8',
  indigo:  '#6366f1',
  indigoL: '#c7d2fe',
  slate:   '#64748b',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  violet:  '#8b5cf6',
  emerald: '#10b981',
};

const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL ?? 'http://localhost:3001/api/v1';
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeNum = (v: unknown) => Number(v ?? 0) || 0;
const fmt = (n: number) => n.toLocaleString('fr-FR');
const pct1 = (n: number) => `${(n * 100).toFixed(0)}%`;

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }); } catch { return '—'; }
};

const diffDays = (a: string, b: string) => {
  try { return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000); } catch { return 0; }
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const Tip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-blue-100 rounded-xl shadow-xl px-4 py-3 text-xs min-w-[140px]">
      <p className="font-bold text-slate-600 mb-2 border-b border-slate-100 pb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-slate-400">{p.name}</span>
          </span>
          <span className="font-bold text-slate-700">
            {typeof p.value === 'number' ? fmt(Math.round(p.value)) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── KPI card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  icon: React.ReactNode; label: string; value: string; sub: string;
  progress?: number; color: 'blue' | 'indigo' | 'amber' | 'rose' | 'violet' | 'emerald';
}> = ({ icon, label, value, sub, progress, color }) => {
  const cfg = {
    blue:    { bg: 'bg-blue-50    border-blue-100',    icon: 'bg-blue-100    text-blue-600',    bar: C.blue,    val: 'text-blue-700'    },
    indigo:  { bg: 'bg-indigo-50  border-indigo-100',  icon: 'bg-indigo-100  text-indigo-600',  bar: C.indigo,  val: 'text-indigo-700'  },
    amber:   { bg: 'bg-amber-50   border-amber-100',   icon: 'bg-amber-100   text-amber-600',   bar: C.amber,   val: 'text-amber-700'   },
    rose:    { bg: 'bg-rose-50    border-rose-100',    icon: 'bg-rose-100    text-rose-600',    bar: C.rose,    val: 'text-rose-700'    },
    violet:  { bg: 'bg-violet-50  border-violet-100',  icon: 'bg-violet-100  text-violet-600',  bar: C.violet,  val: 'text-violet-700'  },
    emerald: { bg: 'bg-emerald-50 border-emerald-100', icon: 'bg-emerald-100 text-emerald-600', bar: C.emerald, val: 'text-emerald-700' },
  }[color];

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${cfg.bg}`}>
      <div className="flex items-start justify-between">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.icon}`}>{icon}</span>
        {progress !== undefined && (
          <span className="text-xs font-bold" style={{ color: cfg.bar }}>{progress}%</span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-2xl font-extrabold leading-none ${cfg.val}`}>{value}</p>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{sub}</p>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 rounded-full bg-white/80 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, progress)}%`, background: cfg.bar }}
          />
        </div>
      )}
    </div>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────
const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-4">
      <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600">{icon}</span>
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-blue-100 to-transparent" />
    </div>
    {children}
  </div>
);

// ─── Chart card ───────────────────────────────────────────────────────────────
const ChartCard: React.FC<{ title: string; sub?: string; children: React.ReactNode }> = ({ title, sub, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 hover:shadow-md hover:border-blue-200 transition-all">
    <p className="font-bold text-slate-700 text-sm">{title}</p>
    {sub && <p className="text-xs text-slate-400 mb-4">{sub}</p>}
    {!sub && <div className="mb-4" />}
    {children}
  </div>
);

// ─── Sprint row ───────────────────────────────────────────────────────────────
const SprintRow: React.FC<{ sprint: SprintCallCenter; onClick: () => void; selected: boolean }> = ({ sprint, onClick, selected }) => {
  const tasks      = sprint.tasks ?? [];
  const total      = tasks.length;
  const done       = tasks.filter((t) => t.status === 'DONE').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const blocked    = tasks.filter((t) => t.status === 'BLOCKED').length;
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0;
  const budget     = safeNum(sprint.budgetAllocated);
  const delayHours = tasks.reduce((s, t) => s + safeNum(t.delayHours), 0);
  const durationD  = diffDays(sprint.startDate, sprint.endDate);

  const isActive   = sprint.status === 'active';
  const isDone     = sprint.status === 'completed';
  const isUpcoming = sprint.status === 'planned';

  const barColor = isDone ? C.emerald : blocked > 0 ? C.rose : isActive ? C.blue : C.slate;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-2xl border p-4 sm:p-5 transition-all duration-200
        ${selected
          ? 'border-blue-300 bg-blue-50/60 shadow-[0_0_0_3px_rgba(37,99,235,0.12)] shadow-md'
          : 'border-slate-200/80 bg-white hover:border-blue-200 hover:shadow-sm'
        }
        ${isUpcoming ? 'opacity-70' : ''}
      `}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isDone ? 'bg-emerald-100' : isActive ? 'bg-blue-100' : 'bg-slate-100'
          }`}>
            {isDone
              ? <CheckCircle size={15} className="text-emerald-600" />
              : isActive
              ? <Activity size={15} className="text-blue-600" />
              : <Clock size={15} className="text-slate-400" />}
          </span>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{sprint.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {fmtDate(sprint.startDate)} → {fmtDate(sprint.endDate)}
              {durationD > 0 && <span className="ml-1 text-slate-300">({durationD}j)</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Status */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isDone     ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            isActive   ? 'bg-blue-50 text-blue-700 border-blue-200' :
                         'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            {isDone ? 'Terminé' : isActive ? 'En cours' : 'Planifié'}
          </span>

          {/* Delay */}
          {delayHours > 0 && (
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
              <AlertTriangle size={10} />+{delayHours.toFixed(0)}h
            </span>
          )}

          {/* Blocked */}
          {blocked > 0 && (
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              {blocked} bloquée{blocked > 1 ? 's' : ''}
            </span>
          )}

          {/* Agents */}
          {safeNum(sprint.targetAgents) > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-1">
              <Headset size={9} />{sprint.targetAgents} agents
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="font-bold" style={{ color: barColor }}>{pct}%</span>
        <span>{done}/{total} tâches</span>
        {inProgress > 0 && <span className="text-blue-500">{inProgress} en cours</span>}
        {budget > 0 && (
          <span className="flex items-center gap-1">
            <DollarSign size={10} />{fmt(budget)} TND alloué
          </span>
        )}
        {safeNum(sprint.expectedCallVolume) > 0 && (
          <span className="flex items-center gap-1"><PhoneCall size={10} />{fmt(safeNum(sprint.expectedCallVolume))} appels prévus</span>
        )}
        {safeNum(sprint.qualityScoreTarget) > 0 && (
          <span className="flex items-center gap-1"><Gauge size={10} />Qualité cible {sprint.qualityScoreTarget}%</span>
        )}
      </div>
    </button>
  );
};

// ─── Task list for selected sprint ───────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  TO_DO:       { label: 'À faire',     dot: 'bg-slate-400', bg: 'bg-slate-50',  text: 'text-slate-600'  },
  IN_PROGRESS: { label: 'En cours',    dot: 'bg-blue-500',  bg: 'bg-blue-50',   text: 'text-blue-700'   },
  IN_REVIEW:   { label: 'Révision',    dot: 'bg-amber-400', bg: 'bg-amber-50',  text: 'text-amber-700'  },
  DONE:        { label: 'Terminé',     dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  BLOCKED:     { label: 'Bloqué',      dot: 'bg-rose-500',  bg: 'bg-rose-50',   text: 'text-rose-700'   },
};

const PRIORITY_CFG: Record<string, { label: string; cls: string }> = {
  LOW:      { label: 'Basse',    cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  MEDIUM:   { label: 'Moyenne',  cls: 'text-blue-700 bg-blue-50 border-blue-200'   },
  HIGH:     { label: 'Haute',    cls: 'text-orange-600 bg-orange-50 border-orange-200' },
  CRITICAL: { label: 'Critique', cls: 'text-rose-600 bg-rose-50 border-rose-200'   },
};

const TaskRow: React.FC<{ task: TaskCallCenter; members: ProjectMember[] }> = ({ task, members }) => {
  const st = STATUS_CFG[task.status] ?? STATUS_CFG.TO_DO;
  const pr = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.MEDIUM;
  const hours = safeNum(task.aiEstimatedHours ?? task.estimatedHours);

  const getMemberName = (val: unknown): string => {
    if (!val) return '';
    if (typeof val === 'object' && val !== null && 'id' in val) {
      const obj = val as { id: number; fullname?: string };
      const found = members.find((m) => m.id === obj.id);
      return found ? (found.fullname ?? found.name ?? `Membre #${obj.id}`) : obj.fullname ?? `#${obj.id}`;
    }
    const found = members.find((m) => m.id === Number(val));
    return found ? (found.fullname ?? found.name ?? '') : '';
  };

  return (
    <div className={`
      rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3
      ${task.status === 'BLOCKED' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200/80 bg-white'}
      hover:border-blue-200 transition-colors
    `}>
      {/* Status dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 mt-1 sm:mt-0 ${st.dot}`} />

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${task.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pr.cls}`}>{pr.label}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
          {task.type && (
            <span className="text-[10px] text-slate-400">{task.type.replace(/_/g, ' ')}</span>
          )}
        </div>
      </div>

      {/* Right meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 shrink-0">
        {hours > 0 && (
          <span className="flex items-center gap-1 text-violet-500 font-semibold">
            <Cpu size={10} />{hours}h
          </span>
        )}
        {task.delayHours !== undefined && task.delayHours !== 0 && (
          <span className={`font-bold ${task.delayHours > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {task.delayHours > 0 ? `+${task.delayHours}h` : `-${Math.abs(task.delayHours)}h`}
          </span>
        )}
        {getMemberName(task.assignedTo) && (
          <span className="flex items-center gap-1">
            <Users size={10} />{getMemberName(task.assignedTo)}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Alert ────────────────────────────────────────────────────────────────────
const Alert: React.FC<{ type: 'danger' | 'warn' | 'ok'; title: string; desc: string }> = ({ type, title, desc }) => {
  const cfg = {
    danger: { bg: 'bg-rose-50 border-rose-200',     icon: <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />,   text: 'text-rose-800'   },
    warn:   { bg: 'bg-amber-50 border-amber-200',   icon: <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />, text: 'text-amber-800' },
    ok:     { bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />, text: 'text-emerald-800' },
  }[type];

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${cfg.bg}`}>
      {cfg.icon}
      <div>
        <p className={`text-sm font-bold ${cfg.text}`}>{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const CallCenterDashboardPage: React.FC = () => {
  const params    = useParams() as { id?: string };
  const projectId = params?.id;

  const [sprints,     setSprints]     = useState<SprintCallCenter[]>([]);
  const [members,     setMembers]     = useState<ProjectMember[]>([]);
  const [ccDetails,   setCcDetails]   = useState<CcProjectDetails | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<'burndown' | 'appels' | 'qualite' | 'budget' | 'tasks'>('burndown');
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const detailsRes = await fetch(`${apiBase}/projects/${projectId}/details`, { headers });
      if (!detailsRes.ok) throw new Error('Impossible de charger le projet');
      const details = await detailsRes.json();
      setMembers(details.project?.assignedTo ?? []);
      const ccDomain = details.domainDetails ?? null;
      setCcDetails(ccDomain);
      const ccId: number | undefined = ccDomain?.id;
      if (!ccId) throw new Error('Sous-projet Call Center introuvable');
      const sprintsRes = await fetch(`${apiBase}/projects/${ccId}/callcenter-sprints`, { headers });
      if (!sprintsRes.ok) throw new Error('Impossible de charger les sprints');
      const data = await sprintsRes.json();
      const list: SprintCallCenter[] = Array.isArray(data) ? data : [];
      setSprints(list);
      if (list.length > 0) setSelectedSprintId(list.find((s) => s.status === 'active')?.id ?? list[0].id ?? null);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const allTasks     = useMemo(() => sprints.flatMap((s) => s.tasks ?? []), [sprints]);
  const totalTasks   = allTasks.length;
  const doneTasks    = allTasks.filter((t) => t.status === 'DONE').length;
  const blockedTasks = allTasks.filter((t) => t.status === 'BLOCKED').length;

  const totalBudget   = sprints.reduce((s, sp) => s + safeNum(sp.budgetAllocated), 0);
  const aiBudget       = safeNum(ccDetails?.estimatedBudget);
  const totalHours    = allTasks.reduce((s, t) => s + safeNum(t.aiEstimatedHours ?? t.estimatedHours), 0);
  const totalCallVol  = sprints.reduce((s, sp) => s + safeNum(sp.expectedCallVolume), 0);
  const totalAgentsTarget = sprints.reduce((s, sp) => s + safeNum(sp.targetAgents), 0);

  const teamSize = useMemo(() => {
    const ids = new Set<string>();
    allTasks.forEach((t) => { if (t.assignedTo) ids.add(String(typeof t.assignedTo === 'object' && t.assignedTo !== null && 'id' in t.assignedTo ? (t.assignedTo as any).id : t.assignedTo)); });
    return ids.size || safeNum(ccDetails?.numberOfAgents) || members.length;
  }, [allTasks, members, ccDetails]);

  const avgDelay = useMemo(() => {
    const delayed = allTasks.filter((t) => safeNum(t.delayHours) > 0);
    return delayed.length > 0 ? delayed.reduce((s, t) => s + safeNum(t.delayHours), 0) / delayed.length : 0;
  }, [allTasks]);

  const globalPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const budgetPct = totalBudget > 0 && aiBudget > 0 ? Math.round((aiBudget / totalBudget) * 100) : 0;

  const csat = safeNum(ccDetails?.CSAT);          // ex: 80 (sur 100)
  const fcr  = safeNum(ccDetails?.FCR);            // ex: 0.7 (ratio)
  const aht  = safeNum(ccDetails?.averageHandleTimeSec);
  const slaTarget = safeNum(ccDetails?.slaTargetSeconds);
  const slaRespect = slaTarget > 0 && aht > 0 ? Math.max(0, Math.round(100 - ((aht - slaTarget) / slaTarget) * 100)) : 0;

  // ── Chart data — one point per sprint ─────────────────────────────────────
  const sprintChartData = useMemo(() => {
    let cumCallVol = 0;
    return sprints.map((sp, i) => {
      const tasks = sp.tasks ?? [];
      const done = tasks.filter((t) => t.status === 'DONE').length;
      const total = tasks.length;
      cumCallVol += safeNum(sp.expectedCallVolume);
      const remaining = sprints.reduce((s, s2) => s + (s2.tasks ?? []).length, 0)
        - sprints.slice(0, i + 1).reduce((s, s2) => s + (s2.tasks ?? []).filter((t) => t.status === 'DONE').length, 0);
      const idealTotal = sprints.reduce((s, s2) => s + (s2.tasks ?? []).length, 0);
      const idealRemaining = idealTotal - Math.round((idealTotal / sprints.length) * (i + 1));
      return {
        name: sp.name.length > 16 ? sp.name.slice(0, 15) + '…' : sp.name,
        remaining,
        ideal: Math.max(0, idealRemaining),
        callVolume: safeNum(sp.expectedCallVolume),
        cumCallVolume: cumCallVol,
        agents: safeNum(sp.targetAgents),
        conversionTarget: safeNum(sp.targetConversionRate),
        qualityTarget: safeNum(sp.qualityScoreTarget),
        budgetAllocated: safeNum(sp.budgetAllocated),
        tasksDone: done,
        tasksTotal: total,
        pct: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });
  }, [sprints]);

  // ── Alerts (computed from real data) ─────────────────────────────────────
  const alerts = useMemo(() => {
    const list: { type: 'danger' | 'warn' | 'ok'; title: string; desc: string }[] = [];

    if (blockedTasks > 0)
      list.push({ type: 'danger', title: `${blockedTasks} tâche${blockedTasks > 1 ? 's' : ''} bloquée${blockedTasks > 1 ? 's' : ''}`, desc: 'Des tâches sont bloquées — intervention requise pour ne pas impacter les campagnes.' });

    if (csat > 0 && csat < 70)
      list.push({ type: 'warn', title: `CSAT bas : ${csat}/100`, desc: 'La satisfaction client est sous le seuil recommandé (70). Vérifier les scripts et la formation des agents.' });

    if (fcr > 0 && fcr < 0.6)
      list.push({ type: 'warn', title: `FCR faible : ${pct1(fcr)}`, desc: 'Le taux de résolution au premier appel est bas — envisager plus de formation ou de documentation.' });

    if (slaTarget > 0 && aht > slaTarget)
      list.push({ type: 'warn', title: `SLA dépassé : AHT ${aht}s vs cible ${slaTarget}s`, desc: 'Le temps de traitement moyen dépasse l\'objectif SLA. Analyser la charge des agents.' });

    sprints.filter((s) => s.status === 'active').forEach((sp) => {
      const delayed = (sp.tasks ?? []).filter((t) => safeNum(t.delayHours) > 2);
      if (delayed.length > 0)
        list.push({ type: 'warn', title: `Sprint "${sp.name}" : ${delayed.length} tâche${delayed.length > 1 ? 's' : ''} en retard`, desc: `Retard moyen de ${(delayed.reduce((s, t) => s + safeNum(t.delayHours), 0) / delayed.length).toFixed(1)}h. Vérifier les ressources.` });
    });

    const doneSprints = sprints.filter((s) => s.status === 'completed');
    if (doneSprints.length > 0)
      list.push({ type: 'ok', title: `${doneSprints.length} sprint${doneSprints.length > 1 ? 's' : ''} terminé${doneSprints.length > 1 ? 's' : ''} avec succès`, desc: `${doneSprints.flatMap((s) => s.tasks ?? []).filter((t) => t.status === 'DONE').length} tâches livrées.` });

    if (csat >= 80)
      list.push({ type: 'ok', title: `Bon niveau de satisfaction client (CSAT ${csat}/100)`, desc: 'Les performances qualité sont au-dessus du seuil cible.' });

    if (globalPct > 70)
      list.push({ type: 'ok', title: `Avancement global ${globalPct}%`, desc: 'Le projet avance à un rythme satisfaisant.' });

    return list.slice(0, 5);
  }, [sprints, blockedTasks, csat, fcr, aht, slaTarget, globalPct]);

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId) ?? null;

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl border-2 border-blue-200 border-t-blue-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Chargement du tableau de bord…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-8 max-w-md text-center">
        <AlertCircle size={36} className="text-rose-400 mx-auto mb-3" />
        <p className="font-bold text-slate-700 mb-1">Erreur de chargement</p>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-slate-50/60 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shadow-blue-200"
                 style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)' }}>
              <BarChart2 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Tableau de bord Call Center
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {sprints.length} sprint{sprints.length !== 1 ? 's' : ''} · {totalTasks} tâches · Données en temps réel
              </p>
            </div>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-2">
            {sprints.some((s) => s.status === 'active') && (
              <span className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />En cours
              </span>
            )}
          </div>
        </div>

        {/* ── KPIs ────────────────────────────────────────────────────── */}
        <Section icon={<Activity size={14} />} title="Indicateurs clés">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
            <KpiCard
              icon={<TrendingUp size={16} />} label="Avancement" value={`${globalPct}%`}
              sub={`${doneTasks} / ${totalTasks} tâches`} progress={globalPct} color="blue"
            />
            <KpiCard
              icon={<Headset size={16} />} label="Agents" value={String(teamSize)}
              sub={`Cible cumulée : ${totalAgentsTarget}`} color="indigo"
            />
            <KpiCard
              icon={<Smile size={16} />} label="CSAT" value={csat > 0 ? `${csat}/100` : '—'}
              sub={csat >= 80 ? 'Bon niveau' : csat > 0 ? 'À surveiller' : 'Non renseigné'}
              progress={csat > 0 ? csat : undefined} color={csat >= 80 ? 'emerald' : 'amber'}
            />
            <KpiCard
              icon={<Target size={16} />} label="FCR" value={fcr > 0 ? pct1(fcr) : '—'}
              sub="Résolution 1er appel"
              progress={fcr > 0 ? Math.round(fcr * 100) : undefined} color={fcr >= 0.6 ? 'emerald' : 'amber'}
            />
            <KpiCard
              icon={<Gauge size={16} />} label="SLA" value={slaTarget > 0 ? `${slaRespect}%` : '—'}
              sub={slaTarget > 0 ? `AHT ${aht}s / cible ${slaTarget}s` : 'Non renseigné'}
              progress={slaTarget > 0 ? slaRespect : undefined} color={slaRespect >= 90 ? 'emerald' : 'rose'}
            />
            <KpiCard
              icon={<PhoneCall size={16} />} label="Volume appels" value={fmt(totalCallVol)}
              sub="Prévu sur tous les sprints" color="indigo"
            />
            <KpiCard
              icon={<DollarSign size={16} />} label="Budget IA" value={aiBudget > 0 ? `${fmt(Math.round(aiBudget))}` : '—'}
              sub={totalBudget > 0 ? `Alloué : ${fmt(totalBudget)} TND` : 'TND estimés'}
              progress={budgetPct > 0 ? budgetPct : undefined} color={budgetPct > 100 ? 'rose' : 'amber'}
            />
            <KpiCard
              icon={<Cpu size={16} />} label="Heures IA" value={`${Math.round(totalHours)}h`}
              sub="estimées par IA" color="violet"
            />
          </div>
        </Section>

        {/* ── Charts ──────────────────────────────────────────────────── */}
        <Section icon={<TrendingUp size={14} />} title="Courbes d'avancement">

          {/* Tab selector */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {([
              { key: 'burndown', label: 'Burndown' },
              { key: 'appels',   label: 'Appels'    },
              { key: 'qualite',  label: 'Qualité'   },
              { key: 'budget',   label: 'Budget'    },
              { key: 'tasks',    label: 'Tâches'    },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === key
                    ? 'bg-blue-500 text-white shadow-sm shadow-blue-200'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {sprintChartData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center text-slate-400 text-sm">
              Aucune donnée à afficher
            </div>
          ) : (
            <>
              {activeTab === 'burndown' && (
                <ChartCard title="Burndown — tâches restantes (réel vs idéal)" sub="Par sprint">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={sprintChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={C.blue} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} />
                      <YAxis tick={{ fontSize: 11, fill: C.slate }} />
                      <Tooltip content={<Tip />} />
                      <Area type="monotone" dataKey="remaining" name="Restantes" stroke={C.blue} strokeWidth={2.5} fill="url(#gBlue)" dot={{ r: 4, fill: C.blue, stroke: '#fff', strokeWidth: 2 }} />
                      <Line type="monotone" dataKey="ideal" name="Idéal" stroke={C.blueL} strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 rounded" style={{ background: C.blue }} />Réel</span>
                    <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 rounded border-t border-dashed" style={{ borderColor: C.blueL }} />Idéal</span>
                  </div>
                </ChartCard>
              )}

              {activeTab === 'appels' && (
                <ChartCard title="Volume d'appels prévu par sprint" sub="Cumulé et par sprint">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={sprintChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} />
                      <YAxis tick={{ fontSize: 11, fill: C.slate }} />
                      <Tooltip content={<Tip />} />
                      <Bar dataKey="callVolume" name="Appels prévus" fill={C.indigo} radius={[6,6,0,0]}
                           label={{ position: 'top', fontSize: 11, fill: C.slate }} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {activeTab === 'qualite' && (
                <ChartCard title="Objectifs qualité par sprint" sub="Taux de conversion cible vs score qualité cible">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={sprintChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} />
                      <YAxis tick={{ fontSize: 11, fill: C.slate }} />
                      <Tooltip content={<Tip />} />
                      <Bar dataKey="conversionTarget" name="Conversion cible (%)" fill={C.blueL} radius={[4,4,0,0]} />
                      <Bar dataKey="qualityTarget"     name="Qualité cible (%)"    fill={C.indigo} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: C.blueL }} />Conversion cible</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: C.indigo }} />Qualité cible</span>
                  </div>
                </ChartCard>
              )}

              {activeTab === 'budget' && (
                <ChartCard title="Budget alloué par sprint (TND)" sub="Par sprint">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={sprintChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} />
                      <YAxis tick={{ fontSize: 11, fill: C.slate }} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
                      <Tooltip content={<Tip />} />
                      <Bar dataKey="budgetAllocated" name="Budget alloué" fill={C.blue} radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  {aiBudget > 0 && (
                    <p className="text-xs text-slate-400 mt-3">
                      Coût IA estimé pour l'ensemble du projet : <strong className="text-slate-700">{fmt(Math.round(aiBudget))} TND</strong>
                      {totalBudget > 0 && <> — soit <strong style={{ color: budgetPct > 100 ? C.rose : C.blue }}>{budgetPct}%</strong> du budget alloué.</>}
                    </p>
                  )}
                </ChartCard>
              )}

              {activeTab === 'tasks' && (
                <ChartCard title="Avancement des tâches par sprint (%)" sub="Taux de complétion">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={sprintChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} />
                      <YAxis tick={{ fontSize: 11, fill: C.slate }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={<Tip />} />
                      <Bar dataKey="pct" name="Complétion %" fill={C.indigo} radius={[6,6,0,0]}
                           label={{ position: 'top', fontSize: 11, fill: C.slate, formatter: (v: number) => `${v}%` }} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </>
          )}
        </Section>

        {/* ── Sprint list + task detail ────────────────────────────────── */}
        <Section icon={<Calendar size={14} />} title="Détail par sprint">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Sprint list */}
            <div className="flex flex-col gap-3">
              {sprints.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
                  <ListTodo size={28} className="text-blue-200" />
                  Aucun sprint trouvé
                </div>
              ) : (
                sprints.map((sp) => (
                  <SprintRow
                    key={sp.id}
                    sprint={sp}
                    selected={selectedSprintId === sp.id}
                    onClick={() => setSelectedSprintId(sp.id === selectedSprintId ? null : sp.id!)}
                  />
                ))
              )}
            </div>

            {/* Task detail for selected sprint */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              {selectedSprint ? (
                <>
                  {/* Header */}
                  <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1 rounded-lg bg-blue-100 text-blue-600"><ListTodo size={14} /></span>
                      <p className="font-bold text-slate-700 text-sm truncate">{selectedSprint.name}</p>
                    </div>
                    <p className="text-xs text-slate-400 ml-7">
                      {(selectedSprint.tasks ?? []).length} tâches · {fmtDate(selectedSprint.startDate)} → {fmtDate(selectedSprint.endDate)}
                    </p>
                  </div>

                  {/* Task list */}
                  <div className="p-4 flex flex-col gap-2 max-h-[480px] overflow-y-auto">
                    {(selectedSprint.tasks ?? []).length === 0 ? (
                      <p className="text-center text-slate-400 text-sm py-8">Aucune tâche dans ce sprint</p>
                    ) : (
                      (selectedSprint.tasks ?? []).map((t, i) => (
                        <TaskRow key={t.id ?? i} task={t} members={members} />
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[280px] gap-3 text-slate-400">
                  <span className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-300">
                    <ListTodo size={22} />
                  </span>
                  <p className="text-sm font-medium">Sélectionnez un sprint pour voir ses tâches</p>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ── Alerts + Summary ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Section icon={<AlertTriangle size={14} />} title="Alertes & points d'attention">
            <div className="flex flex-col gap-3">
              {alerts.length === 0 ? (
                <Alert type="ok" title="Tout est en ordre" desc="Aucune alerte détectée sur le projet." />
              ) : (
                alerts.map((a, i) => <Alert key={i} type={a.type} title={a.title} desc={a.desc} />)
              )}
            </div>
          </Section>

          <Section icon={<ChevronRight size={14} />} title="Synthèse rapide">
            <div className="flex flex-col gap-3">

              {/* By status */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tâches par statut</p>
                <div className="flex flex-col gap-2">
                  {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                    const count = allTasks.filter((t) => t.status === key).length;
                    if (count === 0) return null;
                    const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className={`text-xs font-semibold w-24 shrink-0 ${cfg.text}`}>{cfg.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: key === 'DONE' ? C.emerald : key === 'IN_PROGRESS' ? C.blue : key === 'BLOCKED' ? C.rose : key === 'IN_REVIEW' ? C.amber : '#94a3b8' }} />
                        </div>
                        <span className="text-xs text-slate-400 font-bold w-12 text-right">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quality summary */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Qualité & SLA</p>
                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">CSAT</span>
                    <span className="font-bold text-slate-700">{csat > 0 ? `${csat}/100` : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">FCR (résolution 1er appel)</span>
                    <span className="font-bold text-slate-700">{fcr > 0 ? pct1(fcr) : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Temps de traitement moyen (AHT)</span>
                    <span className="font-bold text-slate-700">{aht > 0 ? `${aht}s` : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Cible SLA</span>
                    <span className="font-bold text-slate-700">{slaTarget > 0 ? `${slaTarget}s` : '—'}</span>
                  </div>
                  {ccDetails?.callTypes && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Types d'appels</span>
                      <span className="font-bold text-slate-700 text-right">{ccDetails.callTypes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Budget summary */}
              {totalBudget > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Budget global</p>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, budgetPct)}%`, background: budgetPct > 100 ? C.rose : budgetPct > 70 ? C.amber : C.emerald }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Coût IA estimé : <strong className="text-slate-700">{fmt(Math.round(aiBudget))} TND</strong></span>
                    <span className="font-bold" style={{ color: budgetPct > 100 ? C.rose : budgetPct > 70 ? C.amber : C.emerald }}>{budgetPct}%</span>
                    <span>Alloué : <strong className="text-slate-700">{fmt(totalBudget)} TND</strong></span>
                  </div>
                </div>
              )}

            </div>
          </Section>
        </div>

      </div>
    </div>
  );
};

export default CallCenterDashboardPage;