"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, Shield, Building2, Save, ArrowLeft,
  CheckCircle2, XCircle, Award, FileText, Phone,
  Loader2, Briefcase, DollarSign, Calendar, TrendingUp,
  AlertCircle, ChevronDown,
} from "lucide-react";

// ─── Enums ────────────────────────────────────────────────────────────────────

enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN_COMPANY = "admin_company",
  MANAGER = "manager",
  PROJECT_MANAGER = "project_manager",
  CALL_CENTER_MANAGER = "call_center_manager",
  SALES_MANAGER = "sales_manager",
  MARKETING_MANAGER = "marketing_manager",
  QUALITY_MANAGER = "quality_manager",
  HR_MANAGER = "hr_manager",
  AGENT_TELEPRO = "agent_telepro",
  COMMERCIAL = "commercial",
  MARKETING_AGENT = "marketing_agent",
  QUALITE_AGENT = "qualite_agent",
  TECH_SUPPORT = "tech_support",
  MEMBER = "member",
}

enum MemberLevel {
  JUNIOR = "junior",
  SENIOR = "senior",
  EXPERT = "expert",
}

enum ContractType {
  CDI = "cdi",
  CDD = "cdd",
  STAGE = "stage",
  FREELANCE = "freelance",
}

enum EmploymentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ON_LEAVE = "on_leave",
  TERMINATED = "terminated",
}

enum DepartureReason {
  RESIGNATION = "resignation",
  TERMINATION = "termination",
  END_OF_CONTRACT = "end_of_contract",
  RETIREMENT = "retirement",
  OTHER = "other",
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const ROLE_CREATION_RULES: Partial<Record<UserRole, UserRole[]>> = {
  [UserRole.SUPER_ADMIN]: Object.values(UserRole),
  [UserRole.ADMIN_COMPANY]: [
    UserRole.ADMIN_COMPANY, UserRole.MANAGER, UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER, UserRole.SALES_MANAGER, UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER, UserRole.HR_MANAGER, UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL, UserRole.MARKETING_AGENT, UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT, UserRole.MEMBER,
  ],
  [UserRole.MANAGER]: [
    UserRole.MEMBER, UserRole.AGENT_TELEPRO, UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT, UserRole.QUALITE_AGENT, UserRole.TECH_SUPPORT,
    UserRole.PROJECT_MANAGER,
  ],
  [UserRole.PROJECT_MANAGER]: [UserRole.MEMBER],
  [UserRole.CALL_CENTER_MANAGER]: [UserRole.AGENT_TELEPRO],
  [UserRole.SALES_MANAGER]: [UserRole.COMMERCIAL],
  [UserRole.MARKETING_MANAGER]: [UserRole.MARKETING_AGENT],
  [UserRole.QUALITY_MANAGER]: [UserRole.QUALITE_AGENT],
  [UserRole.HR_MANAGER]: [UserRole.MEMBER, UserRole.PROJECT_MANAGER],
};

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: "Super Administrateur",
  [UserRole.ADMIN_COMPANY]: "Admin Société",
  [UserRole.MANAGER]: "Manager",
  [UserRole.PROJECT_MANAGER]: "Chef de projet",
  [UserRole.CALL_CENTER_MANAGER]: "Manager Call Center",
  [UserRole.SALES_MANAGER]: "Manager Ventes",
  [UserRole.MARKETING_MANAGER]: "Manager Marketing",
  [UserRole.QUALITY_MANAGER]: "Manager Qualité",
  [UserRole.HR_MANAGER]: "Manager RH",
  [UserRole.AGENT_TELEPRO]: "Agent Telepro",
  [UserRole.COMMERCIAL]: "Commercial",
  [UserRole.MARKETING_AGENT]: "Agent Marketing",
  [UserRole.QUALITE_AGENT]: "Agent Qualité",
  [UserRole.TECH_SUPPORT]: "Support Technique",
  [UserRole.MEMBER]: "Membre standard",
};

const MEMBER_LEVEL_LABELS: Record<MemberLevel, string> = {
  [MemberLevel.JUNIOR]: "Junior",
  [MemberLevel.SENIOR]: "Senior",
  [MemberLevel.EXPERT]: "Expert",
};

const CONTRACT_LABELS: Record<ContractType, string> = {
  [ContractType.CDI]: "CDI — Indéterminé",
  [ContractType.CDD]: "CDD — Déterminé",
  [ContractType.STAGE]: "Stage",
  [ContractType.FREELANCE]: "Freelance",
};

