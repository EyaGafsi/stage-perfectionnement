'use client';
// ─── MarketingTaskForm.tsx ────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import {
  Trash2, Save, Loader2, Cpu, Calendar, DollarSign, User, AlertTriangle,
  ChevronDown, Zap, Target, BarChart2, MousePointer, Users, TrendingUp,
} from 'lucide-react';
import type {
  TaskMarketing,
  TaskMarketingType,
  TaskMarketingStatus,
  TaskMarketingPriority,
  ProjectMember,
  SprintMarketing,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';
import {
  inputClass as _inputClass,
  labelClass as _labelClass,
  CHANNEL_OPTIONS,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';
import {
  formatHours,
  safeNum,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Marketingestimationservice';
import { validateTaskDates } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Datevalidation';

// ✅ Nouveau composant date-picker restreint aux bornes du sprint
import { SprintDatePicker } from './SprintDatePicker';

// ─── Design tokens — Turquoise / Light theme ─────────────────────────────────
const t = {
  input: [
    'w-full rounded-xl border border-teal-100 bg-white/80 backdrop-blur-sm',
    'px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400',
    'transition-all duration-200 shadow-sm hover:border-teal-300',
  ].join(' '),

  inputError: [
    'w-full rounded-xl border border-amber-300 bg-amber-50/50',
    'px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400',
    'transition-all duration-200 shadow-sm',
  ].join(' '),

  label:       'block text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1.5',
  sectionHead: 'text-[10px] font-bold text-teal-500/70 uppercase tracking-widest mb-3 flex items-center gap-2',

  cardInline: [
    'rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/40',
    'shadow-sm shadow-teal-100/50 overflow-hidden',
  ].join(' '),

  cardEdit: [
    'rounded-2xl border border-teal-300 bg-gradient-to-br from-teal-50 to-cyan-50/60',
    'shadow-md shadow-teal-200/40 overflow-hidden',
  ].join(' '),

  headerInline: 'px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 flex justify-between items-center',
  headerEdit:   'px-5 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-500 flex justify-between items-center',

  btnEstimate: [
    'flex items-center gap-1.5 text-xs font-bold px-3 py-1.5',
    'bg-white/20 text-white border border-white/30 rounded-xl',
    'hover:bg-white/30 disabled:opacity-50 transition-all duration-200 backdrop-blur-sm',
  ].join(' '),

  btnSave: [
    'flex items-center gap-2 px-5 py-2.5 text-sm font-bold',
    'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl',
    'hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50',
    'shadow-md shadow-teal-300/50 transition-all duration-200',
  ].join(' '),

  btnCancel: [
    'px-5 py-2.5 text-sm font-semibold text-teal-700',
    'bg-teal-50 border border-teal-200 rounded-xl',
    'hover:bg-teal-100 transition-all duration-200',
  ].join(' '),

  btnRemove: 'text-white/60 hover:text-white/90 p-1.5 rounded-lg hover:bg-white/10 transition-colors',

  channelActive:   'text-xs px-3 py-1 rounded-full border font-semibold bg-teal-500 text-white border-teal-500 shadow-sm shadow-teal-300/40 transition-all duration-200',
  channelInactive: 'text-xs px-3 py-1 rounded-full border font-semibold bg-white text-teal-600 border-teal-200 hover:border-teal-400 hover:bg-teal-50 transition-all duration-200',

  aiBadge: [
    'flex items-center gap-2 text-sm font-medium text-teal-700',
    'bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200',
    'rounded-xl px-4 py-2.5 shadow-sm',
  ].join(' '),

  warnBadge: [
    'flex items-center gap-2 text-xs text-amber-700',
    'bg-amber-50 border border-amber-200 rounded-xl px-3 py-2',
  ].join(' '),

  select: [
    'w-full rounded-xl border border-teal-100 bg-white/80',
    'px-3.5 py-2.5 text-sm text-slate-700 appearance-none',
    'focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400',
    'transition-all duration-200 shadow-sm hover:border-teal-300',
    'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2314b8a6\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center]',
  ].join(' '),
};

// ─── Enum values ──────────────────────────────────────────────────────────────
const TASK_TYPE_OPTIONS = [
  { value: 'ANALYTICS',        label: 'Analytique'        },
  { value: 'CAMPAIGN',         label: 'Campagne'          },
  { value: 'CONTENT_CREATION', label: 'Création contenu'  },
  { value: 'COPYWRITING',      label: 'Copywriting'       },
  { value: 'DESIGN',           label: 'Design'            },
  { value: 'EMAIL',            label: 'Email'             },
  { value: 'PPC',              label: 'PPC'               },
  { value: 'SEO',              label: 'SEO'               },
  { value: 'SOCIAL_MEDIA',     label: 'Réseaux sociaux'   },
  { value: 'OTHER',            label: 'Autre'             },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface MarketingTaskFormProps {
  task: TaskMarketing;
  index?: number;
  members: ProjectMember[];
  mode: 'inline' | 'edit';
  sprint?: SprintMarketing;
  isEstimating?: boolean;
  loading?: boolean;
  showRemoveButton?: boolean;
  onChange: (field: keyof TaskMarketing, value: unknown) => void;
  onEstimate?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onRemove?: () => void;
}

const resolveAssignedId = (val: TaskMarketing['assignedTo']): string => {
  if (!val) return '';
  if (typeof val === 'object' && 'id' in val) return String((val as { id: number }).id);
  return String(val);
};

// ─── Component ────────────────────────────────────────────────────────────────
export const MarketingTaskForm: React.FC<MarketingTaskFormProps> = ({
  task,
  index,
  members,
  mode,
  sprint,
  isEstimating = false,
  loading = false,
  showRemoveButton = false,
  onChange,
  onEstimate,
  onSave,
  onCancel,
  onRemove,
}) => {
  const isExisting = !!task.id;
  const aiHours    = task.aiEstimatedHours ?? task.estimatedHours ?? 0;
  const assignedId = resolveAssignedId(task.assignedTo);

  // ── Bornes du sprint (format YYYY-MM-DD) ──────────────────────────────────
  const sprintMinDate = sprint?.startDate ? sprint.startDate.split('T')[0] : undefined;
  const sprintMaxDate = sprint?.endDate   ? sprint.endDate.split('T')[0]   : undefined;

  // ── Pour la date de fin : min = date début tâche (si remplie) ou début sprint
  const taskStartVal = task.scheduledStartDate
    ? String(task.scheduledStartDate).split('T')[0]
    : undefined;
  const endMin = taskStartVal || sprintMinDate;

  // ── Valeurs courantes (YYYY-MM-DD) ────────────────────────────────────────
  const startVal = task.scheduledStartDate
    ? String(task.scheduledStartDate).split('T')[0]
    : null;
  const endVal = task.scheduledEndDate
    ? String(task.scheduledEndDate).split('T')[0]
    : null;

  // ── Validation ────────────────────────────────────────────────────────────
  const dateError = useMemo(
    () =>
      sprint
        ? validateTaskDates(
            task.scheduledStartDate,
            task.scheduledEndDate,
            sprint.startDate,
            sprint.endDate,
          )
        : null,
    [task.scheduledStartDate, task.scheduledEndDate, sprint],
  );

  // ── Channel multi-picker ──────────────────────────────────────────────────
  const selectedChannels: string[] = useMemo(
    () => (task.channel ?? '').split(';').map((s) => s.trim()).filter(Boolean),
    [task.channel],
  );

  const toggleChannel = (ch: string) => {
    const next = selectedChannels.includes(ch)
      ? selectedChannels.filter((c) => c !== ch)
      : [...selectedChannels, ch];
    onChange('channel', next.join(';'));
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={mode === 'edit' ? t.cardEdit : t.cardInline}>

      {/* ── Header stripe ──────────────────────────────────────────── */}
      <div className={mode === 'edit' ? t.headerEdit : t.headerInline}>
        {mode === 'inline' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                {index !== undefined ? index + 1 : '–'}
              </span>
              <span className="text-sm font-bold text-white">
                {task.title.trim() || 'Nouvelle tâche'}
              </span>
              <span className="text-[10px] text-white/60 font-normal hidden sm:inline">
                {isExisting ? '· existante' : '· nouvelle'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onEstimate && (
                <button
                  type="button"
                  onClick={onEstimate}
                  disabled={isEstimating || !task.title.trim()}
                  className={t.btnEstimate}
                >
                  {isEstimating
                    ? <><Loader2 size={11} className="animate-spin" /><span className="hidden sm:inline">Estimation…</span></>
                    : <><Zap size={11} /><span className="hidden sm:inline">Estimer</span></>}
                </button>
              )}
              {showRemoveButton && !isExisting && (
                <button onClick={onRemove} className={t.btnRemove}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                <Target size={14} className="text-white" />
              </div>
              <span className="font-bold text-white text-sm">Éditer la tâche</span>
            </div>
            {onEstimate && (
              <button
                type="button"
                onClick={onEstimate}
                disabled={isEstimating}
                className={t.btnEstimate}
              >
                {isEstimating
                  ? <><Loader2 size={12} className="animate-spin" />Estimation…</>
                  : <><Cpu size={12} />Re-estimer IA</>}
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 space-y-4">

        {/* AI estimate badge */}
        {safeNum(aiHours) > 0 && (
          <div className={t.aiBadge}>
            <Cpu size={14} className="text-teal-500 shrink-0" />
            <span>Estimation IA :</span>
            <strong className="text-teal-600">{formatHours(safeNum(aiHours))}</strong>
          </div>
        )}

        {/* Date error banner */}
        {dateError && (
          <div className={t.warnBadge}>
            <AlertTriangle size={13} className="shrink-0 text-amber-500" />
            <span>{dateError}</span>
          </div>
        )}

        {/* ── Section : Informations générales ──────────────────────── */}
        <div>
          <p className={t.sectionHead}>
            <span className="w-5 h-px bg-teal-300 inline-block" />
            Informations générales
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">

            <div className="sm:col-span-2 lg:col-span-6">
              <label className={t.label}>Titre *</label>
              <input
                type="text"
                placeholder="Ex: Campagne email re-engagement"
                className={t.input}
                value={task.title ?? ''}
                onChange={(e) => onChange('title', e.target.value)}
              />
            </div>

            <div className="lg:col-span-3">
              <label className={t.label}>
                <User size={10} className="inline mr-1" />Assigné à
              </label>
              <select
                className={t.select}
                value={assignedId}
                onChange={(e) => onChange('assignedTo', e.target.value)}
              >
                <option value="">Non assigné</option>
                {members.map((m) => {
                  const label =
                    m.fullname ??
                    m.name ??
                    `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
                  return (
                    <option key={m.id} value={m.id}>
                      {label}{m.level ? ` (${m.level})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className={t.label}>Type</label>
              <select
                className={t.select}
                value={task.type ?? 'CAMPAIGN'}
                onChange={(e) => onChange('type', e.target.value as TaskMarketingType)}
              >
                {TASK_TYPE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-12">
              <label className={t.label}>Description</label>
              <textarea
                rows={2}
                placeholder="Objectifs, critères de succès…"
                className={`${t.input} resize-none`}
                value={task.description ?? ''}
                onChange={(e) => onChange('description', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Section : Statut & Budget ──────────────────────────────── */}
        <div>
          <p className={t.sectionHead}>
            <span className="w-5 h-px bg-teal-300 inline-block" />
            Statut & Budget
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

            <div>
              <label className={t.label}>Statut</label>
              <select
                className={t.select}
                value={task.status ?? 'TO_DO'}
                onChange={(e) => onChange('status', e.target.value as TaskMarketingStatus)}
              >
                <option value="TO_DO">À faire</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="IN_REVIEW">En révision</option>
                <option value="DONE">Fait</option>
                <option value="BLOCKED">Bloqué</option>
              </select>
            </div>

            <div>
              <label className={t.label}>Priorité</label>
              <select
                className={t.select}
                value={task.priority ?? 'MEDIUM'}
                onChange={(e) => onChange('priority', e.target.value as TaskMarketingPriority)}
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
                <option value="CRITICAL">Critique</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className={t.label}>
                <DollarSign size={10} className="inline mr-1" />Budget (TND)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                className={t.input}
                value={safeNum(task.budget) || ''}
                onChange={(e) => {
                  onChange('budget', e.target.value);
                  onChange('cost',   e.target.value);
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Section : Dates ────────────────────────────────────────── */}
        <div>
          <p className={t.sectionHead}>
            <span className="w-5 h-px bg-teal-300 inline-block" />
            Planification
            {sprintMinDate && sprintMaxDate && (
              <span className="text-[10px] font-normal text-teal-400 normal-case">
                · Campagne : {sprintMinDate} → {sprintMaxDate}
              </span>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* ✅ Début prévu — uniquement les jours dans le sprint */}
            <div>
              <label className={t.label}>
                <Calendar size={10} className="inline mr-1" />Début prévu
              </label>
              <SprintDatePicker
                value={startVal}
                minDate={sprintMinDate}
                maxDate={sprintMaxDate}
                className={dateError ? 'inputError' : ''}
                onChange={(val) => {
                  onChange('scheduledStartDate', val);
                  // Si la date de fin est maintenant avant le nouveau début, on la réinitialise
                  if (val && endVal && endVal < val) {
                    onChange('scheduledEndDate', null);
                  }
                }}
              />
              {sprintMinDate && sprintMaxDate && (
                <p className="text-[10px] text-teal-400 mt-1">
                  Entre le {sprintMinDate} et le {sprintMaxDate}
                </p>
              )}
            </div>

            {/* ✅ Fin prévue — min = début tâche (ou début sprint), max = fin sprint */}
            <div>
              <label className={t.label}>
                <Calendar size={10} className="inline mr-1" />Fin prévue
              </label>
              <SprintDatePicker
                value={endVal}
                minDate={endMin}
                maxDate={sprintMaxDate}
                className={dateError ? 'inputError' : ''}
                onChange={(val) => onChange('scheduledEndDate', val)}
              />
              {sprintMaxDate && (
                <p className="text-[10px] text-teal-400 mt-1">
                  {endMin
                    ? `Entre le ${endMin} et le ${sprintMaxDate}`
                    : `Pas après le ${sprintMaxDate}`}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* ── Section : Canaux ───────────────────────────────────────── */}
        <div>
          <p className={t.sectionHead}>
            <span className="w-5 h-px bg-teal-300 inline-block" />
            Canaux marketing
          </p>
          <div className="flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => toggleChannel(ch)}
                className={selectedChannels.includes(ch) ? t.channelActive : t.channelInactive}
              >
                {ch}
              </button>
            ))}
          </div>
          {selectedChannels.length > 0 && (
            <p className="text-xs text-teal-600 mt-2 font-medium">
              ✓ {selectedChannels.join(', ')}
            </p>
          )}
        </div>

        {/* ── Section : Données IA ───────────────────────────────────── */}
        <div>
          <p className={t.sectionHead}>
            <span className="w-5 h-px bg-teal-300 inline-block" />
            Données pour l'estimation IA
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(
              [
                { field: 'budget',              label: 'Budget (TND)',   placeholder: '1200',  isFloat: true,  icon: DollarSign   },
                { field: 'impressions',         label: 'Impressions',    placeholder: '15000', isFloat: false, icon: BarChart2    },
                { field: 'expectedClicks',      label: 'Clics',          placeholder: '600',   isFloat: false, icon: MousePointer },
                { field: 'expectedConversions', label: 'Conversions',    placeholder: '25',    isFloat: false, icon: TrendingUp   },
                { field: 'expectedLeads',       label: 'Leads',          placeholder: '6',     isFloat: false, icon: Users        },
                { field: 'expectedCTR',         label: 'CTR (0–1)',      placeholder: '0.04',  isFloat: true,  icon: Target       },
              ] as const
            ).map(({ field, label, placeholder, isFloat, icon: Icon }) => (
              <div key={field}>
                <label className={t.label}>
                  <Icon size={9} className="inline mr-1" />{label}
                </label>
                <input
                  type="number"
                  step={isFloat ? '0.01' : '1'}
                  min="0"
                  placeholder={placeholder}
                  className={t.input}
                  value={
                    (task as Record<string, unknown>)[field] != null
                      ? String((task as Record<string, unknown>)[field])
                      : ''
                  }
                  onChange={(e) => onChange(field as keyof TaskMarketing, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Section : Score / Complexity / Effort ─────────────────── */}
        <div>
          <p className={t.sectionHead}>
            <span className="w-5 h-px bg-teal-300 inline-block" />
            Évaluation qualitative
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { field: 'score',      label: 'Score (1–5)'      },
                { field: 'complexity', label: 'Complexité (1–5)' },
                { field: 'effort',     label: 'Effort (1–5)'     },
              ] as const
            ).map(({ field, label }) => (
              <div key={field}>
                <label className={t.label}>{label}</label>
                <select
                  className={t.select}
                  value={String(safeNum((task as Record<string, unknown>)[field]) || 1)}
                  onChange={(e) => onChange(field as keyof TaskMarketing, Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* ── Save / Cancel (edit mode) ──────────────────────────────── */}
        {mode === 'edit' && (
          <div className="flex justify-end gap-3 pt-2 border-t border-teal-100">
            <button onClick={onCancel} className={t.btnCancel}>
              Annuler
            </button>
            <button
              onClick={onSave}
              disabled={loading || isEstimating || !!dateError}
              title={dateError ?? undefined}
              className={t.btnSave}
            >
              {isEstimating
                ? <><Loader2 size={14} className="animate-spin" />Estimation…</>
                : <><Save size={14} />Enregistrer</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};