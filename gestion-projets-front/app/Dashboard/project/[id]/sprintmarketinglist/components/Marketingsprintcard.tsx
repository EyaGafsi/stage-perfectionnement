'use client';
// ─── MarketingSprintCard.tsx ──────────────────────────────────────────────────
// Renders a single sprint row. Delegates to MarketingSprintForm when editing,
// to MarketingTaskCard for each task row.
// Design: Light + Turquoise — responsive mobile/desktop

import React from 'react';
import {
  ChevronDown, ChevronUp, Edit2, Trash2, Save, X, ListTodo,
  DollarSign, Target, Radio,
} from 'lucide-react';
import type { SprintMarketing, TaskMarketing, ProjectMember } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';
import { MarketingSprintForm } from '@/Dashboard/project/[id]/sprintmarketinglist/components/Marketingsprintform';
import { MarketingTaskCard } from './Marketingtaskcard';
import { safeNum } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Marketingestimationservice';

interface MarketingSprintCardProps {
  sprint: SprintMarketing;
  members: ProjectMember[];
  isExpanded: boolean;
  isEditing: boolean;
  canEditSprints: boolean;
  editingSprintData: SprintMarketing | null;
  editingSprintTasks: TaskMarketing[];
  editingTaskId: number | null;
  editingTaskSprintId: number | null;
  editingTaskData: TaskMarketing | null;
  estimatingTaskIdx: number | null;
  loading: boolean;
  estimating: boolean;
  allSprints: SprintMarketing[];
  projectStartDate?: string | null;
  projectEndDate?: string | null;

  onToggleExpand: (id: number) => void;
  onStartEditSprint: (sprint: SprintMarketing) => void;
  onSprintChange: (field: keyof SprintMarketing, value: unknown) => void;
  onSprintTaskChange: (index: number, field: keyof TaskMarketing, value: unknown) => void;
  onAddSprintTask: () => void;
  onRemoveSprintTask: (index: number) => void;
  onEstimateSprintTask: (index: number) => void;
  onSaveSprint: () => void;
  onCancelEditSprint: () => void;
  onDeleteSprint: (id: number) => void;

  onStartEditTask: (task: TaskMarketing, sprintId: number) => void;
  onEditTaskChange: (field: keyof TaskMarketing, value: unknown) => void;
  onEstimateEditingTask: () => void;
  onSaveTask: () => void;
  onCancelEditTask: () => void;
  onDeleteTask: (taskId: number, sprintId: number) => void;
}

// ── Design tokens ────────────────────────────────────────────────────────────
// Turquoise palette  #06b6d4 (cyan-500) / #0e7490 (cyan-700) / #ecfeff (cyan-50)
// Status badges use semantic soft tones

const STATUS_BADGE: Record<string, string> = {
  planned:   'bg-cyan-50   text-cyan-700   border border-cyan-200   ring-1 ring-cyan-100',
  active:    'bg-teal-50   text-teal-700   border border-teal-200   ring-1 ring-teal-100',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-100',
  cancelled: 'bg-rose-50   text-rose-600   border border-rose-200   ring-1 ring-rose-100',
};

const STATUS_DOT: Record<string, string> = {
  planned:   'bg-cyan-400',
  active:    'bg-teal-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-rose-400',
};

const STATUS_LABEL: Record<string, string> = {
  planned: 'Planifié', active: 'Actif', completed: 'Terminé', cancelled: 'Annulé',
};

// ── Meta chip — small pill for sprint metadata ────────────────────────────────
const MetaChip: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 border border-cyan-100 text-xs text-cyan-800 font-medium shadow-[0_1px_2px_rgba(6,182,212,0.08)]">
    <span className="text-cyan-400">{icon}</span>
    {label}
  </span>
);

