"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

/* ─── Role → first landing route ────────────────────────────────────────────
   Basé sur MENU_BY_ROLE du Sidebar :
   chaque rôle est redirigé vers son premier item de menu.
─────────────────────────────────────────────────────────────────────────── */
const ROLE_ROUTES: Record<string, string> = {
  super_admin:         "/Dashboard",
  admin_company:       "/Dashboard",
  manager:             "/Dashboard",
  project_manager:     "/Dashboard",
  call_center_manager: "/Dashboard",
  sales_manager:       "/Dashboard",
  marketing_manager:   "/Dashboard/marketing",
  quality_manager:     "/Dashboard",
  hr_manager:          "/Dashboard/RH/postslist",
  agent_telepro:       "/Dashboard",
  commercial:          "/Dashboard/commerciale",
  marketing_agent:     "/Dashboard/marketing",
  qualite_agent:       "/Dashboard",
  tech_support:        "/Dashboard",
  member:              "/Dashboard",
};

const getDashboardPath = (role: string) =>
  ROLE_ROUTES[role?.toLowerCase()] ?? "/Dashboard";

/* ─── Eye icons ─────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
       viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
       viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
             a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0
             1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ─── Reusable input wrapper ────────────────────────── */
function Field({
  id, label, type, value, onChange, placeholder, icon, rightSlot,
}: {
  id: string; label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ReactNode; rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id}
             className="text-xs font-semibold tracking-widest uppercase
                        text-teal-700">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2
                         text-teal-600 pointer-events-none">
          {icon}
        </span>
        <input
          id={id} type={type} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          required autoComplete={id}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm
                     bg-white border border-teal-300/70
                     text-slate-900 placeholder-slate-500
                     focus:outline-none focus:ring-2 focus:ring-teal-400/80
                     focus:border-teal-400
                     transition-all duration-200 shadow-sm"
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightSlot}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_NEST_API_URL}/auth/signin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      if (!res.ok) throw new Error("Identifiants invalides");
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      console.log(data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSuccess(true);
      setTimeout(() => router.push(getDashboardPath(data.user?.role ?? "")), 900);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ── Full-screen background ── */
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-white via-cyan-50 to-teal-50 relative overflow-hidden px-4">

      {/* Radial glow blobs - Light version */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2
                      w-[700px] h-[340px] rounded-full
                      bg-teal-200/25 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 right-0
                      w-[400px] h-[300px] rounded-full
                      bg-cyan-200/25 blur-[80px] pointer-events-none" />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(20,184,166,0.3) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-md
                      bg-white/95 backdrop-blur-xl
                      border border-teal-200/70
                      rounded-2xl shadow-xl shadow-teal-100/50
                      px-8 py-10
                      animate-[fadeUp_.55s_cubic-bezier(.22,.68,0,1.2)_both]">

        {/* Top accent bar */}
        <div className="absolute top-0 left-8 right-8 h-px
                        bg-gradient-to-r from-transparent via-teal-300/70
                        to-transparent rounded-full" />

        {/* ── Brand ── */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16">
            <Image
              src="/logo.png"
              alt="DataPilot Logo"
              width={64}
              height={64}
              className="object-contain w-full h-full relative z-10"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="font-extrabold text-3xl tracking-tight leading-none">
              <span className="text-slate-800">Data</span>
              <span className="bg-gradient-to-r from-teal-500 via-cyan-500
                               to-teal-600 bg-clip-text text-transparent">
                Pilot
              </span>
            </h1>
            <p className="mt-1 text-[11px] tracking-[0.2em] uppercase
                          text-teal-600 font-medium">
              Intelligence · Analytics · Insights
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent
                        via-teal-200/60 to-transparent mb-7" />

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-center gap-2.5
                          bg-red-100/80 border border-red-300/70
                          text-red-700 text-sm rounded-xl px-4 py-2.5 mb-5">
            <svg width="16" height="16" fill="none" stroke="currentColor"
                 strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field
            id="email" label="Adresse e-mail"
            type="email" value={email} onChange={setEmail}
            placeholder="nom@entreprise.com"
            icon={
              <svg width="15" height="15" fill="none" stroke="currentColor"
                   strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            }
          />

          <Field
            id="password" label="Mot de passe"
            type={showPwd ? "text" : "password"}
            value={password} onChange={setPassword}
            placeholder="••••••••"
            icon={
              <svg width="15" height="15" fill="none" stroke="currentColor"
                   strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            }
            rightSlot={
              <button
                type="button" onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Masquer" : "Afficher"}
                className="text-teal-600 hover:text-teal-700
                           transition-colors duration-150 cursor-pointer"
              >
                {showPwd ? <EyeOff /> : <EyeOpen />}
              </button>
            }
          />

          {/* Forgot password */}
          <div className="flex justify-end -mt-2">
            <a href="/forgot-password"
               className="text-xs text-teal-700 hover:text-teal-800
                          transition-colors duration-150">
              Mot de passe oublié ?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            className={`
              relative w-full py-3 rounded-xl text-sm font-bold
              tracking-wide overflow-hidden transition-all duration-200
              ${success
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white cursor-default"
                : "bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 text-white"
              }
              hover:brightness-105 hover:-translate-y-0.5
              active:translate-y-0 active:brightness-100
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-lg shadow-teal-300/30
            `}
          >
            {/* shimmer */}
            {!loading && !success && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent
                               via-white/25 to-transparent
                               -translate-x-full animate-[shimmer_2s_infinite]" />
            )}

            <span className="flex items-center justify-center gap-2">
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none"
                     viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              {loading
                ? "Connexion en cours…"
                : success
                  ? "✓ Connecté — redirection…"
                  : "Se connecter"}
            </span>
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Besoin d'aide ?{" "}
          <a href="/support"
             className="text-teal-700 hover:text-teal-800
                        transition-colors duration-150">
            Contacter le support
          </a>
        </p>
      </div>

      {/* Version watermark */}
      <span className="absolute bottom-4 right-5 text-[10px]
                       text-teal-600/60 tracking-widest select-none">
        DataPilot v2.0
      </span>
    </div>
  );
}