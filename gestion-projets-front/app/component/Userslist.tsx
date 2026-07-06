"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Shield,
  Eye,
  Pencil,
  Users,
  Filter,
  Search,
  Trash2,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN_COMPANY = 'admin_company',
  MANAGER = 'manager',
  PROJECT_MANAGER = 'project_manager',
  CALL_CENTER_MANAGER = 'call_center_manager',
  SALES_MANAGER = 'sales_manager',
  MARKETING_MANAGER = 'marketing_manager',
  QUALITY_MANAGER = 'quality_manager',
  HR_MANAGER='hr_manager',
  AGENT_TELEPRO = 'agent_telepro',
  COMMERCIAL = 'commercial',
  MARKETING_AGENT = 'marketing_agent',
  QUALITE_AGENT = 'qualite_agent',
  TECH_SUPPORT = 'tech_support',
  MEMBER = 'member',
}

const ROLE_CREATION_RULES: Partial<Record<UserRole, UserRole[]>> = {
  [UserRole.SUPER_ADMIN]: Object.values(UserRole),

  [UserRole.ADMIN_COMPANY]: [
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,

    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT,
    UserRole.MEMBER,
  ],

  [UserRole.MANAGER]: [
    UserRole.MEMBER,
    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT,
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
  [UserRole.SUPER_ADMIN]: ' Super Administrateur',
  [UserRole.ADMIN_COMPANY]: ' Admin Société',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.PROJECT_MANAGER]: ' Chef de projet',
  [UserRole.CALL_CENTER_MANAGER]: ' Manager Call Center',
  [UserRole.SALES_MANAGER]: 'Manager Ventes',
  [UserRole.MARKETING_MANAGER]: ' Manager Marketing',
  [UserRole.QUALITY_MANAGER]: ' Manager Qualité',
  [UserRole.HR_MANAGER]: ' Manager RH',
  [UserRole.AGENT_TELEPRO]: ' Agent Telepro',
  [UserRole.COMMERCIAL]: ' Commercial',
  [UserRole.MARKETING_AGENT]: 'Agent Marketing',
  [UserRole.QUALITE_AGENT]: ' Agent Qualité',
  [UserRole.TECH_SUPPORT]: ' Support Technique',
  [UserRole.MEMBER]: ' Membre standard',
};

/* ================= TYPES ================= */
interface Company {
  id: number;
  name: string;
}

interface User {
  id: number;
  fullname: string;
  email: string;
  role: UserRole;
  company?: Company | null;
  isActive: boolean;
}

interface CurrentUser {
  id: number;
  role: UserRole;
  companyId?: number | null;
  company?: Company | null;
}

