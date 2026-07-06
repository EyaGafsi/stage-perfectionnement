'use client';
// ─── SprintsPage.tsx ──────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, AlertCircle, X, ListTodo, Zap, Calendar, AlertTriangle } from 'lucide-react';

import type { Sprint, Task, ProjectMember } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { getEmptyTask } from '@/Dashboard/project/[id]/sprintslist/services/types';
import {
  estimateTaskHours,
  fetchMemberStats,
  estimateAllTaskHours,
} from '@/Dashboard/project/[id]/sprintslist/services/estimationService';
import {
  computeProjectMetrics,
  type ProjectMetrics,
} from '@/Dashboard/project/[id]/sprintslist/services/projectMetrics';
import {
  estimateProjectCost,
  type CostEstimationRequest,
} from '@/Dashboard/project/[id]/sprintslist/services/costEstimationService';
import { SprintForm }          from '@/Dashboard/project/[id]/sprintslist/components/SprintForm';
import { SprintCard }          from '@/Dashboard/project/[id]/sprintslist/components/SprintCard';
import { ProjectSummaryPanel } from '@/Dashboard/project/[id]/sprintslist/components/ProjectSummaryPanel';
import { predictTaskDelay }    from '@/Dashboard/project/[id]/sprintslist/services/delayPredictionService';
import { useAuth }             from '@/Dashboard/project/[id]/projectmanager_details/components/Useauth';

const getAuthToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

function emptyNewSprint(): Sprint {
  return {
    name: '', startDate: '', endDate: '',
    status: 'planned', priority: 'Medium', complexity: 'Medium',
    tasks: [],
  };
}

