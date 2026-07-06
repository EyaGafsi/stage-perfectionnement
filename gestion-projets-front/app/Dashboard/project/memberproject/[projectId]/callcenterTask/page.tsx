'use client';

/**
 * Page Tâches Call Center — Vue Membre (améliorée)
 * Route : /Dashboard/project/[projectId]/member/callcenter-tasks
 *
 * - Affiche TOUS les sprints et TOUTES les tâches
 * - Mes tâches en premier (carte complète + actions)
 * - Autres tâches en dessous (carte grisée, lecture seule)
 * - Filtres : recherche, statut, priorité, sprint, mes tâches uniquement
 * - On ne peut modifier que ses propres tâches
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Headphones, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, Eye, Circle,
  Loader2, RefreshCw, Lock, Phone, Star,
  Clock, Calendar, User, Target, Activity,
  Search, SlidersHorizontal, X, Filter,
  Play, ArrowRight, CheckCheck,
} from 'lucide-react';

import { getToken, getCurrentUserId, isTaskOwnedByUser } from '../../memberTaskUtils';

const API_BASE = process.env.NEXT_PUBLIC_NEST_API_URL || '';

// ─── Types ────────────────────────────────────────────────────────────────────

type CCStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface AssignedTo { id: number; fullname?: string; }

interface TaskCallCenter {
  id: number;
  title: string;
  description?: string;
  status: CCStatus;
  priority: Priority;
  type?: string;
  estimatedHours?: number;
  targetAgentCount?: number;
  expectedCallsPerAgent?: number;
  targetConversionRate?: number;
  qualityScoreTarget?: number;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  completedAt?: string;
  delayHours?: number;
  assignedTo?: AssignedTo | number | string | null;
}

interface SprintCallCenter {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  targetAgents?: number;
  expectedCallVolume?: number;
  qualityScoreTarget?: number;
  goals?: string;
  tasks: TaskCallCenter[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<CCStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  TO_DO:       { label: 'À faire',     color: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200',  icon: <Circle size={12} /> },
  IN_PROGRESS: { label: 'En cours',    color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',  icon: <Loader2 size={12} className="animate-spin" /> },
  IN_REVIEW:   { label: 'En révision', color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-200', icon: <Eye size={12} /> },
  DONE:        { label: 'Terminé',     color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200',icon: <CheckCircle2 size={12} /> },
  CANCELLED:   { label: 'Annulé',      color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',    icon: <Lock size={12} /> },
};

const PRIORITY_META: Record<Priority, { label: string; color: string; dot: string }> = {
  LOW:      { label: 'Faible',   color: 'text-slate-400',  dot: 'bg-slate-300' },
  MEDIUM:   { label: 'Moyen',    color: 'text-blue-500',   dot: 'bg-blue-400' },
  HIGH:     { label: 'Élevé',    color: 'text-orange-500', dot: 'bg-orange-400' },
  CRITICAL: { label: 'Critique', color: 'text-red-600',    dot: 'bg-red-500' },
};

// Transitions autorisées pour le membre (seulement sur ses propres tâches)
const MEMBER_TRANSITIONS: Partial<Record<CCStatus, { to: CCStatus; label: string; icon: React.ReactNode; color: string }[]>> = {
  TO_DO: [
    { to: 'IN_PROGRESS', label: 'Démarrer',  icon: <Play size={11} />,       color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    { to: 'IN_REVIEW',   label: 'Soumettre', icon: <ArrowRight size={11} />, color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  ],
  IN_PROGRESS: [
    { to: 'IN_REVIEW', label: 'Soumettre pour révision', icon: <ArrowRight size={11} />, color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  ],
};

function isOverdue(t: TaskCallCenter) {
  if (t.status === 'DONE' || t.status === 'CANCELLED') return false;
  if (!t.scheduledEndDate) return false;
  return new Date(t.scheduledEndDate).getTime() < Date.now();
}
function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; text: string; type: 'success' | 'error'; }

function ToastContainer({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold border animate-fade-in
            ${t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {t.type === 'success' ? <CheckCheck size={14} /> : <AlertTriangle size={14} />}
          {t.text}
          <button onClick={() => remove(t.id)} className="ml-1 opacity-40 hover:opacity-80 transition-opacity"><X size={12} /></button>
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

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ task, onUpdate, isOwner }: {
  task: TaskCallCenter;
  onUpdate: (id: number, s: CCStatus, delayReason?: string) => Promise<{ ok: boolean }>;
  isOwner: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<CCStatus | null>(null);
  const [delayReason, setDelayReason] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const meta = STATUS_META[task.status] ?? STATUS_META.TO_DO;
  const transitions = isOwner ? (MEMBER_TRANSITIONS[task.status] ?? []) : [];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleTransition = async (status: CCStatus) => {
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
            className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 min-h-[100px] resize-none shadow-sm"
            placeholder="Ex: Problème inattendu..."
            value={delayReason}
            onChange={(e) => setDelayReason(e.target.value)}
          />
        </div>
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={() => setPendingStatus(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
            Annuler
          </button>
          <button onClick={submitDelayReason} disabled={!delayReason.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            Confirmer & Terminer
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (transitions.length === 0) {
    return (
      <>
        {modal}
        <span
          title={!isOwner ? 'Tâche assignée à un autre membre' : undefined}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold
            ${meta.bg} ${meta.color} ${meta.border} ${!isOwner ? 'opacity-70' : ''}`}>
          {meta.icon} {meta.label}
          {(!isOwner || task.status === 'IN_REVIEW' || task.status === 'DONE' || task.status === 'CANCELLED') && (
            <Lock size={9} className="ml-0.5 opacity-40" />
          )}
        </span>
      </>
    );
  }

  if (transitions.length === 1) {
    const tr = transitions[0];
    return (
      <>
        {modal}
        <button
          disabled={busy}
          onClick={() => handleTransition(tr.to)}
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

// ─── TaskCard — carte unifiée ─────────────────────────────────────────────────

function TaskCard({ task, onUpdate, isOwner, index }: {
  task: TaskCallCenter;
  onUpdate: (id: number, s: CCStatus, delayReason?: string) => Promise<{ ok: boolean }>;
  isOwner: boolean;
  index?: number;
}) {
  const overdue = isOverdue(task);
  const done    = task.status === 'DONE';
  const prio    = PRIORITY_META[task.priority] ?? PRIORITY_META.MEDIUM;

  const cardClass = done
    ? 'bg-emerald-50/60 border-emerald-200 shadow-sm shadow-emerald-100'
    : overdue
      ? 'bg-red-50/60 border-red-300 shadow-sm shadow-red-100'
      : isOwner
        ? 'bg-white border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 hover:-translate-y-0.5'
        : 'bg-slate-50/80 border-slate-200 shadow-sm opacity-80';

  return (
    <div
      className={`relative rounded-xl border-2 p-4 transition-all duration-200 ${cardClass}`}
      style={{ animationDelay: `${(index ?? 0) * 40}ms` }}>

      {/* Badge propriétaire */}
      <div className="absolute -top-2.5 left-4">
        {isOwner ? (
          <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-full tracking-widest uppercase shadow">
            Ma tâche
          </span>
        ) : typeof task.assignedTo === 'object' && task.assignedTo?.fullname ? (
          <span className="px-2 py-0.5 bg-slate-400 text-white text-[9px] font-black rounded-full tracking-widest uppercase shadow">
            <User size={8} className="inline mr-0.5" />
            {task.assignedTo.fullname.split(' ')[0]}
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-slate-300 text-white text-[9px] font-black rounded-full tracking-widest uppercase shadow">
            Non assigné
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5 pt-1">
        {/* Titre + statut */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {task.type && (
              <span className="inline-block mb-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-semibold">
                {task.type}
              </span>
            )}
            <h4 className={`font-bold text-sm leading-snug
              ${done    ? 'text-emerald-800 line-through opacity-70'
              : overdue ? 'text-red-800'
              : isOwner ? 'text-slate-800'
                        : 'text-slate-500'}`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{task.description}</p>
            )}
          </div>
          <StatusBadge task={task} onUpdate={onUpdate} isOwner={isOwner} />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <span className={`flex items-center gap-1 font-semibold ${prio.color}`}>
            <span className={`w-2 h-2 rounded-full ${prio.dot}`} />{prio.label}
          </span>
          {task.estimatedHours != null && (
            <span className="flex items-center gap-1 text-slate-400"><Clock size={9} /> {task.estimatedHours}h estimées</span>
          )}
          {task.targetAgentCount != null && (
            <span className="flex items-center gap-1 text-slate-400"><User size={9} /> {task.targetAgentCount} agents</span>
          )}
          {task.expectedCallsPerAgent != null && (
            <span className="flex items-center gap-1 text-slate-400"><Phone size={9} /> {task.expectedCallsPerAgent} appels/agent</span>
          )}
          {task.targetConversionRate != null && (
            <span className="flex items-center gap-1 text-slate-400"><Target size={9} /> {task.targetConversionRate}% conversion</span>
          )}
          {task.qualityScoreTarget != null && (
            <span className="flex items-center gap-1 text-slate-400"><Star size={9} /> Score qualité {task.qualityScoreTarget}</span>
          )}
        </div>

        {/* Dates */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          {task.scheduledStartDate && (
            <span className="flex items-center gap-1 text-slate-400"><Calendar size={9} /> Début {fmt(task.scheduledStartDate)}</span>
          )}
          {task.scheduledEndDate && (
            <span className={`flex items-center gap-1 font-semibold ${overdue ? 'text-red-600' : 'text-slate-400'}`}>
              <Calendar size={9} />{overdue ? 'Retard — ' : ''}Fin {fmt(task.scheduledEndDate)}
            </span>
          )}
          {task.delayHours != null && task.delayHours > 0 && (
            <span className="flex items-center gap-1 text-red-500 font-bold">
              <AlertTriangle size={9} /> {task.delayHours}h de retard
            </span>
          )}
          {task.status === 'DONE' && task.completedAt && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 size={9} /> Terminé {fmt(task.completedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SprintBlock ──────────────────────────────────────────────────────────────

function SprintBlock({ sprint, myUserId, onUpdateTask, filteredTaskIds }: {
  sprint: SprintCallCenter;
  myUserId: number | null;
  onUpdateTask: (id: number, s: CCStatus, delayReason?: string) => Promise<{ ok: boolean }>;
  filteredTaskIds: Set<number> | null;
}) {
  const [open, setOpen] = useState(true);

  const visibleTasks = filteredTaskIds
    ? sprint.tasks.filter((t) => filteredTaskIds.has(t.id))
    : sprint.tasks;

  if (filteredTaskIds && visibleTasks.length === 0) return null;

  const myTasks    = visibleTasks.filter((t) => isTaskOwnedByUser(t.assignedTo, myUserId));
  const otherTasks = visibleTasks.filter((t) => !isTaskOwnedByUser(t.assignedTo, myUserId));
  const orderedTasks = [...myTasks, ...otherTasks];

  const done       = sprint.tasks.filter((t) => t.status === 'DONE').length;
  const total      = sprint.tasks.length;
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0;
  const myCount    = sprint.tasks.filter((t) => isTaskOwnedByUser(t.assignedTo, myUserId)).length;
  const sprintDone = sprint.status === 'completed' || sprint.status === 'done';
  const sprintOver = !sprintDone && new Date(sprint.endDate).getTime() < Date.now();

  return (
    <div className={`rounded-2xl border-2 transition-all duration-200
      ${sprintDone ? 'border-emerald-200 bg-emerald-50/30'
      : sprintOver ? 'border-orange-200 bg-orange-50/20'
                   : 'border-slate-200 bg-white'}`}>

      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50/50 transition-colors">
        <span className="text-slate-400 shrink-0">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-bold text-sm text-slate-800 truncate">{sprint.name}</span>
            {sprintDone && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-black uppercase tracking-wider">Terminé</span>
            )}
            {sprintOver && !sprintDone && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-[9px] font-black uppercase">Expiré</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400 flex-wrap">
            <span>{fmt(sprint.startDate)} → {fmt(sprint.endDate)}</span>
            {sprint.targetAgents != null && <span><User size={8} className="inline mr-0.5" />{sprint.targetAgents} agents cibles</span>}
            {sprint.expectedCallVolume != null && <span><Phone size={8} className="inline mr-0.5" />{sprint.expectedCallVolume} appels prévus</span>}
            <span className="font-semibold text-emerald-600">{myCount} mes tâches</span>
            <span>· {total} au total · {done} terminées</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${sprintDone ? 'bg-emerald-400' : 'bg-emerald-500'}`}
              style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{pct}%</span>
        </div>
      </button>

      {/* Goals banner */}
      {open && sprint.goals && (
        <div className="mx-5 mb-3 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-700 flex items-start gap-2">
          <Activity size={11} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2">{sprint.goals}</span>
        </div>
      )}

      {open && (
        <div className="px-5 pb-5">
          {orderedTasks.length === 0 ? (
            <p className="text-center text-xs text-slate-300 py-6">
              {filteredTaskIds ? 'Aucune tâche ne correspond aux filtres dans ce sprint' : 'Aucune tâche dans ce sprint'}
            </p>
          ) : (
            <>
              {myTasks.length > 0 && (
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                  <span className="w-4 h-0.5 bg-emerald-300 rounded" />
                  Mes tâches ({myTasks.length})
                  <span className="w-4 h-0.5 bg-emerald-300 rounded" />
                </p>
              )}
              <div className="space-y-3">
                {orderedTasks.map((t, i) => {
                  const isOwner = isTaskOwnedByUser(t.assignedTo, myUserId);
                  const isFirstOther = !isOwner && (i === 0 || isTaskOwnedByUser(orderedTasks[i - 1]?.assignedTo, myUserId));
                  return (
                    <div key={t.id}>
                      {isFirstOther && otherTasks.length > 0 && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5 mt-1">
                          <span className="w-4 h-px bg-slate-200 rounded" />
                          Autres tâches ({otherTasks.length})
                          <span className="w-4 h-px bg-slate-200 rounded" />
                        </p>
                      )}
                      <TaskCard task={t} onUpdate={onUpdateTask} isOwner={isOwner} index={i} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

interface Filters {
  search: string;
  statuses: CCStatus[];
  priorities: Priority[];
  sprintId: number | null;
  myOnly: boolean;
}

const EMPTY_FILTERS: Filters = { search: '', statuses: [], priorities: [], sprintId: null, myOnly: false };

function FilterBar({ filters, onChange, sprints, totalCount, filteredCount }: {
  filters: Filters;
  onChange: (f: Filters) => void;
  sprints: SprintCallCenter[];
  totalCount: number;
  filteredCount: number;
}) {
  const [panelOpen, setPanelOpen] = useState(false);

  const activeCount =
    (filters.statuses.length > 0 ? 1 : 0) +
    (filters.priorities.length > 0 ? 1 : 0) +
    (filters.sprintId != null ? 1 : 0) +
    (filters.myOnly ? 1 : 0);

  const isFiltering = activeCount > 0 || filters.search.trim().length > 0;

  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Rechercher une tâche…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-300 text-slate-700"
        />
        {filters.search && (
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
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>
          <SlidersHorizontal size={12} />
          Filtres
          {activeCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded-full text-[9px] font-black leading-none">
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

      {panelOpen && (
        <div className="border-t border-slate-100 px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50">
          {/* Statut */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Statut</p>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(STATUS_META) as CCStatus[]).map((s) => {
                const m = STATUS_META[s];
                const active = filters.statuses.includes(s);
                return (
                  <button key={s}
                    onClick={() => onChange({ ...filters, statuses: toggle(filters.statuses, s) })}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition-all
                      ${active ? `${m.bg} ${m.color} ${m.border} ring-1 ring-offset-1 ring-emerald-300` : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
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
                      ${active ? 'bg-slate-100 text-slate-700 border-slate-300 ring-1 ring-offset-1 ring-emerald-300' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                    <span className={`w-2 h-2 rounded-full ${m.dot}`} /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sprint + toggle */}
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sprint</p>
              <select
                value={filters.sprintId ?? ''}
                onChange={(e) => onChange({ ...filters, sprintId: e.target.value ? Number(e.target.value) : null })}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 outline-none focus:border-emerald-300">
                <option value="">Tous les sprints</option>
                {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer group">
              <div onClick={() => onChange({ ...filters, myOnly: !filters.myOnly })}
                className={`w-8 h-4 rounded-full transition-all duration-200 relative cursor-pointer
                  ${filters.myOnly ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200
                  ${filters.myOnly ? 'left-4' : 'left-0.5'}`} />
              </div>
              <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors font-medium select-none">
                Mes tâches uniquement
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Résumé filtres actifs */}
      {isFiltering && (
        <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-2 flex-wrap bg-white">
          <Filter size={10} className="text-emerald-400 shrink-0" />
          <span className="text-[10px] text-slate-400">
            {filteredCount} / {totalCount} tâche{totalCount > 1 ? 's' : ''}
          </span>
          {filters.statuses.map((s) => (
            <span key={s}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_META[s].bg} ${STATUS_META[s].color} ${STATUS_META[s].border}`}>
              {STATUS_META[s].label}
              <button onClick={() => onChange({ ...filters, statuses: filters.statuses.filter((x) => x !== s) })}><X size={8} /></button>
            </span>
          ))}
          {filters.priorities.map((p) => (
            <span key={p}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-600 border-slate-200">
              {PRIORITY_META[p].label}
              <button onClick={() => onChange({ ...filters, priorities: filters.priorities.filter((x) => x !== p) })}><X size={8} /></button>
            </span>
          ))}
          {filters.myOnly && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 text-emerald-600 border-emerald-200">
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

export default function MemberCallCenterTasksPage() {
  const params    = useParams();
  const projectId = Number(params?.projectId);

  const [projectName, setProjectName] = useState('');
  const [pmName, setPmName]           = useState('');
  const [sprints, setSprints]         = useState<SprintCallCenter[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [filters, setFilters]         = useState<Filters>(EMPTY_FILTERS);

  const myUserId                      = getCurrentUserId();
  const { toasts, push, remove }      = useToast();

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true); setError(null);
    try {
      const token = getToken();
      const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Charger les détails du projet pour récupérer l'id interne du domaine CallCenter
      const pRes = await fetch(`${API_BASE}/projects/${projectId}/details`, { headers: h });
      if (!pRes.ok) throw new Error('Projet introuvable');
      const pData = await pRes.json();
      setProjectName(pData.project?.name ?? '');
      setPmName(pData.project?.projectManager?.fullname ?? '');

      // 2. L'id interne du ProjectCallCenterEntity (≠ projectId du projet parent)
      const domainId = pData.domainDetails?.id;
      if (!domainId) throw new Error('Détails Call Center introuvables');

      // 3. Charger les sprints avec l'id interne du domaine
      const sRes = await fetch(`${API_BASE}/projects/${domainId}/callcenter-sprints`, { headers: h });
      if (!sRes.ok) throw new Error('Impossible de charger les sprints');
      setSprints(await sRes.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Update task status ─────────────────────────────────────────────────────

  const handleUpdateTask = useCallback(async (taskId: number, status: CCStatus, delayReason?: string): Promise<{ ok: boolean }> => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/projects/callcenter-tasks/${taskId}/status`, {
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

  // ── Stats ──────────────────────────────────────────────────────────────────

  const allTasks = useMemo(() => sprints.flatMap((s) => s.tasks), [sprints]);
  const myTasks  = useMemo(() => allTasks.filter((t) => isTaskOwnedByUser(t.assignedTo, myUserId)), [allTasks, myUserId]);

  const myDone    = myTasks.filter((t) => t.status === 'DONE').length;
  const myReview  = myTasks.filter((t) => t.status === 'IN_REVIEW').length;
  const myOverdue = myTasks.filter((t) => isOverdue(t)).length;

  // ── Filtres ────────────────────────────────────────────────────────────────

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

  const filteredCount  = filteredTaskIds ? filteredTaskIds.size : allTasks.length;
  const visibleSprints = useMemo(() =>
    filters.sprintId != null ? sprints.filter((s) => s.id === filters.sprintId) : sprints,
  [sprints, filters.sprintId]);

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <p className="text-sm text-slate-400 font-medium">Chargement des sprints…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col h-96 items-center justify-center gap-3">
      <AlertTriangle className="text-red-400" size={36} />
      <p className="text-slate-600 font-semibold">{error}</p>
      <button onClick={fetchData} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
        Réessayer
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-emerald-50/20">
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
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600 shrink-0"><Headphones size={15} /></div>
            <div className="min-w-0">
              <p className="font-black text-sm text-slate-800 leading-none truncate">{projectName || `Projet #${projectId}`}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{pmName && `PM : ${pmName} · `}Centre d'appels</p>
            </div>
          </div>
          <button onClick={fetchData}
            className="ml-auto p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-emerald-500 transition-all shrink-0"
            title="Actualiser">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Mes tâches',  value: myTasks.length, color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
            { label: 'Terminées',   value: myDone,          color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
            { label: 'En révision', value: myReview,        color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-100' },
            { label: 'En retard',   value: myOverdue,       color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-100' },
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

        {/* Filtres */}
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
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border-2 border-emerald-300" /> Ma tâche — modifiable</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border-2 border-slate-200" /> Autre membre — lecture seule <Lock size={8} /></span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border-2 border-emerald-200" /> Terminée</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border-2 border-red-200" /> En retard</span>
        </div>

        {/* Sprints */}
        {visibleSprints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Headphones size={36} className="text-slate-200 mb-3" />
            <p className="text-slate-400 font-semibold">Aucun sprint disponible</p>
            <p className="text-slate-300 text-xs mt-1">Aucun sprint n'a encore été créé pour ce projet.</p>
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
            {filteredTaskIds && filteredTaskIds.size === 0 && (
              <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border-2 border-dashed border-slate-200 animate-fade-in">
                <Search size={28} className="text-slate-200 mb-3" />
                <p className="text-slate-400 font-semibold text-sm">Aucune tâche ne correspond aux filtres</p>
                <button onClick={() => setFilters(EMPTY_FILTERS)}
                  className="mt-3 px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors">
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}