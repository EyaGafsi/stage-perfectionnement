'use client';

import { useEffect, useState, useCallback } from "react";
import {
  User, Search, Plus, LayoutGrid, Clock,
  CheckCircle2, AlertCircle, Code, Megaphone, Headphones,
  ArrowUpRight, BarChart3, Timer, XCircle, TrendingUp, Calendar,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

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

export type AppUser = {
  id?: number; fullname?: string; name?: string; email?: string; role?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_NEST_API_URL || '';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token') || localStorage.getItem('token');
}

function readUserFromLocalStorage(): AppUser | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  } catch { return null; }
}

function decodeJwtRole(token?: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const decoded = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const obj = JSON.parse(decodeURIComponent(escape(decoded)));
    if (obj.role) return String(obj.role);
    if (Array.isArray(obj.roles) && obj.roles.length) return String(obj.roles[0]);
    if (obj.userRole) return String(obj.userRole);
    if (obj.realm_access?.roles?.length) return String(obj.realm_access.roles[0]);
    return null;
  } catch { return null; }
}

function getUserRoleNormalized(): string | null {
  const u = readUserFromLocalStorage();
  if (u?.role) return String(u.role).toLowerCase();
  if (typeof window === "undefined") return null;
  const token = getToken();
  const r = decodeJwtRole(token);
  return r ? String(r).toLowerCase() : null;
}

interface DomainLinks { details: string; sprints: string; info: string; }

function getDomainLinks(projectId: number, domain: string): DomainLinks {
  const b = `/Dashboard/project/${projectId}`;
  switch (domain) {
    case "IT":         return { details: `${b}/projectmanager_details`, sprints: `${b}/sprintslist`,          info: `${b}/sprintslist/projectsta` };
    case "Marketing":  return { details: `${b}/projectmanager_details`,              sprints: `${b}/sprintmarketinglist`,  info: `${b}/sprintmarketinglist/Dashboard` };
    case "CallCenter": return { details: `${b}/projectmanager_details`,             sprints: `${b}/sprintcallcenterlist`,   info: `${b}/sprintcallcenterlist/metrics` };
    default:           return { details: b,                             sprints: `${b}/sprintslist`,          info: `${b}/projectinfo` };
  }
}

// ─── Date state ───────────────────────────────────────────────────────────────

type DateState = "completed" | "overdue" | "critical" | "warning" | "on_track" | "no_date";

