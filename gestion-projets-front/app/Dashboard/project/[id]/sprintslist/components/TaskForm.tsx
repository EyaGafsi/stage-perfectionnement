'use client';
// ─── TaskForm.tsx ─────────────────────────────────────────────────────────────
// Turquoise/light theme — mobile-first responsive.

import React, { useMemo } from 'react';
import { Calendar, Cpu, Save, Loader2, Trash2, AlertCircle } from 'lucide-react';
import type {
  Task, TaskType, TaskStatus, TaskPriority, ProjectMember, Sprint,
} from '@/Dashboard/project/[id]/sprintslist/services/types';
import { inputClass } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { formatHoursDays, safeHours } from '@/Dashboard/project/[id]/sprintslist/services/estimationService';
import { validateTaskDates } from '@/Dashboard/project/[id]/sprintslist/services/Datevalidation';

interface TaskFormProps {
  task: Task;
  index?: number;
  members: ProjectMember[];
  mode: 'inline' | 'edit';
  sprint?: Pick<Sprint, 'startDate' | 'endDate' | 'name'>;
  disabled?: boolean;
  loading?: boolean;
  estimating?: boolean;
  showRemoveButton?: boolean;
  onChange: (field: keyof Task, value: unknown) => void;
  onSave?: () => void;
  onCancel?: () => void;
  onRemove?: () => void;
  onEstimate?: () => void;
}

/* ── helpers ────────────────────────────────────────────────────────────────── */
const FieldError = ({ message }: { message: string }) => (
  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
    <AlertCircle size={11} className="flex-shrink-0" />
    {message}
  </p>
);

function getMemberName(assignedTo: any, members: ProjectMember[]): string {
  if (!assignedTo) return '—';
  if (typeof assignedTo === 'object' && assignedTo.firstName) {
    return `${assignedTo.firstName} ${assignedTo.lastName ?? ''}`.trim();
  }
  const id = typeof assignedTo === 'object' ? assignedTo.id : Number(assignedTo);
  const member = members.find((m) => m.id === id);
  return member
    ? (member.name ?? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim())
    : '—';
}

/* ── shared teal input/label styles ─────────────────────────────────────────── */
const tealInput = `
  w-full rounded-xl border border-teal-200
  bg-white text-slate-800 text-sm
  px-3 py-2
  focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400
  placeholder:text-slate-400
  disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
  transition-colors duration-150
`;
const tealLabel = 'block text-xs font-semibold text-teal-700 mb-1 uppercase tracking-wide';
const errorBorder = 'border-red-300 focus:border-red-400 focus:ring-red-300/30';

