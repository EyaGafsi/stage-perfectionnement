
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Search, Award, TrendingUp, TrendingDown,
  BarChart2, Activity, Star, Eye, Building2, Filter,
  Download, AlertCircle, XCircle, Loader2, Medal, Target, Minus,
  Clock, ChevronRight, Sparkles, RefreshCw, FolderKanban, CheckCircle, Briefcase,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";

// ─── Enums ────────────────────────────────────────────────────────────────────

enum UserRole {
  SUPER_ADMIN = "super_admin", ADMIN_COMPANY = "admin_company",
  MANAGER = "manager", PROJECT_MANAGER = "project_manager",
  CALL_CENTER_MANAGER = "call_center_manager", SALES_MANAGER = "sales_manager",
  MARKETING_MANAGER = "marketing_manager", QUALITY_MANAGER = "quality_manager",
  HR_MANAGER = "hr_manager", AGENT_TELEPRO = "agent_telepro",
  COMMERCIAL = "commercial", MARKETING_AGENT = "marketing_agent",
  QUALITE_AGENT = "qualite_agent", TECH_SUPPORT = "tech_support", MEMBER = "member",
}

enum EmploymentStatus {
  ACTIVE = "active", INACTIVE = "inactive",
  ON_LEAVE = "on_leave", TERMINATED = "terminated",
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company { id: number; name: string }
interface User {
  id: number; fullname: string; email: string; role: UserRole;
  memberlevel?: string | null; company?: Company | null; isActive: boolean;
}
interface MemberProfile {
  id: number; userId: number; employmentStatus: EmploymentStatus;
  position: string | null; globalScore: number; grade: string;
  totalTasksDone: number; onTimeRate: number; attendanceRate: number;
  performanceRating: number; itScore: number; marketingScore: number;
  callCenterScore: number; itTasksDone: number; marketingTasksDone: number;
  callCenterTasksDone: number; scoreEvolution: number | null;
  baseSalary: number | null; bonuses: number;
}
interface UserWithProfile extends User { profile?: MemberProfile | null; }
interface Project {
  id: number; name: string; status: string; domain: string;
  startDate?: string; endDate?: string; isActive?: boolean;
  assignedTo?: { id: number; fullname: string }[];
  projectManager?: { id: number; fullname: string };
}

type SortField = "fullname" | "globalScore" | "grade" | "totalTasksDone" | "onTimeRate" | "attendanceRate" | "performanceRating";
type SortDir = "asc" | "desc";
type ViewMode = "cards" | "table" | "charts";

// ─── Config ───────────────────────────────────────────────────────────────────

const GRADE_CFG: Record<string, {
  color: string; bg: string; border: string; bar: string;
  rank: number; chartColor: string; textClass: string; bgClass: string; borderClass: string;
}> = {
  "A+": { color: "#065f46", bg: "#d1fae5", border: "#a7f3d0", bar: "linear-gradient(90deg,#059669,#10b981)", rank:1, chartColor:"#059669", textClass:"text-emerald-700", bgClass:"bg-emerald-100", borderClass:"border-emerald-200" },
  "A":  { color: "#0f766e", bg: "#ccfbf1", border: "#99f6e4", bar: "linear-gradient(90deg,#0d9488,#14b8a6)", rank:2, chartColor:"#14b8a6", textClass:"text-teal-700",    bgClass:"bg-teal-100",    borderClass:"border-teal-200" },
  "B":  { color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe", bar: "linear-gradient(90deg,#3b82f6,#60a5fa)", rank:3, chartColor:"#3b82f6", textClass:"text-blue-700",    bgClass:"bg-blue-100",    borderClass:"border-blue-200" },
  "C":  { color: "#92400e", bg: "#fef3c7", border: "#fde68a", bar: "linear-gradient(90deg,#d97706,#f59e0b)", rank:4, chartColor:"#f59e0b", textClass:"text-amber-700",   bgClass:"bg-amber-100",   borderClass:"border-amber-200" },
  "D":  { color: "#9a3412", bg: "#fed7aa", border: "#fdba74", bar: "linear-gradient(90deg,#ea580c,#f97316)", rank:5, chartColor:"#f97316", textClass:"text-orange-700",  bgClass:"bg-orange-100",  borderClass:"border-orange-200" },
  "F":  { color: "#991b1b", bg: "#fee2e2", border: "#fecaca", bar: "linear-gradient(90deg,#dc2626,#ef4444)", rank:6, chartColor:"#ef4444", textClass:"text-red-700",     bgClass:"bg-red-100",     borderClass:"border-red-200" },
};

const STATUS_CFG: Record<EmploymentStatus, { label: string; dot: string; bg: string; color: string; twBg: string; twText: string; twBorder: string }> = {
  [EmploymentStatus.ACTIVE]:     { label:"Actif",   dot:"#14b8a6", bg:"#f0fdfa", color:"#0f766e", twBg:"bg-teal-50",   twText:"text-teal-700",   twBorder:"border-teal-200" },
  [EmploymentStatus.INACTIVE]:   { label:"Inactif", dot:"#94a3b8", bg:"#f8fafc", color:"#475569", twBg:"bg-slate-50",  twText:"text-slate-600",  twBorder:"border-slate-200" },
  [EmploymentStatus.ON_LEAVE]:   { label:"Congé",   dot:"#f59e0b", bg:"#fffbeb", color:"#92400e", twBg:"bg-amber-50",  twText:"text-amber-700",  twBorder:"border-amber-200" },
  [EmploymentStatus.TERMINATED]: { label:"Résilié", dot:"#ef4444", bg:"#fff1f2", color:"#991b1b", twBg:"bg-rose-50",   twText:"text-rose-700",   twBorder:"border-rose-200" },
};

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  [UserRole.MEMBER]: "Membre",
  [UserRole.PROJECT_MANAGER]: "Chef de Projet",
};

const ROLE_BADGE: Partial<Record<UserRole, { bg: string; text: string; border: string; dot: string }>> = {
  [UserRole.MEMBER]: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", dot: "#0891b2" },
  [UserRole.PROJECT_MANAGER]: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "#7c3aed" },
};

const DOMAIN_COLORS: Record<string, string> = {
  IT:"#0ea5e9", Marketing:"#d946ef", CallCenter:"#f59e0b",
};

// ─── PM Project Metrics Helpers ──────────────────────────────────────────────

function getPMProjects(userId: number, projects: Project[]) {
  return projects.filter(pr => pr.projectManager?.id === userId);
}

function getPMMetrics(userId: number, projects: Project[]) {
  const managed = getPMProjects(userId, projects);
  const completed = managed.filter(p => p.status === "completed").length;
  const lateProjects = managed.filter(p => isLate(p)).length;
  const inProgress = managed.filter(p => p.status === "in_progress").length;
  const completionRate = managed.length > 0 ? Math.round((completed / managed.length) * 100) : 0;
  return { managed: managed.length, completed, lateProjects, inProgress, completionRate };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (n: string) => n.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
const scoreToPercent = (s: number) => Math.min(100, Math.round((s / 120) * 100));
const isLate = (p: Project) => p.status !== "completed" && !!p.endDate && new Date(p.endDate) < new Date();

function getMedal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent = false, icon }: {
  label: string; value: string | number; sub?: string; accent?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-4 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
      ${accent
        ? "bg-gradient-to-br from-teal-500 to-cyan-500 border-teal-400 text-white shadow-teal-200/60 shadow-lg"
        : "bg-white border-slate-100 shadow-sm"
      }
    `}>
      {accent && <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />}
      <div className="flex items-start justify-between mb-2">
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${accent ? "text-teal-100" : "text-slate-400"}`}>{label}</p>
        {icon && <span className={accent ? "text-teal-100" : "text-teal-400"}>{icon}</span>}
      </div>
      <p className={`text-xl font-bold leading-none ${accent ? "text-white" : "text-slate-800"}`}>{value}</p>
      {sub && <p className={`text-[11px] mt-1.5 ${accent ? "text-teal-100" : "text-slate-400"}`}>{sub}</p>}
    </div>
  );
}

