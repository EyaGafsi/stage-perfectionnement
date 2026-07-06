'use client';

import { Search, Users } from 'lucide-react';
import type { UserLite } from '@/hooks/useProjectData';

type Props = {
  /** Can this user add members? false = read-only view */
  canEdit:          boolean;
  assignedTo:       UserLite[];
  /** Already filtered: role=member only */
  users:            UserLite[];
  usersLoading:     boolean;
  userSearch:       string;
  setUserSearch:    (v: string) => void;
  selectedUserIds:  Set<number>;
  toggleSelectUser: (id: number) => void;
  setSelectedUserIds: (fn: (prev: Set<number>) => Set<number>) => void;
  addingMembers:    boolean;
  onAddMembers:     () => void;
  onReset:          () => void;
  /** Computed: assignedTo.length + (PM ? 1 : 0) */
  teamSize:         number;
};

export default function MembersSection({
  canEdit,
  assignedTo,
  users,
  usersLoading,
  userSearch,
  setUserSearch,
  selectedUserIds,
  toggleSelectUser,
  setSelectedUserIds,
  addingMembers,
  onAddMembers,
  onReset,
  teamSize,
}: Props) {

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    return (u.fullname || u.email || '').toLowerCase().includes(userSearch.toLowerCase());
  });

  function toggleAll() {
    const visibleIds  = filteredUsers.map(u => u.id);
    const allSelected = visibleIds.every(id => selectedUserIds.has(id));
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach(id => next.delete(id));
      else             visibleIds.forEach(id => next.add(id));
      return next;
    });
  }

  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">Membres du projet</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {canEdit
              ? 'Sélectionnez les membres à ajouter au projet.'
              : 'Liste des membres assignés au projet.'}
          </p>
        </div>
        {/* Team size badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
          <Users size={12} />
          Équipe : {teamSize} personne{teamSize !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Currently assigned members */}
      {assignedTo.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">
            Membres actuels ({assignedTo.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {assignedTo.map(u => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium shadow-sm"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                  {(u.fullname || u.email || '?')[0].toUpperCase()}
                </span>
                {u.fullname || u.email || `User ${u.id}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Read-only: no picker */}
      {!canEdit && assignedTo.length === 0 && (
        <p className="text-sm text-slate-400">Aucun membre assigné.</p>
      )}

      {/* Editable: search + list */}
      {canEdit && (
        <>
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Rechercher un membre (rôle : member)..."
                className="pl-9 pr-3 py-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <button
              onClick={toggleAll}
              className="px-3 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition whitespace-nowrap"
            >
              Tout basculer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {usersLoading ? (
              <div className="col-span-full text-center py-6 text-slate-400 text-sm">
                Chargement des membres...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full text-sm text-slate-400 py-4 text-center">
                Aucun membre disponible.
              </div>
            ) : (
              filteredUsers.map(u => {
                const isAssigned = assignedTo.some(m => m.id === u.id);
                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer transition ${
                      isAssigned
                        ? 'bg-emerald-50 border-emerald-200 opacity-60 cursor-not-allowed'
                        : 'hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(u.id) || isAssigned}
                      onChange={() => { if (!isAssigned) toggleSelectUser(u.id); }}
                      disabled={isAssigned}
                      className="w-4 h-4 accent-indigo-600 disabled:accent-emerald-600 disabled:cursor-not-allowed"
                    />
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {(u.fullname || u.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {u.fullname || u.email || `User ${u.id}`}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{u.email || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAssigned && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          ✓ Assigné
                        </span>
                      )}
                      <span className="text-xs text-slate-300">#{u.id}</span>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onAddMembers}
              disabled={addingMembers || selectedUserIds.size === 0}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium disabled:opacity-60 hover:bg-emerald-600 transition"
            >
              {addingMembers
                ? 'Ajout en cours...'
                : `Ajouter les membres sélectionnés (${selectedUserIds.size})`}
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition"
            >
              Réinitialiser
            </button>
          </div>
        </>
      )}
    </section>
  );
}