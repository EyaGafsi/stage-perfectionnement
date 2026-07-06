"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Edit2,
} from "lucide-react";

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

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  [ContractType.CDI]: "📄 CDI (Contrat Indéterminé)",
  [ContractType.CDD]: "📋 CDD (Contrat Déterminé)",
  [ContractType.STAGE]: "🎓 Stage",
  [ContractType.FREELANCE]: "🚀 Freelance",
};

const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  [EmploymentStatus.ACTIVE]: "✅ Actif",
  [EmploymentStatus.INACTIVE]: "⛔ Inactif",
  [EmploymentStatus.ON_LEAVE]: "🏖️ En congé",
  [EmploymentStatus.TERMINATED]: "❌ Résilié",
};

const DEPARTURE_REASON_LABELS: Record<DepartureReason, string> = {
  [DepartureReason.RESIGNATION]: "✍️ Démission",
  [DepartureReason.TERMINATION]: "🔴 Licenciement",
  [DepartureReason.END_OF_CONTRACT]: "📋 Fin de contrat",
  [DepartureReason.RETIREMENT]: "🏡 Retraite",
  [DepartureReason.OTHER]: "❓ Autre",
};

interface MemberProfile {
  id: number;
  userId: number;
  companyId: number | null;
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
  createdAt: string;
  updatedAt: string;
}

interface CurrentUser {
  id: number;
  role: UserRole;
  companyId?: number | null;
  company?: { id: number; name: string } | null;
}

interface MemberProfileFormProps {
  userId: number;
  onBack?: () => void;
}

const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_COMPANY,
  UserRole.HR_MANAGER,
];

const CAN_VIEW_OTHERS: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_COMPANY,
  UserRole.HR_MANAGER,
  UserRole.MANAGER,
];

