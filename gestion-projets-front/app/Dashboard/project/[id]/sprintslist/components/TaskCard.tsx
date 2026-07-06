'use client';
// ─── TaskCard.tsx ─────────────────────────────────────────────────────────────
// Read-only task row — turquoise/light theme, mobile-first responsive.

import React from 'react';
import { Edit2, Trash2, Calendar, User, Zap, AlertTriangle } from 'lucide-react';
import type { Task, ProjectMember, Sprint } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { TaskForm } from '@/Dashboard/project/[id]/sprintslist/components/TaskForm';
import { safeHours } from '@/Dashboard/project/[id]/sprintslist/services/estimationService';
import {
  AiEstimateBadge,
  getStatusBadgeColor,
  getPriorityColor,
  getDelayStatus,
} from '@/Dashboard/project/[id]/sprintslist/components/ui';

interface TaskCardProps {
  task: Task;
  members: ProjectMember[];
  sprintId: number;
  sprint: Pick<Sprint, 'startDate' | 'endDate' | 'name'>;
  isEditing: boolean;
  canEditSprints: boolean;
  editingData: Task | null;
  loading: boolean;
  estimating: boolean;
  onStartEdit: (task: Task, sprintId: number) => void;
  onEditChange: (field: keyof Task, value: unknown) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: (taskId: number, sprintId: number) => void;
  onEstimate?: () => void;
}

/* ── helpers ────────────────────────────────────────────────────────────────── */

function getMemberName(assignedTo: any, members: ProjectMember[]): string {
  if (!assignedTo) return '—';
  if (typeof assignedTo === 'object' && (assignedTo.firstName || assignedTo.name || assignedTo.lastName)) {
    const n = assignedTo.name ?? `${assignedTo.firstName ?? ''} ${assignedTo.lastName ?? ''}`.trim();
    return (n || '—').trim();
  }
  const rawId = typeof assignedTo === 'object' ? assignedTo.id : assignedTo;
  if (rawId === undefined || rawId === null) return '—';
  const member = members.find(m => String(m.id) === String(rawId));
  if (!member) return '—';
  const name = member.name ?? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
  return (name || '—').trim();
}

/* ── component ──────────────────────────────────────────────────────────────── */

