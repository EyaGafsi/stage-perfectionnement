'use client';

import React from 'react';

export type MarketingDomainFormProps = {
  domainForm: Record<string, any>;
  setDomainForm: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  readOnly?: boolean;
};

const CAMPAIGN_TYPES = [
  'Display', 'Email', 'SEO', 'SEA', 'Social Media', 'Content Marketing',
  'Influencer', 'Affiliate', 'PR', 'Event', 'Video', 'SMS', 'Push Notification',
];

const CHANNELS = [
  'Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Twitter/X', 'YouTube',
  'Google Ads', 'Email', 'SMS', 'WhatsApp', 'SEO', 'Blog', 'Podcast',
  'TV', 'Radio', 'Print', 'OOH', 'Influencer',
];

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const IMPACT_OPTIONS   = ['Low', 'Normal', 'Important', 'Critical'];
const AUDIENCE_OPTIONS = [
  'B2B', 'B2C', '18-25 ans', '25-35 ans', '35-50 ans', '50+ ans',
  'Startups', 'PME', 'Entreprises', 'Étudiants', 'Professionnels',
];

function ReadOnly({ label, value }: { label: string; value?: any }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-slate-600">{label}</label>
      <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 min-h-[2.375rem]">
        {value !== undefined && value !== null && value !== '' ? String(value) : <span className="text-slate-400">—</span>}
      </div>
    </div>
  );
}

function BadgeSelect({
  label,
  options,
  value,
  onChange,
  multi = false,
  readOnly = false,
}: {
  label: string;
  options: string[];
  value: string | string[];
  onChange: (v: string | string[]) => void;
  multi?: boolean;
  readOnly?: boolean;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  function toggle(opt: string) {
    if (readOnly) return;
    if (multi) {
      const arr = Array.isArray(value) ? value : value ? [value] : [];
      if (arr.includes(opt)) onChange(arr.filter(v => v !== opt));
      else onChange([...arr, opt]);
    } else {
      onChange(value === opt ? '' : opt);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-slate-600">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              disabled={readOnly}
              onClick={() => toggle(opt)}
              className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                active
                  ? 'bg-rose-500 text-white border-rose-500'
                  : readOnly
                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-rose-400 hover:text-rose-600'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MarketingDomainForm({
  domainForm,
  setDomainForm,
  readOnly = false,
}: MarketingDomainFormProps) {
  function field(key: string): string {
    return domainForm[key] ?? '';
  }

  function set(key: string, val: any) {
    setDomainForm(f => ({ ...f, [key]: val }));
  }

  // channels stored as pipe-separated string
  function getChannels(): string[] {
    const v = domainForm.channels;
    if (!v) return [];
    return String(v).split('|').map(s => s.trim()).filter(Boolean);
  }

  function setChannels(vals: string[]) {
    set('channels', vals.join('|'));
  }

  function getAudience(): string[] {
    const v = domainForm.targetAudience;
    if (!v) return [];
    return String(v).split('|').map(s => s.trim()).filter(Boolean);
  }

  function setAudience(vals: string[]) {
    set('targetAudience', vals.join('|'));
  }

  return (
    <div className="space-y-6">
      {/* Campaign info */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b pb-1 mb-4">
          Informations campagne
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Campaign Type */}
          <div className="md:col-span-2">
            <BadgeSelect
              label="Type de campagne"
              options={CAMPAIGN_TYPES}
              value={field('campaignType')}
              onChange={v => set('campaignType', v)}
              multi={false}
              readOnly={readOnly}
            />
          </div>

          {/* Target Audience */}
          <div className="md:col-span-2">
            <BadgeSelect
              label="Audience cible"
              options={AUDIENCE_OPTIONS}
              value={getAudience()}
              onChange={v => setAudience(Array.isArray(v) ? v : [v])}
              multi={true}
              readOnly={readOnly}
            />
          </div>

          {/* Channels */}
          <div className="md:col-span-2">
            <BadgeSelect
              label="Canaux"
              options={CHANNELS}
              value={getChannels()}
              onChange={v => setChannels(Array.isArray(v) ? v : [v])}
              multi={true}
              readOnly={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Budget & durée */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b pb-1 mb-4">
          Budget & durée
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {readOnly ? (
            <>
              <ReadOnly label="Durée estimée (jours)" value={domainForm.estimatedDurationDays} />
              <ReadOnly label="Budget estimé (€)" value={domainForm.estimatedBudget} />
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Durée estimée (jours)</label>
                <input
                  type="number"
                  value={domainForm.estimatedDurationDays ?? ''}
                  onChange={e => set('estimatedDurationDays', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Budget estimé (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={domainForm.estimatedBudget ?? ''}
                  onChange={e => set('estimatedBudget', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Priorité & Impact */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b pb-1 mb-4">
          Planification
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <BadgeSelect
            label="Priorité"
            options={PRIORITY_OPTIONS}
            value={field('priority')}
            onChange={v => set('priority', v)}
            readOnly={readOnly}
          />
          <BadgeSelect
            label="Impact business"
            options={IMPACT_OPTIONS}
            value={field('businessImpact')}
            onChange={v => set('businessImpact', v)}
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* Objectifs & KPIs */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b pb-1 mb-4">
          Objectifs & métriques
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'mainGoals',      label: 'Objectifs principaux', placeholder: 'Leads, Trafic, Conversion...' },
            { key: 'keyDeliverables',label: 'Livrables clés',       placeholder: 'Landing pages, visuels...' },
            { key: 'metrics',        label: 'Métriques clés',       placeholder: 'CTR, ROI, Engagement...' },
            { key: 'dependencies',   label: 'Dépendances',          placeholder: 'Autres campagnes...' },
            { key: 'risks',          label: 'Risques',              placeholder: 'Faible engagement, dépassement budget...' },
          ].map(({ key, label, placeholder }) =>
            readOnly ? (
              <ReadOnly key={key} label={label} value={domainForm[key]} />
            ) : (
              <div key={key}>
                <label className="block text-sm font-medium mb-1 text-slate-700">{label}</label>
                <input
                  type="text"
                  value={domainForm[key] ?? ''}
                  onChange={e => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
            )
          )}
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
                onChange={e => set('additionalNotes', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}