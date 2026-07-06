'use client';

import { Lock } from 'lucide-react';
import ReadOnlyField from './Readonlyfield';
import type { UserLite } from './Useprojectdata';

const STATUS_LABELS: Record<string, string> = {
  planned:     'Planned',
  in_progress: 'In Progress',
  completed:   'Completed',
  on_hold:     'On Hold',
  cancelled:   'Cancelled',
};

type ProjectMeta = {
  createdby?: { fullname?: string } | null;
  company?:   { name?: string }    | null;
  updatedAt?: string               | null;
  projectManager?: { id?: number; fullname?: string } | null;
};

type Props = {
  /** true  → edit mode (admin_company / manager)
   *  false → read-only mode (project_manager / others) */
  canEdit:             boolean;
  /** manager cannot change the PM field — only admin can */
  canEditProjectManager: boolean;

  name:              string;
  setName:           (v: string) => void;
  description:       string;
  setDescription:    (v: string) => void;
  domain:            string;
  setDomain:         (v: string) => void;
  status:            string;
  setStatus:         (v: string) => void;
  startDate:         string;
  setStartDate:      (v: string) => void;
  endDate:           string;
  setEndDate:        (v: string) => void;
  projectManagerId:  number | '';
  setProjectManagerId: (v: number | '') => void;
  /** List of users with role=project_manager from same company */
  projectManagerUsers: UserLite[];
  projectMeta:       ProjectMeta | null;
  dateError:         string | null;
  saving:            boolean;
  onSave:            () => void;
  onCancel:          () => void;
};

export default function ProjectInfoSection({
  canEdit,
  canEditProjectManager,
  name, setName,
  description, setDescription,
  domain, setDomain,
  status, setStatus,
  startDate, setStartDate,
  endDate, setEndDate,
  projectManagerId, setProjectManagerId,
  projectManagerUsers,
  projectMeta,
  dateError,
  saving,
  onSave,
  onCancel,
}: Props) {

  function handleStartDateChange(value: string) {
    setStartDate(value);
    if (endDate && value && endDate < value) setEndDate('');
  }

  const selectedPM = projectManagerUsers.find(u => u.id === projectManagerId);

  const MetaBlock = () => (
    <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1 border">
      <div><span className="font-medium">Créé par :</span> {projectMeta?.createdby?.fullname || '—'}</div>
      <div><span className="font-medium">Entreprise :</span> {projectMeta?.company?.name || '—'}</div>
      <div>
        <span className="font-medium">Mis à jour :</span>{' '}
        {projectMeta?.updatedAt ? new Date(projectMeta.updatedAt).toLocaleString() : '—'}
      </div>
    </div>
  );

  // ── Read-only view (project_manager and others) ──────────────────────────────
  if (!canEdit) {
    return (
      <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Informations du projet</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            <Lock size={11} /> Lecture seule
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <ReadOnlyField label="Nom du projet"  value={name} />
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-600">Description</label>
              <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 min-h-[6rem] whitespace-pre-wrap">
                {description || <span className="text-slate-400">—</span>}
              </div>
            </div>
            <ReadOnlyField label="Domaine" value={domain} />
          </div>
          <div className="space-y-3">
            <ReadOnlyField label="Statut" value={STATUS_LABELS[status] ?? status} />
            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField label="Date de début" value={startDate || undefined} />
              <ReadOnlyField label="Date de fin"   value={endDate   || undefined} />
            </div>
            {/* PM read-only – intentionally hidden from project_manager themselves */}
            <MetaBlock />
          </div>
        </div>
      </section>
    );
  }

  // ── Editable view (admin_company / manager) ───────────────────────────────────
  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
      <h2 className="text-lg font-semibold">Informations du projet</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Left column ── */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nom du projet</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Domaine</label>
            <select
              value={domain}
              onChange={e => setDomain(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="IT">IT</option>
              <option value="Marketing">Marketing</option>
              <option value="CallCenter">Call Center</option>
              <option value="Other">Autre</option>
            </select>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Statut</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={e => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date de fin</label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                  dateError ? 'border-red-400 focus:ring-red-300' : 'focus:ring-indigo-300'
                }`}
              />
            </div>
          </div>
          {dateError && <p className="text-xs text-red-600 -mt-1">{dateError}</p>}

          {/* ── Project Manager select ─────────────────────────────────────────
              Admin    → editable <select> listing all PM users of the company
              Manager  → read-only display (cannot change who the PM is)
          ──────────────────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Project Manager
              {!canEditProjectManager && (
                <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium">
                  <Lock size={9} /> lecture seule
                </span>
              )}
            </label>

            {canEditProjectManager ? (
              <select
                value={projectManagerId ?? ''}
                onChange={e => setProjectManagerId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">— Aucun —</option>
                {projectManagerUsers.map(pm => (
                  <option key={pm.id} value={pm.id}>
                    {pm.fullname || pm.email || `User #${pm.id}`}
                  </option>
                ))}
              </select>
            ) : (
              /* Manager: read-only display */
              <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 min-h-[2.375rem]">
                {selectedPM
                  ? `${selectedPM.fullname || selectedPM.email} (#${selectedPM.id})`
                  : projectMeta?.projectManager?.fullname
                    ? `${projectMeta.projectManager.fullname} (#${projectMeta.projectManager.id})`
                    : <span className="text-slate-400">—</span>
                }
              </div>
            )}
          </div>

          <MetaBlock />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={saving || !!dateError}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 hover:bg-indigo-700 transition"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition"
        >
          Annuler
        </button>
      </div>
    </section>
  );
}