const STATUS_LABELS: Record<EmploymentStatus, string> = {
  [EmploymentStatus.ACTIVE]: "Actif",
  [EmploymentStatus.INACTIVE]: "Inactif",
  [EmploymentStatus.ON_LEAVE]: "En congé",
  [EmploymentStatus.TERMINATED]: "Résilié",
};

const DEPARTURE_LABELS: Record<DepartureReason, string> = {
  [DepartureReason.RESIGNATION]: "Démission",
  [DepartureReason.TERMINATION]: "Licenciement",
  [DepartureReason.END_OF_CONTRACT]: "Fin de contrat",
  [DepartureReason.RETIREMENT]: "Retraite",
  [DepartureReason.OTHER]: "Autre",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company { id: number; name: string }

interface UserType {
  id: number;
  fullname: string;
  email: string;
  numtel: string;
  cvlink: string;
  role: UserRole;
  memberlevel?: MemberLevel | null;
  company?: Company | null;
  isActive: boolean;
}

interface MemberProfile {
  id: number;
  contractType: ContractType;
  hireDate: string;
  employmentStatus: EmploymentStatus;
  position: string | null;
  baseSalary: number | null;
  bonuses: number;
  totalCompensation: number;
  performanceRating: number;
  projectsCompleted: number;
  attendanceRate: number;
  absenceCount: number;
  deactivationDate: string | null;
  departureReason: DepartureReason | null;
  // Score fields
  globalScore: number;
  grade: string;
  totalTasksDone: number;
  onTimeRate: number;
  scoreEvolution: number | null;
  scoreUpdatedAt: string | null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200 text-sm";
const labelCls =
  "text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5";
const readonlyCls =
  "w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-700 font-medium text-sm";

// ─── Helper : normalise attendanceRate venant de l'API ────────────────────────
// L'API retourne parfois une fraction (0.0–1.0) ; on s'assure d'avoir 0–100.
function normaliseAttendanceRate(raw: number): number {
  if (raw >= 0 && raw <= 1) return Number((raw * 100).toFixed(1));
  return Number(Math.min(100, Math.max(0, raw)).toFixed(1));
}

// ─── Composant Section ────────────────────────────────────────────────────────

function Section({
  icon, title, subtitle, color, badge, children, defaultOpen = true,
}: {
  icon: React.ReactNode; title: string; subtitle: string;
  color: string; badge?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-slate-100 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              {badge}
            </div>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && <div className="px-6 py-5">{children}</div>}
    </div>
  );
}

// ─── Grade badge ─────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    "A+": "bg-green-100 text-green-800",
    A: "bg-emerald-100 text-emerald-800",
    B: "bg-blue-100 text-blue-800",
    C: "bg-amber-100 text-amber-800",
    D: "bg-orange-100 text-orange-800",
    F: "bg-red-100 text-red-800",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${colors[grade] ?? "bg-slate-100 text-slate-600"}`}>
      {grade}
    </span>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function EditUserPage({ id }: { id: string }) {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [requesterRole, setRequesterRole] = useState<UserRole | null>(null);
  const [requesterCompanyId, setRequesterCompanyId] = useState<number | null>(null);
  const [requesterId, setRequesterId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const EVALUATED_ROLES = [
    UserRole.MEMBER,
    UserRole.PROJECT_MANAGER,
  ];

  const isMember = user && EVALUATED_ROLES.includes(user.role);

  // ── Permissions ────────────────────────────────────────────────────────────

  const canManageUser = () => {
    if (!user || !requesterRole) return false;
    if (requesterRole === UserRole.SUPER_ADMIN) return true;
    if (user.id === requesterId) return true;
    // BUG FIX: compare company ids robustly — both must be non-null to compare
    const sameCompany =
      requesterCompanyId !== null &&
      user.company?.id !== undefined &&
      user.company.id === requesterCompanyId;
    if (!sameCompany) return false;
    return (ROLE_CREATION_RULES[requesterRole] || []).includes(user.role);
  };

  const canEditRole = () => requesterRole === UserRole.SUPER_ADMIN;
  const canEditProfile = () =>
    requesterRole === UserRole.SUPER_ADMIN ||
    requesterRole === UserRole.ADMIN_COMPANY ||
    requesterRole === UserRole.HR_MANAGER;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const meStr = localStorage.getItem("user");
        if (!token || !meStr) throw new Error("Session invalide");

        const me = JSON.parse(meStr);
        setRequesterRole(me.role);
        // BUG FIX: localStorage user may store companyId directly OR as company.id
        const resolvedCompanyId = me.companyId ?? me.company?.id ?? null;
        setRequesterCompanyId(resolvedCompanyId);
        setRequesterId(me.id);

        const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Impossible de charger l'utilisateur");
        const data: UserType = await res.json();
        setUser(data);

        // Si role évaluable → charger le profil RH
        const evaluatedRoles = [
          UserRole.MEMBER,
          UserRole.PROJECT_MANAGER,
        ];
        if (evaluatedRoles.includes(data.role)) {
          setProfileLoading(true);
          const pRes = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/member-profiles/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (pRes.ok) {
            const pData: MemberProfile = await pRes.json();
            // FIX: normalise attendanceRate → toujours 0–100
            setProfile({
              ...pData,
              attendanceRate: normaliseAttendanceRate(pData.attendanceRate),
            });
            setProfileExists(true);
          } else if (pRes.status === 404) {
            setProfileExists(false);
          }
          setProfileLoading(false);
        }
      } catch (err: any) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [id]);

  // ── Submit utilisateur ────────────────────────────────────────────────────

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canManageUser()) {
      setError("Permissions insuffisantes");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const token = localStorage.getItem("access_token");

      const payload: any = {
        fullname: user.fullname,
        email: user.email,
        numtel: user.numtel,
        cvlink: user.cvlink,
        isActive: user.isActive,
      };
      if (canEditRole()) payload.role = user.role;
      if (isMember) payload.memberlevel = user.memberlevel;

      const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Échec de la mise à jour");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Submit profil RH ──────────────────────────────────────────────────────

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setSaving(true);
      setError("");
      const token = localStorage.getItem("access_token");
      const baseUrl = process.env.NEXT_PUBLIC_NEST_API_URL;

      // FIX: sanitize all numeric fields before sending to the API
      const safeAttendanceRate = isNaN(profile.attendanceRate)
        ? 0
        : Math.min(100, Math.max(0, profile.attendanceRate));

      // baseSalary: null/undefined/NaN → 0, negative → 0
      const safeBaseSalary =
        profile.baseSalary == null || isNaN(profile.baseSalary)
          ? 0
          : Math.max(0, profile.baseSalary);

      // bonuses: null/undefined/NaN → 0, negative → 0
      const safeBonuses =
        profile.bonuses == null || isNaN(profile.bonuses) || profile.bonuses < 0
          ? 0
          : profile.bonuses;

      const safePerformanceRating = isNaN(profile.performanceRating)
        ? 0
        : Math.min(5, Math.max(0, profile.performanceRating));

      if (!profileExists) {
        // Créer
        const res = await fetch(`${baseUrl}/member-profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            userId: parseInt(id),
            contractType: profile.contractType,
            hireDate: profile.hireDate,
            employmentStatus: profile.employmentStatus,
            position: profile.position || null,
            baseSalary: safeBaseSalary,
            bonuses: safeBonuses,
            performanceRating: safePerformanceRating,
            projectsCompleted: profile.projectsCompleted,
            attendanceRate: safeAttendanceRate,
            absenceCount: profile.absenceCount,
            deactivationDate: profile.deactivationDate || null,
            departureReason: profile.departureReason || null,
          }),
        });
        if (!res.ok) {
          const e = await res.json();
          throw new Error(Array.isArray(e.message) ? e.message.join(", ") : e.message);
        }
        const created: MemberProfile = await res.json();
        setProfile({
          ...created,
          attendanceRate: normaliseAttendanceRate(created.attendanceRate),
        });
        setProfileExists(true);
      } else {
        // Mettre à jour
        const patchPayload = {
          contractType: profile.contractType,
          hireDate: profile.hireDate,
          employmentStatus: profile.employmentStatus,
          position: profile.position || null,
          baseSalary: safeBaseSalary,
          bonuses: safeBonuses,
          performanceRating: safePerformanceRating,
          projectsCompleted: profile.projectsCompleted,
          attendanceRate: safeAttendanceRate,
          absenceCount: profile.absenceCount,
          deactivationDate: profile.deactivationDate || null,
          departureReason: profile.departureReason || null,
        };

        const res = await fetch(`${baseUrl}/member-profiles/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(patchPayload),
        });
        if (!res.ok) {
          const e = await res.json();
          throw new Error(Array.isArray(e.message) ? e.message.join(", ") : e.message);
        }
        const updated: MemberProfile = await res.json();
        setProfile({
          ...updated,
          attendanceRate: normaliseAttendanceRate(updated.attendanceRate),
        });
      }

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / Error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin mx-auto text-blue-600" size={28} />
          <p className="text-slate-500 text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user || !canManageUser()) {
    return (
      <div className="mx-auto max-w-xl mt-10 rounded-2xl bg-red-50 border border-red-100 p-8 text-center">
        <XCircle className="mx-auto mb-3 text-red-400" size={32} />
        <p className="text-red-700 font-medium text-sm">
          {error || "Accès non autorisé ou utilisateur introuvable"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* ── Back ── */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 text-sm font-medium"
      >
        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400 transition-colors">
          <ArrowLeft size={15} />
        </div>
        Retour à la liste
      </button>

      {/* ── Header ── */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center">
          <User size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Modifier l'utilisateur</h1>
          <p className="text-sm text-slate-500">{user.fullname} · {user.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* ── Alertes globales ── */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* ══ SECTION 1 : Compte ════════════════════════════════════════════ */}
        <form onSubmit={handleSubmitUser}>
          <Section
            icon={<User size={18} className="text-blue-600" />}
            title="Identité & accès"
            subtitle="Informations du compte"
            color="bg-blue-50"
            defaultOpen
          >
            {success && (
              <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle2 size={15} /> Compte mis à jour avec succès
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nom */}
              <div>
                <label className={labelCls}><User size={13} /> Nom complet</label>
                <input
                  required type="text" className={inputCls} value={user.fullname}
                  onChange={(e) => setUser({ ...user, fullname: e.target.value })}
                />
              </div>

              {/* Email */}
              <div>
                <label className={labelCls}><Mail size={13} /> Email</label>
                <input
                  required type="email" className={inputCls} value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className={labelCls}><Phone size={13} /> Téléphone</label>
                <input
                  required type="tel" className={inputCls} value={user.numtel}
                  onChange={(e) => setUser({ ...user, numtel: e.target.value })}
                />
              </div>

              {/* CV */}
              <div>
                <label className={labelCls}><FileText size={13} /> Lien CV</label>
                <input
                  type="url" className={inputCls} value={user.cvlink ?? ""}
                  onChange={(e) => setUser({ ...user, cvlink: e.target.value })}
                />
              </div>

              {/* Société (lecture seule) */}
              {user.company && (
                <div>
                  <label className={labelCls}><Building2 size={13} /> Société</label>
                  <div className={readonlyCls}>{user.company.name}</div>
                </div>
              )}

              {/* Rôle (Super Admin seulement) */}
              {canEditRole() ? (
                <div>
                  <label className={labelCls}><Shield size={13} /> Rôle</label>
                  <select
                    className={`${inputCls} appearance-none`} value={user.role}
                    onChange={(e) => setUser({ ...user, role: e.target.value as UserRole })}
                  >
                    {Object.values(UserRole).map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className={labelCls}><Shield size={13} /> Rôle</label>
                  <div className={readonlyCls}>{ROLE_LABELS[user.role]}</div>
                </div>
              )}

              {/* Niveau (si MEMBER) */}
              {isMember && (
                <div>
                  <label className={labelCls}><Award size={13} /> Niveau</label>
                  <select
                    className={`${inputCls} appearance-none`}
                    value={user.memberlevel || MemberLevel.JUNIOR}
                    onChange={(e) => setUser({ ...user, memberlevel: e.target.value as MemberLevel })}
                  >
                    {Object.entries(MEMBER_LEVEL_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Statut actif */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox" checked={user.isActive}
                    onChange={(e) => setUser({ ...user, isActive: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <div className="flex items-center gap-2">
                    {user.isActive
                      ? <CheckCircle2 size={15} className="text-emerald-500" />
                      : <XCircle size={15} className="text-red-400" />}
                    <span className="text-sm font-medium text-slate-700">
                      Compte {user.isActive ? "actif" : "inactif"}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                type="submit" disabled={saving}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                {saving ? "Enregistrement…" : "Sauvegarder le compte"}
              </button>
            </div>
          </Section>
        </form>

        {/* ══ SECTION 2 : Profil RH (MEMBER seulement) ════════════════════ */}
        {isMember && (
          <form onSubmit={handleSubmitProfile}>
            <Section
              icon={<Briefcase size={18} className="text-violet-600" />}
              title="Profil RH"
              subtitle={profileExists ? "Contrat, performance et rémunération" : "Aucun profil — cliquez pour créer"}
              color="bg-violet-50"
              badge={
                profile?.grade ? <GradeBadge grade={profile.grade} /> : undefined
              }
              defaultOpen
            >
              {profileSuccess && (
                <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
                  <CheckCircle2 size={15} /> Profil RH mis à jour
                </div>
              )}

              {profileLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
                  <Loader2 className="animate-spin" size={16} /> Chargement du profil RH…
                </div>
              ) : !profile ? (
                // Pas de profil → formulaire de création minimal
                <div>
                  <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle size={15} /> Aucun profil RH pour ce membre
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfile({
                      id: 0,
                      contractType: ContractType.CDI,
                      hireDate: new Date().toISOString().split("T")[0],
                      employmentStatus: EmploymentStatus.ACTIVE,
                      position: null,
                      baseSalary: null,
                      bonuses: 0,
                      totalCompensation: 0,
                      performanceRating: 0,
                      projectsCompleted: 0,
                      attendanceRate: 100, // déjà en pourcentage
                      absenceCount: 0,
                      deactivationDate: null,
                      departureReason: null,
                      globalScore: 0,
                      grade: "F",
                      totalTasksDone: 0,
                      onTimeRate: 0,
                      scoreEvolution: null,
                      scoreUpdatedAt: null,
                    })}
                    className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
                  >
                    + Créer le profil RH
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Score summary (lecture seule) */}
                  {profileExists && profile.totalTasksDone > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                      {[
                        { label: "Score global", value: `${Number(profile.globalScore).toFixed(1)} pts`, color: "text-violet-700" },
                        { label: "Tâches complétées", value: profile.totalTasksDone, color: "text-slate-900" },
                        { label: "Taux à temps", value: `${(Number(profile.onTimeRate) * 100).toFixed(1)}%`, color: "text-emerald-700" },
                        {
                          label: "Évolution",
                          value: profile.scoreEvolution != null
                            ? `${profile.scoreEvolution > 0 ? "+" : ""}${Number(profile.scoreEvolution).toFixed(1)}`
                            : "N/A",
                          color: profile.scoreEvolution && profile.scoreEvolution > 0
                            ? "text-emerald-600"
                            : "text-red-500",
                        },
                      ].map((s) => (
                        <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                          <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                          <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Champs éditables (si canEditProfile) */}
                  <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Contrat */}
                        <div>
                          <label className={labelCls}><Calendar size={13} /> Type de contrat</label>
                          <select disabled={!canEditProfile()}
                            className={`${inputCls} appearance-none`}
                            value={profile.contractType}
                            onChange={(e) => setProfile({ ...profile, contractType: e.target.value as ContractType })}
                          >
                            {Object.entries(CONTRACT_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>

                        {/* Date embauche */}
                        <div>
                          <label className={labelCls}><Calendar size={13} /> Date d'embauche</label>
                          <input disabled={!canEditProfile()}
                            type="date" className={inputCls}
                            value={profile.hireDate?.split("T")[0] ?? ""}
                            onChange={(e) => setProfile({ ...profile, hireDate: e.target.value })}
                          />
                        </div>

                        {/* Statut */}
                        <div>
                          <label className={labelCls}><CheckCircle2 size={13} /> Statut d'emploi</label>
                          <select disabled={!canEditProfile()}
                            className={`${inputCls} appearance-none`}
                            value={profile.employmentStatus}
                            onChange={(e) => setProfile({ ...profile, employmentStatus: e.target.value as EmploymentStatus })}
                          >
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>

                        {/* Poste */}
                        <div>
                          <label className={labelCls}><Briefcase size={13} /> Poste</label>
                          <input disabled={!canEditProfile()}
                            type="text" placeholder="Ex : Développeur Senior"
                            className={inputCls} value={profile.position || ""}
                            onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                          />
                        </div>

                        {/* Salaire */}
                        <div>
                          <label className={labelCls}><DollarSign size={13} /> Salaire de base (TND)</label>
                          <input disabled={!canEditProfile()}
                            type="number" min="0" step="100"
                            className={inputCls} value={profile.baseSalary ?? ""}
                            onChange={(e) => setProfile({ ...profile, baseSalary: e.target.value ? parseFloat(e.target.value) : null })}
                          />
                        </div>

                        {/* Bonus */}
                        <div>
                          <label className={labelCls}><TrendingUp size={13} /> Bonus (TND)</label>
                          <input disabled={!canEditProfile()}
                            type="number" min="0" step="100"
                            className={inputCls} value={profile.bonuses}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setProfile({ ...profile, bonuses: isNaN(val) || val < 0 ? 0 : val });
                            }}
                          />
                        </div>

                        {/* Performance */}
                        <div>
                          <label className={labelCls}><TrendingUp size={13} /> Note RH (0–5)</label>
                          <input disabled={!canEditProfile()}
                            type="number" min="0" max="5" step="0.5"
                            className={inputCls} value={profile.performanceRating}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setProfile({ ...profile, performanceRating: isNaN(val) ? 0 : Math.min(5, Math.max(0, val)) });
                            }}
                          />
                        </div>

                        {/* Projets */}
                        <div>
                          <label className={labelCls}><CheckCircle2 size={13} /> Projets complétés</label>
                          <input disabled={!canEditProfile()}
                            type="number" min="0"
                            className={inputCls} value={profile.projectsCompleted}
                            onChange={(e) => setProfile({ ...profile, projectsCompleted: parseInt(e.target.value) || 0 })}
                          />
                        </div>

                        {/* Assiduité — FIX: min/max 0–100, valeur déjà normalisée */}
                        <div>
                          <label className={labelCls}><CheckCircle2 size={13} /> Taux assiduité (%)</label>
                          <input disabled={!canEditProfile()}
                            type="number" min="0" max="100" step="0.1"
                            className={inputCls}
                            value={profile.attendanceRate}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setProfile({
                                ...profile,
                                attendanceRate: isNaN(val) ? 0 : Math.min(100, Math.max(0, val)),
                              });
                            }}
                          />
                        </div>

                        {/* Absences */}
                        <div>
                          <label className={labelCls}><AlertCircle size={13} /> Absences</label>
                          <input disabled={!canEditProfile()}
                            type="number" min="0"
                            className={inputCls} value={profile.absenceCount}
                            onChange={(e) => setProfile({ ...profile, absenceCount: parseInt(e.target.value) || 0 })}
                          />
                        </div>

                        {/* Raison départ */}
                        <div>
                          <label className={labelCls}><AlertCircle size={13} /> Raison de départ</label>
                          <select disabled={!canEditProfile()}
                            className={`${inputCls} appearance-none`}
                            value={profile.departureReason || ""}
                            onChange={(e) => setProfile({ ...profile, departureReason: (e.target.value as DepartureReason) || null })}
                          >
                            <option value="">— Aucune —</option>
                            {Object.entries(DEPARTURE_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>

                        {/* Date de départ */}
                        <div>
                          <label className={labelCls}><Calendar size={13} /> Date de départ</label>
                          <input disabled={!canEditProfile()}
                            type="date" className={inputCls}
                            value={profile.deactivationDate?.split("T")[0] || ""}
                            onChange={(e) => setProfile({ ...profile, deactivationDate: e.target.value || null })}
                          />
                        </div>

                        {/* Compensation totale */}
                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-violet-50 border border-violet-100">
                            <span className="text-sm text-violet-700 font-medium">Compensation totale</span>
                            <span className="text-base font-bold text-violet-900">
                              {((Number(profile.baseSalary) || 0) + Number(profile.bonuses || 0)).toLocaleString("fr-FR")} TND
                            </span>
                          </div>
                        </div>
                      </div>

                      {canEditProfile() && (
<div className="flex justify-end">
                        <button
                          type="submit" disabled={saving}
                          className="px-8 py-2.5 bg-violet-700 text-white rounded-xl text-sm font-semibold hover:bg-violet-800 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                          {saving ? "Enregistrement…" : profileExists ? "Sauvegarder le profil RH" : "Créer le profil RH"}
                        </button>
                      </div>
)}
</>
                </div>
              )}
            </Section>
          </form>
        )}
      </div>
    </div>
  );
}