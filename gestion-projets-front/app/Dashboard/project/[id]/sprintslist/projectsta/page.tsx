'use client';

// ─── ProjectStatisticsPage.tsx ────────────────────────────────────────────────
//
// Page de statistiques avancées pour le Project Manager.
// Affiche :
//   - KPIs globaux (avancement, vélocité, risques, budget)
//   - Courbe d'avancement global (Burn-up)
//   - Courbe de fin de sprint (velocity + prévision)
//   - Indicateurs de dérive (retard, dépassement de budget, tâches bloquées)
//   - Distribution des risques et des statuts
//   - Timeline Gantt par sprint
//   - Alertes & recommandations intelligentes

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  Clock, Users, Zap, Target, DollarSign, Activity, BarChart3,
  PieChart, GitBranch, Loader2, Calendar, Flag, ArrowRight,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart as RePieChart,
  Pie, AreaChart, Area, ReferenceLine, Legend, ScatterChart, Scatter,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────────
type TaskStatus   = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
type SprintStatus = 'planned' | 'in_progress' | 'completed';

interface Task {
  id?: number;
  title: string;
  type: string;
  priority: string;
  status: TaskStatus;
  storyPoints: number;
  estimatedHours: number;
  aiEstimatedHours?: number;
  complexityScore: number;
  riskLevel: number;
  dependencies: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
}

