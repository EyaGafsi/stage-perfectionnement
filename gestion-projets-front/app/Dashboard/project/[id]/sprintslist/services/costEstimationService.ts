// ─── costEstimationService.ts ──────────────────────────────────────────────────
// Estime le coût total du projet via l'API de coût externe (FastAPI / RandomForest).
//
// FLUX:
//   SprintsPage
//     → computeProjectMetrics()   → totalHours, teamSize, durationDays
//     → estimateProjectCost()     → POST /predict-cost { estimatedDurationDays, teamSize, … }
//     → persistProjectMetrics()   → PATCH /projects/:id/it-details { estimatedDurationDays, estimatedCost, teamSize }
//
// NOTE: "use server" intentionally absent — this runs in the browser (client component).

import type { ProjectMember } from './types';

// ─── Request / Response types ─────────────────────────────────────────────────

export interface CostEstimationRequest {
  programmingLanguages:  string;
  framework:             string;
  database:              string;
  serverDetails:         string;
  architecture:          string;
  apiIntegration:        string;
  securityRequirements:  string;
  devOpsRequirements:    string;
  /** Clé principale : ceil(totalHours / 8 / teamSize) calculé depuis les tâches */
  estimatedDurationDays: number;
  priority:              string;
  businessImpact:        string;
  teamSize:              number;
  complexity:            string;
  mainModules:           string;
}

export interface CostEstimationResponse {
  estimated_cost: number;
  currency:       string;
  warning?:       string;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Appelle le modèle IA de coût avec la durée du projet en jours.
 *
 * @param projectDurationDays  ceil(totalHours / 8 / teamSize)  — calculé par computeProjectMetrics
 * @param teamSize             nombre de membres distincts affectés aux tâches
 * @param projectDetails       champs optionnels du ProjectITDto (framework, DB, etc.)
 * @param authToken            JWT Bearer
 * @returns coût estimé en DT, ou null si l'API est indisponible
 */
export async function estimateProjectCost(
  projectDurationDays: number,
  teamSize:            number,
  projectDetails:      Partial<CostEstimationRequest>,
  authToken:           string,
): Promise<number | null> {
  try {
    const costApiBase = process.env.NEXT_PUBLIC_COST_ESTIMATION_API_URL;

    if (!costApiBase) {
      console.warn('[costEstimationService] NEXT_PUBLIC_COST_ESTIMATION_API_URL not set');
      return null;
    }

    if (projectDurationDays <= 0) {
      console.warn('[costEstimationService] durationDays = 0 — skip cost estimation');
      return null;
    }

    // Build full payload; projectDetails overrides the safe defaults
    const payload: CostEstimationRequest = {
      programmingLanguages:  projectDetails.programmingLanguages  ?? 'TypeScript',
      framework:             projectDetails.framework             ?? 'React/NestJS',
      database:              projectDetails.database              ?? 'PostgreSQL',
      serverDetails:         projectDetails.serverDetails         ?? 'AWS EC2',
      architecture:          projectDetails.architecture          ?? 'Microservices',
      apiIntegration:        projectDetails.apiIntegration        ?? 'REST',
      securityRequirements:  projectDetails.securityRequirements  ?? 'JWT',
      devOpsRequirements:    projectDetails.devOpsRequirements    ?? 'Docker/CI-CD',
      priority:              projectDetails.priority              ?? 'Medium',
      businessImpact:        projectDetails.businessImpact        ?? 'Important',
      complexity:            projectDetails.complexity            ?? 'Medium',
      mainModules:           projectDetails.mainModules           ?? 'Core Modules',
      // ── The two fields that vary per project ──────────────────────────────
      estimatedDurationDays: projectDurationDays,  // ← from computeProjectMetrics
      teamSize,                                    // ← from computeProjectMetrics
    };

    console.log('[costEstimationService] POST /predict-cost →', {
      estimatedDurationDays: payload.estimatedDurationDays,
      teamSize:              payload.teamSize,
      endpoint:              `${costApiBase}/predict-cost`,
    });

    const res = await fetch(`${costApiBase}/predict-cost`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[costEstimationService] predict-cost ${res.status}:`, body);
      return null;
    }

    const data: CostEstimationResponse = await res.json();

    if (typeof data.estimated_cost === 'number') {
      console.log(
        `[costEstimationService] coût estimé = ${data.estimated_cost} ${data.currency}`,
      );
      return data.estimated_cost;
    }

    return null;
  } catch (err) {
    console.error('[costEstimationService] error:', err);
    return null;
  }
}