// ── Main component ────────────────────────────────────────────────────────────
export const MarketingSprintCard: React.FC<MarketingSprintCardProps> = ({
  sprint, members, isExpanded, isEditing, canEditSprints,
  editingSprintData, editingSprintTasks,
  editingTaskId, editingTaskSprintId, editingTaskData,
  estimatingTaskIdx, loading, estimating,
  allSprints, projectStartDate, projectEndDate,
  onToggleExpand, onStartEditSprint,
  onSprintChange, onSprintTaskChange, onAddSprintTask, onRemoveSprintTask,
  onEstimateSprintTask, onSaveSprint, onCancelEditSprint, onDeleteSprint,
  onStartEditTask, onEditTaskChange, onEstimateEditingTask,
  onSaveTask, onCancelEditTask, onDeleteTask,
}) => (
  <div
    className={`
      bg-white rounded-2xl border transition-all duration-200
      ${isEditing
        ? 'border-cyan-300 shadow-[0_0_0_3px_rgba(6,182,212,0.12)] shadow-md'
        : 'border-slate-200/80 shadow-sm hover:shadow-md hover:border-cyan-200'
      }
      overflow-hidden
    `}
  >

    {/* ── Sprint header ──────────────────────────────────────────────────────── */}
    <div
      className={`
        px-4 sm:px-6 py-4
        ${isEditing
          ? 'bg-gradient-to-br from-cyan-50 via-white to-teal-50'
          : 'bg-gradient-to-r from-cyan-50/60 to-white'
        }
        border-b border-slate-100
      `}
    >

      {/* Top row: toggle + name + actions */}
      <div className="flex items-start gap-3">

        {/* Expand toggle */}
        <button
          onClick={() => onToggleExpand(sprint.id!)}
          aria-label={isExpanded ? 'Réduire' : 'Développer'}
          className="mt-0.5 flex-shrink-0 p-1.5 rounded-lg text-cyan-500 hover:bg-cyan-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          {isExpanded
            ? <ChevronUp size={18} strokeWidth={2.5} />
            : <ChevronDown size={18} strokeWidth={2.5} />}
        </button>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          {isEditing && editingSprintData ? (
            <input
              type="text"
              value={editingSprintData.name}
              onChange={(e) => onSprintChange('name', e.target.value)}
              className="
                w-full max-w-sm font-bold text-base sm:text-lg text-slate-800
                px-3 py-1.5 rounded-lg border border-cyan-300 bg-white
                focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400
                transition
              "
            />
          ) : (
            <>
              <h3 className="font-bold text-base sm:text-lg text-slate-800 leading-snug truncate pr-2">
                {sprint.name}
              </h3>

              {/* Meta chips row — wraps on mobile */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <MetaChip
                  icon={<ListTodo size={11} />}
                  label={`${sprint.tasks?.length ?? 0} tâche${(sprint.tasks?.length ?? 0) !== 1 ? 's' : ''}`}
                />
                {sprint.campaignType && (
                  <MetaChip icon={<Radio size={11} />} label={sprint.campaignType} />
                )}
                {safeNum(sprint.totalBudget) > 0 && (
                  <MetaChip
                    icon={<DollarSign size={11} />}
                    label={`${safeNum(sprint.totalBudget).toLocaleString()} €`}
                  />
                )}
                {sprint.targetAudience && (
                  <MetaChip icon={<Target size={11} />} label={sprint.targetAudience} />
                )}
              </div>
            </>
          )}
        </div>

        {/* Right side: status + action buttons */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">

          {/* Status badge */}
          <span className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap
            ${STATUS_BADGE[sprint.status] ?? 'bg-slate-100 text-slate-600 border border-slate-200'}
          `}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[sprint.status] ?? 'bg-slate-400'}`} />
            {STATUS_LABEL[sprint.status] ?? sprint.status}
          </span>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {isEditing ? (
              <>
                <button
                  onClick={onSaveSprint}
                  title="Enregistrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-xs font-semibold hover:bg-cyan-600 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <Save size={14} />
                  <span className="hidden sm:inline">Enregistrer</span>
                </button>
                <button
                  onClick={onCancelEditSprint}
                  title="Annuler"
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  <X size={15} />
                </button>
              </>
            ) : (
              canEditSprints && (
                <>
                  <button
                    onClick={() => onStartEditSprint(sprint)}
                    title="Modifier cette campagne"
                    className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border border-cyan-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => onDeleteSprint(sprint.id!)}
                    title="Supprimer cette campagne"
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* Période — visible on mobile below name, on desktop inline */}
      {!isEditing && (
        <div className="mt-2.5 ml-9 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span className="w-1 h-1 rounded-full bg-cyan-300 flex-shrink-0" />
          {new Date(sprint.startDate).toLocaleDateString('fr-FR')}
          <span className="text-cyan-300">→</span>
          {new Date(sprint.endDate).toLocaleDateString('fr-FR')}
        </div>
      )}

      {/* Embedded edit form */}
      {isEditing && editingSprintData && (
        <div className="mt-4 pt-4 border-t border-cyan-100">
          <MarketingSprintForm
            mode="edit"
            sprint={editingSprintData}
            tasks={editingSprintTasks}
            members={members}
            loading={loading}
            estimating={estimating}
            estimatingTaskIdx={estimatingTaskIdx}
            allSprints={allSprints}
            projectStartDate={projectStartDate}
            projectEndDate={projectEndDate}
            onSprintChange={onSprintChange}
            onTaskChange={onSprintTaskChange}
            onAddTask={onAddSprintTask}
            onRemoveTask={onRemoveSprintTask}
            onEstimateTask={onEstimateSprintTask}
            onSave={onSaveSprint}
            onCancel={onCancelEditSprint}
          />
        </div>
      )}
    </div>

    {/* ── Expanded task list ─────────────────────────────────────────────────── */}
    {isExpanded && !isEditing && (
      <div className="px-4 sm:px-6 py-5 bg-slate-50/50">

        {/* Section heading */}
        <div className="flex items-center gap-2 mb-4">
          <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-600">
            <ListTodo size={15} />
          </span>
          <h4 className="font-semibold text-sm text-slate-700">
            Tâches
            <span className="ml-2 px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold">
              {sprint.tasks?.length ?? 0}
            </span>
          </h4>
        </div>

        {sprint.tasks?.length ? (
          <div className="space-y-2.5">
            {sprint.tasks.map((task) => (
              <MarketingTaskCard
                key={task.id}
                task={task}
                sprintId={sprint.id!}
                members={members}
                isEditing={editingTaskId === task.id && editingTaskSprintId === sprint.id}
                canEditSprints={canEditSprints}
                editingData={editingTaskData}
                isEstimating={editingTaskId === task.id && estimatingTaskIdx !== null}
                loading={loading}
                onStartEdit={onStartEditTask}
                onEditChange={onEditTaskChange}
                onEstimate={onEstimateEditingTask}
                onSave={onSaveTask}
                onCancelEdit={onCancelEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <span className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-300">
              <ListTodo size={24} />
            </span>
            <p className="text-sm text-slate-400 font-medium">Aucune tâche dans ce sprint</p>
          </div>
        )}
      </div>
    )}
  </div>
);