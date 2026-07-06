'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, Plus, Trash2, Save, Calendar, 
  ListTodo, AlertCircle, User, Activity, ShieldAlert, Link as LinkIcon,
  Flag, FileText, LayoutTemplate
} from "lucide-react";

type TaskType = 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'TASK' | 'STORY';
type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface ProjectMember {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string; // Parfois l'API renvoie juste 'name'
  email: string;
}

interface TaskInput {
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints: number;
  estimatedHours: number;
  complexityScore: number; 
  riskLevel: number;       
  complexity: string;      
  assignedToId: string;    
  dependencies: string;
  risks: string;
  additionalNotes: string;
}

const getAuthToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '');

export default function CreateSprintWithTasksPage() {
  const params = useParams() as { id?: string };
  const projectId = params?.id;
  const router = useRouter();

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État du Sprint
  const [sprintData, setSprintData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    status: 'planned',
    priority: 'Medium',
    complexity: 'Medium'
  });

  // État des Tâches
  const [tasks, setTasks] = useState<TaskInput[]>([{ 
    title: '', description: '', type: 'FEATURE', status: 'TO_DO', priority: 'MEDIUM', 
    storyPoints: 1, estimatedHours: 1, complexityScore: 1, riskLevel: 1, 
    complexity: 'Medium', assignedToId: '', dependencies: '', risks: '', additionalNotes: '' 
  }]);

  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!projectId) return;

      try {
        const token = getAuthToken();
        const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:3001/api/v1';
        
        const res = await fetch(`${apiBase}/projects/${projectId}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setMembers(data.project?.assignedTo || []);
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
      }
    };

    fetchProjectMembers();
  }, [projectId]);

  const handleSprintChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSprintData({ ...sprintData, [e.target.name]: e.target.value });
  };

  const handleTaskChange = (index: number, field: keyof TaskInput, value: any) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  };

  const addTaskField = () => {
    setTasks([...tasks, { 
      title: '', description: '', type: 'FEATURE', status: 'TO_DO', priority: 'MEDIUM', 
      storyPoints: 1, estimatedHours: 1, complexityScore: 1, riskLevel: 1, 
      complexity: 'Medium', assignedToId: '', dependencies: '', risks: '', additionalNotes: '' 
    }]);
  };

  const removeTaskField = (index: number) => {
    if (tasks.length > 1) setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      
      const payload = [{
        ...sprintData,
        startDate: new Date(sprintData.startDate).toISOString(),
        endDate: new Date(sprintData.endDate).toISOString(),
        tasks: tasks.filter(t => t.title.trim() !== '').map(t => ({
          ...t,
          storyPoints: Number(t.storyPoints),
          estimatedHours: Number(t.estimatedHours),
          complexityScore: Number(t.complexityScore),
          riskLevel: Number(t.riskLevel),
          assignedTo: t.assignedToId ? { id: Number(t.assignedToId) } : null,
        }))
      }];

      const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:3001/api/v1';
      
      // ✅ CORRECTION ICI : Changement de /details vers /sprints
      const res = await fetch(`${apiBase}/projects/${projectId}/sprints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Erreur lors de la création du sprint");
      }

      router.push(`/Dashboard/project/${projectId}/sprints`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Classes CSS réutilisables
  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none";
  const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5";

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-2 transition-colors font-medium"
            >
              <ChevronLeft size={18} /> Retour au projet
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Nouveau Sprint</h1>
            <p className="text-slate-500 mt-1">Planifiez votre sprint et assignez les tâches à l'équipe.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SPRINT CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="text-indigo-500" size={22} /> 
                Configuration du Sprint
              </h2>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-6">
                <label className={labelClass}>Nom du Sprint <span className="text-red-500">*</span></label>
                <input required name="name" type="text" placeholder="Ex: Sprint 1 - Auth & Setup" className={inputClass} value={sprintData.name} onChange={handleSprintChange} />
              </div>
              
              <div className="md:col-span-2">
                <label className={labelClass}>Priorité</label>
                <select name="priority" className={inputClass} value={sprintData.priority} onChange={handleSprintChange}>
                  <option value="Low">Basse</option>
                  <option value="Medium">Moyenne</option>
                  <option value="High">Haute</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Complexité</label>
                <select name="complexity" className={inputClass} value={sprintData.complexity} onChange={handleSprintChange}>
                  <option value="Low">Basse</option>
                  <option value="Medium">Moyenne</option>
                  <option value="High">Haute</option>
                </select>
              </div>
              
              <div className="md:col-span-6 lg:col-span-3">
                <label className={labelClass}>Date de début <span className="text-red-500">*</span></label>
                <input required name="startDate" type="date" className={inputClass} value={sprintData.startDate} onChange={handleSprintChange} />
              </div>
              
              <div className="md:col-span-6 lg:col-span-3">
                <label className={labelClass}>Date de fin <span className="text-red-500">*</span></label>
                <input required name="endDate" type="date" className={inputClass} value={sprintData.endDate} onChange={handleSprintChange} />
              </div>
            </div>
          </div>

          {/* TASKS CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ListTodo className="text-indigo-500" size={22} /> 
                Tâches du Sprint
                <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full text-xs font-bold ml-2">
                  {tasks.length}
                </span>
              </h2>
              <button 
                type="button" 
                onClick={addTaskField} 
                className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <Plus size={18} /> Ajouter une tâche
              </button>
            </div>

            <div className="p-6 space-y-6">
              {tasks.map((task, index) => (
                <div key={index} className="relative group p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-colors">
                  
                  {/* Task Header & Delete Button */}
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <div className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      Détails de la tâche
                    </h3>
                    {tasks.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeTaskField(index)} 
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Supprimer la tâche"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    
                    {/* Row 1 */}
                    <div className="md:col-span-8">
                      <label className={labelClass}><FileText size={14}/> Titre de la tâche <span className="text-red-500">*</span></label>
                      <input required placeholder="Ex: Implémenter le login JWT" className={inputClass} value={task.title} onChange={(e) => handleTaskChange(index, 'title', e.target.value)} />
                    </div>
                    
                    <div className="md:col-span-4">
                      <label className={labelClass}><User size={14}/> Assigné à</label>
                      <select className={inputClass} value={task.assignedToId} onChange={(e) => handleTaskChange(index, 'assignedToId', e.target.value)}>
                        <option value="">Non assigné</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.name || `${m.firstName} ${m.lastName}`} ({m.email})</option>
                        ))}
                      </select>
                    </div>

                    {/* Row 2 */}
                    <div className="md:col-span-12">
                      <label className={labelClass}>Description détaillée</label>
                      <textarea placeholder="Décrivez les critères d'acceptation, les notes techniques..." className={`${inputClass} resize-none`} rows={3} value={task.description} onChange={(e) => handleTaskChange(index, 'description', e.target.value)} />
                    </div>

                    {/* Row 3 - Metrics */}
                    <div className="md:col-span-3">
                      <label className={labelClass}><LayoutTemplate size={14}/> Type</label>
                      <select className={inputClass} value={task.type} onChange={(e) => handleTaskChange(index, 'type', e.target.value)}>
                        <option value="FEATURE">Feature</option>
                        <option value="BUG">Bug</option>
                        <option value="IMPROVEMENT">Improvement</option>
                        <option value="TASK">Task</option>
                        <option value="STORY">Story</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className={labelClass}><Flag size={14}/> Priorité</label>
                      <select className={inputClass} value={task.priority} onChange={(e) => handleTaskChange(index, 'priority', e.target.value)}>
                        <option value="LOW">Basse</option>
                        <option value="MEDIUM">Moyenne</option>
                        <option value="HIGH">Haute</option>
                        <option value="CRITICAL">Critique</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className={labelClass}>Story Points</label>
                      <input type="number" min="0" className={inputClass} value={task.storyPoints} onChange={(e) => handleTaskChange(index, 'storyPoints', e.target.value)} />
                    </div>

                    <div className="md:col-span-3">
                      <label className={labelClass}>Heures estimées</label>
                      <input type="number" min="0" step="0.5" className={inputClass} value={task.estimatedHours} onChange={(e) => handleTaskChange(index, 'estimatedHours', e.target.value)} />
                    </div>

                    {/* Row 4 - Analysis */}
                    <div className="md:col-span-3">
                      <label className={labelClass}><Activity size={14}/> Complexité (1-5)</label>
                      <input type="number" min="1" max="5" className={inputClass} value={task.complexityScore} onChange={(e) => handleTaskChange(index, 'complexityScore', e.target.value)} />
                    </div>

                    <div className="md:col-span-3">
                      <label className={labelClass}><ShieldAlert size={14}/> Risque (1-5)</label>
                      <input type="number" min="1" max="5" className={inputClass} value={task.riskLevel} onChange={(e) => handleTaskChange(index, 'riskLevel', e.target.value)} />
                    </div>

                    <div className="md:col-span-6">
                      <label className={labelClass}><LinkIcon size={14}/> Dépendances</label>
                      <input placeholder="Ex: Nécessite API Auth" className={inputClass} value={task.dependencies} onChange={(e) => handleTaskChange(index, 'dependencies', e.target.value)} />
                    </div>

                    {/* Row 5 - Text additions */}
                    <div className="md:col-span-6">
                      <label className={`${labelClass} !text-red-500`}>Risques identifiés</label>
                      <input placeholder="Problèmes potentiels..." className={inputClass} value={task.risks} onChange={(e) => handleTaskChange(index, 'risks', e.target.value)} />
                    </div>

                    <div className="md:col-span-6">
                      <label className={labelClass}>Notes additionnelles</label>
                      <input placeholder="Informations complémentaires..." className={inputClass} value={task.additionalNotes} onChange={(e) => handleTaskChange(index, 'additionalNotes', e.target.value)} />
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle size={20} className="shrink-0" /> 
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 pb-12">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="px-6 py-2.5 rounded-lg font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-md shadow-indigo-200"
            >
              <Save size={18} /> 
              {loading ? "Enregistrement en cours..." : "Créer le Sprint et les tâches"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}