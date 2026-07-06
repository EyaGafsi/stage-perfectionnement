'use client';

/**
 * Page Tâches Marketing — Vue Membre (améliorée)
 * Améliorations :
 *  - Barre de recherche (titre / description)
 *  - Filtres multi-critères : statut, priorité, canal, sprint
 *  - Transition étendue TO_DO → IN_PROGRESS → IN_REVIEW avec menu déroulant
 *  - Animations d'entrée en cascade (staggered fade-in)
 *  - Micro-interactions sur les cartes et badges
 *  - Indicateur de progression animé par sprint
 *  - Toast de confirmation après changement de statut
 *  - Résumé sticky des filtres actifs avec badges effaçables
 *  - Affichage "aucun résultat" contextuel
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Megaphone, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, Eye, Circle,
  Loader2, RefreshCw, Lock,
  BarChart2, Target, DollarSign, Clock, Calendar, User,
  TrendingUp, Activity, Layers, Search, SlidersHorizontal,
  X, Filter, ChevronUp, Play, ArrowRight, CheckCheck,
} from 'lucide-react';

import { getToken, getCurrentUserId, isTaskOwnedByUser } from '../../memberTaskUtils';

const API_BASE = process.env.NEXT_PUBLIC_NEST_API_URL || '';

// ─── Types ────────────────────────────────────────────────────────────────────

type MktStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED' | 'BLOCKED';
type Priority  = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface AssignedTo { id: number; fullname?: string; }

interface TaskMarketing {
  id: number;
  title: string;
  description?: string;
  status: MktStatus;
  priority: Priority;
  type?: string;
  channel?: string;
  budget?: number;
  estimatedHours?: number;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  completedAt?: string;
  delayHours?: number;
  expectedViews?: number;
  expectedClicks?: number;
  expectedLeads?: number;
  expectedConversions?: number;
  assignedTo?: AssignedTo | number | string | null;
}

interface SprintMarketing {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  campaignType?: string;
  totalBudget?: number;
  targetAudience?: string;
  channels?: string;
  goals?: string;
  expectedReach?: number;
  expectedLeads?: number;
  tasks: TaskMarketing[];
}

// ─── Transitions de statut autorisées pour le membre ─────────────────────────
// TO_DO → IN_PROGRESS  (démarrer)
// TO_DO → IN_REVIEW    (soumettre directement)
// IN_PROGRESS → IN_REVIEW (soumettre pour révision)

const MEMBER_TRANSITIONS: Partial<Record<MktStatus, { to: MktStatus; label: string; icon: React.ReactNode; color: string }[]>> = {
  TO_DO: [
    { to: 'IN_PROGRESS', label: 'Démarrer', icon: <Play size={11} />, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    { to: 'IN_REVIEW',   label: 'Soumettre', icon: <ArrowRight size={11} />, color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  ],
  IN_PROGRESS: [
    { to: 'IN_REVIEW', label: 'Soumettre pour révision', icon: <ArrowRight size={11} />, color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  ],
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_META: Record<MktStatus, {
  label: string; color: string; bg: string; border: string; icon: React.ReactNode;
}> = {
  TO_DO:       { label: 'À faire',     color: 'text-slate-600',  bg: 'bg-slate-100',  border: 'border-slate-200',  icon: <Circle size={12} /> },
  IN_PROGRESS: { label: 'En cours',    color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  icon: <Loader2 size={12} className="animate-spin" /> },
  IN_REVIEW:   { label: 'En révision', color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-200', icon: <Eye size={12} /> },
  DONE:        { label: 'Terminé',     color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200',icon: <CheckCircle2 size={12} /> },
  CANCELLED:   { label: 'Annulé',      color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    icon: <Lock size={12} /> },
  BLOCKED:     { label: 'Bloqué',      color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200',    icon: <Lock size={12} /> },
};

const PRIORITY_META: Record<Priority, { label: string; color: string; dot: string }> = {
  LOW:      { label: 'Faible',   color: 'text-slate-400',  dot: 'bg-slate-300' },
  MEDIUM:   { label: 'Moyen',    color: 'text-blue-500',   dot: 'bg-blue-400' },
  HIGH:     { label: 'Élevé',    color: 'text-orange-500', dot: 'bg-orange-400' },
  CRITICAL: { label: 'Critique', color: 'text-red-600',    dot: 'bg-red-500' },
};

const TYPE_EMOJI: Record<string, string> = {
  CAMPAIGN: '📣', CONTENT_CREATION: '✍️', SEO: '🔍', SOCIAL_MEDIA: '📱',
  EMAIL: '📧', PPC: '💰', ANALYTICS: '📊', DESIGN: '🎨', COPYWRITING: '📝', OTHER: '📌',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOverdue(t: TaskMarketing): boolean {
  if (t.status === 'DONE' || t.status === 'CANCELLED') return false;
  if (!t.scheduledEndDate) return false;
  return new Date(t.scheduledEndDate).getTime() < Date.now();
}

function fmt(d?: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function fmtBudget(n?: number): string | null {
  if (n == null || n === 0) return null;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; text: string; type: 'success' | 'error'; }

function ToastContainer({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold border animate-fade-in
            ${t.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'}`}>
          {t.type === 'success' ? <CheckCheck size={14} /> : <AlertTriangle size={14} />}
          {t.text}
          <button onClick={() => remove(t.id)} className="ml-1 opacity-40 hover:opacity-80 transition-opacity">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const idRef = useRef(0);

  const push = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = ++idRef.current;
    setToasts((p) => [...p, { id, text, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const remove = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, push, remove };
}

// ─── StatusBadge avec menu déroulant ─────────────────────────────────────────

function StatusBadge({ task, onUpdate }: {
  task: TaskMarketing;
  onUpdate: (id: number, s: MktStatus, delayReason?: string) => Promise<{ ok: boolean }>;
}) {
  const [busy, setBusy]       = useState(false);
  const [open, setOpen]       = useState(false);
  const [pendingStatus, setPendingStatus] = useState<MktStatus | null>(null);
  const [delayReason, setDelayReason] = useState('');
  const ref                   = useRef<HTMLDivElement>(null);
  const meta                  = STATUS_META[task.status] ?? STATUS_META.TO_DO;
  const transitions           = MEMBER_TRANSITIONS[task.status];

  // Ferme le menu si on clique ailleurs
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleTransition = async (status: MktStatus) => {
    setOpen(false);
    if ((status === 'DONE' || status === 'IN_REVIEW') && isOverdue(task)) {
      setPendingStatus(status);
      return;
    }
    setBusy(true);
    await onUpdate(task.id, status);
    setBusy(false);
  };

  const submitDelayReason = async () => {
    if (!pendingStatus) return;
    setBusy(true);
    await onUpdate(task.id, pendingStatus, delayReason);
    setBusy(false);
    setPendingStatus(null);
    setDelayReason('');
  };

  const modal = pendingStatus ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" /> Tâche en retard
          </h3>
          <button onClick={() => setPendingStatus(null)} className="text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-600 mb-4 font-medium leading-relaxed">
            Cette tâche a dépassé son échéance. Veuillez expliquer brièvement la raison du retard. Ces données nous aideront à améliorer nos estimations futures.
          </p>
          <textarea
            autoFocus
            className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 min-h-[100px] resize-none shadow-sm"
            placeholder="Ex: Problème inattendu, changement de stratégie..."
            value={delayReason}
            onChange={(e) => setDelayReason(e.target.value)}
          />
        </div>
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={() => setPendingStatus(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
            Annuler
          </button>
          <button onClick={submitDelayReason} disabled={!delayReason.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            Confirmer & Terminer
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (!transitions || transitions.length === 0) {
    return (
      <>
        {modal}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${meta.bg} ${meta.color} ${meta.border}`}>
          {meta.icon} {meta.label}
        </span>
      </>
    );
  }

  // Un seul choix → bouton direct
  if (transitions.length === 1) {
    const tr = transitions[0];
    return (
      <>
        {modal}
        <button
          disabled={busy}
          onClick={() => handleTransition(tr.to)}
          title={`${meta.label} → ${tr.label}`}
          className={`group/btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold
            transition-all duration-150 disabled:opacity-50 ${tr.color}`}>
          {busy ? <Loader2 size={11} className="animate-spin" /> : meta.icon}
          {meta.label}
          {!busy && (
            <span className="text-[9px] opacity-0 group-hover/btn:opacity-100 transition-opacity ml-0.5 whitespace-nowrap">
              → {tr.label}
            </span>
          )}
        </button>
      </>
    );
  }

  // Plusieurs choix → menu déroulant
  return (
    <div ref={ref} className="relative">
      {modal}
      <button
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold
          transition-all duration-150 disabled:opacity-50 ${meta.bg} ${meta.color} ${meta.border} hover:opacity-80`}>
        {busy ? <Loader2 size={11} className="animate-spin" /> : meta.icon}
        {meta.label}
        <ChevronDown size={10} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-52 animate-fade-in">
          <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
            Changer le statut
          </p>
          {transitions.map((tr) => (
            <button key={tr.to}
              onClick={() => handleTransition(tr.to)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left transition-colors ${tr.color}`}>
              {tr.icon} {tr.label}
              <span className="ml-auto text-[9px] opacity-50">{STATUS_META[tr.to].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MyTaskCard ───────────────────────────────────────────────────────────────

function MyTaskCard({ task, onUpdate, index }: {
  task: TaskMarketing;
  onUpdate: (id: number, s: MktStatus, delayReason?: string) => Promise<{ ok: boolean }>;
  index?: number;
}) {
  const overdue = isOverdue(task);
  const done    = task.status === 'DONE';
  const prio    = PRIORITY_META[task.priority] ?? PRIORITY_META.MEDIUM;
  const emoji   = TYPE_EMOJI[task.type ?? ''] ?? '📌';

  return (
    <div
      className={`relative rounded-xl border-2 p-4 transition-all duration-200
        ${done    ? 'bg-emerald-50/70 border-emerald-200 shadow-sm shadow-emerald-100'
        : overdue ? 'bg-red-50/60 border-red-300 shadow-sm shadow-red-100'
                  : 'bg-white border-rose-200 shadow-sm hover:shadow-md hover:border-rose-400 hover:-translate-y-0.5'}`}
      style={{ animationDelay: `${(index ?? 0) * 50}ms` }}>

      <div className="absolute -top-2.5 left-4">
        <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full tracking-widest uppercase shadow-sm">
          Ma tâche
        </span>
      </div>

      <div className="flex flex-col gap-3 pt-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-base leading-none">{emoji}</span>
              <h4 className={`font-bold text-sm leading-snug
                ${done    ? 'text-emerald-800 line-through opacity-70'
                : overdue ? 'text-red-800'
                          : 'text-slate-800'}`}>
                {task.title}
              </h4>
            </div>
            {task.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{task.description}</p>
            )}
          </div>
          <StatusBadge task={task} onUpdate={onUpdate} />
        </div>

        {/* Channels & type */}
        {(task.channel || task.type) && (
          <div className="flex flex-wrap gap-1.5">
            {task.channel && task.channel.split(';').map((ch) => ch.trim()).filter(Boolean).map((ch) => (
              <span key={ch} className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[10px] font-semibold">{ch}</span>
            ))}
            {task.type && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-semibold">{task.type}</span>
            )}
          </div>
        )}

        {/* KPIs */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <span className={`flex items-center gap-1 font-semibold ${prio.color}`}>
            <span className={`w-2 h-2 rounded-full ${prio.dot}`} />{prio.label}
          </span>
          {fmtBudget(task.budget) && (
            <span className="flex items-center gap-1 text-slate-400"><DollarSign size={9} /> {fmtBudget(task.budget)}</span>
          )}
          {task.estimatedHours != null && (
            <span className="flex items-center gap-1 text-slate-400"><Clock size={9} /> {task.estimatedHours}h</span>
          )}
          {task.expectedViews != null && (
            <span className="flex items-center gap-1 text-slate-400"><BarChart2 size={9} /> {task.expectedViews.toLocaleString()} vues</span>
          )}
          {task.expectedClicks != null && (
            <span className="flex items-center gap-1 text-slate-400"><Activity size={9} /> {task.expectedClicks.toLocaleString()} clics</span>
          )}
          {task.expectedLeads != null && (
            <span className="flex items-center gap-1 text-slate-400"><Target size={9} /> {task.expectedLeads} leads</span>
          )}
        </div>

        {/* Dates */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          {task.scheduledStartDate && (
            <span className="flex items-center gap-1 text-slate-400"><Calendar size={9} /> Début {fmt(task.scheduledStartDate)}</span>
          )}
          {task.scheduledEndDate && (
            <span className={`flex items-center gap-1 font-semibold ${overdue ? 'text-red-600' : 'text-slate-400'}`}>
              <Calendar size={9} />{overdue ? 'Retard — ' : ''}Échéance {fmt(task.scheduledEndDate)}
            </span>
          )}
          {task.delayHours != null && task.delayHours > 0 && (
            <span className="flex items-center gap-1 text-red-500 font-bold"><AlertTriangle size={9} /> {task.delayHours}h de retard</span>
          )}
          {task.completedAt && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle2 size={9} /> Terminé {fmt(task.completedAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── OtherTaskRow ─────────────────────────────────────────────────────────────

function OtherTaskRow({ task }: { task: TaskMarketing }) {
  const overdue = isOverdue(task);
  const done    = task.status === 'DONE';
  const meta    = STATUS_META[task.status] ?? STATUS_META.TO_DO;
  const emoji   = TYPE_EMOJI[task.type ?? ''] ?? '📌';

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs transition-all
      ${done    ? 'bg-emerald-50/40 border-emerald-100 opacity-60'
      : overdue ? 'bg-red-50/30 border-red-200 opacity-80'
                : 'bg-slate-50 border-slate-100 opacity-55'}`}>
      <span className="shrink-0 text-base leading-none">{emoji}</span>
      <span className={`shrink-0 ${done ? 'text-emerald-400' : overdue ? 'text-red-400' : 'text-slate-300'}`}>{meta.icon}</span>
      <span className={`flex-1 truncate font-medium
        ${done    ? 'line-through text-emerald-600'
        : overdue ? 'text-red-600'
                  : 'text-slate-400'}`}>
        {task.title}
      </span>
      {task.channel && (
        <span className="shrink-0 text-[9px] text-rose-400 hidden sm:block">
          {task.channel.split(';')[0]?.trim()}
        </span>
      )}
      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold ${meta.bg} ${meta.color} ${meta.border} border`}>
        {meta.label}
      </span>
      {typeof task.assignedTo === 'object' && task.assignedTo?.fullname && (
        <span className="shrink-0 flex items-center gap-1 text-slate-300">
          <User size={8} /> {task.assignedTo.fullname.split(' ')[0]}
        </span>
      )}
    </div>
  );
}

// ─── SprintBlock ──────────────────────────────────────────────────────────────

function SprintBlock({ sprint, myUserId, onUpdateTask, filteredTaskIds }: {
  sprint: SprintMarketing;
  myUserId: number | null;
  onUpdateTask: (id: number, s: MktStatus, delayReason?: string) => Promise<{ ok: boolean }>;
  filteredTaskIds: Set<number> | null; // null = pas de filtre actif
}) {
  const [open, setOpen] = useState(true);

  const allMyTasks    = sprint.tasks.filter((t) => isTaskOwnedByUser(t.assignedTo, myUserId));
  const allOtherTasks = sprint.tasks.filter((t) => !isTaskOwnedByUser(t.assignedTo, myUserId));

  // Appliquer le filtre visuel
  const myTasks    = filteredTaskIds ? allMyTasks.filter((t)    => filteredTaskIds.has(t.id)) : allMyTasks;
  const otherTasks = filteredTaskIds ? allOtherTasks.filter((t) => filteredTaskIds.has(t.id)) : allOtherTasks;

  // Si aucune tâche ne correspond au filtre → on cache le sprint
  if (filteredTaskIds && myTasks.length === 0 && otherTasks.length === 0) return null;

  const done     = sprint.tasks.filter((t) => t.status === 'DONE').length;
  const pct      = sprint.tasks.length > 0 ? Math.round((done / sprint.tasks.length) * 100) : 0;
  const sprintDone = sprint.status === 'completed' || sprint.status === 'done';
  const sprintOver = !sprintDone && new Date(sprint.endDate).getTime() < Date.now();

  return (
    <div className={`rounded-2xl border-2 transition-all duration-200
      ${sprintDone ? 'border-emerald-200 bg-emerald-50/30'
      : sprintOver ? 'border-orange-200 bg-orange-50/20'
                   : 'border-slate-200 bg-white'}`}>

      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50/50 transition-colors">
        <span className="text-slate-400 shrink-0">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-bold text-sm text-slate-800 truncate">{sprint.name}</span>
            {sprint.campaignType && (
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[9px] font-bold">
                {sprint.campaignType}
              </span>
            )}
            {sprintDone && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-black uppercase tracking-wider">Terminé</span>
            )}
            {sprintOver && !sprintDone && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-[9px] font-black uppercase">Expiré</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400 flex-wrap">
            <span>{fmt(sprint.startDate)} → {fmt(sprint.endDate)}</span>
            {fmtBudget(sprint.totalBudget) && (
              <span className="flex items-center gap-0.5"><TrendingUp size={8} /> {fmtBudget(sprint.totalBudget)}</span>
            )}
            {sprint.targetAudience && <span className="hidden sm:inline">{sprint.targetAudience}</span>}
            <span className="font-semibold text-rose-500">{allMyTasks.length} mes tâches</span>
            <span>· {sprint.tasks.length} total</span>
          </div>
        </div>
        {/* Barre de progression */}
        <div className="shrink-0 flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${sprintDone ? 'bg-emerald-400' : 'bg-rose-400'}`}
              style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{pct}%</span>
        </div>
      </button>

      {open && sprint.goals && (
        <div className="mx-5 mb-3 px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700 flex items-start gap-2">
          <Layers size={11} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2">{sprint.goals}</span>
        </div>
      )}

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {myTasks.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-rose-300 rounded" />Mes tâches ({myTasks.length})<span className="w-4 h-0.5 bg-rose-300 rounded" />
              </p>
              <div className="space-y-2.5">
                {myTasks.map((t, i) => <MyTaskCard key={t.id} task={t} onUpdate={onUpdateTask} index={i} />)}
              </div>
            </div>
          )}
          {myTasks.length === 0 && !filteredTaskIds && (
            <p className="text-[11px] text-slate-300 italic text-center py-2">Aucune tâche assignée dans cette campagne</p>
          )}
          {otherTasks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-4 h-px bg-slate-200 rounded" />Autres tâches ({otherTasks.length})<span className="w-4 h-px bg-slate-200 rounded" />
              </p>
              <div className="space-y-1">
                {otherTasks.map((t) => <OtherTaskRow key={t.id} task={t} />)}
              </div>
            </div>
          )}
          {sprint.tasks.length === 0 && (
            <p className="text-center text-xs text-slate-300 py-4">Aucune tâche dans cette campagne</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

interface Filters {
  search: string;
  statuses: MktStatus[];
  priorities: Priority[];
  sprintId: number | null;
  myOnly: boolean;
}

const EMPTY_FILTERS: Filters = { search: '', statuses: [], priorities: [], sprintId: null, myOnly: false };

function FilterBar({
  filters, onChange, sprints, totalCount, filteredCount,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  sprints: SprintMarketing[];
  totalCount: number;
  filteredCount: number;
}) {
  const [panelOpen, setPanelOpen] = useState(false);

  const activeCount =
    (filters.statuses.length > 0 ? 1 : 0) +
    (filters.priorities.length > 0 ? 1 : 0) +
    (filters.sprintId != null ? 1 : 0) +
    (filters.myOnly ? 1 : 0);

  const hasSearch = filters.search.trim().length > 0;
  const isFiltering = activeCount > 0 || hasSearch;

  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Ligne principale */}
      <div className="flex items-center gap-2 px-4 py-3">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Rechercher une tâche…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-300 text-slate-700"
        />
        {hasSearch && (
          <button onClick={() => onChange({ ...filters, search: '' })}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={12} />
          </button>
        )}
        <div className="w-px h-5 bg-slate-100 mx-1" />
        <button
          onClick={() => setPanelOpen((o) => !o)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all
            ${panelOpen || activeCount > 0
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>
          <SlidersHorizontal size={12} />
          Filtres
          {activeCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[9px] font-black leading-none">
              {activeCount}
            </span>
          )}
          <ChevronDown size={10} className={`transition-transform ${panelOpen ? 'rotate-180' : ''}`} />
        </button>
        {isFiltering && (
          <button onClick={() => onChange(EMPTY_FILTERS)}
            className="px-2 py-1.5 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Panneau de filtres */}
      {panelOpen && (
        <div className="border-t border-slate-100 px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50">
          {/* Statut */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Statut</p>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(STATUS_META) as MktStatus[]).map((s) => {
                const m = STATUS_META[s];
                const active = filters.statuses.includes(s);
                return (
                  <button key={s}
                    onClick={() => onChange({ ...filters, statuses: toggle(filters.statuses, s) })}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition-all
                      ${active ? `${m.bg} ${m.color} ${m.border} ring-1 ring-offset-1 ring-rose-300` : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                    {m.icon} {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priorité */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priorité</p>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(PRIORITY_META) as Priority[]).map((p) => {
                const m = PRIORITY_META[p];
                const active = filters.priorities.includes(p);
                return (
                  <button key={p}
                    onClick={() => onChange({ ...filters, priorities: toggle(filters.priorities, p) })}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition-all
                      ${active ? `bg-slate-100 text-slate-700 border-slate-300 ring-1 ring-offset-1 ring-rose-300` : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                    <span className={`w-2 h-2 rounded-full ${m.dot}`} /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sprint + Mes tâches */}
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Campagne</p>
              <select
                value={filters.sprintId ?? ''}
                onChange={(e) => onChange({ ...filters, sprintId: e.target.value ? Number(e.target.value) : null })}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 outline-none focus:border-rose-300">
                <option value="">Toutes les campagnes</option>
                {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer group">
              <div onClick={() => onChange({ ...filters, myOnly: !filters.myOnly })}
                className={`w-8 h-4 rounded-full transition-all duration-200 relative
                  ${filters.myOnly ? 'bg-rose-500' : 'bg-slate-200'}`}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200
                  ${filters.myOnly ? 'left-4' : 'left-0.5'}`} />
              </div>
              <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors font-medium">Mes tâches uniquement</span>
            </label>
          </div>
        </div>
      )}

      {/* Résumé filtre actif */}
      {isFiltering && (
        <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-2 flex-wrap bg-white">
          <Filter size={10} className="text-rose-400 shrink-0" />
          <span className="text-[10px] text-slate-400">
            {filteredCount} / {totalCount} tâche{totalCount > 1 ? 's' : ''}
          </span>
          {filters.statuses.map((s) => (
            <span key={s}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_META[s].bg} ${STATUS_META[s].color} ${STATUS_META[s].border}`}>
              {STATUS_META[s].label}
              <button onClick={() => onChange({ ...filters, statuses: filters.statuses.filter((x) => x !== s) })}>
                <X size={8} />
              </button>
            </span>
          ))}
          {filters.priorities.map((p) => (
            <span key={p}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-600 border-slate-200`}>
              {PRIORITY_META[p].label}
              <button onClick={() => onChange({ ...filters, priorities: filters.priorities.filter((x) => x !== p) })}>
                <X size={8} />
              </button>
            </span>
          ))}
          {filters.myOnly && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-rose-50 text-rose-600 border-rose-200">
              Mes tâches <button onClick={() => onChange({ ...filters, myOnly: false })}><X size={8} /></button>
            </span>
          )}
          {filters.sprintId != null && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-50 text-slate-600 border-slate-200">
              {sprints.find((s) => s.id === filters.sprintId)?.name}
              <button onClick={() => onChange({ ...filters, sprintId: null })}><X size={8} /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemberMarketingTasksPage() {
  const params    = useParams();
  const projectId = Number(params?.projectId);

  const [projectName, setProjectName] = useState('');
  const [pmName, setPmName]           = useState('');
  const [sprints, setSprints]         = useState<SprintMarketing[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [filters, setFilters]         = useState<Filters>(EMPTY_FILTERS);

  const myUserId       = getCurrentUserId();
  const { toasts, push, remove } = useToast();

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true); setError(null);
    try {
      const token = getToken();
      const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const pRes = await fetch(`${API_BASE}/projects/${projectId}/details`, { headers: h });
      if (!pRes.ok) throw new Error('Projet introuvable');
      const pData = await pRes.json();
      setProjectName(pData.project?.name ?? '');
      setPmName(pData.project?.projectManager?.fullname ?? '');

      const subId: number | undefined = pData.domainDetails?.id;
      if (!subId) throw new Error('Aucun sous-projet Marketing trouvé pour ce projet.');

      const sRes = await fetch(`${API_BASE}/projects/${subId}/marketing-sprints`, { headers: h });
      if (!sRes.ok) throw new Error('Impossible de charger les campagnes');
      const sData: SprintMarketing[] = await sRes.json();
      setSprints(Array.isArray(sData) ? sData : []);
    } catch (e: any) {
      setError(e.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Update task status ─────────────────────────────────────────────────────

  const handleUpdateTask = useCallback(async (taskId: number, status: MktStatus, delayReason?: string): Promise<{ ok: boolean }> => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/projects/marketing-tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status, delayReason }),
      });
      if (res.ok) {
        setSprints((prev) =>
          prev.map((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) }))
        );
        push(`Statut mis à jour : ${STATUS_META[status].label}`, 'success');
        return { ok: true };
      } else {
        push('Échec de la mise à jour du statut', 'error');
        return { ok: false };
      }
    } catch {
      push('Erreur réseau', 'error');
      return { ok: false };
    }
  }, [push]);

  // ── Stats & filtres ────────────────────────────────────────────────────────

  const allTasks = useMemo(() => sprints.flatMap((s) => s.tasks), [sprints]);
  const myTasks  = useMemo(() => allTasks.filter((t) => isTaskOwnedByUser(t.assignedTo, myUserId)), [allTasks, myUserId]);

  const myDone    = myTasks.filter((t) => t.status === 'DONE').length;
  const myReview  = myTasks.filter((t) => t.status === 'IN_REVIEW').length;
  const myOverdue = myTasks.filter((t) => isOverdue(t)).length;
  const myToDo    = myTasks.filter((t) => t.status === 'TO_DO').length;

  // Calcul des IDs de tâches correspondant aux filtres
  const filteredTaskIds = useMemo<Set<number> | null>(() => {
    const hasFilter =
      filters.search.trim() ||
      filters.statuses.length > 0 ||
      filters.priorities.length > 0 ||
      filters.myOnly;

    if (!hasFilter && filters.sprintId == null) return null;

    const result = new Set<number>();
    const q = filters.search.trim().toLowerCase();

    for (const sprint of sprints) {
      if (filters.sprintId != null && sprint.id !== filters.sprintId) continue;
      for (const task of sprint.tasks) {
        if (filters.myOnly && !isTaskOwnedByUser(task.assignedTo, myUserId)) continue;
        if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) continue;
        if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) continue;
        if (q && !task.title.toLowerCase().includes(q) && !task.description?.toLowerCase().includes(q)) continue;
        result.add(task.id);
      }
    }
    return result;
  }, [filters, sprints, myUserId]);

  const filteredCount = filteredTaskIds ? filteredTaskIds.size : allTasks.length;

  // ── Sprints filtrés (par sprint si filtre sprint) ─────────────────────────
  const visibleSprints = useMemo(() =>
    filters.sprintId != null ? sprints.filter((s) => s.id === filters.sprintId) : sprints,
  [sprints, filters.sprintId]);

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-rose-500" size={32} />
          <p className="text-sm text-slate-400 font-medium">Chargement des campagnes…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-96 items-center justify-center gap-3">
        <AlertTriangle className="text-red-400" size={36} />
        <p className="text-slate-600 font-semibold">{error}</p>
        <button onClick={fetchData}
          className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors">
          Réessayer
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-rose-50/20">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease both; }
      `}</style>

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-5 py-3 flex items-center gap-3">
          <Link href="/Dashboard/project/memberproject"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600 shrink-0">
              <Megaphone size={15} />
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm text-slate-800 leading-none truncate">
                {projectName || `Projet #${projectId}`}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {pmName && `PM : ${pmName} · `}Marketing
              </p>
            </div>
          </div>
          <button onClick={fetchData}
            className="ml-auto p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-all shrink-0"
            title="Actualiser">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Mes tâches',  value: myTasks.length, color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-100' },
            { label: 'À faire',     value: myToDo,          color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200' },
            { label: 'En révision', value: myReview,        color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-100' },
            { label: 'Terminées',   value: myDone,          color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl px-4 py-3 transition-all hover:shadow-sm`}>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Alertes de retard */}
        {myTasks.filter(t => isOverdue(t)).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 text-red-700 font-bold">
              <AlertTriangle size={18} />
              <h3>Action requise : Vous avez des tâches en retard</h3>
            </div>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1 pl-1">
              {myTasks.filter(t => isOverdue(t)).map(t => (
                <li key={t.id}>
                  <span className="font-semibold">{t.title}</span> — Échéance : {fmt(t.scheduledEndDate)}
                </li>
              ))}
            </ul>
            <p className="text-xs text-red-500 mt-1">
              Veuillez traiter ces tâches en priorité. Lors du passage à l'état Terminé, une note explicative vous sera demandée pour justifier ce retard.
            </p>
          </div>
        )}

        {/* Barre de recherche + filtres */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          sprints={sprints}
          totalCount={allTasks.length}
          filteredCount={filteredCount}
        />

        {/* Légende */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 bg-white rounded-xl border border-slate-100 px-4 py-2.5">
          <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Légende</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-100 border-2 border-rose-300" /> Ma tâche</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border-2 border-emerald-300" /> Terminée</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border-2 border-red-300" /> En retard</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border-2 border-slate-200 opacity-50" /> Autre membre</span>
          <span className="flex items-center gap-1.5 ml-auto flex-wrap gap-y-1">
            <Play size={9} className="text-amber-400" /> <span>TO_DO → En cours</span>
            <ArrowRight size={9} className="text-violet-400 ml-2" /> <span>→ Révision</span>
          </span>
        </div>

        {/* Sprints */}
        {visibleSprints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Megaphone size={36} className="text-slate-200 mb-3" />
            <p className="text-slate-400 font-semibold">Aucune campagne disponible</p>
            <p className="text-slate-300 text-xs mt-1">Aucun sprint marketing n'a encore été créé pour ce projet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleSprints.map((s) => (
              <SprintBlock
                key={s.id}
                sprint={s}
                myUserId={myUserId}
                onUpdateTask={handleUpdateTask}
                filteredTaskIds={filteredTaskIds}
              />
            ))}
            {/* Aucun résultat après filtrage */}
            {filteredTaskIds && filteredTaskIds.size === 0 && (
              <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border-2 border-dashed border-slate-200 animate-fade-in">
                <Search size={28} className="text-slate-200 mb-3" />
                <p className="text-slate-400 font-semibold text-sm">Aucune tâche ne correspond aux filtres</p>
                <button onClick={() => setFilters(EMPTY_FILTERS)}
                  className="mt-3 px-4 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors">
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toasts */}
      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}