"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  ArrowLeft, 
  Mail, 
  MapPin, 
  Phone, 
  Loader2, 
  CheckCircle2, 
  PlusCircle,
  Globe
} from "lucide-react";

export default function CreateCompanyPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur lors de la création de la société");
      }

      setSuccess(true);
      // Redirection vers la liste des sociétés après 2 secondes
      setTimeout(() => router.push("/super-admin/companies"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Styles réutilisables pour la cohérence
  const inputStyle = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all duration-200";
  const labelStyle = "text-sm font-bold text-slate-600 flex items-center gap-2 mb-1";

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Bouton Retour */}
      <button 
        onClick={() => router.back()}
        className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium"
      >
        <div className="p-2 rounded-full group-hover:bg-indigo-50 transition-colors">
          <ArrowLeft size={18} />
        </div>
        Retour à la gestion des sociétés
      </button>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* Header avec dégradé Indigo (différenciation visuelle de la page utilisateur) */}
        <div className="bg-gradient-to-r from-indigo-950 to-slate-900 p-8 md:p-10 text-white">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40 backdrop-blur-sm">
              <PlusCircle className="text-indigo-400" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Enregistrer une Société</h1>
              <p className="text-slate-400 mt-1 font-medium">Ajoutez une nouvelle entité juridique à la plateforme</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-xl text-sm flex items-center gap-3 font-medium animate-bounce">
              <CheckCircle2 size={20} />
              Société créée avec succès ! Préparation de la redirection...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Nom de la Société */}
            <div className="md:col-span-2 space-y-1">
              <label className={labelStyle}>
                <Building2 size={15} className="text-indigo-500" /> Nom de l'entreprise
              </label>
              <input
                required
                type="text"
                placeholder="Ex: Tech Solutions SARL"
                className={inputStyle}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Email de contact */}
            <div className="space-y-1">
              <label className={labelStyle}>
                <Mail size={15} className="text-indigo-500" /> Email de contact
              </label>
              <input
                type="email"
                placeholder="contact@entreprise.com"
                className={inputStyle}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-1">
              <label className={labelStyle}>
                <Phone size={15} className="text-indigo-500" /> Téléphone professionnel
              </label>
              <input
                type="tel"
                placeholder="+216 -- --- ---"
                className={inputStyle}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Adresse */}
            <div className="md:col-span-2 space-y-1">
              <label className={labelStyle}>
                <MapPin size={15} className="text-indigo-500" /> Adresse du siège social
              </label>
              <textarea
                rows={3}
                placeholder="Rue de l'Innovation, Zone Industrielle..."
                className={`${inputStyle} resize-none`}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Footer / Actions */}
          <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-50 px-3 py-2 rounded-lg">
              <Globe size={14} />
              <span>Cette société sera immédiatement disponible pour l'affectation d'utilisateurs.</span>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all font-sans"
              >
                Annuler
              </button>
              <button
                disabled={loading}
                type="submit"
                className="flex-1 sm:flex-none px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200 focus:ring-4 focus:ring-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Building2 size={20} />}
                {loading ? "Création..." : "Enregistrer la société"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}