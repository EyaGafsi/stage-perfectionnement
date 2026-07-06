"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Lead {
  id: number;
  fullname: string;
  email?: string;
  phone?: string;
  leadSource?: string;
  leadOrigin?: string;
  country?: string;
  city?: string;
  assignedTo?: {
    id: number;
    email: string;
  };
  qualification?: {
    status: string;
    interestLevel: string;
  };
  createdAt: string;
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer le rôle de l'utilisateur depuis localStorage
    const user = localStorage.getItem("user");
    if (user) {
      setUserRole(JSON.parse(user).role);
    }

    const fetchLeads = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_NEST_API_URL}/leads`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        if (!res.ok) throw new Error("Impossible de charger les leads");

        const data = await res.json();
        setLeads(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Fonction pour vérifier si un bouton doit être affiché
  const canShowRemove = ["super_admin", "admin_company", "manager"].includes(userRole || "");
  const canShowDetail = ["super_admin", "admin_company", "manager", "sales_manager", "call_center_manager"].includes(userRole || "");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Tous les Leads
          </h1>

          <button
            onClick={() => router.push("/leads/create")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition"
          >
            + Nouveau Lead
          </button>
        </div>

        {/* STATES */}
        {loading && (
          <div className="text-gray-500">Chargement des leads...</div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Lead</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Qualification</th>
                  <th className="px-4 py-3 text-left">Assigné à</th>
                  <th className="px-4 py-3 text-left">Créé le</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {lead.fullname}
                      <div className="text-xs text-gray-500">
                        {lead.country} {lead.city && `• ${lead.city}`}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {lead.email && (
                        <div className="text-gray-700">
                          📧 {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="text-gray-700">
                          📞 {lead.phone}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      <div>{lead.leadSource || "-"}</div>
                      <div className="text-xs text-gray-500">
                        {lead.leadOrigin}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {lead.qualification ? (
                        <div className="space-y-1">
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {lead.qualification.status}
                          </span>
                          <div className="text-xs text-gray-500">
                            {lead.qualification.interestLevel}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Non qualifié
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {lead.assignedTo?.email || "-"}
                    </td>

                    <td className="px-4 py-3 text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      {canShowDetail && (
                        <button
                          onClick={() =>
                            router.push(`/leads/${lead.id}`)
                          }
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Voir
                        </button>
                      )}

                      {canShowRemove && (
                        <button
                          onClick={() => alert("Supprimer lead")} // à remplacer par la logique delete
                          className="text-red-600 hover:underline text-sm"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {leads.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Aucun lead trouvé
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