/* ================= PAGE ================= */
export default function UsersListPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedCompany, setSelectedCompany] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  /* ================= FETCH USERS ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("Token manquant");

        // Fetch current user
const currentUserStr = localStorage.getItem("user");
if (!currentUserStr) {
  throw new Error("Utilisateur connecté introuvable");
}
const meData: CurrentUser = JSON.parse(currentUserStr);
setCurrentUser(meData);

        // Fetch all users
        const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Accès refusé ou erreur serveur");
        const data: User[] = await res.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ================= PERMISSIONS - LOGIQUE UNIFIÉE ================= */
  const canManageUser = (user: User): boolean => {
    if (!currentUser) return false;

    // Super admin peut tout faire
    if (currentUser.role === UserRole.SUPER_ADMIN) return true;

    // L'utilisateur peut se gérer lui-même
    if (user.id === currentUser.id) return true;

    // Vérifier que la cible est dans la même company
    if (user.company?.id !== currentUser.companyId) return false;

    // Vérifier si le rôle de la cible est dans les rôles gérables
    const manageableRoles = ROLE_CREATION_RULES[currentUser.role] || [];
    return manageableRoles.includes(user.role);
  };

  const canDelete = (user: User): boolean => {
    if (!canManageUser(user)) return false;
    // Ne pas se supprimer soi-même
    return user.id !== currentUser?.id;
  };

  /* ================= DELETE ================= */
  const handleDelete = async (userId: number, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${userName} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      setDeleteLoading(userId);
      setDeleteError("");
      const token = localStorage.getItem("access_token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Échec de la suppression");
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      setDeleteError(err.message || "Erreur lors de la suppression");
    } finally {
      setDeleteLoading(null);
    }
  };

  /* ================= FILTER LOGIC ================= */
  const roles = useMemo(
    () => ["ALL", ...new Set(users.map((u) => u.role))],
    [users]
  );

  const companies = useMemo(
    () => [
      "ALL",
      ...new Set(
        users.map((u) => u.company?.name).filter(Boolean) as string[]
      ),
    ],
    [users]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const roleMatch = selectedRole === "ALL" || user.role === selectedRole;
      const companyMatch =
        selectedCompany === "ALL" || user.company?.name === selectedCompany;
      const searchMatch =
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      return roleMatch && companyMatch && searchMatch;
    });
  }, [users, selectedRole, selectedCompany, searchTerm]);

  /* ================= UI ================= */
  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
        <div className="relative flex h-10 w-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-10 w-10 bg-indigo-500 items-center justify-center text-white">
            <Users size={20} />
          </span>
        </div>
        <p className="text-sm font-medium animate-pulse">
          Chargement des données...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl mt-10 rounded-xl border border-red-100 bg-red-50 p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <XCircle size={24} />
        </div>
        <h3 className="text-lg font-semibold text-red-800">
          Une erreur est survenue
        </h3>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Utilisateurs
          </h1>
          <p className="mt-1 text-slate-500">
            Gérez les accès, les rôles et les profils de votre organisation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
            {users.length} Total
          </span>
          <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            {users.filter((u) => u.isActive).length} Actifs
          </span>
        </div>
      </div>

      {/* Delete Error Alert */}
      {deleteError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Erreur de suppression</p>
            <p className="text-sm text-red-600 mt-1">{deleteError}</p>
          </div>
          <button
            onClick={() => setDeleteError("")}
            className="text-red-600 hover:text-red-700 flex-shrink-0"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="md:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div className="md:col-span-7 flex flex-wrap md:justify-end gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white">
            <Shield size={16} className="text-slate-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent text-sm text-slate-700 outline-none cursor-pointer min-w-[120px]"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === "ALL" ? "Tous les rôles" : ROLE_LABELS[role as UserRole] || role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white">
            <Building2 size={16} className="text-slate-400" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-transparent text-sm text-slate-700 outline-none cursor-pointer min-w-[140px]"
            >
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company === "ALL" ? "Toutes les sociétés" : company}
                </option>
              ))}
            </select>
          </div>

          {(selectedRole !== "ALL" ||
            selectedCompany !== "ALL" ||
            searchTerm !== "") && (
            <button
              onClick={() => {
                setSelectedRole("ALL");
                setSelectedCompany("ALL");
                setSearchTerm("");
              }}
              className="text-xs font-medium text-slate-500 hover:text-red-600 transition underline underline-offset-2"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">
                  Utilisateur
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600">Rôle</th>
                <th className="px-6 py-4 font-semibold text-slate-600">
                  Société
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600">Statut</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="group hover:bg-slate-50/80 transition-colors duration-200"
                >
                  <td className="px-6 py-4 flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                      {user.fullname.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {user.fullname}
                      </span>
                      <span className="text-xs text-slate-500">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                      <Shield size={12} className="fill-blue-300" />
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.company ? (
                      <div className="flex items-center gap-2 text-slate-700">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                          <Building2 size={14} />
                        </div>
                        <span className="font-medium">{user.company.name}</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 text-xs italic">
                        <Briefcase size={12} />
                        Indépendant
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        user.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}
                    >
                      {user.isActive ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <XCircle size={12} />
                      )}
                      {user.isActive ? "Actif" : "Inactif"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* VIEW DETAILS */}
                      {canManageUser(user) && (
                        <button
                          onClick={() =>
                            router.push(`/Dashboard/users/${user.id}/details`)
                          }
                          title="Voir les détails"
                          className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                          <Eye size={16} />
                        </button>
                      )}

                      {/* EDIT */}
                      {canManageUser(user) && (
                        <button
                          onClick={() =>
                            router.push(`/Dashboard/users/${user.id}/edit`)
                          }
                          title="Modifier"
                          className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300 hover:shadow-sm transition-all"
                        >
                          <Pencil size={16} />
                        </button>
                      )}

                      {/* DELETE */}
                      {canDelete(user) && (
                        <button
                          onClick={() => handleDelete(user.id, user.fullname)}
                          disabled={deleteLoading === user.id}
                          title="Supprimer"
                          className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteLoading === user.id ? (
                            <div className="animate-spin">
                              <Trash2 size={16} />
                            </div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">
            Aucun utilisateur trouvé
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Ajustez vos filtres ou votre recherche
          </p>
        </div>
      )}
    </div>
  );
}