/* ── component ──────────────────────────────────────────────────────────────── */
export const TaskForm: React.FC<TaskFormProps> = ({
  task, index, members, mode, sprint,
  disabled = false, loading = false, estimating = false,
  showRemoveButton = false,
  onChange, onSave, onCancel, onRemove, onEstimate,
}) => {
  const isExisting = !!task.id;
  const lock = (forExisting = true) =>
    disabled || (mode === 'inline' && isExisting && forExisting);

  /* date validation */
  const dateErrors = useMemo(() => {
    if (!sprint?.startDate || !sprint?.endDate) return [];
    return validateTaskDates(task, sprint);
  }, [task.scheduledStartDate, task.scheduledEndDate, sprint]);

  const fieldError = (field: string) =>
    dateErrors.find((e) => e.field === field)?.message;

  const hasDateErrors = dateErrors.length > 0;

  const sprintMin = sprint?.startDate
    ? new Date(sprint.startDate).toISOString().split('T')[0]
    : undefined;
  const sprintMax = sprint?.endDate
    ? new Date(sprint.endDate).toISOString().split('T')[0]
    : undefined;

  return (
    <div
      className={
        mode === 'edit'
          ? 'space-y-4 p-4 sm:p-5 bg-teal-50/60 border border-teal-200 rounded-2xl mt-3'
          : 'p-4 sm:p-5 bg-cyan-50/40 border border-teal-100 rounded-2xl'
      }
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      {mode === 'inline' && (
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-sm text-teal-700 flex items-center gap-1.5">
            <span className="
              w-5 h-5 rounded-full bg-teal-100 text-teal-600
              flex items-center justify-center text-[10px] font-bold flex-shrink-0
            ">
              {index !== undefined ? index + 1 : '·'}
            </span>
            {index !== undefined ? `Tâche ${index + 1}` : 'Tâche'}
            <span className="text-xs text-slate-400 font-normal">
              {isExisting ? '(existante)' : '(nouvelle)'}
            </span>
          </h4>
          <div className="flex items-center gap-1.5">
            {onEstimate && (
              <button
                onClick={onEstimate}
                disabled={loading || estimating || !task.assignedTo}
                title={!task.assignedTo ? 'Veuillez assigner un membre avant d\'estimer.' : undefined}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                  bg-indigo-50 text-indigo-600 border border-indigo-100
                  hover:bg-indigo-100 hover:text-indigo-700
                  disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 disabled:cursor-not-allowed
                  active:scale-95 transition-all
                "
              >
                {estimating ? (
                  <><Loader2 size={13} className="animate-spin" />Calcul…</>
                ) : (
                  <><Cpu size={13} />Estimer (IA)</>
                )}
              </button>
            )}
            {showRemoveButton && !isExisting && (
              <button
                onClick={onRemove}
                className="
                  p-1.5 rounded-lg
                  text-slate-400 hover:text-red-500 hover:bg-red-50
                  active:scale-95 transition-all duration-150
                "
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <h5 className="font-bold text-teal-800 text-sm sm:text-base flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-teal-400 inline-block" />
          Éditer la tâche
        </h5>
      )}

      {/* ── Sprint date hint ────────────────────────────────────────────────── */}
      {sprint?.startDate && sprint?.endDate && (
        <div className="
          flex items-center gap-2 text-xs
          text-teal-700 bg-teal-50
          border border-teal-100 rounded-xl
          px-3 py-2
        ">
          <Calendar size={12} className="flex-shrink-0 text-teal-400" />
          <span>
            Plage du sprint{sprint.name ? ` "${sprint.name}"` : ''} :{' '}
            <strong>
              {new Date(sprint.startDate).toLocaleDateString('fr-FR')} →{' '}
              {new Date(sprint.endDate).toLocaleDateString('fr-FR')}
            </strong>
          </span>
        </div>
      )}

      {/* ── AI estimate display ─────────────────────────────────────────────── */}
      {safeHours(task.aiEstimatedHours ?? task.estimatedHours) > 0 && (
        <div className="
          flex items-center gap-2 text-xs sm:text-sm
          text-teal-700 bg-teal-50
          border border-teal-200 rounded-xl
          px-3 py-2
        ">
          <Cpu size={13} className="text-teal-500 flex-shrink-0" />
          <span>
            Estimation IA :{' '}
            <strong>
              {formatHoursDays(safeHours(task.aiEstimatedHours ?? task.estimatedHours))}
            </strong>
          </span>
        </div>
      )}

      {/* ── Fields grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4">

        {/* Title */}
        <div className="sm:col-span-2 md:col-span-6">
          <label className={tealLabel}>Titre <span className="text-red-400">*</span></label>
          <input
            type="text"
            placeholder="Titre de la tâche"
            className={tealInput}
            value={task.title ?? ''}
            onChange={(e) => onChange('title', e.target.value)}
            disabled={lock()}
          />
        </div>

        {/* Assigned to */}
        <div className="md:col-span-3">
          <label className={tealLabel}>
            Assigné à
            {task.assignedTo && (() => {
              const m = members.find((mb) => mb.id === Number(task.assignedTo));
              return m?.level ? (
                <span className="ml-2 px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-[10px] font-bold">
                  {getMemberName(task.assignedTo, members)}
                </span>
              ) : null;
            })()}
          </label>
<select
  className={tealInput}
  value={task.assignedTo ?? ''}
  onChange={(e) => onChange('assignedTo', e.target.value)}
>
            <option value="">Non assigné</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? `${m.firstName} ${m.lastName}`}
                {m.level ? ` (${m.level})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="md:col-span-3">
          <label className={tealLabel}>Type</label>
          <select
            className={tealInput}
            value={task.type ?? 'FEATURE'}
            onChange={(e) => onChange('type', e.target.value as TaskType)}
            disabled={lock()}
          >
            <option value="FEATURE">Feature</option>
            <option value="BUG">Bug</option>
            <option value="IMPROVEMENT">Improvement</option>
            <option value="TASK">Task</option>
            <option value="STORY">Story</option>
          </select>
        </div>

        {/* Description */}
        <div className="sm:col-span-2 md:col-span-12">
          <label className={tealLabel}>Description</label>
          <textarea
            placeholder="Description technique…"
            className={`${tealInput} resize-none`}
            rows={2}
            value={task.description ?? ''}
            onChange={(e) => onChange('description', e.target.value)}
            disabled={lock()}
          />
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className={tealLabel}>Statut</label>
          <select
            className={tealInput}
            value={task.status ?? 'TO_DO'}
            onChange={(e) => onChange('status', e.target.value as TaskStatus)}
          >
            <option value="TO_DO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="IN_REVIEW">En révision</option>
            <option value="DONE">Fait</option>
            <option value="BLOCKED">Bloqué</option>
          </select>
        </div>

        {/* Priority */}
        <div className="md:col-span-2">
          <label className={tealLabel}>Priorité</label>
          <select
            className={tealInput}
            value={task.priority ?? 'MEDIUM'}
            onChange={(e) => onChange('priority', e.target.value as TaskPriority)}
            disabled={lock()}
          >
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </select>
        </div>

        {/* Story Points */}
        <div className="md:col-span-2">
          <label className={tealLabel}>Story Points</label>
          <input
            type="number" min="0"
            className={tealInput}
            value={task.storyPoints ?? ''}
            onChange={(e) => onChange('storyPoints', Number(e.target.value))}
            disabled={lock()}
          />
        </div>

        {/* Complexity */}
        <div className="md:col-span-2">
          <label className={tealLabel}>Complexité (1-5)</label>
          <input
            type="number" min="1" max="5"
            className={tealInput}
            value={task.complexityScore ?? ''}
            onChange={(e) => onChange('complexityScore', Number(e.target.value))}
            disabled={lock()}
          />
        </div>

        {/* Risk */}
        <div className="md:col-span-2">
          <label className={tealLabel}>Risque (1-5)</label>
          <input
            type="number" min="1" max="5"
            className={tealInput}
            value={task.riskLevel ?? ''}
            onChange={(e) => onChange('riskLevel', Number(e.target.value))}
            disabled={lock()}
          />
        </div>

        {/* Start date */}
        <div className="md:col-span-3">
          <label className={`${tealLabel} flex items-center gap-1`}>
            <Calendar size={11} className="text-teal-400" /> Début
          </label>
          <input
            type="date"
            min={sprintMin}
            max={sprintMax}
            className={`${tealInput} ${fieldError('scheduledStartDate') ? errorBorder : ''}`}
            value={task.scheduledStartDate ?? ''}
            onChange={(e) => onChange('scheduledStartDate', e.target.value)}
            disabled={lock()}
          />
          {fieldError('scheduledStartDate') && (
            <FieldError message={fieldError('scheduledStartDate')!} />
          )}
        </div>

        {/* End date */}
        <div className="md:col-span-3">
          <label className={`${tealLabel} flex items-center gap-1`}>
            <Calendar size={11} className="text-cyan-400" /> Fin
          </label>
          <input
            type="date"
            min={task.scheduledStartDate || sprintMin}
            max={sprintMax}
            className={`${tealInput} ${fieldError('scheduledEndDate') ? errorBorder : ''}`}
            value={task.scheduledEndDate ?? ''}
            onChange={(e) => onChange('scheduledEndDate', e.target.value)}
            disabled={lock()}
          />
          {fieldError('scheduledEndDate') && (
            <FieldError message={fieldError('scheduledEndDate')!} />
          )}
        </div>

        {/* Dependencies */}
        <div className="md:col-span-2">
          <label className={tealLabel}>Dépendances</label>
          <input
            type="text" placeholder="Task #12"
            className={tealInput}
            value={task.dependencies ?? ''}
            onChange={(e) => onChange('dependencies', e.target.value)}
            disabled={lock()}
          />
        </div>

        {/* Risks text */}
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-red-500 mb-1 uppercase tracking-wide">
            Risques
          </label>
          <input
            type="text" placeholder="Risques identifiés…"
            className={tealInput}
            value={task.risks ?? ''}
            onChange={(e) => onChange('risks', e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-4">
          <label className={tealLabel}>Notes</label>
          <input
            type="text" placeholder="Notes additionnelles…"
            className={tealInput}
            value={task.additionalNotes ?? ''}
            onChange={(e) => onChange('additionalNotes', e.target.value)}
          />
        </div>
      </div>

      {/* ── AI Delay Prediction Warning ────────────────────────────────────── */}
      {task.aiDelayRiskProbability !== undefined && (
        <div className={`mt-4 p-3 border rounded-xl flex items-start gap-2 ${
          task.aiDelayRiskProbability > 0.5 
            ? 'bg-orange-50 border-orange-200 text-orange-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <AlertCircle size={16} className={`mt-0.5 flex-shrink-0 ${
            task.aiDelayRiskProbability > 0.5 ? 'text-orange-600' : 'text-emerald-600'
          }`} />
          <div>
            <h5 className="font-bold text-sm">
              {task.aiDelayRiskProbability > 0.5 ? 'Risque de retard IA' : 'Aucun risque de retard IA'} ({Math.round(task.aiDelayRiskProbability * 100)}%)
            </h5>
            <p className={`text-xs mt-0.5 ${task.aiDelayRiskProbability > 0.5 ? 'text-orange-700' : 'text-emerald-700'}`}>
              Cause probable : <strong>{task.aiPredictedDelayReason || 'Aucun risque majeur'}</strong>. 
              {task.aiDelayRiskProbability > 0.5 && " Le chef de projet est prévenu."}
            </p>
          </div>
        </div>
      )}

      {/* ── Save / Cancel (edit mode) ────────────────────────────────────────── */}
      {mode === 'edit' && (
        <div className="
          flex flex-col-reverse sm:flex-row sm:justify-end
          gap-2 pt-3 border-t border-teal-100
        ">
          <button
            onClick={onCancel}
            className="
              w-full sm:w-auto
              px-4 py-2 rounded-xl font-semibold text-sm
              text-slate-600 bg-white
              border border-slate-200
              hover:bg-slate-50 hover:border-slate-300
              active:scale-95 transition-all duration-150
            "
          >
            Annuler
          </button>
          {onEstimate && (
            <button
              onClick={onEstimate}
              disabled={loading || estimating || !task.assignedTo}
              title={!task.assignedTo ? 'Veuillez assigner un membre avant d\'estimer.' : undefined}
              className="
                w-full sm:w-auto
                flex items-center justify-center gap-1.5
                px-4 py-2 rounded-xl font-semibold text-sm
                bg-indigo-500 text-white
                hover:bg-indigo-600
                disabled:bg-indigo-200 disabled:text-indigo-400 disabled:cursor-not-allowed
                shadow-[0_2px_8px_rgba(99,102,241,0.25)]
                active:scale-95 transition-all duration-150
              "
            >
              {estimating ? (
                <><Loader2 size={14} className="animate-spin" />Calcul en cours…</>
              ) : (
                <><Cpu size={14} />Estimer (IA)</>
              )}
            </button>
          )}
          <button
            onClick={onSave}
            disabled={loading || estimating || hasDateErrors}
            title={hasDateErrors ? 'Corrigez les erreurs de dates avant de sauvegarder.' : undefined}
            className="
              w-full sm:w-auto
              flex items-center justify-center gap-1.5
              px-4 py-2 rounded-xl font-semibold text-sm
              bg-teal-500 text-white
              hover:bg-teal-600
              disabled:bg-teal-200 disabled:text-teal-400 disabled:cursor-not-allowed
              shadow-[0_2px_8px_rgba(20,184,166,0.25)]
              active:scale-95 transition-all duration-150
            "
          >
            {estimating ? (
              <><Loader2 size={14} className="animate-spin" />Estimation IA…</>
            ) : (
              <><Save size={14} />Enregistrer</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};