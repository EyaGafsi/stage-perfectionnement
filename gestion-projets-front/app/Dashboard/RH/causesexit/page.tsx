"use client";

import { useEffect, useState, useMemo } from "react";
import {
  TrendingDown, Users, Clock, DollarSign, AlertTriangle,
  ThumbsUp, ThumbsDown, Loader2, RefreshCw, Filter, Sparkles,
} from "lucide-react";
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberProfile {
  id: number;
  userId: number;
  contractType: string;
  hireDate: string;
  employmentStatus: string;
  position: string | null;
  baseSalary: number | null;
  bonuses: number;
  performanceRating: number;
  attendanceRate: number;
  absenceCount: number;
  deactivationDate: string | null;
  departureReason: string | null;
  globalScore: number;
  grade: string;
  totalTasksDone: number;
  onTimeCount: number;
  lateCount: number;
  avgDelayHours: number;
  onTimeRate: number;
  itTasksDone: number;
  itScore: number;
  marketingTasksDone: number;
  marketingScore: number;
  callCenterTasksDone: number;
  callCenterScore: number;
  scoreEvolution: number | null;
  user?: { fullname: string; role: string; memberlevel?: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  resignation: "Démission",
  termination: "Licenciement",
  end_of_contract: "Fin contrat",
  retirement: "Retraite",
  other: "Autre",
};

const REASON_COLORS: Record<string, string> = {
  resignation:    "#F43F5E",
  termination:    "#F59E0B",
  end_of_contract:"#0EA5E9",
  retirement:     "#10B981",
  other:          "#94A3B8",
};

const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI", cdd: "CDD", stage: "Stage", freelance: "Freelance",
};

const CONTRACT_COLORS: Record<string, string> = {
  cdi: "#0D9488", cdd: "#0EA5E9", stage: "#F43F5E", freelance: "#94A3B8",
};

const LEVEL_COLORS: Record<string, string> = {
  junior: "#0EA5E9", senior: "#8B5CF6", expert: "#F59E0B",
};

const X_AXIS_OPTIONS = [
  { value: "tenure",            label: "Durée (mois)" },
  { value: "baseSalary",        label: "Salaire (TND)" },
  { value: "performanceRating", label: "Note RH" },
  { value: "absenceCount",      label: "Absences" },
  { value: "attendanceRate",    label: "Assiduité %" },
  { value: "globalScore",       label: "Score perf." },
];

const Y_AXIS_OPTIONS = [
  { value: "baseSalary",        label: "Salaire (TND)" },
  { value: "tenure",            label: "Durée (mois)" },
  { value: "performanceRating", label: "Note RH" },
  { value: "absenceCount",      label: "Absences" },
  { value: "attendanceRate",    label: "Assiduité %" },
  { value: "globalScore",       label: "Score perf." },
];

