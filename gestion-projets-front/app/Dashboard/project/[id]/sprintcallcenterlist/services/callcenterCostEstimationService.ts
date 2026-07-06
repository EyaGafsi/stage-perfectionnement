// ─── callcenterCostEstimationService.ts ──────────────────────────────────────

const COST_API = 'https://callcenter-project-cost-estimator.onrender.com/predict';

export interface CallCenterCostOptions {
  numberOfAgents?:        number;
  numberOfCallsPerDay?:   number;
  averageHandleTimeSec?:  number;
  slaTargetSeconds?:      number;
  risksScore?:            number;
  callTypes?:             string;
  dependencies?:          string;
  CSAT?:                  number;
  FCR?:                   number;
}

export async function estimateCallCenterProjectCost(
  durationDays: number,
  teamSize:     number,
  opts:         CallCenterCostOptions,
): Promise<number | null> {
  try {
    const payload = {
      numberOfAgents:       opts.numberOfAgents       ?? Math.max(teamSize, 1),
      numberOfCallsPerDay:  opts.numberOfCallsPerDay  ?? 100,
      averageHandleTimeSec: opts.averageHandleTimeSec ?? 300,
      estimatedDurationDays: Math.max(durationDays, 1),
      slaTargetSeconds:     opts.slaTargetSeconds     ?? 120,
      risksScore:           opts.risksScore           ?? 0.3,
      callTypes:            opts.callTypes            ?? 'Support',
      dependencies:         opts.dependencies         ?? 'CRM',
      CSAT:                 opts.CSAT                 ?? 80,
      FCR:                  opts.FCR                  ?? 70,
    };

    console.log('[callCenterCostAPI] POST →', payload);

    const res = await fetch(COST_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error('[callCenterCostAPI]', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    const raw  = data.predicted_budget_tnd ?? data.prediction ?? data.predicted_budget;
    return typeof raw === 'number' ? Math.round(raw) : null;
  } catch (err) {
    console.error('[callCenterCostAPI] error:', err);
    return null;
  }
}