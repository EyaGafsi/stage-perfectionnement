'use client';

import { useEffect, useState, useCallback } from "react";
import {
  Code, Megaphone, Headphones, ArrowRight,
  Calendar, User, LayoutGrid, AlertCircle,
  Search, CheckCircle2, Timer, XCircle, TrendingUp, Clock,
} from "lucide-react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Project {
  id: number;
  name: string;
  description: string;
  domain: "IT" | "Marketing" | "CallCenter";
  status: "planned" | "in_progress" | "completed" | "on_hold" | "cancelled";
  startDate: string;
  endDate?: string;
  projectManager: { id: number; fullname: string } | null;
  assignedTo: { id: number }[];
}

// ─── Config ────────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_NEST_API_URL || '';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token') || localStorage.getItem('token');
}

// ─── Domain config ─────────────────────────────────────────────────────────────

const DOMAIN_CONFIG = {
  IT: {
    label: "Informatique",
    icon: <Code size={16} />,
    gradient: "from-indigo-600 to-violet-600",
    soft: "bg-indigo-50 text-indigo-700 border-indigo-100",
    softIcon: "bg-indigo-100 text-indigo-600",
    bar: "bg-indigo-500",
    ring: "ring-indigo-200",
    taskPath: (projectId: number) => `/Dashboard/project/memberproject/${projectId}/ITTASK`,
  },

  Marketing: {
    label: "Marketing",
    icon: <Megaphone size={16} />,
    gradient: "from-rose-500 to-pink-500",
    soft: "bg-rose-50 text-rose-700 border-rose-100",
    softIcon: "bg-rose-100 text-rose-600",
    bar: "bg-rose-500",
    ring: "ring-rose-200",
    taskPath: (projectId: number) => `/Dashboard/project/memberproject/${projectId}/marketingTask`,
  },
  CallCenter: {
    label: "Centre d'appels",
    icon: <Headphones size={16} />,
    gradient: "from-emerald-600 to-teal-500",
    soft: "bg-emerald-50 text-emerald-700 border-emerald-100",
    softIcon: "bg-emerald-100 text-emerald-600",
    bar: "bg-emerald-500",
    ring: "ring-emerald-200",
    taskPath: (projectId: number) => `/Dashboard/project/memberproject/${projectId}/callcenterTask`,
  },
} as const;

