"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Plus, 
  Search, 
  MoreVertical, 
  MapPin, 
  Mail, 
  Phone,
  ArrowUpRight,
  Loader2,
  ExternalLink,
  Users
} from "lucide-react";

export default function CompaniesListPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Le backend renvoie soit un tableau complet, soit [maSociete]
      setCompanies(Array.isArray(data) ? data : [data]);
    } catch (err) {
      console.error("Erreur chargement sociétés", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-500 font-medium">Chargement des entreprises...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sociétés</h1>
          <p className="text-slate-500 mt-1">Gérez les entités et leurs configurations</p>
        </div>
        
        <Link 
          href="/Dashboard/companies/create"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <Plus size={20} />
          Nouvelle Société
        </Link>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Sociétés" value={companies.length} icon={<Building2 className="text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Utilisateurs Actifs" value="--" icon={<Users className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard title="Taux de croissance" value="+12%" icon={<ArrowUpRight className="text-indigo-600" />} color="bg-indigo-50" />
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher une société par nom..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-transparent bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tableau des Sociétés */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-sm font-bold text-slate-600">SOCIÉTÉ</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-600">CONTACT</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-600">ADRESSE</th>
                <th className="px-8 py-5 text-sm font-bold text-slate-600 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        {company.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold">{company.name}</p>
                        <p className="text-xs text-slate-400 font-medium">ID: #{company.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <Mail size={14} className="text-slate-300" /> {company.email || '—'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <Phone size={14} className="text-slate-300" /> {company.phone || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-start gap-2 max-w-[200px]">
                      <MapPin size={14} className="text-slate-300 mt-1 shrink-0" />
                      <p className="text-sm text-slate-500 font-medium line-clamp-2 italic">
                        {company.address || 'Pas d\'adresse enregistrée'}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <ExternalLink size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCompanies.length === 0 && (
          <div className="p-20 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-4">
              <Building2 size={40} />
            </div>
            <p className="text-slate-500 font-medium">Aucune société trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant Statistique local
function StatCard({ title, value, icon, color }: { title: string, value: any, icon: any, color: string }) {
  return (
    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`h-14 w-14 ${color} rounded-2xl flex items-center justify-center shadow-inner`}>
        {icon}
      </div>
    </div>
  );
}