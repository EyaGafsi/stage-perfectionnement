"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const T = {
  teal:       "#0d9488",
  tealLight:  "#ccfbf1",
  tealMid:    "#14b8a6",
  tealDark:   "#0f766e",
  tealBg:     "#f0fdfa",
  blue:       "#2563eb",
  blueBg:     "#eff6ff",
  orange:     "#ea580c",
  orangeBg:   "#fff7ed",
  red:        "#dc2626",
  redBg:      "#fef2f2",
  green:      "#16a34a",
  greenBg:    "#f0fdf4",
  amber:      "#ca8a04",
  amberBg:    "#fefce8",
  gray:       "#6b7280",
  grayLight:  "#f3f4f6",
};

const Icon = ({ d, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color || "currentColor"} strokeWidth={1.8} strokeLinecap="round"
    strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
    <path d={d} />
  </svg>
);

const ICONS = {
  shield:      "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  play:        "M5 3l14 9-14 9V3z",
  stop:        "M3 3h18v18H3z",
  check:       "M20 6 9 17l-5-5",
  x:           "M18 6 6 18M6 6l12 12",
  refresh:     "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  building:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  globe:       "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  users:       "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  mail:        "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  copy:        "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  externalLink:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",
  chevDown:    "M6 9l6 6 6-6",
  chevUp:      "M18 15l-6-6-6 6",
  activity:    "M22 12h-4l-3 9L9 3l-3 9H2",
  hash:        "M4 9h16M4 15h16M10 3 8 21M16 3l-2 18",
  phone:       "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z",
  target:      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  alertCircle: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01",
  zap:         "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  checkCircle: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  menu:        "M3 12h18M3 6h18M3 18h18",
};

const LinkedInSVG = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.12 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
  </svg>
);

function getInitials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatProgressLabel(p) {
  if (p < 5)   return "Initialisation";
  if (p < 15)  return "Domaine";
  if (p < 25)  return "Réseaux sociaux";
  if (p < 40)  return "Scraping site";
  if (p < 60)  return "Employés";
  if (p < 100) return "Emails";
  return "Complété";
}

function Spinner({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round"
      style={{ animation: "spin .8s linear infinite", transformOrigin: "center", flexShrink: 0 }}>
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </svg>
  );
}

function ScoreBar({ value }) {
  const pct = Math.round(value <= 1 ? value * 100 : value);
  const color = pct >= 80 ? T.teal : pct >= 60 ? T.amber : T.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .5s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", minWidth: 30, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      title="Copier"
      style={{
        padding: "5px 10px",
        border: `1px solid ${copied ? T.teal : "#d1d5db"}`,
        borderRadius: 6,
        background: copied ? T.tealBg : "#fff",
        cursor: "pointer",
        color: copied ? T.teal : "#6b7280",
        fontSize: 11,
        display: "flex",
        alignItems: "center",
        gap: 4,
        transition: "all .2s",
        fontWeight: 500,
      }}>
      <Icon d={copied ? ICONS.check : ICONS.copy} size={12} />
      {copied && "Copié"}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    idle:      { label: "Inactif",  bg: "#f3f4f6",  color: "#6b7280", dot: "#d1d5db" },
    running:   { label: "En cours", bg: T.tealBg,   color: T.tealDark, dot: T.teal },
    stopping:  { label: "Arrêt",    bg: T.orangeBg, color: T.orange,   dot: T.orange },
    completed: { label: "Terminé",  bg: T.greenBg,  color: T.green,    dot: T.green },
    stopped:   { label: "Arrêté",   bg: T.orangeBg, color: T.orange,   dot: T.orange },
    error:     { label: "Erreur",   bg: T.redBg,    color: T.red,      dot: T.red },
  };
  const s = map[status] || map.idle;
  const pulse = ["running", "stopping"].includes(status);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8, background: s.bg, color: s.color }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, ...(pulse ? { animation: "pulse 1.5s infinite" } : {}) }} />
      {s.label}
    </span>
  );
}

