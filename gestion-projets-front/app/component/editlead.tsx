"use client";

import { useEffect, useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/* ================= TYPES ================= */

interface Lead {
  id: number;
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  status: string;
  source: string;
  notes: string;
}

interface Props {
  leadId: string;
}

/* ================= ROLES ================= */

enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN_COMPANY = "admin_company",
  MANAGER = "manager",
  SALES_MANAGER = "sales_manager",
  CALL_CENTER_MANAGER = "call_center_manager",
  COMMERCIAL = "commercial",
  AGENT_TELEPRO = "agent_telepro",
  MARKETING_AGENT = "marketing_agent",
}

/* ================= COMPONENT ================= */

export default function EditLeadPage({ leadId }: Props) {
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          router.push("/login");
          return;
        }

        /* ===== FETCH USER ROLE ===== */
        const resMe = await fetch(
          `${process.env.NEXT_PUBLIC_NEST_API_URL}/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!resMe.ok) {
          router.push("/unauthorized");
          return;
        }

        const me = await resMe.json();
        setRole(me.role);

        /* ===== FETCH LEAD ===== */
        const resLead = await fetch(
          `${process.env.NEXT_PUBLIC_NEST_API_URL}leads/${leadId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!resLead.ok) {
          router.push("/unauthorized");
          return;
        }

        const leadData = await resLead.json();
        setLead(leadData);
      } catch (err) {
        router.push("/unauthorized");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leadId, router]);

  /* ================= PERMISSIONS ================= */

  const canEditInfo =
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.ADMIN_COMPANY ||
    role === UserRole.MANAGER ||
    role === UserRole.SALES_MANAGER ||
    role === UserRole.CALL_CENTER_MANAGER;

  const canEditQualification =
    canEditInfo ||
    role === UserRole.COMMERCIAL ||
    role === UserRole.AGENT_TELEPRO ||
    role === UserRole.MARKETING_AGENT;

  /* ================= SECURITY CHECK ================= */

  useEffect(() => {
    if (!loading && role) {
      const isAuthorized =
        canEditInfo || canEditQualification;

      if (!isAuthorized) {
        router.push("/unauthorized");
      }
    }
  }, [role, loading]);

  /* ================= UPDATE FUNCTIONS ================= */

  const updateInfo = async () => {
    const token = localStorage.getItem("access_token");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_NEST_API_URL}leads/${leadId}/info`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstname: lead?.firstname,
          lastname: lead?.lastname,
          phone: lead?.phone,
          email: lead?.email,
        }),
      }
    );

    if (!res.ok) throw new Error("Erreur update info");
  };

  const updateQualification = async () => {
    const token = localStorage.getItem("access_token");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_NEST_API_URL}leads/${leadId}/qualification`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: lead?.status,
          source: lead?.source,
          notes: lead?.notes,
        }),
      }
    );

    if (!res.ok) throw new Error("Erreur update qualification");
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    try {
      setSaving(true);

      if (!canEditInfo && !canEditQualification) {
        router.push("/unauthorized");
        return;
      }

      if (canEditInfo) await updateInfo();
      if (canEditQualification) await updateQualification();

      router.push("/dashboard/leads");
    } catch (err) {
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  /* ================= STATES ================= */

  if (loading) return <p className="text-center">Chargement...</p>;
  if (!lead) return <p className="text-center">Lead introuvable</p>;

  /* ================= UI ================= */

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Modifier le Lead</h1>
      </div>

      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-xl p-6 space-y-6"
      >
        {/* INFO */}
        {canEditInfo && (
          <>
            <h2 className="font-semibold text-lg">Informations</h2>

            <input
              type="text"
              placeholder="Prénom"
              value={lead.firstname}
              onChange={(e) =>
                setLead({ ...lead, firstname: e.target.value })
              }
              className="w-full border p-2 rounded"
            />

            <input
              type="text"
              placeholder="Nom"
              value={lead.lastname}
              onChange={(e) =>
                setLead({ ...lead, lastname: e.target.value })
              }
              className="w-full border p-2 rounded"
            />

            <input
              type="text"
              placeholder="Téléphone"
              value={lead.phone}
              onChange={(e) =>
                setLead({ ...lead, phone: e.target.value })
              }
              className="w-full border p-2 rounded"
            />

            <input
              type="email"
              placeholder="Email"
              value={lead.email}
              onChange={(e) =>
                setLead({ ...lead, email: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
          </>
        )}

        {/* QUALIFICATION */}
        {canEditQualification && (
          <>
            <h2 className="font-semibold text-lg">Qualification</h2>

            <select
              value={lead.status}
              onChange={(e) =>
                setLead({ ...lead, status: e.target.value })
              }
              className="w-full border p-2 rounded"
            >
              <option value="new">Nouveau</option>
              <option value="contacted">Contacté</option>
              <option value="qualified">Qualifié</option>
              <option value="lost">Perdu</option>
            </select>

            <input
              type="text"
              placeholder="Source"
              value={lead.source}
              onChange={(e) =>
                setLead({ ...lead, source: e.target.value })
              }
              className="w-full border p-2 rounded"
            />

            <textarea
              placeholder="Notes"
              value={lead.notes}
              onChange={(e) =>
                setLead({ ...lead, notes: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
          </>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Save size={16} />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