function ScoreBar({ value, barStyle }: { value: number; barStyle: string }) {
  return (
    <div className="h-1 rounded-full bg-slate-100 overflow-hidden w-full">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: barStyle }} />
    </div>
  );
}

function StyledSelect({ value, onChange, options, icon }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-teal-50/50 border border-teal-100 rounded-xl px-3 py-2 flex-1 min-w-[130px]">
      {icon && <span className="text-teal-400 flex-shrink-0">{icon}</span>}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="bg-transparent border-none outline-none text-[12px] text-teal-800 font-semibold cursor-pointer w-full"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SectionCard({ title, icon, children, className = "" }: {
  title?: string; icon?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-slate-50">
          {icon && <span className="text-teal-500">{icon}</span>}
          <h2 className="text-[13px] font-bold text-slate-700 tracking-tight">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function FmtPct({ v }: { v: number | undefined }) {
  if (v === undefined || v === null) return <span className="text-slate-300 text-xs">—</span>;
  const pct = v <= 1 ? v * 100 : v;
  const cls = pct >= 80 ? "text-teal-700" : pct >= 60 ? "text-amber-600" : "text-red-600";
  return <span className={`font-bold ${cls}`}>{pct.toFixed(0)}%</span>;
}

// ─── Charts Section ───────────────────────────────────────────────────────────

function ChartsSection({ users, projects }: { users: UserWithProfile[]; projects: Project[] }) {
  const wp = users.filter(u => u.profile);

  const gradeDist = useMemo(() => {
    const map: Record<string, number> = {};
    wp.forEach(u => { const g = u.profile!.grade; map[g] = (map[g] ?? 0) + 1; });
    return Object.entries(GRADE_CFG).filter(([g]) => map[g])
      .map(([grade, cfg]) => ({ grade, count: map[grade] ?? 0, fill: cfg.chartColor }));
  }, [wp]);

  const scoreDist = useMemo(() => {
    const b = [
      { range:"0–20",min:0,max:20,count:0 }, { range:"20–40",min:20,max:40,count:0 },
      { range:"40–60",min:40,max:60,count:0 }, { range:"60–80",min:60,max:80,count:0 },
      { range:"80–100",min:80,max:100,count:0 }, { range:"100+",min:100,max:121,count:0 },
    ];
    wp.forEach(u => {
      const s = Number(u.profile!.globalScore);
      const bk = b.find(x => s >= x.min && s < x.max) ?? b[b.length - 1];
      bk.count++;
    });
    return b;
  }, [wp]);

  const projStatus = useMemo(() => [
    { name:"Terminés",  value: projects.filter(p => p.status === "completed").length,            color:"#14b8a6" },
    { name:"En retard", value: projects.filter(p => isLate(p)).length,                           color:"#ef4444" },
    { name:"En cours",  value: projects.filter(p => p.status === "in_progress" && !isLate(p)).length, color:"#3b82f6" },
    { name:"Planifiés", value: projects.filter(p => p.status === "planned").length,              color:"#94a3b8" },
  ].filter(d => d.value > 0), [projects]);

  const domainRadar = useMemo(() => [
    { domain:"IT",          score: wp.length ? wp.reduce((s,u) => s + Number(u.profile!.itScore ?? 0), 0) / wp.length : 0 },
    { domain:"Marketing",   score: wp.length ? wp.reduce((s,u) => s + Number(u.profile!.marketingScore ?? 0), 0) / wp.length : 0 },
    { domain:"Call Center", score: wp.length ? wp.reduce((s,u) => s + Number(u.profile!.callCenterScore ?? 0), 0) / wp.length : 0 },
  ], [wp]);

  const tasksByDomain = useMemo(() =>
    wp.map(u => ({
      name: u.fullname.split(" ")[0],
      IT: u.profile!.itTasksDone ?? 0,
      Marketing: u.profile!.marketingTasksDone ?? 0,
      CallCenter: u.profile!.callCenterTasksDone ?? 0,
    })).filter(u => u.IT + u.Marketing + u.CallCenter > 0)
      .sort((a, b) => (b.IT + b.Marketing + b.CallCenter) - (a.IT + a.Marketing + a.CallCenter))
      .slice(0, 12),
    [wp]
  );

  const ttip = {
    contentStyle: { borderRadius: 14, border: "1.5px solid #99f6e4", fontSize: 12 }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionCard title="Distribution des grades" icon={<Award size={15}/>}>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={gradeDist} margin={{ top:0, right:8, bottom:0, left:-24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" vertical={false}/>
            <XAxis dataKey="grade" tick={{ fontSize:12, fontWeight:600 }}/>
            <YAxis tick={{ fontSize:11 }} allowDecimals={false}/>
            <Tooltip {...ttip} formatter={(v:any) => [v, "Employés"]}/>
            <Bar dataKey="count" name="Employés" radius={[8,8,0,0]} maxBarSize={44}>
              {gradeDist.map((e,i) => <Cell key={i} fill={e.fill}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Distribution des scores" icon={<BarChart2 size={15}/>}>
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={scoreDist} margin={{ top:0, right:8, bottom:0, left:-24 }}>
            <defs>
              <linearGradient id="sghr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" vertical={false}/>
            <XAxis dataKey="range" tick={{ fontSize:10 }}/>
            <YAxis tick={{ fontSize:11 }} allowDecimals={false}/>
            <Tooltip {...ttip} formatter={(v:any) => [v, "Employés"]}/>
            <Area type="monotone" dataKey="count" name="Employés"
              stroke="#14b8a6" fill="url(#sghr)" strokeWidth={2.5}/>
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Statut des projets" icon={<Clock size={15}/>}>
        {projStatus.length === 0
          ? <p className="text-center text-slate-300 text-sm py-8">Aucun projet</p>
          : (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={projStatus} cx="50%" cy="50%" outerRadius={70} innerRadius={35}
                  dataKey="value" nameKey="name"
                  label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                  {projStatus.map((e, i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize:11 }}/>
                <Tooltip {...ttip}/>
              </PieChart>
            </ResponsiveContainer>
          )
        }
      </SectionCard>

      <SectionCard title="Scores moyens par domaine" icon={<Activity size={15}/>}>
        <ResponsiveContainer width="100%" height={190}>
          <RadarChart data={domainRadar} outerRadius={65}>
            <PolarGrid stroke="rgba(20,184,166,.2)"/>
            <PolarAngleAxis dataKey="domain" tick={{ fontSize:11 }}/>
            <Radar name="Score" dataKey="score" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.25} strokeWidth={2}/>
            <Tooltip {...ttip} formatter={(v: number) => [v.toFixed(1), "Score moyen"]}/>
          </RadarChart>
        </ResponsiveContainer>
      </SectionCard>

      {tasksByDomain.length > 0 && (
        <SectionCard title="Tâches par domaine (top employés)" icon={<Target size={15}/>} className="col-span-1 md:col-span-2">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={tasksByDomain} margin={{ top:0, right:8, bottom:0, left:-24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize:11 }}/>
              <YAxis tick={{ fontSize:11 }} allowDecimals={false}/>
              <Tooltip {...ttip}/>
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize:11 }}/>
              <Bar dataKey="IT" name="IT" fill={DOMAIN_COLORS.IT} stackId="t"/>
              <Bar dataKey="Marketing" name="Marketing" fill={DOMAIN_COLORS.Marketing} stackId="t"/>
              <Bar dataKey="CallCenter" name="Call Center" fill={DOMAIN_COLORS.CallCenter} radius={[5,5,0,0]} stackId="t"/>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HRScoreboardPage() {
  const router = useRouter();

  const [users, setUsers]       = useState<UserWithProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [view, setView]         = useState<ViewMode>("cards");

  const [search,     setSearch]     = useState("");
  const [grade,      setGrade]      = useState("ALL");
  const [status,     setStatus]     = useState("ALL");
  const [role,       setRole]       = useState("ALL");
  const [showNoProf, setShowNoProf] = useState(true);
  const [sortField,  setSortField]  = useState<SortField>("globalScore");
  const [sortDir,    setSortDir]    = useState<SortDir>("desc");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("Token manquant");
        const h = { Authorization: `Bearer ${token}` };
        const base = process.env.NEXT_PUBLIC_NEST_API_URL;
        const [uR, pR, prR] = await Promise.all([
          fetch(`${base}/users`, { headers: h }),
          fetch(`${base}/member-profiles`, { headers: h }),
          fetch(`${base}/projects`, { headers: h }),
        ]);
        if (!uR.ok) throw new Error("Impossible de charger les utilisateurs");
        const u: User[] = await uR.json();
        const p: MemberProfile[] = pR.ok ? await pR.json() : [];
        const pr: Project[] = prR.ok ? await prR.json() : [];
        const pm = new Map(p.map(x => [x.userId, x]));

        const EVALUATED_ROLES = [
          UserRole.MEMBER,
          UserRole.PROJECT_MANAGER,
        ];

        const evaluatedUsers = u.filter(x => EVALUATED_ROLES.includes(x.role));
        setUsers(evaluatedUsers.map(x => ({ ...x, profile: pm.get(x.id) ?? null })));
        setProjects(pr);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = [...users];
    if (!showNoProf) list = list.filter(u => u.profile);
    list = list.filter(u => {
      const q = search.toLowerCase();
      return (
        (!q || u.fullname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
        (grade  === "ALL" || u.profile?.grade === grade) &&
        (status === "ALL" || u.profile?.employmentStatus === status) &&
        (role   === "ALL" || u.role === role)
      );
    });
    list.sort((a, b) => {
      const aP = a.profile, bP = b.profile;
      if (!aP && !bP) return 0; if (!aP) return 1; if (!bP) return -1;
      if (sortField === "fullname") return sortDir === "asc" ? a.fullname.localeCompare(b.fullname) : b.fullname.localeCompare(a.fullname);
      if (sortField === "grade") {
        const av = GRADE_CFG[aP.grade]?.rank ?? 99, bv = GRADE_CFG[bP.grade]?.rank ?? 99;
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const get = (p: MemberProfile): number => ({
        globalScore: Number(p.globalScore), totalTasksDone: p.totalTasksDone,
        onTimeRate: Number(p.onTimeRate), attendanceRate: Number(p.attendanceRate),
        performanceRating: Number(p.performanceRating), fullname: 0, grade: 0,
      }[sortField]);
      return sortDir === "asc" ? get(aP) - get(bP) : get(bP) - get(aP);
    });
    return list;
  }, [users, search, grade, status, role, showNoProf, sortField, sortDir]);

  const stats = useMemo(() => {
    const wp = users.filter(u => u.profile);
    const scores = wp.map(u => Number(u.profile!.globalScore));
    return {
      total: users.length,
      withProf: wp.length,
      avgScore: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—",
      top: wp.filter(u => ["A+","A"].includes(u.profile!.grade)).length,
      risk: wp.filter(u => ["D","F"].includes(u.profile!.grade)).length,
      late: projects.filter(p => isLate(p)).length,
    };
  }, [users, projects]);

  const grades = useMemo(() => ["ALL", ...Object.keys(GRADE_CFG).filter(g => users.some(u => u.profile?.grade === g))], [users]);
  const roles  = useMemo(() => ["ALL", ...Array.from(new Set(users.map(u => u.role)))], [users]);
  const hasFilters = search || grade !== "ALL" || status !== "ALL" || role !== "ALL";

  const handleExport = () => {
    const rows = [
      ["Nom","Email","Grade","Score","Tâches","Taux à temps","Assiduité","Note RH","Statut"],
      ...filtered.map(u => [
        u.fullname, u.email, u.profile?.grade ?? "—",
        u.profile?.globalScore?.toFixed(1) ?? "—",
        u.profile?.totalTasksDone ?? "—",
        u.profile?.onTimeRate !== undefined ? `${(Number(u.profile.onTimeRate) <= 1 ? Number(u.profile.onTimeRate) * 100 : Number(u.profile.onTimeRate)).toFixed(1)}%` : "—",
        u.profile?.attendanceRate !== undefined ? `${Number(u.profile.attendanceRate).toFixed(1)}%` : "—",
        u.profile?.performanceRating?.toFixed(1) ?? "—",
        u.profile?.employmentStatus ?? "—",
      ]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `scores_${new Date().toISOString().split("T")[0]}.csv` });
    a.click();
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-200">
          <Loader2 className="animate-spin text-white" size={22}/>
        </div>
        <p className="text-sm text-slate-400 font-medium">Chargement des données RH…</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="mx-auto max-w-md mt-16 rounded-3xl bg-red-50 border border-red-100 p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="text-red-400" size={22}/>
        </div>
        <p className="text-red-700 font-semibold text-sm mb-4">{error}</p>
        <button onClick={() => window.location.reload()}
          className="px-5 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-16 space-y-5">

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 p-6 md:p-8 shadow-xl shadow-teal-200/50">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4"/>
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 translate-y-1/2"/>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-cyan-200"/>
              <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-200">RH Analytics</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Scores & Performances RH
            </h1>
            <p className="text-sm text-teal-100 mt-1.5">Membres — tâches &amp; performance · Chefs de projet — résultats projets</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all border border-white/20">
              <Download size={14}/> <span className="hidden sm:inline">Exporter</span>
            </button>
            <button onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all border border-white/20">
              <RefreshCw size={14}/>
            </button>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Employés"          value={stats.total}    sub={`${stats.withProf} profils RH`} accent icon={<Users size={15}/>}/>
        <KpiCard label="Score moyen"       value={stats.avgScore} sub="/ 120 points"    icon={<BarChart2 size={14}/>}/>
        <KpiCard label="Top performers"    value={stats.top}      sub="Grade A+ ou A"   icon={<Medal size={14}/>}/>
        <KpiCard label="À risque"          value={stats.risk}     sub="Grade D ou F"    icon={<AlertCircle size={14}/>}/>
        <KpiCard label="Projets en retard" value={stats.late}     sub="Date dépassée"   icon={<Clock size={14}/>}/>
      </div>

      {/* ── View tabs (desktop) ── */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex gap-2 p-1 bg-teal-50/80 border border-teal-100 rounded-2xl">
          {(["cards","table","charts"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 ${
                view === v
                  ? "bg-gradient-to-br from-teal-600 to-cyan-500 text-white shadow-md shadow-teal-200/50"
                  : "text-slate-500 hover:text-teal-700"
              }`}>
              {v === "cards" ? <><Users size={13}/> Cartes</> : v === "table" ? <><BarChart2 size={13}/> Tableau</> : <><Activity size={13}/> Graphiques</>}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-slate-400 font-medium">{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-400"/>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un employé…"
            className="w-full pl-9 pr-4 py-2.5 bg-teal-50/50 border border-teal-100 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
          />
        </div>
        {/* Selects */}
        <div className="flex flex-wrap gap-2">
          <StyledSelect value={grade} onChange={setGrade} icon={<Award size={13}/>}
            options={[{ value:"ALL", label:"Tous grades" }, ...grades.slice(1).map(g => ({ value:g, label:`Grade ${g}` }))]}/>
          <StyledSelect value={status} onChange={setStatus} icon={<Activity size={13}/>}
            options={[{ value:"ALL", label:"Tous statuts" }, ...Object.entries(STATUS_CFG).map(([k,v]) => ({ value:k, label:v.label }))]}/>
          <StyledSelect value={role} onChange={setRole} icon={<Filter size={13}/>}
            options={[{ value:"ALL", label:"Tous rôles" }, ...roles.slice(1).map(r => ({ value:r, label: ROLE_LABELS[r as UserRole] ?? r }))]}/>
        </div>
        {/* Actions row */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative w-9 h-5" onClick={() => setShowNoProf(v => !v)}>
              <div className={`w-full h-full rounded-full transition-colors ${showNoProf ? "bg-teal-500" : "bg-slate-200"}`}/>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showNoProf ? "translate-x-4" : "translate-x-0.5"}`}/>
            </div>
            <span className="text-[12px] text-slate-500 font-medium">Sans profil</span>
          </label>
          {hasFilters && (
            <button onClick={() => { setSearch(""); setGrade("ALL"); setStatus("ALL"); setRole("ALL"); }}
              className="text-[12px] text-rose-500 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors">
              ✕ Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── CARDS VIEW ── */}
      {view === "cards" && (
        filtered.length === 0
          ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-bold text-slate-700">Aucun résultat</p>
              <p className="text-sm text-slate-400 mt-1">Ajustez vos filtres.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((u, idx) => {
                const p = u.profile;
                const g = p?.grade ?? null;
                const cfg = g ? GRADE_CFG[g] : null;
                const sc = p ? scoreToPercent(Number(p.globalScore)) : 0;
                const onT = p?.onTimeRate !== undefined ? (Number(p.onTimeRate) <= 1 ? Number(p.onTimeRate) * 100 : Number(p.onTimeRate)) : null;
                const att = p?.attendanceRate !== undefined ? (Number(p.attendanceRate) <= 1 ? Number(p.attendanceRate) * 100 : Number(p.attendanceRate)) : null;
                const statusCfg = p ? STATUS_CFG[p.employmentStatus] : null;
                const latePr = projects.filter(pr => isLate(pr) && pr.assignedTo?.some(m => m.id === u.id));
                const medal = getMedal(idx + 1);
                const evo = p?.scoreEvolution ?? null;
                const isPM = u.role === UserRole.PROJECT_MANAGER;
                const pmMetrics = isPM ? getPMMetrics(u.id, projects) : null;
                const roleBadge = ROLE_BADGE[u.role];

                // For PM: accent bar color is violet instead of grade color
                const accentBar = isPM
                  ? "linear-gradient(90deg,#7c3aed,#a855f7)"
                  : (cfg?.bar ?? undefined);

                return (
                  <div key={u.id}
                    onClick={() => router.push(`/Dashboard/users/${u.id}/details`)}
                    className="relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md group">

                    {/* Top accent bar */}
                    {accentBar && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accentBar }}/>}

                    <div className="p-5">
                      {/* Header row */}
                      <div className="flex items-start gap-3 mb-4">
                        {/* Avatar */}
                        <div className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center text-[13px] font-black text-white shadow-sm ${
                          isPM
                            ? "bg-gradient-to-br from-violet-500 to-purple-600"
                            : "bg-gradient-to-br from-teal-400 to-cyan-500"
                        }`}>
                          {initials(u.fullname)}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {medal && <span className="text-sm">{medal}</span>}
                            <span className="text-[14px] font-bold text-slate-800 truncate">{u.fullname}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{u.email}</p>
                          {/* Role badge */}
                          {roleBadge && (
                            <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: roleBadge.dot }}/>
                              {ROLE_LABELS[u.role]}
                            </span>
                          )}
                          {statusCfg && (
                            <span className={`inline-flex items-center gap-1 mt-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.twBg} ${statusCfg.twText} ${statusCfg.twBorder}`}>
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusCfg.dot }}/>
                              {statusCfg.label}
                            </span>
                          )}
                        </div>
                        {/* Grade or PM icon */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          {isPM ? (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center border-2 bg-violet-50 border-violet-200">
                              <span className="text-xl">📋</span>
                            </div>
                          ) : cfg && g ? (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black border-2"
                                style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>{g}</div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black border-2 bg-slate-50 text-slate-300 border-slate-100">—</div>
                          )}
                          <span className="text-[9.5px] text-slate-300 font-mono">#{idx+1}</span>
                        </div>
                      </div>

                      {/* ── PM: Project metrics ── */}
                      {isPM && pmMetrics && (
                        <>
                          <div className="flex items-baseline justify-between mb-1.5">
                            <div>
                              <span className="text-[22px] font-black font-mono text-violet-700">
                                {pmMetrics.completionRate}%
                              </span>
                              <span className="text-[11px] text-slate-300 ml-1">complétion</span>
                            </div>
                            {pmMetrics.lateProjects > 0 && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-red-500">
                                <Clock size={11}/> {pmMetrics.lateProjects} retard{pmMetrics.lateProjects > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <div className="h-1 rounded-full bg-slate-100 overflow-hidden w-full mb-3">
                            <div className="h-full rounded-full" style={{ width: `${pmMetrics.completionRate}%`, background: "linear-gradient(90deg,#7c3aed,#a855f7)" }} />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label:"Projets",   value: pmMetrics.managed },
                              { label:"Complétés", value: pmMetrics.completed },
                              { label:"En retard", value: pmMetrics.lateProjects },
                            ].map(m => (
                              <div key={m.label} className="bg-violet-50/60 border border-violet-100 rounded-xl p-2 text-center">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-violet-500">{m.label}</p>
                                <p className="text-[13px] font-bold text-slate-700 mt-0.5">{m.value}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* ── Member: Task metrics ── */}
                      {!isPM && p && (
                        <>
                          <div className="flex items-baseline justify-between mb-1.5">
                            <div>
                              <span className="text-[22px] font-black font-mono" style={{ color: cfg?.color ?? "#0f172a" }}>
                                {Number(p.globalScore).toFixed(1)}
                              </span>
                              <span className="text-[11px] text-slate-300 ml-1">/ 120</span>
                            </div>
                            {evo !== null && (
                              <span className={`flex items-center gap-1 text-[12px] font-bold ${Number(evo) > 0 ? "text-teal-600" : Number(evo) < 0 ? "text-red-500" : "text-slate-400"}`}>
                                {Number(evo) > 0 ? <TrendingUp size={13}/> : Number(evo) < 0 ? <TrendingDown size={13}/> : <Minus size={13}/>}
                                {Number(evo) > 0 ? "+" : ""}{Number(evo).toFixed(1)}
                              </span>
                            )}
                          </div>
                          <ScoreBar value={sc} barStyle={cfg?.bar ?? "linear-gradient(90deg,#14b8a6,#06b6d4)"}/>
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            {[
                              { label:"Tâches",    value: p.totalTasksDone },
                              { label:"À temps",   value: onT !== null ? `${onT.toFixed(0)}%` : "—" },
                              { label:"Assiduité", value: att !== null ? `${att.toFixed(0)}%` : "—" },
                            ].map(m => (
                              <div key={m.label} className="bg-teal-50/60 border border-teal-50 rounded-xl p-2 text-center">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-teal-600">{m.label}</p>
                                <p className="text-[13px] font-bold text-slate-700 mt-0.5">{m.value}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* No profile message (members only) */}
                      {!isPM && !p && (
                        <p className="text-[12px] text-slate-300 italic py-2">Pas de profil RH</p>
                      )}

                      {latePr.length > 0 && !isPM && (
                        <div className="flex items-center gap-1.5 mt-3 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-[10.5px] font-semibold text-rose-500">
                          <Clock size={11}/>{latePr.length} projet{latePr.length > 1 ? "s" : ""} en retard
                        </div>
                      )}

                      <div className="flex justify-end mt-3">
                        <span className="text-[11px] text-teal-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                          Voir le profil <ChevronRight size={13}/>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
      )}

      {/* ── TABLE VIEW ── */}
      {view === "table" && (
        filtered.length === 0
          ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-bold text-slate-700">Aucun résultat</p>
              <p className="text-sm text-slate-400 mt-1">Ajustez vos filtres pour afficher des employés.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-teal-50/80 to-cyan-50/50">
                      {[
                        { label:"#", field: null, w:"w-10 text-center" },
                        { label:"Employé", field:"fullname" as SortField },
                        { label:"Grade", field:"grade" as SortField },
                        { label:"Score", field:"globalScore" as SortField, w:"min-w-[160px]" },
                        { label:"Tâches", field:"totalTasksDone" as SortField },
                        { label:"À temps", field:"onTimeRate" as SortField, w:"min-w-[100px]" },
                        { label:"Assiduité", field:"attendanceRate" as SortField, w:"min-w-[100px]" },
                        { label:"Note RH", field:"performanceRating" as SortField },
                        { label:"Évol.", field: null },
                        { label:"", field: null, w:"text-right" },
                      ].map((col, i) => (
                        <th key={i} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-teal-700 border-b border-teal-100 whitespace-nowrap ${col.w ?? ""}`}>
                          {col.label}
                          {col.field && (
                            <button onClick={() => handleSort(col.field!)} className="ml-1 text-teal-300 hover:text-teal-600 inline-flex align-middle">
                              {sortField === col.field
                                ? sortDir === "asc" ? "↑" : "↓"
                                : "↕"}
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, idx) => {
                      const p = u.profile;
                      const g = p?.grade ?? null;
                      const cfg = g ? GRADE_CFG[g] : null;
                      const sc = p ? scoreToPercent(Number(p.globalScore)) : 0;
                      const onT = p?.onTimeRate !== undefined ? (Number(p.onTimeRate) <= 1 ? Number(p.onTimeRate) * 100 : Number(p.onTimeRate)) : null;
                      const att = p?.attendanceRate !== undefined ? (Number(p.attendanceRate) <= 1 ? Number(p.attendanceRate) * 100 : Number(p.attendanceRate)) : null;
                      const statusCfg = p ? STATUS_CFG[p.employmentStatus] : null;
                      const evo = p?.scoreEvolution ?? null;
                      const latePr = projects.filter(pr => isLate(pr) && pr.assignedTo?.some(m => m.id === u.id));
                      const medal = getMedal(idx + 1);
                      const isPM = u.role === UserRole.PROJECT_MANAGER;
                      const pmMetrics = isPM ? getPMMetrics(u.id, projects) : null;
                      const roleBadge = ROLE_BADGE[u.role];

                      return (
                        <tr key={u.id} className="border-b border-slate-50 hover:bg-teal-50/30 transition-colors">
                          <td className="px-4 py-3 text-center text-sm text-slate-400">
                            {medal ? <span>{medal}</span> : <span className="font-mono text-[11px] text-slate-300">{idx+1}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-[11px] font-black text-white ${
                                isPM ? "bg-gradient-to-br from-violet-500 to-purple-600" : "bg-gradient-to-br from-teal-400 to-cyan-500"
                              }`}>
                                {initials(u.fullname)}
                              </div>
                              <div>
                                <p className="text-[13px] font-bold text-slate-800">{u.fullname}</p>
                                <p className="text-[11px] text-slate-400">{u.email}</p>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {roleBadge && (
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                                      <span className="w-1 h-1 rounded-full" style={{ background: roleBadge.dot }}/>{ROLE_LABELS[u.role]}
                                    </span>
                                  )}
                                  {statusCfg && (
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${statusCfg.twBg} ${statusCfg.twText} ${statusCfg.twBorder}`}>
                                      <span className="w-1 h-1 rounded-full" style={{ background: statusCfg.dot }}/>{statusCfg.label}
                                    </span>
                                  )}
                                  {latePr.length > 0 && !isPM && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-100">
                                      <Clock size={9}/>{latePr.length} retard{latePr.length > 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          {/* Grade or PM indicator */}
                          <td className="px-4 py-3">
                            {isPM ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200">
                                📋 PM
                              </span>
                            ) : cfg && g ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[13px] font-black border-2"
                                style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>{g}</span>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>
                          {/* Score column: task score for members, completion rate for PMs */}
                          <td className="px-4 py-3 min-w-[160px]">
                            {isPM && pmMetrics ? (
                              <div className="space-y-1">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[14px] font-black font-mono text-violet-700">{pmMetrics.completionRate}%</span>
                                  <span className="text-[10px] text-slate-300">complétion</span>
                                </div>
                                <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${pmMetrics.completionRate}%`, background: "linear-gradient(90deg,#7c3aed,#a855f7)" }} />
                                </div>
                              </div>
                            ) : p ? (
                              <div className="space-y-1">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[14px] font-black font-mono text-slate-800">{Number(p.globalScore).toFixed(1)}</span>
                                  <span className="text-[10px] text-slate-300">/ 120</span>
                                </div>
                                <ScoreBar value={sc} barStyle={cfg?.bar ?? "linear-gradient(90deg,#14b8a6,#06b6d4)"}/>
                              </div>
                            ) : <span className="text-slate-300 text-xs italic">Pas de profil</span>}
                          </td>
                          {/* Tasks column: tasks for members, total managed projects for PMs */}
                          <td className="px-4 py-3">
                            {isPM && pmMetrics ? (
                              <div className="text-center">
                                <span className="font-bold text-slate-700 font-mono text-[13px]">{pmMetrics.managed}</span>
                                <p className="text-[10px] text-slate-400">projets</p>
                              </div>
                            ) : p ? (
                              <span className="font-bold text-slate-700 font-mono text-[13px]">{p.totalTasksDone}</span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          {/* On-time column: on-time rate for members, completed projects for PMs */}
                          <td className="px-4 py-3">
                            {isPM && pmMetrics ? (
                              <div className="text-center">
                                <span className="font-bold text-teal-700 font-mono text-[13px]">{pmMetrics.completed}</span>
                                <p className="text-[10px] text-slate-400">complétés</p>
                              </div>
                            ) : onT !== null ? (
                              <div className="space-y-1">
                                <FmtPct v={onT}/>
                                <ScoreBar value={onT} barStyle={onT >= 80 ? "linear-gradient(90deg,#0d9488,#14b8a6)" : onT >= 60 ? "linear-gradient(90deg,#d97706,#f59e0b)" : "linear-gradient(90deg,#dc2626,#ef4444)"}/>
                              </div>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          {/* Attendance column: attendance for members, late projects for PMs */}
                          <td className="px-4 py-3">
                            {isPM && pmMetrics ? (
                              <div className="text-center">
                                <span className={`font-bold font-mono text-[13px] ${pmMetrics.lateProjects > 0 ? "text-red-500" : "text-slate-700"}`}>
                                  {pmMetrics.lateProjects}
                                </span>
                                <p className="text-[10px] text-slate-400">en retard</p>
                              </div>
                            ) : att !== null ? (
                              <div className="space-y-1">
                                <FmtPct v={att}/>
                                <ScoreBar value={att} barStyle={att >= 90 ? "linear-gradient(90deg,#0d9488,#14b8a6)" : att >= 70 ? "linear-gradient(90deg,#d97706,#f59e0b)" : "linear-gradient(90deg,#dc2626,#ef4444)"}/>
                              </div>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          {/* HR rating: only for members (no rating concept for PMs) */}
                          <td className="px-4 py-3">
                            {!isPM && p ? (
                              <div className="flex items-center gap-1">
                                <Star size={12} className="text-amber-400 fill-amber-400"/>
                                <span className="font-bold text-[13px] text-slate-700">{Number(p.performanceRating).toFixed(1)}</span>
                                <span className="text-[10px] text-slate-300">/5</span>
                              </div>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          {/* Evolution: task score evolution for members */}
                          <td className="px-4 py-3">
                            {!isPM && evo !== null ? (
                              <span className={`flex items-center gap-1 text-[12px] font-bold ${Number(evo) > 0 ? "text-teal-600" : Number(evo) < 0 ? "text-red-500" : "text-slate-400"}`}>
                                {Number(evo) > 0 ? <TrendingUp size={13}/> : Number(evo) < 0 ? <TrendingDown size={13}/> : <Minus size={13}/>}
                                {Number(evo) > 0 ? "+" : ""}{Number(evo).toFixed(1)}
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => router.push(`/Dashboard/users/${u.id}/details`)}
                              className="w-8 h-8 rounded-xl flex items-center justify-center bg-teal-50 border border-teal-100 text-teal-600 hover:bg-teal-100 transition-colors">
                              <Eye size={13}/>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-teal-50/30 border-t border-teal-50 flex items-center justify-between text-[11px] text-slate-400">
                <span>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""} sur {users.length}</span>
                <span>{filtered.filter(u => u.profile).length} avec profil RH</span>
              </div>
            </div>
          )
      )}

      {/* ── CHARTS VIEW ── */}
      {view === "charts" && <ChartsSection users={users} projects={projects}/>}

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-teal-100 flex px-3 pb-4 pt-2 gap-1 shadow-2xl shadow-teal-100/40">
        {(["cards","table","charts"] as ViewMode[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-2xl text-[10px] font-semibold transition-all duration-200 ${
              view === v
                ? "bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-700 border border-teal-200"
                : "text-slate-400"
            }`}>
            {v === "cards" ? <Users size={20}/> : v === "table" ? <BarChart2 size={20}/> : <Activity size={20}/>}
            {v === "cards" ? "Cartes" : v === "table" ? "Tableau" : "Stats"}
          </button>
        ))}
        <button onClick={handleExport}
          className="flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-2xl text-[10px] font-semibold text-slate-400 transition-all duration-200">
          <Download size={20}/>Export
        </button>
      </div>
    </div>
  );
}