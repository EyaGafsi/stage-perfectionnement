'use client';
// ─── CallCenterSprintForm.tsx ─────────────────────────────────────────────────

import React, { useMemo } from 'react';
import {
  Plus, Save, Loader2, ListTodo, Cpu, DollarSign,
  Target, TrendingUp, Calendar, Phone, Star, AlertTriangle,
} from 'lucide-react';
import type { SprintCallCenter, TaskCallCenter, ProjectMember } from '../services/Types';
import { inputClass, labelClass, getEmptyTask } from '../services/Types';
import { CallCenterTaskForm } from './Callcentertaskform';
import {validateSprintDatesGeneric} from '../services/Datevalidation';

interface CallCenterSprintFormProps {
  mode: 'create' | 'edit';
  sprint: SprintCallCenter;
  tasks: TaskCallCenter[];
  members: ProjectMember[];
  loading: boolean;
  estimating: boolean;
  estimatingTaskIdx: number | null;
  allSprints: SprintCallCenter[];
  projectStartDate?: string | null;
  projectEndDate?:   string | null;
  onSprintChange: (field: keyof SprintCallCenter, value: unknown) => void;
  onTaskChange: (index: number, field: keyof TaskCallCenter, value: unknown) => void;
  onAddTask: () => void;
  onRemoveTask: (index: number) => void;
  onEstimateTask: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const CallCenterSprintForm: React.FC<CallCenterSprintFormProps> = ({
  mode, sprint, tasks, members, loading, estimating, estimatingTaskIdx,
  allSprints, projectStartDate, projectEndDate,
  onSprintChange, onTaskChange, onAddTask, onRemoveTask, onEstimateTask,
  onSave, onCancel,
}) => {
  const sprintDateError = useMemo(
    () =>
      validateSprintDatesGeneric(
        sprint.id,
        sprint.startDate,
        sprint.endDate,
        projectStartDate,
        projectEndDate,
        allSprints,
      ),
    [sprint.id, sprint.startDate, sprint.endDate, projectStartDate, projectEndDate, allSprints],
  );

  const projMin = projectStartDate ? projectStartDate.split('T')[0] : undefined;
  const projMax = projectEndDate   ? projectEndDate.split('T')[0]   : undefined;
  const endMin  = sprint.startDate ? sprint.startDate.split('T')[0] : projMin;

  const content = (
    <div className="p-6 space-y-6">

      {estimating && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-blue-700 text-sm font-medium">
          <Loader2 size={18} className="animate-spin flex-shrink-0" />
          Estimation de la durée des tâches en cours…
        </div>
      )}

      {sprintDateError && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertTriangle size={16} className="shrink-0" />
          {sprintDateError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

        {/* Name */}
        <div className="md:col-span-5">
          <label className={labelClass}>Nom du ticket *</label>
          <input
            type="text" placeholder="Ex: Sprint Relance Q3 – Agents Équipe A" className={inputClass}
            value={sprint.name} onChange={(e) => onSprintChange('name', e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className={labelClass}>Statut</label>
          <select className={inputClass} value={sprint.status} onChange={(e) => onSprintChange('status', e.target.value)}>
            <option value="planned">Planifié</option>
            <option value="active">Actif</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>

        {/* Priority */}
        <div className="md:col-span-2">
          <label className={labelClass}>Priorité</label>
          <select className={inputClass} value={sprint.priority ?? 'Medium'} onChange={(e) => onSprintChange('priority', e.target.value)}>
            <option value="Low">Basse</option>
            <option value="Medium">Moyenne</option>
            <option value="High">Haute</option>
          </select>
        </div>

        {/* Complexity */}
        <div className="md:col-span-2">
          <label className={labelClass}>Complexité</label>
          <select className={inputClass} value={sprint.complexity ?? 'Medium'} onChange={(e) => onSprintChange('complexity', e.target.value)}>
            <option value="Low">Basse</option>
            <option value="Medium">Moyenne</option>
            <option value="High">Haute</option>
          </select>
        </div>

        {/* Start date */}
        <div className="md:col-span-3">
          <label className={labelClass}>
            <Calendar size={11} className="inline mr-1" />Début *
            {projMin && (
              <span className="ml-1 text-slate-400 font-normal normal-case text-[10px]">
                min {projMin}
              </span>
            )}
          </label>
          <input
            type="date"
            className={`${inputClass} ${sprintDateError ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
            value={sprint.startDate?.split('T')[0] ?? ''}
            min={projMin}
            max={projMax}
            onChange={(e) => onSprintChange('startDate', e.target.value)}
          />
        </div>

        {/* End date */}
        <div className="md:col-span-3">
          <label className={labelClass}>
            <Calendar size={11} className="inline mr-1" />Fin *
            {projMax && (
              <span className="ml-1 text-slate-400 font-normal normal-case text-[10px]">
                max {projMax}
              </span>
            )}
          </label>
          <input
            type="date"
            className={`${inputClass} ${sprintDateError ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
            value={sprint.endDate?.split('T')[0] ?? ''}
            min={endMin}
            max={projMax}
            onChange={(e) => onSprintChange('endDate', e.target.value)}
          />
        </div>

        {/* Target agents */}
        <div className="md:col-span-2">
          <label className={labelClass}><Phone size={11} className="inline mr-1" />Agents cibles</label>
          <input
            type="number" min="0" placeholder="0" className={inputClass}
            value={sprint.targetAgents || ''}
            onChange={(e) => onSprintChange('targetAgents', e.target.value)}
          />
        </div>

        {/* Expected call volume */}
        <div className="md:col-span-2">
          <label className={labelClass}>Volume d'appels</label>
          <input
            type="number" min="0" placeholder="0" className={inputClass}
            value={sprint.expectedCallVolume || ''}
            onChange={(e) => onSprintChange('expectedCallVolume', e.target.value)}
          />
        </div>

        {/* Target conversion rate */}
        <div className="md:col-span-2">
          <label className={labelClass}><TrendingUp size={11} className="inline mr-1" />Conv. cible (%)</label>
          <input
            type="number" min="0" max="100" step="0.1" placeholder="0" className={inputClass}
            value={sprint.targetConversionRate || ''}
            onChange={(e) => onSprintChange('targetConversionRate', e.target.value)}
          />
        </div>

        {/* Budget allocated */}
        <div className="md:col-span-2">
          <label className={labelClass}><DollarSign size={11} className="inline mr-1" />Budget (TND)</label>
          <input
            type="number" min="0" placeholder="0" className={inputClass}
            value={sprint.budgetAllocated || ''}
            onChange={(e) => onSprintChange('budgetAllocated', e.target.value)}
          />
        </div>

        {/* Quality score target */}
        <div className="md:col-span-2">
          <label className={labelClass}><Star size={11} className="inline mr-1" />Score qualité</label>
          <input
            type="number" min="0" max="100" placeholder="0" className={inputClass}
            value={sprint.qualityScoreTarget || ''}
            onChange={(e) => onSprintChange('qualityScoreTarget', e.target.value)}
          />
        </div>

        {/* Goals */}
        <div className="md:col-span-4">
          <label className={labelClass}><Target size={11} className="inline mr-1" />Objectifs</label>
          <input
            type="text" placeholder="Leads qualifiés, rétention, satisfaction…" className={inputClass}
            value={sprint.goals ?? ''}
            onChange={(e) => onSprintChange('goals', e.target.value)}
          />
        </div>

        {/* Training content */}
        <div className="md:col-span-4">
          <label className={labelClass}>Contenu de formation</label>
          <input
            type="text" placeholder="Module de formation utilisé…" className={inputClass}
            value={sprint.trainingContent ?? ''}
            onChange={(e) => onSprintChange('trainingContent', e.target.value)}
          />
        </div>

        {/* Script templates */}
        <div className="md:col-span-4">
          <label className={labelClass}>Scripts / templates</label>
          <input
            type="text" placeholder="Script V2, Template relance…" className={inputClass}
            value={sprint.scriptTemplates ?? ''}
            onChange={(e) => onSprintChange('scriptTemplates', e.target.value)}
          />
        </div>
      </div>

      {/* Tasks */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <ListTodo size={18} /> Tâches ({tasks.length})
          </h3>
          <button
            type="button" onClick={onAddTask}
            className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>

        <div className="space-y-4 max-h-[36rem] overflow-y-auto pr-1">
          {tasks.map((task, idx) => (
            <CallCenterTaskForm
              key={task.id ?? `new-${idx}`}
              task={task}
              index={idx}
              members={members}
              mode="inline"
              isEstimating={estimatingTaskIdx === idx}
              showRemoveButton={tasks.length > 1}
              onChange={(field, value) => onTaskChange(idx, field, value)}
              onEstimate={() => onEstimateTask(idx)}
              onRemove={() => onRemoveTask(idx)}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-blue-600 flex items-center gap-1.5">
        <Cpu size={12} />
        La durée est estimée selon le volume d'appels, le taux de conversion et le nombre d'agents.
      </p>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={onSave}
          disabled={loading || estimating || !!sprintDateError}
          title={sprintDateError ?? undefined}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold
                     hover:bg-blue-700 disabled:bg-blue-400 transition-colors shadow-md shadow-blue-200"
        >
          {estimating
            ? <><Loader2 size={18} className="animate-spin" />Estimation…</>
            : <><Save size={18} />{loading ? 'Enregistrement…' : mode === 'create' ? 'Créer le Ticket' : 'Enregistrer'}</>}
        </button>
      </div>
    </div>
  );

  if (mode === 'edit') return content;

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Plus className="text-blue-500" size={22} />
          Nouveau Ticket Call Center
        </h2>
      </div>
      {content}
    </div>
  );
};