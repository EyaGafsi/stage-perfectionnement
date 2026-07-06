"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus, ArrowLeft, Mail, User, Phone,
  Lock, Shield, Building2, Loader2, CheckCircle2,
  Eye, EyeOff, Award, FileText, Briefcase,
  DollarSign, Calendar, ChevronDown, TrendingUp,
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
  [UserRole.HR_MANAGER]: [UserRole.MEMBER],
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

// ─── Styles partagés ──────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200 text-sm";

const labelCls =
  "text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5";

const sectionCls =
  "bg-white rounded-2xl border border-slate-200 overflow-hidden";

const sectionHeaderCls =
  "flex items-center justify-between px-6 py-4 border-b border-slate-100 cursor-pointer select-none";

// ─── Section collapsible ──────────────────────────────────────────────────────

function Section({
  icon,
  title,
  subtitle,
  color,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={sectionCls}>
      <div className={sectionHeaderCls} onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
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

// ─── Page principale ──────────────────────────────────────────────────────────

export default function CreateUserPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);

  // Compte utilisateur
  const [formData, setFormData] = useState({
    email: "",
    fullname: "",
    numtel: "",
    password: "",
    cvlink: "",
    role: UserRole.MEMBER as UserRole,
    memberlevel: MemberLevel.JUNIOR as MemberLevel,
    companyId: "",
  });

  // Profil membre (optionnel, visible seulement si rôle = MEMBER)
  const [profileData, setProfileData] = useState({
    contractType: ContractType.CDI as ContractType,
    hireDate: new Date().toISOString().split("T")[0],
    employmentStatus: EmploymentStatus.ACTIVE as EmploymentStatus,
    position: "",
    baseSalary: "",
    bonuses: "0",
  });

  const [createProfile, setCreateProfile] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);

  const EVALUATED_ROLES = [
    UserRole.MEMBER,
    UserRole.PROJECT_MANAGER,
  ];

  const isMember = EVALUATED_ROLES.includes(formData.role);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
    const rolesCanCreate = ROLE_CREATION_RULES[user.role as UserRole] || [];
    setAvailableRoles(rolesCanCreate);
    if (user.role === "super_admin") {
      fetchCompanies();
    } else if (user.companyId) {
      setFormData((p) => ({ ...p, companyId: user.companyId }));
    }
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanies(await res.json());
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const companyId =
        currentUser?.role === "super_admin"
          ? formData.companyId ? Number(formData.companyId) : undefined
          : currentUser?.companyId;

      // 1. Créer l'utilisateur
      const payload: any = {
        email: formData.email,
        fullname: formData.fullname,
        numtel: formData.numtel,
        password: formData.password,
        cvlink: formData.cvlink,
        role: formData.role,
        companyId,
      };
      if (isMember) payload.memberlevel = formData.memberlevel;

      const userRes = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!userRes.ok) {
        const err = await userRes.json();
        throw new Error(err.message || "Erreur lors de la création de l'utilisateur");
      }

      const createdUser = await userRes.json();

      // 2. Si MEMBER + createProfile → créer le profil RH
      if (isMember && createProfile) {
        const profilePayload: any = {
          userId: createdUser.id,
          contractType: profileData.contractType,
          hireDate: profileData.hireDate,
          employmentStatus: profileData.employmentStatus,
          position: profileData.position || null,
          baseSalary: profileData.baseSalary ? parseFloat(profileData.baseSalary) : null,
          bonuses: parseFloat(profileData.bonuses) || 0,
        };

        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/member-profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(profilePayload),
        });

        if (!profileRes.ok) {
          // L'utilisateur est créé, mais le profil a échoué — on signale sans bloquer
          console.warn("Profil RH non créé :", await profileRes.json());
        }
      }

      setSuccess(true);
      setTimeout(() => router.push("/Dashboard/users"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center">
            <UserPlus size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nouvel utilisateur</h1>
            <p className="text-sm text-slate-500">Configurez le compte et le profil RH</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── Alerte erreur / succès ── */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} /> Utilisateur créé avec succès — redirection…
          </div>
        )}

        {/* ══ SECTION 1 : Identité ══════════════════════════════════════════ */}
        <Section
          icon={<User size={18} className="text-blue-600" />}
          title="Identité & accès"
          subtitle="Informations du compte utilisateur"
          color="bg-blue-50"
          defaultOpen
        >
          {/* Société */}
          {currentUser?.role === "super_admin" ? (
            <div className="mb-5">
              <label className={labelCls}>
                <Building2 size={13} /> Société
              </label>
              <select
                required
                className={`${inputCls} appearance-none`}
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              >
                <option value="">Sélectionner une entreprise</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          ) : currentUser?.companyName ? (
            <div className="mb-5">
              <label className={labelCls}>
                <Building2 size={13} /> Société
              </label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-sm font-medium">
                <Building2 size={14} className="text-blue-500" />
                {currentUser.companyName}
                <span className="ml-auto text-xs text-slate-400">Automatique</span>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nom */}
            <div>
              <label className={labelCls}><User size={13} /> Nom complet</label>
              <input
                required type="text" placeholder="Jean Dupont"
                className={inputCls} value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelCls}><Mail size={13} /> Email professionnel</label>
              <input
                required type="email" placeholder="jean@entreprise.com"
                className={inputCls} value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className={labelCls}><Phone size={13} /> Téléphone</label>
              <input
                required type="tel" placeholder="+216 -- --- ---"
                className={inputCls} value={formData.numtel}
                onChange={(e) => setFormData({ ...formData, numtel: e.target.value })}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className={labelCls}><Lock size={13} /> Mot de passe</label>
              <div className="relative">
                <input
                  required type={showPassword ? "text" : "password"} placeholder="••••••••"
                  className={`${inputCls} pr-11`} value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* CV */}
            <div className="sm:col-span-2">
              <label className={labelCls}><FileText size={13} /> Lien CV</label>
              <input
                required type="url" placeholder="https://drive.google.com/..."
                className={inputCls} value={formData.cvlink}
                onChange={(e) => setFormData({ ...formData, cvlink: e.target.value })}
              />
            </div>

            {/* Rôle */}
            <div>
              <label className={labelCls}><Shield size={13} /> Rôle</label>
              <select
                className={`${inputCls} appearance-none`} value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>

            {/* Niveau (si MEMBER) */}
            {isMember && (
              <div>
                <label className={labelCls}><Award size={13} /> Niveau</label>
                <select
                  className={`${inputCls} appearance-none`} value={formData.memberlevel}
                  onChange={(e) => setFormData({ ...formData, memberlevel: e.target.value as MemberLevel })}
                >
                  {Object.entries(MEMBER_LEVEL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Section>

        {/* ══ SECTION 2 : Profil RH (uniquement MEMBER) ════════════════════ */}
        {isMember && (
          <Section
            icon={<Briefcase size={18} className="text-violet-600" />}
            title="Profil RH"
            subtitle="Contrat, poste et rémunération"
            color="bg-violet-50"
            defaultOpen
          >
            {/* Toggle créer profil */}
            <label className="flex items-center gap-3 mb-5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox" checked={createProfile}
                onChange={(e) => setCreateProfile(e.target.checked)}
                className="w-4 h-4 rounded accent-violet-600"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">Créer le profil RH maintenant</p>
                <p className="text-xs text-slate-500">Vous pourrez le compléter plus tard depuis la fiche utilisateur</p>
              </div>
            </label>

            {createProfile && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contrat */}
                <div>
                  <label className={labelCls}><Calendar size={13} /> Type de contrat</label>
                  <select
                    className={`${inputCls} appearance-none`}
                    value={profileData.contractType}
                    onChange={(e) => setProfileData({ ...profileData, contractType: e.target.value as ContractType })}
                  >
                    {Object.entries(CONTRACT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Date d'embauche */}
                <div>
                  <label className={labelCls}><Calendar size={13} /> Date d'embauche</label>
                  <input
                    type="date" className={inputCls}
                    value={profileData.hireDate}
                    onChange={(e) => setProfileData({ ...profileData, hireDate: e.target.value })}
                  />
                </div>

                {/* Statut */}
                <div>
                  <label className={labelCls}><CheckCircle2 size={13} /> Statut d'emploi</label>
                  <select
                    className={`${inputCls} appearance-none`}
                    value={profileData.employmentStatus}
                    onChange={(e) => setProfileData({ ...profileData, employmentStatus: e.target.value as EmploymentStatus })}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Poste */}
                <div>
                  <label className={labelCls}><Briefcase size={13} /> Poste</label>
                  <input
                    type="text" placeholder="Ex : Développeur Senior"
                    className={inputCls} value={profileData.position}
                    onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                  />
                </div>

                {/* Salaire */}
                <div>
                  <label className={labelCls}><DollarSign size={13} /> Salaire de base (TND)</label>
                  <input
                    type="number" min="0" step="100" placeholder="0"
                    className={inputCls} value={profileData.baseSalary}
                    onChange={(e) => setProfileData({ ...profileData, baseSalary: e.target.value })}
                  />
                </div>

                {/* Bonus */}
                <div>
                  <label className={labelCls}><TrendingUp size={13} /> Bonus (TND)</label>
                  <input
                    type="number" min="0" step="100" placeholder="0"
                    className={inputCls} value={profileData.bonuses}
                    onChange={(e) => setProfileData({ ...profileData, bonuses: e.target.value })}
                  />
                </div>

                {/* Compensation calculée */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-violet-50 border border-violet-100">
                    <span className="text-sm text-violet-700 font-medium">Compensation totale estimée</span>
                    <span className="text-base font-bold text-violet-900">
                      {(
                        (parseFloat(profileData.baseSalary) || 0) +
                        (parseFloat(profileData.bonuses) || 0)
                      ).toLocaleString("fr-FR")}{" "}
                      TND
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">* Tous les champs du compte sont obligatoires</p>
          <div className="flex gap-3">
            <button
              type="button" onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Annuler
            </button>
            <button
              disabled={loading} type="submit"
              className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
              {loading ? "Création…" : "Créer l'utilisateur"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}