function EmailRow({ e }) {
  const pct = e.score;
  const scoreColor = pct >= 80 ? T.green  : pct >= 60 ? T.amber  : T.red;
  const scoreBg    = pct >= 80 ? T.greenBg: pct >= 60 ? T.amberBg: T.redBg;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "#fff", border: "1px solid #e5e7eb" }}>
      <Icon d={ICONS.mail} size={12} color="#9ca3af" />
      <span style={{ fontSize: 12, fontFamily: "monospace", color: "#1f2937", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.email}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {(e.mx_valid || e.mx_ok) && (
          <span style={{ fontSize: 10, fontWeight: 600, color: T.tealDark, background: T.tealBg, padding: "3px 8px", borderRadius: 4 }}>MX</span>
        )}
        <span style={{ fontSize: 10, fontWeight: 600, color: scoreColor, background: scoreBg, padding: "3px 8px", borderRadius: 4 }}>{pct}</span>
        <CopyBtn text={e.email} />
      </div>
    </div>
  );
}

function EmailList({ emails }) {
  const [all, setAll] = useState(false);
  const shown = all ? emails : emails.slice(0, 3);
  const hidden = emails.length - 3;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {shown.map((e, i) => <EmailRow key={i} e={e} />)}
      {emails.length > 3 && (
        <button onClick={() => setAll(v => !v)}
          style={{ marginTop: 4, fontSize: 12, color: T.teal, background: T.tealBg, border: `1px solid ${T.tealLight}`, borderRadius: 8, padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontWeight: 500 }}>
          <Icon d={all ? ICONS.chevUp : ICONS.chevDown} size={12} color={T.teal} />
          {all ? "Réduire" : `Voir ${hidden} email${hidden > 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}

function EmployeeCard({ emp }) {
  const [open, setOpen] = useState(false);
  const url = emp.linkedin_url || emp.profile_url;
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.tealBg, color: T.tealDark, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
          {getInitials(emp.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1f2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{emp.role || "—"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ minWidth: 100 }}><ScoreBar value={emp.score} /></div>
          {url
            ? <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: T.blue, display: "flex" }}><LinkedInSVG size={14} /></a>
            : <span style={{ color: "#d1d5db" }}><LinkedInSVG size={14} /></span>
          }
          <Icon d={open ? ICONS.chevUp : ICONS.chevDown} size={14} color="#9ca3af" />
        </div>
      </button>
      {open && (
        <div style={{ padding: "12px 14px", borderTop: "1px solid #e5e7eb", background: "#fafafa" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Emails</span>
            <span style={{ fontSize: 11, color: "#6b7280" }}>{emp.emails.length}</span>
          </div>
          {emp.emails.length > 0
            ? <EmailList emails={emp.emails} />
            : <p style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", margin: 0 }}>Aucun email</p>
          }
        </div>
      )}
    </div>
  );
}

const STEPS = [
  { label: "Init",     pct: 5 },
  { label: "Domaine",  pct: 15 },
  { label: "Réseaux",  pct: 25 },
  { label: "Scraping", pct: 40 },
  { label: "Employés", pct: 60 },
  { label: "Emails",   pct: 95 },
  { label: "Fin",      pct: 100 },
];

function ProgressSteps({ progress }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 12 }}>
      {STEPS.map((s, i) => {
        const done   = progress >= s.pct;
        const active = progress >= (STEPS[i - 1]?.pct ?? 0) && !done;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", height: 4, borderRadius: 99, background: done ? T.teal : active ? T.tealLight : "#e5e7eb" }} />
            <span style={{ fontSize: 10, color: done ? T.teal : active ? T.teal : "#9ca3af", textAlign: "center", lineHeight: 1.2, fontWeight: done || active ? 500 : 400 }}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function LogsPanel({ logs }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  if (!logs?.length) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 20px", textAlign: "center" }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: T.tealBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Icon d={ICONS.activity} size={20} color={T.teal} />
      </div>
      <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Logs apparaîtront ici</p>
    </div>
  );

  return (
    <div style={{ background: "#1f2937", borderRadius: 10, padding: "12px 14px", maxHeight: 420, overflowY: "auto", border: "1px solid #374151" }}>
      {logs.map((log, i) => {
        const col = log.includes("✓") || log.includes("OK") ? "#10b981"
          : log.includes("✕") || log.includes("ERR") ? "#ef4444"
          : log.includes("⚠") ? "#f59e0b"
          : "#94a3b8";
        return (
          <div key={i} style={{ display: "flex", gap: 10, padding: "3px 0", fontFamily: "monospace", fontSize: 11, color: col, lineHeight: 1.5 }}>
            <span style={{ color: "#6ee7b7", minWidth: 24, textAlign: "right", flexShrink: 0, opacity: 0.7 }}>{String(i + 1).padStart(3, "0")}</span>
            <span>{log}</span>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

function SocialRow({ href, label, icon }) {
  const empty = !href || href === "N/A";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: `1px solid ${empty ? "#e5e7eb" : T.tealLight}`, background: empty ? "#fff" : T.tealBg }}>
      <span style={{ color: empty ? "#9ca3af" : T.teal, display: "flex" }}>{icon}</span>
      <span style={{ fontSize: 12, color: empty ? "#6b7280" : "#1f2937", flex: 1, fontWeight: 500 }}>{label}</span>
      {!empty && (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: T.teal, display: "flex" }}>
          <Icon d={ICONS.externalLink} size={12} color={T.teal} />
        </a>
      )}
    </div>
  );
}

function ResultsPanel({ result, isPartial }) {
  const [tab, setTab] = useState("overview");

  const parsed = (() => {
    if (!result?.results_json) return null;
    try { return JSON.parse(result.results_json); } catch { return null; }
  })();

  if (!result?.results_markdown && !result?.results_json) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 20px", textAlign: "center" }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: T.tealBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Icon d={ICONS.users} size={20} color={T.teal} />
      </div>
      <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Lancez une recherche</p>
    </div>
  );

  const co    = parsed?.company;
  const emps  = parsed?.employees ?? [];
  const total = emps.reduce((a, e) => a + e.emails.length, 0);
  const avg   = emps.length > 0
    ? Math.round(emps.reduce((a, e) => {
        const s = e.emails.length > 0 ? e.emails.reduce((x, em) => x + em.score, 0) / e.emails.length : 0;
        return a + s;
      }, 0) / emps.length)
    : 0;

  const tabs = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "markdown", label: "Rapport" },
    { id: "json",     label: "JSON" },
  ];

  return (
    <div>
      {isPartial && (
        <div style={{ marginBottom: 16, padding: "12px 14px", background: T.orangeBg, border: `1px solid #fed7aa`, borderRadius: 10, display: "flex", gap: 10 }}>
          <Icon d={ICONS.alertCircle} size={16} color={T.orange} />
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: T.orange, margin: 0 }}>Résultats partiels</p>
            <p style={{ fontSize: 11, color: "#b45309", margin: "2px 0 0" }}>Recherche arrêtée avant fin</p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 2, marginBottom: 16, padding: 4, background: "#f3f4f6", borderRadius: 10, width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: tab === t.id ? T.teal : "transparent", color: tab === t.id ? "#fff" : "#6b7280" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && co && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px", borderLeft: `3px solid ${T.teal}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: T.tealBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon d={ICONS.building} size={20} color={T.teal} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 15, color: "#1f2937", margin: 0 }}>{co.name || "—"}</p>
                <p style={{ fontSize: 12, color: T.teal, margin: "3px 0 0", fontWeight: 500 }}>
                  {co.domain || "N/A"}
                </p>
              </div>
            </div>
            {co.description && (
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14, lineHeight: 1.6 }}>
                {co.description.slice(0, 200)}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <SocialRow href={co.social_links?.linkedin}  label="LinkedIn"  icon={<LinkedInSVG size={13} />} />
              <SocialRow href={co.social_links?.facebook}  label="Facebook"  icon={<Icon d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" size={13} />} />
              <SocialRow href={co.social_links?.instagram} label="Instagram" icon={<Icon d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" size={13} />} />
              <SocialRow href={co.social_links?.twitter}   label="Twitter"   icon={<Icon d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" size={13} />} />
            </div>
            {co.address && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
                <Icon d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" size={12} color={T.teal} />
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{co.address}</p>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {[
              { val: emps.length, label: "Employés", icon: ICONS.users,  color: T.teal,  bg: T.tealBg },
              { val: total,       label: "Emails",   icon: ICONS.mail,   color: T.blue,  bg: T.blueBg },
              { val: `${avg}%`,   label: "Score",    icon: ICONS.target, color: T.green, bg: T.greenBg },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 10, padding: "16px", textAlign: "center" }}>
                <Icon d={s.icon} size={18} color={s.color} />
                <p style={{ fontSize: 20, fontWeight: 600, margin: "8px 0 0", color: s.color }}>{s.val}</p>
                <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {co.emails?.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: T.teal, textTransform: "uppercase", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon d={ICONS.mail} size={11} color={T.teal} /> Emails génériques
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {co.emails.map((e, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: "#f3f4f6" }}>
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "#1f2937" }}>{e}</span>
                    <CopyBtn text={e} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {co.phones?.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: T.teal, textTransform: "uppercase", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon d={ICONS.phone} size={11} color={T.teal} /> Téléphones
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {co.phones.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: "#f3f4f6" }}>
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "#1f2937" }}>{p}</span>
                    <CopyBtn text={p} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: T.teal, textTransform: "uppercase", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon d={ICONS.users} size={11} color={T.teal} /> Employés ({emps.length})
            </p>
            {emps.length > 0
              ? <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{emps.map((e, i) => <EmployeeCard key={i} emp={e} />)}</div>
              : <p style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>Aucun employé</p>
            }
          </div>
        </div>
      )}

      {tab === "markdown" && result?.results_markdown && (
        <div style={{ background: "#f9fafb", borderRadius: 10, padding: 16, fontSize: 12, color: "#1f2937", lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "monospace", maxHeight: 420, overflowY: "auto", border: "1px solid #e5e7eb" }}>
          {result.results_markdown}
        </div>
      )}

      {tab === "json" && result?.results_json && (
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}>
            <CopyBtn text={result.results_json} />
          </div>
          <pre style={{ background: "#1f2937", color: "#10b981", borderRadius: 10, padding: 16, fontSize: 11, fontFamily: "monospace", overflowX: "auto", maxHeight: 420, lineHeight: 1.6, margin: 0, border: "1px solid #374151" }}>
            {JSON.stringify(JSON.parse(result.results_json), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Field — extrait hors du composant principal ──────────────────────────
// CORRECTION BUG 1 : Field doit être défini HORS du composant OSINTDashboard
// pour éviter la recréation à chaque render (qui causait la perte de focus).
function Field({ label, field, value, onChange, disabled, placeholder, icon }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.teal, display: "flex", pointerEvents: "none" }}>
            {icon}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={e => onChange(field, e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontSize: 13,
            padding: icon ? "10px 12px 10px 36px" : "10px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            background: "#fff",
            color: "#1f2937",
            outline: "none",
            opacity: disabled ? 0.6 : 1,
            transition: "border-color .2s, box-shadow .2s",
          }}
          onFocus={e => { if (!disabled) { e.target.style.borderColor = T.teal; e.target.style.boxShadow = `0 0 0 3px ${T.teal}22`; } }}
          onBlur={e => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }}
        />
      </div>
    </div>
  );
}

// ─── LeftPanel — extrait hors du composant principal ─────────────────────
// CORRECTION BUG 1 (suite) : LeftPanel doit aussi être HORS de OSINTDashboard.
// Avant, il était défini dedans → recréé à chaque render → démontage/remontage
// de tous les <input> → perte de focus à chaque frappe.
function LeftPanel({ formData, handleField, isActive, status, sessionId, progress, pct, startSearch, stopSearch }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb", background: T.tealBg, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon d={ICONS.target} size={14} color={T.teal} />
          <p style={{ fontSize: 13, fontWeight: 600, color: T.tealDark, margin: 0 }}>Paramètres</p>
        </div>
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Nom"    field="company_name"   value={formData.company_name}   onChange={handleField} disabled={isActive} placeholder="ex: Acme Corp"  icon={<Icon d={ICONS.building} size={13} />} />
          <Field label="Handle" field="company_handle" value={formData.company_handle} onChange={handleField} disabled={isActive} placeholder="ex: acme-corp"   icon={<Icon d={ICONS.hash} size={13} />} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
            <Field label="Pays" field="country_name" value={formData.country_name} onChange={handleField} disabled={isActive} placeholder="France" icon={<Icon d={ICONS.globe} size={13} />} />
            <Field label="ISO"  field="country_iso"  value={formData.country_iso}  onChange={handleField} disabled={isActive} placeholder="TN" />
          </div>
          <Field label="Rôles" field="target_roles" value={formData.target_roles} onChange={handleField} disabled={isActive} placeholder="CEO, Dev" icon={<Icon d={ICONS.users} size={13} />} />
        </div>
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={startSearch}
            disabled={isActive}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", background: isActive ? `${T.teal}77` : T.teal, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: isActive ? "not-allowed" : "pointer" }}>
            {status === "running"
              ? <><Spinner size={14} color="#fff" />Recherche...</>
              : <><Icon d={ICONS.play} size={14} color="#fff" />Lancer</>
            }
          </button>
          {isActive && (
            <button
              onClick={stopSearch}
              disabled={status === "stopping"}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", background: "transparent", border: `1px solid ${T.red}`, borderRadius: 8, color: T.red, fontSize: 13, fontWeight: 600, cursor: status === "stopping" ? "not-allowed" : "pointer", opacity: status === "stopping" ? 0.6 : 1 }}>
              {status === "stopping"
                ? <><Spinner size={14} color={T.red} />Arrêt...</>
                : <><Icon d={ICONS.stop} size={14} color={T.red} />Arrêter</>
              }
            </button>
          )}
        </div>
      </div>

      {sessionId && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.teal, textTransform: "uppercase", margin: "0 0 14px" }}>Session</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Statut</span>
              <StatusBadge status={status === "stopping" ? "stopping" : progress?.status ?? status} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>ID</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#6b7280" }}>{sessionId.slice(0, 10)}…</span>
                <CopyBtn text={sessionId} />
              </div>
            </div>
            {progress && (
              <>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: "#6b7280" }}>{formatProgressLabel(pct)}</span>
                    <span style={{ fontWeight: 600, color: T.teal }}>{Math.round(pct)}%</span>
                  </div>
                  <div style={{ height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: status === "stopping" ? T.orange : T.teal, borderRadius: 99, transition: "width .5s" }} />
                  </div>
                </div>
                <ProgressSteps progress={pct} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function OSINTDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_Company_searsh_URL || "https://search-company-xc9u.onrender.com";

  const [formData, setFormData] = useState({
    company_name:   "3LM Solutions",
    company_handle: "3lm-solutions",
    country_name:   "Tunisia",
    country_iso:    "TN",
    target_roles:   "CEO, CTO, Développeur",
  });
  const [sessionId,   setSessionId]   = useState("");
  const [progress,    setProgress]    = useState(null);
  const [status,      setStatus]      = useState("idle");
  const [activeTab,   setActiveTab]   = useState("logs");
  const [errorMsg,    setErrorMsg]    = useState("");
  const [apiOk,       setApiOk]       = useState(null);
  const [isClient,    setIsClient]    = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => { setIsClient(true); checkHealth(); }, []);

  const isActive = ["running", "stopping"].includes(status);

  const startPolling = useCallback((sid) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/progress/${sid}`);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        setProgress(data);
        if (["completed", "stopped", "error"].includes(data.status)) {
          setStatus(data.status);
          clearInterval(pollRef.current);
          if (["completed", "stopped"].includes(data.status)) {
            setActiveTab("results");
            setSidebarOpen(false);
          }
        }
      } catch (e) { console.error("Poll:", e); }
    }, 1000);
  }, [API_URL]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const checkHealth = async () => {
    try { const r = await fetch(`${API_URL}/health`); setApiOk(r.ok); }
    catch { setApiOk(false); }
  };

  const startSearch = async () => {
    try {
      setErrorMsg("");
      setProgress(null);
      setActiveTab("logs");
      setStatus("running");
      setSidebarOpen(false);
      const res = await fetch(`${API_URL}/predict-osint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      const data = await res.json();
      setSessionId(data.session_id);
      startPolling(data.session_id);
    } catch (e) {
      setErrorMsg(`Erreur: ${e}`);
      setStatus("idle");
    }
  };

  // CORRECTION BUG 2 : on envoie la requête D'ABORD, puis on met à jour
  // le statut local. L'ancienne version faisait setStatus("stopping") avant
  // le fetch, ce qui désactivait le bouton et pouvait bloquer l'appel.
  const stopSearch = async () => {
    if (!sessionId) return;
    setErrorMsg("");
    try {
      const res = await fetch(`${API_URL}/stop/${sessionId}`, { method: "POST" });
      if (!res.ok) throw new Error(`Erreur: ${res.status}`);
      setStatus("stopping");
    } catch (e) {
      setErrorMsg(`Erreur arrêt: ${e}`);
    }
  };

  const handleField = useCallback((field, val) => {
    setFormData(p => ({ ...p, [field]: val }));
  }, []);

  if (!isClient) return null;

  const pct = progress?.progress ?? 0;

  const leftPanelProps = {
    formData,
    handleField,
    isActive,
    status,
    sessionId,
    progress,
    pct,
    startSearch,
    stopSearch,
  };

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; background: #f9fafb; }
        .osint-layout { display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; }
        .osint-sidebar-desktop { display: block; }
        .osint-menu-btn { display: none; }
        @media (max-width: 768px) {
          .osint-layout { grid-template-columns: 1fr; }
          .osint-sidebar-desktop { display: none; }
          .osint-menu-btn { display: flex; }
        }
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 40; animation: fadeIn .2s; }
        .drawer { position: fixed; left: 0; top: 0; bottom: 0; width: min(300px, 85vw); background: #fff; z-index: 50; overflow-y: auto; padding: 16px; animation: slideIn .25s ease; border-right: 1px solid #e5e7eb; }
        @keyframes fadeIn { from { opacity: 0; } }
        @keyframes slideIn { from { transform: translateX(-100%); } }
        input:focus { border-color: ${T.teal} !important; outline: none !important; box-shadow: 0 0 0 3px ${T.teal}22 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 16px", position: "sticky", top: 0, zIndex: 30 }}>
          <div style={{ maxWidth: 1220, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button className="osint-menu-btn" onClick={() => setSidebarOpen(true)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: T.teal, padding: 6 }}>
                <Icon d={ICONS.menu} size={20} />
              </button>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={ICONS.shield} size={16} color="#fff" />
              </div>
              <span style={{ fontWeight: 600, fontSize: 15, color: "#1f2937" }}>OSINT Intelligence</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6b7280", background: "#f3f4f6", padding: "6px 12px", borderRadius: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: apiOk === null ? "#9ca3af" : apiOk ? T.teal : T.red, ...(apiOk === true ? { animation: "pulse 2s infinite" } : {}) }} />
                {apiOk === null ? "Vérification" : apiOk ? "Connectée" : "Hors ligne"}
              </div>
              <button onClick={checkHealth}
                style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", color: T.teal, display: "flex" }}>
                <Icon d={ICONS.refresh} size={14} />
              </button>
            </div>
          </div>
        </header>

        {sidebarOpen && (
          <>
            <div className="drawer-overlay" onClick={() => setSidebarOpen(false)} />
            <div className="drawer">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>Paramètres</span>
                <button onClick={() => setSidebarOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#6b7280" }}>
                  <Icon d={ICONS.x} size={18} />
                </button>
              </div>
              <LeftPanel {...leftPanelProps} />
            </div>
          </>
        )}

        <main style={{ maxWidth: 1220, margin: "0 auto", padding: "20px 16px 40px" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1f2937", margin: 0 }}>Recherche entreprise</h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>Intelligence — sociétés, employés et contacts</p>
          </div>

          {errorMsg && (
            <div style={{ marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: T.redBg, border: `1px solid #fecaca`, borderRadius: 10 }}>
              <Icon d={ICONS.alertCircle} size={16} color={T.red} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.red, margin: 0 }}>Erreur</p>
                <p style={{ fontSize: 12, color: "#991b1b", margin: "2px 0 0" }}>{errorMsg}</p>
              </div>
              <button onClick={() => setErrorMsg("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.red }}>
                <Icon d={ICONS.x} size={14} />
              </button>
            </div>
          )}

          <div className="osint-layout">
            <div className="osint-sidebar-desktop" style={{ position: "sticky", top: 76 }}>
              <LeftPanel {...leftPanelProps} />
            </div>

            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#fafafa", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", gap: 2, padding: 3, background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                  {[
                    { id: "logs",    label: "Logs",      icon: ICONS.activity },
                    { id: "results", label: "Résultats", icon: ICONS.users },
                  ].map(t => {
                    const active = activeTab === t.id;
                    return (
                      <button key={t.id} onClick={() => setActiveTab(t.id)}
                        style={{ fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, background: active ? T.teal : "transparent", color: active ? "#fff" : "#6b7280" }}>
                        <Icon d={t.icon} size={12} />
                        {t.label}
                        {t.id === "logs" && progress?.logs?.length > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 600, background: active ? "#ffffff44" : "#f3f4f6", color: active ? "#fff" : "#6b7280", padding: "1px 6px", borderRadius: 99, marginLeft: 2 }}>{progress.logs.length}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontSize: 12 }}>
                  {status === "running" && !["completed", "stopped", "error"].includes(progress?.status) && (
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: T.tealDark, background: T.tealBg, padding: "6px 12px", borderRadius: 8, fontWeight: 500 }}>
                      <Spinner size={12} color={T.teal} />{Math.round(pct)}%
                    </span>
                  )}
                </div>
              </div>

              <div style={{ padding: 16 }}>
                {activeTab === "logs"    && <LogsPanel    logs={progress?.logs ?? []} />}
                {activeTab === "results" && <ResultsPanel result={progress?.result ?? {}} isPartial={progress?.result?.partial === true} />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}