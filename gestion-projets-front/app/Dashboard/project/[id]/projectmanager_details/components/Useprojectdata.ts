'use client';

import { useState, useCallback, useMemo } from 'react';
import { UserRole } from './Useauth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserLite = {
  id: number;
  fullname?: string;
  email?: string;
  role?: string;
  company?: { id?: number } | null;
  companyId?: number;
};

export type ProjectSummary = {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  domain: string;
  startDate?: string | null;
  endDate?: string | null;
  company?: { id?: number; name?: string } | null;
  createdby?: { id?: number; fullname?: string } | null;
  projectManager?: { id?: number; fullname?: string } | null;
  assignedTo: UserLite[];
  isActive?: boolean;
  updatedAt?: string | null;
};

export type ProjectDetailsResponse = {
  project: ProjectSummary;
  domainDetails: Record<string, any> | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_NEST_API_URL || '';

const DOMAIN_ENDPOINTS: Record<string, string> = {
  IT:         'it-details',
  Marketing:  'marketing-details',
  CallCenter: 'callcenter-details',
};

// Champs autorisés par domaine — doivent correspondre exactement aux DTOs backend
const DOMAIN_DTO_FIELDS: Record<string, string[]> = {
  CallCenter: [
    'numberOfAgents',        // auto depuis teamSize
    'numberOfCallsPerDay',
    'callTypes',             // ";"-séparé, ex: "Tech;Support"
    'slaTargetSeconds',      // number
    'averageHandleTimeSec',  // number
    'estimatedDurationDays', // read-only côté UI, mais envoyé si présent
    'estimatedBudget',       // number | null
    'priority',              // string | null
    'CSAT',
    'FCR',
    'risksScore',
    'dependencies',          // ";"-séparé, ex: "AI;CRM"
    'mainGoals',
    'additionalNotes',
    'teamSize',
    // NB: '_slaPreset' est intentionnellement absent → jamais envoyé au backend
  ],
  Marketing: [
    'campaignType',
    'targetAudience',
    'channels',
    'estimatedDurationDays',
    'estimatedBudget',
    'priority',
    'businessImpact',
    'mainGoals',
    'keyDeliverables',
    'metrics',
    'dependencies',
    'risks',
    'additionalNotes',
    'teamSize',
  ],
IT: [
  'programmingLanguages',
  'framework',
  'database',
  'serverDetails',
  'architecture',
  'apiIntegration',
  'securityRequirements',
  'devOpsRequirements',
  'estimatedDurationDays',
  'estimatedCost',
  'priority',
  'businessImpact',
  'teamSize',
  'complexity',
  'mainModules',
  'keyDeliverables',
  'dependencies',
  'risks',
  'additionalNotes',
],
};

// ─── Numeric fields per domain — coerced to Number before sending to backend ──
// Needed because values loaded from the API may arrive as strings and never go
// through an onChange handler if the user doesn't touch those fields.
const DOMAIN_NUMERIC_FIELDS: Record<string, Set<string>> = {
  CallCenter: new Set([
    'numberOfAgents',
    'numberOfCallsPerDay',
    'slaTargetSeconds',
    'averageHandleTimeSec',
    'estimatedDurationDays',
    'estimatedBudget',
    'CSAT',
    'FCR',
    'risksScore',
    'teamSize',
  ]),
  Marketing: new Set([
    'estimatedDurationDays',
    'estimatedBudget',
    'teamSize',
  ]),
IT: new Set([
  'estimatedDurationDays',
  'estimatedCost',
  'teamSize',
]),
};

const getToken = () =>
  typeof window !== 'undefined'
    ? localStorage.getItem('access_token') || localStorage.getItem('token')
    : '';

const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/** Normalize a single payload value:
 *  - '' → null
 *  - null/undefined → null
 *  - numeric field + non-null → Number (NaN-safe → null)
 */
function normalizeValue(val: any, isNumeric: boolean): any {
  if (val === '' || val === undefined || val === null) return null;
  if (isNumeric) {
    const n = Number(val);
    return isNaN(n) ? null : n;
  }
  return val;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProjectData(projectId: string | undefined) {
  const [data, setData]                         = useState<ProjectDetailsResponse | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [usersLoading, setUsersLoading]         = useState(true);
  const [savingProject, setSavingProject]       = useState(false);
  const [savingDomain, setSavingDomain]         = useState(false);
  const [addingMembers, setAddingMembers]       = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [actionMsg, setActionMsg]               = useState<string | null>(null);

  // ── Project fields ──────────────────────────────────────────────────────────
  const [name, setName]                         = useState('');
  const [description, setDescription]           = useState('');
  const [status, setStatus]                     = useState('');
  const [domain, setDomain]                     = useState('');
  const [startDate, setStartDate]               = useState('');
  const [endDate, setEndDate]                   = useState('');
  const [projectManagerId, setProjectManagerId] = useState<number | ''>('');
  const [domainForm, setDomainForm]             = useState<Record<string, any>>({});

  // ── Users ───────────────────────────────────────────────────────────────────
  const [allCompanyUsers, setAllCompanyUsers] = useState<UserLite[]>([]);

  const memberUsers = allCompanyUsers.filter(u =>
    String(u.role).toLowerCase() === UserRole.MEMBER
  );

  const projectManagerUsers = allCompanyUsers.filter(u =>
    String(u.role).toLowerCase() === UserRole.PROJECT_MANAGER
  );

  // ── Members state ───────────────────────────────────────────────────────────
  const [userSearch, setUserSearch]           = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());

  // ── Date validation ─────────────────────────────────────────────────────────
  const dateError =
    startDate && endDate && endDate < startDate
      ? 'La date de fin ne peut pas être antérieure à la date de début.'
      : null;

  // ── teamSize: membres assignés + PM (si défini) — calculé automatiquement ──
  const teamSize = useMemo(() => {
    const membersCount = data?.project.assignedTo.length ?? 0;
    const pmCount = 0;
    return membersCount + pmCount;
  }, [data?.project.assignedTo.length, projectManagerId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Load
  // ─────────────────────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setUsersLoading(true);
    setError(null);
    setActionMsg(null);

    try {
      // 1. Project + domain details
      const resProject = await fetch(
        `${API_BASE}/projects/${projectId}/details?includeDomainDetails=true`,
        { headers: authHeaders() }
      );
      if (!resProject.ok) throw new Error(await resProject.text() || `Erreur ${resProject.status}`);
      const json: ProjectDetailsResponse = await resProject.json();
      setData(json);

      setName(json.project.name || '');
      setDescription(json.project.description || '');
      setStatus(json.project.status || '');
      setDomain(json.project.domain || '');
      setStartDate(json.project.startDate?.split('T')[0] || '');
      setEndDate(json.project.endDate?.split('T')[0] || '');
      setProjectManagerId(json.project.projectManager?.id ?? '');
      setDomainForm(json.domainDetails ?? {});

      // 2. Users — filtrés par même compagnie
      const resUsers = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
      if (!resUsers.ok) throw new Error('Impossible de récupérer les utilisateurs');
      const allUsers: UserLite[] = await resUsers.json();

      const companyId = json.project.company?.id;
      const sameCompany = companyId
        ? allUsers.filter(u => (u.company as any)?.id === companyId || u.companyId === companyId)
        : allUsers;
      setAllCompanyUsers(sameCompany);

      setSelectedUserIds(new Set((json.project.assignedTo || []).map(u => u.id)));
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
      setUsersLoading(false);
    }
  }, [projectId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Save project
  // ─────────────────────────────────────────────────────────────────────────────

  async function saveProject() {
    if (!projectId || dateError) return;
    setSavingProject(true);
    setError(null);
    setActionMsg(null);
    try {
      const payload: any = {
        name, description, status, domain,
        startDate: startDate || null,
        endDate:   endDate   || null,
      };
      if (projectManagerId !== '') {
        payload.projectManagerId = Number(projectManagerId);
      }

      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method:  'PATCH',
        headers: authHeaders(),
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text() || `Erreur ${res.status}`);
      setActionMsg('Projet mis à jour.');
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingProject(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Save domain details — même logique pour tous les domaines
  // · teamSize calculé automatiquement (membres + PM)
  // · seuls les champs du DTO sont envoyés
  // · les champs null/undefined sont quand même envoyés (pour effacer une valeur)
  // · les chaînes vides '' sont converties en null
  // · les champs numériques sont coercés en Number (fix: l'API renvoie parfois des strings)
  // ─────────────────────────────────────────────────────────────────────────────

  async function saveDomainDetails() {
    if (!projectId) return;
    setSavingDomain(true);
    setError(null);
    setActionMsg(null);

    try {
      const endpoint = DOMAIN_ENDPOINTS[domain];
      if (!endpoint) {
        setActionMsg('Aucun détail spécifique pour ce domaine.');
        return;
      }

      const allowedFields = DOMAIN_DTO_FIELDS[domain];
      const numericFields = DOMAIN_NUMERIC_FIELDS[domain] ?? new Set<string>();

      const formWithTeamSize = {
        ...domainForm,
        teamSize,
        numberOfAgents: teamSize,
      };

      const payload: Record<string, any> = {};

      if (allowedFields) {
        for (const key of allowedFields) {
          payload[key] = normalizeValue(formWithTeamSize[key], numericFields.has(key));
        }
      } else {
        // Domaine inconnu : envoyer tout le formulaire + teamSize
        for (const [key, val] of Object.entries(formWithTeamSize)) {
          payload[key] = normalizeValue(val, numericFields.has(key));
        }
      }

      console.log(payload);

      const res = await fetch(`${API_BASE}/projects/${projectId}/${endpoint}`, {
        method:  'PATCH',
        headers: authHeaders(),
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Erreur ${res.status}`);
      }

      setActionMsg('Détails domaine sauvegardés.');
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Erreur sauvegarde domaine');
    } finally {
      setSavingDomain(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Add members
  // ─────────────────────────────────────────────────────────────────────────────

  async function addSelectedMembers() {
    if (!projectId) return;
    const ids = Array.from(selectedUserIds).filter(id =>
      !(data?.project.assignedTo || []).some(m => m.id === id)
    );
    if (ids.length === 0) { setActionMsg('Aucun nouveau membre sélectionné.'); return; }

    setAddingMembers(true);
    setError(null);
    setActionMsg(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/add-members`, {
        method:  'PATCH',
        headers: authHeaders(),
        body:    JSON.stringify({ memberIds: ids }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || `Erreur ${res.status}`);
      setActionMsg(json?.message || `${ids.length} membre(s) ajouté(s) avec succès`);
      setSelectedUserIds(new Set());
      await loadAll();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout des membres");
    } finally {
      setAddingMembers(false);
    }
  }

  function toggleSelectUser(id: number) {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function resetDomainForm() {
    setDomainForm(data?.domainDetails ?? {});
  }

  function resetMembers() {
    setSelectedUserIds(new Set());
    setUserSearch('');
    setActionMsg(null);
  }

  return {
    // raw data
    data, loading, usersLoading,
    // async states
    savingProject, savingDomain, addingMembers,
    // messages
    error, actionMsg,
    // project fields
    name, setName,
    description, setDescription,
    status, setStatus,
    domain, setDomain,
    startDate, setStartDate,
    endDate, setEndDate,
    projectManagerId, setProjectManagerId,
    domainForm, setDomainForm,
    // user lists
    memberUsers,
    projectManagerUsers,
    // members state
    userSearch, setUserSearch,
    selectedUserIds, setSelectedUserIds,
    // computed
    dateError,
    teamSize,
    // actions
    loadAll,
    saveProject,
    saveDomainDetails,
    addSelectedMembers,
    toggleSelectUser,
    resetDomainForm,
    resetMembers,
  };
}