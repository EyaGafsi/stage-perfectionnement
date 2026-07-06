'use client';
// ─── SprintCard.tsx ───────────────────────────────────────────────────────────
// Responsive sprint row — turquoise/light theme, mobile-first.

import React from 'react';
import {
  ChevronDown, ChevronUp, Edit2, Trash2, Save, X, ListTodo,
} from 'lucide-react';
import type { Sprint, Task, ProjectMember } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { SprintForm } from './SprintForm';
import { TaskCard }   from './TaskCard';

interface SprintCardProps {
  sprint: Sprint;
  members: ProjectMember[];
  allSprints: Sprint[];
  projectStartDate?: string;
  projectEndDate?: string;
  isExpanded: boolean;
  isEditing: boolean;
  canEditSprints: boolean;
  editingSprintData: Sprint | null;
  editingSprintTasks: Task[];
  editingTaskId: number | null;
  editingTaskSprintId: number | null;
  editingTaskData: Task | null;
  loading: boolean;
  estimating: boolean;

  onToggleExpand: (sprintId: number) => void;
  onStartEditSprint: (sprint: Sprint) => void;
  onSprintChange: (field: keyof Sprint, value: unknown) => void;
  onSprintTaskChange: (index: number, field: keyof Task, value: unknown) => void;
  onAddSprintTask: () => void;
  onRemoveSprintTask: (index: number) => void;
  onSaveSprint: () => void;
  onCancelEditSprint: () => void;
  onDeleteSprint: (sprintId: number) => void;

  onStartEditTask: (task: Task, sprintId: number) => void;
  onEditTaskChange: (field: keyof Task, value: unknown) => void;
  onSaveTask: () => void;
  onCancelEditTask: () => void;
  onDeleteTask: (taskId: number, sprintId: number) => void;
  onEstimateTaskPreview: () => void;
  onEstimateSprintPreview: (index: number) => void;
}

/* ── helpers ────────────────────────────────────────────────────────────────── */

const statusLabel = (s: Sprint['status']) =>
  s === 'completed' ? 'Terminé' : s === 'in_progress' ? 'En cours' : 'Planifié';

const statusBadgeClass = (s: Sprint['status']) =>
  s === 'completed'
    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
    : s === 'in_progress'
    ? 'bg-teal-100 text-teal-700 ring-1 ring-teal-200'
    : 'bg-cyan-50 text-cyan-600 ring-1 ring-cyan-200';

/* ── component ──────────────────────────────────────────────────────────────── */

