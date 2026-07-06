'use client';
// ─── CallCenterSprintsPage.tsx ────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, AlertCircle, X, ListTodo } from 'lucide-react';

import type { SprintCallCenter, TaskCallCenter, ProjectMember } from './services/Types';
import { getEmptyTask, getEmptySprint } from './services/Types';
import {
  estimateCallCenterTaskHours,
  estimateAllCallCenterTasks,
  serializeTask,
  safeNum,
} from './services/Callcenterestimationservice';
import {
  computeCallCenterProjectMetrics,
  type CallCenterProjectMetrics,
} from './services/callcenterProjectMetrics';
import {
  estimateCallCenterProjectCost,
} from './services/callcenterCostEstimationService';
import { CallCenterSprintForm } from './components/Callcentersprintform';
import { CallCenterSprintCard } from './components/Callcentersprintcard';
import { validateSprintDatesGeneric } from './services/Datevalidation';
import { useAuth } from '@/Dashboard/project/[id]/projectmanager_details/components/Useauth';

const getAuthToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL ?? 'http://localhost:3001/api/v1';

async function apiFetch(url: string, options: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let body = '';
    try { body = await res.clone().text(); } catch { /* ignore */ }
    console.error(`[API] ${options.method ?? 'GET'} ${url} → ${res.status}`, body);
  }
  return res;
}

