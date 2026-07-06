"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Building2, Users, Briefcase, TrendingUp, TrendingDown,
  ArrowUpRight, Activity, Globe, RefreshCw, ChevronRight,
  Shield, Zap, AlertTriangle, CheckCircle2, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/* ─── Types ─────────────────────────────────────────── */
interface Company {
  id: number;
  name: string;
  email?: string;
  createdAt?: string;
}
interface User {
  id: number;
  fullname: string;
  role: string;
  isActive: boolean;
  company?: { id: number; name: string } | null;
  createdAt?: string;
}
interface Project {
  id: number;
  name: string;
  status: string;
  domain: string;
  company?: { id: number } | null;
  companyId?: number;
  createdAt?: string;
}

/* ─── Helpers ────────────────────────────────────────── */
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token") || localStorage.getItem("token");
}
const API = process.env.NEXT_PUBLIC_NEST_API_URL || "";
async function apiFetch(path: string) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

/* ─── Palette ─────────────────────────────────────────── */
const DOMAIN_COLORS: Record<string, string> = {
  IT: "#6366f1", Marketing: "#ec4899", CallCenter: "#10b981",
};
const STATUS_COLORS: Record<string, string> = {
  in_progress: "#3b82f6", completed: "#22c55e",
  planned: "#a78bfa", on_hold: "#f59e0b", cancelled: "#ef4444",
};
const STATUS_FR: Record<string, string> = {
  in_progress: "En cours", completed: "Terminé",
  planned: "Planifié", on_hold: "En attente", cancelled: "Annulé",
};
const CHART_COLORS = ["#6366f1","#22d3ee","#10b981","#f59e0b","#ec4899","#a78bfa","#ef4444"];

/* ─── Custom Tooltip ─────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur border border-slate-700/60 rounded-xl px-4 py-3 shadow-2xl text-xs">
      {label && <p className="text-slate-400 font-semibold mb-2">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── KPI Card ───────────────────────────────────────── */