const STATUS_CONFIG = {
  in_progress: { label: "En cours",    dot: "bg-amber-400",   pill: "bg-amber-50 text-amber-700 border-amber-200",   icon: <Timer size={10} /> },
  planned:     { label: "Planifié",    dot: "bg-blue-400",    pill: "bg-blue-50 text-blue-700 border-blue-200",      icon: <Clock size={10} /> },
  completed:   { label: "Terminé",     dot: "bg-emerald-400", pill: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={10} /> },
  on_hold:     { label: "En attente",  dot: "bg-orange-400",  pill: "bg-orange-50 text-orange-700 border-orange-200", icon: <AlertCircle size={10} /> },
  cancelled:   { label: "Annulé",      dot: "bg-red-400",     pill: "bg-red-50 text-red-700 border-red-200",         icon: <XCircle size={10} /> },
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getDaysRemaining(endDate?: string): number | null {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

function getProgress(startDate: string, endDate?: string): number {
  if (!endDate) return 0;
  const s = new Date(startDate).getTime();
  const e = new Date(endDate).getTime();
  const now = Date.now();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// ─── Project Card (member-simplified) ─────────────────────────────────────────

function MemberProjectCard({ project }: { project: Project }) {
  const d = DOMAIN_CONFIG[project.domain];
  const s = STATUS_CONFIG[project.status];
  const days = getDaysRemaining(project.endDate);
  const progress = getProgress(project.startDate, project.endDate);
  const isActive = project.status === "in_progress";
  const taskHref = d.taskPath(project.id);

  const daysColor =
    days === null ? "text-slate-400" :
    days < 0 ? "text-red-600 font-bold" :
    days <= 3 ? "text-orange-500 font-bold" :
    days <= 7 ? "text-yellow-600 font-semibold" :
    "text-slate-500";

  return (
    <div className={`group relative bg-white rounded-2xl border border-slate-200 overflow-hidden
      flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
      ${isActive ? `ring-1 ${d.ring}` : ""}`}>

      {/* Top accent line */}
      <div className={`h-1 w-full bg-gradient-to-r ${d.gradient}`} />

      <div className="flex flex-col gap-3 p-5 flex-1">

        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${d.soft}`}>
            {d.icon}
            {d.label}
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${s.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        </div>

        {/* Title + description */}
        <div>
          <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-slate-900">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Progress bar (only when active and dates exist) */}
        {project.startDate && project.endDate && project.status !== "cancelled" && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-medium">Progression</span>
              <span className={`text-[10px] font-bold ${progress >= 80 ? "text-orange-500" : "text-slate-500"}`}>
                {progress}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${d.bar}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-auto">
          {project.startDate && (
            <span className="flex items-center gap-1">
              <Calendar size={9} />
              {fmt(project.startDate)}
              {project.endDate && <> → {fmt(project.endDate)}</>}
            </span>
          )}
          {days !== null && project.status !== "completed" && project.status !== "cancelled" && (
            <span className={`ml-auto text-[11px] ${daysColor}`}>
              {days < 0 ? `${Math.abs(days)}j de retard` : `${days}j restants`}
            </span>
          )}
        </div>

        {/* PM row */}
        <div className="flex items-center gap-2 py-2 border-t border-slate-100 text-[11px]">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${d.softIcon}`}>
            <User size={9} />
          </div>
          <span className="text-slate-500 font-medium truncate">
            {project.projectManager?.fullname || "PM non assigné"}
          </span>
          <span className="ml-auto flex items-center gap-1 text-slate-400">
            <LayoutGrid size={9} />
            {project.assignedTo?.length || 0} membres
          </span>
        </div>
      </div>

      {/* ─── THE SINGLE ACTION BUTTON ─── */}
      <div className="px-5 pb-5">
        <Link
          href={taskHref}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
            bg-gradient-to-r ${d.gradient} text-white text-sm font-bold
            shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200
            group/btn`}
        >
          Mes tâches
          <ArrowRight
            size={15}
            className="group-hover/btn:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
}

// ─── Domain Section ────────────────────────────────────────────────────────────

function DomainSection({ domain, projects }: {
  domain: "IT" | "Marketing" | "CallCenter";
  projects: Project[];
}) {
  const [open, setOpen] = useState(true);
  const d = DOMAIN_CONFIG[domain];

  const activeCount    = projects.filter(p => p.status === "in_progress").length;
  const completedCount = projects.filter(p => p.status === "completed").length;

  return (
    <section className="space-y-4">
      {/* Section header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 group"
      >
        <div className={`flex items-center gap-2.5 bg-gradient-to-r ${d.gradient} text-white px-5 py-3 rounded-2xl shadow-md flex-1`}>
          <div className="bg-white/20 rounded-lg p-1.5">{d.icon}</div>
          <div className="flex-1 text-left">
            <p className="font-bold text-sm leading-none">{d.label}</p>
            <p className="text-white/60 text-[11px] mt-0.5">
              {projects.length} projet{projects.length > 1 ? "s" : ""}
              {activeCount > 0 && ` · ${activeCount} en cours`}
              {completedCount > 0 && ` · ${completedCount} terminé${completedCount > 1 ? "s" : ""}`}
            </p>
          </div>
          <span className={`text-white/70 text-lg transition-transform duration-200 ${open ? "" : "-rotate-90"}`}>
            ▾
          </span>
        </div>
      </button>

      {/* Cards grid */}
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <MemberProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const ALL_DOMAINS: Array<"IT" | "Marketing" | "CallCenter"> = ["IT", "Marketing", "CallCenter"];

export default function MemberProjectsPage() {
  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<string>("all");

  const fetchProjects = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: Project[] = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // ── Filter ──
  const filtered = projects.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const byDomain = {
    IT:         filtered.filter(p => p.domain === "IT"),
    Marketing:  filtered.filter(p => p.domain === "Marketing"),
    CallCenter: filtered.filter(p => p.domain === "CallCenter"),
  };

  const activeTotal = projects.filter(p => p.status === "in_progress").length;

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mes Projets</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {projects.length} projet{projects.length !== 1 ? "s" : ""} assigné{projects.length !== 1 ? "s" : ""}
            {activeTotal > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {activeTotal} en cours
              </span>
            )}
          </p>
        </div>

        {/* Search + status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 outline-none text-sm bg-white shadow-sm w-48"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {[
              { value: "all",         label: "Tous" },
              { value: "in_progress", label: "En cours" },
              { value: "planned",     label: "Planifié" },
              { value: "completed",   label: "Terminé" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === opt.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {ALL_DOMAINS.map(domain => {
          const d = DOMAIN_CONFIG[domain];
          const count = projects.filter(p => p.domain === domain).length;
          const active = projects.filter(p => p.domain === domain && p.status === "in_progress").length;
          return (
            <div key={domain} className={`bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm`}>
              <div className={`p-2.5 rounded-xl ${d.softIcon}`}>
                {d.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800 leading-none">{count}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{d.label}</p>
                {active > 0 && (
                  <p className="text-[10px] text-amber-600 font-semibold">{active} actif{active > 1 ? "s" : ""}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 p-5 rounded-full mb-4">
            <AlertCircle size={36} className="text-slate-300" />
          </div>
          <h2 className="text-base font-bold text-slate-700">Aucun projet trouvé</h2>
          <p className="text-slate-400 text-sm mt-1">
            {search || statusFilter !== "all"
              ? "Essayez de modifier vos filtres."
              : "Vous n'êtes assigné à aucun projet pour le moment."}
          </p>
          {(search || statusFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setStatus("all"); }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
            >
              Réinitialiser
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {ALL_DOMAINS.map(domain => {
            if (byDomain[domain].length === 0) return null;
            return (
              <DomainSection
                key={domain}
                domain={domain}
                projects={byDomain[domain]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}