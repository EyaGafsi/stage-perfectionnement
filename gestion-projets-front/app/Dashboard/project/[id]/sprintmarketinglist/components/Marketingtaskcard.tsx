'use client';
// ─── MarketingTaskCard.tsx ────────────────────────────────────────────────────
// Design: Light + Turquoise — responsive mobile/desktop

import React from 'react';
import { Edit2, Trash2, Cpu, DollarSign, Calendar, User, Tag, Radio } from 'lucide-react';
import type {
  TaskMarketing,
  ProjectMember,
  SprintMarketing,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';
import { MarketingTaskForm } from './Marketingtaskform';
import {
  formatHours,
  safeNum,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Marketingestimationservice';

// ─── Props ────────────────────────────────────────────────────────────────────
interface MarketingTaskCardProps {
  task: TaskMarketing;
  sprintId: number;
  sprint?: SprintMarketing;
  members: ProjectMember[];
  isEditing: boolean;
  canEditSprints: boolean;
  editingData: TaskMarketing | null;
  isEstimating: boolean;
  loading: boolean;
  onStartEdit: (task: TaskMarketing, sprintId: number) => void;
  onEditChange: (field: keyof TaskMarketing, value: unknown) => void;
  onEstimate: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: (taskId: number, sprintId: number) => void;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  TO_DO:       { label: 'À faire',     cls: 'bg-slate-50  text-slate-600  border-slate-200',  dot: 'bg-slate-400'  },
  IN_PROGRESS: { label: 'En cours',    cls: 'bg-cyan-50   text-cyan-700   border-cyan-200',   dot: 'bg-cyan-500'   },
  IN_REVIEW:   { label: 'En révision', cls: 'bg-amber-50  text-amber-700  border-amber-200',  dot: 'bg-amber-400'  },
  DONE:        { label: 'Terminé',     cls: 'bg-teal-50   text-teal-700   border-teal-200',   dot: 'bg-teal-500'   },
  BLOCKED:     { label: 'Bloqué',      cls: 'bg-rose-50   text-rose-600   border-rose-200',   dot: 'bg-rose-500'   },
};

const PRIORITY_CFG: Record<string, { label: string; cls: string }> = {
  LOW:      { label: 'Basse',    cls: 'text-teal-600   bg-teal-50   border-teal-200'   },
  MEDIUM:   { label: 'Moyenne',  cls: 'text-cyan-700   bg-cyan-50   border-cyan-200'   },
  HIGH:     { label: 'Haute',    cls: 'text-orange-600 bg-orange-50 border-orange-200' },
  CRITICAL: { label: 'Critique', cls: 'text-rose-600   bg-rose-50   border-rose-200'   },
};

const TYPE_EMOJI: Record<string, string> = {
  ANALYTICS:        '📊', CAMPAIGN: '📣', CONTENT_CREATION: '✍️',
  COPYWRITING:      '🖊️', DESIGN: '🎨',  EMAIL: '📧',
  PPC:              '💰', SEO: '🔍',     SOCIAL_MEDIA: '📱',
  OTHER:            '📌',
};

const fmtDate = (d?: string | null): string => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return ''; }
};