export const SprintCard: React.FC<SprintCardProps> = ({
  sprint, members, allSprints, projectStartDate, projectEndDate,
  isExpanded, isEditing, canEditSprints,
  editingSprintData, editingSprintTasks,
  editingTaskId, editingTaskSprintId, editingTaskData,
  loading, estimating,
  onToggleExpand, onStartEditSprint,
  onSprintChange, onSprintTaskChange, onAddSprintTask, onRemoveSprintTask,
  onSaveSprint, onCancelEditSprint, onDeleteSprint,
  onStartEditTask, onEditTaskChange, onSaveTask, onCancelEditTask, onDeleteTask, onEstimateTaskPreview, onEstimateSprintPreview,
}) => (
  <div
    className={`
      rounded-2xl overflow-hidden
      bg-white
      shadow-[0_2px_12px_rgba(20,184,166,0.10)]
      border border-teal-100
      hover:shadow-[0_4px_24px_rgba(20,184,166,0.18)]
      transition-all duration-300
    `}
  >
    {/* ── Header ─────────────────────────────────────────────────────────── */}
    <div
      className="
        px-4 py-4
        sm:px-6 sm:py-5
        bg-gradient-to-r from-teal-50 via-cyan-50 to-white
        border-b border-teal-100
      "
    >
      {/* Row 1: toggle + name + actions */}
      <div className="flex items-start gap-3 sm:items-center">

        {/* Expand toggle */}
        <button
          onClick={() => onToggleExpand(sprint.id!)}
          aria-label={isExpanded ? 'Réduire' : 'Développer'}
          className="
            mt-0.5 sm:mt-0
            p-2 rounded-xl flex-shrink-0
            text-teal-500 bg-teal-50
            hover:bg-teal-100 hover:text-teal-700
            active:scale-95
            transition-all duration-150
          "
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {/* Name / editable field */}
        <div className="flex-1 min-w-0">
          {isEditing && editingSprintData ? (
            <input
              type="text"
              value={editingSprintData.name}
              onChange={(e) => onSprintChange('name', e.target.value)}
              className="
                w-full font-semibold text-base sm:text-lg
                text-slate-800
                px-3 py-1.5
                border border-teal-300
                rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-400
                bg-white
              "
            />
          ) : (
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-slate-800 truncate leading-tight">
                {sprint.name}
              </h3>
              <p className="text-xs text-teal-500 mt-0.5 font-medium">
                {sprint.tasks?.length ?? 0} tâche{(sprint.tasks?.length ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Status badge — hidden on xs, shown sm+ */}
        <span
          className={`
            hidden sm:inline-flex
            items-center px-3 py-1
            rounded-full text-xs font-semibold
            flex-shrink-0
            ${statusBadgeClass(sprint.status)}
          `}
        >
          {statusLabel(sprint.status)}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={onSaveSprint}
                title="Enregistrer"
                className="
                  p-2 rounded-xl
                  bg-emerald-50 text-emerald-600
                  hover:bg-emerald-100 hover:text-emerald-700
                  active:scale-95
                  transition-all duration-150
                "
              >
                <Save size={16} />
              </button>
              <button
                onClick={onCancelEditSprint}
                title="Annuler"
                className="
                  p-2 rounded-xl
                  bg-slate-100 text-slate-500
                  hover:bg-slate-200 hover:text-slate-700
                  active:scale-95
                  transition-all duration-150
                "
              >
                <X size={16} />
              </button>
            </>
          ) : (
            canEditSprints && (
              <>
                <button
                  onClick={() => onStartEditSprint(sprint)}
                title="Éditer"
                className="
                  p-2 rounded-xl
                  bg-teal-50 text-teal-600
                  hover:bg-teal-100 hover:text-teal-700
                  active:scale-95
                  transition-all duration-150
                "
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDeleteSprint(sprint.id!)}
                title="Supprimer"
                className="
                  p-2 rounded-xl
                  bg-red-50 text-red-400
                  hover:bg-red-100 hover:text-red-600
                  active:scale-95
                  transition-all duration-150
                "
              >
                <Trash2 size={16} />
              </button>
            </>
            )
          )}
        </div>
      </div>
      {/* Row 2: dates + badge (mobile) ─────────────────────────────── */}
      <div className="flex items-center justify-between mt-3 sm:mt-2 pl-11">
        {/* Dates */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-medium text-teal-600">
            {new Date(sprint.startDate).toLocaleDateString('fr-FR')}
          </span>
          <span className="text-slate-300">→</span>
          <span className="font-medium text-teal-600">
            {new Date(sprint.endDate).toLocaleDateString('fr-FR')}
          </span>
        </div>

        {/* Status badge — mobile only */}
        <span
          className={`
            sm:hidden
            inline-flex items-center px-2.5 py-0.5
            rounded-full text-xs font-semibold
            ${statusBadgeClass(sprint.status)}
          `}
        >
          {statusLabel(sprint.status)}
        </span>
      </div>

      {/* ── Embedded edit form ─────────────────────────────────────────── */}
      {isEditing && editingSprintData && (
        <div className="mt-4 pt-4 border-t border-teal-100">
          <SprintForm
            mode="edit"
            sprint={editingSprintData}
            tasks={editingSprintTasks}
            members={members}
            allSprints={allSprints}
            projectStartDate={projectStartDate}
            projectEndDate={projectEndDate}
            loading={loading}
            estimating={estimating}
            onSprintChange={onSprintChange}
            onTaskChange={onSprintTaskChange}
            onAddTask={onAddSprintTask}
            onRemoveTask={onRemoveSprintTask}
            onSave={onSaveSprint}
            onCancel={onCancelEditSprint}
            onEstimateTask={onEstimateSprintPreview}
          />
        </div>
      )}
    </div>

    {/* ── Expanded task list ────────────────────────────────────────────── */}
    {isExpanded && !isEditing && (
      <div className="px-4 py-4 sm:px-6 sm:py-5 bg-cyan-50/40">
        <h4 className="
          font-semibold text-sm text-teal-700
          flex items-center gap-2 mb-3
        ">
          <ListTodo size={16} className="text-teal-400" />
          Tâches
          <span className="
            ml-1 px-2 py-0.5 rounded-full
            bg-teal-100 text-teal-600 text-xs font-bold
          ">
            {sprint.tasks?.length ?? 0}
          </span>
        </h4>

        {sprint.tasks?.length ? (
          <div className="space-y-2.5">
            {sprint.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                members={members}
                sprintId={sprint.id!}
                sprint={sprint}
                isEditing={editingTaskId === task.id && editingTaskSprintId === sprint.id}
                canEditSprints={canEditSprints}
                editingData={editingTaskData}
                loading={loading}
                estimating={estimating}
                onStartEdit={onStartEditTask}
                onEditChange={onEditTaskChange}
                onSave={onSaveTask}
                onCancelEdit={onCancelEditTask}
                onDelete={onDeleteTask}
                onEstimate={onEstimateTaskPreview}
              />
            ))}
          </div>
        ) : (
          <div className="
            flex flex-col items-center justify-center
            py-8 gap-2
            text-teal-300
          ">
            <ListTodo size={28} strokeWidth={1.5} />
            <p className="text-sm text-slate-400">Aucune tâche dans ce sprint</p>
          </div>
        )}
      </div>
    )}
  </div>
);