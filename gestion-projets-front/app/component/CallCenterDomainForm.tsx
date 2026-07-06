'use client';

import React from 'react';

export type CallCenterDomainFormProps = {
  domainForm:    Record<string, any>;
  setDomainForm: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  readOnly?:     boolean;
  /** Passé depuis MembersSection — assignedTo.length + (PM ? 1 : 0) */
  teamSize?:     number;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

// ✅ FIX: api keys uniques — plus de collision avec les noms de champs
const CALL_TYPES = [
  { label: 'Support technique',  api: 'Tech'    },
  { label: 'Service client',     api: 'Support' },
  { label: 'Vente / Commercial', api: 'Sales'   },
  { label: 'Autre',              api: 'Other'   }, // ← était 'callTypes' ❌
];

// ✅ FIX: api keys uniques
const DEPENDENCIES = [
  { label: 'Intelligence artificielle', api: 'AI'           },
  { label: 'CRM',                       api: 'CRM'          },
  { label: 'CTI',                       api: 'CTI'          },
  { label: 'IVR / Serveur vocal',       api: 'IVR'          },
  { label: 'Formation agents',          api: 'Training'     },
  { label: 'WFM / Planification',       api: 'WFM'          },
  { label: 'Autre dépendance',          api: 'OtherDep'     }, // ← était 'dependencies' ❌
];

// SLA preset → secondes (slaPreset est UI-only, jamais envoyé au backend)
const SLA_PRESETS: { label: string; seconds: number | null }[] = [
  { label: '80% < 20s', seconds: 20   },
  { label: '80% < 30s', seconds: 30   },
  { label: '90% < 60s', seconds: 60   },
  { label: '95% < 90s', seconds: 90   },
  { label: 'Custom',    seconds: null },
];

// Budget estimé — choix prédéfinis (valeur en €)
const BUDGET_OPTIONS = [
  { label: '< 5 000 €',          value: 5_000    },
  { label: '5 000 – 15 000 €',   value: 15_000   },
  { label: '15 000 – 50 000 €',  value: 50_000   },
  { label: '50 000 – 100 000 €', value: 100_000  },
  { label: '100 000 – 250 000 €',value: 250_000  },
  { label: '> 250 000 €',        value: 999_999  },
  { label: 'Sur devis',          value: null     },
];

// Priorité
const PRIORITY_OPTIONS = [
  { label: '🔴 Critique', value: 'critical' },
  { label: '🟠 Haute',    value: 'high'     },
  { label: '🟡 Moyenne',  value: 'medium'   },
  { label: '🟢 Faible',   value: 'low'      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300';

function ReadOnly({ label, value, hint }: { label: string; value?: any; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-slate-600">
        {label}
        {hint && <span className="ml-2 text-xs text-slate-400 font-normal">{hint}</span>}
      </label>
      <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 min-h-[2.375rem]">
        {value !== undefined && value !== null && value !== ''
          ? String(value)
          : <span className="text-slate-400">—</span>}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-slate-700">
        {label}
        {hint && <span className="ml-2 text-xs text-slate-400 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b pb-1 mb-4">
        {title}
      </p>
      {children}
    </div>
  );
}

/** Badges multi-sélection */
function BadgeSelect({
  label,
  options,
  value,
  onChange,
  readOnly = false,
}: {
  label:    string;
  options:  { label: string; api: string }[];
  value:    string[];
  onChange: (v: string[]) => void;
  readOnly?: boolean;
}) {
  function toggle(api: string) {
    if (readOnly) return;
    value.includes(api) ? onChange(value.filter(v => v !== api)) : onChange([...value, api]);
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-slate-600">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = value.includes(opt.api);
          return (
            <button
              key={opt.api}
              type="button"
              disabled={readOnly}
              onClick={() => toggle(opt.api)}
              className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                active
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : readOnly
                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:text-emerald-600'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Badges radio (sélection unique) */
function RadioBadge({
  label,
  options,
  value,
  onChange,
  readOnly = false,
}: {
  label:    string;
  options:  { label: string; value: string | number | null }[];
  value:    string | number | null | undefined;
  onChange: (v: string | number | null) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-slate-600">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange(active ? null : opt.value)}
              className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : readOnly
                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Parsers (stockage interne en ";"-séparé) ─────────────────────────────────

function parseApiList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(';').map(s => s.trim()).filter(Boolean);
}

function serializeApiList(arr: string[]): string | null {
  return arr.length > 0 ? arr.join(';') : null;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CallCenterDomainForm({
  domainForm,
  setDomainForm,
  readOnly = false,
  teamSize,
}: CallCenterDomainFormProps) {

  function set(key: string, val: any) {
    setDomainForm(f => ({ ...f, [key]: val }));
  }

  // ── Champs multi-badge ──
  const callTypes    = parseApiList(domainForm.callTypes);
  const dependencies = parseApiList(domainForm.dependencies);

  // ── SLA preset (UI-only, jamais envoyé au backend) ──
  // On le garde dans domainForm pour la réactivité UI, mais il est
  // absent de DOMAIN_DTO_FIELDS → jamais inclus dans le payload PATCH
  const slaPreset   = domainForm._slaPreset ?? ''; // préfixe "_" = champ UI-only
  const isCustomSla = slaPreset === 'Custom';

  function setSlaPreset(label: string) {
    const found = SLA_PRESETS.find(p => p.label === label);
    const next  = label === slaPreset ? '' : label;
    set('_slaPreset', next);                          // UI-only, ne sera pas envoyé
    if (found && found.seconds !== null) {
      set('slaTargetSeconds', found.seconds);
    } else if (next === 'Custom' || next === '') {
      // Custom ou désélection → laisser l'utilisateur saisir
      set('slaTargetSeconds', domainForm.slaTargetSeconds ?? '');
    }
  }

  // ── numberOfAgents : auto depuis teamSize ──
  // teamSize est la source de vérité — on met à jour numberOfAgents
  // dans le form pour qu'il soit inclus dans le payload
  React.useEffect(() => {
    if (teamSize !== undefined) {
      setDomainForm(f => ({ ...f, numberOfAgents: teamSize }));
    }
  }, [teamSize]);

  // ── Budget label pour l'affichage read-only ──
  const budgetLabel = BUDGET_OPTIONS.find(o => o.value === domainForm.estimatedBudget)?.label
    ?? (domainForm.estimatedBudget != null ? `${domainForm.estimatedBudget} €` : undefined);

  // ── Priorité label pour l'affichage read-only ──
  const priorityLabel = PRIORITY_OPTIONS.find(o => o.value === domainForm.priority)?.label
    ?? domainForm.priority;

  return (
    <div className="space-y-6">

      {/* ══ SECTION 1 — Opérations ══════════════════════════════════════════ */}
      <Section title="Opérations">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Types d'appels */}
          <div className="md:col-span-2">
            <BadgeSelect
              label="Types d'appels"
              options={CALL_TYPES}
              value={callTypes}
              onChange={v => set('callTypes', serializeApiList(v))}
              readOnly={readOnly}
            />
          </div>

          {/* numberOfAgents — auto depuis teamSize, toujours read-only */}
          <ReadOnly
            label="Nombre d'agents"
            value={domainForm.numberOfAgents ?? teamSize ?? '—'}
            hint="(calculé depuis les membres assignés)"
          />

          {/* numberOfCallsPerDay */}
          {readOnly ? (
            <ReadOnly label="Volume d'appels / jour" value={domainForm.numberOfCallsPerDay} />
          ) : (
            <Field label="Volume d'appels / jour">
              <input
                type="number" min={0}
                value={domainForm.numberOfCallsPerDay ?? ''}
                onChange={e => set('numberOfCallsPerDay', e.target.value === '' ? null : Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          )}

          {/* averageHandleTimeSec */}
          {readOnly ? (
            <ReadOnly label="Durée moy. d'appel — AHT (secondes)" value={domainForm.averageHandleTimeSec} />
          ) : (
            <Field label="Durée moy. d'appel — AHT" hint="(secondes)">
              <input
                type="number" min={0}
                value={domainForm.averageHandleTimeSec ?? ''}
                onChange={e => set('averageHandleTimeSec', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Ex : 270"
                className={inputCls}
              />
            </Field>
          )}

          {/* estimatedDurationDays — READ-ONLY, calculé depuis les tâches */}
          <ReadOnly
            label="Durée estimée du projet (jours)"
            value={domainForm.estimatedDurationDays}
            hint="(calculée depuis les tâches)"
          />

        </div>
      </Section>

      {/* ══ SECTION 2 — Budget & Priorité ══════════════════════════════════ */}
      <Section title="Budget & priorité">
        <div className="grid grid-cols-1 gap-5">

          {/* Budget estimé — choix prédéfinis */}
          {readOnly ? (
            <ReadOnly label="Budget estimé" value={budgetLabel} />
          ) : (
            <RadioBadge
              label="Budget estimé"
              options={BUDGET_OPTIONS}
              value={domainForm.estimatedBudget ?? null}
              onChange={v => set('estimatedBudget', v)}
              readOnly={readOnly}
            />
          )}

          {/* Priorité */}
          {readOnly ? (
            <ReadOnly label="Priorité" value={priorityLabel} />
          ) : (
            <RadioBadge
              label="Priorité"
              options={PRIORITY_OPTIONS}
              value={domainForm.priority ?? null}
              onChange={v => set('priority', v)}
              readOnly={readOnly}
            />
          )}

        </div>
      </Section>

      {/* ══ SECTION 3 — SLA & Qualité ═══════════════════════════════════════ */}
      <Section title="SLA & qualité">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* SLA preset (UI-only) */}
          {!readOnly && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-slate-600">
                SLA cible (preset)
                <span className="ml-2 text-xs text-slate-400 font-normal">sélectionnez ou saisissez manuellement</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SLA_PRESETS.map(p => {
                  const active = slaPreset === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setSlaPreset(p.label)}
                      className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                        active
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:text-emerald-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* slaTargetSeconds */}
          {readOnly ? (
            <ReadOnly label="SLA cible (secondes)" value={domainForm.slaTargetSeconds} />
          ) : (
            <Field
              label={isCustomSla ? 'SLA personnalisé (secondes)' : 'SLA cible (secondes)'}
              hint={!isCustomSla && slaPreset ? '(rempli par le preset)' : undefined}
            >
              <input
                type="number" min={0}
                value={domainForm.slaTargetSeconds ?? ''}
                onChange={e => set('slaTargetSeconds', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Ex : 45"
                className={inputCls}
              />
            </Field>
          )}

          {/* CSAT */}
          {readOnly ? (
            <ReadOnly label="CSAT (%)" value={domainForm.CSAT} />
          ) : (
            <Field label="CSAT (%)">
              <input
                type="number" min={0} max={100} step={0.1}
                value={domainForm.CSAT ?? ''}
                onChange={e => set('CSAT', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Ex : 85"
                className={inputCls}
              />
            </Field>
          )}

          {/* FCR */}
          {readOnly ? (
            <ReadOnly label="FCR — First Call Resolution (%)" value={domainForm.FCR} />
          ) : (
            <Field label="FCR — First Call Resolution (%)">
              <input
                type="number" min={0} max={100} step={0.1}
                value={domainForm.FCR ?? ''}
                onChange={e => set('FCR', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Ex : 72"
                className={inputCls}
              />
            </Field>
          )}

        </div>
      </Section>

      {/* ══ SECTION 4 — Objectifs & Risques ═════════════════════════════════ */}
      <Section title="Objectifs & risques">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Dépendances */}
          <div className="md:col-span-2">
            <BadgeSelect
              label="Dépendances"
              options={DEPENDENCIES}
              value={dependencies}
              onChange={v => set('dependencies', serializeApiList(v))}
              readOnly={readOnly}
            />
          </div>

          {/* risksScore */}
          {readOnly ? (
            <ReadOnly label="Score de risque (0–10)" value={domainForm.risksScore} />
          ) : (
            <Field label="Score de risque (0–10)">
              <input
                type="number" min={0} max={10} step={0.5}
                value={domainForm.risksScore ?? ''}
                onChange={e => set('risksScore', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Ex : 4.5"
                className={inputCls}
              />
            </Field>
          )}

          {/* mainGoals */}
          {readOnly ? (
            <ReadOnly label="Objectifs principaux" value={domainForm.mainGoals} />
          ) : (
            <Field label="Objectifs principaux">
              <input
                type="text"
                value={domainForm.mainGoals ?? ''}
                onChange={e => set('mainGoals', e.target.value || null)}
                placeholder="Satisfaction client, Résolution rapide..."
                className={inputCls}
              />
            </Field>
          )}

          {/* additionalNotes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-slate-700">Notes additionnelles</label>
            {readOnly ? (
              <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 min-h-[5rem] whitespace-pre-wrap">
                {domainForm.additionalNotes || <span className="text-slate-400">—</span>}
              </div>
            ) : (
              <textarea
                rows={3}
                value={domainForm.additionalNotes ?? ''}
                onChange={e => set('additionalNotes', e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            )}
          </div>

        </div>
      </Section>

    </div>
  );
}