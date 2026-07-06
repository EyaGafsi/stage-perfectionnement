"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User, Mail, Shield, Building2, ArrowLeft, CheckCircle2,
  XCircle, Pencil, Briefcase, DollarSign, Calendar, TrendingUp,
  Clock, AlertCircle, Award, Star, Activity, Target,
  ChevronRight, Loader2, Phone, FileText, BarChart2, Zap,
  BookOpen, AlertTriangle, Layers, Code2, Megaphone, Headphones,
  Database, Server, GitBranch, Lock, Terminal, Users,
  Globe, Cpu, LayoutGrid, RadioTower,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company { id: number; name: string }

interface UserType {
  id: number;
  fullname: string;
  email: string;
  numtel: string;
  cvlink: string;
  role: string;
  memberlevel?: string | null;
  company?: Company | null;
  isActive: boolean;
}

interface TaskSnapshot {
  taskId: number;
  domain: "IT" | "Marketing" | "CallCenter";
  title: string;
  delayHours: number;
  completedAt: string;
  points: number;
}

interface MemberProfile {
  id: number;
  contractType: string;
  hireDate: string;
  employmentStatus: string;
  position: string | null;
  baseSalary: number | null;
  bonuses: number;
  totalCompensation: number;
  performanceRating: number;
  projectsCompleted: number;
  attendanceRate: number;
  absenceCount: number;
  deactivationDate: string | null;
  departureReason: string | null;
  globalScore: number;
  grade: string;
  totalTasksDone: number;
  onTimeCount: number;
  earlyCount: number;
  lateCount: number;
  avgDelayHours: number;
  totalDelayHours: number;
  onTimeRate: number;
  itTasksDone: number;
  itScore: number;
  itAvgDelay: number;
  marketingTasksDone: number;
  marketingScore: number;
  marketingAvgDelay: number;
  callCenterTasksDone: number;
  callCenterScore: number;
  callCenterAvgDelay: number;
  recentTasksSnapshot: TaskSnapshot[] | null;
  scoreEvolution: number | null;
  scoreUpdatedAt: string | null;
}

interface AssignedProject {
  id: number;
  name: string;
  domain: "IT" | "Marketing" | "CallCenter";
  status: string;
  domainDetails?: {
    techStack?: string;
    methodology?: string;
    totalStoryPoints?: number;
    complexity?: string;
    programmingLanguages?: string;
    framework?: string;
    database?: string;
    serverDetails?: string;
    architecture?: string;
    apiIntegration?: string;
    securityRequirements?: string;
    devOpsRequirements?: string;
    mainModules?: string;
    keyDeliverables?: string;
    dependencies?: string;
    risks?: string;
    campaignType?: string;
    channels?: string;
    metrics?: string;
    targetAudience?: string;
    businessImpact?: string;
    mainGoals?: string;
    callTypes?: string;
    slaTargetSeconds?: number;
    CSAT?: number;
    FCR?: number;
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrateur",
  admin_company: "Admin Société",
  manager: "Manager",
  project_manager: "Chef de projet",
  call_center_manager: "Manager Call Center",
  sales_manager: "Manager Ventes",
  marketing_manager: "Manager Marketing",
  quality_manager: "Manager Qualité",
  hr_manager: "Manager RH",
  agent_telepro: "Agent Telepro",
  commercial: "Commercial",
  marketing_agent: "Agent Marketing",
  qualite_agent: "Agent Qualité",
  tech_support: "Support Technique",
  member: "Membre",
};

const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI", cdd: "CDD", stage: "Stage", freelance: "Freelance",
};

const STATUS_COLORS: Record<string, string> = {
  active:     "bg-teal-50 text-teal-700 border-teal-200",
  inactive:   "bg-slate-100 text-slate-500 border-slate-200",
  on_leave:   "bg-amber-50 text-amber-700 border-amber-200",
  terminated: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif", inactive: "Inactif", on_leave: "En congé", terminated: "Résilié",
};

