"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ================= ROLES ================= */

enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN_COMPANY = "admin_company",
  MANAGER = "manager",
  SALES_MANAGER = "sales_manager",
  CALL_CENTER_MANAGER = "call_center_manager",
  MARKETING_MANAGER = "marketing_manager",
  MARKETING_AGENT = "marketing_agent",
  COMMERCIAL = "commercial",
}

/* ================= COMPONENT ================= */

export default function CreateLeadPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    // Lead Info
    fullname: "",
    email: "",
    phone: "",
    leadOrigin: "",
    leadSource: "",
    country: "",
    city: "",
    specialization: "",
    currentOccupation: "",
    search: "",
    lastActivity: "",
    totalVisits: "",
    totalTimeOnWebsite: "",
    pageViewsPerVisit: "",
    doNotEmail: false,
    doNotCall: false,

    // Qualification
    status: "new",
    interestLevel: "cold",
    budget: "",
    need: "",
    decisionMaker: false,
  });

  /* ================= AUTH CHECK ================= */

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.replace("/login");
      return;
    }

    const parsedUser = JSON.parse(user);
    const role = parsedUser.role;

    const allowedRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN_COMPANY,
      UserRole.MANAGER,
      UserRole.SALES_MANAGER,
      UserRole.CALL_CENTER_MANAGER,
      UserRole.MARKETING_MANAGER,
      UserRole.MARKETING_AGENT,
      UserRole.COMMERCIAL,
    ];

    if (!allowedRoles.includes(role)) {
      router.replace("/unauthorized");
      return;
    }

    setCheckingAuth(false);
  }, [router]);

  /* ================= HANDLE CHANGE ================= */

const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const target = e.currentTarget;

  const name = target.name;

  const value =
    target instanceof HTMLInputElement && target.type === "checkbox"
      ? target.checked
      : target.value;

  setForm({
    ...form,
    [name]: value,
  });
};


  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      leadInfo: {
        fullname: form.fullname,
        email: form.email || null,
        phone: form.phone || null,
        leadOrigin: form.leadOrigin || null,
        leadSource: form.leadSource || null,
        country: form.country || null,
        city: form.city || null,
        specialization: form.specialization || null,
        currentOccupation: form.currentOccupation || null,
        search: form.search || null,
        lastActivity: form.lastActivity || null,
        totalVisits: form.totalVisits || null,
        totalTimeOnWebsite: form.totalTimeOnWebsite || null,
        pageViewsPerVisit: form.pageViewsPerVisit || null,
        doNotEmail: form.doNotEmail,
        doNotCall: form.doNotCall,
      },
      leadQualification: {
        status: form.status,
        interestLevel: form.interestLevel,
        budget: form.budget || null,
        need: form.need || null,
        decisionMaker: form.decisionMaker,
      },
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_NEST_API_URL}/leads`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (res.status === 403) {
        router.replace("/unauthorized");
        return;
      }

      if (!res.ok) {
        throw new Error("Erreur lors de la création du lead");
      }

      router.push("/dashboard/leads");
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOADING ================= */

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Vérification des permissions...
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-6">Créer un Lead</h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* -------- LEAD INFO -------- */}

          <input name="fullname" required placeholder="Nom complet"
            value={form.fullname} onChange={handleChange} className="input" />

          <input name="email" placeholder="Email"
            value={form.email} onChange={handleChange} className="input" />

          <input name="phone" placeholder="Téléphone"
            value={form.phone} onChange={handleChange} className="input" />

          <input name="leadOrigin" placeholder="Origine"
            value={form.leadOrigin} onChange={handleChange} className="input" />

          <input name="leadSource" placeholder="Source"
            value={form.leadSource} onChange={handleChange} className="input" />

          <input name="country" placeholder="Pays"
            value={form.country} onChange={handleChange} className="input" />

          <input name="city" placeholder="Ville"
            value={form.city} onChange={handleChange} className="input" />

          <input name="specialization" placeholder="Spécialisation"
            value={form.specialization} onChange={handleChange} className="input" />

          <input name="currentOccupation" placeholder="Profession"
            value={form.currentOccupation} onChange={handleChange} className="input" />

          <input name="search" placeholder="Recherche"
            value={form.search} onChange={handleChange} className="input" />

          <input name="lastActivity" placeholder="Dernière activité"
            value={form.lastActivity} onChange={handleChange} className="input" />

          <input type="number" name="totalVisits" placeholder="Total visites"
            value={form.totalVisits} onChange={handleChange} className="input" />

          <input type="number" name="totalTimeOnWebsite" placeholder="Temps total"
            value={form.totalTimeOnWebsite} onChange={handleChange} className="input" />

          <input type="number" name="pageViewsPerVisit" placeholder="Pages / visite"
            value={form.pageViewsPerVisit} onChange={handleChange} className="input" />

          <label>
            <input type="checkbox" name="doNotEmail"
              checked={form.doNotEmail} onChange={handleChange} />
            Do Not Email
          </label>

          <label>
            <input type="checkbox" name="doNotCall"
              checked={form.doNotCall} onChange={handleChange} />
            Do Not Call
          </label>

          {/* -------- QUALIFICATION -------- */}

          <select name="status" value={form.status}
            onChange={handleChange} className="input">
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="lost">Lost</option>
          </select>

          <select name="interestLevel" value={form.interestLevel}
            onChange={handleChange} className="input">
            <option value="cold">Cold</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
          </select>

          <input name="budget" placeholder="Budget"
            value={form.budget} onChange={handleChange} className="input" />

          <input name="need" placeholder="Besoin"
            value={form.need} onChange={handleChange} className="input" />

          <label>
            <input type="checkbox" name="decisionMaker"
              checked={form.decisionMaker} onChange={handleChange} />
            Décideur
          </label>

          {error && (
            <div className="text-red-600">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg">
            {loading ? "Création..." : "Créer le Lead"}
          </button>

        </form>
      </div>
    </div>
  );
}
