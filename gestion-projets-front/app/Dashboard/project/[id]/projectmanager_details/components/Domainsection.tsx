'use client';

import React from 'react';
import { Code, Megaphone, Headphones, Lock } from 'lucide-react';
import ITDomainForm        from '@/component/ITDomainForm';
import MarketingDomainForm from '@/component/MarketingDomainForm';
import CallCenterDomainForm from '@/component/CallCenterDomainForm';

const DOMAIN_META: Record<string, { icon: React.ReactNode; label: string }> = {
  IT:         { icon: <Code size={16} className="text-indigo-600" />,        label: 'IT' },
  Marketing:  { icon: <Megaphone size={16} className="text-rose-600" />,     label: 'Marketing' },
  CallCenter: { icon: <Headphones size={16} className="text-emerald-600" />, label: 'Call Center' },
};

type Props = {
  domain:        string;
  domainForm:    Record<string, any>;
  setDomainForm: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  /** true  = admin_company / project_manager → editable
   *  false = manager                         → read-only */
  canEdit:       boolean;
  /** Auto-computed: assignedTo.length + (PM ? 1 : 0) */
  teamSize:      number;
  saving:        boolean;
  onSave:        () => void;
  onCancel:      () => void;
};

export default function DomainSection({
  domain, domainForm, setDomainForm,
  canEdit, teamSize, saving, onSave, onCancel,
}: Props) {
  const meta = DOMAIN_META[domain];

  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border">
      <div className="flex items-center gap-2 mb-5">
        {meta?.icon}
        <h2 className="text-lg font-semibold">
          Détails domaine — {meta?.label ?? domain}
        </h2>
        {!canEdit && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            <Lock size={11} /> Lecture seule
          </span>
        )}
      </div>

      {domain === 'IT' && (
        <ITDomainForm
          domainForm={{ ...domainForm, teamSize }}
          setDomainForm={setDomainForm}
          readOnly={!canEdit}
          computedTeamSize={String(teamSize)}
          isPM={false}
        />
      )}

      {domain === 'Marketing' && (
        <MarketingDomainForm
          domainForm={domainForm}
          setDomainForm={setDomainForm}
          readOnly={!canEdit}
        />
      )}

      {domain === 'CallCenter' && (
        <CallCenterDomainForm
          domainForm={domainForm}
          setDomainForm={setDomainForm}
          readOnly={!canEdit}
        />
      )}

      {domain === 'Other' && (
        <p className="text-sm text-slate-400">Aucun formulaire spécifique pour ce domaine.</p>
      )}

      {canEdit && domain !== 'Other' && (
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 hover:bg-indigo-700 transition"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder les détails domaine'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition"
          >
            Annuler
          </button>
        </div>
      )}
    </section>
  );
}