const SprintsPage = () => {
  const params    = useParams() as { id?: string };
  const projectId = params?.id;
  const router    = useRouter();
  const { canEditSprints } = useAuth();

  const [members, setMembers]   = useState<ProjectMember[]>([]);
  const [sprints, setSprints]   = useState<Sprint[]>([]);
  const [metrics, setMetrics]   = useState<ProjectMetrics | null>(null);

  const [projectStartDate, setProjectStartDate] = useState<string | undefined>();
  const [projectEndDate,   setProjectEndDate]   = useState<string | undefined>();

  const [itDetails,   setItDetails]   = useState<Partial<CostEstimationRequest>>({});
  const [itProjectId, setItProjectId] = useState<number | null>(null);

  const [loading,    setLoading]    = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);
  const [expandedSprints, setExpandedSprints] = useState<Set<number>>(new Set());

  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [newSprint,        setNewSprint]         = useState<Sprint>(emptyNewSprint());
  const [newSprintTasks,   setNewSprintTasks]    = useState<Task[]>([getEmptyTask()]);

  const [editingSprintId,    setEditingSprintId]    = useState<number | null>(null);
  const [editingSprintData,  setEditingSprintData]  = useState<Sprint | null>(null);
  const [editingSprintTasks, setEditingSprintTasks] = useState<Task[]>([]);

  const [editingTaskId,       setEditingTaskId]       = useState<number | null>(null);
  const [editingTaskSprintId, setEditingTaskSprintId] = useState<number | null>(null);
  const [editingTaskData,     setEditingTaskData]     = useState<Task | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL;

  async function apiFetch(url: string, options: RequestInit): Promise<Response> {
    const res = await fetch(url, options);
    if (!res.ok) {
      let body = '';
      try { body = await res.clone().text(); } catch { /* ignore */ }
      console.error(`[API] ${options.method ?? 'GET'} ${url} → ${res.status}`, body);
    }
    return res;
  }

  const persistProjectMetrics = useCallback(
    async (m: ProjectMetrics, aiCost: number, itId: number) => {
      try {
        const token = getAuthToken();
        const body = {
          estimatedDurationDays: m.durationDays,
          estimatedCost:         Math.round(aiCost * 100) / 100,
          teamSize:              m.teamSize,
        };
        await apiFetch(`${apiBase}/projects/${itId}/it-details`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      } catch (err) {
        console.error('[persistProjectMetrics]', err);
      }
    },
    [apiBase],
  );

  const refreshMetrics = useCallback(
    async (updatedSprints: Sprint[], itId: number | null) => {
      if (updatedSprints.length === 0) { setMetrics(null); return; }
      const m = computeProjectMetrics(updatedSprints, members, members.length);
      setMetrics(m);
      if (!itId) return;
      const token   = getAuthToken();
      const aiCost  = await estimateProjectCost(m.durationDays, m.teamSize, itDetails, token);
      const finalCost = aiCost !== null ? aiCost : m.estimatedCost;
      await persistProjectMetrics(m, finalCost, itId);
      setMetrics({ ...m, estimatedCost: finalCost });
    },
    [members, itDetails, persistProjectMetrics],
  );

  useEffect(() => { refreshMetrics(sprints, itProjectId); }, [sprints]);

  // ── Unique useEffect : charge les détails projet + sprints dans l'ordre ──
  useEffect(() => {
    if (!projectId) return;
    const token = getAuthToken();
    setLoading(true);

    fetch(`${apiBase}/projects/${projectId}/details?includeDomainDetails=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;

        setMembers(data.project?.assignedTo ?? []);
        const proj = data.project ?? {};
        if (proj.startDate) setProjectStartDate(proj.startDate);
        if (proj.endDate)   setProjectEndDate(proj.endDate);

        // ── Récupère l'ID du ProjectITEntity depuis domainDetails ──
        const itId = data.domainDetails?.id ?? proj.itDetails?.id ?? null;
        setItProjectId(itId);

        const it = data.domainDetails ?? proj.itDetails ?? {};
        setItDetails({
          programmingLanguages: it.programmingLanguages,
          framework:            it.framework,
          database:             it.database,
          serverDetails:        it.serverDetails,
          architecture:         it.architecture,
          apiIntegration:       it.apiIntegration,
          securityRequirements: it.securityRequirements,
          devOpsRequirements:   it.devOpsRequirements,
          priority:             it.priority,
          businessImpact:       it.businessImpact,
          complexity:           it.complexity,
          mainModules:          it.mainModules,
        });

        // ── Charge les sprints avec l'ID IT — chaîné ici pour éviter le null ──
        if (itId) {
          return fetch(`${apiBase}/projects/${projectId}/sprints`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => (r.ok ? r.json() : []))
            .then((sprintsData) => setSprints(Array.isArray(sprintsData) ? sprintsData : []));
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Erreur lors du chargement du projet');
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  // ── fetchSprints utilise itProjectId (pour les refresh après create/edit) ──
  const fetchSprints = async (itId?: number) => {
    const id = itId ?? itProjectId;
    if (!id) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiBase}/projects/${projectId}/sprints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSprints(Array.isArray(data) ? data : []);
      }
    } catch {
      setError('Erreur lors du chargement des sprints');
    } finally {
      setLoading(false);
    }
  };

  const toggleSprintExpanded = (sprintId: number) => {
    setExpandedSprints((prev) => {
      const next = new Set(prev);
      next.has(sprintId) ? next.delete(sprintId) : next.add(sprintId);
      return next;
    });
  };

  const handleEstimateNewSprintTaskPreview = async (index: number) => {
    const task = newSprintTasks[index];
    if (!task || !task.title.trim()) return;
    
    setEstimating(true);
    const token = getAuthToken();

    let memberStats = null;
    if (task.assignedTo) {
      memberStats = await fetchMemberStats(task.assignedTo, token);
    }

    const [aiHours, delayPrediction] = await Promise.all([
      estimateTaskHours(task, token, members, memberStats),
      predictTaskDelay(task, members, memberStats).catch(err => {
        console.error('Failed to predict delay:', err);
        return null;
      })
    ]);
    
    setEstimating(false);
    
    setNewSprintTasks((prev) => {
      const next = [...prev];
      next[index] = {
        ...task,
        aiEstimatedHours: aiHours ?? task.aiEstimatedHours,
        estimatedHours:   aiHours ?? task.estimatedHours ?? 0,
        aiDelayRiskProbability: delayPrediction?.risk_probability,
        aiPredictedDelayReason: delayPrediction?.will_be_delayed ? delayPrediction?.predicted_reason : undefined,
      };
      return next;
    });
  };

  const handleCreateSprint = async () => {
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) {
      setError('Veuillez remplir tous les champs obligatoires du sprint');
      return;
    }
    if (!itProjectId) {
      setError('Les détails IT du projet ne sont pas encore chargés. Veuillez patienter.');
      return;
    }
    const validTasks = newSprintTasks.filter((t) => t.title.trim());
    setEstimating(true);
    const token = getAuthToken();
    const tasksWithEstimates = await estimateAllTaskHours(validTasks, token, members);
    setEstimating(false);
    setLoading(true);
    try {
      const payload = [{
        ...newSprint,
        startDate: new Date(newSprint.startDate).toISOString(),
        endDate:   new Date(newSprint.endDate).toISOString(),
        tasks: tasksWithEstimates.map(serializeTask),
      }];
      const res = await apiFetch(`${apiBase}/projects/${itProjectId}/sprints`, {        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur lors de la création du sprint');
      setSuccess('Sprint créé avec succès!');
      setShowCreateSprint(false);
      setNewSprint(emptyNewSprint());
      setNewSprintTasks([getEmptyTask()]);
      await fetchSprints();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSprint = (sprint: Sprint) => {
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

  const handleEstimateEditingSprintTaskPreview = async (index: number) => {
    const task = editingSprintTasks[index];
    if (!task || !task.title.trim()) return;
    
    setEstimating(true);
    const token = getAuthToken();

    let memberStats = null;
    if (task.assignedTo) {
      memberStats = await fetchMemberStats(task.assignedTo, token);
    }

    const [aiHours, delayPrediction] = await Promise.all([
      estimateTaskHours(task, token, members, memberStats),
      predictTaskDelay(task, members, memberStats).catch(err => {
        console.error('Failed to predict delay:', err);
        return null;
      })
    ]);
    
    setEstimating(false);
    
    setEditingSprintTasks((prev) => {
      const next = [...prev];
      next[index] = {
        ...task,
        aiEstimatedHours: aiHours ?? task.aiEstimatedHours,
        estimatedHours:   aiHours ?? task.estimatedHours ?? 0,
        aiDelayRiskProbability: delayPrediction?.risk_probability,
        aiPredictedDelayReason: delayPrediction?.will_be_delayed ? delayPrediction?.predicted_reason : undefined,
      };
      return next;
    });
  };

  const handleSaveSprint = async () => {
    if (!editingSprintData || !editingSprintId) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const safeDate = (d: string | null | undefined) => {
        if (!d) return null;
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? null : dt.toISOString();
      };
      
      const res = await apiFetch(`${apiBase}/projects/sprints/${editingSprintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name:       editingSprintData.name,
          startDate:  safeDate(editingSprintData.startDate),
          endDate:    safeDate(editingSprintData.endDate),
          status:     editingSprintData.status,
          priority:   editingSprintData.priority,
          complexity: editingSprintData.complexity,
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour du sprint');

      const newTasks = editingSprintTasks.filter((t) => !t.id && t.title.trim());
      if (newTasks.length) {
        setEstimating(true);
        const tasksWithEstimates = await estimateAllTaskHours(newTasks, token, members);
        setEstimating(false);
        for (const task of tasksWithEstimates) {
          const r = await apiFetch(`${apiBase}/projects/sprints/${editingSprintId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(serializeTask(task)),
          });
          if (!r.ok) throw new Error('Erreur lors de la création de la tâche');
        }
      }

      const existingTasks = editingSprintTasks.filter((t) => t.id && t.title.trim());
      if (existingTasks.length) {
        setEstimating(true);
        const existingWithEstimates = await estimateAllTaskHours(existingTasks, token, members);
        setEstimating(false);
        for (const task of existingWithEstimates) {
          const r = await apiFetch(`${apiBase}/projects/tasks/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(serializeTask(task)),
          });
          if (!r.ok) throw new Error(`Erreur lors de la mise à jour de la tâche ${task.title}`);
        }
      }

      setSuccess('Sprint mis à jour avec succès!');
      setEditingSprintId(null);
      setEditingSprintData(null);
      setEditingSprintTasks([]);
      await fetchSprints();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSprint = async (sprintId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce sprint?')) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await apiFetch(`${apiBase}/projects/sprints/${sprintId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setSprints(sprints.filter((s) => s.id !== sprintId));
      setSuccess('Sprint supprimé!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /** Convert an ISO timestamp → "YYYY-MM-DD" for <input type="date">.
   *  Returns empty string if falsy or unparseable. */
  const toDateInput = (val: string | Date | null | undefined): string => {
    if (!val) return '';
    const d = new Date(val as string);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const handleStartEditTask = (task: Task, sprintId: number) => {
    setEditingTaskId(task.id ?? 0);
    setEditingTaskSprintId(sprintId);

    // Resolve assignedTo: API can return an object { id, email, … } or a number
    const rawAssignee = (task as any).assignedTo;
    const assigneeId = rawAssignee
      ? Number(typeof rawAssignee === 'object' ? rawAssignee.id : rawAssignee)
      : ('' as any);

    setEditingTaskData({
      ...task,
      assignedTo: (assigneeId && !isNaN(assigneeId)) ? assigneeId : ('' as any),
      // Normalize ISO timestamps → YYYY-MM-DD so <input type="date"> displays correctly
      scheduledStartDate: toDateInput((task as any).scheduledStartDate),
      scheduledEndDate:   toDateInput((task as any).scheduledEndDate),
    });
  };

  const handleEstimateTaskPreview = async () => {
    if (!editingTaskData || !editingTaskId) return;
    setEstimating(true);
    const token = getAuthToken();

    let memberStats = null;
    if (editingTaskData.assignedTo) {
      memberStats = await fetchMemberStats(editingTaskData.assignedTo, token);
    }

    const [aiHours, delayPrediction] = await Promise.all([
      estimateTaskHours(editingTaskData, token, members, memberStats),
      predictTaskDelay(editingTaskData, members, memberStats).catch(err => {
        console.error('Failed to predict delay:', err);
        return null;
      })
    ]);
    
    setEstimating(false);
    setEditingTaskData({
      ...editingTaskData,
      aiEstimatedHours: aiHours ?? editingTaskData.aiEstimatedHours,
      estimatedHours:   aiHours ?? editingTaskData.estimatedHours ?? 0,
      aiDelayRiskProbability: delayPrediction?.risk_probability,
      aiPredictedDelayReason: delayPrediction?.will_be_delayed ? delayPrediction?.predicted_reason : undefined,
    });
  };

  const handleSaveTask = async () => {
    if (!editingTaskData || !editingTaskId) return;
    setEstimating(true);
    const token = getAuthToken();

    // ── Fetch les stats historiques de ce membre pour l'estimation IA ──
    let memberStats = null;
    if (editingTaskData.assignedTo) {
      memberStats = await fetchMemberStats(editingTaskData.assignedTo, token);
    }

    const [aiHours, delayPrediction] = await Promise.all([
      estimateTaskHours(editingTaskData, token, members, memberStats),
      predictTaskDelay(editingTaskData, members, memberStats).catch(err => {
        console.error('Failed to predict delay:', err);
        return null;
      })
    ]);
    
    setEstimating(false);
    const taskWithAI: Task = {
      ...editingTaskData,
      aiEstimatedHours: aiHours ?? editingTaskData.aiEstimatedHours,
      estimatedHours:   aiHours ?? editingTaskData.estimatedHours ?? 0,
      aiDelayRiskProbability: delayPrediction?.risk_probability ?? editingTaskData.aiDelayRiskProbability,
      aiPredictedDelayReason: delayPrediction 
        ? (delayPrediction.will_be_delayed ? delayPrediction.predicted_reason : 'Aucun risque majeur')
        : editingTaskData.aiPredictedDelayReason,
    };
    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/projects/tasks/${editingTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(serializeTask(taskWithAI)),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour');
      const updatedSprints = sprints.map((s) =>
        s.id === editingTaskSprintId
          ? { ...s, tasks: s.tasks.map((t) => (t.id === editingTaskId ? taskWithAI : t)) }
          : s,
      );
      setSprints(updatedSprints);
      setSuccess('Tâche mise à jour!');
      setEditingTaskId(null);
      setEditingTaskSprintId(null);
      setEditingTaskData(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (val: string | null | undefined): string | null => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const handleDeleteTask = async (taskId: number, sprintId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche?')) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await apiFetch(`${apiBase}/projects/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setSprints(sprints.map((s) =>
        s.id === sprintId ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) } : s,
      ));
      setSuccess('Tâche supprimée!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  function serializeTask(t: Task): Record<string, unknown> {
    const estimatedHours =
      t.aiEstimatedHours != null ? Number(t.aiEstimatedHours) : Number(t.estimatedHours) || 0;
    const dependenciesRaw   = t.dependencies?.trim() ?? '';
    const dependenciesCount = dependenciesRaw ? dependenciesRaw.split(',').filter(Boolean).length : 0;
    const hasBlockingDependencies = dependenciesCount > 0;
    const assignedTo = (() => {
      const raw = t.assignedTo;
      if (!raw) return null;
      if (typeof raw === 'object' && 'id' in raw) {
        const id = Number((raw as any).id);
        return isNaN(id) || id === 0 ? null : { id };
      }
      const id = Number(raw);
      return isNaN(id) || id === 0 ? null : { id };
    })();
      let computedDelay = Number(t.delayHours ?? 0) || 0;
      if (t.status !== 'DONE' && t.scheduledEndDate) {
        const endDate = new Date(t.scheduledEndDate);
        const now = new Date();
        if (!isNaN(endDate.getTime()) && now > endDate) {
          computedDelay = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60);
        }
      }

      return {
        title: t.title, description: t.description ?? null,
        type: t.type ?? 'FEATURE', status: t.status ?? 'TO_DO', priority: t.priority ?? 'MEDIUM',
        storyPoints: Number(t.storyPoints) || 0, estimatedHours,
        complexityScore: Number(t.complexityScore) || 1, riskLevel: Number(t.riskLevel) || 1,
        complexity: t.complexity ?? 'Medium',
        hasBlockingDependencies, dependenciesCount,
        dependencies: dependenciesRaw || null, risks: t.risks || null,
        additionalNotes: t.additionalNotes || null,
        delayHours: computedDelay,
        aiEstimatedHours: t.aiEstimatedHours,
        aiDelayRiskProbability: t.aiDelayRiskProbability,
        aiPredictedDelayReason: t.aiPredictedDelayReason,
      scheduledStartDate: formatDate(t.scheduledStartDate ?? null),
      scheduledEndDate:   formatDate(t.scheduledEndDate   ?? null),
      assignedTo,
    };
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-slate-100">

      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-teal-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => router.back()}
              className="shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9
                         rounded-xl text-teal-600 hover:bg-teal-50 transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-slate-800 truncate leading-tight">
                Gestion des Sprints
              </h1>
              {(projectStartDate || projectEndDate) && (
                <p className="hidden sm:flex items-center gap-1 text-xs text-teal-600 leading-tight mt-0.5">
                  <Calendar size={11} />
                  {projectStartDate && (
                    <span>{new Date(projectStartDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  )}
                  {projectStartDate && projectEndDate && <span>→</span>}
                  {projectEndDate && (
                    <span className="font-semibold">
                      {new Date(projectEndDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {canEditSprints && (
            <button
              onClick={() => setShowCreateSprint((v) => !v)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5
                          rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95
                          ${showCreateSprint
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-teal-200'
                          }`}
            >
              {showCreateSprint
                ? <><X size={14} /><span>Annuler</span></>
                : <><Plus size={14} /><span className="hidden xs:inline sm:inline">Nouveau </span><span>Sprint</span></>
              }
            </button>
          )}
        </div>
      </header>

      {(projectStartDate || projectEndDate) && (
        <div className="sm:hidden bg-gradient-to-r from-teal-500 to-cyan-500 text-white
                        text-xs px-4 py-1.5 flex items-center gap-2">
          <Calendar size={11} className="shrink-0" />
          <span className="truncate">
            {projectStartDate && (
              <span>{new Date(projectStartDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → </span>
            )}
            {projectEndDate && (
              <span className="font-semibold">
                Deadline : {new Date(projectEndDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </span>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4 pb-8">

        {estimating && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-teal-50 border border-teal-200
                          rounded-xl text-teal-700 text-xs sm:text-sm font-medium">
            <Zap size={14} className="animate-pulse shrink-0 text-teal-500" />
            Estimation IA en cours…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 p-3 sm:p-4 bg-red-50 border border-red-200
                          rounded-xl text-red-700 text-xs sm:text-sm">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span className="flex-1 leading-snug">{error}</span>
            <button onClick={() => setError(null)} className="shrink-0 p-0.5 hover:text-red-900 transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center justify-between gap-2 p-3 sm:p-4 bg-teal-50
                          border border-teal-200 rounded-xl text-teal-700 text-xs sm:text-sm font-medium">
            <span>✓ {success}</span>
            <button onClick={() => setSuccess(null)} className="shrink-0 hover:text-teal-900 transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        {sprints.length > 0 && (() => {
          const allTasks = sprints.flatMap(s => s.tasks ?? []);
          const overdueTasks = allTasks.filter(task => {
            if (task.status === 'DONE' || task.status === 'IN_REVIEW' || !task.scheduledEndDate) return false;
            const end = new Date(task.scheduledEndDate);
            const now = new Date();
            return !isNaN(end.getTime()) && now > end;
          });
          if (overdueTasks.length === 0) return null;
          return (
            <div className="flex flex-col gap-2 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm sm:text-base">
                <AlertTriangle size={18} />
                Attention : {overdueTasks.length} tâche{overdueTasks.length > 1 ? 's' : ''} en retard
              </div>
              <p className="text-xs sm:text-sm text-red-600">
                Certaines tâches ont dépassé leur date d'échéance. Vérifiez les justifications de retard apportées par les membres.
              </p>
            </div>
          );
        })()}

        {metrics && (
          <ProjectSummaryPanel metrics={metrics} />
        )}

        {showCreateSprint && (
          <div className="bg-white rounded-2xl border border-teal-100 shadow-sm shadow-teal-100 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 sm:px-6 py-3 sm:py-4
                            bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500
                              flex items-center justify-center shrink-0">
                <Plus size={14} className="text-white" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">Nouveau sprint</h2>
            </div>
            <SprintForm
              mode="create"
              sprint={newSprint}
              tasks={newSprintTasks}
              members={members}
              allSprints={sprints}
              projectStartDate={projectStartDate}
              projectEndDate={projectEndDate}
              loading={loading}
              estimating={estimating}
              onSprintChange={(field, value) => setNewSprint((p) => ({ ...p, [field]: value }))}
              onTaskChange={(idx, field, value) => {
                setNewSprintTasks((prev) => {
                  const next = [...prev];
                  next[idx] = { ...next[idx], [field]: value };
                  return next;
                });
              }}
              onAddTask={() => setNewSprintTasks((p) => [...p, getEmptyTask()])}
              onRemoveTask={(idx) =>
                setNewSprintTasks((p) => p.length > 1 ? p.filter((_, i) => i !== idx) : p)
              }
              onSave={handleCreateSprint}
              onCancel={() => {
                setShowCreateSprint(false);
                setNewSprint(emptyNewSprint());
                setNewSprintTasks([getEmptyTask()]);
              }}
              onEstimateTask={handleEstimateNewSprintTaskPreview}
            />
          </div>
        )}

        {loading && !showCreateSprint && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-teal-200 border-t-teal-500 animate-spin" />
            <p className="text-sm text-slate-500">Chargement des sprints…</p>
          </div>
        )}

        {!loading && sprints.length === 0 && !showCreateSprint && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20
                          bg-white rounded-2xl border border-dashed border-teal-200 px-6 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-100
                            flex items-center justify-center mb-4 shadow-sm">
              <ListTodo size={28} className="text-teal-400" />
            </div>
            <p className="text-slate-700 font-semibold text-sm sm:text-base mb-1">
              Aucun sprint pour l'instant
            </p>
            <p className="text-slate-400 text-xs sm:text-sm mb-5 max-w-xs leading-relaxed">
              Aucun sprint n'a été créé pour ce projet.
            </p>
            {canEditSprints && (
              <button
                onClick={() => setShowCreateSprint(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500
                           text-white text-sm font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-600
                           transition-all shadow-sm shadow-teal-200 active:scale-95"
              >
                <Plus size={15} /> Créer un sprint
              </button>
            )}
          </div>
        )}

        {!loading && sprints.length > 0 && (
          <div className="space-y-3">
            {sprints.map((sprint) => (
              <SprintCard
                key={sprint.id}
                sprint={sprint}
                members={members}
                allSprints={sprints}
                projectStartDate={projectStartDate}
                projectEndDate={projectEndDate}
                isExpanded={expandedSprints.has(sprint.id!)}
                isEditing={editingSprintId === sprint.id}
                canEditSprints={canEditSprints}
                editingSprintData={editingSprintData}
                editingSprintTasks={editingSprintTasks}
                editingTaskId={editingTaskId}
                editingTaskSprintId={editingTaskSprintId}
                editingTaskData={editingTaskData}
                loading={loading}
                estimating={estimating}
                onToggleExpand={toggleSprintExpanded}
                onStartEditSprint={handleEditSprint}
                onSprintChange={(field, value) =>
                  setEditingSprintData((p) => (p ? { ...p, [field]: value } : p))
                }
                onSprintTaskChange={(idx, field, value) => {
                  setEditingSprintTasks((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], [field]: value };
                    return next;
                  });
                }}
                onAddSprintTask={() => setEditingSprintTasks((p) => [...p, getEmptyTask()])}
                onRemoveSprintTask={(idx) => {
                  const task = editingSprintTasks[idx];
                  if (task.id) {
                    setError('Utilisez le bouton Supprimer pour les tâches existantes');
                  } else {
                    setEditingSprintTasks((p) => p.filter((_, i) => i !== idx));
                  }
                }}
                onSaveSprint={handleSaveSprint}
                onCancelEditSprint={() => {
                  setEditingSprintId(null);
                  setEditingSprintData(null);
                  setEditingSprintTasks([]);
                }}
                onDeleteSprint={handleDeleteSprint}
                onStartEditTask={handleStartEditTask}
                onEditTaskChange={(field, value) =>
                  setEditingTaskData((p) => (p ? { ...p, [field]: value } : p))
                }
                onSaveTask={handleSaveTask}
                onCancelEditTask={() => {
                  setEditingTaskId(null);
                  setEditingTaskSprintId(null);
                  setEditingTaskData(null);
                }}
                onDeleteTask={handleDeleteTask}
                onEstimateTaskPreview={handleEstimateTaskPreview}
                onEstimateSprintPreview={handleEstimateEditingSprintTaskPreview}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SprintsPage;