interface Sprint {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  complexity: string;
  tasks: Task[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const getAuthToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '';

function computeSprintStatus(sprint: Sprint): SprintStatus {
  const tasks = sprint.tasks;
  if (!tasks.length) return 'planned';
  if (tasks.every((t) => t.status === 'DONE')) return 'completed';
  const someActive = tasks.some((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW');
  const now = new Date();
  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  if (someActive || (now >= start && now <= end)) return 'in_progress';
  return 'planned';
}

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

function fmt(date: Date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function fmtFull(date: Date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<TaskStatus, string> = {
  DONE: '#10b981', IN_PROGRESS: '#4f46e5', IN_REVIEW: '#f59e0b',
  TO_DO: '#9ca3af', BLOCKED: '#ef4444',
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  DONE: 'Terminé', IN_PROGRESS: 'En cours', IN_REVIEW: 'En révision',
  TO_DO: 'À faire', BLOCKED: 'Bloqué',
};
const RISK_COLOR = ['#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];

const TIP_STYLE = {
  contentStyle: {
    background: '#fff', border: '0.5px solid #e5e3de',
    borderRadius: 8, fontSize: 12, color: '#111', boxShadow: 'none',
  },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, accent, trend, alert,
}: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; accent: string; trend?: 'up' | 'down' | 'ok'; alert?: boolean;
}) {
  return (
    <div style={{
      background: alert ? '#fffbeb' : '#fff',
      border: `0.5px solid ${alert ? '#fde68a' : '#e5e3de'}`,
      borderRadius: 14, padding: '1.1rem 1.2rem',
      transition: 'box-shadow .2s', cursor: 'pointer',
      hover: { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
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
        {trend === 'down' && <TrendingDown size={13} color="#ef4444" style={{ marginLeft: 'auto' }} />}
        {trend === 'up'   && <TrendingUp   size={13} color="#10b981" style={{ marginLeft: 'auto' }} />}
        {alert && <AlertTriangle size={13} color="#f59e0b" style={{ marginLeft: 'auto' }} />}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#111', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af' }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '1rem 1.25rem', borderBottom: '0.5px solid #f3f4f6',
    }}>
      {icon}
      <span style={{
        fontSize: 11, color: '#9ca3af', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>{title}</span>
      {badge}
    </div>
  );
}

function ChartLegend({ items }: { items: { label: string; color: string; dash?: boolean }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9ca3af' }}>
          <span style={{
            width: 14, height: 3, borderRadius: 1,
            background: item.dash ? 'transparent' : item.color,
            display: 'inline-block',
            borderTop: item.dash ? `2px dashed ${item.color}` : 'none',
          }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ── Alert panel ────────────────────────────────────────────────────────────────
interface Alert {
  type: 'danger' | 'warn' | 'ok' | 'info';
  icon: string;
  title: string;
  detail: string;
  action?: { label: string; onClick: () => void };
}

function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  const colors = {
    danger: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#ef4444' },
    warn:   { bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
    ok:     { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', dot: '#10b981' },
    info:   { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#4f46e5' },
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((a, i) => {
        const c = colors[a.type];
        return (
          <div key={i} style={{
            background: c.bg, border: `0.5px solid ${c.border}`,
            borderRadius: 10, padding: '12px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', gap: 10, flex: 1 }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontSize: 11, color: c.text, opacity: 0.85, lineHeight: 1.5 }}>{a.detail}</div>
              </div>
            </div>
            {a.action && (
              <button
                onClick={a.action.onClick}
                style={{
                  background: c.dot, color: '#fff',
                  border: 'none', borderRadius: 6, padding: '4px 10px',
                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap', marginLeft: 10,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {a.action.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '0.5px solid #e5e3de',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#111' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          {p.name}: <strong style={{ color: '#111' }}>{toNum(p.value).toFixed(0)}</strong>
          {p.name.includes('SP') ? ' SP' : p.name.includes('h') ? 'h' : ''}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ProjectStatisticsPage() {
  const params    = useParams() as { id?: string };
  const projectId = params?.id;
  const router    = useRouter();

  const [sprints,  setSprints]  = useState<Sprint[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [teamSize, setTeamSize] = useState(1);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      setLoading(true);
      const token   = getAuthToken();
      const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL;
      try {
        const [spRes, dtRes] = await Promise.all([
          fetch(`${apiBase}/projects/${projectId}/sprints`,  { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiBase}/projects/${projectId}/details`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (spRes.ok) {
          const raw: Sprint[] = await spRes.json();
          setSprints(raw.map((s) => ({
            ...s,
            complexity: s.complexity || 'Medium',
            tasks: (s.tasks || []).map((t) => ({
              ...t,
              status:           t.status           || 'TO_DO',
              estimatedHours:   Number(t.estimatedHours)   || 0,
              aiEstimatedHours: t.aiEstimatedHours != null ? Number(t.aiEstimatedHours) : undefined,
              storyPoints:      Number(t.storyPoints)      || 0,
              riskLevel:        Number(t.riskLevel)        || 0,
            })),
          })));
        }
        if (dtRes.ok) {
          const data = await dtRes.json();
          const ts = (data.project?.assignedTo?.length ?? 0) > 0
            ? data.project.assignedTo.length
            : data.project?.itDetails?.teamSize ?? 1;
          setTeamSize(ts);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [projectId]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const sprintsWithStatus = sprints.map((s) => ({
    ...s,
    computedStatus: computeSprintStatus(s),
  }));

  const allTasks = sprintsWithStatus.flatMap((s) =>
    s.tasks.map((t) => ({ ...t, sprintName: s.name, sprintStatus: s.computedStatus })),
  );

  const sorted = [...sprintsWithStatus].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const totalSP       = allTasks.reduce((a, t) => a + (t.storyPoints || 0), 0);
  const doneSP        = allTasks.filter((t) => t.status === 'DONE').reduce((a, t) => a + (t.storyPoints || 0), 0);
  const progressPct   = totalSP ? Math.round((doneSP / totalSP) * 100) : 0;
  const inProgressSP  = allTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').reduce((a, t) => a + (t.storyPoints || 0), 0);
  const blockedTasks  = allTasks.filter((t) => t.status === 'BLOCKED');
  const blockedSP     = blockedTasks.reduce((a, t) => a + (t.storyPoints || 0), 0);
  const highRiskTasks = allTasks.filter((t) => t.riskLevel >= 4);
  const highRiskSP    = highRiskTasks.reduce((a, t) => a + (t.storyPoints || 0), 0);
  const totalHours    = allTasks.reduce((a, t) => a + (t.aiEstimatedHours || t.estimatedHours || 0), 0);
  const completedSprints = sorted.filter((s) => s.computedStatus === 'completed');
  const avgVelocity   = completedSprints.length
    ? Math.round(completedSprints.reduce((a, s) =>
        a + s.tasks.filter((t) => t.status === 'DONE').reduce((b, t) => b + (t.storyPoints || 0), 0), 0,
      ) / completedSprints.length)
    : 0;

  // ── Burn-up chart data ───────────────────────────────────────────────────────
  let cumTotal = 0;
  let cumDone  = 0;
  const burnUpData = sorted.map((sprint) => {
    const spSP  = sprint.tasks.reduce((a, t) => a + (t.storyPoints || 0), 0);
    const doneSPlocal = sprint.tasks
      .filter((t) => t.status === 'DONE')
      .reduce((a, t) => a + (t.storyPoints || 0), 0);
    cumTotal += spSP;
    if (sprint.computedStatus !== 'planned') cumDone += doneSPlocal;
    return {
      name:         sprint.name.replace('Sprint ', 'S'),
      fullName:     sprint.name,
      date:         fmt(new Date(sprint.endDate)),
      'Scope total': cumTotal,
      'Réalisé':    sprint.computedStatus === 'planned' ? null : cumDone,
      status:       sprint.computedStatus,
    };
  });

  // ── Velocity chart data ──────────────────────────────────────────────────────
  const velocityData = sorted.map((sprint, idx) => {
    const planned  = sprint.tasks.reduce((a, t) => a + (t.storyPoints || 0), 0);
    const done     = sprint.tasks.filter((t) => t.status === 'DONE').reduce((a, t) => a + (t.storyPoints || 0), 0);
    const hours    = sprint.tasks.reduce((a, t) => a + (t.aiEstimatedHours || t.estimatedHours || 0), 0);
    const daysLeft = sprint.computedStatus !== 'completed'
      ? Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / 86400000))
      : 0;
    return {
      name:        sprint.name.replace('Sprint ', 'S'),
      'SP prévu':  planned,
      'SP réalisé': sprint.computedStatus === 'planned' ? null : done,
      'Heures est': Math.round(hours),
      daysLeft,
      status:      sprint.computedStatus,
      idx,
    };
  });

  // ── Forecast: remaining sprints ──────────────────────────────────────────────
  const remainingSP = totalSP - doneSP;
  const sprintsNeeded = avgVelocity > 0 ? Math.ceil(remainingSP / avgVelocity) : 0;
  const projectStart  = sorted.length ? new Date(sorted[0].startDate) : new Date();
  const lastSprintEnd = sorted.length ? new Date(sorted[sorted.length - 1].endDate) : new Date();
  const forecastEnd   = avgVelocity > 0
    ? addWorkingDays(lastSprintEnd, sprintsNeeded * 14)
    : lastSprintEnd;
  
  const now = new Date();
  const daysUntilForecast = Math.ceil((forecastEnd.getTime() - now.getTime()) / 86400000);

  // ── Sprint gantt data ────────────────────────────────────────────────────────
  const ganttData = sorted.map((sprint) => {
    const start = new Date(sprint.startDate);
    const end   = new Date(sprint.endDate);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const done  = sprint.tasks.filter((t) => t.status === 'DONE').length;
    const total = sprint.tasks.length;
    const pct   = total ? Math.round((done / total) * 100) : 0;
    return { name: sprint.name.replace('Sprint ', 'S'), fullName: sprint.name, pct, totalDays, status: sprint.computedStatus };
  });

  // ── Status pie data ──────────────────────────────────────────────────────────
  const statusData = (() => {
    const counts: Partial<Record<TaskStatus, number>> = {};
    allTasks.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([s, v]) => ({
      name: STATUS_LABEL[s as TaskStatus] || s,
      value: v,
      color: STATUS_COLOR[s as TaskStatus] || '#9ca3af',
    }));
  })();

  // ── Risk distribution ────────────────────────────────────────────────────────
  const riskData = [1, 2, 3, 4, 5].map((l) => ({
    name: `Niveau ${l}`,
    value: allTasks.filter((t) => t.riskLevel === l).length,
    fill: RISK_COLOR[l - 1],
  }));

  // ── Dérive détection ─────────────────────────────────────────────────────────
  const driftData = sorted.map((sprint) => {
    const planned = sprint.tasks.reduce((a, t) => a + (t.storyPoints || 0), 0);
    const done    = sprint.tasks.filter((t) => t.status === 'DONE').reduce((a, t) => a + (t.storyPoints || 0), 0);
    const delta   = sprint.computedStatus !== 'planned' ? done - planned : 0;
    return {
      name:  sprint.name.replace('Sprint ', 'S'),
      delta,
      fill:  delta >= 0 ? '#10b981' : '#ef4444',
      status: sprint.computedStatus,
    };
  });

  const overallDrift = driftData
    .filter((d) => d.status !== 'planned')
    .reduce((a, d) => a + d.delta, 0);

  // ── Health score (0-100) ──────────────────────────────────────────────────────
  let healthScore = 100;
  if (blockedTasks.length > 0)  healthScore -= Math.min(30, blockedTasks.length * 10);
  if (highRiskTasks.length > 0) healthScore -= Math.min(20, highRiskTasks.length * 5);
  if (overallDrift < 0)         healthScore -= Math.min(25, Math.abs(overallDrift) * 2);
  if (progressPct < 30 && sorted.length > 2) healthScore -= 15;
  if (daysUntilForecast < 0)    healthScore -= 20;
  healthScore = Math.max(0, Math.min(100, healthScore));

  const healthColor = healthScore >= 75 ? '#10b981' : healthScore >= 50 ? '#f59e0b' : '#ef4444';
  const healthLabel = healthScore >= 75 ? 'Bon' : healthScore >= 50 ? 'Attention' : 'Critique';

  // ── Alerts ────────────────────────────────────────────────────────────────────
  const alerts: Alert[] = [];
  
  if (blockedTasks.length > 0) {
    alerts.push({
      type: 'danger', icon: '🚫',
      title: `${blockedTasks.length} tâche(s) bloquée(s) - ${blockedSP} SP impactés`,
      detail: `Résolvez les dépendances en priorité : ${blockedTasks.map((t) => t.title).slice(0, 2).join(', ')}${blockedTasks.length > 2 ? '…' : ''}`,
      action: { label: 'Voir détails', onClick: () => {} }
    });
  }
  
  if (highRiskTasks.length > 0) {
    alerts.push({
      type: 'warn', icon: '⚠',
      title: `${highRiskTasks.length} tâche(s) à risque élevé (≥4/5) - ${highRiskSP} SP`,
      detail: 'Assignez des développeurs seniors et augmentez le buffer à 25% sur les estimations.',
      action: { label: 'Mitiger', onClick: () => {} }
    });
  }
  
  if (overallDrift < -10) {
    alerts.push({
      type: 'danger', icon: '📉',
      title: `Dérive critique : −${Math.abs(overallDrift)} SP (${((Math.abs(overallDrift) / totalSP) * 100).toFixed(0)}% du scope)`,
      detail: 'L\'équipe livre significativement moins que prévu. Réduisez le scope ou augmentez les ressources immédiatement.',
      action: { label: 'Plan action', onClick: () => {} }
    });
  } else if (overallDrift < -5) {
    alerts.push({
      type: 'warn', icon: '📉',
      title: `Dérive modérée : −${Math.abs(overallDrift)} SP`,
      detail: 'Capacité insuffisante. Révisez les estimations ou réduisez le scope.',
    });
  }
  
  if (daysUntilForecast < 0) {
    alerts.push({
      type: 'danger', icon: '🚨',
      title: 'Délai de fin DÉPASSÉ',
      detail: `Le projet avait une deadline avant ${Math.abs(daysUntilForecast)} j. Escaladez auprès du sponsor.`,
      action: { label: 'Escalader', onClick: () => {} }
    });
  } else if (daysUntilForecast < 7 && sprintsNeeded > 0) {
    alerts.push({
      type: 'warn', icon: '📅',
      title: `Fin prévue dans ${daysUntilForecast} jours (${sprintsNeeded} sprint(s) restants)`,
      detail: `Date de livraison : ${fmtFull(forecastEnd)}. Maintenez la cadence.`,
    });
  }
  
  if (inProgressSP === 0 && remainingSP > 0 && sorted.filter(s => s.computedStatus === 'in_progress').length > 0) {
    alerts.push({
      type: 'info', icon: '⏸️',
      title: 'Aucune tâche ne progresse',
      detail: `${remainingSP} SP restants mais aucune tâche en cours. Les développeurs manquent-ils de tâches ?`,
    });
  }
  
  if (progressPct >= 80 && completedSprints.length > 0 && remainingSP <= avgVelocity) {
    alerts.push({
      type: 'ok', icon: '🎯',
      title: 'Dernier sprint identifié',
      detail: `${progressPct}% livrés. Les ${remainingSP} SP restants rentrent dans un sprint. Fin en vue !`,
      action: { label: 'Célébrer 🎉', onClick: () => {} }
    });
  }
  
  if (alerts.length === 0) {
    alerts.push({
      type: 'info', icon: '📋',
      title: 'Projet en bonne santé',
      detail: `Avancement : ${progressPct}% | Vélocité stable | Aucun blocage détecté. Continuez les stand-ups.`,
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8f7f4', fontFamily: '"DM Sans", "Segoe UI", sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} color="#111" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ color: '#9ca3af', marginTop: 12, fontSize: 14 }}>Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f7f4',
      fontFamily: '"DM Sans", "Segoe UI", sans-serif',
      color: '#1a1a1a',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem' }}>

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

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, background: '#111',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BarChart3 size={18} color="#fff" />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#111' }}>
                  Tableau de bord — Statistiques
                </h1>
              </div>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: 13 }}>
                {allTasks.length} tâches · {sprints.length} sprints · {teamSize} membres · {totalSP} SP
              </p>
            </div>

            {/* Health score badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff', border: `0.5px solid ${healthColor}40`,
              borderRadius: 12, padding: '8px 16px',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `${healthColor}15`,
                border: `2px solid ${healthColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: healthColor,
              }}>
                {healthScore}
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Santé projet</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: healthColor }}>{healthLabel}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 16 }}>
          <KpiCard
            icon={<Target size={18} color="#4f46e5" />}
            label="Avancement"
            value={`${progressPct}%`}
            sub={`${doneSP}/${totalSP} SP`}
            accent="#4f46e5"
            trend={progressPct >= 50 ? 'up' : 'down'}
          />
          <KpiCard
            icon={<Activity size={18} color="#0891b2" />}
            label="En cours"
            value={`${inProgressSP} SP`}
            sub={`${allTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length} tâches`}
            accent="#0891b2"
          />
          <KpiCard
            icon={<Zap size={18} color="#059669" />}
            label="Vélocité moy."
            value={`${avgVelocity} SP`}
            sub={`${completedSprints.length} sprint(s) finis`}
            accent="#059669"
          />
          <KpiCard
            icon={<Clock size={18} color="#d97706" />}
            label="Heures est."
            value={`${Math.round(totalHours)}h`}
            sub={`${Math.ceil(totalHours / 8 / teamSize)} j avec ${teamSize} dev`}
            accent="#d97706"
          />
          <KpiCard
            icon={<AlertTriangle size={18} color={blockedTasks.length > 0 ? '#ef4444' : '#10b981'} />}
            label="Bloqué/Risque"
            value={`${blockedSP}/${highRiskSP}`}
            sub={`${blockedTasks.length} bloqué(s), ${highRiskTasks.length} risqué(s)`}
            accent={blockedTasks.length > 0 ? '#ef4444' : '#10b981'}
            alert={blockedTasks.length > 0}
            trend={blockedTasks.length > 0 ? 'down' : 'ok'}
          />
          <KpiCard
            icon={<Calendar size={18} color={daysUntilForecast < 0 ? '#ef4444' : '#7c3aed'} />}
            label="Fin prévue"
            value={avgVelocity > 0 ? fmt(forecastEnd) : '—'}
            sub={avgVelocity > 0 ? `${sprintsNeeded} sprint(s), ${daysUntilForecast} j` : 'Pas de données'}
            accent={daysUntilForecast < 0 ? '#ef4444' : '#7c3aed'}
            alert={daysUntilForecast < 7 && daysUntilForecast >= 0}
          />
        </div>

        {/* ── Alertes ── */}
        <div style={{
          background: '#fff', borderRadius: 14,
          border: '0.5px solid #e5e3de', overflow: 'hidden', marginBottom: 16,
        }}>
          <SectionHeader
            icon={<AlertTriangle size={15} color="#9ca3af" />}
            title="Alertes & Actions"
            badge={
              <span style={{
                background: '#f3f4f6', color: '#6b7280',
                borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
              }}>{alerts.filter(a => a.type === 'danger' || a.type === 'warn').length} prioritaire(s)</span>
            }
          />
          <div style={{ padding: '1.25rem' }}>
            <AlertsPanel alerts={alerts} />
          </div>
        </div>

        {/* ── Burn-up chart ── */}
        <div style={{
          background: '#fff', borderRadius: 14,
          border: '0.5px solid #e5e3de', padding: '1.25rem', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <TrendingUp size={15} color="#9ca3af" />
            <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Courbe d'avancement global (Burn-up)
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>
              L'intersection = livraison complète
            </span>
          </div>
          <ChartLegend items={[
            { label: 'Scope total (SP)',    color: '#d1d5db', dash: true },
            { label: 'SP réalisés',         color: '#4f46e5' },
          ]} />
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={burnUpData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" stroke="#d1d5db" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#d1d5db" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="Scope total"
                stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="6 4"
                fill="none" dot={false}
              />
              <Area
                type="monotone" dataKey="Réalisé"
                stroke="#4f46e5" strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={{ r: 4, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                connectNulls={false}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Row: Velocity + Drift ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

          {/* Velocity */}
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e3de', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Activity size={15} color="#9ca3af" />
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Vélocité par sprint (SP)
              </span>
            </div>
            <ChartLegend items={[
              { label: 'SP prévu',   color: '#e5e7eb' },
              { label: 'SP réalisé', color: '#4f46e5' },
            ]} />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={velocityData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {avgVelocity > 0 && (
                  <ReferenceLine y={avgVelocity} stroke="#4f46e5" strokeDasharray="4 3" strokeWidth={1}
                    label={{ value: `moy. ${avgVelocity}`, position: 'right', fontSize: 10, fill: '#4f46e5' }}
                  />
                )}
                <Bar dataKey="SP prévu"   fill="#e5e7eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="SP réalisé" fill="#4f46e5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Drift per sprint */}
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e3de', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <TrendingDown size={15} color="#9ca3af" />
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Dérive SP/sprint (réalisé − prévu)
              </span>
            </div>
            <ChartLegend items={[
              { label: 'En avance',  color: '#10b981' },
              { label: 'En retard',  color: '#ef4444' },
            ]} />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={driftData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '0.5px solid #e5e3de', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${toNum(v) >= 0 ? '+' : ''}${toNum(v)} SP`, 'Dérive']}
                />
                <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={0.5} />
                <Bar dataKey="delta" radius={[3, 3, 0, 0]}>
                  {driftData.map((entry, index) => (
                    <Cell key={`drift-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Row: Status pie + Risk ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

          {/* Status donut */}
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e3de', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <PieChart size={15} color="#9ca3af" />
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Distribution des statuts
              </span>
            </div>
            <ChartLegend items={statusData.map((d) => ({ label: `${d.name} (${d.value})`, color: d.color }))} />
            <ResponsiveContainer width="100%" height={220}>
              <RePieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#fff', border: '0.5px solid #e5e3de', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${toNum(v)} tâche(s)`, 'Tâches']}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          {/* Risk distribution */}
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e3de', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
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
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '0.5px solid #e5e3de', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${toNum(v)} tâche(s)`, 'Tâches']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {riskData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Sprint Gantt progress ── */}
        <div style={{
          background: '#fff', borderRadius: 14,
          border: '0.5px solid #e5e3de', overflow: 'hidden', marginBottom: 16,
        }}>
          <SectionHeader
            icon={<GitBranch size={15} color="#9ca3af" />}
            title="Avancement par sprint"
            badge={
              <span style={{
                background: '#f3f4f6', color: '#6b7280',
                borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
              }}>{ganttData.length}</span>
            }
          />
          <div style={{ padding: '1.25rem' }}>
            {ganttData.map((sprint, i) => {
              const barColor =
                sprint.status === 'completed'   ? '#10b981' :
                sprint.status === 'in_progress' ? '#4f46e5' : '#e5e7eb';
              const labelColor =
                sprint.status === 'completed'   ? '#065f46' :
                sprint.status === 'in_progress' ? '#1e3a8a' : '#6b7280';
              const badgeBg =
                sprint.status === 'completed'   ? '#ecfdf5' :
                sprint.status === 'in_progress' ? '#eff6ff' : '#f9fafb';

              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{sprint.fullName}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        background: badgeBg, color: labelColor,
                      }}>
                        {sprint.status === 'completed' ? '✓ Terminé' : sprint.status === 'in_progress' ? '▶ En cours' : '○ Planifié'}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
                      {sprint.pct}% · {sprint.totalDays}j
                    </span>
                  </div>
                  <div style={{ height: 20, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: `${sprint.pct}%`, height: '100%',
                      background: barColor, borderRadius: 5,
                      transition: 'width .4s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                      paddingRight: 6,
                    }}>
                      {sprint.pct > 12 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{sprint.pct}%</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Forecast panel ── */}
        {avgVelocity > 0 && (
          <div style={{
            background: '#fff', borderRadius: 14,
            border: '0.5px solid #e5e3de', padding: '1.25rem', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Calendar size={15} color="#9ca3af" />
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Prévision de livraison
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {[
                { label: 'SP restants',        value: `${remainingSP}`, unit: 'SP' },
                { label: 'Vélocité moy.',       value: `${avgVelocity}`, unit: 'SP/sprint' },
                { label: 'Sprints nécessaires', value: `${sprintsNeeded}`, unit: 'sprint(s)' },
                { label: 'Fin prévue',  value: fmtFull(forecastEnd).split(' ').slice(1).join(' '), unit: '' },
                { label: 'Jours restants', value: `${Math.max(0, daysUntilForecast)}`, unit: 'j' },
                { label: 'Équipe',              value: `${teamSize}`, unit: 'dev' },
              ].map(({ label, value, unit }) => (
                <div key={label} style={{ background: '#f8f7f4', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>
                    {value} <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}