import type { CompanyStage, DilutionRound, ExitScenario, FundingRound, OptionsInput, PreferredRound } from '@/types/options';

/**
 * Default dilution percentages by funding round
 * Based on Carta Q1 2024 data and Rebel Fund 2025 benchmarks
 */
export const DILUTION_DEFAULTS: Record<string, number> = {
  Seed: 20,
  'Series A': 18,
  'Series B': 15,
  'Series C': 11,
  'Series D+': 8,
};

/**
 * Get default dilution rounds based on round name
 */
export function getDefaultDilution(roundName: string): number {
  return DILUTION_DEFAULTS[roundName] ?? 15;
}

/**
 * Company stages for stage-aware probability calculations
 */
export const COMPANY_STAGES: CompanyStage[] = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
];

/**
 * Stage-specific failure rates (cumulative probability of failure from current stage to exit)
 *
 * Sources:
 * - SPDLoad Startup Failure Statistics 2025: https://spdload.com/blog/startup-success-rate/
 *   - 60% of startups fail between pre-seed and Series A
 *   - 35% of Series A startups fail before Series B
 *   - Only 1% of startups fail after Series C
 * - Embroker Startup Statistics: https://www.embroker.com/blog/startup-statistics/
 *   - 75% of venture-backed startups fail (Harvard)
 * - YC Exits 2025: https://jaredheyman.medium.com/on-yc-startup-exits-2025-update-c6017e8e526e
 *   - 93% of exit value comes from just 8% of exits (unicorns)
 */
export const STAGE_FAILURE_RATES: Record<CompanyStage, number> = {
  'Pre-Seed': 0.90,  // 90% fail (60% fail before Series A alone, compounded risk)
  'Seed': 0.80,      // 80% fail
  'Series A': 0.65,  // 65% fail (35% fail before Series B)
  'Series B': 0.45,  // 45% fail
  'Series C+': 0.20, // ~20% fail (only 1% fail outright post-C, rest from market conditions)
};

/**
 * Stage-specific exit scenario adjustments
 *
 * Earlier stages: higher failure rate, but higher upside potential if successful
 * Later stages: lower failure rate, but returns more predictable/lower upside
 *
 * unicornProb is a multiplier applied to exceptional outcome probabilities:
 * - Early stage: maintain full unicorn potential (1.0)
 * - Late stage: reduced unicorn potential (0.3) since much growth already happened
 */
export const STAGE_EXIT_ADJUSTMENTS: Record<CompanyStage, {
  failureProb: number;
  unicornProb: number;
}> = {
  'Pre-Seed': { failureProb: 0.90, unicornProb: 1.0 },
  'Seed': { failureProb: 0.80, unicornProb: 0.9 },
  'Series A': { failureProb: 0.65, unicornProb: 0.7 },
  'Series B': { failureProb: 0.45, unicornProb: 0.5 },
  'Series C+': { failureProb: 0.20, unicornProb: 0.3 },
};

/**
 * Available funding round options
 */
export const FUNDING_ROUNDS = [
  'Seed',
  'Series A',
  'Series B',
  'Series C',
  'Series D+',
];

/**
 * Default exit scenarios with probabilities
 * Based on startup exit statistics:
 * - ~75-80% of startups fail
 * - Only 10-15% of Series A companies have successful exits
 * - 97% of exits are acquisitions, not IPOs
 */
export const DEFAULT_EXIT_SCENARIOS: ExitScenario[] = [
  { name: 'Failure', multiple: 0, probability: 0.75 },
  { name: 'Acqui-hire', multiple: 1.5, probability: 0.10 },
  { name: 'Moderate', multiple: 3, probability: 0.08 },
  { name: 'Strong', multiple: 5, probability: 0.04 },
  { name: 'Exceptional', multiple: 10, probability: 0.025 },
  { name: 'Unicorn', multiple: 20, probability: 0.005 },
];

/**
 * Simplified exit scenarios for display cards (legacy - multiples based)
 */
export const DISPLAY_EXIT_SCENARIOS: ExitScenario[] = [
  { name: 'Fail', multiple: 0, probability: 0.75 },
  { name: '2x', multiple: 2, probability: 0.10 },
  { name: '5x', multiple: 5, probability: 0.08 },
  { name: '10x', multiple: 10, probability: 0.05 },
];

/**
 * Exit scenarios by absolute $ amount
 * More intuitive for users: "If company sells for $1B, what do I get?"
 */
export interface ExitValuationScenario {
  name: string;
  value: number;
}

export const DEFAULT_EXIT_VALUATIONS: ExitValuationScenario[] = [
  { name: '$100M', value: 100_000_000 },
  { name: '$500M', value: 500_000_000 },
  { name: '$1B', value: 1_000_000_000 },
  { name: '$5B', value: 5_000_000_000 },
];

/**
 * Slider config for custom exit valuation
 */
export const EXIT_VALUATION_SLIDER_CONFIG = {
  min: 10_000_000,      // $10M
  max: 32_000_000_000,  // $32B
  step: 10_000_000,     // $10M increments
};

/**
 * Default input values for the calculator
 */
