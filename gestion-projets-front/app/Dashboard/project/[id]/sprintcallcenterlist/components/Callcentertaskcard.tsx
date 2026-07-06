'use client';
// ─── CallCenterTaskCard.tsx ───────────────────────────────────────────────────

import React from 'react';
import { Edit2, Trash2, Cpu, Phone } from 'lucide-react';
import type { TaskCallCenter, ProjectMember } from '../services/Types';
import { CallCenterTaskForm } from './Callcentertaskform';
import { formatHours, safeNum } from '../services/Callcenterestimationservice';

interface CallCenterTaskCardProps {
  task: TaskCallCenter;
  sprintId: number;
  members: ProjectMember[];
  isEditing: boolean;
  canEditSprints: boolean;
  editingData: TaskCallCenter | null;
  isEstimating: boolean;
  loading: boolean;
  onStartEdit: (task: TaskCallCenter, sprintId: number) => void;
  onEditChange: (field: keyof TaskCallCenter, value: unknown) => void;
  onEstimate: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: (taskId: number, sprintId: number) => void;
}

const STATUS_STYLE: Record<string, string> = {
  TO_DO:       'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW:   'bg-amber-100 text-amber-700',
  DONE:        'bg-emerald-100 text-emerald-700',
  BLOCKED:     'bg-red-100 text-red-700',
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-emerald-600', MEDIUM: 'text-amber-600',
  HIGH: 'text-orange-600', CRITICAL: 'text-red-600',
};

const TYPE_EMOJI: Record<string, string> = {
  OUTBOUND: '📞', INBOUND: '📲', FOLLOW_UP: '🔄', SURVEY: '📋',
  APPOINTMENT: '📅', RETENTION: '🤝', UPSELL: '📈', SUPPORT: '🛠️',
  TRAINING: '🎓', QA: '✅', OTHER: '📌',
};

const fmtDate = (d?: string | null): string => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return ''; }
};

export const CallCenterTaskCard: React.FC<CallCenterTaskCardProps> = ({
  task, sprintId, members, isEditing, canEditSprints, editingData, isEstimating, loading,
  onStartEdit, onEditChange, onEstimate, onSave, onCancelEdit, onDelete,
}) => {
  const aiHours = safeNum(task.aiEstimatedHours ?? task.estimatedHours);

  let displayDelay = task.delayHours;
  if (task.status !== 'DONE' && task.status !== 'IN_REVIEW' && task.scheduledEndDate) {
    const end = new Date(task.scheduledEndDate);
    const now = new Date();
    if (!isNaN(end.getTime()) && now > end) {
      displayDelay = (now.getTime() - end.getTime()) / (1000 * 60 * 60);
    }
  }

  const getMemberName = (val: unknown): string => {
    if (!val) return '';
    const id = typeof val === 'object' && val !== null && 'id' in val
      ? Number((val as any).id) : Number(val);
    const m = members.find((mb) => mb.id === id);
    if (!m) return '';
    const name = m.name ?? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
    return m.level ? `${name} (${m.level})` : name;
  };

  // AI data fields to display
  const aiFields = [
    { label: 'Agents',       value: safeNum(task.targetAgentCount),      fmt: (v: number) => String(v)    },
    { label: 'Appels/agent', value: safeNum(task.expectedCallsPerAgent), fmt: (v: number) => String(v)    },
    { label: 'Conv. cible',  value: safeNum(task.targetConversionRate),  fmt: (v: number) => `${v}%`      },
    { label: 'Score qual.',  value: safeNum(task.qualityScoreTarget),    fmt: (v: number) => `${v}/100`   },
  ].filter(({ value }) => value > 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">

          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-base">{TYPE_EMOJI[task.type] ?? '📌'}</span>
              <h5 className="font-semibold text-slate-800 truncate">{task.title}</h5>
            </div>

            {task.description && (
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.description}</p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <span className={`text-xs font-semibold px-2 py-1 rounded ${STATUS_STYLE[task.status] ?? 'bg-slate-100 text-slate-700'}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">
                {task.type}
              </span>
              <span className={`text-xs font-bold ${PRIORITY_COLOR[task.priority] ?? 'text-slate-600'}`}>
                ▲ {task.priority}
              </span>
              {aiHours > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  <Cpu size={10} /> {formatHours(aiHours)}
                </span>
              )}
              {safeNum(task.targetAgentCount) > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-indigo-100 text-indigo-700">
                  <Phone size={10} /> {safeNum(task.targetAgentCount)} agent{safeNum(task.targetAgentCount) > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Delay badge */}
            {displayDelay !== undefined && displayDelay !== 0 && (
              <div className={`text-xs font-semibold px-2 py-1 rounded mb-3 inline-block ${
                displayDelay > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {displayDelay > 0
                  ? `⚠️ Retard: +${displayDelay.toFixed(1)}h`
                  : `✨ Avance: ${Math.abs(displayDelay).toFixed(1)}h`}
              </div>
            )}

            {/* ── AI data header ─────────────────────────────────────── */}
            {aiFields.length > 0 && (
              <div className="mt-3 mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Cpu size={10} /> Données IA
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {aiFields.map(({ label, value, fmt }) => (
                    <div key={label} className="text-center p-2 bg-white rounded-lg border border-blue-100">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{label}</p>
                      <p className="text-sm font-extrabold text-blue-700 mt-0.5">{fmt(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-100">
              {safeNum(task.expectedCallsPerAgent) > 0 && (
                <div>
                  <span className="text-slate-400">Appels/agent: </span>
                  <span className="font-semibold text-slate-700">{safeNum(task.expectedCallsPerAgent)}</span>
                </div>
              )}
              {safeNum(task.targetConversionRate) > 0 && (
                <div>
                  <span className="text-slate-400">Conv. cible: </span>
                  <span className="font-semibold text-slate-700">{safeNum(task.targetConversionRate)}%</span>
                </div>
              )}
              {task.scheduledEndDate && (
                <div>
                  <span className="text-slate-400">Échéance: </span>
                  <span className="font-semibold text-slate-700">{fmtDate(task.scheduledEndDate)}</span>
                </div>
              )}
              {task.assignedTo && getMemberName(task.assignedTo) && (
                <div>
                  <span className="text-slate-400">Assigné: </span>
                  <span className="font-semibold text-slate-700">{getMemberName(task.assignedTo)}</span>
                </div>
              )}
              {task.completedAt && (
                <div>
                  <span className="text-slate-400">Complété: </span>
                  <span className="font-semibold text-emerald-700">{fmtDate(task.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isEditing && canEditSprints && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onStartEdit(task, sprintId)}
                className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                title="Éditer"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={() => onDelete(task.id!, sprintId)}
                className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Inline edit */}
        {isEditing && editingData && (
          <CallCenterTaskForm
            task={editingData}
            members={members}
            mode="edit"
            isEstimating={isEstimating}
            loading={loading}
            onChange={onEditChange}
            onEstimate={onEstimate}
            onSave={onSave}
            onCancel={onCancelEdit}
          />
        )}
      </div>
    </div>
  );
};