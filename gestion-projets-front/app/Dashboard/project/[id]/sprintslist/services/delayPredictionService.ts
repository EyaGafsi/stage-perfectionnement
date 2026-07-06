import type { Task, ProjectMember, MemberStats } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { getMemberLevel } from '@/Dashboard/project/[id]/sprintslist/services/estimationService';

export interface DelayPredictionResponse {
  risk_probability: number;
  will_be_delayed: boolean;
  predicted_reason: string;
}

export async function predictTaskDelay(
  task: Task,
  members: ProjectMember[],
  memberStats: MemberStats | null,
): Promise<DelayPredictionResponse | null> {
  try {
    // Determine assignee
    const assignedTo = typeof task.assignedTo === 'object' ? (task.assignedTo as any)?.id : task.assignedTo;
    if (!assignedTo) return null; // No assignee, no delay prediction

    const memberLevel = getMemberLevel(assignedTo, members);

    const depsCount = task.dependencies ? task.dependencies.split(',').filter(Boolean).length : 0;

    let allocatedTimeHours = 40.0;
    if (task.scheduledStartDate && task.scheduledEndDate) {
      const start = new Date(task.scheduledStartDate).getTime();
      const end = new Date(task.scheduledEndDate).getTime();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        allocatedTimeHours = (end - start) / (1000 * 60 * 60);
      }
    } else if (task.estimatedHours) {
      allocatedTimeHours = Number(task.estimatedHours);
    }

    const payload = {
      type: task.type ?? 'FEATURE',
      priority: task.priority ?? 'MEDIUM',
      storyPoints: Number(task.storyPoints) || 1.0,
      complexityScore: Number(task.complexityScore) || 1,
      riskLevel: Number(task.riskLevel) || 1,
      hasBlockingDependencies: depsCount > 0,
      dependenciesCount: depsCount,
      
      memberLevel,
      memberAvgCompletionHours: memberStats ? Number(memberStats.avgCompletionHours) : 0,
      memberAvgDelayHours: memberStats ? Number(memberStats.avgDelayHours) : 0,
      memberCompletedTasksCount: memberStats ? Number(memberStats.completedTasksCount) : 0,
      memberAvgReopenRate: memberStats ? Number(memberStats.avgReopenRate) : 0,
      memberCurrentWorkload: memberStats ? Number(memberStats.currentWorkload) : 0,
      
      allocatedTimeHours,
      predictedDurationHours: Number(task.aiEstimatedHours) || Number(task.estimatedHours) || 0,
      pastFrequentDelayReason: memberStats?.frequentDelayReason || "None",
    };

    // Replace with environment variable if deployed
    const apiDelayPredictor = process.env.NEXT_PUBLIC_AI_DELAY_PREDICTION_API_URL 
      ? `${process.env.NEXT_PUBLIC_AI_DELAY_PREDICTION_API_URL}/predict-delay`
      : 'http://localhost:8012/predict-delay';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    try {
      const res = await fetch(apiDelayPredictor, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`[delayPredictionService] predict-delay API returned ${res.status}`);
        return null;
      }
      return (await res.json()) as DelayPredictionResponse;
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      console.warn('[delayPredictionService] API call failed or timed out:', fetchErr);
      return null;
    }

  } catch (err) {
    console.error('[delayPredictionService] predict-delay error:', err);
    return null;
  }
}