const LEVEL_COLORS: Record<string, string> = {
  junior: "bg-cyan-50 text-cyan-700 border border-cyan-200",
  senior: "bg-teal-50 text-teal-700 border border-teal-200",
  expert: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const DOMAIN_CONFIG = {
  IT:         { color: "bg-cyan-50 border-cyan-100 text-cyan-900",       accent: "#0891b2", label: "IT",          dot: "bg-cyan-400",   badge: "bg-cyan-100 text-cyan-700" },
  Marketing:  { color: "bg-pink-50 border-pink-100 text-pink-900",       accent: "#db2777", label: "Marketing",   dot: "bg-pink-400",   badge: "bg-pink-100 text-pink-700" },
  CallCenter: { color: "bg-teal-50 border-teal-100 text-teal-900",       accent: "#0d9488", label: "Call Center", dot: "bg-teal-400",   badge: "bg-teal-100 text-teal-700" },
};

// ─── Skill categories ─────────────────────────────────────────────────────────

type SkillCategory = {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
};

const IT_SKILL_CATEGORIES: Record<string, SkillCategory> = {
  programmingLanguages: { label: "Langages",       icon: <Code2 size={12} />,      color: "text-cyan-700",    bg: "bg-cyan-50",    border: "border-cyan-100" },
  framework:            { label: "Frameworks",      icon: <LayoutGrid size={12} />, color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-100" },
  techStack:            { label: "Stack",           icon: <Layers size={12} />,     color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-100" },
  database:             { label: "Base de données", icon: <Database size={12} />,   color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-100" },
  serverDetails:        { label: "Serveurs",        icon: <Server size={12} />,     color: "text-slate-600",   bg: "bg-slate-100",  border: "border-slate-200" },
  architecture:         { label: "Architecture",    icon: <GitBranch size={12} />,  color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-100" },
  apiIntegration:       { label: "APIs",            icon: <Globe size={12} />,      color: "text-cyan-700",    bg: "bg-cyan-50",    border: "border-cyan-100" },
  securityRequirements: { label: "Sécurité",        icon: <Lock size={12} />,       color: "text-red-700",     bg: "bg-red-50",     border: "border-red-100" },
  devOpsRequirements:   { label: "DevOps",          icon: <Terminal size={12} />,   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
  methodology:          { label: "Méthodologie",    icon: <Target size={12} />,     color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-100" },
  complexity:           { label: "Complexité",      icon: <Cpu size={12} />,        color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-100" },
};

const MARKETING_SKILL_CATEGORIES: Record<string, SkillCategory> = {
  campaignType:   { label: "Type campagne", icon: <Megaphone size={12} />,  color: "text-pink-700",   bg: "bg-pink-50",   border: "border-pink-100" },
  channels:       { label: "Canaux",        icon: <RadioTower size={12} />, color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-100" },
  targetAudience: { label: "Audience",      icon: <Users size={12} />,      color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-100" },
  metrics:        { label: "KPIs",          icon: <BarChart2 size={12} />,  color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-100" },
  mainGoals:      { label: "Objectifs",     icon: <Target size={12} />,     color: "text-red-700",    bg: "bg-red-50",    border: "border-red-100" },
  businessImpact: { label: "Impact",        icon: <TrendingUp size={12} />, color: "text-pink-700",   bg: "bg-pink-50",   border: "border-pink-100" },
};

const CALLCENTER_SKILL_CATEGORIES: Record<string, SkillCategory> = {
  callTypes:    { label: "Types d'appels", icon: <Headphones size={12} />, color: "text-teal-700",  bg: "bg-teal-50",  border: "border-teal-100" },
  mainGoals:    { label: "Objectifs",      icon: <Target size={12} />,     color: "text-cyan-700",  bg: "bg-cyan-50",  border: "border-cyan-100" },
  dependencies: { label: "Dépendances",   icon: <GitBranch size={12} />,  color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
};

// ─── Skill extraction ─────────────────────────────────────────────────────────

type SkillEntry = {
  value: string;
  category: string;
  categoryMeta: SkillCategory;
  domain: "IT" | "Marketing" | "CallCenter";
};

function splitVal(val?: string): string[] {
  if (!val) return [];
  return val.split(/[;,]/).map(s => s.trim()).filter(Boolean);
}

function extractSkillEntries(project: AssignedProject): SkillEntry[] {
  const d = project.domainDetails;
  if (!d) return [];
  const entries: SkillEntry[] = [];

  if (project.domain === "IT") {
    const fields = ["programmingLanguages","framework","techStack","database","serverDetails","architecture","apiIntegration","securityRequirements","devOpsRequirements","methodology","complexity"] as const;
    for (const field of fields) {
      const meta = IT_SKILL_CATEGORIES[field];
      for (const val of splitVal((d as any)[field])) {
        entries.push({ value: val, category: field, categoryMeta: meta, domain: "IT" });
      }
    }
  }

  if (project.domain === "Marketing") {
    const fields = ["campaignType","channels","targetAudience","metrics","mainGoals","businessImpact"] as const;
    for (const field of fields) {
      const meta = MARKETING_SKILL_CATEGORIES[field];
      for (const val of splitVal((d as any)[field])) {
        entries.push({ value: val, category: field, categoryMeta: meta, domain: "Marketing" });
      }
    }
  }

  if (project.domain === "CallCenter") {
    const fields = ["callTypes","mainGoals","dependencies"] as const;
    for (const field of fields) {
      const meta = CALLCENTER_SKILL_CATEGORIES[field];
      for (const val of splitVal((d as any)[field])) {
        entries.push({ value: val, category: field, categoryMeta: meta, domain: "CallCenter" });
      }
    }
    if (d.slaTargetSeconds) entries.push({ value: `SLA ${d.slaTargetSeconds}s`, category: "callTypes", categoryMeta: CALLCENTER_SKILL_CATEGORIES["callTypes"], domain: "CallCenter" });
    if (d.CSAT) entries.push({ value: `CSAT ${d.CSAT}`, category: "callTypes", categoryMeta: CALLCENTER_SKILL_CATEGORIES["callTypes"], domain: "CallCenter" });
    if (d.FCR)  entries.push({ value: `FCR ${d.FCR}`,   category: "callTypes", categoryMeta: CALLCENTER_SKILL_CATEGORIES["callTypes"], domain: "CallCenter" });
  }

  return entries;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gradeColor(grade: string) {
  return (
    {
      "A+": "text-teal-700 bg-teal-50 border-teal-300",
      A:    "text-emerald-700 bg-emerald-50 border-emerald-300",
      B:    "text-cyan-700 bg-cyan-50 border-cyan-300",
      C:    "text-amber-700 bg-amber-50 border-amber-300",
      D:    "text-orange-700 bg-orange-50 border-orange-300",
      F:    "text-red-700 bg-red-50 border-red-300",
    }[grade] ?? "text-slate-600 bg-slate-100 border-slate-200"
  );
}

function delayLabel(hRaw: number | string) {
  const h = Number(hRaw) || 0;
  if (h < 0) return { text: `${Math.abs(h).toFixed(1)}h d'avance`, cls: "text-teal-700 bg-teal-50" };
  if (h === 0) return { text: "À l'heure", cls: "text-cyan-700 bg-cyan-50" };
  if (h <= 4)  return { text: `+${h.toFixed(1)}h`, cls: "text-amber-700 bg-amber-50" };
  return { text: `+${h.toFixed(1)}h`, cls: "text-red-600 bg-red-50" };
}

// ─── Reusable UI ──────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-teal-50 last:border-0">
      <div className="mt-0.5 text-teal-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-teal-500 uppercase tracking-wide mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-slate-800 truncate">{value}</div>
      </div>
    </div>
  );
}

function ScoreBar({ value, max = 120, color = "#0891b2" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-teal-50 rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
      />
    </div>
  );
}

function MetricCard({
  label, value, sub, color = "text-slate-800", icon,
}: {
  label: string; value: React.ReactNode; sub?: string; color?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-teal-100 rounded-2xl p-4 flex flex-col gap-1 shadow-sm hover:shadow-md hover:border-teal-200 transition-all">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-teal-500 uppercase tracking-wide">{label}</p>
        {icon && <span className="text-teal-300">{icon}</span>}
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-teal-500">{icon}</span>}
      <h2 className="text-sm font-bold text-slate-700 tracking-tight">{children}</h2>
    </div>
  );
}

function TabBar({
  tabs, active, onChange,
}: {
  tabs: { key: string; label: string; icon: React.ReactNode; badge?: number }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex border-b border-teal-100 px-2 pt-2 gap-1 overflow-x-auto scrollbar-hide">
      {tabs.map(({ key, label, icon, badge }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl whitespace-nowrap transition-all duration-200 ${
            active === key
              ? "bg-teal-600 text-white shadow-sm"
              : "text-teal-600 hover:text-teal-800 hover:bg-teal-50"
          }`}
        >
          {icon} {label}
          {badge != null && badge > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                active === key ? "bg-white/25 text-white" : "bg-teal-100 text-teal-700"
              }`}
            >
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── SkillBadge ───────────────────────────────────────────────────────────────

function SkillBadge({ entry }: { entry: SkillEntry }) {
  const m = entry.categoryMeta;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${m.bg} ${m.color} ${m.border}`}
    >
      {m.icon}{entry.value}
    </span>
  );
}

// ─── SkillProfile tab ─────────────────────────────────────────────────────────

function SkillProfile({ profile, projects }: { profile: MemberProfile; projects: AssignedProject[] }) {
  const [activeTab, setActiveTab] = useState<"projects" | "skills" | "training">("projects");

  const totalTasks = profile.totalTasksDone || 1;
  const domainDist = [
    { key: "IT",         tasks: profile.itTasksDone,         score: profile.itScore,         avg: profile.itAvgDelay,         pct: Math.round((profile.itTasksDone / totalTasks) * 100) },
    { key: "Marketing",  tasks: profile.marketingTasksDone,  score: profile.marketingScore,  avg: profile.marketingAvgDelay,  pct: Math.round((profile.marketingTasksDone / totalTasks) * 100) },
    { key: "CallCenter", tasks: profile.callCenterTasksDone, score: profile.callCenterScore, avg: profile.callCenterAvgDelay, pct: Math.round((profile.callCenterTasksDone / totalTasks) * 100) },
  ].filter(d => d.tasks > 0);

  const allByDomain: Record<"IT" | "Marketing" | "CallCenter", SkillEntry[]> = { IT: [], Marketing: [], CallCenter: [] };
  const seen = new Set<string>();
  for (const project of projects) {
    for (const entry of extractSkillEntries(project)) {
      const key = `${entry.domain}:${entry.category}:${entry.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      allByDomain[entry.domain].push(entry);
    }
  }

  function groupByCategory(entries: SkillEntry[]) {
    const result: Record<string, { meta: SkillCategory; entries: SkillEntry[] }> = {};
    for (const e of entries) {
      if (!result[e.category]) result[e.category] = { meta: e.categoryMeta, entries: [] };
      result[e.category].entries.push(e);
    }
    return result;
  }

  const itGrouped         = groupByCategory(allByDomain.IT);
  const marketingGrouped  = groupByCategory(allByDomain.Marketing);
  const callCenterGrouped = groupByCategory(allByDomain.CallCenter);
  const totalSkills = allByDomain.IT.length + allByDomain.Marketing.length + allByDomain.CallCenter.length;

  const needsTraining: { domain: string; reason: string; severity: "high" | "medium" }[] = [];
  if (profile.itTasksDone > 0 && Number(profile.itAvgDelay) > 24)
  needsTraining.push({ domain: "IT", reason: `Retard moyen de ${Number(profile.itAvgDelay).toFixed(1)}h — revue des sprints agile recommandée`, severity: "high" });
  if (profile.marketingTasksDone > 0 && profile.marketingAvgDelay > 24)
    needsTraining.push({ domain: "Marketing", reason: `Retard moyen de ${profile.marketingAvgDelay}h — formation gestion de campagnes`, severity: "medium" });
  if (profile.callCenterTasksDone > 0 && Number(profile.callCenterAvgDelay) > 12)
  needsTraining.push({ domain: "Call Center", reason: `Retard moyen de ${Number(profile.callCenterAvgDelay).toFixed(1)}h — coaching scripts et SLA`, severity: "medium" });
  if (profile.lateCount > profile.onTimeCount)
    needsTraining.push({ domain: "Global", reason: `${profile.lateCount} tâches en retard sur ${profile.totalTasksDone} — atelier gestion du temps`, severity: "high" });

  const tabs = [
    { key: "projects", label: "Projets",     icon: <Layers size={13} /> },
    { key: "skills",   label: "Compétences", icon: <Code2 size={13} />, badge: totalSkills },
    { key: "training", label: "Formation",   icon: <BookOpen size={13} />, badge: needsTraining.length },
  ] as const;

  return (
    <div className="mt-5 bg-white rounded-3xl border border-teal-100 overflow-hidden shadow-sm">
      <TabBar tabs={tabs as any} active={activeTab} onChange={k => setActiveTab(k as any)} />

      <div className="p-4 sm:p-6">

        {/* ── Projets ── */}
        {activeTab === "projects" && (
          <div className="space-y-5">
            {projects.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Aucun projet assigné.</p>
            ) : (
              <div className="space-y-2">
                {projects.map(p => {
                  const cfg = DOMAIN_CONFIG[p.domain];
                  const domainIcon = p.domain === "IT"
                    ? <Code2 size={13} />
                    : p.domain === "Marketing"
                    ? <Megaphone size={13} />
                    : <Headphones size={13} />;
                  return (
                    <div key={p.id} className={`flex items-center gap-3 p-3.5 rounded-2xl border ${cfg.color}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.name}</p>
                        <p className="text-xs opacity-60 capitalize mt-0.5">{p.status}</p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${cfg.badge}`}>
                        {domainIcon} {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {domainDist.length > 0 && (
              <>
                <div>
                  <p className="text-[11px] font-bold text-teal-500 uppercase tracking-wider mb-3">Distribution par domaine</p>
                  <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 mb-3">
                    {domainDist.map(d => {
                      const cfg = DOMAIN_CONFIG[d.key as keyof typeof DOMAIN_CONFIG];
                      return <div key={d.key} style={{ flex: d.pct, background: cfg.accent }} className="rounded-full" title={`${cfg.label} ${d.pct}%`} />;
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {domainDist.map(d => {
                      const cfg = DOMAIN_CONFIG[d.key as keyof typeof DOMAIN_CONFIG];
                      return (
                        <div key={d.key} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.accent }} />
                          <span className="text-xs text-slate-600">{cfg.label}</span>
                          <span className="text-xs font-bold text-slate-800">{d.pct}%</span>
                          <span className="text-xs text-slate-400">({d.tasks})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-teal-500 uppercase tracking-wider mb-3">Performance par domaine</p>
                  <div className="space-y-3">
                    {domainDist.map(d => {
                      const cfg = DOMAIN_CONFIG[d.key as keyof typeof DOMAIN_CONFIG];
                      return (
                        <div key={d.key} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-slate-600 w-24 flex-shrink-0">{cfg.label}</span>
                          <div className="flex-1"><ScoreBar value={d.score} max={120} color={cfg.accent} /></div>
                          <span className="text-xs font-bold text-slate-800 w-14 text-right">{Number(d.score).toFixed(1)} pts</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg w-20 text-right ${d.avg <= 0 ? "bg-teal-50 text-teal-700" : d.avg <= 24 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                            {d.avg > 0 ? `+${d.avg}h` : `${d.avg}h`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Compétences ── */}
        {activeTab === "skills" && (
          <div className="space-y-6">
            {totalSkills === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">Aucun détail de projet disponible — les compétences sont extraites des fiches de projet assignées.</p>
            ) : (
              <>
                <p className="text-xs text-teal-600 bg-teal-50 rounded-xl px-3 py-2">
                  {totalSkills} compétence{totalSkills > 1 ? "s" : ""} détectée{totalSkills > 1 ? "s" : ""} depuis {projects.length} projet{projects.length > 1 ? "s" : ""}.
                </p>

                {allByDomain.IT.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-cyan-100">
                      <div className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center"><Code2 size={13} className="text-cyan-600" /></div>
                      <p className="text-sm font-bold text-cyan-800">Développement IT</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 ml-auto">{allByDomain.IT.length}</span>
                    </div>
                    <div className="space-y-3 pl-1">
                      {Object.entries(itGrouped).map(([catKey, { meta, entries }]) => (
                        <div key={catKey}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={meta.color}>{meta.icon}</span>
                            <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {entries.map((e, i) => <SkillBadge key={i} entry={e} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {allByDomain.Marketing.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-pink-100">
                      <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center"><Megaphone size={13} className="text-pink-600" /></div>
                      <p className="text-sm font-bold text-pink-800">Marketing</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 ml-auto">{allByDomain.Marketing.length}</span>
                    </div>
                    <div className="space-y-3 pl-1">
                      {Object.entries(marketingGrouped).map(([catKey, { meta, entries }]) => (
                        <div key={catKey}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={meta.color}>{meta.icon}</span>
                            <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {entries.map((e, i) => <SkillBadge key={i} entry={e} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {allByDomain.CallCenter.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-teal-100">
                      <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center"><Headphones size={13} className="text-teal-600" /></div>
                      <p className="text-sm font-bold text-teal-800">Call Center</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 ml-auto">{allByDomain.CallCenter.length}</span>
                    </div>
                    <div className="space-y-3 pl-1">
                      {Object.entries(callCenterGrouped).map(([catKey, { meta, entries }]) => (
                        <div key={catKey}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={meta.color}>{meta.icon}</span>
                            <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {entries.map((e, i) => <SkillBadge key={i} entry={e} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Formation ── */}
        {activeTab === "training" && (
          <div className="space-y-4">
            {needsTraining.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-3">
                  <CheckCircle2 className="text-teal-500" size={24} />
                </div>
                <p className="text-sm font-bold text-teal-700">Aucun blocage détecté</p>
                <p className="text-xs text-slate-400 mt-1">Les performances sont dans les seuils attendus.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-teal-600 bg-teal-50 rounded-xl px-3 py-2">
                  Formations recommandées basées sur les retards observés dans les tâches.
                </p>
                {needsTraining.map((alert, i) => {
                  const isHigh = alert.severity === "high";
                  return (
                    <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${isHigh ? "bg-red-50 border-red-100 text-red-900" : "bg-amber-50 border-amber-100 text-amber-900"}`}>
                      <AlertTriangle size={16} className={`flex-shrink-0 mt-0.5 ${isHigh ? "text-red-500" : "text-amber-500"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-bold">{alert.domain}</p>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isHigh ? "bg-red-200 text-red-700" : "bg-amber-200 text-amber-700"}`}>
                            {isHigh ? "Prioritaire" : "Recommandé"}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">{alert.reason}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <MetricCard label="En retard"  value={profile.lateCount}  sub={`/ ${profile.totalTasksDone}`} color={profile.lateCount > profile.onTimeCount ? "text-red-500" : "text-slate-800"} />
                  <MetricCard label="Délai moy." value={`${profile.avgDelayHours > 0 ? "+" : ""}${Number(profile.avgDelayHours).toFixed(1)}h`} color={profile.avgDelayHours <= 0 ? "text-teal-600" : profile.avgDelayHours <= 24 ? "text-amber-600" : "text-red-500"} />
                  <MetricCard label="Taux ponct." value={`${(Number(profile.onTimeRate) * 100).toFixed(1)}%`} color={Number(profile.onTimeRate) >= 0.75 ? "text-teal-600" : "text-amber-600"} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser]                     = useState<UserType | null>(null);
  const [profile, setProfile]               = useState<MemberProfile | null>(null);
  const [projects, setProjects]             = useState<AssignedProject[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [activeTab, setActiveTab]           = useState<"overview" | "it" | "marketing" | "callcenter" | "tasks">("overview");

  const EVALUATED_ROLES = [
    "member",
    "project_manager",
  ];

  const isMember = user && EVALUATED_ROLES.includes(user.role);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = { Authorization: `Bearer ${token}` };

        const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/users/${id}`, { headers });
        if (!res.ok) throw new Error("Accès refusé ou utilisateur introuvable");
        const data: UserType = await res.json();
        setUser(data);

        if (EVALUATED_ROLES.includes(data.role)) {
          setProfileLoading(true);
          const pRes = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/member-profiles/${id}`, { headers });
          if (pRes.ok) setProfile(await pRes.json());

          try {
            const projRes = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/projects/member/${id}/projects`, { headers });
            if (projRes.ok) {
              const allProjects: any[] = await projRes.json();
              const enriched: AssignedProject[] = await Promise.all(
                allProjects.map(async (p: any) => {
                  try {
                    const dRes = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/projects/${p.id}/details?includeDomainDetails=true`, { headers });
                    if (!dRes.ok) return { id: p.id, name: p.name, domain: p.domain, status: p.status, domainDetails: null };
                    const detail = await dRes.json();
                    return { id: p.id, name: p.name, domain: p.domain, status: p.status, domainDetails: detail.domainDetails ?? null };
                  } catch {
                    return { id: p.id, name: p.name, domain: p.domain, status: p.status, domainDetails: null };
                  }
                })
              );
              setProjects(enriched);
            }
          } catch { /* silencieux */ }

          setProfileLoading(false);
        }
      } catch (err: any) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-teal-600" size={22} />
          </div>
          <p className="text-sm text-teal-600 font-medium">Chargement en cours…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !user) {
    return (
      <div className="mx-auto max-w-md mt-10 rounded-3xl bg-red-50 border border-red-100 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="text-red-500" size={22} />
        </div>
        <p className="text-red-700 font-semibold text-sm">{error || "Utilisateur introuvable"}</p>
      </div>
    );
  }

  const initials = user.fullname.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const statsTabs = [
    { key: "overview",   label: "Global",       icon: <BarChart2 size={13} />,    show: true },
    { key: "it",         label: "IT",            icon: <Zap size={13} />,          show: (profile?.itTasksDone ?? 0) > 0 },
    { key: "marketing",  label: "Marketing",     icon: <Target size={13} />,       show: (profile?.marketingTasksDone ?? 0) > 0 },
    { key: "callcenter", label: "Call Center",   icon: <Activity size={13} />,     show: (profile?.callCenterTasksDone ?? 0) > 0 },
    { key: "tasks",      label: "Tâches",        icon: <CheckCircle2 size={13} />, show: true },
  ].filter(t => t.show);

  return (
    <div className="max-w-5xl mx-auto pb-16 px-4 sm:px-6">

      {/* ── Back button ── */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 text-teal-600 hover:text-teal-800 transition-colors mb-6 mt-2 text-sm font-semibold"
      >
        <div className="w-8 h-8 rounded-full border border-teal-200 bg-white flex items-center justify-center group-hover:border-teal-400 group-hover:bg-teal-50 transition-all shadow-sm">
          <ArrowLeft size={15} />
        </div>
        Retour
      </button>

      {/* ══ HERO CARD ══ */}
      <div className="bg-white rounded-3xl border border-teal-100 overflow-hidden mb-5 shadow-sm">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-300" />

        <div className="px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold tracking-tight shadow-lg shadow-teal-200">
              {initials}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm ${user.isActive ? "bg-teal-400" : "bg-slate-300"}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{user.fullname}</h1>
              {user.memberlevel && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${LEVEL_COLORS[user.memberlevel] ?? "bg-slate-100 text-slate-600"}`}>
                  {user.memberlevel.charAt(0).toUpperCase() + user.memberlevel.slice(1)}
                </span>
              )}
              {profile?.grade && (
                <span className={`text-sm font-bold px-2.5 py-1 rounded-xl border ${gradeColor(profile.grade)}`}>
                  {profile.grade}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mb-2">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
              {user.company && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
                  {user.company.name}
                </span>
              )}
              {profile?.employmentStatus && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${STATUS_COLORS[profile.employmentStatus] ?? ""}`}>
                  {STATUS_LABELS[profile.employmentStatus] ?? profile.employmentStatus}
                </span>
              )}
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => router.push(`/Dashboard/users/${user.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 active:scale-95 transition-all shadow-sm shadow-teal-200 w-full sm:w-auto justify-center"
          >
            <Pencil size={15} /> Modifier
          </button>
        </div>

        {/* Score strip */}
        {isMember && profile && (
          <div className="border-t border-teal-50 px-5 sm:px-8 py-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label="Score global"
              value={`${Number(profile.globalScore).toFixed(1)}`}
              sub="/ 120 pts"
              icon={<Star size={14} />}
            />
            <MetricCard
              label="Taux à temps"
              value={`${(Number(profile.onTimeRate) * 100).toFixed(1)}%`}
              color={Number(profile.onTimeRate) >= 0.75 ? "text-teal-600" : "text-amber-600"}
              icon={<Clock size={14} />}
            />
            <MetricCard
              label="Tâches totales"
              value={profile.totalTasksDone}
              sub={`${profile.earlyCount} avance · ${profile.lateCount} retard`}
              icon={<CheckCircle2 size={14} />}
            />
            <MetricCard
              label="Évolution"
              value={
                profile.scoreEvolution != null
                  ? `${profile.scoreEvolution > 0 ? "▲" : "▼"} ${Math.abs(Number(profile.scoreEvolution)).toFixed(1)}`
                  : "—"
              }
              color={
                profile.scoreEvolution == null
                  ? "text-slate-400"
                  : profile.scoreEvolution > 0
                  ? "text-teal-600"
                  : "text-red-500"
              }
              icon={<TrendingUp size={14} />}
            />
          </div>
        )}
      </div>

      {/* ══ GRID: Account info + HR Profile ══ */}
      <div className={`grid gap-5 ${isMember ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>

        {/* Informations du compte */}
        <div className="bg-white rounded-3xl border border-teal-100 p-5 sm:p-6 shadow-sm">
          <SectionTitle icon={<User size={16} />}>Informations du compte</SectionTitle>
          <InfoRow icon={<Mail size={15} />}      label="Email"          value={user.email} />
          <InfoRow icon={<Phone size={15} />}     label="Téléphone"      value={user.numtel || "—"} />
          <InfoRow icon={<Shield size={15} />}    label="Rôle"           value={ROLE_LABELS[user.role] ?? user.role} />
          <InfoRow icon={<Building2 size={15} />} label="Société"        value={user.company?.name ?? "Indépendant"} />
          {user.cvlink && (
            <InfoRow
              icon={<FileText size={15} />}
              label="CV"
              value={
                <a href={user.cvlink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline flex items-center gap-1 text-sm">
                  Voir le CV <ChevronRight size={12} />
                </a>
              }
            />
          )}
          <InfoRow
            icon={
              user.isActive
                ? <CheckCircle2 size={15} className="text-teal-500" />
                : <XCircle size={15} className="text-red-400" />
            }
            label="Statut du compte"
            value={
              <span className={user.isActive ? "text-teal-600" : "text-red-500"}>
                {user.isActive ? "Compte actif" : "Compte inactif"}
              </span>
            }
          />
        </div>

        {/* Profil RH */}
        {isMember && (
          <div className="bg-white rounded-3xl border border-teal-100 p-5 sm:p-6 shadow-sm">
            <SectionTitle icon={<Briefcase size={16} />}>Profil RH</SectionTitle>

            {profileLoading ? (
              <div className="flex items-center gap-2 text-teal-400 text-sm py-6 justify-center">
                <Loader2 className="animate-spin" size={16} /> Chargement…
              </div>
            ) : !profile ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-3">
                  <AlertCircle className="text-teal-300" size={22} />
                </div>
                <p className="text-sm text-slate-500 font-medium">Aucun profil RH configuré</p>
                <button
                  onClick={() => router.push(`/Dashboard/users/${user.id}/edit`)}
                  className="mt-3 text-xs font-semibold text-teal-600 hover:underline"
                >
                  Créer depuis la fiche de modification →
                </button>
              </div>
            ) : (
              <>
                <InfoRow icon={<Calendar size={15} />}    label="Type de contrat"  value={CONTRACT_LABELS[profile.contractType] ?? profile.contractType} />
                <InfoRow icon={<Calendar size={15} />}    label="Date d'embauche"   value={new Date(profile.hireDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} />
                <InfoRow icon={<Briefcase size={15} />}   label="Poste"             value={profile.position ?? "—"} />
                <InfoRow
                  icon={<DollarSign size={15} />}
                  label="Rémunération"
                  value={
                    <span>
                      {profile.baseSalary != null ? `${Number(profile.baseSalary).toLocaleString("fr-FR")} TND` : "—"}
                      {profile.bonuses > 0 && (
                        <span className="text-xs text-teal-600 ml-1">+ {Number(profile.bonuses).toLocaleString("fr-FR")} bonus</span>
                      )}
                    </span>
                  }
                />
                <InfoRow
                  icon={<TrendingUp size={15} />}
                  label="Note RH"
                  value={
                    <span className="flex items-center gap-1">
                      {Number(profile.performanceRating).toFixed(1)}
                      <span className="text-amber-400 text-xs">{"★".repeat(Math.round(profile.performanceRating))}</span>
                    </span>
                  }
                />
                <InfoRow
                  icon={<Clock size={15} />}
                  label="Assiduité"
                  value={
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1">
                        <ScoreBar
                          value={profile.attendanceRate}
                          max={100}
                          color={
                            profile.attendanceRate >= 90
                              ? "#0d9488"
                              : profile.attendanceRate >= 75
                              ? "#d97706"
                              : "#dc2626"
                          }
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{Number(profile.attendanceRate).toFixed(1)}%</span>
                    </div>
                  }
                />
                {profile.absenceCount > 0 && (
                  <InfoRow
                    icon={<AlertCircle size={15} />}
                    label="Absences"
                    value={<span className="text-red-500">{profile.absenceCount} absence{profile.absenceCount > 1 ? "s" : ""}</span>}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ══ SKILL PROFILE ══ */}
      {isMember && profile && (
        <SkillProfile profile={profile} projects={projects} />
      )}

      {/* ══ STATISTIQUES DÉTAILLÉES ══ */}
      {isMember && profile && (
        <div className="mt-5 bg-white rounded-3xl border border-teal-100 overflow-hidden shadow-sm">
          <TabBar tabs={statsTabs as any} active={activeTab} onChange={k => setActiveTab(k as any)} />

          <div className="p-4 sm:p-6">

            {/* Vue globale */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <MetricCard label="Score / tâche"  value={`${Number(profile.globalScore).toFixed(1)} pts`} sub="max 120 pts" icon={<Award size={14} />} />
                  <MetricCard label="En avance"       value={profile.earlyCount}  sub="tâches" color="text-teal-600"  icon={<Zap size={14} />} />
                  <MetricCard label="À l'heure"       value={profile.onTimeCount} sub="tâches" color="text-cyan-600"  icon={<CheckCircle2 size={14} />} />
                  <MetricCard label="En retard"       value={profile.lateCount}   sub="tâches" color="text-red-500"   icon={<AlertCircle size={14} />} />
                  <MetricCard label="Délai moyen"     value={`${profile.avgDelayHours > 0 ? "+" : ""}${Number(profile.avgDelayHours).toFixed(1)}h`} color={profile.avgDelayHours <= 0 ? "text-teal-600" : profile.avgDelayHours <= 24 ? "text-amber-600" : "text-red-500"} icon={<Clock size={14} />} />
                  <MetricCard label="Délai cumulé"    value={`${Number(profile.totalDelayHours).toFixed(0)}h`} icon={<Activity size={14} />} />
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-teal-500 uppercase tracking-wider">Score par domaine</p>
                  {[
                    { label: "IT",          score: profile.itScore,         tasks: profile.itTasksDone,         delay: profile.itAvgDelay,         color: "#0891b2" },
                    { label: "Marketing",   score: profile.marketingScore,  tasks: profile.marketingTasksDone,  delay: profile.marketingAvgDelay,  color: "#db2777" },
                    { label: "Call Center", score: profile.callCenterScore, tasks: profile.callCenterTasksDone, delay: profile.callCenterAvgDelay, color: "#0d9488" },
                  ]
                    .filter(d => d.tasks > 0)
                    .map(d => (
                      <div key={d.label} className="flex items-center gap-3 sm:gap-4">
                        <span className="text-xs font-medium text-slate-600 w-24 flex-shrink-0">{d.label}</span>
                        <div className="flex-1"><ScoreBar value={d.score} max={120} color={d.color} /></div>
                        <span className="text-xs font-bold text-slate-800 w-16 text-right">{Number(d.score).toFixed(1)} pts</span>
                        <span className="text-xs text-slate-400 w-16 text-right hidden sm:block">{d.tasks} tâches</span>
                      </div>
                    ))}
                </div>

                {profile.scoreUpdatedAt && (
                  <p className="text-xs text-slate-400">
                    Mise à jour : {new Date(profile.scoreUpdatedAt).toLocaleString("fr-FR")}
                  </p>
                )}
              </div>
            )}

            {/* IT */}
            {activeTab === "it" && profile.itTasksDone > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard label="Score IT"     value={`${Number(profile.itScore).toFixed(1)} pts`}    sub="/ 120 pts" color="text-cyan-700" />
                  <MetricCard label="Tâches IT"    value={profile.itTasksDone}                            sub="complétées" />
                  <MetricCard label="Délai moy."   value={`${profile.itAvgDelay > 0 ? "+" : ""}${Number(profile.itAvgDelay).toFixed(1)}h`} color={profile.itAvgDelay <= 0 ? "text-teal-600" : "text-amber-600"} />
                </div>
                <ScoreBar value={profile.itScore} max={120} color="#0891b2" />
              </div>
            )}

            {/* Marketing */}
            {activeTab === "marketing" && profile.marketingTasksDone > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard label="Score Mktg"   value={`${Number(profile.marketingScore).toFixed(1)} pts`} sub="/ 120 pts" color="text-pink-700" />
                  <MetricCard label="Tâches"        value={profile.marketingTasksDone}                        sub="complétées" />
                  <MetricCard label="Délai moy."    value={`${profile.marketingAvgDelay > 0 ? "+" : ""}${Number(profile.marketingAvgDelay).toFixed(1)}h`} color={profile.marketingAvgDelay <= 0 ? "text-teal-600" : "text-amber-600"} />
                </div>
                <ScoreBar value={profile.marketingScore} max={120} color="#db2777" />
              </div>
            )}

            {/* Call Center */}
            {activeTab === "callcenter" && profile.callCenterTasksDone > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard label="Score CC"    value={`${Number(profile.callCenterScore).toFixed(1)} pts`} sub="/ 120 pts" color="text-teal-700" />
                  <MetricCard label="Tâches CC"   value={profile.callCenterTasksDone}                        sub="complétées" />
                  <MetricCard label="Délai moy."  value={`${profile.callCenterAvgDelay > 0 ? "+" : ""}${Number(profile.callCenterAvgDelay).toFixed(1)}h`} color={profile.callCenterAvgDelay <= 0 ? "text-teal-600" : "text-amber-600"} />
                </div>
                <ScoreBar value={profile.callCenterScore} max={120} color="#0d9488" />
              </div>
            )}

            {/* Dernières tâches */}
            {activeTab === "tasks" && (
              <div>
                {!profile.recentTasksSnapshot || profile.recentTasksSnapshot.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">Aucune tâche dans le snapshot.</p>
                ) : (
                  <div className="space-y-2">
                    {profile.recentTasksSnapshot.map((t, index) => {
                      const delay = delayLabel(t.delayHours);
                      const domain = DOMAIN_CONFIG[t.domain as keyof typeof DOMAIN_CONFIG] ?? {
                        color: "bg-slate-50 border-slate-100 text-slate-800",
                        accent: "#64748b",
                        label: t.domain,
                        dot: "bg-slate-400",
                        badge: "bg-slate-50 text-slate-700",
                      };
                      return (
                        <div key={`${t.domain}-${t.taskId}-${index}`} className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-2xl border ${domain.color}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{t.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs opacity-60">{t.domain}</span>
                              <span className="text-xs opacity-40">·</span>
                              <span className="text-xs opacity-60">{new Date(t.completedAt).toLocaleDateString("fr-FR")}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${delay.cls}`}>{delay.text}</span>
                          <span className="text-sm font-bold w-14 text-right flex-shrink-0" style={{ color: domain.accent }}>{t.points} pts</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}