export default function MemberProfileForm({
  userId,
  onBack,
}: MemberProfileFormProps) {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("Token manquant");

        const userStr = localStorage.getItem("user");
        if (!userStr) throw new Error("Utilisateur non trouvé");

        const rawUser = JSON.parse(userStr);
        // BUG FIX: companyId can be stored directly or nested under company.id
        const currentUserData: CurrentUser = {
          ...rawUser,
          companyId: rawUser.companyId ?? rawUser.company?.id ?? null,
        };
        setCurrentUser(currentUserData);

        const baseUrl = process.env.NEXT_PUBLIC_NEST_API_URL;
        const isSelf = currentUserData.id === userId;
        const canViewOthers = CAN_VIEW_OTHERS.includes(currentUserData.role);

        if (!isSelf && !canViewOthers) {
          setPermissionDenied(true);
          setLoading(false);
          return;
        }

        // Always use the userId-based URL when viewing others (HR manager viewing a member)
        const url = isSelf
          ? `${baseUrl}/member-profiles/me`
          : `${baseUrl}/member-profiles/${userId}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          setIsCreating(true);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          if (res.status === 403) setPermissionDenied(true);
          else throw new Error("Impossible de charger le profil");
          setLoading(false);
          return;
        }

        const data: MemberProfile = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // BUG FIX: when 404 is returned (isCreating=true), initialize profile with defaults
  // so the form can render immediately without an extra click
  useEffect(() => {
    if (isCreating && !profile && currentUser) {
      setProfile({
        id: 0,
        userId,
        companyId: currentUser.companyId ?? null,
        contractType: ContractType.CDI,
        hireDate: new Date().toISOString().split("T")[0],
        employmentStatus: EmploymentStatus.ACTIVE,
        position: null,
        baseSalary: null,
        bonuses: 0,
        totalCompensation: 0,
        performanceRating: 0,
        projectsCompleted: 0,
        attendanceRate: 100,
        absenceCount: 0,
        deactivationDate: null,
        departureReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [isCreating, currentUser, profile, userId]);

  const canEdit = (): boolean => {
    if (!currentUser) return false;
    return ADMIN_ROLES.includes(currentUser.role) || currentUser.id === userId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      setError("");
      const token = localStorage.getItem("access_token");
      const baseUrl = process.env.NEXT_PUBLIC_NEST_API_URL;

      if (isCreating) {
        // POST — CreateMemberProfileDto
        const res = await fetch(`${baseUrl}/member-profiles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            contractType: profile.contractType,
            hireDate: profile.hireDate,
            position: profile.position || undefined,
            baseSalary: profile.baseSalary ?? undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Échec de la création");
        }

        const created: MemberProfile = await res.json();
        setProfile(created);
        setIsCreating(false);
        setIsEditing(false);
      } else {
        // PATCH — UpdateMemberProfileDto (tous les champs)
        const res = await fetch(`${baseUrl}/member-profiles/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            contractType: profile.contractType,
            hireDate: profile.hireDate,
            position: profile.position || null,
            employmentStatus: profile.employmentStatus,
            baseSalary: profile.baseSalary,
            bonuses: profile.bonuses,
            performanceRating: profile.performanceRating,
            projectsCompleted: profile.projectsCompleted,
            attendanceRate: profile.attendanceRate,
            absenceCount: profile.absenceCount,
            deactivationDate: profile.deactivationDate || null,
            departureReason: profile.departureReason || null,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Échec de la mise à jour");
        }

        const updated: MemberProfile = await res.json();
        setProfile(updated);
        setIsEditing(false);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle =
    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200";
  const labelStyle =
    "text-sm font-bold text-slate-600 flex items-center gap-2 mb-1";
  const readOnlyStyle =
    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-medium";

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
          <p className="text-slate-500">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl bg-red-50 p-6 text-center">
        <XCircle className="mx-auto mb-2 text-red-600" size={32} />
        <p className="text-red-700 font-medium">
          Vous n'avez pas les permissions pour accéder à ce profil
        </p>
      </div>
    );
  }

  if (error && !profile && !isCreating) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl bg-red-50 p-6 text-center">
        <XCircle className="mx-auto mb-2 text-red-600" size={32} />
        <p className="text-red-700 font-medium">{error}</p>
      </div>
    );
  }

  if (!profile && !isCreating) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl bg-yellow-50 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 text-yellow-600" size={32} />
        <p className="text-yellow-700 font-medium">
          Aucun profil trouvé pour cet utilisateur
        </p>
        {canEdit() && (
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Créer un profil
          </button>
        )}
      </div>
    );
  }

  const currentProfile = profile!;
  const isViewMode = !isEditing && !isCreating;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {onBack && (
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-6 font-medium"
        >
          <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
            <ArrowLeft size={18} />
          </div>
          Retour
        </button>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 md:p-10 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/40 backdrop-blur-sm">
                <Briefcase className="text-blue-400" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {isCreating ? "Créer un profil professionnel" : "Profil professionnel"}
                </h1>
                <p className="text-slate-400 mt-1 font-medium">
                  Gérer les informations d'emploi et de performance
                </p>
              </div>
            </div>

            {isViewMode && canEdit() && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Edit2 size={16} />
                Modifier
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-xl text-sm flex items-center gap-3 font-medium">
              <CheckCircle2 size={20} />
              Profil {isCreating ? "créé" : "modifié"} avec succès !
            </div>
          )}

          {/* ── SECTION 1 : EMPLOI ────────────────────────── */}
          <div className="space-y-6 pb-8 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase size={22} className="text-blue-600" />
              Informations d'emploi
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Type de contrat */}
              <div className="space-y-1">
                <label className={labelStyle}>
                  <Calendar size={15} className="text-blue-500" /> Type de contrat
                </label>
                {isViewMode ? (
                  <div className={readOnlyStyle}>
                    {CONTRACT_TYPE_LABELS[currentProfile.contractType]}
                  </div>
                ) : (
                  <select
                    className={`${inputStyle} appearance-none cursor-pointer`}
                    value={currentProfile.contractType}
                    onChange={(e) =>
                      setProfile({ ...currentProfile, contractType: e.target.value as ContractType })
                    }
                  >
                    {Object.entries(CONTRACT_TYPE_LABELS).map(([type, label]) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date d'embauche */}
              <div className="space-y-1">
                <label className={labelStyle}>
                  <Calendar size={15} className="text-blue-500" /> Date d'embauche
                </label>
                {isViewMode ? (
                  <div className={readOnlyStyle}>
                    {new Date(currentProfile.hireDate).toLocaleDateString("fr-FR")}
                  </div>
                ) : (
                  <input
                    required
                    type="date"
                    className={inputStyle}
                    value={currentProfile.hireDate?.split("T")[0] ?? ""}
                    onChange={(e) =>
                      setProfile({ ...currentProfile, hireDate: e.target.value })
                    }
                  />
                )}
              </div>

              {/* Statut d'emploi */}
              <div className="space-y-1">
                <label className={labelStyle}>
                  <CheckCircle2 size={15} className="text-emerald-500" /> Statut d'emploi
                </label>
                {isViewMode ? (
                  <div className={readOnlyStyle}>
                    {EMPLOYMENT_STATUS_LABELS[currentProfile.employmentStatus]}
                  </div>
                ) : (
                  <select
                    className={`${inputStyle} appearance-none cursor-pointer`}
                    value={currentProfile.employmentStatus}
                    onChange={(e) =>
                      setProfile({
                        ...currentProfile,
                        employmentStatus: e.target.value as EmploymentStatus,
                        ...(e.target.value !== EmploymentStatus.TERMINATED && {
                          deactivationDate: null,
                          departureReason: null,
                        }),
                      })
                    }
                  >
                    {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([status, label]) => (
                      <option key={status} value={status}>{label}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Poste */}
              <div className="space-y-1">
                <label className={labelStyle}>
                  <Briefcase size={15} className="text-blue-500" /> Poste
                </label>
                {isViewMode ? (
                  <div className={readOnlyStyle}>
                    {currentProfile.position || "Non spécifié"}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Ex: Développeur Senior"
                    className={inputStyle}
                    value={currentProfile.position || ""}
                    onChange={(e) =>
                      setProfile({ ...currentProfile, position: e.target.value })
                    }
                  />
                )}
              </div>

              {/* Date de départ — visible en edit même si pas TERMINATED */}
              {(!isViewMode || currentProfile.employmentStatus === EmploymentStatus.TERMINATED) && (
                <div className="space-y-1">
                  <label className={labelStyle}>
                    <Calendar size={15} className="text-red-500" /> Date de départ
                  </label>
                  {isViewMode ? (
                    <div className={readOnlyStyle}>
                      {currentProfile.deactivationDate
                        ? new Date(currentProfile.deactivationDate).toLocaleDateString("fr-FR")
                        : "Non spécifiée"}
                    </div>
                  ) : (
                    <input
                      type="date"
                      className={inputStyle}
                      value={currentProfile.deactivationDate?.split("T")[0] || ""}
                      onChange={(e) =>
                        setProfile({ ...currentProfile, deactivationDate: e.target.value || null })
                      }
                    />
                  )}
                </div>
              )}

              {/* Raison de départ — visible en edit même si pas TERMINATED */}
              {(!isViewMode || currentProfile.employmentStatus === EmploymentStatus.TERMINATED) && (
                <div className="space-y-1">
                  <label className={labelStyle}>
                    <AlertCircle size={15} className="text-red-500" /> Raison du départ
                  </label>
                  {isViewMode ? (
                    <div className={readOnlyStyle}>
                      {currentProfile.departureReason
                        ? DEPARTURE_REASON_LABELS[currentProfile.departureReason]
                        : "Non spécifiée"}
                    </div>
                  ) : (
                    <select
                      className={`${inputStyle} appearance-none cursor-pointer`}
                      value={currentProfile.departureReason || ""}
                      onChange={(e) =>
                        setProfile({
                          ...currentProfile,
                          departureReason: (e.target.value as DepartureReason) || null,
                        })
                      }
                    >
                      <option value="">-- Sélectionner --</option>
                      {Object.entries(DEPARTURE_REASON_LABELS).map(([reason, label]) => (
                        <option key={reason} value={reason}>{label}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 2 : SALAIRE ───────────────────────── */}
          <div className="space-y-6 pb-8 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <DollarSign size={22} className="text-green-600" />
              Informations salariales
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
              {/* Salaire de base */}
              <div className="space-y-1">
                <label className={labelStyle}>
                  <DollarSign size={15} className="text-green-500" /> Salaire de base
                </label>
                {isViewMode ? (
                  <div className={readOnlyStyle}>
                    {currentProfile.baseSalary
                      ? `${Number(currentProfile.baseSalary).toLocaleString("fr-FR")} TND`
                      : "Non spécifié"}
                  </div>
                ) : (
                  <input
                    type="number"
                    step="100"
                    min="0"
                    placeholder="0"
                    className={inputStyle}
                    value={currentProfile.baseSalary || ""}
                    onChange={(e) =>
                      setProfile({
                        ...currentProfile,
                        baseSalary: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                  />
                )}
              </div>

              {/* Bonus */}
              <div className="space-y-1">
                <label className={labelStyle}>
                  <TrendingUp size={15} className="text-green-500" /> Bonus
                </label>
                {isViewMode ? (
                  <div className={readOnlyStyle}>
                    {Number(currentProfile.bonuses).toLocaleString("fr-FR")} TND
                  </div>
                ) : (
                  <input
                    type="number"
                    step="100"
                    min="0"
                    placeholder="0"
                    className={inputStyle}
                    value={currentProfile.bonuses}
                    onChange={(e) =>
                      setProfile({
                        ...currentProfile,
                        bonuses: e.target.value ? parseFloat(e.target.value) : 0,
                      })
                    }
                  />
                )}
              </div>

              {/* Compensation totale — toujours calculée */}
              <div className="space-y-1">
                <label className={labelStyle}>
                  <DollarSign size={15} className="text-green-500" /> Compensation totale
                </label>
                <div className={readOnlyStyle}>
                  <span className="text-green-600 font-bold">
                    {(
                      (Number(currentProfile.baseSalary) || 0) +
                      Number(currentProfile.bonuses)
                    ).toLocaleString("fr-FR")}{" "}
                    TND
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3 : PERFORMANCE ───────────────────── */}
          <div className="space-y-6 pb-8 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={22} className="text-amber-600" />
              Évaluation de performance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Note de performance */}
              <div className="space-y-1">
                <label className={labelStyle}>
                  <TrendingUp size={15} className="text-amber-500" /> Note de performance (0–5)
                </label>
                {isViewMode ? (
                  <div className={readOnlyStyle}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-amber-600">
                        {Number(currentProfile.performanceRating).toFixed(2)}
                      </span>
                      <span className="text-2xl">
                        {"⭐".repeat(Math.round(Number(currentProfile.performanceRating)))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    className={inputStyle}
                    value={currentProfile.performanceRating}
                    onChange={(e) =>
                      setProfile({
                        ...currentProfile,
                        performanceRating: parseFloat(e.target.value),
                      })
                    }
                  />
                )}
              </div>

              {/* Projets complétés */}
              <div className="space-y-1">
                <label className={labelStyle}>
                  <CheckCircle2 size={15} className="text-amber-500" /> Projets complétés
                </label>
                {isViewMode ? (
                  <div className={readOnlyStyle}>
                    {currentProfile.projectsCompleted} projet
                    {currentProfile.projectsCompleted !== 1 ? "s" : ""}
                  </div>
                ) : (
                  <input
                    type="number"
                    min="0"
                    className={inputStyle}
                    value={currentProfile.projectsCompleted}
                    onChange={(e) =>
                      setProfile({
                        ...currentProfile,
                        projectsCompleted: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── SECTION 4 : ASSIDUITÉ ─────────────────────── */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock size={22} className="text-purple-600" />
              Assiduité et présence
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Taux d'assiduité */}
              <div className="space-y-1">
                <label className={labelStyle}>
                  <Clock size={15} className="text-purple-500" /> Taux d'assiduité (%)
                </label>
                {isViewMode ? (
                  <div className={readOnlyStyle}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            currentProfile.attendanceRate >= 90
                              ? "bg-emerald-500"
                              : currentProfile.attendanceRate >= 80
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${currentProfile.attendanceRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 min-w-fit">
                        {Number(currentProfile.attendanceRate).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className={inputStyle}
                    value={currentProfile.attendanceRate}
                    onChange={(e) =>
                      setProfile({
                        ...currentProfile,
                        attendanceRate: parseFloat(e.target.value),
                      })
                    }
                  />
                )}
              </div>

              {/* Nombre d'absences */}
              <div className="space-y-1">
                <label className={labelStyle}>
                  <AlertCircle size={15} className="text-purple-500" /> Nombre d'absences
                </label>
                {isViewMode ? (
                  <div className={readOnlyStyle}>
                    <span
                      className={
                        currentProfile.absenceCount === 0
                          ? "text-emerald-600 font-bold"
                          : "text-red-600 font-bold"
                      }
                    >
                      {currentProfile.absenceCount} absence
                      {currentProfile.absenceCount > 1 ? "s" : ""}
                    </span>
                  </div>
                ) : (
                  <input
                    type="number"
                    min="0"
                    className={inputStyle}
                    value={currentProfile.absenceCount}
                    onChange={(e) =>
                      setProfile({
                        ...currentProfile,
                        absenceCount: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────── */}
          <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium italic">
              * Dernière modification :{" "}
              {new Date(currentProfile.updatedAt).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            {(isEditing || isCreating) && (
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    if (isCreating) {
                      setProfile(null);
                      setIsCreating(false);
                    }
                  }}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Annuler
                </button>
                <button
                  disabled={saving}
                  type="submit"
                  className="flex-1 sm:flex-none px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-200 focus:ring-4 focus:ring-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {saving
                    ? "Enregistrement..."
                    : isCreating
                    ? "Créer le profil"
                    : "Enregistrer les modifications"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}