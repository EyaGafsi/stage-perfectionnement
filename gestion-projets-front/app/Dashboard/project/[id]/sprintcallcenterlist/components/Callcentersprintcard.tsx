'use client';
// ─── CallCenterSprintCard.tsx ─────────────────────────────────────────────────

import React from 'react';
import {
  ChevronDown, ChevronUp, Edit2, Trash2, Save, X, ListTodo,
  DollarSign, Target, Phone, Star,
} from 'lucide-react';
import type { SprintCallCenter, TaskCallCenter, ProjectMember } from '../services/Types';
import { CallCenterSprintForm } from './Callcentersprintform';
import { CallCenterTaskCard } from './Callcentertaskcard';
import { safeNum } from '../services/Callcenterestimationservice';

interface CallCenterSprintCardProps {
  sprint: SprintCallCenter;
  members: ProjectMember[];
  isExpanded: boolean;
  isEditing: boolean;
  canEditSprints: boolean;
  editingSprintData: SprintCallCenter | null;
  editingSprintTasks: TaskCallCenter[];
  editingTaskId: number | null;
  editingTaskSprintId: number | null;
  editingTaskData: TaskCallCenter | null;
  estimatingTaskIdx: number | null;
  loading: boolean;
  estimating: boolean;
  allSprints: SprintCallCenter[];
  projectStartDate: string | null;
  projectEndDate:   string | null;

  onToggleExpand: (id: number) => void;
  onStartEditSprint: (sprint: SprintCallCenter) => void;
  onSprintChange: (field: keyof SprintCallCenter, value: unknown) => void;
  onSprintTaskChange: (index: number, field: keyof TaskCallCenter, value: unknown) => void;
  onAddSprintTask: () => void;
  onRemoveSprintTask: (index: number) => void;
  onEstimateSprintTask: (index: number) => void;
  onSaveSprint: () => void;
  onCancelEditSprint: () => void;
  onDeleteSprint: (id: number) => void;

  onStartEditTask: (task: TaskCallCenter, sprintId: number) => void;
  onEditTaskChange: (field: keyof TaskCallCenter, value: unknown) => void;
  onEstimateEditingTask: () => void;
  onSaveTask: () => void;
  onCancelEditTask: () => void;
  onDeleteTask: (taskId: number, sprintId: number) => void;
}

const STATUS_BADGE: Record<string, string> = {
  planned:   'bg-slate-100 text-slate-700',
  active:    'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  planned: 'Planifié', active: 'Actif', completed: 'Terminé', cancelled: 'Annulé',
};

export const CallCenterSprintCard: React.FC<CallCenterSprintCardProps> = ({
  sprint, members, isExpanded, isEditing, canEditSprints,
  editingSprintData, editingSprintTasks,
  editingTaskId, editingTaskSprintId, editingTaskData,
  estimatingTaskIdx, loading, estimating,
  allSprints, projectStartDate, projectEndDate,
  onToggleExpand, onStartEditSprint,
  onSprintChange, onSprintTaskChange, onAddSprintTask, onRemoveSprintTask,
  onEstimateSprintTask, onSaveSprint, onCancelEditSprint, onDeleteSprint,
  onStartEditTask, onEditTaskChange, onEstimateEditingTask,
  onSaveTask, onCancelEditTask, onDeleteTask,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">

    <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => onToggleExpand(sprint.id!)}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          <div className="flex-1 min-w-0">
            {isEditing && editingSprintData ? (
              <input
                type="text"
                value={editingSprintData.name}
                onChange={(e) => onSprintChange('name', e.target.value)}
                className="font-bold text-lg text-slate-800 px-3 py-1 border rounded-lg w-full max-w-sm"
              />
            ) : (
              <>
                <h3 className="font-bold text-lg text-slate-800 truncate">{sprint.name}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>{sprint.tasks?.length ?? 0} tâche{(sprint.tasks?.length ?? 0) !== 1 ? 's' : ''}</span>
                  {safeNum(sprint.targetAgents) > 0 && (
                    <span className="flex items-center gap-1"><Phone size={11} />{safeNum(sprint.targetAgents)} agents</span>
                  )}
                  {safeNum(sprint.expectedCallVolume) > 0 && (
                    <span>📞 {safeNum(sprint.expectedCallVolume).toLocaleString()} appels</span>
                  )}
                  {safeNum(sprint.budgetAllocated) > 0 && (
                    <span className="flex items-center gap-1"><DollarSign size={11} />{safeNum(sprint.budgetAllocated).toLocaleString()} TND</span>
                  )}
                  {safeNum(sprint.qualityScoreTarget) > 0 && (
                    <span className="flex items-center gap-1"><Star size={11} />Score: {safeNum(sprint.qualityScoreTarget)}</span>
                  )}
                  {sprint.goals && (
                    <span className="flex items-center gap-1"><Target size={11} />{sprint.goals}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 uppercase font-semibold">Période</p>
            <p className="text-sm text-slate-700 font-medium">
              {new Date(sprint.startDate).toLocaleDateString('fr-FR')} –{' '}
              {new Date(sprint.endDate).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_BADGE[sprint.status] ?? 'bg-slate-100 text-slate-700'}`}>
            {STATUS_LABEL[sprint.status] ?? sprint.status}
          </span>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={onSaveSprint} className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors" title="Enregistrer">
                  <Save size={17} />
                </button>
                <button onClick={onCancelEditSprint} className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors" title="Annuler">
                  <X size={17} />
                </button>
              </>
            ) : (
              canEditSprints && (
                <>
                  <button onClick={() => onStartEditSprint(sprint)} className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors" title="Modifier ce ticket">
                    <Edit2 size={17} />
                  </button>
                  <button onClick={() => onDeleteSprint(sprint.id!)} className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors" title="Supprimer ce ticket">
                    <Trash2 size={17} />
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {isEditing && editingSprintData && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <CallCenterSprintForm
            mode="edit"
            sprint={editingSprintData}
            tasks={editingSprintTasks}
            members={members}
            loading={loading}
            estimating={estimating}
            estimatingTaskIdx={estimatingTaskIdx}
            allSprints={allSprints}
            projectStartDate={projectStartDate}
            projectEndDate={projectEndDate}
            onSprintChange={onSprintChange}
            onTaskChange={onSprintTaskChange}
            onAddTask={onAddSprintTask}
            onRemoveTask={onRemoveSprintTask}
            onEstimateTask={onEstimateSprintTask}
            onSave={onSaveSprint}
            onCancel={onCancelEditSprint}
          />
        </div>
      )}
    </div>

    {isExpanded && !isEditing && (
      <div className="p-5 bg-slate-50 border-t border-slate-200">
        <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-4">
          <ListTodo size={17} /> Tâches ({sprint.tasks?.length ?? 0})
        </h4>

        {sprint.tasks?.length ? (
          <div className="space-y-3">
            {sprint.tasks.map((task) => (
              <CallCenterTaskCard
                key={task.id}
                task={task}
                sprintId={sprint.id!}
                members={members}
                isEditing={editingTaskId === task.id && editingTaskSprintId === sprint.id}
                canEditSprints={canEditSprints}
                editingData={editingTaskData}
                isEstimating={editingTaskId === task.id && estimatingTaskIdx !== null}
                loading={loading}
                onStartEdit={onStartEditTask}
                onEditChange={onEditTaskChange}
                onEstimate={onEstimateEditingTask}
                onSave={onSaveTask}
                onCancelEdit={onCancelEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-6 text-sm">Aucune tâche dans ce sprint</p>
        )}
      </div>
    )}
  </div>
);