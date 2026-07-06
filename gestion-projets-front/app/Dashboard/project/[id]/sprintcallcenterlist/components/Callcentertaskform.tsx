'use client';
// ─── CallCenterTaskForm.tsx ───────────────────────────────────────────────────

import React from 'react';
import {
  Trash2, Save, Loader2, Cpu, Calendar, User, Phone, ShieldAlert, Layers,
} from 'lucide-react';
import type {
  TaskCallCenter,
  TaskCallCenterType,
  TaskCallCenterStatus,
  TaskCallCenterPriority,
  ProjectMember,
} from '../services/Types';
import { inputClass, labelClass } from '../services/Types';
import { formatHours, safeNum } from '../services/Callcenterestimationservice';

interface CallCenterTaskFormProps {
  task: TaskCallCenter;
  index?: number;
  members: ProjectMember[];
  mode: 'inline' | 'edit';
  isEstimating?: boolean;
  loading?: boolean;
  showRemoveButton?: boolean;
  onChange: (field: keyof TaskCallCenter, value: unknown) => void;
  onEstimate?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onRemove?: () => void;
}

const TASK_TYPES: TaskCallCenterType[] = [
  'OUTBOUND', 'INBOUND', 'FOLLOW_UP', 'SURVEY', 'APPOINTMENT',
  'RETENTION', 'UPSELL', 'SUPPORT', 'TRAINING', 'QA', 'OTHER',
];

const TYPE_LABEL: Record<string, string> = {
  OUTBOUND:    'Sortant',
  INBOUND:     'Entrant',
  FOLLOW_UP:   'Suivi',
  SURVEY:      'Sondage',
  APPOINTMENT: 'RDV',
  RETENTION:   'Rétention',
  UPSELL:      'Upsell',
  SUPPORT:     'Support',
  TRAINING:    'Formation',
  QA:          'Contrôle qualité',
  OTHER:       'Autre',
};

