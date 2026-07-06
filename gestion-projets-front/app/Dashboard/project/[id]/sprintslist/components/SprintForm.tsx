'use client';
// ─── SprintForm.tsx ───────────────────────────────────────────────────────────
// Turquoise/light theme — mobile-first responsive.

import React, { useMemo } from 'react';
import { Plus, Save, Loader2, ListTodo, Cpu, AlertCircle } from 'lucide-react';
import type { Sprint, Task, ProjectMember } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { inputClass, labelClass } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { TaskForm } from '@/Dashboard/project/[id]/sprintslist/components/TaskForm';
import { EstimatingBanner } from '@/Dashboard/project/[id]/sprintslist/components/ui';
import {
  validateSprintDates,
  validateTaskDates,
} from '@/Dashboard/project/[id]/sprintslist/services/Datevalidation';

interface SprintFormProps {
  mode: 'create' | 'edit';
  sprint: Sprint;
  tasks: Task[];
  members: ProjectMember[];
  allSprints?: Sprint[];
  projectStartDate?: string;
  projectEndDate?: string;
  loading: boolean;
  estimating: boolean;
  onSprintChange: (field: keyof Sprint, value: unknown) => void;
  onTaskChange: (index: number, field: keyof Task, value: unknown) => void;
  onAddTask: () => void;
  onRemoveTask: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onEstimateTask?: (index: number) => void;
}

/* ── FieldError ─────────────────────────────────────────────────────────────── */
const FieldError = ({ message }: { message: string }) => (
  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
    <AlertCircle size={11} className="flex-shrink-0" />
    {message}
  </p>
);

