'use client';
// ─── MarketingSprintsPage.tsx ─────────────────────────────────────────────────
// Design: Light + Turquoise — responsive mobile/desktop

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, Plus, AlertCircle, X, ListTodo,
  Clock, Users, CalendarDays, Banknote,
} from 'lucide-react';

import type { SprintMarketing, TaskMarketing, ProjectMember } from './services/Types';
import { getEmptyTask, getEmptySprint } from './services/Types';
import {
  estimateMarketingTaskHours,
  estimateAllMarketingTasks,
  serializeTask,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Marketingestimationservice';
import {
  computeMarketingProjectMetrics,
  type MarketingProjectMetrics,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/marketingProjectMetrics';
import {
  estimateMarketingProjectCost,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/marketingCostEstimationService';
import { MarketingSprintForm } from '@/Dashboard/project/[id]/sprintmarketinglist/components/Marketingsprintform';
import { MarketingSprintCard } from '@/Dashboard/project/[id]/sprintmarketinglist/components/Marketingsprintcard';
import { validateSprintDates, validateTaskDates } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Datevalidation';
import { useAuth } from '@/Dashboard/project/[id]/projectmanager_details/components/Useauth';

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Metric card ──────────────────────────────────────────────────────────────
const MetricCard: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
  colorClass: string;
  bgClass: string;
}> = ({ icon, value, label, colorClass, bgClass }) => (
  <div className={`flex items-center gap-3 p-4 rounded-xl border ${bgClass}`}>
    <span className={`p-2 rounded-lg bg-white/60 ${colorClass}`}>{icon}</span>
    <div>
      <p className={`text-xl font-extrabold leading-none ${colorClass}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  </div>
);

// ─── Page component ───────────────────────────────────────────────────────────
const MarketingSprintsPage: React.FC = () => {
  const params    = useParams() as { id?: string };
  const projectId = params?.id;
  const router    = useRouter();
  const { canEditSprints } = useAuth();

  // ── Data ─────────────────────────────────────────────────────────────────
  const [members,            setMembers]            = useState<ProjectMember[]>([]);
  const [sprints,            setSprints]            = useState<SprintMarketing[]>([]);
  const [marketingProjectId, setMarketingProjectId] = useState<number | null>(null);
  const [metrics,            setMetrics]            = useState<MarketingProjectMetrics | null>(null);
  const [projectStartDate,   setProjectStartDate]   = useState<string | null>(null);
  const [projectEndDate,     setProjectEndDate]     = useState<string | null>(null);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);
  const [expandedSprints, setExpandedSprints] = useState<Set<number>>(new Set());

  // ── Create sprint ─────────────────────────────────────────────────────────
  const [showCreate,       setShowCreate]       = useState(false);
  const [newSprint,        setNewSprint]        = useState<SprintMarketing>(getEmptySprint());
  const [newTasks,         setNewTasks]         = useState<TaskMarketing[]>([getEmptyTask()]);
  const [estimatingNewIdx, setEstimatingNewIdx] = useState<number | null>(null);

  // ── Edit sprint ───────────────────────────────────────────────────────────
  const [editingSprintId,    setEditingSprintId]    = useState<number | null>(null);
  const [editingSprintData,  setEditingSprintData]  = useState<SprintMarketing | null>(null);
  const [editingSprintTasks, setEditingSprintTasks] = useState<TaskMarketing[]>([]);
  const [estimatingEditIdx,  setEstimatingEditIdx]  = useState<number | null>(null);

  // ── Edit task ─────────────────────────────────────────────────────────────
  const [editingTaskId,       setEditingTaskId]       = useState<number | null>(null);
  const [editingTaskSprintId, setEditingTaskSprintId] = useState<number | null>(null);
  const [editingTaskData,     setEditingTaskData]     = useState<TaskMarketing | null>(null);
  const [estimatingEditTask,  setEstimatingEditTask]  = useState(false);

  // ── persistMarketingMetrics ───────────────────────────────────────────────
  const persistMarketingMetrics = useCallback(
    async (m: MarketingProjectMetrics, aiCost: number) => {
      if (!projectId) return;
      try {
        await apiFetch(`${apiBase}/projects/${projectId}/marketing-details`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
          body: JSON.stringify({
            estimatedDurationDays: m.durationDays,
            estimatedCost:         Math.round(aiCost * 100) / 100,
            teamSize:              m.teamSize,
          }),
        });
      } catch (err) { console.error('[persistMarketingMetrics]', err); }
    },
    [projectId],
  );

  // ── refreshMarketingMetrics ───────────────────────────────────────────────
  const refreshMarketingMetrics = useCallback(
    async (updatedSprints: SprintMarketing[]) => {
      if (updatedSprints.length === 0) { setMetrics(null); return; }
      const m = computeMarketingProjectMetrics(updatedSprints, members, members.length);
      setMetrics(m);
      if (m.totalHours === 0) return;
      const sprintsMeta = {
        totalBudget:    updatedSprints.reduce((s, sp) => s + Number(sp.totalBudget ?? 0), 0),
        campaignType:   updatedSprints[0]?.campaignType,
        targetAudience: updatedSprints[0]?.targetAudience,
        channels:       updatedSprints.map((s) => s.channels).filter(Boolean).join('|'),
        goals:          updatedSprints.map((s) => s.goals).filter(Boolean).join('|'),
        expectedReach:  updatedSprints.reduce((s, sp) => s + Number(sp.expectedReach ?? 0), 0),
        expectedLeads:  updatedSprints.reduce((s, sp) => s + Number(sp.expectedLeads ?? 0), 0),
        expectedROI:    updatedSprints[0]?.expectedROI,
      };
      const aiCost    = await estimateMarketingProjectCost(m.durationDays, m.teamSize, sprintsMeta);
      const finalCost = aiCost !== null ? aiCost : m.estimatedBudget;
      await persistMarketingMetrics(m, finalCost);
      setMetrics({ ...m, estimatedBudget: finalCost });
    },
    [members, persistMarketingMetrics],
  );

  useEffect(() => { refreshMarketingMetrics(sprints); }, [sprints, refreshMarketingMetrics]);

  // ── Fetch sprints ─────────────────────────────────────────────────────────
  const fetchSprints = useCallback(async (mktId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/projects/${mktId}/marketing-sprints`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const sprintsArray = Array.isArray(data) ? data : [];
        const normalized = sprintsArray.map((sprint: any) => ({
          ...sprint,
          tasks: (sprint.tasks ?? []).map((t: any) => ({
            ...t,
            complexity: t.complexityScore !== undefined ? t.complexityScore : t.complexity,
            effort: t.riskLevel !== undefined ? t.riskLevel : t.effort,
          })),
        }));
        setSprints(normalized);
      } else {
        setError('Erreur lors du chargement des sprints');
      }
    } catch { setError('Erreur lors du chargement des sprints'); }
    finally  { setLoading(false); }
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
          setMembers(data.project?.assignedTo ?? []);
          setProjectStartDate(data.project?.startDate ?? null);
          setProjectEndDate(data.project?.endDate     ?? null);
          const mktId: number | undefined = data.domainDetails?.id;
          if (mktId) { setMarketingProjectId(mktId); fetchSprints(mktId); }
          else setError('Aucun sous-projet Marketing trouvé. Vérifiez que les détails Marketing ont été initialisés.');
        }
      } catch (e) { console.error(e); setError('Erreur lors du chargement du projet'); }
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
      setError('Veuillez remplir les champs obligatoires (nom, dates).'); return;
    }
    if (!marketingProjectId) { setError('ID du projet Marketing introuvable. Rechargez la page.'); return; }
    const sprintErr = validateSprintDates(undefined, newSprint.startDate, newSprint.endDate, projectStartDate, projectEndDate, sprints);
    if (sprintErr) { setError(sprintErr); return; }
    const validTasks = newTasks.filter((t) => t.title.trim());
    setEstimating(true);
    const tasksWithAI = await estimateAllMarketingTasks(validTasks);
    setEstimating(false);
    setLoading(true);
    try {
      const token   = getAuthToken();
      const payload = [{
        ...newSprint,
        totalBudget:   Number(newSprint.totalBudget   ?? 0),
        expectedReach: Number(newSprint.expectedReach ?? 0),
        expectedLeads: Number(newSprint.expectedLeads ?? 0),
        expectedROI:   Number(newSprint.expectedROI   ?? 0),
        startDate: new Date(newSprint.startDate).toISOString(),
        endDate:   new Date(newSprint.endDate).toISOString(),
        tasks: tasksWithAI.map(serializeTask),
      }];
      const res = await apiFetch(`${apiBase}/projects/${marketingProjectId}/marketing-sprints`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur lors de la création du sprint');
      setSuccess('Campagne créée avec succès !');
      setShowCreate(false);
      setNewSprint(getEmptySprint());
      setNewTasks([getEmptyTask()]);
      fetchSprints(marketingProjectId);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleEstimateNewTask = async (idx: number) => {
    setEstimatingNewIdx(idx);
    const hours = await estimateMarketingTaskHours(newTasks[idx]);
    setEstimatingNewIdx(null);
    if (hours !== null)
      setNewTasks((prev) => { const next = [...prev]; next[idx] = { ...next[idx], aiEstimatedHours: hours, estimatedHours: hours }; return next; });
  };

  // ── EDIT SPRINT ───────────────────────────────────────────────────────────
  const handleEditSprint = (sprint: SprintMarketing) => {
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
    if (!marketingProjectId) { setError('ID du projet Marketing introuvable.'); return; }
    const sprintErr = validateSprintDates(editingSprintId, editingSprintData.startDate, editingSprintData.endDate, projectStartDate, projectEndDate, sprints);
    if (sprintErr) { setError(sprintErr); return; }
    for (const task of editingSprintTasks) {
      const taskErr = validateTaskDates(task.scheduledStartDate, task.scheduledEndDate, editingSprintData.startDate, editingSprintData.endDate);
      if (taskErr) { setError(`Tâche "${task.title || 'sans titre'}" : ${taskErr}`); return; }
    }
    setLoading(true);
    try {
      const token = getAuthToken();
      const safeDate = (d: string | null | undefined | Date) => {
        if (!d) return null;
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? null : dt.toISOString();
      };
      
      const res = await apiFetch(`${apiBase}/projects/marketing-sprints/${editingSprintId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name:           editingSprintData.name,
          startDate:      safeDate(editingSprintData.startDate),
          endDate:        safeDate(editingSprintData.endDate),
          status:         editingSprintData.status,
          priority:       editingSprintData.priority,
          complexity:     editingSprintData.complexity,
          totalBudget:    Number(editingSprintData.totalBudget   ?? 0),
          campaignType:   editingSprintData.campaignType,
          targetAudience: editingSprintData.targetAudience,
          channels:       editingSprintData.channels,
          goals:          editingSprintData.goals,
          expectedReach:  Number(editingSprintData.expectedReach ?? 0),
          expectedLeads:  Number(editingSprintData.expectedLeads ?? 0),
          expectedROI:    Number(editingSprintData.expectedROI   ?? 0),
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour du sprint');
      const newlyAdded = editingSprintTasks.filter((t) => !t.id && t.title.trim());
      if (newlyAdded.length) {
        setEstimating(true);
        const withAI = await estimateAllMarketingTasks(newlyAdded);
        setEstimating(false);
        for (const task of withAI) {
          const taskRes = await apiFetch(`${apiBase}/projects/marketing-sprints/${editingSprintId}/tasks`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body:    JSON.stringify(serializeTask(task)),
          });
          if (!taskRes.ok) throw new Error('Erreur lors de la création de la tâche');
        }
      }

      const existingTasks = editingSprintTasks.filter((t) => t.id && t.title.trim());
      for (const task of existingTasks) {
        const taskRes = await apiFetch(`${apiBase}/projects/marketing-tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(serializeTask(task)),
        });
        if (!taskRes.ok) throw new Error(`Erreur lors de la mise à jour de la tâche ${task.title}`);
      }
      setSuccess('Campagne mise à jour !');
      setEditingSprintId(null); setEditingSprintData(null); setEditingSprintTasks([]);
      fetchSprints(marketingProjectId);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleEstimateEditTask = async (idx: number) => {
    setEstimatingEditIdx(idx);
    const hours = await estimateMarketingTaskHours(editingSprintTasks[idx]);
    setEstimatingEditIdx(null);
    if (hours !== null)
      setEditingSprintTasks((prev) => { const next = [...prev]; next[idx] = { ...next[idx], aiEstimatedHours: hours, estimatedHours: hours }; return next; });
  };

  const handleDeleteSprint = async (id: number) => {
    if (!confirm('Supprimer cette campagne et toutes ses tâches ?')) return;
    if (!marketingProjectId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/projects/marketing-sprints/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setSprints((prev) => prev.filter((s) => s.id !== id));
      setSuccess('Campagne supprimée !');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── EDIT TASK ─────────────────────────────────────────────────────────────
  /** Converts an ISO timestamp → "YYYY-MM-DD" for <input type="date">. Returns '' if empty/invalid. */
  const toDateInput = (val: string | Date | null | undefined): string => {
    if (!val) return '';
    const d = new Date(val as string);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const handleStartEditTask = (task: TaskMarketing, sprintId: number) => {
    setEditingTaskId(task.id ?? 0);
    setEditingTaskSprintId(sprintId);
    // Resolve assignedTo: API may return an object { id, ... } or a string/number
    const rawId = (task as any).assignedTo;
    const assigneeId =
      typeof rawId === 'object' && rawId !== null && 'id' in rawId
        ? String((rawId as any).id)
        : String(rawId ?? '');
    setEditingTaskData({
      ...task,
      assignedTo: assigneeId,
      // Normalize ISO timestamps → YYYY-MM-DD so <input type="date"> shows the value
      scheduledStartDate: toDateInput((task as any).scheduledStartDate),
      scheduledEndDate:   toDateInput((task as any).scheduledEndDate),
    });
  };

  const handleSaveTask = async () => {
    if (!editingTaskData || !editingTaskId || !marketingProjectId) return;
    const parentSprint = sprints.find((s) => s.id === editingTaskSprintId);
    const taskErr = validateTaskDates(editingTaskData.scheduledStartDate, editingTaskData.scheduledEndDate, parentSprint?.startDate, parentSprint?.endDate);
    if (taskErr) { setError(taskErr); return; }
    setEstimatingEditTask(true);
    const hours = await estimateMarketingTaskHours(editingTaskData);
    setEstimatingEditTask(false);
    const taskWithAI: TaskMarketing = { ...editingTaskData, aiEstimatedHours: hours ?? editingTaskData.aiEstimatedHours, estimatedHours: hours ?? editingTaskData.estimatedHours ?? 0 };
    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/projects/marketing-tasks/${editingTaskId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify(serializeTask(taskWithAI)),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour de la tâche');
      setSprints((prev) =>
        prev.map((s) => s.id === editingTaskSprintId
          ? { ...s, tasks: s.tasks.map((t) => (t.id === editingTaskId ? taskWithAI : t)) }
          : s,
        ),
      );
      setSuccess('Tâche mise à jour !');
      setEditingTaskId(null); setEditingTaskSprintId(null); setEditingTaskData(null);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteTask = async (taskId: number, sprintId: number) => {
    if (!confirm('Supprimer cette tâche ?')) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/projects/marketing-tasks/${taskId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setSprints((prev) =>
        prev.map((s) => s.id === sprintId ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) } : s),
      );
      setSuccess('Tâche supprimée !');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50/40 via-white to-slate-50 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-600 mb-2 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
            >
              <ChevronLeft size={16} />
              Retour au projet
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Campagnes Marketing
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Gérez vos campagnes, assignez les tâches et suivez les performances.
            </p>
          </div>

          {canEditSprints && (
            <button
              onClick={() => setShowCreate((v) => !v)}
              disabled={!marketingProjectId}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                transition-all shadow-sm
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
                disabled:opacity-40 disabled:cursor-not-allowed
                ${showCreate
                  ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                  : 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-cyan-200'
                }
              `}
            >
              {showCreate ? <X size={16} /> : <Plus size={16} />}
              {showCreate ? 'Annuler' : 'Nouvelle Campagne'}
            </button>
          )}
        </div>

        {/* ── Alert: error ──────────────────────────────────────────────── */}
        {error && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="shrink-0 text-rose-400 hover:text-rose-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Alert: success ────────────────────────────────────────────── */}
        {success && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 text-sm">
            <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
            <span className="flex-1">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="shrink-0 text-teal-400 hover:text-teal-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Metrics panel ─────────────────────────────────────────────── */}
        {metrics && metrics.totalHours > 0 && (
          <div className="mb-6 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Résumé du projet Marketing
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                icon={<Clock size={16} />}
                value={`${Math.round(metrics.totalHours)}h`}
                label="Heures estimées"
                colorClass="text-cyan-600"
                bgClass="bg-cyan-50 border-cyan-100"
              />
              <MetricCard
                icon={<Users size={16} />}
                value={String(metrics.teamSize)}
                label="Membres"
                colorClass="text-teal-600"
                bgClass="bg-teal-50 border-teal-100"
              />
              <MetricCard
                icon={<CalendarDays size={16} />}
                value={`${metrics.durationDays}j`}
                label="Durée estimée"
                colorClass="text-violet-600"
                bgClass="bg-violet-50 border-violet-100"
              />
              <MetricCard
                icon={<Banknote size={16} />}
                value={metrics.estimatedBudget.toLocaleString('fr-FR', {
                  style: 'currency', currency: 'TND', maximumFractionDigits: 0,
                })}
                label="Coût IA estimé"
                colorClass="text-amber-600"
                bgClass="bg-amber-50 border-amber-100"
              />
            </div>
          </div>
        )}

        {/* ── Create form ───────────────────────────────────────────────── */}
        {showCreate && (
          <MarketingSprintForm
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
              setNewTasks((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)
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

        {/* ── Loading state ─────────────────────────────────────────────── */}
        {loading && !showCreate && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-cyan-200 border-t-cyan-500 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Chargement des campagnes…</p>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!loading && sprints.length === 0 && !showCreate && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80 gap-4">
            <span className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-300">
              <ListTodo size={32} />
            </span>
            <div className="text-center">
              <p className="font-semibold text-slate-600">Aucune campagne marketing trouvée</p>
              <p className="text-sm text-slate-400 mt-1">Aucune campagne n'a été créée pour ce projet</p>
            </div>
            {canEditSprints && (
              <button
                onClick={() => setShowCreate(true)}
                disabled={!marketingProjectId}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-500 text-white hover:bg-cyan-600 transition-colors shadow-sm shadow-cyan-200 disabled:opacity-40"
              >
                <Plus size={15} /> Nouvelle Campagne
              </button>
            )}
          </div>
        )}

        {/* ── Sprint list ───────────────────────────────────────────────── */}
        {!loading && sprints.length > 0 && (
          <div className="space-y-4">
            {sprints.map((sprint) => (
              <MarketingSprintCard
                key={sprint.id}
                sprint={sprint}
                members={members}
                isExpanded={expandedSprints.has(sprint.id!)}
                isEditing={editingSprintId === sprint.id}
                canEditSprints={canEditSprints}
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
                  if (task.id) setError('Utilisez le bouton Supprimer pour les tâches existantes.');
                  else setEditingSprintTasks((prev) => prev.filter((_, i) => i !== idx));
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
                  const hours = await estimateMarketingTaskHours(editingTaskData);
                  setEstimatingEditTask(false);
                  if (hours !== null)
                    setEditingTaskData((prev) =>
                      prev ? { ...prev, aiEstimatedHours: hours, estimatedHours: hours } : prev,
                    );
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

export default MarketingSprintsPage;