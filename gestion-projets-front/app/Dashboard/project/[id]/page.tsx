'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, Plus, Trash2, Edit2, Save, X, Calendar,
  ListTodo, AlertCircle, User, Activity, ShieldAlert, Link as LinkIcon,
  ChevronDown, ChevronUp, Flag, FileText, LayoutTemplate, Eye, EyeOff,
  Clock, Cpu, Loader2
} from "lucide-react";

type TaskType = 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'TASK' | 'STORY';
type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface ProjectMember {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
}

interface Task {
  id?: number;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints: number;
  estimatedHours: number;
  aiEstimatedHours?: number;
  complexityScore: number;
  riskLevel: number;
  complexity: string;
  assignedToId: string;
  dependencies: string;
  risks: string;
  additionalNotes: string;
}

interface Sprint {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'in_progress' | 'completed';
  priority: 'Low' | 'Medium' | 'High';
  complexity: 'Low' | 'Medium' | 'High';
  tasks: Task[];
}

const getAuthToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '';

// ─── AI Estimation Helper ─────────────────────────────────────────────────────
async function estimateTaskHours(task: Task, authToken: string): Promise<number | null> {
  try {
    const aiBase = process.env.NEXT_PUBLIC_AI_task_DURATION_API_URL;

    const payload = {
      type: task.type.charAt(0).toUpperCase() + task.type.slice(1).toLowerCase(),
      priority: task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase(),
      storyPoints: Number(task.storyPoints),
      complexityScore: Number(task.complexityScore),
      riskLevel: Number(task.riskLevel),
      hasBlockingDependencies: !!(task.dependencies && task.dependencies.trim()),
      dependenciesCount: task.dependencies
        ? task.dependencies.split(',').filter(Boolean).length
        : 0,
    };

    const res = await fetch(`${aiBase}/predict-hours`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.estimated_hours === 'number' ? data.estimated_hours : null;
  } catch {
    return null;
  }
}

async function estimateAllTaskHours(tasks: Task[], authToken: string): Promise<Task[]> {
  return Promise.all(
    tasks.map(async (t) => {
      if (!t.title.trim()) return t;
      const hours = await estimateTaskHours(t, authToken);
      return hours !== null ? { ...t, aiEstimatedHours: hours } : t;
    })
  );
}

// ─── Hour/Day formatter ───────────────────────────────────────────────────────
function formatHoursDays(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h${minutes > 0 ? minutes : '00'}`;
}

function hoursToTimeFormat(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
}

const SprintsPage = () => {
  const params = useParams() as { id?: string };
  const projectId = params?.id;
  const router = useRouter();

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedSprints, setExpandedSprints] = useState<Set<number>>(new Set());

  // CREATE SPRINT MODE
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [newSprint, setNewSprint] = useState<Sprint>({
    name: '',
    startDate: '',
    endDate: '',
    status: 'planned',
    priority: 'Medium',
    complexity: 'Medium',
    tasks: [getEmptyTask()],
  });

  // EDIT SPRINT MODE
  const [editingSprintId, setEditingSprintId] = useState<number | null>(null);
  const [editingSprintData, setEditingSprintData] = useState<Sprint | null>(null);
  const [editingSprintTasks, setEditingSprintTasks] = useState<Task[]>([]);

  // EDIT TASK MODE
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskSprintId, setEditingTaskSprintId] = useState<number | null>(null);
  const [editingTaskData, setEditingTaskData] = useState<Task | null>(null);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function getEmptyTask(): Task {
    return {
      title: '',
      description: '',
      type: 'FEATURE',
      status: 'TO_DO',
      priority: 'MEDIUM',
      storyPoints: 1,
      estimatedHours: 0,
      complexityScore: 1,
      riskLevel: 1,
      complexity: 'Medium',
      assignedToId: '',
      dependencies: '',
      risks: '',
      additionalNotes: '',
    };
  }

  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === Number(memberId));
    if (!member) return '';
    return member.name || `${member.firstName} ${member.lastName}`;
  };

  const getStatusBadgeColor = (status: TaskStatus) => {
    const colors: Record<TaskStatus, string> = {
      TO_DO: 'bg-slate-100 text-slate-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      IN_REVIEW: 'bg-purple-100 text-purple-700',
      DONE: 'bg-green-100 text-green-700',
      BLOCKED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getPriorityColor = (priority: TaskPriority) => {
    const colors: Record<TaskPriority, string> = {
      LOW: 'text-green-600',
      MEDIUM: 'text-yellow-600',
      HIGH: 'text-orange-600',
      CRITICAL: 'text-red-600',
    };
    return colors[priority] || 'text-slate-600';
  };

  // ─── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!projectId) return;
      try {
        const token = getAuthToken();
        const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL;
        const res = await fetch(`${apiBase}/projects/${projectId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          
          const data = await res.json();
          setMembers(data.project?.assignedTo || []);
        }
      } catch (err) {
        console.error('Error fetching members:', err);
      }
    };
    fetchProjectMembers();
  }, [projectId]);

  useEffect(() => {
    fetchSprints();
  }, [projectId]);

  const fetchSprints = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL;
      const res = await fetch(`${apiBase}/projects/${projectId}/sprints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        
        const data = await res.json();
        setSprints(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Erreur lors du chargement des sprints');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Sprint CRUD ───────────────────────────────────────────────────────────
  const handleCreateSprint = async () => {
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) {
      setError('Veuillez remplir tous les champs obligatoires du sprint');
      return;
    }

    const validTasks = newSprint.tasks.filter((t) => t.title.trim() !== '');

    setEstimating(true);
    const token = getAuthToken();
    const tasksWithEstimates = await estimateAllTaskHours(validTasks, token);
    setEstimating(false);

    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL;

      const payload = [
        {
          name: newSprint.name,
          startDate: new Date(newSprint.startDate).toISOString(),
          endDate: new Date(newSprint.endDate).toISOString(),
          status: newSprint.status,
          priority: newSprint.priority,
          complexity: newSprint.complexity,
          tasks: tasksWithEstimates.map((t) => ({
            ...t,
            storyPoints: Number(t.storyPoints),
            estimatedHours: t.aiEstimatedHours !== undefined ? t.aiEstimatedHours : 0,
            aiEstimatedHours: t.aiEstimatedHours,
            complexityScore: Number(t.complexityScore),
            riskLevel: Number(t.riskLevel),
            assignedTo: t.assignedToId ? { id: Number(t.assignedToId) } : null,
          })),
        },
      ];

      const res = await fetch(`${apiBase}/projects/${projectId}/sprints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erreur lors de la création du sprint');

      setSuccess('Sprint créé avec succès!');
      setShowCreateSprint(false);
      setNewSprint({
        name: '',
        startDate: '',
        endDate: '',
        status: 'planned',
        priority: 'Medium',
        complexity: 'Medium',
        tasks: [getEmptyTask()],
      });
      fetchSprints();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprintId(sprint.id || 0);
    setEditingSprintData({ ...sprint });
    setEditingSprintTasks([...sprint.tasks]);
  };

  const handleSaveSprint = async () => {
    if (!editingSprintData || !editingSprintId) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL;

      // Sauvegarder le sprint lui-même
      const res = await fetch(`${apiBase}/projects/sprints/${editingSprintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingSprintData.name,
          startDate: new Date(editingSprintData.startDate).toISOString(),
          endDate: new Date(editingSprintData.endDate).toISOString(),
          status: editingSprintData.status,
          priority: editingSprintData.priority,
          complexity: editingSprintData.complexity,
        }),
      });

      if (!res.ok) throw new Error('Erreur lors de la mise à jour du sprint');

      // Sauvegarder les nouvelles tâches
      const newTasks = editingSprintTasks.filter((t) => !t.id && t.title.trim());
      if (newTasks.length > 0) {
        setEstimating(true);
        const tasksWithEstimates = await estimateAllTaskHours(newTasks, token);
        setEstimating(false);

        for (const task of tasksWithEstimates) {
          const taskRes = await fetch(`${apiBase}/projects/tasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...task,
              storyPoints: Number(task.storyPoints),
              estimatedHours: task.aiEstimatedHours !== undefined ? task.aiEstimatedHours : 0,
              aiEstimatedHours: task.aiEstimatedHours,
              complexityScore: Number(task.complexityScore),
              riskLevel: Number(task.riskLevel),
              sprintId: editingSprintId,
              assignedTo: task.assignedToId ? { id: Number(task.assignedToId) } : null,
            }),
          });
          if (!taskRes.ok) throw new Error('Erreur lors de la création de la tâche');
        }
      }

      setSuccess('Sprint et tâches mis à jour avec succès!');
      setEditingSprintId(null);
      setEditingSprintData(null);
      setEditingSprintTasks([]);
      fetchSprints();
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
      const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL;
      const res = await fetch(`${apiBase}/projects/sprints/${sprintId}`, {
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

  // ─── Task CRUD ─────────────────────────────────────────────────────────────
  const handleEditTask = (task: Task, sprintId: number) => {
    setEditingTaskId(task.id || 0);
    setEditingTaskSprintId(sprintId);
    setEditingTaskData({ ...task });
  };

  const handleSaveTask = async () => {
    if (!editingTaskData || !editingTaskId) return;

    setEstimating(true);
    const token = getAuthToken();
    const aiHours = await estimateTaskHours(editingTaskData, token);
    setEstimating(false);

    const taskWithAI: Task = {
      ...editingTaskData,
      aiEstimatedHours: aiHours !== null ? aiHours : editingTaskData.aiEstimatedHours,
      estimatedHours: aiHours !== null ? aiHours : 0,
    };

    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL;
      const res = await fetch(`${apiBase}/projects/tasks/${editingTaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...taskWithAI,
          storyPoints: Number(taskWithAI.storyPoints),
          estimatedHours: taskWithAI.estimatedHours,
          aiEstimatedHours: taskWithAI.aiEstimatedHours,
          complexityScore: Number(taskWithAI.complexityScore),
          riskLevel: Number(taskWithAI.riskLevel),
          assignedTo: taskWithAI.assignedToId
            ? { id: Number(taskWithAI.assignedToId) }
            : null,
        }),
      });

      if (!res.ok) throw new Error('Erreur lors de la mise à jour');

      setSprints(
        sprints.map((s) =>
          s.id === editingTaskSprintId
            ? {
                ...s,
                tasks: s.tasks.map((t) =>
                  t.id === editingTaskId ? taskWithAI : t
                ),
              }
            : s
        )
      );
      setSuccess(
        aiHours !== null
          ? `Tâche mise à jour! Durée: ${hoursToTimeFormat(aiHours)}`
          : 'Tâche mise à jour!'
      );
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche?')) return;

    setLoading(true);
    try {
      const token = getAuthToken();
      const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL;
      const res = await fetch(`${apiBase}/projects/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Erreur lors de la suppression');

      setSprints(
        sprints.map((s) =>
          s.id === sprintId
            ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) }
            : s
        )
      );
      setSuccess('Tâche supprimée!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTaskToNewSprint = () => {
    setNewSprint({ ...newSprint, tasks: [...newSprint.tasks, getEmptyTask()] });
  };

  const handleRemoveTaskFromNewSprint = (index: number) => {
    if (newSprint.tasks.length > 1) {
      setNewSprint({
        ...newSprint,
        tasks: newSprint.tasks.filter((_, i) => i !== index),
      });
    }
  };

  const handleNewSprintTaskChange = (
    index: number,
    field: keyof Task,
    value: any
  ) => {
    const newTasks = [...newSprint.tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setNewSprint({ ...newSprint, tasks: newTasks });
  };

  // ✅ POUR L'ÉDITION DU SPRINT - Ajouter tâches
  const handleAddTaskToEditingSprint = () => {
    setEditingSprintTasks([...editingSprintTasks, getEmptyTask()]);
  };

  const handleRemoveTaskFromEditingSprint = (index: number) => {
    const task = editingSprintTasks[index];
    // Ne supprimer que si c'est une nouvelle tâche (pas d'ID)
    if (!task.id) {
      setEditingSprintTasks(editingSprintTasks.filter((_, i) => i !== index));
    } else {
      setError('Utilisez le bouton Supprimer pour les tâches existantes');
    }
  };

  const handleEditingSprintTaskChange = (
    index: number,
    field: keyof Task,
    value: any
  ) => {
    const newTasks = [...editingSprintTasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setEditingSprintTasks(newTasks);
  };

  const toggleSprintExpanded = (sprintId: number) => {
    const newExpanded = new Set(expandedSprints);
    if (newExpanded.has(sprintId)) newExpanded.delete(sprintId);
    else newExpanded.add(sprintId);
    setExpandedSprints(newExpanded);
  };

  // ─── AI Estimate Badge ─────────────────────────────────────────────────────
  const AiEstimateBadge = ({ hours }: { hours: number }) => {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200"
        title="Estimation IA"
      >
        <Cpu size={11} />
        {formatHoursDays(hours)}
      </span>
    );
  };

  // ─── Estimating Overlay ──────────────────────────────────────────────────���─
  const EstimatingBanner = () => (
    <div className="mb-4 p-3 bg-violet-50 border border-violet-200 rounded-lg flex items-center gap-3 text-violet-700 text-sm font-medium">
      <Loader2 size={18} className="animate-spin flex-shrink-0" />
      Estimation de la durée par l'IA en cours…
    </div>
  );

  // ─── Render task form (pour édition sprint) ─────────────────────────────────
  const renderEditingSprintTaskForm = (task: Task, idx: number) => (
    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-slate-700">
          Tâche {idx + 1} {task.id ? '(existante)' : '(nouvelle)'}
        </h4>
        {!task.id && editingSprintTasks.length > 0 && (
          <button
            onClick={() => handleRemoveTaskFromEditingSprint(idx)}
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Titre</label>
          <input
            type="text"
            placeholder="Titre de la tâche"
            className={inputClass}
            value={task.title}
            onChange={(e) => handleEditingSprintTaskChange(idx, 'title', e.target.value)}
            disabled={!!task.id}
          />
        </div>

        <div className="md:col-span-3">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Assigné à</label>
          <select
            className={inputClass}
            value={task.assignedToId}
            onChange={(e) => handleEditingSprintTaskChange(idx, 'assignedToId', e.target.value)}
          >
            <option value="">Non assigné</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || `${m.firstName} ${m.lastName}`}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
          <select
            className={inputClass}
            value={task.type}
            onChange={(e) => handleEditingSprintTaskChange(idx, 'type', e.target.value as TaskType)}
            disabled={!!task.id}
          >
            <option value="FEATURE">Feature</option>
            <option value="BUG">Bug</option>
            <option value="IMPROVEMENT">Improvement</option>
            <option value="TASK">Task</option>
            <option value="STORY">Story</option>
          </select>
        </div>

        <div className="md:col-span-12">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
          <textarea
            placeholder="Description technique..."
            className={`${inputClass} resize-none`}
            rows={2}
            value={task.description}
            onChange={(e) => handleEditingSprintTaskChange(idx, 'description', e.target.value)}
            disabled={!!task.id}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Statut</label>
          <select
            className={inputClass}
            value={task.status}
            onChange={(e) => handleEditingSprintTaskChange(idx, 'status', e.target.value as TaskStatus)}
          >
            <option value="TO_DO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="IN_REVIEW">En révision</option>
            <option value="DONE">Fait</option>
            <option value="BLOCKED">Bloqué</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Priorité</label>
          <select
            className={inputClass}
            value={task.priority}
            onChange={(e) => handleEditingSprintTaskChange(idx, 'priority', e.target.value as TaskPriority)}
            disabled={!!task.id}
          >
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Story Points</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={task.storyPoints}
            onChange={(e) => handleEditingSprintTaskChange(idx, 'storyPoints', Number(e.target.value))}
            disabled={!!task.id}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Complexité (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            className={inputClass}
            value={task.complexityScore}
            onChange={(e) => handleEditingSprintTaskChange(idx, 'complexityScore', Number(e.target.value))}
            disabled={!!task.id}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Risque (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            className={inputClass}
            value={task.riskLevel}
            onChange={(e) => handleEditingSprintTaskChange(idx, 'riskLevel', Number(e.target.value))}
            disabled={!!task.id}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Dépendances</label>
          <input
            type="text"
            placeholder="Task #12"
            className={inputClass}
            value={task.dependencies}
            onChange={(e) => handleEditingSprintTaskChange(idx, 'dependencies', e.target.value)}
            disabled={!!task.id}
          />
        </div>

        <div className="md:col-span-4">
          <label className="text-xs font-semibold text-red-600 mb-1 block">Risques</label>
          <input
            type="text"
            placeholder="Risques identifiés..."
            className={inputClass}
            value={task.risks}
            onChange={(e) => handleEditingSprintTaskChange(idx, 'risks', e.target.value)}
          />
        </div>

        <div className="md:col-span-4">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes</label>
          <input
            type="text"
            placeholder="Notes additionnelles..."
            className={inputClass}
            value={task.additionalNotes}
            onChange={(e) => handleEditingSprintTaskChange(idx, 'additionalNotes', e.target.value)}
          />
        </div>

        {/* Afficher l'estimation IA si disponible */}
        {task.aiEstimatedHours !== undefined && task.aiEstimatedHours > 0 && (
          <div className="md:col-span-12">
            <div className="flex items-center gap-3 p-2 bg-violet-50 border border-violet-100 rounded-lg">
              <Cpu size={14} className="text-violet-500 flex-shrink-0" />
              <span className="text-sm text-violet-700">
                Estimée: <strong>{hoursToTimeFormat(task.aiEstimatedHours)}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Render task edit form ─────────────────────────────────────────────────
  const renderTaskEditForm = (task: Task, sprintId: number) => (
    <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg mt-3">
      <h5 className="font-bold text-blue-900">Éditer la tâche</h5>

      {editingTaskData?.aiEstimatedHours !== undefined && editingTaskData.aiEstimatedHours > 0 && (
        <div className="flex items-center gap-2 text-sm text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
          <Cpu size={14} />
          <span>
            Dernière estimation IA: <strong>{hoursToTimeFormat(editingTaskData.aiEstimatedHours)}</strong>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Titre</label>
          <input
            type="text"
            placeholder="Titre de la tâche"
            className={inputClass}
            value={editingTaskData?.title || ''}
            onChange={(e) =>
              setEditingTaskData({ ...editingTaskData!, title: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-3">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Assigné à</label>
          <select
            className={inputClass}
            value={editingTaskData?.assignedToId || ''}
            onChange={(e) =>
              setEditingTaskData({ ...editingTaskData!, assignedToId: e.target.value })
            }
          >
            <option value="">Non assigné</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || `${m.firstName} ${m.lastName}`}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
          <select
            className={inputClass}
            value={editingTaskData?.type || 'FEATURE'}
            onChange={(e) =>
              setEditingTaskData({ ...editingTaskData!, type: e.target.value as TaskType })
            }
          >
            <option value="FEATURE">Feature</option>
            <option value="BUG">Bug</option>
            <option value="IMPROVEMENT">Improvement</option>
            <option value="TASK">Task</option>
            <option value="STORY">Story</option>
          </select>
        </div>

        <div className="md:col-span-12">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
          <textarea
            placeholder="Description technique..."
            className={`${inputClass} resize-none`}
            rows={2}
            value={editingTaskData?.description || ''}
            onChange={(e) =>
              setEditingTaskData({ ...editingTaskData!, description: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Statut</label>
          <select
            className={inputClass}
            value={editingTaskData?.status || 'TO_DO'}
            onChange={(e) =>
              setEditingTaskData({ ...editingTaskData!, status: e.target.value as TaskStatus })
            }
          >
            <option value="TO_DO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="IN_REVIEW">En révision</option>
            <option value="DONE">Fait</option>
            <option value="BLOCKED">Bloqué</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Priorité</label>
          <select
            className={inputClass}
            value={editingTaskData?.priority || 'MEDIUM'}
            onChange={(e) =>
              setEditingTaskData({ ...editingTaskData!, priority: e.target.value as TaskPriority })
            }
          >
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Story Points</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={editingTaskData?.storyPoints || 0}
            onChange={(e) =>
              setEditingTaskData({ ...editingTaskData!, storyPoints: Number(e.target.value) })
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Complexité (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            className={inputClass}
            value={editingTaskData?.complexityScore || 1}
            onChange={(e) =>
              setEditingTaskData({ ...editingTaskData!, complexityScore: Number(e.target.value) })
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Risque (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            className={inputClass}
            value={editingTaskData?.riskLevel || 1}
            onChange={(e) =>
              setEditingTaskData({ ...editingTaskData!, riskLevel: Number(e.target.value) })
            }
          />
        </div>

        <div className="md:col-span-4">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Dépendances</label>
          <input
            type="text"
            placeholder="Task #12"
            className={inputClass}
            value={editingTaskData?.dependencies || ''}
            onChange={(e) =>
              setEditingTaskData({ ...editingTaskData!, dependencies: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-4">
          <label className="text-xs font-semibold text-red-600 mb-1 block">Risques</label>
          <input
            type="text"
            placeholder="Risques identifiés..."
            className={inputClass}
            value={editingTaskData?.risks || ''}
            onChange={(e) =>
              setEditingTaskData({ ...editingTaskData!, risks: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-4">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes</label>
          <input
            type="text"
            placeholder="Notes additionnelles..."
            className={inputClass}
            value={editingTaskData?.additionalNotes || ''}
            onChange={(e) =>
              setEditingTaskData({ ...editingTaskData!, additionalNotes: e.target.value })
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3">
        <button
          onClick={() => {
            setEditingTaskId(null);
            setEditingTaskSprintId(null);
            setEditingTaskData(null);
          }}
          className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors text-sm"
        >
          Annuler
        </button>
        <button
          onClick={handleSaveTask}
          disabled={loading || estimating}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-sm flex items-center gap-1.5"
        >
          {estimating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Estimation IA…
            </>
          ) : (
            <>
              <Save size={14} /> Enregistrer
            </>
          )}
        </button>
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none';
  const labelClass =
    'block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-2 transition-colors font-medium"
            >
              <ChevronLeft size={18} /> Retour au projet
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Gestion des Sprints
            </h1>
            <p className="text-slate-500 mt-1">
              Créez, modifiez et gérez les sprints de votre projet
            </p>
          </div>
          <button
            onClick={() => setShowCreateSprint(!showCreateSprint)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            <Plus size={18} />
            {showCreateSprint ? 'Annuler' : 'Nouveau Sprint'}
          </button>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-700">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X size={18} />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-green-700">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
              <X size={18} />
            </button>
          </div>
        )}

        {/* ESTIMATING BANNER (global) */}
        {estimating && !editingTaskId && <EstimatingBanner />}

        {/* CREATE SPRINT SECTION */}
        {showCreateSprint && (
          <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus className="text-indigo-500" size={22} />
                Créer un nouveau Sprint
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {estimating && <EstimatingBanner />}

              {/* Sprint Info */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6">
                  <label className={labelClass}>
                    Nom du Sprint <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Sprint 1 - Auth & Setup"
                    className={inputClass}
                    value={newSprint.name}
                    onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Priorité</label>
                  <select
                    className={inputClass}
                    value={newSprint.priority}
                    onChange={(e) =>
                      setNewSprint({ ...newSprint, priority: e.target.value as any })
                    }
                  >
                    <option value="Low">Basse</option>
                    <option value="Medium">Moyenne</option>
                    <option value="High">Haute</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Complexité</label>
                  <select
                    className={inputClass}
                    value={newSprint.complexity}
                    onChange={(e) =>
                      setNewSprint({ ...newSprint, complexity: e.target.value as any })
                    }
                  >
                    <option value="Low">Basse</option>
                    <option value="Medium">Moyenne</option>
                    <option value="High">Haute</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Début <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={inputClass}
                    value={newSprint.startDate}
                    onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={inputClass}
                    value={newSprint.endDate}
                    onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Tasks */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ListTodo size={18} /> Tâches ({newSprint.tasks.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddTaskToNewSprint}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-semibold"
                  >
                    <Plus size={16} /> Ajouter
                  </button>
                </div>

                <div className="space-y-4">
                  {newSprint.tasks.map((task, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-slate-700">Tâche {idx + 1}</h4>
                        {newSprint.tasks.length > 1 && (
                          <button
                            onClick={() => handleRemoveTaskFromNewSprint(idx)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-6">
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Titre</label>
                          <input
                            type="text"
                            placeholder="Titre de la tâche"
                            className={inputClass}
                            value={task.title}
                            onChange={(e) => handleNewSprintTaskChange(idx, 'title', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Assigné à</label>
                          <select
                            className={inputClass}
                            value={task.assignedToId}
                            onChange={(e) => handleNewSprintTaskChange(idx, 'assignedToId', e.target.value)}
                          >
                            <option value="">Non assigné</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name || `${m.firstName} ${m.lastName}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
                          <select
                            className={inputClass}
                            value={task.type}
                            onChange={(e) =>
                              handleNewSprintTaskChange(idx, 'type', e.target.value as TaskType)
                            }
                          >
                            <option value="FEATURE">Feature</option>
                            <option value="BUG">Bug</option>
                            <option value="IMPROVEMENT">Improvement</option>
                            <option value="TASK">Task</option>
                            <option value="STORY">Story</option>
                          </select>
                        </div>
                        <div className="md:col-span-12">
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
                          <textarea
                            placeholder="Description technique..."
                            className={`${inputClass} resize-none`}
                            rows={2}
                            value={task.description}
                            onChange={(e) => handleNewSprintTaskChange(idx, 'description', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Statut</label>
                          <select
                            className={inputClass}
                            value={task.status}
                            onChange={(e) =>
                              handleNewSprintTaskChange(idx, 'status', e.target.value as TaskStatus)
                            }
                          >
                            <option value="TO_DO">À faire</option>
                            <option value="IN_PROGRESS">En cours</option>
                            <option value="IN_REVIEW">En révision</option>
                            <option value="DONE">Fait</option>
                            <option value="BLOCKED">Bloqué</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Priorité</label>
                          <select
                            className={inputClass}
                            value={task.priority}
                            onChange={(e) =>
                              handleNewSprintTaskChange(idx, 'priority', e.target.value as TaskPriority)
                            }
                          >
                            <option value="LOW">Basse</option>
                            <option value="MEDIUM">Moyenne</option>
                            <option value="HIGH">Haute</option>
                            <option value="CRITICAL">Critique</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Story Points</label>
                          <input
                            type="number"
                            min="0"
                            className={inputClass}
                            value={task.storyPoints}
                            onChange={(e) =>
                              handleNewSprintTaskChange(idx, 'storyPoints', Number(e.target.value))
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Complexité (1-5)</label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            className={inputClass}
                            value={task.complexityScore}
                            onChange={(e) =>
                              handleNewSprintTaskChange(idx, 'complexityScore', Number(e.target.value))
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Risque (1-5)</label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            className={inputClass}
                            value={task.riskLevel}
                            onChange={(e) =>
                              handleNewSprintTaskChange(idx, 'riskLevel', Number(e.target.value))
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Dépendances</label>
                          <input
                            type="text"
                            placeholder="Task #12"
                            className={inputClass}
                            value={task.dependencies}
                            onChange={(e) =>
                              handleNewSprintTaskChange(idx, 'dependencies', e.target.value)
                            }
                          />
                        </div>
                        <div className="md:col-span-4">
                          <label className="text-xs font-semibold text-red-600 mb-1 block">Risques</label>
                          <input
                            type="text"
                            placeholder="Risques identifiés..."
                            className={inputClass}
                            value={task.risks}
                            onChange={(e) => handleNewSprintTaskChange(idx, 'risks', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-4">
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes</label>
                          <input
                            type="text"
                            placeholder="Notes additionnelles..."
                            className={inputClass}
                            value={task.additionalNotes}
                            onChange={(e) =>
                              handleNewSprintTaskChange(idx, 'additionalNotes', e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI note */}
              <p className="text-xs text-violet-600 flex items-center gap-1.5">
                <Cpu size={12} />
                La durée de chaque tâche sera automatiquement estimée par l'IA avant l'envoi au backend.
              </p>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowCreateSprint(false)}
                  className="px-4 py-2.5 rounded-lg font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateSprint}
                  disabled={loading || estimating}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-md shadow-indigo-200"
                >
                  {estimating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Estimation IA…
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {loading ? 'Création...' : 'Créer le Sprint'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && !showCreateSprint && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            <p className="text-slate-600 mt-4">Chargement des sprints...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && sprints.length === 0 && !showCreateSprint && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <ListTodo size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-lg">Aucun sprint trouvé</p>
            <p className="text-slate-400 text-sm mt-2">Créez votre premier sprint pour commencer</p>
          </div>
        )}

        {/* SPRINTS LIST */}
        {!loading && sprints.length > 0 && (
          <div className="space-y-4">
            {sprints.map((sprint) => (
              <div
                key={sprint.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* SPRINT HEADER */}
                <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => toggleSprintExpanded(sprint.id || 0)}
                        className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        {expandedSprints.has(sprint.id || 0) ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        {editingSprintId === sprint.id ? (
                          <input
                            type="text"
                            value={editingSprintData?.name || ''}
                            onChange={(e) =>
                              setEditingSprintData({ ...editingSprintData!, name: e.target.value })
                            }
                            className="font-bold text-xl text-slate-800 px-3 py-1 border rounded-lg w-full"
                          />
                        ) : (
                          <>
                            <h3 className="font-bold text-xl text-slate-800 truncate">
                              {sprint.name}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                              {sprint.tasks?.length || 0} tâche
                              {(sprint.tasks?.length || 0) !== 1 ? 's' : ''}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Début - Fin</p>
                        <p className="text-sm text-slate-800 font-medium">
                          {new Date(sprint.startDate).toLocaleDateString('fr-FR')} -{' '}
                          {new Date(sprint.endDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          sprint.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : sprint.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {sprint.status === 'completed'
                          ? 'Terminé'
                          : sprint.status === 'in_progress'
                          ? 'En cours'
                          : 'Planifié'}
                      </div>

                      <div className="flex items-center gap-2">
                        {editingSprintId === sprint.id ? (
                          <>
                            <button
                              onClick={handleSaveSprint}
                              className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                              title="Enregistrer"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingSprintId(null);
                                setEditingSprintData(null);
                                setEditingSprintTasks([]);
                              }}
                              className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                              title="Annuler"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditSprint(sprint)}
                              className="p-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors"
                              title="Éditer"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteSprint(sprint.id || 0)}
                              className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* EDIT SPRINT FORM */}
                  {editingSprintId === sprint.id && editingSprintData && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Début</label>
                          <input
                            type="date"
                            value={editingSprintData.startDate.split('T')[0]}
                            onChange={(e) =>
                              setEditingSprintData({ ...editingSprintData, startDate: e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Fin</label>
                          <input
                            type="date"
                            value={editingSprintData.endDate.split('T')[0]}
                            onChange={(e) =>
                              setEditingSprintData({ ...editingSprintData, endDate: e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Priorité</label>
                          <select
                            value={editingSprintData.priority}
                            onChange={(e) =>
                              setEditingSprintData({
                                ...editingSprintData,
                                priority: e.target.value as any,
                              })
                            }
                            className={inputClass}
                          >
                            <option value="Low">Basse</option>
                            <option value="Medium">Moyenne</option>
                            <option value="High">Haute</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Statut</label>
                          <select
                            value={editingSprintData.status}
                            onChange={(e) =>
                              setEditingSprintData({ ...editingSprintData, status: e.target.value as any })
                            }
                            className={inputClass}
                          >
                            <option value="planned">Planifié</option>
                            <option value="in_progress">En cours</option>
                            <option value="completed">Terminé</option>
                          </select>
                        </div>
                      </div>

                      {/* ✅ SECTION TÂCHES DANS L'ÉDITION DU SPRINT */}
                      <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                            <ListTodo size={18} /> Tâches
                          </h4>
                          <button
                            onClick={handleAddTaskToEditingSprint}
                            className="flex items-center gap-1 text-sm px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-semibold"
                          >
                            <Plus size={16} /> Ajouter tâche
                          </button>
                        </div>

                        <div className="space-y-4">
                          {editingSprintTasks.map((task, idx) =>
                            renderEditingSprintTaskForm(task, idx)
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SPRINT TASKS */}
                {expandedSprints.has(sprint.id || 0) && !editingSprintId && (
                  <div className="p-6 bg-slate-50 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                        <ListTodo size={18} /> Tâches ({sprint.tasks?.length || 0})
                      </h4>
                    </div>

                    {sprint.tasks && sprint.tasks.length > 0 ? (
                      <div className="space-y-3">
                        {sprint.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-white border border-slate-200 rounded-lg overflow-hidden"
                          >
                            <div className="p-4 hover:shadow-sm transition-shadow">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-slate-800 mb-2">
                                    {task.title}
                                  </h5>
                                  <p className="text-sm text-slate-600 mb-3">{task.description}</p>

                                  {/* TASK META */}
                                  <div className="flex flex-wrap gap-2 items-center mb-3">
                                    <span
                                      className={`text-xs font-semibold px-2 py-1 rounded ${getStatusBadgeColor(task.status)}`}
                                    >
                                      {task.status}
                                    </span>
                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
                                      {task.type}
                                    </span>
                                    <span className={`text-xs font-bold ${getPriorityColor(task.priority)}`}>
                                      {task.priority}
                                    </span>
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-semibold">
                                      {task.storyPoints} pts
                                    </span>

                                    {/* ── AI ESTIMATE BADGE ── */}
                                    {task.aiEstimatedHours !== undefined && task.aiEstimatedHours > 0 ? (
                                      <AiEstimateBadge hours={task.aiEstimatedHours} />
                                    ) : (
                                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded font-semibold">
                                        Sans estimation
                                      </span>
                                    )}
                                  </div>

                                  {/* ── AI DURATION DETAIL ROW ── */}
                                  {task.aiEstimatedHours !== undefined && task.aiEstimatedHours > 0 && (
                                    <div className="flex items-center gap-3 mb-3 p-2 bg-violet-50 border border-violet-100 rounded-lg">
                                      <Cpu size={14} className="text-violet-500 flex-shrink-0" />
                                      <div className="flex gap-4 text-sm">
                                        <span className="text-violet-700 font-semibold">
                                          {hoursToTimeFormat(task.aiEstimatedHours)}
                                        </span>
                                        <span className="text-slate-400">·</span>
                                        <span className="text-violet-600">
                                          {(task.aiEstimatedHours / 8).toFixed(2)} jour
                                          {task.aiEstimatedHours / 8 > 1 ? 's' : ''}
                                        </span>
                                        <span className="text-slate-400 text-xs self-center">
                                          estimé par l'IA
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* ADDITIONAL INFO */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-100">
                                    {task.complexityScore && (
                                      <div>
                                        <span className="text-slate-500">Complexité:</span>
                                        <span className="ml-1 font-semibold text-slate-700">
                                          {task.complexityScore}/5
                                        </span>
                                      </div>
                                    )}
                                    {task.riskLevel && (
                                      <div>
                                        <span className="text-slate-500">Risque:</span>
                                        <span className="ml-1 font-semibold text-slate-700">
                                          {task.riskLevel}/5
                                        </span>
                                      </div>
                                    )}
                                    {task.dependencies && (
                                      <div>
                                        <span className="text-slate-500">Dépendances:</span>
                                        <span className="ml-1 font-semibold text-slate-700">
                                          {task.dependencies}
                                        </span>
                                      </div>
                                    )}
                                    {task.assignedToId && (
                                      <div>
                                        <span className="text-slate-500">Assigné:</span>
                                        <span className="ml-1 font-semibold text-slate-700">
                                          {getMemberName(task.assignedToId)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* TASK ACTIONS */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => handleEditTask(task, sprint.id || 0)}
                                    className="p-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors"
                                    title="Éditer"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id || 0, sprint.id || 0)}
                                    className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>

                              {/* EDIT TASK FORM */}
                              {editingTaskId === task.id &&
                                editingTaskSprintId === sprint.id &&
                                renderTaskEditForm(task, sprint.id || 0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-6 text-sm">
                        Aucune tâche dans ce sprint
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SprintsPage;