/* ── main component ─────────────────────────────────────────────────────────── */
export const SprintForm: React.FC<SprintFormProps> = ({
  mode, sprint, tasks, members,
  allSprints = [], projectStartDate, projectEndDate,
  loading, estimating,
  onSprintChange, onTaskChange, onAddTask, onRemoveTask, onSave, onCancel, onEstimateTask
}) => {
  /* date validation */
  const sprintErrors = useMemo(() => {
    if (!sprint.startDate || !sprint.endDate) return [];
    const otherSprints = allSprints.filter((s) => s.id !== sprint.id);
    return validateSprintDates({ sprint, otherSprints, projectStartDate, projectEndDate });
  }, [sprint.startDate, sprint.endDate, sprint.id, allSprints, projectStartDate, projectEndDate]);

  const sprintFieldError = (field: string) =>
    sprintErrors.find((e) => e.field === field)?.message;

  const anyTaskDateError = useMemo(() => {
    if (!sprint.startDate || !sprint.endDate) return false;
    return tasks.some((t) => validateTaskDates(t, sprint).length > 0);
  }, [tasks, sprint.startDate, sprint.endDate]);

  const hasErrors = sprintErrors.length > 0 || anyTaskDateError;

  const projMin = projectStartDate
    ? new Date(projectStartDate).toISOString().split('T')[0]
    : undefined;
  const projMax = projectEndDate
    ? new Date(projectEndDate).toISOString().split('T')[0]
    : undefined;

  const errorBorder = 'border-red-300 focus:border-red-400 focus:ring-red-300/30';

  /* ── teal-styled shared input/label classes (override theme defaults) ─────── */
  const tealInput = `
    w-full rounded-xl border border-teal-200
    bg-white text-slate-800 text-sm
    px-3 py-2
    focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400
    placeholder:text-slate-400
    transition-colors duration-150
  `;
  const tealLabel = 'block text-xs font-semibold text-teal-700 mb-1 uppercase tracking-wide';

  /* ── form body ──────────────────────────────────────────────────────────── */
  const content = (
    <div className="p-4 sm:p-6 space-y-6">
      {estimating && <EstimatingBanner />}

      {/* ── Sprint meta fields ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 sm:gap-5">

        {/* Name */}
        <div className="sm:col-span-2 md:col-span-4">
          <label className={tealLabel}>
            Nom du Sprint <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Sprint 1 - Auth & Setup"
            className={tealInput}
            value={sprint.name}
            onChange={(e) => onSprintChange('name', e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className={tealLabel}>Statut</label>
          <select
            className={tealInput}
            value={sprint.status}
            onChange={(e) => onSprintChange('status', e.target.value)}
          >
            <option value="planned">Planifié</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
          </select>
        </div>

        {/* Priority */}
        <div className="md:col-span-2">
          <label className={tealLabel}>Priorité</label>
          <select
            className={tealInput}
            value={sprint.priority}
            onChange={(e) => onSprintChange('priority', e.target.value)}
          >
            <option value="Low">Basse</option>
            <option value="Medium">Moyenne</option>
            <option value="High">Haute</option>
          </select>
        </div>

        {/* Complexity */}
        <div className="md:col-span-2">
          <label className={tealLabel}>Complexité</label>
          <select
            className={tealInput}
            value={sprint.complexity}
            onChange={(e) => onSprintChange('complexity', e.target.value)}
          >
            <option value="Low">Basse</option>
            <option value="Medium">Moyenne</option>
            <option value="High">Haute</option>
          </select>
        </div>

        {/* Start date */}
        <div className="md:col-span-1">
          <label className={tealLabel}>
            Début <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            min={projMin}
            max={sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : projMax}
            className={`${tealInput} ${sprintFieldError('startDate') ? errorBorder : ''}`}
            value={sprint.startDate.split('T')[0]}
            onChange={(e) => onSprintChange('startDate', e.target.value)}
          />
          {sprintFieldError('startDate') && (
            <FieldError message={sprintFieldError('startDate')!} />
          )}
        </div>

        {/* End date */}
        <div className="md:col-span-1">
          <label className={tealLabel}>
            Fin <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            min={sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : projMin}
            max={projMax}
            className={`${tealInput} ${sprintFieldError('endDate') ? errorBorder : ''}`}
            value={sprint.endDate.split('T')[0]}
            onChange={(e) => onSprintChange('endDate', e.target.value)}
          />
          {sprintFieldError('endDate') && (
            <FieldError message={sprintFieldError('endDate')!} />
          )}
        </div>
      </div>

      {/* ── Sprint-level error summary ──────────────────────────────────────── */}
      {sprintErrors.length > 0 && (
        <div className="space-y-1.5">
          {sprintErrors.map((e, i) => (
            <div
              key={i}
              className="
                flex items-start gap-2 text-xs sm:text-sm
                text-red-600 bg-red-50
                border border-red-100 rounded-xl
                px-3 py-2.5
              "
            >
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Tasks section ───────────────────────────────────────────────────── */}
      <div className="border-t border-teal-100 pt-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <ListTodo size={16} className="text-teal-500" />
            Tâches
            <span className="
              px-2 py-0.5 rounded-full
              bg-teal-100 text-teal-600
              text-xs font-bold
            ">
              {tasks.length}
            </span>
          </h3>
          <button
            type="button"
            onClick={onAddTask}
            className="
              flex items-center gap-1.5 text-xs sm:text-sm
              px-3 py-1.5
              bg-teal-50 text-teal-700
              border border-teal-200
              rounded-xl font-semibold
              hover:bg-teal-100 hover:border-teal-300
              active:scale-95
              transition-all duration-150
            "
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>

        <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
          {tasks.map((task, idx) => (
            <TaskForm
              key={task.id ?? `new-${idx}`}
              task={task}
              index={idx}
              members={members}
              mode="inline"
              sprint={sprint}
              showRemoveButton={tasks.length > 1}
              onChange={(field, value) => onTaskChange(idx, field, value)}
              onRemove={() => onRemoveTask(idx)}
              onEstimate={onEstimateTask ? () => onEstimateTask(idx) : undefined}
            />
          ))}
        </div>
      </div>

      {/* ── AI hint ─────────────────────────────────────────────────────────── */}
      <div className="
        flex items-center gap-2
        text-xs text-teal-600
        bg-teal-50 border border-teal-100
        rounded-xl px-3 py-2.5
      ">
        <Cpu size={12} className="flex-shrink-0" />
        La durée de chaque tâche sera estimée par l'IA (en tenant compte du niveau du membre assigné).
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <div className="
        flex flex-col-reverse sm:flex-row sm:justify-end
        gap-2.5 pt-4
        border-t border-teal-100
      ">
        <button
          onClick={onCancel}
          className="
            w-full sm:w-auto
            px-4 py-2.5 rounded-xl font-semibold text-sm
            text-slate-600 bg-white
            border border-slate-200
            hover:bg-slate-50 hover:border-slate-300
            active:scale-95
            transition-all duration-150
          "
        >
          Annuler
        </button>
        <button
          onClick={onSave}
          disabled={loading || estimating || hasErrors}
          title={hasErrors ? 'Corrigez les erreurs de dates avant de sauvegarder.' : undefined}
          className="
            w-full sm:w-auto
            flex items-center justify-center gap-2
            px-6 py-2.5 rounded-xl font-semibold text-sm
            bg-teal-500 text-white
            hover:bg-teal-600
            disabled:bg-teal-200 disabled:text-teal-400 disabled:cursor-not-allowed
            shadow-[0_2px_8px_rgba(20,184,166,0.30)]
            hover:shadow-[0_4px_16px_rgba(20,184,166,0.40)]
            active:scale-95
            transition-all duration-150
          "
        >
          {estimating ? (
            <><Loader2 size={16} className="animate-spin" />Estimation IA…</>
          ) : (
            <><Save size={16} />{loading ? 'Enregistrement…' : mode === 'create' ? 'Créer le Sprint' : 'Enregistrer'}</>
          )}
        </button>
      </div>
    </div>
  );

  /* edit mode — content only (embedded in SprintCard) */
  if (mode === 'edit') return content;

  /* create mode — wrapped in a card */
  return (
    <div
      className="
        mb-8 bg-white
        rounded-2xl overflow-hidden
        border border-teal-100
        shadow-[0_2px_16px_rgba(20,184,166,0.10)]
      "
    >
      {/* Create-mode header */}
      <div
        className="
          px-4 py-3.5 sm:px-6 sm:py-4
          bg-gradient-to-r from-teal-50 via-cyan-50 to-white
          border-b border-teal-100
          flex items-center gap-2.5
        "
      >
        <div className="p-1.5 bg-teal-100 rounded-lg">
          <Plus size={16} className="text-teal-600" />
        </div>
        <h2 className="text-sm sm:text-lg font-bold text-slate-800">
          Créer un nouveau Sprint
        </h2>
      </div>

      {content}
    </div>
  );
};