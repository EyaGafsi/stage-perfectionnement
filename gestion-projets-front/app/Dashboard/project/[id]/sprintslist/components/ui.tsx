'use client';
// ─── ui.tsx ───────────────────────────────────────────────────────────────────
// Tiny shared UI primitives — turquoise/light theme.

import React from 'react';
import { Cpu, Loader2 } from 'lucide-react';
import type { TaskStatus, TaskPriority } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { formatHoursDays } from '@/Dashboard/project/[id]/sprintslist/services/estimationService';

// ── AI hour badge ─────────────────────────────────────────────────────────────
export const AiEstimateBadge = ({ hours }: { hours: number }) => (
  <span
    className="
      inline-flex items-center gap-1
      text-xs font-semibold px-2 py-0.5
      rounded-full
      bg-teal-50 text-teal-700
      border border-teal-200
      ring-1 ring-teal-100
    "
    title="Estimation IA"
  >
    <Cpu size={11} className="text-teal-500" />
    {formatHoursDays(hours)}
  </span>
);

// ── Spinning banner shown while AI estimates are in flight ────────────────────
export const EstimatingBanner = () => (
  <div
    className="
      mb-4 px-4 py-3
      bg-teal-50 border border-teal-200
      rounded-xl
      flex items-center gap-3
      text-teal-700 text-sm font-medium
      shadow-[0_1px_6px_rgba(20,184,166,0.10)]
    "
  >
    <Loader2 size={16} className="animate-spin flex-shrink-0 text-teal-500" />
    Estimation de la durée par l'IA en cours…
  </div>
);

// ── Colour helpers ────────────────────────────────────────────────────────────
export function getStatusBadgeColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    TO_DO:       'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    IN_PROGRESS: 'bg-teal-100 text-teal-700 ring-1 ring-teal-200',
    IN_REVIEW:   'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200',
    DONE:        'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    BLOCKED:     'bg-red-100 text-red-600 ring-1 ring-red-200',
  };
  return colors[status] ?? 'bg-slate-100 text-slate-600';
}

export function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    LOW:      'text-emerald-600',
    MEDIUM:   'text-amber-500',
    HIGH:     'text-orange-500',
    CRITICAL: 'text-red-500',
  };
  return colors[priority] ?? 'text-slate-500';
}

export function getDelayStatus(delayHours?: number): string {
  if (!delayHours || delayHours === 0) return "✅ À l'heure";
  if (delayHours > 0) return `⚠️ Retard: +${delayHours.toFixed(1)}h`;
  return `✨ Avance: ${Math.abs(delayHours).toFixed(1)}h`;
}