export const DEFAULT_INPUTS: OptionsInput = {
  numberOfOptions: 10000,
  strikePrice: 1.0,
  currentFMV: 5.0,
  companyValuation: 50_000_000, // $50M
  ownershipPercent: 0.1, // 0.1%
  optionType: 'ISO',
};

/**
 * Slider configuration for inputs
 */
export const SLIDER_CONFIG = {
  numberOfOptions: {
    min: 100,
    max: 100000,
    step: 100,
  },
  strikePrice: {
    min: 0.01,
    max: 100,
    step: 0.01,
  },
  currentFMV: {
    min: 0.01,
    max: 500,
    step: 0.01,
  },
  companyValuation: {
    min: 1_000_000,
    max: 10_000_000_000,
    step: 1_000_000,
  },
  ownershipPercent: {
    min: 0.001,
    max: 10,
    step: 0.001,
  },
  dilutionPercent: {
    min: 0,
    max: 50,
    step: 1,
  },
  investedAmount: {
    min: 100_000,
    max: 500_000_000,
    step: 100_000,
  },
  liquidationMultiple: {
    min: 1,
    max: 3,
    step: 0.5,
  },
  investorOwnership: {
    min: 1,
    max: 50,
    step: 1,
  },
};

/**
 * Tax information for ISO and NSO options
 */
export const TAX_INFO = {
  ISO: {
    title: 'Incentive Stock Options (ISO)',
    points: [
      'No ordinary income tax at exercise',
      'Spread may trigger Alternative Minimum Tax (AMT)',
      'Must hold shares 2+ years from grant, 1+ year from exercise for LTCG',
      'If sold early, treated as NSO (ordinary income on spread)',
    ],
  },
  NSO: {
    title: 'Non-Qualified Stock Options (NSO)',
    points: [
      'Ordinary income tax on spread at exercise',
      'Subject to payroll taxes (Social Security, Medicare)',
      'Any additional gains taxed as capital gains',
      'No AMT concerns, but higher immediate tax burden',
    ],
  },
};

/**
 * Federal tax bracket options for tax calculations
 * Based on 2024 US federal income tax brackets
 */
export const TAX_BRACKETS = [
  { label: '22%', value: 0.22, range: '$47,150 - $100,525' },
  { label: '24%', value: 0.24, range: '$100,525 - $191,950' },
  { label: '32%', value: 0.32, range: '$191,950 - $243,725' },
  { label: '35%', value: 0.35, range: '$243,725 - $609,350' },
  { label: '37%', value: 0.37, range: '$609,350+' },
];

/**
 * Default typical investment amounts by funding round
 * Used for preferred stock waterfall modeling
 */
export const TYPICAL_ROUND_AMOUNTS: Record<string, number> = {
  Seed: 3_000_000,
  'Series A': 15_000_000,
  'Series B': 40_000_000,
  'Series C': 80_000_000,
  'Series D+': 150_000_000,
};

/**
 * Default ownership percentages for investors by round
 */
export const TYPICAL_INVESTOR_OWNERSHIP: Record<string, number> = {
  Seed: 15,
  'Series A': 20,
  'Series B': 15,
  'Series C': 12,
  'Series D+': 10,
};

/**
 * Generate a unique ID for preferred rounds
 */
export function generatePreferredRoundId(): string {
  return `preferred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new preferred round with defaults
 */
export function createPreferredRound(name: string): PreferredRound {
  return {
    id: generatePreferredRoundId(),
    name,
    investedAmount: TYPICAL_ROUND_AMOUNTS[name] ?? 10_000_000,
    liquidationMultiple: 1,
    preferredType: 'non-participating',
    ownershipPercent: TYPICAL_INVESTOR_OWNERSHIP[name] ?? 15,
  };
}

/**
 * Opportunity cost comparison defaults
 * S&P 500 historical average: ~10% nominal annual return since 1926
 * Source: NYU Stern Damodaran data
 */
export const OPPORTUNITY_COST_DEFAULTS = {
  alternativeReturnRate: 0.10, // 10% S&P 500 average
  timeHorizonYears: 10,
};

export const OPPORTUNITY_COST_SLIDER_CONFIG = {
  alternativeReturnRate: {
    min: 0.01,
    max: 0.20,
    step: 0.01,
  },
  timeHorizonYears: {
    min: 1,
    max: 15,
    step: 1,
  },
};

/**
 * Generate a unique ID for dilution rounds
 */
export function generateRoundId(): string {
  return `round-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new dilution round with defaults
 */
export function createDilutionRound(name: string): DilutionRound {
  return {
    id: generateRoundId(),
    name,
    dilutionPercent: getDefaultDilution(name),
  };
}

/**
 * Create a new unified funding round with defaults
 * Combines dilution modeling + liquidation preferences
 * Note: Investor ownership is derived from dilutionPercent (they're equivalent)
 */
export function createFundingRound(name: string): FundingRound {
  return {
    id: generateRoundId(),
    name,
    // Dilution (also determines investor ownership for waterfall calculations)
    dilutionPercent: getDefaultDilution(name),
    // Liquidation preference
    amountRaised: TYPICAL_ROUND_AMOUNTS[name] ?? 10_000_000,
    // Advanced (defaults to standard terms)
    liquidationMultiple: 1,
    preferredType: 'non-participating',
  };
}