function getDateState(p: Project): DateState {
  if (p.status === "completed" || p.status === "cancelled") return "completed";
  if (!p.endDate) return "no_date";
  const diff = Math.ceil((new Date(p.endDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return "overdue";
  if (diff <= 3) return "critical";
  if (diff <= 7) return "warning";
  return "on_track";
}

function getDaysRemaining(endDate?: string): number | null {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

// ─── Auto-status logic ────────────────────────────────────────────────────────
/**
 * Computes what status a project SHOULD have based on dates.
 * Returns null if no change needed.
 *
 * Rules:
 *  - "on_hold" and "cancelled" are manual → never auto-changed
 *  - "planned" + startDate has passed → "in_progress"
 *  - Completed status is NOT auto-updated (must be done manually)
 */
function computeAutoStatus(p: Project): Project["status"] | null {
  if (p.status === "on_hold" || p.status === "cancelled") return null;
  
  // Never auto-update completed projects
  if (p.status === "completed") return null;

  const now       = Date.now();
  const startMs   = p.startDate ? new Date(p.startDate).getTime() : null;

  // startDate passed and project is still "planned" → in_progress
  if (p.status === "planned" && startMs !== null && now >= startMs) return "in_progress";

  return null;
}

// ─── Patch helper ─────────────────────────────────────────────────────────────

async function patchProjectStatus(projectId: number, newStatus: Project["status"]): Promise<boolean> {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status: newStatus }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Auto-update hook ─────────────────────────────────────────────────────────
/**
 * Checks all projects for date-driven status transitions.
 * For each project that needs a status change, fires a PATCH and updates local state.
 * Returns a log of what was updated.
 */
async function autoUpdateStatuses(
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
): Promise<{ id: number; name: string; from: string; to: string }[]> {
  const log: { id: number; name: string; from: string; to: string }[] = [];

  const updates = projects
    .map(p => ({ p, next: computeAutoStatus(p) }))
    .filter((x): x is { p: Project; next: Project["status"] } => x.next !== null && x.next !== x.p.status);

  if (updates.length === 0) return log;

  await Promise.all(
    updates.map(async ({ p, next }) => {
      const ok = await patchProjectStatus(p.id, next);
      if (ok) {
        setProjects(prev => prev.map(proj => proj.id === p.id ? { ...proj, status: next } : proj));
        log.push({ id: p.id, name: p.name, from: p.status, to: next });
      }
    })
  );

  return log;
}

// ─── Config maps ──────────────────────────────────────────────────────────────

const DOMAIN_CONFIG = {
  IT: {
    bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700",
    activeBg: "bg-indigo-600", activeText: "text-white",
    headerFrom: "from-indigo-600", headerTo: "to-indigo-500",
    accentBar: "bg-indigo-200",
    icon: <Code size={17} />, label: "Informatique",
  },
  Marketing: {
    bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700",
    activeBg: "bg-rose-500", activeText: "text-white",
    headerFrom: "from-rose-500", headerTo: "to-pink-500",
    accentBar: "bg-rose-200",
    icon: <Megaphone size={17} />, label: "Marketing",
  },
  CallCenter: {
    bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700",
    activeBg: "bg-emerald-600", activeText: "text-white",
    headerFrom: "from-emerald-600", headerTo: "to-teal-500",
    accentBar: "bg-emerald-200",
    icon: <Headphones size={17} />, label: "Centre d'appels",
  },
} as const;

const STATUS_CONFIG = {
  in_progress: { label: "En cours",   dot: "bg-amber-400",   pill: "bg-amber-100 text-amber-700 border-amber-200" },
  planned:     { label: "Planifié",   dot: "bg-blue-400",    pill: "bg-blue-100 text-blue-700 border-blue-200" },
  completed:   { label: "Terminé",    dot: "bg-emerald-400", pill: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  on_hold:     { label: "En attente", dot: "bg-orange-400",  pill: "bg-orange-100 text-orange-700 border-orange-200" },
  cancelled:   { label: "Annulé",     dot: "bg-red-400",     pill: "bg-red-100 text-red-700 border-red-200" },
} as const;

const DATE_STYLES: Record<DateState, { card: string; badge: string; label: string; icon: React.ReactNode; bar: string }> = {
  completed: { card: "border-emerald-200",                        badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Terminé",         icon: <CheckCircle2 size={11} />, bar: "bg-emerald-400" },
  overdue:   { card: "border-red-300 ring-1 ring-red-100",        badge: "bg-red-50 text-red-700 border-red-200",             label: "En retard",       icon: <XCircle size={11} />,      bar: "bg-red-500" },
  critical:  { card: "border-orange-300 ring-1 ring-orange-100",  badge: "bg-orange-50 text-orange-700 border-orange-200",    label: "Critique",        icon: <AlertCircle size={11} />,  bar: "bg-orange-500" },
  warning:   { card: "border-yellow-300",                         badge: "bg-yellow-50 text-yellow-700 border-yellow-200",    label: "Bientôt",         icon: <Timer size={11} />,        bar: "bg-yellow-400" },
  on_track:  { card: "border-slate-200",                          badge: "bg-blue-50 text-blue-700 border-blue-200",          label: "Dans les délais", icon: <TrendingUp size={11} />,   bar: "bg-blue-400" },
  no_date:   { card: "border-slate-200",                          badge: "bg-slate-100 text-slate-500 border-slate-200",      label: "Pas de date",     icon: <Calendar size={11} />,     bar: "bg-slate-300" },
};

// ─── Update log toast ─────────────────────────────────────────────────────────

const STATUS_LABELS_FR: Record<string, string> = {
  planned: "Planifié", in_progress: "En cours", completed: "Terminé",
  on_hold: "En attente", cancelled: "Annulé",
};

function AutoUpdateToast({
  log,
  onClose,
}: {
  log: { id: number; name: string; from: string; to: string }[];
  onClose: () => void;
}) {
  if (log.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-emerald-200 shadow-xl rounded-2xl p-4 space-y-2 animate-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
          <RefreshCw size={15} className="text-emerald-500" />
          {log.length} statut{log.length > 1 ? "s" : ""} mis à jour automatiquement
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>
      <ul className="space-y-1">
        {log.map(item => (
          <li key={item.id} className="text-xs text-slate-600 flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1.5">
            <span className="font-semibold text-slate-800 truncate max-w-[120px]">{item.name}</span>
            <span className="text-slate-400 text-[10px] px-1.5 py-0.5 bg-slate-200 rounded-full">{STATUS_LABELS_FR[item.from] ?? item.from}</span>
            <span className="text-slate-400">→</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">{STATUS_LABELS_FR[item.to] ?? item.to}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, roleNormalized }: { project: Project; roleNormalized: string | null }) {
  const links = getDomainLinks(project.id, project.domain);
  const d = DOMAIN_CONFIG[project.domain] ?? DOMAIN_CONFIG.IT;
  const s = STATUS_CONFIG[project.status];
  const dateState = getDateState(project);
  const ds = DATE_STYLES[dateState];
  const days = getDaysRemaining(project.endDate);

  let pct = 0;
  const showBar = !!project.endDate && project.status !== "completed" && project.status !== "cancelled" && !!project.startDate;
  if (showBar) {
    const start = new Date(project.startDate).getTime();
    const end   = new Date(project.endDate!).getTime();
    pct = Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
  }

  // Highlight if auto-managed (status doesn't match what date suggests, but here we show it as already correct)
  const isAutoManaged = project.status !== "on_hold" && project.status !== "cancelled";

  return (
    <div className={`group bg-white rounded-2xl border-2 ${ds.card} flex flex-col gap-3 p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 rounded-xl ${d.bg} border ${d.border} ${d.text}`}>{d.icon}</div>
        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
            {isAutoManaged && (
              <span title="Statut géré automatiquement selon les dates" className="ml-0.5 text-slate-400">
                <RefreshCw size={9} />
              </span>
            )}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ds.badge}`}>
            {ds.icon}{ds.label}
          </span>
        </div>
      </div>

      <div className="flex-1">
        <h3 className={`font-bold text-sm ${d.text} leading-snug line-clamp-2 group-hover:opacity-75 transition-opacity`}>{project.name}</h3>
        <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">{project.description || "Aucune description fournie."}</p>
      </div>

      {/* Dates row */}
      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        {project.startDate && (
          <span className="flex items-center gap-1">
            <Calendar size={9} />
            Début : {new Date(project.startDate).toLocaleDateString("fr-FR")}
          </span>
        )}
        {project.endDate && (
          <span className="flex items-center gap-1">
            <Calendar size={9} />
            Fin : {new Date(project.endDate).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>

      {showBar && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-medium">
            <span className="text-slate-400">{new Date(project.startDate).toLocaleDateString("fr-FR")}</span>
            <span className={days !== null && days < 0 ? "text-red-600 font-bold" : days !== null && days <= 3 ? "text-orange-500 font-bold" : "text-slate-500"}>
              {days !== null ? (days < 0 ? `${Math.abs(days)}j de retard` : `${days}j restants`) : ""}
            </span>
            <span className="text-slate-400">{new Date(project.endDate!).toLocaleDateString("fr-FR")}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${ds.bar}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between py-2 border-t border-slate-100 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full ${d.bg} border ${d.border} flex items-center justify-center`}>
            <User size={9} className={d.text} />
          </div>
          <span className="text-slate-600 font-medium truncate max-w-[110px]">{project.projectManager?.fullname || "Non assigné"}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <LayoutGrid size={10} />
          <span className="font-medium">{project.assignedTo?.length || 0} membres</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Link href={links.details} className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold ${d.bg} ${d.text} border ${d.border} hover:brightness-95 transition-all group/btn`}>
          Voir le projet
          <ArrowUpRight size={13} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </Link>
        <div className="grid grid-cols-2 gap-1.5">
          <Link href={links.sprints} className="flex items-center justify-center gap-1 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-semibold hover:bg-slate-200 transition-all">
            <Clock size={10} />
            {project.domain === "IT" ? "Sprints" : project.domain === "Marketing" ? "Campagnes" : "Tickets"}
          </Link>
          <Link href={links.info} className="flex items-center justify-center gap-1 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-semibold hover:bg-slate-200 transition-all">
            <BarChart3 size={10} />
            {project.domain === "IT" ? "Infos" : project.domain === "Marketing" ? "Stats" : "Métriques"}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function FilterPill({ active, onClick, activeClass = "bg-slate-900 text-white border-transparent shadow", children }: {
  active: boolean; onClick: () => void; activeClass?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border whitespace-nowrap ${
        active ? activeClass : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ALL_DOMAINS: Array<"IT" | "Marketing" | "CallCenter"> = ["IT", "Marketing", "CallCenter"];
const ALL_STATUSES = ["in_progress", "planned", "completed", "on_hold", "cancelled"] as const;

export default function UserProjectsPage() {
  const [projects, setProjects]               = useState<Project[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [syncing, setSyncing]                 = useState(false);
  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [roleNormalized, setRoleNormalized]   = useState<string | null>(null);
  const [updateLog, setUpdateLog]             = useState<{ id: number; name: string; from: string; to: string }[]>([]);
  const [showToast, setShowToast]             = useState(false);

  // ── Fetch projects ──
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
        return data;
      }
    } catch (e) { console.error(e); }
    return [];
  }, []);

  // ── Run auto-status sync ──
  const runAutoSync = useCallback(async (projectList: Project[]) => {
    setSyncing(true);
    const log = await autoUpdateStatuses(projectList, setProjects);
    setSyncing(false);
    if (log.length > 0) {
      setUpdateLog(log);
      setShowToast(true);
      // Auto-hide toast after 8 seconds
      setTimeout(() => setShowToast(false), 8000);
    }
  }, []);

  useEffect(() => {
    setRoleNormalized(getUserRoleNormalized());

    (async () => {
      setLoading(true);
      const data = await fetchProjects();
      setLoading(false);
      if (data && data.length > 0) {
        // Small delay so UI renders first, then we silently patch
        setTimeout(() => runAutoSync(data), 500);
      }
    })();
  }, [fetchProjects, runAutoSync]);

  // ── Manual refresh ──
  const handleManualRefresh = async () => {
    setSyncing(true);
    const data = await fetchProjects();
    if (data && data.length > 0) await runAutoSync(data);
    setSyncing(false);
  };

  const toggleDomain = (d: string) => setSelectedDomains(prev => {
    const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n;
  });
  const toggleStatus = (s: string) => setSelectedStatuses(prev => {
    const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n;
  });

  const filteredProjects = projects.filter(p => {
    const matchSearch = !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDomain = selectedDomains.size === 0 || selectedDomains.has(p.domain);
    const matchStatus = selectedStatuses.size === 0 || selectedStatuses.has(p.status);
    return matchSearch && matchDomain && matchStatus;
  });

  const overdueCount  = projects.filter(p => getDateState(p) === "overdue").length;
  const criticalCount = projects.filter(p => getDateState(p) === "critical").length;
  const hasFilters    = selectedDomains.size > 0 || selectedStatuses.size > 0 || !!searchTerm;

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Toast */}
      {showToast && <AutoUpdateToast log={updateLog} onClose={() => setShowToast(false)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Projets</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {roleNormalized === "manager"
              ? "Gérez et suivez l'avancement de vos projets."
              : "Projets auxquels vous participez."}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Sync indicator / button */}
          <button
            onClick={handleManualRefresh}
            disabled={syncing}
            title="Synchroniser les statuts selon les dates"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
              syncing
                ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Sync..." : "Sync dates"}
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text" placeholder="Rechercher..." value={searchTerm}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 outline-none text-sm bg-white shadow-sm w-52"
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {roleNormalized === "manager" && (
            <Link href="/Dashboard/projects/create" className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all font-semibold text-sm shadow-md shadow-indigo-500/20 whitespace-nowrap">
              <Plus size={15} /> Nouveau projet
            </Link>
          )}
        </div>
      </div>

      {/* Auto-sync info banner */}
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
        <RefreshCw size={12} className="text-indigo-400 shrink-0" />
        <span>
          Les statuts sont <span className="font-semibold text-slate-700">mis à jour automatiquement</span> selon les dates :
          <span className="ml-1 text-blue-600 font-medium">Planifié → En cours</span> quand la date de début arrive.
          Les statuts <span className="font-medium text-emerald-600">Terminé</span>, <span className="font-medium text-orange-600">En attente</span> et <span className="font-medium text-red-600">Annulé</span> doivent être mis à jour manuellement.
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { label: "Total",     value: projects.length,                                          bg: "bg-white",      text: "text-slate-900",  sub: "text-slate-400",  border: "border-slate-100" },
          { label: "En cours",  value: projects.filter(p => p.status === "in_progress").length,  bg: "bg-amber-50",   text: "text-amber-700",  sub: "text-amber-400",  border: "border-amber-100" },
          { label: "Terminés",  value: projects.filter(p => p.status === "completed").length,    bg: "bg-emerald-50", text: "text-emerald-700",sub: "text-emerald-400",border: "border-emerald-100" },
          { label: "En retard", value: overdueCount,                                             bg: "bg-red-50",     text: "text-red-700",    sub: "text-red-400",    border: "border-red-100" },
          { label: "Critiques", value: criticalCount,                                            bg: "bg-orange-50",  text: "text-orange-700", sub: "text-orange-400", border: "border-orange-100" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-3.5 shadow-sm`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${stat.sub}`}>{stat.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${stat.text}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
        {/* Domain */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 w-14">Domaine</span>
          <FilterPill active={selectedDomains.size === 0} onClick={() => setSelectedDomains(new Set())}>
            Tous ({projects.length})
          </FilterPill>
          {ALL_DOMAINS.map(domain => {
            const cfg = DOMAIN_CONFIG[domain];
            const count = projects.filter(p => p.domain === domain).length;
            const active = selectedDomains.has(domain);
            return (
              <FilterPill key={domain} active={active} onClick={() => toggleDomain(domain)}
                activeClass={`${cfg.activeBg} ${cfg.activeText} border-transparent shadow`}>
                <span className={active ? "text-white/90" : cfg.text}>{cfg.icon}</span>
                {cfg.label} ({count})
              </FilterPill>
            );
          })}
        </div>

        {/* Status */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 w-14">Statut</span>
          <FilterPill active={selectedStatuses.size === 0} onClick={() => setSelectedStatuses(new Set())}>
            Tous
          </FilterPill>
          {ALL_STATUSES.map(status => {
            const cfg = STATUS_CONFIG[status];
            const count = projects.filter(p => p.status === status).length;
            const active = selectedStatuses.has(status);
            return (
              <FilterPill key={status} active={active} onClick={() => toggleStatus(status)}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label} ({count})
              </FilterPill>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 w-14">Délais</span>
          {[
            { label: "Dans les délais", cls: "bg-blue-50 text-blue-700 border-blue-200" },
            { label: "Bientôt ≤7j",     cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
            { label: "Critique ≤3j",    cls: "bg-orange-50 text-orange-700 border-orange-200" },
            { label: "En retard",       cls: "bg-red-50 text-red-700 border-red-200" },
            { label: "Terminé",         cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          ].map(item => (
            <span key={item.label} className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${item.cls}`}>{item.label}</span>
          ))}
        </div>
      </div>

      {/* Filter info */}
      {hasFilters && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{filteredProjects.length}</span>
          {" "}projet{filteredProjects.length !== 1 ? "s" : ""} affiché{filteredProjects.length !== 1 ? "s" : ""}
          <button
            onClick={() => { setSelectedDomains(new Set()); setSelectedStatuses(new Set()); setSearchTerm(""); }}
            className="ml-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 font-medium transition-all"
          >
            Réinitialiser
          </button>
        </div>
      )}

      {/* Projects */}
      {filteredProjects.length > 0 ? (
        <div className="space-y-12">
          {ALL_DOMAINS.map(domain => {
            const cfg = DOMAIN_CONFIG[domain];
            const domainProjects = filteredProjects.filter(p => p.domain === domain);
            if (domainProjects.length === 0) return null;

            return (
              <section key={domain} className="space-y-5">
                {/* Domain header */}
                <div className={`bg-gradient-to-r ${cfg.headerFrom} ${cfg.headerTo} rounded-2xl px-6 py-4 flex items-center justify-between shadow-md`}>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-xl p-2 text-white">{cfg.icon}</div>
                    <div>
                      <h2 className="text-white font-bold text-base leading-none">{cfg.label}</h2>
                      <p className="text-white/60 text-xs mt-0.5">{domainProjects.length} projet{domainProjects.length > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex gap-5">
                    {ALL_STATUSES.filter(s => domainProjects.some(p => p.status === s)).map(s => (
                      <div key={s} className="text-center">
                        <p className="text-white font-bold text-base leading-none">{domainProjects.filter(p => p.status === s).length}</p>
                        <p className="text-white/50 text-[9px] uppercase font-semibold mt-0.5">{STATUS_CONFIG[s].label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status sub-groups */}
                <div className="space-y-6">
                  {ALL_STATUSES.map(status => {
                    const statusProjects = domainProjects.filter(p => p.status === status);
                    if (statusProjects.length === 0) return null;
                    const sCfg = STATUS_CONFIG[status];

                    return (
                      <div key={status} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${sCfg.dot} shrink-0`} />
                          <h3 className="text-sm font-bold text-slate-700">{sCfg.label}</h3>
                          <span className="text-xs text-slate-400 font-medium">({statusProjects.length})</span>
                          <div className={`flex-1 h-px ${cfg.accentBar}`} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {statusProjects.map(project => (
                            <ProjectCard key={project.id} project={project} roleNormalized={roleNormalized} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 p-5 rounded-full mb-4">
            <AlertCircle size={40} className="text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-slate-700">Aucun projet trouvé</h2>
          <p className="text-slate-400 text-sm text-center max-w-xs mt-1.5">
            Aucun projet ne correspond aux filtres sélectionnés.
          </p>
          <button
            onClick={() => { setSelectedDomains(new Set()); setSelectedStatuses(new Set()); setSearchTerm(""); }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
