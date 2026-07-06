"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FolderPlus, 
  AlignLeft, 
  CalendarDays, 
  Briefcase, 
  UserCircle, 
  Save, 
  ArrowLeft,
  AlertCircle
} from "lucide-react";

// Types
type ProjectDomain = "IT" | "Marketing" | "CallCenter";
type ProjectStatus = "planned" | "in_progress" | "on_hold" | "cancelled" | "completed";

interface User {
  id: number;
  fullname: string;
  role: string;
}

export default function CreateBaseProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectManagers, setProjectManagers] = useState<User[]>([]);

  // État du formulaire
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    domain: "IT" as ProjectDomain,
    status: "planned" as ProjectStatus,
    startDate: "",
    endDate: "",
    pmId: "", 
  });

  // 1. Récupérer la liste des Project Managers
  useEffect(() => {
    const fetchPMs = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const users: User[] = await res.json();
          // Filtrer selon la valeur exacte de l'enum backend
          const pms = users.filter((u) => u.role === "project_manager");
          setProjectManagers(pms);
        }
      } catch (err) {
        console.error("Erreur PMs:", err);
      }
    };
    fetchPMs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Soumission optimisée
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Session expirée.");

      // On prépare un payload unique correspondant à ton CreateProjectDto
      const projectPayload = {
        name: formData.name,
        description: formData.description,
        domain: formData.domain,
        status: formData.status,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        // 🔹 On envoie l'ID au backend qui fera l'affectation direct
        projectManagerId: formData.pmId ? Number(formData.pmId) : null, 
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectPayload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Erreur lors de la création.");
      }

      // Succès : Redirection immédiate
      router.push("/Dashboard/project");
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nouveau Projet</h1>
            <p className="text-sm text-slate-500">Désignez un responsable dès la création.</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FolderPlus className="text-indigo-500" size={20} />
              <h2 className="text-lg font-semibold text-slate-800">Détails</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du projet *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Classification */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
               <h2 className="text-md font-semibold text-slate-800 flex items-center gap-2">
                 <Briefcase size={18} className="text-blue-500"/> Classification
               </h2>
               <select name="domain" value={formData.domain} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2 bg-white">
                 <option value="IT">IT</option>
                 <option value="Marketing">Marketing</option>
                 <option value="CallCenter">Call Center</option>
               </select>
               <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2 bg-white">
                 <option value="planned">Planifié</option>
                 <option value="in_progress">En cours</option>
               </select>
            </div>

            {/* Dates */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
               <h2 className="text-md font-semibold text-slate-800 flex items-center gap-2">
                 <CalendarDays size={18} className="text-emerald-500"/> Dates
               </h2>
               <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2" />
               <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2" />
            </div>
          </div>

          {/* Responsable */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <UserCircle className="text-amber-500" size={20} /> Responsabilité
            </h2>
            <select name="pmId" value={formData.pmId} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-amber-500/20">
              <option value="">-- Aucun responsable assigné --</option>
              {projectManagers.map((pm) => (
                <option key={pm.id} value={pm.id}>{pm.fullname}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-xl border text-slate-600 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Création..." : <><Save size={18} /> Créer le Projet</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}