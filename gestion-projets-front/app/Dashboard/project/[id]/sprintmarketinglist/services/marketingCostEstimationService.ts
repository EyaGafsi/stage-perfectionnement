// ─── marketingCostEstimationService.ts ───────────────────────────────────────
// Calls the AI cost model for marketing projects.
//
// Endpoint: POST https://marketing-project-cost.onrender.com/predict
// Required columns (from API error):
//   mediaBudget, contingencyPercent, dependencies, mainGoals,
//   keyDeliverables, metrics, externalCosts, fixedCosts, risks
//   + estimatedDurationDays, teamSize, campaignType, channels, etc.

const COST_API = 'https://marketing-project-cost.onrender.com/predict';

export interface MarketingCostPayload {
  // ── Required fields ───────────────────────────────────────────────────────
  mediaBudget:         number;
  contingencyPercent:  number;
  dependencies:        string;
  mainGoals:           string;
  keyDeliverables:     string;
  metrics:             string;
  externalCosts:       number;
  fixedCosts:          number;
  risks:               string;

  // ── Additional fields ─────────────────────────────────────────────────────
  estimatedDurationDays: number;
  teamSize:              number;
  totalBudget?:          number;
  campaignType?:         string;
  targetAudience?:       string;
  channels?:             string;
  goals?:                string;
  expectedReach?:        number;
  expectedLeads?:        number;
  expectedROI?:          number;
}

export interface MarketingCostOptions {
  totalBudget?:        number;
  campaignType?:       string;
  targetAudience?:     string;
  channels?:           string;
  goals?:              string;
  expectedReach?:      number;
  expectedLeads?:      number;
  expectedROI?:        number;
  mediaBudget?:        number;
  contingencyPercent?: number;
  dependencies?:       string;
  mainGoals?:          string;
  keyDeliverables?:    string;
  metrics?:            string;
  externalCosts?:      number;
  fixedCosts?:         number;
  risks?:              string;
}

// Accepted campaignType values (keep in sync with ML training data)
export const CAMPAIGN_TYPE_VALUES = [
  'Email', 'Social Media', 'SEO', 'PPC', 'Content',
  'Video', 'Influencer', 'Event', 'PR', 'Mixed', '',
];

function buildPayload(
  durationDays: number,
  teamSize:     number,
  opts:         MarketingCostOptions,
): MarketingCostPayload {
  const totalBudget = Number(opts.totalBudget ?? 0);

  // mediaBudget = 70% of total budget (classic media split)
  const mediaBudget   = opts.mediaBudget   ?? Math.round(totalBudget * 0.7);
  // externalCosts = 20% (influencers, agencies…)
  const externalCosts = opts.externalCosts ?? Math.round(totalBudget * 0.2);
  // fixedCosts = 10% (tools, licences…)
  const fixedCosts    = opts.fixedCosts    ?? Math.round(totalBudget * 0.1);
  // contingency = 10% default
  const contingencyPercent = opts.contingencyPercent ?? 10;

  // mainGoals — from goals field or inferred from KPI fields
  const mainGoals =
    opts.mainGoals ??
    opts.goals ??
    ([
      opts.expectedLeads ? 'Leads'  : '',
      opts.expectedROI   ? 'ROI'    : '',
      opts.expectedReach ? 'Reach'  : '',
    ].filter(Boolean).join('|') || 'Awareness');

  // keyDeliverables — from campaignType + channels
  const keyDeliverables =
    opts.keyDeliverables ??
    ([opts.campaignType, opts.channels].filter(Boolean).join('|') || 'Campaign');

  // metrics — standard marketing KPIs
  const metrics =
    opts.metrics ??
    ([
      opts.expectedLeads ? 'Leads' : '',
      opts.expectedReach ? 'Reach' : '',
      opts.expectedROI   ? 'ROI'   : '',
      'CTR',
      'CPA',
    ].filter(Boolean).join('|'));

  const dependencies = opts.dependencies ?? '';
  const risks        = opts.risks        ?? '';

  // Sanitize campaignType: only accepted values
  const campaignType = CAMPAIGN_TYPE_VALUES.includes(opts.campaignType ?? '')
    ? (opts.campaignType ?? '')
    : '';

  return {
    mediaBudget,
    contingencyPercent,
    dependencies,
    mainGoals,
    keyDeliverables,
    metrics,
    externalCosts,
    fixedCosts,
    risks,
    estimatedDurationDays: Math.max(durationDays, 1),
    teamSize:               Math.max(teamSize, 1),
    totalBudget,
    campaignType,
    targetAudience: opts.targetAudience ?? '',
    channels:       opts.channels       ?? '',
    goals:          opts.goals          ?? '',
    expectedReach:  Number(opts.expectedReach  ?? 0),
    expectedLeads:  Number(opts.expectedLeads  ?? 0),
    expectedROI:    Number(opts.expectedROI    ?? 0),
  };
}

/**
 * Calls the marketing AI cost model.
 * Returns the predicted cost or null if the API is unavailable.
 */
export async function estimateMarketingProjectCost(
  durationDays: number,
  teamSize:     number,
  opts:         MarketingCostOptions,
): Promise<number | null> {
  try {
    const payload = buildPayload(durationDays, teamSize, opts);
    console.log('[marketingCostAPI] POST →', payload);

    const res = await fetch(COST_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ data: payload }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[marketingCostAPI]', res.status, body);
      return null;
    }

    const data = await res.json();
    const raw  = data.predictedBudget ?? data.prediction ?? data.estimated_cost;
    return typeof raw === 'number' ? Math.round(raw * 100) / 100 : null;
  } catch (err) {
    console.error('[marketingCostAPI] error:', err);
    return null;
  }
}