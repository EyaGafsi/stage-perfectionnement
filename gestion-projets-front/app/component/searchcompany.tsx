"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ================= ROLES ================= */
enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN_COMPANY = "admin_company",
  COMMERCIAL = "commercial",
}

/* ================= COMPONENT ================= */
export default function OsintPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

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
      UserRole.COMMERCIAL,
    ];

    if (!allowedRoles.includes(role)) {
      router.replace("/unauthorized");
      return;
    }

    setCheckingAuth(false);
  }, [router]);

  /* ================= FETCH OSINT ================= */
  const runOsint = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("https://traii-socitysearch.hf.space/api/predict_full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          "3LM Solutions", // entreprise
          "Manager,CEO",   // roles
          "Tunisia",       // pays_nom
          "TN",            // pays_iso
          "",              // google_key
          false            // save_json
        ]),
      });

      if (!res.ok) throw new Error("Erreur lors de l'appel OSINT");

      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOADING ================= */
  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center">Vérification des permissions...</div>;
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto bg-white shadow rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-6">OSINT - Recherche Société</h1>

        <button
          onClick={runOsint}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg mb-6"
        >
          {loading ? "Recherche en cours..." : "Lancer l'enquête"}
        </button>

        {error && <div className="text-red-600">{error}</div>}

        {results && (
          <div className="space-y-6">
            {/* -------- COMPANY DATA -------- */}
            <div>
              <h2 className="text-xl font-semibold mb-2">🏢 Société</h2>
              <table className="table-auto w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2">Emails</th>
                    <th className="px-4 py-2">Téléphones</th>
                    <th className="px-4 py-2">Liens</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-4 py-2">
                      {results[1]?.company_data?.emails?.join(", ") || "—"}
                    </td>
                    <td className="border px-4 py-2">
                      {results[1]?.company_data?.phones?.join(", ") || "—"}
                    </td>
                    <td className="border px-4 py-2">
                      {results[1]?.company_data?.links?.join(", ") || "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* -------- EMPLOYEES -------- */}
            <div>
              <h2 className="text-xl font-semibold mb-2">👥 Employés</h2>
              <table className="table-auto w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2">Rôle</th>
                    <th className="px-4 py-2">Score</th>
                    <th className="px-4 py-2">Emails</th>
                    <th className="px-4 py-2">Téléphones</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .filter((r: any) => r.status === "employee_done")
                    .map((r: any, idx: number) => (
                      <tr key={idx}>
                        <td className="border px-4 py-2">{r.employee.name}</td>
                        <td className="border px-4 py-2">{r.employee.role}</td>
                        <td className="border px-4 py-2">{r.employee.score}</td>
                        <td className="border px-4 py-2">{r.employee.emails.join(", ")}</td>
                        <td className="border px-4 py-2">{Object.keys(r.employee.phones).join(", ")}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