const COLOR_BY_OPTIONS = [
  { value: "reason",   label: "Raison départ" },
  { value: "contract", label: "Contrat" },
  { value: "level",    label: "Niveau" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcTenureMonths(hireDate: string, deactivationDate: string | null): number {
  const start = new Date(hireDate);
  const end = deactivationDate ? new Date(deactivationDate) : new Date();
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

type EnrichedProfile = MemberProfile & { tenure: number };

function getFieldValue(p: EnrichedProfile, key: string): number {
  const map: Record<string, number> = {
    tenure: p.tenure,
    baseSalary: p.baseSalary ?? 0,
    performanceRating: p.performanceRating,
    absenceCount: p.absenceCount,
    attendanceRate: p.attendanceRate,
    globalScore: p.globalScore,
  };
  return map[key] ?? 0;
}

function getLevel(p: MemberProfile): string {
  return p.user?.memberlevel ?? "junior";
}

function getColorForMember(p: MemberProfile, colorBy: string): { color: string; label: string } {
  if (colorBy === "reason") {
    const r = p.departureReason ?? "other";
    return { color: REASON_COLORS[r] ?? "#888", label: REASON_LABELS[r] ?? r };
  }
  if (colorBy === "contract") {
    return { color: CONTRACT_COLORS[p.contractType] ?? "#888", label: CONTRACT_LABELS[p.contractType] ?? p.contractType };
  }
  const lvl = getLevel(p);
  return { color: LEVEL_COLORS[lvl] ?? "#888", label: lvl.charAt(0).toUpperCase() + lvl.slice(1) };
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
      {accent && (
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
      )}
      <div className="flex items-start justify-between mb-2">
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${accent ? "text-teal-100" : "text-slate-400"}`}>
          {label}
        </p>
        {icon && (
          <span className={`${accent ? "text-teal-100" : "text-teal-400"}`}>{icon}</span>
        )}
      </div>
      <p className={`text-xl font-bold leading-none ${accent ? "text-white" : "text-slate-800"}`}>{value}</p>
      {sub && <p className={`text-[11px] mt-1.5 ${accent ? "text-teal-100" : "text-slate-400"}`}>{sub}</p>}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

function SectionCard({ title, icon, children, className = "" }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-slate-50">
          {icon && <span className="text-teal-500">{icon}</span>}
          <h2 className="text-[13px] font-bold text-slate-700 tracking-tight">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function StyledSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-[12px] px-3 py-2 rounded-xl border border-teal-100 bg-teal-50/50 text-teal-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-300 cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ScatterTooltip({ active, payload, xAxis, yAxis }: any) {
  if (!active || !payload?.length) return null;
  const xLabel = X_AXIS_OPTIONS.find(o => o.value === xAxis)?.label;
  const yLabel = Y_AXIS_OPTIONS.find(o => o.value === yAxis)?.label;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-teal-100 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-bold text-slate-700 mb-1.5">{payload[0]?.name}</p>
      <p className="text-slate-500">{xLabel}: <span className="font-semibold text-teal-700">{d?.x}</span></p>
      <p className="text-slate-500">{yLabel}: <span className="font-semibold text-teal-700">{d?.y}</span></p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExitAnalyticsPage() {
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [activeProfiles, setActiveProfiles] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [xAxis, setXAxis] = useState("tenure");
  const [yAxis, setYAxis] = useState("baseSalary");
  const [colorBy, setColorBy] = useState("reason");
  const [filterContract, setFilterContract] = useState("all");
  const [filterReason, setFilterReason] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_NEST_API_URL}/member-profiles`,
          { headers }
        );
        if (!res.ok) throw new Error("Erreur lors du chargement des profils");
        const all: MemberProfile[] = await res.json();
        setProfiles(all.filter(p => p.employmentStatus === "inactive" || p.employmentStatus === "terminated"));
        setActiveProfiles(all.filter(p => p.employmentStatus === "active"));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const enriched = useMemo<EnrichedProfile[]>(() =>
    profiles.map(p => ({ ...p, tenure: calcTenureMonths(p.hireDate, p.deactivationDate) })),
    [profiles]
  );

  const filtered = useMemo<EnrichedProfile[]>(() =>
    enriched.filter(p => {
      if (filterContract !== "all" && p.contractType !== filterContract) return false;
      if (filterReason !== "all" && (p.departureReason ?? "other") !== filterReason) return false;
      return true;
    }),
    [enriched, filterContract, filterReason]
  );

  const avgTenure = filtered.length
    ? Math.round(filtered.reduce((s, p) => s + p.tenure, 0) / filtered.length) : 0;
  const medianSalary = median(filtered.map(p => Number(p.baseSalary ?? 0)));

  const reasonCounts = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach(p => { const r = p.departureReason ?? "other"; c[r] = (c[r] || 0) + 1; });
    return c;
  }, [filtered]);
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];

  const levelCounts = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach(p => { const l = getLevel(p); c[l] = (c[l] || 0) + 1; });
    return c;
  }, [filtered]);
  const topLevel = Object.entries(levelCounts).sort((a, b) => b[1] - a[1])[0];

  const scatterGroups = useMemo(() => {
    const groups: Record<string, { color: string; points: { x: number; y: number }[] }> = {};
    filtered.forEach(p => {
      const { color, label } = getColorForMember(p, colorBy);
      if (!groups[label]) groups[label] = { color, points: [] };
      groups[label].points.push({ x: getFieldValue(p, xAxis), y: getFieldValue(p, yAxis) });
    });
    return Object.entries(groups).map(([label, g]) => ({ label, color: g.color, points: g.points }));
  }, [filtered, xAxis, yAxis, colorBy]);

  const scatterLegendItems = useMemo(() => {
    const seen = new Set<string>();
    const items: { color: string; label: string }[] = [];
    filtered.forEach(p => {
      const { color, label } = getColorForMember(p, colorBy);
      if (!seen.has(label)) { seen.add(label); items.push({ color, label }); }
    });
    return items;
  }, [filtered, colorBy]);

  const reasonByContractData = useMemo(() => {
    const contracts = ["cdi", "cdd", "stage", "freelance"];
    const reasons = Object.keys(REASON_LABELS);
    return contracts.map(c => {
      const row: Record<string, any> = { contract: CONTRACT_LABELS[c] };
      reasons.forEach(r => {
        row[REASON_LABELS[r]] = filtered.filter(
          p => p.contractType === c && (p.departureReason ?? "other") === r
        ).length;
      });
      return row;
    });
  }, [filtered]);

  const tenureByLevelData = useMemo(() => {
    const levels = ["junior", "senior", "expert"];
    return levels.map(l => {
      const grp = filtered.filter(p => getLevel(p) === l);
      return {
        level: l.charAt(0).toUpperCase() + l.slice(1),
        value: grp.length ? Math.round(grp.reduce((s, p) => s + p.tenure, 0) / grp.length) : 0,
        color: LEVEL_COLORS[l],
      };
    });
  }, [filtered]);

  const salaryBuckets = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000];
  function buildHist(salaries: number[]) {
    return salaryBuckets.slice(0, -1).map((_, i) =>
      salaries.filter(v => v >= salaryBuckets[i] && v < salaryBuckets[i + 1]).length
    );
  }
  const salaryDistData = useMemo(() => {
    const exiting = buildHist(filtered.map(p => p.baseSalary ?? 0));
    const active = buildHist(activeProfiles.map(p => p.baseSalary ?? 0));
    return salaryBuckets.slice(0, -1).map((b, i) => ({
      range: `${b}–${salaryBuckets[i + 1]}`,
      Sortants: exiting[i],
      Actifs: active[i],
    }));
  }, [filtered, activeProfiles]);

  const perfByReasonData = useMemo(() =>
    Object.keys(REASON_LABELS).map(r => {
      const grp = filtered.filter(p => (p.departureReason ?? "other") === r);
      return {
        reason: REASON_LABELS[r],
        value: grp.length ? Math.round((grp.reduce((s, p) => s + p.performanceRating, 0) / grp.length) * 10) / 10 : 0,
        color: REASON_COLORS[r],
      };
    }),
    [filtered]
  );

  const attendanceByReasonData = useMemo(() =>
    Object.keys(REASON_LABELS).map(r => {
      const grp = filtered.filter(p => (p.departureReason ?? "other") === r);
      return {
        reason: REASON_LABELS[r],
        value: grp.length ? Math.round(grp.reduce((s, p) => s + p.attendanceRate, 0) / grp.length) : 0,
        color: REASON_COLORS[r],
      };
    }),
    [filtered]
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-200">
          <Loader2 className="animate-spin text-white" size={22} />
        </div>
        <p className="text-sm text-slate-400 font-medium">Chargement des données…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md mt-16 rounded-3xl bg-red-50 border border-red-100 p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-red-400" size={22} />
        </div>
        <p className="text-red-700 font-semibold text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-5">

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 p-6 md:p-8 shadow-xl shadow-teal-200/50">
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 translate-y-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-cyan-200" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-200">RH Analytics</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
              Analyse des départs
            </h1>
            <p className="text-sm text-teal-100 mt-1.5">
              {filtered.length} membre{filtered.length > 1 ? "s" : ""} analysé{filtered.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all border border-white/20 self-start sm:self-auto"
          >
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 mr-1">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
              <Filter size={13} className="text-teal-500" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Filtres</span>
          </div>
          <StyledSelect
            value={filterContract}
            onChange={setFilterContract}
            options={[
              { value: "all", label: "Tous les contrats" },
              ...Object.entries(CONTRACT_LABELS).map(([k, v]) => ({ value: k, label: v })),
            ]}
          />
          <StyledSelect
            value={filterReason}
            onChange={setFilterReason}
            options={[
              { value: "all", label: "Toutes les raisons" },
              ...Object.entries(REASON_LABELS).map(([k, v]) => ({ value: k, label: v })),
            ]}
          />
          {(filterContract !== "all" || filterReason !== "all") && (
            <button
              onClick={() => { setFilterContract("all"); setFilterReason("all"); }}
              className="text-[12px] text-teal-600 hover:text-teal-800 font-semibold px-2 py-1 rounded-lg hover:bg-teal-50 transition-colors"
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Membres analysés"
          value={filtered.length}
          icon={<Users size={15} />}
          accent
        />
        <KpiCard
          label="Durée moy. avant départ"
          value={`${avgTenure} mois`}
          icon={<Clock size={14} />}
        />
        <KpiCard
          label="Salaire médian"
          value={`${medianSalary.toLocaleString("fr-FR")} TND`}
          icon={<DollarSign size={14} />}
        />
        <KpiCard
          label="Principale raison"
          value={topReason ? REASON_LABELS[topReason[0]] : "—"}
          sub={topReason ? `${topReason[1]} cas` : ""}
          icon={<TrendingDown size={14} />}
        />
        <KpiCard
          label="Niveau à risque"
          value={topLevel ? topLevel[0].charAt(0).toUpperCase() + topLevel[0].slice(1) : "—"}
          sub={topLevel ? `${topLevel[1]} départs` : ""}
          icon={<AlertTriangle size={14} />}
        />
      </div>

      {/* ── Scatter Chart ── */}
      <SectionCard title="Courbe personnalisable" icon={<TrendingDown size={15} />}>
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold">Axe X</span>
            <StyledSelect value={xAxis} onChange={setXAxis} options={X_AXIS_OPTIONS} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold">Axe Y</span>
            <StyledSelect value={yAxis} onChange={setYAxis} options={Y_AXIS_OPTIONS} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold">Couleur</span>
            <StyledSelect value={colorBy} onChange={setColorBy} options={COLOR_BY_OPTIONS} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          {scatterLegendItems.map(i => <LegendDot key={i.label} {...i} />)}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" />
            <XAxis
              type="number" dataKey="x"
              name={X_AXIS_OPTIONS.find(o => o.value === xAxis)?.label}
              label={{ value: X_AXIS_OPTIONS.find(o => o.value === xAxis)?.label, position: "insideBottom", offset: -15, fontSize: 11, fill: "#94a3b8" }}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <YAxis
              type="number" dataKey="y"
              name={Y_AXIS_OPTIONS.find(o => o.value === yAxis)?.label}
              label={{ value: Y_AXIS_OPTIONS.find(o => o.value === yAxis)?.label, angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <Tooltip content={<ScatterTooltip xAxis={xAxis} yAxis={yAxis} />} />
            {scatterGroups.map(g => (
              <Scatter key={g.label} name={g.label} data={g.points} fill={g.color} fillOpacity={0.8} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* ── 2-col charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <SectionCard title="Raisons par contrat" icon={<Users size={15} />}>
          <div className="flex flex-wrap gap-2.5 mb-4">
            {Object.entries(REASON_LABELS).map(([k, v]) => (
              <LegendDot key={k} color={REASON_COLORS[k]} label={v} />
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={reasonByContractData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" />
              <XAxis dataKey="contract" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip />
              {Object.entries(REASON_LABELS).map(([k, v]) => (
                <Bar key={k} dataKey={v} stackId="a" fill={REASON_COLORS[k]}
                  radius={k === "other" ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Durée moy. avant départ par niveau" icon={<Clock size={15} />}>
          <div className="flex flex-wrap gap-2.5 mb-4">
            {Object.entries(LEVEL_COLORS).map(([k, v]) => (
              <LegendDot key={k} color={v} label={k.charAt(0).toUpperCase() + k.slice(1)} />
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tenureByLevelData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" />
              <XAxis dataKey="level" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} label={{ value: "Mois", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip formatter={(v: any) => [`${v} mois`, "Durée moy."]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {tenureByLevelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Note RH moyenne par raison" icon={<TrendingDown size={15} />}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={perfByReasonData} margin={{ top: 5, right: 10, bottom: 25, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" />
              <XAxis dataKey="reason" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-15} textAnchor="end" />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "#94a3b8" }} label={{ value: "/ 5", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip formatter={(v: any) => [`${v} / 5`, "Note RH moy."]} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {perfByReasonData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Assiduité moyenne par raison" icon={<Clock size={15} />}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceByReasonData} margin={{ top: 5, right: 10, bottom: 25, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" />
              <XAxis dataKey="reason" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-15} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} label={{ value: "%", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip formatter={(v: any) => [`${v}%`, "Assiduité moy."]} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {attendanceByReasonData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* ── Salary distribution ── */}
      <SectionCard title="Distribution salariale — sortants vs actifs" icon={<DollarSign size={15} />}>
        <div className="flex flex-wrap gap-3 mb-4">
          <LegendDot color="#F43F5E" label="Sortants (inactifs)" />
          <LegendDot color="#0D9488" label="Actifs (référence)" />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={salaryDistData} margin={{ top: 5, right: 10, bottom: 35, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" />
            <XAxis dataKey="range" tick={{ fontSize: 9, fill: "#94a3b8" }} angle={-30} textAnchor="end" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip />
            <Bar dataKey="Sortants" fill="#F43F5E" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Actifs"   fill="#0D9488" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* ── Profiles ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-slate-50">
          <span className="text-teal-500"><Users size={15} /></span>
          <h2 className="text-[13px] font-bold text-slate-700 tracking-tight">Profils à recruter vs profils à risque</h2>
        </div>
        <div className="p-5 space-y-5">

          {/* Two profile cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Ideal */}
            <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center">
                  <ThumbsUp size={15} className="text-teal-600" />
                </div>
                <p className="text-[13px] font-bold text-teal-800">Profil idéal à recruter</p>
              </div>
              {[
                ["Contrat", "CDI"],
                ["Niveau", "Senior"],
                ["Salaire", "3 500 – 5 000 TND"],
                ["Assiduité min.", "≥ 90%"],
                ["Note RH min.", "≥ 3.5 / 5"],
                ["Durée moy. prévue", `${Math.round(
                  filtered.filter(p => getLevel(p) === "senior").reduce((s, p) => s + p.tenure, 0) /
                  Math.max(filtered.filter(p => getLevel(p) === "senior").length, 1)
                )} mois`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-2 border-b border-teal-100/60 last:border-0">
                  <span className="text-[12px] text-teal-700">{k}</span>
                  <span className="text-[12px] font-bold text-teal-900">{v}</span>
                </div>
              ))}
            </div>

            {/* Risk */}
            <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                  <ThumbsDown size={15} className="text-rose-500" />
                </div>
                <p className="text-[13px] font-bold text-rose-800">Profil à risque élevé</p>
              </div>
              {[
                ["Contrat", "Stage / CDD"],
                ["Niveau", "Junior"],
                ["Salaire", `< ${Math.round(
                  median(filtered.filter(p => getLevel(p) === "junior").map(p => p.baseSalary ?? 0))
                ).toLocaleString("fr-FR")} TND`],
                ["Assiduité", "< 75%"],
                ["Note RH", "< 2.5 / 5"],
                ["Durée moy. prévue", `${Math.round(
                  filtered.filter(p => getLevel(p) === "junior").reduce((s, p) => s + p.tenure, 0) /
                  Math.max(filtered.filter(p => getLevel(p) === "junior").length, 1)
                )} mois`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-2 border-b border-rose-100/60 last:border-0">
                  <span className="text-[12px] text-rose-700">{k}</span>
                  <span className="text-[12px] font-bold text-rose-900">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Insights grid */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Insights calculés</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Taux démission juniors",
                  value: filtered.filter(p => getLevel(p) === "junior").length
                    ? Math.round(
                        filtered.filter(p => getLevel(p) === "junior" && p.departureReason === "resignation").length /
                        Math.max(filtered.filter(p => getLevel(p) === "junior").length, 1) * 100
                      ) + "%" : "—",
                  color: "text-rose-600", bg: "bg-rose-50",
                },
                {
                  label: "Durée moy. stage",
                  value: filtered.filter(p => p.contractType === "stage").length
                    ? Math.round(
                        filtered.filter(p => p.contractType === "stage").reduce((s, p) => s + p.tenure, 0) /
                        filtered.filter(p => p.contractType === "stage").length
                      ) + " mois" : "—",
                  color: "text-amber-600", bg: "bg-amber-50",
                },
                {
                  label: "Assiduité moy. licenciés",
                  value: filtered.filter(p => p.departureReason === "termination").length
                    ? Math.round(
                        filtered.filter(p => p.departureReason === "termination").reduce((s, p) => s + p.attendanceRate, 0) /
                        filtered.filter(p => p.departureReason === "termination").length
                      ) + "%" : "—",
                  color: "text-rose-600", bg: "bg-rose-50",
                },
                {
                  label: "Score moy. démissionnaires",
value: filtered.filter(p => p.departureReason === "resignation").length
  ? Math.round(
      filtered.filter(p => p.departureReason === "resignation").reduce((s, p) => s + Number(p.globalScore ?? 0), 0) /
      filtered.filter(p => p.departureReason === "resignation").length
    ) + " pts" : "—",
                  color: "text-violet-600", bg: "bg-violet-50",
                },
                {
                  label: "Durée moy. experts",
                  value: filtered.filter(p => getLevel(p) === "expert").length
                    ? Math.round(
                        filtered.filter(p => getLevel(p) === "expert").reduce((s, p) => s + p.tenure, 0) /
                        filtered.filter(p => getLevel(p) === "expert").length
                      ) + " mois" : "—",
                  color: "text-teal-600", bg: "bg-teal-50",
                },
{
  label: "Salaire moy. CDI sortants",
  value: filtered.filter(p => p.contractType === "cdi").length
    ? Math.round(
        filtered.filter(p => p.contractType === "cdi").reduce((s, p) => s + Number(p.baseSalary ?? 0), 0) /
        filtered.filter(p => p.contractType === "cdi").length
      ).toLocaleString("fr-FR") + " TND" : "—",
  color: "text-sky-600", bg: "bg-sky-50",
},
              ].map(i => (
                <div key={i.label} className={`rounded-2xl ${i.bg} border border-white p-3.5 shadow-sm`}>
                  <p className="text-[11px] text-slate-500 mb-1.5 leading-tight">{i.label}</p>
                  <p className={`text-[17px] font-black ${i.color}`}>{i.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}