export const TaskCard: React.FC<TaskCardProps> = ({
  task, members, sprintId, sprint,
  isEditing, canEditSprints, editingData, loading, estimating,
  onStartEdit, onEditChange, onSave, onCancelEdit, onDelete, onEstimate
}) => {
  let displayDelay = task.delayHours;
  if (task.status !== 'DONE' && task.status !== 'IN_REVIEW' && task.scheduledEndDate) {
    const end = new Date(task.scheduledEndDate);
    const now = new Date();
    if (!isNaN(end.getTime()) && now > end) {
      displayDelay = (now.getTime() - end.getTime()) / (1000 * 60 * 60);
    }
  }

  return (
  <div
    className="
      bg-white
      border border-teal-100
      rounded-xl overflow-hidden
      shadow-[0_1px_6px_rgba(20,184,166,0.08)]
      hover:shadow-[0_3px_16px_rgba(20,184,166,0.15)]
      hover:border-teal-200
      transition-all duration-200
    "
  >
    <div className="p-4 sm:p-5">
      <div className="flex items-start gap-3">

        {/* ── Left accent bar ──────────────────────────────────────────── */}
        <div className="hidden sm:block w-1 self-stretch rounded-full bg-gradient-to-b from-teal-400 to-cyan-300 flex-shrink-0" />

        {/* ── Task info ────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Title + action buttons */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h5 className="font-semibold text-slate-800 text-sm sm:text-base leading-snug">
              {task.title}
            </h5>
            {canEditSprints && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onStartEdit(task, sprintId)}
                  title="Éditer"
                  className="
                    p-1.5 rounded-lg
                    bg-teal-50 text-teal-600
                    hover:bg-teal-100 hover:text-teal-700
                    active:scale-95
                    transition-all duration-150
                  "
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => onDelete(task.id!, sprintId)}
                  title="Supprimer"
                  className="
                    p-1.5 rounded-lg
                    bg-red-50 text-red-400
                    hover:bg-red-100 hover:text-red-600
                    active:scale-95
                    transition-all duration-150
                  "
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs sm:text-sm text-slate-500 mb-3 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* ── Badge row ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-1.5 items-center mb-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBadgeColor(task.status)}`}>
              {task.status}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
              {task.type}
            </span>
            <span className={`text-xs font-bold ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-semibold ring-1 ring-teal-100">
              {task.storyPoints} pts
            </span>
            {safeHours(task.aiEstimatedHours ?? task.estimatedHours) > 0 && (
              <AiEstimateBadge hours={safeHours(task.aiEstimatedHours ?? task.estimatedHours)} />
            )}
          </div>

          {/* ── Delay badge ────────────────────────────────────────────── */}
          {displayDelay !== undefined && (
            <div
              className={`
                inline-flex items-center gap-1
                text-xs font-semibold px-2.5 py-1 rounded-full mb-3
                ${displayDelay > 0
                  ? 'bg-red-50 text-red-600 ring-1 ring-red-100'
                  : displayDelay < 0
                  ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                  : 'bg-teal-50 text-teal-600 ring-1 ring-teal-100'}
              `}
            >
              <AlertTriangle size={11} />
              {getDelayStatus(displayDelay)}
            </div>
          )}

          {/* ── Meta grid ──────────────────────────────────────────────── */}
          <div className="
            grid grid-cols-2 sm:grid-cols-4
            gap-x-3 gap-y-1.5
            pt-2.5 border-t border-teal-50
            text-xs
          ">
            {task.scheduledStartDate && (
              <div className="flex items-center gap-1 text-slate-500">
                <Calendar size={11} className="text-teal-400 flex-shrink-0" />
                <span>Début:</span>
                <span className="font-semibold text-slate-700 truncate">
                  {new Date(task.scheduledStartDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            {task.scheduledEndDate && (
              <div className="flex items-center gap-1 text-slate-500">
                <Calendar size={11} className="text-cyan-400 flex-shrink-0" />
                <span>Fin:</span>
                <span className="font-semibold text-slate-700 truncate">
                  {new Date(task.scheduledEndDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            {!!task.complexityScore && (
              <div className="flex items-center gap-1 text-slate-500">
                <Zap size={11} className="text-amber-400 flex-shrink-0" />
                <span>Complexité:</span>
                <span className="font-semibold text-slate-700">{task.complexityScore}/5</span>
              </div>
            )}
            {!!task.riskLevel && (
              <div className="flex items-center gap-1 text-slate-500">
                <AlertTriangle size={11} className="text-orange-400 flex-shrink-0" />
                <span>Risque:</span>
                <span className="font-semibold text-slate-700">{task.riskLevel}/5</span>
              </div>
            )}
            {task.dependencies && (
              <div className="flex items-center gap-1 text-slate-500 col-span-2 sm:col-span-1">
                <span>Dépendances:</span>
                <span className="font-semibold text-slate-700 truncate">{task.dependencies}</span>
              </div>
            )}
            {task.assignedTo && (
              <div className="flex items-center gap-1 text-slate-500">
                <User size={11} className="text-teal-400 flex-shrink-0" />
                <span>Assigné:</span>
                <span className="font-semibold text-slate-700 truncate">
                  {getMemberName(task.assignedTo, members)}
                </span>
              </div>
            )}
          </div>

          {/* ── Delay Reason ────────────────────────────────────────────── */}
          {task.delayReason && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="flex items-center gap-1.5 font-semibold text-red-700 text-xs mb-1">
                <AlertTriangle size={12} /> Justification du retard
              </p>
              <p className="text-xs text-red-600 leading-relaxed pl-4">
                {task.delayReason}
              </p>
            </div>
          )}

          {/* ── AI Delay Prediction ─────────────────────────────────────── */}
          {task.aiDelayRiskProbability !== undefined && task.aiDelayRiskProbability > 0.5 && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <p className="flex items-center gap-1.5 font-semibold text-orange-700 text-xs mb-1">
                <AlertTriangle size={12} /> Risque de retard IA ({Math.round(task.aiDelayRiskProbability * 100)}%)
              </p>
              <p className="text-xs text-orange-600 leading-relaxed pl-4">
                Cause probable : {task.aiPredictedDelayReason || 'Non spécifiée'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Inline edit form ─────────────────────────────────────────────── */}
      {isEditing && editingData && (
        <div className="mt-4 pt-4 border-t border-teal-100">
          <TaskForm
            task={editingData}
            members={members}
            mode="edit"
            sprint={sprint}
            loading={loading}
            estimating={estimating}
            onChange={onEditChange}
            onSave={onSave}
            onCancel={onCancelEdit}
            onEstimate={onEstimate}
          />
        </div>
      )}
    </div>
  </div>
);
};