export const CallCenterTaskForm: React.FC<CallCenterTaskFormProps> = ({
  task, index, members, mode,
  isEstimating = false, loading = false, showRemoveButton = false,
  onChange, onEstimate, onSave, onCancel, onRemove,
}) => {
  const isExisting = !!task.id;
  const aiHours    = task.aiEstimatedHours ?? task.estimatedHours ?? 0;

  const assignedId = (() => {
    if (!task.assignedTo) return '';
    if (typeof task.assignedTo === 'object' && 'id' in task.assignedTo)
      return String((task.assignedTo as any).id);
    return String(task.assignedTo);
  })();

  return (
    <div
      className={
        mode === 'edit'
          ? 'p-5 bg-blue-50 border border-blue-200 rounded-xl mt-3 space-y-4'
          : 'p-5 bg-slate-50 border border-slate-200 rounded-xl'
      }
    >
      {/* ── Header inline ── */}
      {mode === 'inline' && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-slate-700">
            Tâche {index !== undefined ? index + 1 : ''}{' '}
            <span className="text-xs font-normal text-slate-400">
              {isExisting ? '(existante)' : '(nouvelle)'}
            </span>
          </span>
          <div className="flex items-center gap-2">
            {onEstimate && (
              <button
                type="button" onClick={onEstimate}
                disabled={isEstimating || !task.title.trim()}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1
                           bg-blue-100 text-blue-700 hover:bg-blue-200
                           disabled:opacity-50 rounded-lg transition-colors"
              >
                {isEstimating
                  ? <><Loader2 size={12} className="animate-spin" />Estimation…</>
                  : <><Cpu size={12} />Estimer</>}
              </button>
            )}
            {showRemoveButton && !isExisting && (
              <button
                onClick={onRemove}
                className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Header edit ── */}
      {mode === 'edit' && (
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-blue-800">Éditer la tâche</h5>
          {onEstimate && (
            <button
              type="button" onClick={onEstimate} disabled={isEstimating}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5
                         bg-blue-100 text-blue-700 hover:bg-blue-200
                         disabled:opacity-50 rounded-lg transition-colors"
            >
              {isEstimating
                ? <><Loader2 size={13} className="animate-spin" />Estimation…</>
                : <><Cpu size={13} />Re-estimer</>}
            </button>
          )}
        </div>
      )}

      {/* ── AI badge ── */}
      {aiHours > 0 && (
        <div className="flex items-center gap-2 text-sm text-blue-700
                        bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <Cpu size={13} />
          Estimation IA : <strong className="ml-1">{formatHours(aiHours)}</strong>
        </div>
      )}

      {/* ── Champs principaux ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

        {/* Titre */}
        <div className="md:col-span-6">
          <label className={labelClass}>Titre *</label>
          <input
            type="text" placeholder="Ex: Campagne relance clients inactifs"
            className={inputClass} value={task.title ?? ''}
            onChange={(e) => onChange('title', e.target.value)}
          />
        </div>

        {/* Assigné à */}
        <div className="md:col-span-3">
          <label className={labelClass}>
            <User size={11} className="inline mr-1" />Assigné à
          </label>
          <select
            className={inputClass} value={assignedId}
            onChange={(e) => onChange('assignedTo', e.target.value)}
          >
            <option value="">Non assigné</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()}
                {m.level ? ` (${m.level})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="md:col-span-3">
          <label className={labelClass}>Type</label>
          <select
            className={inputClass} value={task.type ?? 'SUPPORT'}
            onChange={(e) => onChange('type', e.target.value as TaskCallCenterType)}
          >
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-12">
          <label className={labelClass}>Description</label>
          <textarea
            rows={2} placeholder="Objectifs, script utilisé, critères de succès…"
            className={`${inputClass} resize-none`}
            value={task.description ?? ''}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </div>

        {/* Statut */}
        <div className="md:col-span-2">
          <label className={labelClass}>Statut</label>
          <select
            className={inputClass} value={task.status ?? 'TO_DO'}
            onChange={(e) => onChange('status', e.target.value as TaskCallCenterStatus)}
          >
            <option value="TO_DO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="IN_REVIEW">En révision</option>
            <option value="DONE">Fait</option>
            <option value="BLOCKED">Bloqué</option>
          </select>
        </div>

        {/* Priorité */}
        <div className="md:col-span-2">
          <label className={labelClass}>Priorité</label>
          <select
            className={inputClass} value={task.priority ?? ''}
            onChange={(e) => onChange('priority', e.target.value as TaskCallCenterPriority)}
          >
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </select>
        </div>

        {/* Nb agents */}
        <div className="md:col-span-2">
          <label className={labelClass}>
            <Phone size={11} className="inline mr-1" />Nb agents
          </label>
          <input
            type="number" min="0" placeholder="0" className={inputClass}
            value={safeNum(task.targetAgentCount) || ''}
            onChange={(e) => onChange('targetAgentCount', e.target.value)}
          />
        </div>

        {/* Script */}
        <div className="md:col-span-3">
          <label className={labelClass}>Script utilisé</label>
          <input
            type="text" placeholder="Nom ou référence du script" className={inputClass}
            value={task.scriptContent ?? ''}
            onChange={(e) => onChange('scriptContent', e.target.value)}
          />
        </div>

        {/* Date début prévue */}
        <div className="md:col-span-3">
          <label className={labelClass}>
            <Calendar size={11} className="inline mr-1" />Date début prévue
          </label>
          <input
            type="date" className={inputClass}
            value={task.scheduledStartDate?.split('T')[0] ?? ''}
            onChange={(e) => onChange('scheduledStartDate', e.target.value)}
          />
        </div>

        {/* Date fin prévue */}
        <div className="md:col-span-3">
          <label className={labelClass}>
            <Calendar size={11} className="inline mr-1" />Date fin prévue
          </label>
          <input
            type="date" className={inputClass}
            value={task.scheduledEndDate?.split('T')[0] ?? ''}
            onChange={(e) => onChange('scheduledEndDate', e.target.value)}
          />
        </div>

        {/* ── Section données pour le modèle ML ── */}
        <div className="md:col-span-12 mt-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Données pour l'estimation IA
          </p>
        </div>

        {/* Appels / agent */}
        <div className="md:col-span-4">
          <label className={labelClass}>Appels / agent</label>
          <input
            type="number" step="any" placeholder="50" className={inputClass}
            value={safeNum(task.expectedCallsPerAgent) || ''}
            onChange={(e) => onChange('expectedCallsPerAgent', e.target.value)}
          />
        </div>

        {/* Taux conversion */}
        <div className="md:col-span-4">
          <label className={labelClass}>Taux conv. cible (%)</label>
          <input
            type="number" step="any" placeholder="15" className={inputClass}
            value={safeNum(task.targetConversionRate) || ''}
            onChange={(e) => onChange('targetConversionRate', e.target.value)}
          />
        </div>

        {/* Score qualité */}
        <div className="md:col-span-4">
          <label className={labelClass}>Score qualité cible</label>
          <input
            type="number" step="any" placeholder="85" className={inputClass}
            value={safeNum(task.qualityScoreTarget) || ''}
            onChange={(e) => onChange('qualityScoreTarget', e.target.value)}
          />
        </div>

      {/* Complexité */}
<div className="md:col-span-4">
  <label className={labelClass}>
    <Layers size={11} className="inline mr-1" />Complexité (1–5)
  </label>
  <input
    type="number" min="1" max="5" placeholder="3" className={inputClass}
    value={safeNum(task.complexityScore) || ''}
    onChange={(e) => onChange('complexityScore', Number(e.target.value))}  // ← Number()
  />
</div>

{/* Niveau risque */}
<div className="md:col-span-4">
  <label className={labelClass}>
    <ShieldAlert size={11} className="inline mr-1" />Niveau risque (1–5)
  </label>
  <input
    type="number" min="1" max="5" placeholder="2" className={inputClass}
    value={safeNum(task.riskLevel) || ''}
    onChange={(e) => onChange('riskLevel', Number(e.target.value))}  // ← Number()
  />
</div>
      </div>

      {/* ── Boutons Save / Cancel (mode edit uniquement) ── */}
      {mode === 'edit' && (
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg
                       font-semibold hover:bg-slate-300 text-sm transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onSave} disabled={loading || isEstimating}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white
                       rounded-lg font-semibold hover:bg-blue-700
                       disabled:bg-blue-400 text-sm transition-colors"
          >
            {isEstimating
              ? <><Loader2 size={14} className="animate-spin" />Estimation…</>
              : <><Save size={14} />Enregistrer</>}
          </button>
        </div>
      )}
    </div>
  );
};