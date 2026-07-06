'use client';
// ─── MarketingSprintForm.tsx ──────────────────────────────────────────────────
// Design: Light + Turquoise — responsive mobile/desktop

import React, { useMemo } from 'react';
import {
  Plus, Save, Loader2, ListTodo, Cpu, DollarSign,
  Target, TrendingUp, Radio, Calendar, AlertTriangle,
} from 'lucide-react';
import type {
  SprintMarketing, TaskMarketing, ProjectMember,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';
import { inputClass, labelClass, getEmptyTask } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';
import { MarketingTaskForm } from './Marketingtaskform';
import { validateSprintDates } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Datevalidation';

interface MarketingSprintFormProps {
  mode: 'create' | 'edit';
  sprint: SprintMarketing;
  tasks: TaskMarketing[];
  members: ProjectMember[];
  loading: boolean;
  estimating: boolean;
  estimatingTaskIdx: number | null;
  allSprints: SprintMarketing[];
  projectStartDate?: string | null;
  projectEndDate?:   string | null;
  onSprintChange: (field: keyof SprintMarketing, value: unknown) => void;
  onTaskChange: (index: number, field: keyof TaskMarketing, value: unknown) => void;
  onAddTask: () => void;
  onRemoveTask: (index: number) => void;
  onEstimateTask: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

// ─── Shared field styles (overrides the imported ones for turquoise theme) ────
const fieldInput = `
  w-full px-3 py-2 rounded-lg text-sm text-slate-800
  bg-white border border-slate-200
  placeholder:text-slate-300
  focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400
  transition-all duration-150
`;

const fieldLabel = `
  block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5
`;

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-600">{icon}</span>
    <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wide">{title}</h3>
  </div>
);

export const MarketingSprintForm: React.FC<MarketingSprintFormProps> = ({
  mode, sprint, tasks, members, loading, estimating, estimatingTaskIdx,
  allSprints, projectStartDate, projectEndDate,
  onSprintChange, onTaskChange, onAddTask, onRemoveTask, onEstimateTask,
  onSave, onCancel,
}) => {

  // ── Sprint date validation ────────────────────────────────────────────────
  const sprintDateError = useMemo(
    () =>
      validateSprintDates(
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

  // ── Date input style (highlight on error) ─────────────────────────────────
  const dateInputClass = `${fieldInput} ${
    sprintDateError ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/30' : ''
  }`;

  const content = (
    <div className="p-4 sm:p-6 space-y-6">

      {/* ── AI estimating banner ─────────────────────────────────────────── */}
      {estimating && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 text-sm font-medium">
          <Loader2 size={17} className="animate-spin shrink-0 text-cyan-500" />
          Estimation IA de la durée des tâches en cours…
        </div>
      )}

      {/* ── Date error banner ────────────────────────────────────────────── */}
      {sprintDateError && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <AlertTriangle size={16} className="shrink-0 text-amber-500" />
          {sprintDateError}
        </div>
      )}

      {/* ── Section 1 : Sprint identity ──────────────────────────────────── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
        <SectionHeader icon={<Radio size={14} />} title="Identité de la campagne" />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">

          {/* Name */}
          <div className="sm:col-span-2 md:col-span-5">
            <label className={fieldLabel}>Nom de la campagne *</label>
            <input
              type="text"
              placeholder="Ex: Campagne Été – Social & Email"
              className={fieldInput}
              value={sprint.name}
              onChange={(e) => onSprintChange('name', e.target.value)}
            />
          </div>

          {/* Campaign type */}
          <div className="md:col-span-3">
            <label className={fieldLabel}>
              <Radio size={10} className="inline mr-1 text-cyan-400" />
              Type de campagne
            </label>
            <select
              className={fieldInput}
              value={sprint.campaignType ?? ''}
              onChange={(e) => onSprintChange('campaignType', e.target.value)}
            >
              <option value="">Sélectionner…</option>
              {['Email','Social Media','SEO','PPC','Content','Video','Influencer','Event','PR','Mixed'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <label className={fieldLabel}>Statut</label>
            <select
              className={fieldInput}
              value={sprint.status}
              onChange={(e) => onSprintChange('status', e.target.value)}
            >
              <option value="planned">Planifié</option>
              <option value="active">Actif</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          {/* Priority */}
          <div className="md:col-span-1">
            <label className={fieldLabel}>Priorité</label>
            <select
              className={fieldInput}
              value={sprint.priority ?? 'Medium'}
              onChange={(e) => onSprintChange('priority', e.target.value)}
            >
              <option value="Low">Basse</option>
              <option value="Medium">Moyenne</option>
              <option value="High">Haute</option>
            </select>
          </div>

          {/* Complexity */}
          <div className="md:col-span-1">
            <label className={fieldLabel}>Complexité</label>
            <select
              className={fieldInput}
              value={sprint.complexity ?? 'Medium'}
              onChange={(e) => onSprintChange('complexity', e.target.value)}
            >
              <option value="Low">Basse</option>
              <option value="Medium">Moyenne</option>
              <option value="High">Haute</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 2 : Dates & Budget ───────────────────────────────────── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
        <SectionHeader icon={<Calendar size={14} />} title="Période & budget" />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">

          {/* Start date */}
          <div className="md:col-span-2">
            <label className={fieldLabel}>
              <Calendar size={10} className="inline mr-1 text-cyan-400" />
              Début *
              {projMin && (
                <span className="ml-1 text-slate-300 font-normal normal-case text-[10px]">
                  min {projMin}
                </span>
              )}
            </label>
            <input
              type="date"
              className={dateInputClass}
              value={sprint.startDate?.split('T')[0] ?? ''}
              min={projMin}
              max={projMax}
              onChange={(e) => onSprintChange('startDate', e.target.value)}
            />
          </div>

          {/* End date */}
          <div className="md:col-span-2">
            <label className={fieldLabel}>
              <Calendar size={10} className="inline mr-1 text-cyan-400" />
              Fin *
              {projMax && (
                <span className="ml-1 text-slate-300 font-normal normal-case text-[10px]">
                  max {projMax}
                </span>
              )}
            </label>
            <input
              type="date"
              className={dateInputClass}
              value={sprint.endDate?.split('T')[0] ?? ''}
              min={endMin}
              max={projMax}
              onChange={(e) => onSprintChange('endDate', e.target.value)}
            />
          </div>

          {/* Budget */}
          <div className="md:col-span-2">
            <label className={fieldLabel}>
              <DollarSign size={10} className="inline mr-1 text-cyan-400" />
              Budget (€)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className={fieldInput}
              value={sprint.totalBudget || ''}
              onChange={(e) => onSprintChange('totalBudget', e.target.value)}
            />
          </div>

          {/* Target audience */}
          <div className="sm:col-span-2 md:col-span-3">
            <label className={fieldLabel}>
              <Target size={10} className="inline mr-1 text-cyan-400" />
              Public cible
            </label>
            <input
              type="text"
              placeholder="B2B SaaS, 25-45 ans…"
              className={fieldInput}
              value={sprint.targetAudience ?? ''}
              onChange={(e) => onSprintChange('targetAudience', e.target.value)}
            />
          </div>

          {/* Channels */}
          <div className="sm:col-span-2 md:col-span-3">
            <label className={fieldLabel}>Canaux</label>
            <input
              type="text"
              placeholder="Google; Facebook; Email…"
              className={fieldInput}
              value={sprint.channels ?? ''}
              onChange={(e) => onSprintChange('channels', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Section 3 : Objectifs & KPIs ─────────────────────────────────── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
        <SectionHeader icon={<TrendingUp size={14} />} title="Objectifs & KPIs" />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">

          {/* Goals */}
          <div className="sm:col-span-2 md:col-span-6">
            <label className={fieldLabel}>
              <TrendingUp size={10} className="inline mr-1 text-cyan-400" />
              Objectifs
            </label>
            <input
              type="text"
              placeholder="Leads, Conversion, Trafic…"
              className={fieldInput}
              value={sprint.goals ?? ''}
              onChange={(e) => onSprintChange('goals', e.target.value)}
            />
          </div>

          {/* Reach */}
          <div className="md:col-span-2">
            <label className={fieldLabel}>Portée attendue</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className={fieldInput}
              value={sprint.expectedReach || ''}
              onChange={(e) => onSprintChange('expectedReach', e.target.value)}
            />
          </div>

          {/* Leads */}
          <div className="md:col-span-2">
            <label className={fieldLabel}>Leads attendus</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className={fieldInput}
              value={sprint.expectedLeads || ''}
              onChange={(e) => onSprintChange('expectedLeads', e.target.value)}
            />
          </div>

          {/* ROI */}
          <div className="md:col-span-2">
            <label className={fieldLabel}>ROI attendu (%)</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className={fieldInput}
              value={sprint.expectedROI || ''}
              onChange={(e) => onSprintChange('expectedROI', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Section 4 : Tasks ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-cyan-100 bg-cyan-50/30 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-600">
              <ListTodo size={14} />
            </span>
            <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wide">
              Tâches
              <span className="ml-2 px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold normal-case">
                {tasks.length}
              </span>
            </h3>
          </div>

          <button
            type="button"
            onClick={onAddTask}
            className="
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
              bg-cyan-500 text-white
              hover:bg-cyan-600 active:bg-cyan-700
              transition-colors shadow-sm shadow-cyan-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
            "
          >
            <Plus size={15} />
            <span>Ajouter</span>
          </button>
        </div>

        <div className="space-y-3 max-h-[36rem] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-200">
          {tasks.map((task, idx) => (
            <MarketingTaskForm
              key={task.id ?? `new-${idx}`}
              task={task}
              index={idx}
              members={members}
              mode="inline"
              sprint={sprint}
              isEstimating={estimatingTaskIdx === idx}
              showRemoveButton={tasks.length > 1}
              onChange={(field, value) => onTaskChange(idx, field, value)}
              onEstimate={() => onEstimateTask(idx)}
              onRemove={() => onRemoveTask(idx)}
            />
          ))}
        </div>
      </div>

      {/* ── AI note ──────────────────────────────────────────────────────── */}
      <p className="flex items-center gap-1.5 text-xs text-violet-500 px-1">
        <Cpu size={12} className="shrink-0" />
        La durée est estimée par le modèle ML marketing (coût, impressions, clics, conversions, canal…).
      </p>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={onCancel}
          className="
            px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600
            bg-white border border-slate-200
            hover:bg-slate-50 hover:border-slate-300
            transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300
          "
        >
          Annuler
        </button>

        <button
          onClick={onSave}
          disabled={loading || estimating || !!sprintDateError}
          title={sprintDateError ?? undefined}
          className="
            inline-flex items-center justify-center gap-2
            px-6 py-2.5 rounded-xl font-semibold text-sm text-white
            bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700
            disabled:bg-cyan-200 disabled:cursor-not-allowed
            shadow-sm shadow-cyan-200
            transition-all
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
          "
        >
          {estimating ? (
            <><Loader2 size={16} className="animate-spin" />Estimation IA…</>
          ) : (
            <><Save size={16} />{loading ? 'Enregistrement…' : mode === 'create' ? 'Créer la Campagne' : 'Enregistrer'}</>
          )}
        </button>
      </div>
    </div>
  );

  if (mode === 'edit') return content;

  // ── Create mode wrapper ───────────────────────────────────────────────────
  return (
    <div className="mb-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="
        px-5 sm:px-6 py-4
        bg-gradient-to-r from-cyan-50 to-white
        border-b border-cyan-100
      ">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-600">
            <Plus size={18} />
          </span>
          Nouvelle Campagne Marketing
        </h2>
      </div>

      {content}
    </div>
  );
};