// ─── Small reusable meta row item ─────────────────────────────────────────────
const MetaItem: React.FC<{ icon: React.ReactNode; label: string; value: string; valueClass?: string }> = ({
  icon, label, value, valueClass = 'text-slate-700',
}) => (
  <div className="flex items-center gap-1.5 min-w-0">
    <span className="text-cyan-400 shrink-0">{icon}</span>
    <span className="text-xs text-slate-400 shrink-0">{label} :</span>
    <span className={`text-xs font-semibold truncate ${valueClass}`}>{value}</span>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
export const MarketingTaskCard: React.FC<MarketingTaskCardProps> = ({
  task,
  sprintId,
  sprint,
  members,
  isEditing,
  canEditSprints,
  editingData,
  isEstimating,
  loading,
  onStartEdit,
  onEditChange,
  onEstimate,
  onSave,
  onCancelEdit,
  onDelete,
}) => {
  const aiHours  = safeNum(task.aiEstimatedHours ?? task.estimatedHours);
  const status   = STATUS_CFG[task.status]      ?? STATUS_CFG.TO_DO;
  const priority = PRIORITY_CFG[task.priority]  ?? PRIORITY_CFG.MEDIUM;

  let displayDelay = task.delayHours;
  if (task.status !== 'DONE' && task.status !== 'IN_REVIEW' && task.scheduledEndDate) {
    const end = new Date(task.scheduledEndDate);
    const now = new Date();
    if (!isNaN(end.getTime()) && now > end) {
      displayDelay = (now.getTime() - end.getTime()) / (1000 * 60 * 60);
    }
  }

  const getMemberName = (val: TaskMarketing['assignedTo']): string => {
    if (!val) return '';
    if (typeof val === 'object' && 'id' in val) {
      const obj = val as { id: number; fullname?: string };
      const found = members.find((m) => m.id === obj.id);
      if (found) {
        const name = found.fullname ?? found.name ?? `${found.firstName ?? ''} ${found.lastName ?? ''}`.trim();
        return found.level ? `${name} (${found.level})` : name;
      }
      return obj.fullname ?? `Membre #${obj.id}`;
    }
    const found = members.find((m) => m.id === Number(val));
    if (!found) return '';
    const name = found.fullname ?? found.name ?? `${found.firstName ?? ''} ${found.lastName ?? ''}`.trim();
    return found.level ? `${name} (${found.level})` : name;
  };

  const assignedName = getMemberName(task.assignedTo);

  return (
    <div
      className={`
        group rounded-xl border overflow-hidden transition-all duration-200
        ${isEditing
          ? 'border-cyan-300 shadow-[0_0_0_3px_rgba(6,182,212,0.10)] shadow-md bg-white'
          : 'border-slate-200/80 bg-white hover:border-cyan-200 hover:shadow-sm'
        }
      `}
    >
      {/* ── Card body ─────────────────────────────────────────────────────── */}
      <div className="flex">

        {/* Left accent bar */}
        <div
          className={`
            w-1 shrink-0 transition-colors duration-200
            ${isEditing
              ? 'bg-gradient-to-b from-cyan-400 to-teal-400'
              : 'bg-cyan-100 group-hover:bg-cyan-300'
            }
          `}
        />

        <div className="flex-1 px-4 sm:px-5 py-4 min-w-0">

          {/* ── Top row: emoji + title + actions ─────────────────────── */}
          <div className="flex items-start justify-between gap-3 mb-3">

            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Type emoji bubble */}
              <span
                className="
                  w-8 h-8 shrink-0 rounded-lg
                  bg-gradient-to-br from-cyan-50 to-teal-100
                  border border-cyan-100
                  flex items-center justify-center text-sm
                  shadow-[0_1px_3px_rgba(6,182,212,0.12)]
                "
              >
                {TYPE_EMOJI[task.type] ?? '📌'}
              </span>

              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-sm sm:text-base text-slate-800 leading-snug truncate">
                  {task.title}
                </h5>
                {task.description && (
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 leading-relaxed">
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            {!isEditing && canEditSprints && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onStartEdit(task, sprintId)}
                  title="Éditer"
                  className="
                    p-1.5 rounded-lg border
                    bg-cyan-50 text-cyan-600 border-cyan-200
                    hover:bg-cyan-500 hover:text-white hover:border-cyan-500
                    transition-all duration-150
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
                  "
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => onDelete(task.id!, sprintId)}
                  title="Supprimer"
                  className="
                    p-1.5 rounded-lg border
                    bg-rose-50 text-rose-400 border-rose-200
                    hover:bg-rose-500 hover:text-white hover:border-rose-500
                    transition-all duration-150
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300
                  "
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ── Badges row ────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-1.5 mb-3">

            {/* Status */}
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
              {status.label}
            </span>

            {/* Priority */}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${priority.cls}`}>
              {priority.label}
            </span>

            {/* Type */}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-slate-50 text-slate-500 border-slate-200">
              {task.type.replace(/_/g, ' ')}
            </span>

            {/* AI hours */}
            {aiHours > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 border border-violet-200">
                <Cpu size={10} />
                {formatHours(aiHours)}
              </span>
            )}

            {/* Budget */}
            {safeNum(task.budget) > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                <DollarSign size={10} />
                {safeNum(task.budget).toLocaleString()} TND
              </span>
            )}

            {/* Delay */}
            {displayDelay !== undefined && displayDelay !== 0 && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                displayDelay > 0
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-teal-50 text-teal-700 border-teal-200'
              }`}>
                {displayDelay > 0
                  ? `⚠ +${displayDelay.toFixed(1)}h retard`
                  : `✓ ${Math.abs(displayDelay).toFixed(1)}h avance`}
              </span>
            )}
          </div>

          {/* ── Meta grid ─────────────────────────────────────────────── */}
          {(assignedName || task.channel || task.scheduledStartDate || task.scheduledEndDate || safeNum(task.expectedClicks) > 0 || task.completedAt) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 pt-3 border-t border-cyan-50/80">

              {assignedName && (
                <div className="col-span-2 sm:col-span-1">
                  <MetaItem icon={<User size={11} />} label="Assigné" value={assignedName} />
                </div>
              )}

              {task.channel && (
                <MetaItem icon={<Radio size={11} />} label="Canal" value={task.channel} />
              )}

              {task.scheduledStartDate && (
                <MetaItem icon={<Calendar size={11} />} label="Début" value={fmtDate(task.scheduledStartDate)} />
              )}

              {task.scheduledEndDate && (
                <MetaItem icon={<Calendar size={11} />} label="Fin" value={fmtDate(task.scheduledEndDate)} />
              )}

              {safeNum(task.expectedClicks) > 0 && (
                <MetaItem icon={<Tag size={11} />} label="Clics" value={safeNum(task.expectedClicks).toLocaleString()} />
              )}

              {task.completedAt && (
                <MetaItem
                  icon={<Calendar size={11} />}
                  label="Complété"
                  value={fmtDate(task.completedAt)}
                  valueClass="text-teal-700"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Inline edit form ────────────────────────────────────────────────── */}
      {isEditing && editingData && (
        <div className="border-t border-cyan-100 bg-gradient-to-br from-cyan-50/40 to-teal-50/30 px-4 sm:px-5 py-4">
          <MarketingTaskForm
            task={editingData}
            members={members}
            mode="edit"
            sprint={sprint}
            isEstimating={isEstimating}
            loading={loading}
            onChange={onEditChange}
            onEstimate={onEstimate}
            onSave={onSave}
            onCancel={onCancelEdit}
          />
        </div>
      )}
    </div>
  );
};