function KpiCard({
  label, value, sub, icon, trend, gradient, delay = 0,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; trend?: number; gradient: string; delay?: number;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 p-5 shadow-xl"
      style={{
        background: gradient,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Decorative circle */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 bg-white" />
      <div className="absolute -right-2 -bottom-4 w-14 h-14 rounded-full opacity-10 bg-white" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">{label}</p>
          <p className="mt-1.5 text-3xl font-black text-white tracking-tight">{value}</p>
          {sub && (
            <p className="mt-1 text-xs text-white/60 font-medium">{sub}</p>
          )}
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {trend >= 0
                ? <TrendingUp size={12} className="text-white/80" />
                : <TrendingDown size={12} className="text-white/80" />}
              <span className="text-xs font-bold text-white/80">
                {trend >= 0 ? "+" : ""}{trend}% ce mois
              </span>
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-white/20 text-white">{icon}</div>
      </div>
    </div>
  );
}

/* ─── Company Row Card ───────────────────────────────── */
function CompanyRow({
  company, memberCount, projectCount, activeProjects,
}: {
  company: Company;
  memberCount: number;
  projectCount: number;
  activeProjects: number;
}) {
  const health = projectCount === 0 ? 0 : Math.round((activeProjects / projectCount) * 100);
  return (
    <div className="group flex items-center gap-4 px-5 py-4 rounded-2xl
                    bg-white border border-slate-100 hover:border-indigo-200
                    hover:shadow-lg hover:shadow-indigo-50 transition-all duration-200
                    cursor-pointer">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600
                      flex items-center justify-center text-white font-black text-base
                      shadow-md shadow-indigo-200 shrink-0">
        {company.name[0].toUpperCase()}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
          {company.name}
        </p>
        <p className="text-xs text-slate-400 font-medium">ID #{company.id}</p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 text-center">
        <div>
          <p className="text-lg font-black text-slate-800">{memberCount}</p>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Membres</p>
        </div>
        <div>
          <p className="text-lg font-black text-slate-800">{projectCount}</p>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Projets</p>
        </div>
        <div>
          <p className="text-lg font-black text-indigo-600">{activeProjects}</p>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Actifs</p>
        </div>
      </div>

      {/* Health bar */}
      <div className="hidden md:block w-28">
        <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
          <span>Activité</span><span>{health}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
            style={{ width: `${health}%` }}
          />
        </div>
      </div>

      <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────── */
export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users,     setUsers]     = useState<User[]>([]);
  const [projects,  setProjects]  = useState<Project[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    const [c, u, p] = await Promise.all([
      apiFetch("/companies"),
      apiFetch("/users"),
      apiFetch("/projects"),
    ]);
    if (c) setCompanies(Array.isArray(c) ? c : [c]);
    if (u) setUsers(Array.isArray(u) ? u : []);
    if (p) setProjects(Array.isArray(p) ? p : []);
    setLastUpdate(new Date());
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  /* ─── Derived stats ─────────────────────────────── */
  const totalCompanies = companies.length;
  const totalUsers     = users.length;
  const activeUsers    = users.filter(u => u.isActive).length;
  const totalProjects  = projects.length;
  const activeProjects = projects.filter(p => p.status === "in_progress").length;

  // Per-company stats
  const companyStats = useMemo(() => {
    return companies.map(c => {
      const members = users.filter(u => u.company?.id === c.id).length;
      const projs   = projects.filter(p =>
        p.company?.id === c.id || p.companyId === c.id
      );
      const active  = projs.filter(p => p.status === "in_progress").length;
      return { company: c, memberCount: members, projectCount: projs.length, activeProjects: active };
    }).sort((a, b) => b.projectCount - a.projectCount);
  }, [companies, users, projects]);

  // Growth: new users by month (last 6 months)
  const growthData = useMemo(() => {
    const months: Record<string, { users: number; projects: number; companies: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" });
      months[key] = { users: 0, projects: 0, companies: 0 };
    }
    users.forEach(u => {
      if (!u.createdAt) return;
      const d = new Date(u.createdAt);
      const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" });
      if (months[key]) months[key].users++;
    });
    projects.forEach(p => {
      if (!p.createdAt) return;
      const d = new Date(p.createdAt);
      const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" });
      if (months[key]) months[key].projects++;
    });
    companies.forEach(c => {
      if (!c.createdAt) return;
      const d = new Date(c.createdAt);
      const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" });
      if (months[key]) months[key].companies++;
    });
    return Object.entries(months).map(([month, v]) => ({ month, ...v }));
  }, [users, projects, companies]);

  // Domain distribution
  const domainDist = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach(p => { map[p.domain] = (map[p.domain] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Status distribution
  const statusDist = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach(p => { map[p.status] = (map[p.status] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({
      name: STATUS_FR[name] ?? name, value, key: name,
    }));
  }, [projects]);

  // Top companies by member count
  const topByMembers = useMemo(
    () => [...companyStats].sort((a, b) => b.memberCount - a.memberCount).slice(0, 8),
    [companyStats]
  );

  // Role distribution
  const roleDist = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach(u => {
      const label = u.role.replace(/_/g, " ");
      map[label] = (map[label] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [users]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600
                        flex items-center justify-center shadow-xl animate-pulse">
          <Shield size={22} className="text-white" />
        </div>
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Chargement du tableau de bord…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/80">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600
                               flex items-center justify-center shadow-md">
                <Shield size={14} className="text-white" />
              </span>
              Super Admin
              <span className="text-slate-300 font-light mx-1">·</span>
              <span className="text-slate-400 font-semibold text-base">Tableau de bord</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:block">
              Mis à jour : {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200
                         text-xs font-semibold text-slate-600 hover:border-indigo-300
                         hover:text-indigo-600 transition-all bg-white shadow-sm"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Sociétés" value={totalCompanies}
            sub={`${companyStats.filter(c => c.projectCount > 0).length} avec projets`}
            icon={<Building2 size={20} />}
            gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
            trend={12} delay={0}
          />
          <KpiCard
            label="Utilisateurs" value={totalUsers}
            sub={`${activeUsers} actifs`}
            icon={<Users size={20} />}
            gradient="linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)"
            trend={8} delay={50}
          />
          <KpiCard
            label="Projets" value={totalProjects}
            sub={`${activeProjects} en cours`}
            icon={<Briefcase size={20} />}
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            trend={5} delay={100}
          />
          <KpiCard
            label="Croissance" value={`+${Math.round((activeUsers / Math.max(totalUsers, 1)) * 100)}%`}
            sub="taux d'activité"
            icon={<TrendingUp size={20} />}
            gradient="linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
            delay={150}
          />
        </div>

        {/* ── Growth Chart (full width) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-black text-slate-800">Croissance de la plateforme</h2>
              <p className="text-xs text-slate-400 mt-0.5">Nouveaux utilisateurs, projets et sociétés — 6 derniers mois</p>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full
                            bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold">
              <Activity size={12} />
              Live
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                {[
                  { id: "gUsers",    c: "#6366f1" },
                  { id: "gProjects", c: "#10b981" },
                  { id: "gCompanies",c: "#f59e0b" },
                ].map(({ id, c }) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
              <Area type="monotone" dataKey="users"     name="Utilisateurs" stroke="#6366f1" fill="url(#gUsers)"    strokeWidth={2.5} dot={{ r: 3, fill: "#6366f1" }} />
              <Area type="monotone" dataKey="projects"  name="Projets"      stroke="#10b981" fill="url(#gProjects)" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} />
              <Area type="monotone" dataKey="companies" name="Sociétés"     stroke="#f59e0b" fill="url(#gCompanies)"strokeWidth={2.5} dot={{ r: 3, fill: "#f59e0b" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── 3-col charts row ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Domain pie */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-black text-slate-700 mb-4">Projets par domaine</h3>
            {domainDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={domainDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    dataKey="value" nameKey="name" paddingAngle={3}
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                    labelLine={false}>
                    {domainDist.map((e, i) => (
                      <Cell key={i} fill={DOMAIN_COLORS[e.name] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-300 text-sm">
                Aucune donnée
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-black text-slate-700 mb-4">Statuts des projets</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusDist} layout="vertical" margin={{ left: 4, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} width={68} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Projets" radius={[0, 6, 6, 0]}>
                  {statusDist.map((e, i) => (
                    <Cell key={i} fill={STATUS_COLORS[e.key] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Role distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-black text-slate-700 mb-4">Top rôles utilisateurs</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={roleDist} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Utilisateurs" radius={[6, 6, 0, 0]}>
                  {roleDist.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Top companies by members bar ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-black text-slate-800">Membres par société</h2>
              <p className="text-xs text-slate-400 mt-0.5">Top {topByMembers.length} sociétés</p>
            </div>
            <BarChart3 size={18} className="text-slate-300" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topByMembers.map(cs => ({
              name: cs.company.name.length > 12 ? cs.company.name.slice(0, 12) + "…" : cs.company.name,
              Membres: cs.memberCount,
              Projets: cs.projectCount,
            }))} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Membres" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Projets" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Company list table ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-slate-800">Toutes les sociétés</h2>
              <p className="text-xs text-slate-400 mt-0.5">{totalCompanies} sociétés enregistrées</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Projets actifs
            </div>
          </div>
          <div className="space-y-2.5">
            {companyStats.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200
                              p-12 text-center text-slate-400 text-sm font-medium">
                Aucune société enregistrée
              </div>
            ) : (
              companyStats.map(cs => (
                <CompanyRow key={cs.company.id} {...cs} />
              ))
            )}
          </div>
        </div>

        {/* ── Summary Footer ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <CheckCircle2 size={16} />,
              label: "Projets terminés",
              value: projects.filter(p => p.status === "completed").length,
              color: "text-emerald-600 bg-emerald-50 border-emerald-100",
            },
            {
              icon: <AlertTriangle size={16} />,
              label: "Projets en attente",
              value: projects.filter(p => p.status === "on_hold").length,
              color: "text-amber-600 bg-amber-50 border-amber-100",
            },
            {
              icon: <Zap size={16} />,
              label: "Utilisateurs inactifs",
              value: users.filter(u => !u.isActive).length,
              color: "text-red-500 bg-red-50 border-red-100",
            },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${item.color}`}>
              <div className={`p-2 rounded-xl ${item.color.split(" ")[1]} ${item.color.split(" ")[0]}`}>
                {item.icon}
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800">{item.value}</p>
                <p className="text-xs font-semibold text-slate-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}