// ── Convertit "2026-05-16" ou "2026-05-16T..." en ISO string ─────────────────
const toISO = (v: string | null | undefined): string | null => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const CallCenterSprintsPage: React.FC = () => {
  const params    = useParams() as { id?: string };
  const projectId = params?.id;
  const router    = useRouter();
  const { canEditSprints } = useAuth();

  const [members,             setMembers]             = useState<ProjectMember[]>([]);
  const [sprints,             setSprints]             = useState<SprintCallCenter[]>([]);
  const [callCenterProjectId, setCallCenterProjectId] = useState<number | null>(null);
  const [metrics,             setMetrics]             = useState<CallCenterProjectMetrics | null>(null);
  const [projectStartDate,    setProjectStartDate]    = useState<string | null>(null);
  const [projectEndDate,      setProjectEndDate]      = useState<string | null>(null);

  // ── Données réelles du projet CallCenter (domainDetails) ─────────────────
  const [ccProjectDetails, setCcProjectDetails] = useState<Record<string, any> | null>(null);

  // Ref stable pour members — évite les re-renders en cascade
  const membersRef = useRef<ProjectMember[]>([]);

  const [loading,    setLoading]    = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);
  const [expandedSprints, setExpandedSprints] = useState<Set<number>>(new Set());

  const [showCreate,       setShowCreate]       = useState(false);
  const [newSprint,        setNewSprint]        = useState<SprintCallCenter>(getEmptySprint());
  const [newTasks,         setNewTasks]         = useState<TaskCallCenter[]>([getEmptyTask()]);
  const [estimatingNewIdx, setEstimatingNewIdx] = useState<number | null>(null);

  const [editingSprintId,    setEditingSprintId]    = useState<number | null>(null);
  const [editingSprintData,  setEditingSprintData]  = useState<SprintCallCenter | null>(null);
  const [editingSprintTasks, setEditingSprintTasks] = useState<TaskCallCenter[]>([]);
  const [estimatingEditIdx,  setEstimatingEditIdx]  = useState<number | null>(null);

  const [editingTaskId,       setEditingTaskId]       = useState<number | null>(null);
  const [editingTaskSprintId, setEditingTaskSprintId] = useState<number | null>(null);
  const [editingTaskData,     setEditingTaskData]     = useState<TaskCallCenter | null>(null);
  const [estimatingEditTask,  setEstimatingEditTask]  = useState(false);

  // ── persistCallCenterMetrics ──────────────────────────────────────────────
  const persistCallCenterMetrics = useCallback(
    async (m: CallCenterProjectMetrics, aiCost: number) => {
      if (!projectId) return;
      try {
        await apiFetch(`${apiBase}/projects/${projectId}/callcenter-details`, {
          method:  'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            estimatedDurationDays: m.durationDays,
            estimatedBudget:       Math.round(aiCost),
            teamSize:              m.teamSize,
          }),
        });
      } catch (err) {
        console.error('[persistCallCenterMetrics]', err);
      }
    },
    [projectId],
  );

  // ── refreshCallCenterMetrics ──────────────────────────────────────────────
  // Stratégie hybride :
  //   • KPIs métier (CSAT, FCR, callTypes, SLA…) → données réelles du projet (ccProjectDetails)
  //   • Données dynamiques (agents, types de tâches) → calculées depuis les sprints
  const refreshCallCenterMetrics = useCallback(
    async (updatedSprints: SprintCallCenter[], details: Record<string, any> | null) => {
      if (updatedSprints.length === 0) { setMetrics(null); return; }

      const currentMembers = membersRef.current;
      const m = computeCallCenterProjectMetrics(updatedSprints, currentMembers, currentMembers.length);
      setMetrics(m);
      if (m.totalHours === 0) return;

      // ── Données dynamiques depuis les sprints ──────────────────────────────
      const allTypes = [
        ...new Set(
          updatedSprints.flatMap((sp) => sp.tasks.map((t) => t.type)).filter(Boolean),
        ),
      ].join(';');

      const totalCallVolume = updatedSprints.reduce(
        (s, sp) => s + safeNum(sp.expectedCallVolume), 0,
      );

      // ── Stratégie hybride ─────────────────────────────────────────────────
      const sprintsMeta = {
        // ✅ Dynamique — reflète le travail réel des sprints
        numberOfAgents:      m.teamSize,
        callTypes:           allTypes || details?.callTypes || 'Support',

        // ✅ Données réelles du projet — configurées par le manager
        numberOfCallsPerDay:  safeNum(details?.numberOfCallsPerDay)  || totalCallVolume || 100,
        averageHandleTimeSec: safeNum(details?.averageHandleTimeSec) || 300,
        slaTargetSeconds:     safeNum(details?.slaTargetSeconds)     || 120,
        risksScore:           safeNum(details?.risksScore)           || 0.3,
        dependencies:         details?.dependencies                  || 'CRM',

        // ✅ KPIs métier — toujours depuis le projet, jamais calculés depuis les sprints
        CSAT: safeNum(details?.CSAT) || 80,
        FCR:  safeNum(details?.FCR)  || 0.7,
      };

      const aiCost    = await estimateCallCenterProjectCost(m.durationDays, m.teamSize, sprintsMeta);
      const finalCost = aiCost !== null ? aiCost : m.estimatedBudget;

      await persistCallCenterMetrics(m, finalCost);
      setMetrics({ ...m, estimatedBudget: finalCost });
    },
    [persistCallCenterMetrics],
    // ✅ members retiré des dépendances — on utilise membersRef.current à la place
  );

  // ── Debounce sur le useEffect pour éviter les appels en rafale ───────────
  useEffect(() => {
    if (sprints.length === 0) return;
    const timer = setTimeout(() => {
      refreshCallCenterMetrics(sprints, ccProjectDetails);
    }, 1500);
    return () => clearTimeout(timer);
  }, [sprints, ccProjectDetails, refreshCallCenterMetrics]);

  // ── fetchSprints ──────────────────────────────────────────────────────────
  const fetchSprints = useCallback(async (ccId: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/projects/${ccId}/callcenter-sprints`,
        { headers: { Authorization: `Bearer ${getAuthToken()}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setSprints(Array.isArray(data) ? data : []);
      } else {
        setError('Erreur lors du chargement des sprints');
      }
    } catch {
      setError('Erreur lors du chargement des sprints');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch project details ─────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/projects/${projectId}/details`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        if (res.ok) {
          const data = await res.json();

          const projectMembers = data.project?.assignedTo ?? [];
          setMembers(projectMembers);
          membersRef.current = projectMembers; // ← stable ref

          setProjectStartDate(data.project?.startDate ?? null);
          setProjectEndDate(data.project?.endDate     ?? null);

          // ✅ Sauvegarder les données réelles du projet CallCenter
          const details = data.domainDetails ?? null;
          setCcProjectDetails(details);

          const ccId: number | undefined = details?.id;
          if (ccId) {
            setCallCenterProjectId(ccId);
            fetchSprints(ccId);
          } else {
            setError(
              'Aucun sous-projet Call Center trouvé pour ce projet. ' +
              'Vérifiez que les détails Call Center ont bien été initialisés.',
            );
          }
        }
      } catch (e) {
        console.error(e);
        setError('Erreur lors du chargement du projet');
      }
    })();
  }, [projectId, fetchSprints]);

  const toggleExpand = (id: number) =>
    setExpandedSprints((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── CREATE SPRINT ─────────────────────────────────────────────────────────
  const handleCreateSprint = async () => {
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) {
      setError('Veuillez remplir les champs obligatoires (nom, dates).');
      return;
    }
    if (!callCenterProjectId) {
      setError('ID du projet Call Center introuvable. Rechargez la page.');
      return;
    }

    const sprintErr = validateSprintDatesGeneric(
      undefined,
      newSprint.startDate,
      newSprint.endDate,
      projectStartDate,
      projectEndDate,
      sprints,
    );
    if (sprintErr) { setError(sprintErr); return; }

    const validTasks = newTasks.filter((t) => t.title.trim());

    setEstimating(true);
    const tasksWithAI = await estimateAllCallCenterTasks(validTasks);
    setEstimating(false);

    setLoading(true);
    try {
      const token   = getAuthToken();
      const payload = [{
        ...newSprint,
        targetAgents:         Number(newSprint.targetAgents         ?? 0),
        expectedCallVolume:   Number(newSprint.expectedCallVolume   ?? 0),
        targetConversionRate: Number(newSprint.targetConversionRate ?? 0),
        budgetAllocated:      Number(newSprint.budgetAllocated      ?? 0),
        qualityScoreTarget:   Number(newSprint.qualityScoreTarget   ?? 0),
        startDate:            toISO(newSprint.startDate)!,
        endDate:              toISO(newSprint.endDate)!,
        tasks: tasksWithAI.map(serializeTask),
      }];

      const res = await apiFetch(
        `${apiBase}/projects/${callCenterProjectId}/callcenter-sprints`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error('Erreur lors de la création du sprint');

      setSuccess('Sprint créé avec succès !');
      setShowCreate(false);
      setNewSprint(getEmptySprint());
      setNewTasks([getEmptyTask()]);
      fetchSprints(callCenterProjectId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateNewTask = async (idx: number) => {
    setEstimatingNewIdx(idx);
    const hours = await estimateCallCenterTaskHours(newTasks[idx]);
    setEstimatingNewIdx(null);
    if (hours !== null) {
      setNewTasks((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], aiEstimatedHours: hours, estimatedHours: hours };
        return next;
      });
    }
  };

  // ── EDIT SPRINT ───────────────────────────────────────────────────────────
  const handleEditSprint = (sprint: SprintCallCenter) => {
    setEditingSprintId(sprint.id ?? 0);
    setEditingSprintData({ ...sprint });
    
    // Normalize tasks so that <input type="date"> and assignedTo <select> work properly
    const normalizedTasks = sprint.tasks.map((task: any) => {
      const rawAssignee = task.assignedTo;
      const assigneeId = rawAssignee
        ? Number(typeof rawAssignee === 'object' ? rawAssignee.id : rawAssignee)
        : '';
      return {
        ...task,
        assignedTo: (assigneeId && !isNaN(assigneeId as number)) ? assigneeId : '',
        scheduledStartDate: toDateInput(task.scheduledStartDate),
        scheduledEndDate:   toDateInput(task.scheduledEndDate),
      };
    });
    setEditingSprintTasks(normalizedTasks);
  };

  const handleSaveSprint = async () => {
    if (!editingSprintData || !editingSprintId) return;
    if (!callCenterProjectId) { setError('ID du projet Call Center introuvable.'); return; }

    const sprintErr = validateSprintDatesGeneric(
      editingSprintId,
      editingSprintData.startDate,
      editingSprintData.endDate,
      projectStartDate,
      projectEndDate,
      sprints,
    );
    if (sprintErr) { setError(sprintErr); return; }

    setLoading(true);
    try {
      const token = getAuthToken();

      const res = await apiFetch(
        `${apiBase}/projects/callcenter-sprints/${editingSprintId}`,
        {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name:                 editingSprintData.name,
            startDate:            toISO(editingSprintData.startDate)!,
            endDate:              toISO(editingSprintData.endDate)!,
            status:               editingSprintData.status,
            priority:             editingSprintData.priority,
            complexity:           editingSprintData.complexity,
            targetAgents:         Number(editingSprintData.targetAgents         ?? 0),
            expectedCallVolume:   Number(editingSprintData.expectedCallVolume   ?? 0),
            targetConversionRate: Number(editingSprintData.targetConversionRate ?? 0),
            budgetAllocated:      Number(editingSprintData.budgetAllocated      ?? 0),
            qualityScoreTarget:   Number(editingSprintData.qualityScoreTarget   ?? 0),
            trainingContent:      editingSprintData.trainingContent,
            scriptTemplates:      editingSprintData.scriptTemplates,
            goals:                editingSprintData.goals,
          }),
        },
      );
      if (!res.ok) throw new Error('Erreur lors de la mise à jour du sprint');

      const newlyAdded = editingSprintTasks.filter((t) => !t.id && t.title.trim());
      if (newlyAdded.length) {
        setEstimating(true);
        const withAI = await estimateAllCallCenterTasks(newlyAdded);
        setEstimating(false);
        for (const task of withAI) {
          const taskRes = await apiFetch(
            `${apiBase}/projects/callcenter-sprints/${editingSprintId}/tasks`,
            {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body:    JSON.stringify(serializeTask(task)),
            },
          );
          if (!taskRes.ok) throw new Error('Erreur lors de la création de la tâche');
        }
      }

      const existingTasks = editingSprintTasks.filter((t) => t.id && t.title.trim());
      for (const task of existingTasks) {
        const taskRes = await apiFetch(`${apiBase}/projects/callcenter-tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(serializeTask(task)),
        });
        if (!taskRes.ok) throw new Error(`Erreur lors de la mise à jour de la tâche ${task.title}`);
      }

      setSuccess('Ticket mis à jour !');
      setEditingSprintId(null);
      setEditingSprintData(null);
      setEditingSprintTasks([]);
      fetchSprints(callCenterProjectId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateEditTask = async (idx: number) => {
    setEstimatingEditIdx(idx);
    const hours = await estimateCallCenterTaskHours(editingSprintTasks[idx]);
    setEstimatingEditIdx(null);
    if (hours !== null) {
      setEditingSprintTasks((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], aiEstimatedHours: hours, estimatedHours: hours };
        return next;
      });
    }
  };

  const handleDeleteSprint = async (id: number) => {
    if (!confirm('Supprimer ce ticket et toutes ses tâches ?')) return;
    if (!callCenterProjectId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/projects/callcenter-sprints/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setSprints((prev) => prev.filter((s) => s.id !== id));
      setSuccess('Ticket supprimé !');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── EDIT TASK ─────────────────────────────────────────────────────────────
  /** Converts an ISO timestamp → "YYYY-MM-DD" for <input type="date">. Returns '' if empty/invalid. */
  const toDateInput = (val: string | Date | null | undefined): string => {
    if (!val) return '';
    const d = new Date(val as string);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const handleStartEditTask = (task: TaskCallCenter, sprintId: number) => {
    setEditingTaskId(task.id ?? 0);
    setEditingTaskSprintId(sprintId);
    // Resolve assignedTo: API may return an object { id, ... } or a string/number
    const rawId = (task as any).assignedTo;
    const normalizedId =
      typeof rawId === 'object' && rawId !== null && 'id' in rawId
        ? String((rawId as any).id)
        : String(rawId ?? '');
    setEditingTaskData({
      ...task,
      assignedTo: normalizedId,
      // Normalize ISO timestamps → YYYY-MM-DD so <input type="date"> shows the value
      scheduledStartDate: toDateInput((task as any).scheduledStartDate),
      scheduledEndDate:   toDateInput((task as any).scheduledEndDate),
    });
  };

  const handleSaveTask = async () => {
    if (!editingTaskData || !editingTaskId || !callCenterProjectId) return;

    setEstimatingEditTask(true);
    const hours = await estimateCallCenterTaskHours(editingTaskData);
    setEstimatingEditTask(false);

    const taskWithAI: TaskCallCenter = {
      ...editingTaskData,
      aiEstimatedHours: hours ?? editingTaskData.aiEstimatedHours,
      estimatedHours:   hours ?? editingTaskData.estimatedHours ?? 0,
    };

    setLoading(true);
    try {
      const res = await apiFetch(
        `${apiBase}/projects/callcenter-tasks/${editingTaskId}`,
        {
          method:  'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(serializeTask(taskWithAI)),
        },
      );
      if (!res.ok) throw new Error('Erreur lors de la mise à jour de la tâche');

      setSprints((prev) =>
        prev.map((s) =>
          s.id === editingTaskSprintId
            ? { ...s, tasks: s.tasks.map((t) => (t.id === editingTaskId ? taskWithAI : t)) }
            : s,
        ),
      );
      setSuccess('Tâche mise à jour !');
      setEditingTaskId(null);
      setEditingTaskSprintId(null);
      setEditingTaskData(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number, sprintId: number) => {
    if (!confirm('Supprimer cette tâche ?')) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/projects/callcenter-tasks/${taskId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setSprints((prev) =>
        prev.map((s) =>
          s.id === sprintId
            ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) }
            : s,
        ),
      );
      setSuccess('Tâche supprimée !');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-2 transition-colors font-medium"
            >
              <ChevronLeft size={18} /> Retour au projet
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Tickets Call Center
            </h1>
            <p className="text-slate-500 mt-1">
              Gérez vos campagnes d'appels, assignez les agents et suivez les performances.
            </p>
          </div>
          {canEditSprints && (
            <button
              onClick={() => setShowCreate((v) => !v)}
              disabled={!callCenterProjectId}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg
                         font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              {showCreate ? 'Annuler' : 'Nouveau Ticket'}
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-700">
            <div className="flex items-center gap-3"><AlertCircle size={20} /><span>{error}</span></div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X size={18} /></button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-700">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700"><X size={18} /></button>
          </div>
        )}

        {/* Metrics */}
        {metrics && metrics.totalHours > 0 && (
          <div className="mb-6 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">
              Résumé du projet Call Center
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-2xl font-extrabold text-blue-600">{Math.round(metrics.totalHours)}h</p>
                <p className="text-xs text-slate-500 mt-1">Heures estimées</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl">
                <p className="text-2xl font-extrabold text-indigo-600">{metrics.teamSize}</p>
                <p className="text-xs text-slate-500 mt-1">Agents</p>
              </div>
              <div className="p-4 bg-violet-50 rounded-xl">
                <p className="text-2xl font-extrabold text-violet-600">{metrics.durationDays}j</p>
                <p className="text-xs text-slate-500 mt-1">Durée estimée</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-2xl font-extrabold text-amber-600">
                  {metrics.estimatedBudget.toLocaleString('fr-FR', {
                    style: 'currency', currency: 'TND', maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-slate-500 mt-1">Coût IA estimé</p>
              </div>
            </div>
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <CallCenterSprintForm
            mode="create"
            sprint={newSprint}
            tasks={newTasks}
            members={members}
            loading={loading}
            estimating={estimating}
            estimatingTaskIdx={estimatingNewIdx}
            allSprints={sprints}
            projectStartDate={projectStartDate}
            projectEndDate={projectEndDate}
            onSprintChange={(field, value) =>
              setNewSprint((prev) => ({ ...prev, [field]: value }))
            }
            onTaskChange={(idx, field, value) => {
              setNewTasks((prev) => {
                const next = [...prev];
                next[idx] = { ...next[idx], [field]: value };
                return next;
              });
            }}
            onAddTask={() => setNewTasks((prev) => [...prev, getEmptyTask()])}
            onRemoveTask={(idx) =>
              setNewTasks((prev) =>
                prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
              )
            }
            onEstimateTask={handleEstimateNewTask}
            onSave={handleCreateSprint}
            onCancel={() => {
              setShowCreate(false);
              setNewSprint(getEmptySprint());
              setNewTasks([getEmptyTask()]);
            }}
          />
        )}

        {loading && !showCreate && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className="text-slate-600 mt-4">Chargement des tickets…</p>
          </div>
        )}

        {!loading && sprints.length === 0 && !showCreate && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <ListTodo size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-lg">Aucun ticket Call Center trouvé</p>
            <p className="text-slate-400 text-sm mt-2">Créez votre premier ticket pour commencer</p>
          </div>
        )}

        {!loading && sprints.length > 0 && (
          <div className="space-y-4">
            {sprints.map((sprint) => (
              <CallCenterSprintCard
                key={sprint.id}
                sprint={sprint}
                members={members}
                isExpanded={expandedSprints.has(sprint.id!)}
                isEditing={editingSprintId === sprint.id}
                editingSprintData={editingSprintData}
                editingSprintTasks={editingSprintTasks}
                editingTaskId={editingTaskId}
                editingTaskSprintId={editingTaskSprintId}
                editingTaskData={editingTaskData}
                estimatingTaskIdx={editingSprintId === sprint.id ? estimatingEditIdx : null}
                loading={loading}
                estimating={estimating}
                allSprints={sprints}
                projectStartDate={projectStartDate}
                projectEndDate={projectEndDate}
                onToggleExpand={toggleExpand}
                onStartEditSprint={handleEditSprint}
                onSprintChange={(field, value) =>
                  setEditingSprintData((prev) => prev ? { ...prev, [field]: value } : prev)
                }
                onSprintTaskChange={(idx, field, value) => {
                  setEditingSprintTasks((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], [field]: value };
                    return next;
                  });
                }}
                onAddSprintTask={() =>
                  setEditingSprintTasks((prev) => [...prev, getEmptyTask()])
                }
                onRemoveSprintTask={(idx) => {
                  const task = editingSprintTasks[idx];
                  if (task.id) {
                    setError('Utilisez le bouton Supprimer pour les tâches existantes.');
                  } else {
                    setEditingSprintTasks((prev) => prev.filter((_, i) => i !== idx));
                  }
                }}
                onEstimateSprintTask={handleEstimateEditTask}
                onSaveSprint={handleSaveSprint}
                onCancelEditSprint={() => {
                  setEditingSprintId(null);
                  setEditingSprintData(null);
                  setEditingSprintTasks([]);
                }}
                onDeleteSprint={handleDeleteSprint}
                onStartEditTask={handleStartEditTask}
                onEditTaskChange={(field, value) =>
                  setEditingTaskData((prev) => prev ? { ...prev, [field]: value } : prev)
                }
                onEstimateEditingTask={async () => {
                  if (!editingTaskData) return;
                  setEstimatingEditTask(true);
                  const hours = await estimateCallCenterTaskHours(editingTaskData);
                  setEstimatingEditTask(false);
                  if (hours !== null) {
                    setEditingTaskData((prev) =>
                      prev ? { ...prev, aiEstimatedHours: hours, estimatedHours: hours } : prev,
                    );
                  }
                }}
                onSaveTask={handleSaveTask}
                onCancelEditTask={() => {
                  setEditingTaskId(null);
                  setEditingTaskSprintId(null);
                  setEditingTaskData(null);
                }}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallCenterSprintsPage;