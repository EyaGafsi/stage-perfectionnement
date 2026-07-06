'use client';
// ─── ProjectSummaryPanel.tsx ──────────────────────────────────────────────────
// Turquoise/light theme — mobile-first responsive.

import React, { useState } from 'react';
import {
  Clock, Users, CalendarDays, DollarSign,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, TrendingUp,
} from 'lucide-react';
import type { ProjectMetrics } from '@/Dashboard/project/[id]/sprintslist/services/projectMetrics';

interface Props { metrics: ProjectMetrics; }

/* ── helpers ────────────────────────────────────────────────────────────────── */
const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const fmtCost = (n: number) =>
  n.toLocaleString('fr-FR', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 });

/* ── main component ─────────────────────────────────────────────────────────── */
export const ProjectSummaryPanel: React.FC<Props> = ({ metrics }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const errors   = metrics.warnings.filter((w) => w.severity === 'error');
  const warnings = metrics.warnings.filter((w) => w.severity === 'warning');

  return (
    <div
      className="
        mb-8 bg-white
        rounded-2xl overflow-hidden
        border border-teal-100
        shadow-[0_2px_16px_rgba(20,184,166,0.10)]
      "
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="
          px-4 py-3.5 sm:px-6 sm:py-4
          bg-gradient-to-r from-teal-50 via-cyan-50 to-white
          border-b border-teal-100
          flex items-center gap-2.5
        "
      >
        <div className="p-1.5 bg-teal-100 rounded-lg">
          <TrendingUp size={16} className="text-teal-600" />
        </div>
        <h2 className="text-sm sm:text-base font-bold text-slate-800">Résumé du Projet</h2>
        <span className="ml-auto text-[10px] sm:text-xs text-teal-400 italic hidden xs:block">
          Calculé automatiquement après enregistrement
        </span>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-slate-100">
        <KpiCard
          icon={<Clock size={16} className="text-teal-500" />}
          label="Total Heures"
          value={`${fmt(metrics.totalHours)} h`}
          sub="somme des estimations IA"
          accent="teal"
        />
        <KpiCard
          icon={<Users size={16} className="text-cyan-500" />}
          label="Équipe"
          value={`${metrics.teamSize} membre${metrics.teamSize > 1 ? 's' : ''}`}
          sub="membres assignés distincts"
          accent="cyan"
        />
        <KpiCard
          icon={<CalendarDays size={16} className="text-emerald-500" />}
          label="Durée Estimée"
          value={`${metrics.durationDays} jour${metrics.durationDays > 1 ? 's' : ''}`}
          sub={`heures / 8 / ${metrics.teamSize} membre${metrics.teamSize > 1 ? 's' : ''}`}
          accent="emerald"
        />
        <KpiCard
          icon={<DollarSign size={16} className="text-amber-500" />}
          label="Coût Estimé"
          value={fmtCost(metrics.estimatedCost)}
          sub="taux par niveau (Junior→Expert)"
          accent="amber"
        />
      </div>

      {/* ── Warnings / Errors ──────────────────────────────────────────── */}
      {metrics.warnings.length > 0 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-teal-50 space-y-2">
          {errors.map((w, i) => (
            <div
              key={i}
              className="
                flex items-start gap-2 text-xs sm:text-sm
                text-red-600 bg-red-50
                border border-red-100 rounded-xl
                px-3 py-2.5
              "
            >
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{w.message}</span>
            </div>
          ))}
          {warnings.map((w, i) => (
            <div
              key={i}
              className="
                flex items-start gap-2 text-xs sm:text-sm
                text-amber-700 bg-amber-50
                border border-amber-100 rounded-xl
                px-3 py-2.5
              "
            >
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {metrics.warnings.length === 0 && metrics.totalHours > 0 && (
        <div className="px-4 sm:px-6 py-3 border-t border-teal-50 flex items-center gap-2 text-xs sm:text-sm text-emerald-600">
          <CheckCircle2 size={14} />
          <span>Toutes les dates de tâches et de sprints sont cohérentes.</span>
        </div>
      )}

      {/* ── Per-sprint breakdown (collapsible) ─────────────────────────── */}
      {metrics.sprintMetrics.length > 0 && (
        <div className="border-t border-teal-50">
          <button
            onClick={() => setShowBreakdown((v) => !v)}
            className="
              w-full px-4 sm:px-6 py-3
              flex items-center justify-between
              text-xs sm:text-sm font-semibold text-teal-700
              hover:bg-teal-50/60
              transition-colors duration-150
            "
          >
            <span>Détail par sprint ({metrics.sprintMetrics.length})</span>
            <span className="p-1 rounded-lg bg-teal-50 text-teal-500">
              {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>

          {showBreakdown && (
            <div className="px-4 sm:px-6 pb-4 space-y-2">
              {metrics.sprintMetrics.map((sm) => (
                <div
                  key={sm.sprintId}
                  className="
                    flex flex-col sm:flex-row sm:items-center sm:justify-between
                    gap-1.5 sm:gap-4
                    text-xs sm:text-sm
                    bg-cyan-50/50
                    rounded-xl px-4 py-3
                    border border-teal-100
                  "
                >
                  <span className="font-semibold text-slate-700 truncate">{sm.sprintName}</span>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-500 flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-teal-400" />
                      {fmt(sm.totalHours)} h
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays size={11} className="text-cyan-400" />
                      {sm.durationDays} j
                    </span>
                    {sm.taskWarnings.length > 0 && (
                      <span className="flex items-center gap-1 text-red-500 font-semibold">
                        <AlertTriangle size={11} />
                        {sm.taskWarnings.length} date{sm.taskWarnings.length > 1 ? 's' : ''} invalide{sm.taskWarnings.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── KPI sub-component ──────────────────────────────────────────────────────── */
const accentMap = {
  teal:    'bg-teal-50 border-teal-100',
  cyan:    'bg-cyan-50 border-cyan-100',
  emerald: 'bg-emerald-50 border-emerald-100',
  amber:   'bg-amber-50 border-amber-100',
} as const;

const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: keyof typeof accentMap;
}> = ({ icon, label, value, sub, accent }) => (
  <div
    className={`
      px-4 py-4 sm:px-6 sm:py-5
      flex flex-col gap-1
      border-b border-r border-teal-50
      last:border-r-0
      [&:nth-child(2)]:border-r-0 md:[&:nth-child(2)]:border-r
      [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0
      ${accentMap[accent]}
    `}
  >
    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {icon}
      {label}
    </div>
    <div className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-tight">
      {value}
    </div>
    <div className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed">{sub}</div>
  </div>
);