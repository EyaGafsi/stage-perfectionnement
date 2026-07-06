'use client';
import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, AreaChart, Area,
} from 'recharts';
import {
  CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown,
  Layers, Zap, Target, Activity, RefreshCw, ChevronRight,
  BarChart2, Users, Calendar, AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Domain = 'IT' | 'Marketing' | 'CallCenter';

type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  delayHours?: number;
  scheduledEndDate?: string;
  actualEndDate?: string;
  estimatedHours?: number;
  assignedTo?: { id: number; fullname: string };
}

interface Sprint {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  tasks?: Task[];
}

interface Project {
  id: number;
  name: string;
  status: string;
  domain: Domain;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  assignedTo?: { id: number; fullname: string }[];
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const DOMAIN_CFG: Record<Domain, { color: string; bg: string; border: string; chart: string; icon: string }> = {
  IT:          { color: 'text-sky-700',    bg: 'bg-sky-50',    border: 'border-sky-200',    chart: '#0ea5e9', icon: '💻' },
  Marketing:   { color: 'text-fuchsia-700',bg: 'bg-fuchsia-50',border: 'border-fuchsia-200',chart: '#d946ef', icon: '📣' },
  CallCenter:  { color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  chart: '#f59e0b', icon: '📞' },
};

const STATUS_COLOR: Record<string, string> = {
  completed:    '#22c55e',
  in_progress:  '#3b82f6',
  planned:      '#94a3b8',
  on_hold:      '#f59e0b',
  cancelled:    '#ef4444',
  DONE:         '#22c55e',
  IN_PROGRESS:  '#3b82f6',
  TO_DO:        '#94a3b8',
  IN_REVIEW:    '#a855f7',
  BLOCKED:      '#ef4444',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const token = () =>
  typeof window !== 'undefined'
    ? localStorage.getItem('access_token') || localStorage.getItem('token')
    : null;

const api = (path: string) =>
  fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token()}` },
  }).then(r => (r.ok ? r.json() : null));

function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100);
}

// ─── Date helper ──────────────────────────────────────────────────────────────

function getProjectDelay(project: Project): number {
  if (!project.endDate || project.status === 'completed' || project.status === 'cancelled') return 0;
  const endDate = new Date(project.endDate).getTime();
  const now = Date.now();
  if (now > endDate) {
    return Math.ceil((now - endDate) / (1000 * 60 * 60 * 24)); // retard en jours
  }
  return 0;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPI({
  label, value, sub, icon, trend, color = 'indigo',
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; trend?: number; color?: string;
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-emerald-50 text-emerald-600',
    red:    'bg-red-50 text-red-600',
    amber:  'bg-amber-50 text-amber-600',
    sky:    'bg-sky-50 text-sky-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${colors[color] ?? colors.indigo}`}>
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-1.5 mt-0.5">
          {trend !== undefined && (
            trend > 0
              ? <TrendingDown size={12} className="text-red-500" />
              : <TrendingUp size={12} className="text-emerald-500" />
          )}
          {sub && <span className="text-xs text-slate-400">{sub}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionTitle({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-2xl">{icon}</span>
      <div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Decision Badge ───────────────────────────────────────────────────────────

function Decision({ level, text }: { level: 'danger' | 'warn' | 'ok'; text: string }) {
  const cfg = {
    danger: { bg: 'bg-red-50 border-red-200', icon: '🔴', color: 'text-red-700' },
    warn:   { bg: 'bg-amber-50 border-amber-200', icon: '🟡', color: 'text-amber-700' },
    ok:     { bg: 'bg-emerald-50 border-emerald-200', icon: '🟢', color: 'text-emerald-700' },
  }[level];
  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${cfg.bg} ${cfg.color}`}>
      <span className="text-base leading-none mt-0.5">{cfg.icon}</span>
      <span className="font-medium">{text}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PMStatsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints]   = useState<Record<number, Sprint[]>>({});
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<Domain | 'ALL'>('ALL');

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const projs: Project[] = (await api('/projects')) ?? [];
      setProjects(projs);

      // Fetch sprints for each project per domain
      const sprintMap: Record<number, Sprint[]> = {};
      await Promise.all(
        projs.map(async (p) => {
          let data: Sprint[] | null = null;
          if (p.domain === 'IT')         data = await api(`/projects/${p.id}/sprints`);
          if (p.domain === 'Marketing')  data = await api(`/projects/${p.id}/marketing-sprints`);
          if (p.domain === 'CallCenter') data = await api(`/projects/${p.id}/callcenter-sprints`);
          if (data) sprintMap[p.id] = data;
        })
      );
      setSprints(sprintMap);
      setLoading(false);
    };
    load();
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const allTasks = useMemo<Task[]>(() => {
    return Object.values(sprints).flatMap(ss =>
      ss.flatMap(s => s.tasks ?? [])
    );
  }, [sprints]);

  const filtered = useMemo(() =>
    activeTab === 'ALL' ? projects : projects.filter(p => p.domain === activeTab),
    [projects, activeTab]
  );

  // Project status distribution
  const statusDist = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(p => { map[p.status] = (map[p.status] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // Domain distribution
  const domainDist = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach(p => { map[p.domain] = (map[p.domain] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Projets en retard
  const overdueProjects = useMemo(() => {
    return projects.filter(p => getProjectDelay(p) > 0);
  }, [projects]);

  const overdueByDomain = useMemo(() => {
    const map: Record<Domain, number> = { IT: 0, Marketing: 0, CallCenter: 0 };
    overdueProjects.forEach(p => { map[p.domain]++; });
    return Object.entries(map).map(([domain, count]) => ({ domain, overdue: count }));
  }, [overdueProjects]);

  // Tasks: on-time vs late per domain
  const tasksByDomain = useMemo(() => {
    const result: Record<Domain, { onTime: number; late: number; blocked: number; done: number; total: number }> = {
      IT:         { onTime: 0, late: 0, blocked: 0, done: 0, total: 0 },
      Marketing:  { onTime: 0, late: 0, blocked: 0, done: 0, total: 0 },
      CallCenter: { onTime: 0, late: 0, blocked: 0, done: 0, total: 0 },
    };
    projects.forEach(p => {
      const dom = p.domain as Domain;
      if (!result[dom]) return;
      (sprints[p.id] ?? []).forEach(s => {
        (s.tasks ?? []).forEach(t => {
          result[dom].total++;
          if (t.status === 'DONE') {
            result[dom].done++;
            if ((t.delayHours ?? 0) <= 0) result[dom].onTime++;
            else result[dom].late++;
          }
          if (t.status === 'BLOCKED') result[dom].blocked++;
        });
      });
    });
    return Object.entries(result).map(([domain, v]) => ({
      domain,
      ...v,
      onTimePct: pct(v.onTime, v.done || 1),
      latePct: pct(v.late, v.done || 1),
    }));
  }, [projects, sprints]);

  // Projects completed on time vs late (by domain, over time)
  const completionTimeline = useMemo(() => {
    const byMonth: Record<string, { onTime: number; late: number; incomplete: number }> = {};
    projects.forEach(p => {
      if (!p.endDate) return;
      const month = p.endDate.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { onTime: 0, late: 0, incomplete: 0 };
      if (p.status === 'completed') {
        // Check if projet was completed on time (delay = 0)
        byMonth[month].onTime++;
      } else if (['in_progress', 'planned'].includes(p.status)) {
        byMonth[month].incomplete++;
      } else {
        byMonth[month].late++;
      }
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }));
  }, [projects]);

  // Average delay per domain (en jours pour les projets en retard)
  const avgDelayByDomain = useMemo(() => {
    const map: Record<Domain, { total: number; count: number }> = {
      IT: { total: 0, count: 0 }, Marketing: { total: 0, count: 0 }, CallCenter: { total: 0, count: 0 },
    };
    overdueProjects.forEach(p => {
      const dom = p.domain as Domain;
      const delayDays = getProjectDelay(p);
      if (delayDays > 0) {
        map[dom].total += delayDays;
        map[dom].count++;
      }
    });
    return Object.entries(map).map(([domain, v]) => ({
      domain,
      avgDelay: v.count > 0 ? Math.round((v.total / v.count) * 10) / 10 : 0,
      count: v.count,
    }));
  }, [overdueProjects]);

  // Radar — project health per domain
  const radarData = useMemo(() => {
    return tasksByDomain.map(d => ({
      domain: d.domain,
      'Tâches faites': pct(d.done, d.total || 1),
      'À temps': d.onTimePct,
      'Sans blocage': Math.max(0, 100 - pct(d.blocked, d.total || 1) * 5),
      'Projets actifs': pct(
        projects.filter(p => p.domain === d.domain && p.status === 'in_progress').length,
        projects.filter(p => p.domain === d.domain).length || 1
      ),
    }));
  }, [tasksByDomain, projects]);

  // Global KPIs
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const inProgressProjects = projects.filter(p => p.status === 'in_progress').length;
  const allDone = allTasks.filter(t => t.status === 'DONE');
  const allLate = allDone.filter(t => (t.delayHours ?? 0) > 0);
  const allBlocked = allTasks.filter(t => t.status === 'BLOCKED');
  const globalOnTimePct = pct(allDone.length - allLate.length, allDone.length || 1);

  // PM Decisions
  const decisions = useMemo(() => {
    const result: { level: 'danger' | 'warn' | 'ok'; text: string }[] = [];
    
    // Projets en retard
    if (overdueProjects.length > 3) {
      result.push({ level: 'danger', text: `${overdueProjects.length} projets en retard — action immédiate requise` });
    } else if (overdueProjects.length > 0) {
      result.push({ level: 'warn', text: `${overdueProjects.length} projet(s) en retard — suivi nécessaire` });
    }

    if (allBlocked.length > 5)
      result.push({ level: 'danger', text: `${allBlocked.length} tâches bloquées — action immédiate requise` });
    if (globalOnTimePct < 60)
      result.push({ level: 'danger', text: `Taux de livraison à temps critique : ${globalOnTimePct}% — revoir la planification` });
    tasksByDomain.forEach(d => {
      if (d.latePct > 40)
        result.push({ level: 'warn', text: `Domaine ${d.domain} : ${d.latePct}% des tâches livrées en retard` });
      if (d.blocked > 3)
        result.push({ level: 'warn', text: `${d.blocked} tâches bloquées en ${d.domain} — investiguer les dépendances` });
    });
    if (result.length === 0)
      result.push({ level: 'ok', text: 'Bonne santé globale — continuer le suivi hebdomadaire' });
    return result;
  }, [allBlocked, globalOnTimePct, tasksByDomain, overdueProjects]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500 text-sm">
        <RefreshCw className="animate-spin" size={18} />
        Chargement des données…
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Tableau de bord PM
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Analyse des délais, blocages et performances par domaine
            </p>
          </div>
          {/* Domain tabs */}
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {(['ALL', 'IT', 'Marketing', 'CallCenter'] as const).map(d => (
              <button
                key={d}
                onClick={() => setActiveTab(d)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === d
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {d === 'ALL' ? 'Tous' : `${DOMAIN_CFG[d].icon} ${d}`}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Total projets"      value={totalProjects}      icon={<Layers size={15}/>}       color="indigo" />
          <KPI label="Terminés"           value={completedProjects}  icon={<CheckCircle2 size={15}/>} color="green"
               sub={`${pct(completedProjects, totalProjects)}% du total`} />
          <KPI label="En cours"           value={inProgressProjects} icon={<Activity size={15}/>}     color="sky" />
          <KPI label="Taux à temps"       value={`${globalOnTimePct}%`} icon={<Target size={15}/>}
               color={globalOnTimePct >= 70 ? 'green' : 'red'}
               sub={`${allLate.length} tâches en retard`} trend={allLate.length} />
        </div>

        {/* ── Projets en retard banner ── */}
        {overdueProjects.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-2">⚠️ Projets en retard détectés</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {overdueProjects.map(p => (
                    <div key={p.id} className="bg-white/70 rounded-lg p-3 border border-red-100">
                      <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${DOMAIN_CFG[p.domain].bg} ${DOMAIN_CFG[p.domain].color}`}>
                          {DOMAIN_CFG[p.domain].icon} {p.domain}
                        </span>
                        <span className="text-red-600 font-bold">{getProjectDelay(p)} jour(s) de retard</span>
                      </div>
                      {p.endDate && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Échéance: {new Date(p.endDate).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Décisions PM ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <SectionTitle icon="🧠" title="Recommandations pour le PM" sub="Basées sur les données en temps réel" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {decisions.map((d, i) => <Decision key={i} {...d} />)}
          </div>
        </div>

        {/* ── Completion timeline ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <SectionTitle icon="📈" title="Projets terminés vs non complétés par mois"
            sub="Vue temporelle de la livraison" />
          {completionTimeline.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Pas encore de données de complétion.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={completionTimeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="gradOk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false}/>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }}/>
                <Area type="monotone" dataKey="onTime"     name="Terminés à temps" stroke="#22c55e" fill="url(#gradOk)"   strokeWidth={2}/>
                <Area type="monotone" dataKey="late"       name="En retard"        stroke="#ef4444" fill="url(#gradLate)" strokeWidth={2}/>
                <Area type="monotone" dataKey="incomplete" name="Non complétés"    stroke="#94a3b8" fill="url(#gradInc)"  strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── 2-col: Overdue projects per domain + Domain dist ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Projets en retard par domaine */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <SectionTitle icon="⏱️" title="Projets en retard par domaine" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={overdueByDomain} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="domain" tick={{ fontSize: 12 }}/>
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false}/>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
                <Bar dataKey="overdue" name="Projets en retard" radius={[6,6,0,0]}>
                  {overdueByDomain.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.overdue > 0 ? '#ef4444' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution par domaine */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <SectionTitle icon="🗂️" title="Répartition par domaine" />
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={domainDist} cx="50%" cy="50%" outerRadius={80}
                  dataKey="value" nameKey="name" label={({ name, percent }) =>
                    `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}>
                  {domainDist.map((entry, i) => (
                    <Cell key={i}
                      fill={DOMAIN_CFG[entry.name as Domain]?.chart ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Distribution par statut ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <SectionTitle icon="📊" title="Statuts des projets" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusDist} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false}/>
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90}/>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
              <Bar dataKey="value" name="Projets" radius={[0, 6, 6, 0]}>
                {statusDist.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLOR[entry.name] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Tasks: on-time vs late per domain ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <SectionTitle icon="⏱️" title="Tâches : à temps vs en retard vs bloquées — par domaine"
            sub="Sur toutes les tâches complétées" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tasksByDomain} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="domain" tick={{ fontSize: 12 }}/>
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false}/>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }}/>
              <Bar dataKey="onTime"  name="À temps"   fill="#22c55e" radius={[4,4,0,0]} stackId="a"/>
              <Bar dataKey="late"    name="En retard"  fill="#ef4444" radius={[4,4,0,0]} stackId="a"/>
              <Bar dataKey="blocked" name="Bloquées"   fill="#f59e0b" radius={[4,4,0,0]} stackId="a"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Average delay + Radar ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Délai moyen par domaine (projets en retard) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <SectionTitle icon="🕐" title="Délai moyen par domaine (jours)" sub="Projets en retard uniquement" />
            {avgDelayByDomain.every(d => d.avgDelay === 0) ? (
              <p className="text-sm text-slate-400 text-center py-12">Aucun projet en retard 🎉</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={avgDelayByDomain}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="domain" tick={{ fontSize: 12 }}/>
                  <YAxis tick={{ fontSize: 11 }}/>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [`${v} j`, 'Délai moyen']}
                    labelFormatter={(label) => `${label} (${avgDelayByDomain.find(d => d.domain === label)?.count || 0} proj.)`}
                  />
                  <Bar dataKey="avgDelay" name="Délai moyen (jours)" radius={[6,6,0,0]}>
                    {avgDelayByDomain.map((entry, i) => (
                      <Cell key={i}
                        fill={entry.avgDelay > 10 ? '#ef4444' : entry.avgDelay > 3 ? '#f59e0b' : '#22c55e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Radar santé globale */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <SectionTitle icon="🎯" title="Santé des domaines (radar)" />
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} outerRadius={80}>
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }}/>
                <Radar name="Tâches faites"  dataKey="Tâches faites"  stroke="#6366f1" fill="#6366f1" fillOpacity={0.25}/>
                <Radar name="À temps"        dataKey="À temps"        stroke="#22c55e" fill="#22c55e" fillOpacity={0.2}/>
                <Radar name="Sans blocage"   dataKey="Sans blocage"   stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }}/>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Per-domain detail cards ── */}
        <div className="space-y-5">
          <SectionTitle icon="🔍" title="Détail par domaine" sub="Cliquez pour inspecter chaque domaine" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(['IT', 'Marketing', 'CallCenter'] as Domain[]).map(dom => {
              const cfg = DOMAIN_CFG[dom];
              const domProjects = projects.filter(p => p.domain === dom);
              const domOverdue = overdueProjects.filter(p => p.domain === dom);
              const domTasks = domProjects.flatMap(p =>
                (sprints[p.id] ?? []).flatMap(s => s.tasks ?? [])
              );
              const done    = domTasks.filter(t => t.status === 'DONE').length;
              const late    = domTasks.filter(t => t.status === 'DONE' && (t.delayHours ?? 0) > 0).length;
              const blocked = domTasks.filter(t => t.status === 'BLOCKED').length;
              const onTimePct = pct(done - late, done || 1);

              return (
                <div key={dom}
                  className={`bg-white border ${cfg.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{cfg.icon}</span>
                    <h3 className={`font-bold text-base ${cfg.color}`}>{dom}</h3>
                    <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {domProjects.length} projets
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Projets total</span>
                      <span className="font-semibold">{domProjects.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Projets en retard</span>
                      <span className={`font-semibold ${domOverdue.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {domOverdue.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tâches total</span>
                      <span className="font-semibold">{domTasks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Terminées</span>
                      <span className="font-semibold text-emerald-600">{done}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">En retard</span>
                      <span className={`font-semibold ${late > 0 ? 'text-red-600' : 'text-slate-400'}`}>{late}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bloquées</span>
                      <span className={`font-semibold ${blocked > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{blocked}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-500 text-xs">Taux à temps</span>
                        <span className={`text-xs font-bold ${onTimePct >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {onTimePct}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${onTimePct >= 70 ? 'bg-emerald-400' : onTimePct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${onTimePct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}