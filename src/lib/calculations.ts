import type {
  OptionsInput,
  DilutionRound,
  ExitScenario,
  CalculatedResults,
  ExitScenarioResult,
  OpportunityCostDataPoint,
  OpportunityCostResult,
  TaxCalculation,
  OptionType,
  PreferredRound,
  FundingRound,
  WaterfallResult,
  CompanyStage,
} from '@/types/options';
import { DEFAULT_EXIT_SCENARIOS, STAGE_EXIT_ADJUSTMENTS } from './defaults';

// Tax constants
const AMT_RATE = 0.28; // Simplified AMT rate for ISO spread
const FICA_RATE = 0.0765; // 6.2% Social Security + 1.45% Medicare
const SS_RATE = 0.062; // Social Security tax rate (employee portion)
const MEDICARE_RATE = 0.0145; // Medicare tax rate (employee portion)
// Social Security wage base for 2025 (IRS source: https://www.ssa.gov/oact/cola/cbb.html)
const SS_WAGE_CAP = 176_100;

/**
 * Derive company valuation from ownership percentage
 * Formula: Valuation = (numberOfOptions × FMV) / (ownershipPercent / 100)
 *
 * Note: This is an approximation since FMV is 409A value (common stock),
 * not the preferred stock price from funding rounds.
 */
export function deriveValuationFromOwnership(
  numberOfOptions: number,
  currentFMV: number,
  ownershipPercent: number
): number {
  if (ownershipPercent <= 0 || numberOfOptions <= 0) return 0;
  const shareValue = numberOfOptions * currentFMV;
  return shareValue / (ownershipPercent / 100);
}

/**
 * Calculate the total cost to exercise all options
 */
export function calculateExerciseCost(
  numberOfOptions: number,
  strikePrice: number
): number {
  return numberOfOptions * strikePrice;
}

/**
 * Calculate the current paper value based on FMV
 */
export function calculateCurrentValue(
  numberOfOptions: number,
  currentFMV: number
): number {
  return numberOfOptions * currentFMV;
}

/**
 * Calculate paper gain/loss
 */
export function calculatePaperGain(
  currentValue: number,
  exerciseCost: number
): number {
  return currentValue - exerciseCost;
}

/**
 * Calculate paper gain as a percentage
 */
export function calculatePaperGainPercent(
  paperGain: number,
  exerciseCost: number
): number {
  if (exerciseCost === 0) return 0;
  return (paperGain / exerciseCost) * 100;
}

/**
 * Calculate the break-even multiple needed
 * How much must the company value grow to break even after exercising
 */
export function calculateBreakEvenMultiple(
  strikePrice: number,
  currentFMV: number
): number {
  if (currentFMV === 0) return Infinity;
  return strikePrice / currentFMV;
}

/**
 * Calculate ownership after dilution from multiple rounds
 * Uses compound dilution: ownership × (1 - round1) × (1 - round2) × ...
 */
export function calculateOwnershipAfterDilution(
  initialOwnership: number,
  dilutionRounds: DilutionRound[]
): number {
  return dilutionRounds.reduce((ownership, round) => {
    return ownership * (1 - round.dilutionPercent / 100);
  }, initialOwnership);
}

/**
 * Calculate total dilution percentage from multiple rounds
 */
export function calculateTotalDilution(dilutionRounds: DilutionRound[]): number {
  if (dilutionRounds.length === 0) return 0;
  const retentionRate = dilutionRounds.reduce((retention, round) => {
    return retention * (1 - round.dilutionPercent / 100);
  }, 1);
  return (1 - retentionRate) * 100;
}

/**
 * Calculate ownership after dilution from unified FundingRounds
 */
export function calculateOwnershipAfterDilutionFromFundingRounds(
  initialOwnership: number,
  fundingRounds: FundingRound[]
): number {
  return fundingRounds.reduce((ownership, round) => {
    return ownership * (1 - round.dilutionPercent / 100);
  }, initialOwnership);
}

/**
 * Calculate total dilution from unified FundingRounds
 */
export function calculateTotalDilutionFromFundingRounds(fundingRounds: FundingRound[]): number {
  if (fundingRounds.length === 0) return 0;
  const retentionRate = fundingRounds.reduce((retention, round) => {
    return retention * (1 - round.dilutionPercent / 100);
  }, 1);
  return (1 - retentionRate) * 100;
}

/**
 * Convert FundingRounds to PreferredRounds for waterfall calculation
 */
export function fundingRoundsToPreferredRounds(fundingRounds: FundingRound[]): PreferredRound[] {
  return fundingRounds.map((round) => ({
    id: round.id,
    name: round.name,
    investedAmount: round.amountRaised,
    liquidationMultiple: round.liquidationMultiple,
    preferredType: round.preferredType,
    ownershipPercent: round.dilutionPercent, // Investor ownership equals dilution
  }));
}

/**
 * Calculate exit value at a given multiple
 */
export function calculateExitValue(
  ownershipPercent: number,
  companyValuation: number,
  exitMultiple: number
): number {
  return (ownershipPercent / 100) * companyValuation * exitMultiple;
}

/**
 * Calculate profit from an exit
 */
export function calculateProfit(
  exitValue: number,
  exerciseCost: number
): number {
  return exitValue - exerciseCost;
}

/**
 * Calculate ROI percentage
 */
export function calculateROI(profit: number, exerciseCost: number): number {
  if (exerciseCost === 0) return profit > 0 ? Infinity : 0;
  return (profit / exerciseCost) * 100;
}

/**
 * Calculate probability-weighted expected value
 * Uses default exit probabilities based on startup statistics
 */
export function calculateExpectedValue(
  ownershipPercent: number,
  companyValuation: number,
  exerciseCost: number,
  scenarios: ExitScenario[] = DEFAULT_EXIT_SCENARIOS
): number {
  const weightedValue = scenarios.reduce((sum, scenario) => {
    const exitValue = calculateExitValue(
      ownershipPercent,
      companyValuation,
      scenario.multiple
    );
    return sum + scenario.probability * exitValue;
  }, 0);

  return weightedValue - exerciseCost;
}

/**
 * Calculate all results for the calculator
 */
export function calculateAllResults(
  inputs: OptionsInput,
  dilutionRounds: DilutionRound[]
): CalculatedResults {
  const exerciseCost = calculateExerciseCost(
    inputs.numberOfOptions,
    inputs.strikePrice
  );
  const currentValue = calculateCurrentValue(
    inputs.numberOfOptions,
    inputs.currentFMV
  );
  const paperGain = calculatePaperGain(currentValue, exerciseCost);
  const paperGainPercent = calculatePaperGainPercent(paperGain, exerciseCost);
  const breakEvenMultiple = calculateBreakEvenMultiple(
    inputs.strikePrice,
    inputs.currentFMV
  );

  const ownershipAfterDilution = calculateOwnershipAfterDilution(
    inputs.ownershipPercent,
    dilutionRounds
  );
  const totalDilutionPercent = calculateTotalDilution(dilutionRounds);

  const expectedValue = calculateExpectedValue(
    ownershipAfterDilution,
    inputs.companyValuation,
    exerciseCost
  );

  // Calculate tax implications
  const federalTaxBracket = inputs.federalTaxBracket ?? 0.32; // Default 32%
  const taxCalculation = calculateTaxes(
    inputs.numberOfOptions,
    inputs.strikePrice,
    inputs.currentFMV,
    inputs.optionType,
    federalTaxBracket,
    inputs.annualWages
  );

  return {
    exerciseCost,
    currentValue,
    paperGain,
    paperGainPercent,
    breakEvenMultiple,
    ownershipAfterDilution,
    totalDilutionPercent,
    expectedValue,
    taxCalculation,
  };
}

/**
 * Calculate all results using unified FundingRounds
 *
 * @param inputs - User inputs (options, FMV, etc.)
 * @param fundingRounds - Funding rounds for dilution and liquidation preference modeling
 * @param exitScenarios - Optional stage-adjusted exit scenarios (defaults to DEFAULT_EXIT_SCENARIOS)
 */
export function calculateAllResultsWithFundingRounds(
  inputs: OptionsInput,
  fundingRounds: FundingRound[],
  exitScenarios?: ExitScenario[]
): CalculatedResults {
  const exerciseCost = calculateExerciseCost(
    inputs.numberOfOptions,
    inputs.strikePrice
  );
  const currentValue = calculateCurrentValue(
    inputs.numberOfOptions,
    inputs.currentFMV
  );
  const paperGain = calculatePaperGain(currentValue, exerciseCost);
  const paperGainPercent = calculatePaperGainPercent(paperGain, exerciseCost);
  const breakEvenMultiple = calculateBreakEvenMultiple(
    inputs.strikePrice,
    inputs.currentFMV
  );

  const ownershipAfterDilution = calculateOwnershipAfterDilutionFromFundingRounds(
    inputs.ownershipPercent,
    fundingRounds
  );
  const totalDilutionPercent = calculateTotalDilutionFromFundingRounds(fundingRounds);

  // Use provided exit scenarios (stage-adjusted) or fall back to defaults
  const expectedValue = calculateExpectedValue(
    ownershipAfterDilution,
    inputs.companyValuation,
    exerciseCost,
    exitScenarios
  );

  // Calculate tax implications
  const federalTaxBracket = inputs.federalTaxBracket ?? 0.32; // Default 32%
  const taxCalculation = calculateTaxes(
    inputs.numberOfOptions,
    inputs.strikePrice,
    inputs.currentFMV,
    inputs.optionType,
    federalTaxBracket,
    inputs.annualWages
  );

  return {
    exerciseCost,
    currentValue,
    paperGain,
    paperGainPercent,
    breakEvenMultiple,
    ownershipAfterDilution,
    totalDilutionPercent,
    expectedValue,
    taxCalculation,
  };
}

/**
 * Calculate results for a specific exit scenario
 */
export function calculateExitScenarioResult(
  scenario: ExitScenario,
  ownershipPercent: number,
  companyValuation: number,
  exerciseCost: number
): ExitScenarioResult {
  const exitValue = calculateExitValue(
    ownershipPercent,
    companyValuation,
    scenario.multiple
  );
  const profit = calculateProfit(exitValue, exerciseCost);
  const roi = calculateROI(profit, exerciseCost);

  return {
    scenario,
    exitValue,
    profit,
    roi,
  };
}

/**
 * Calculate results for all exit scenarios
 */
export function calculateAllExitScenarios(
  scenarios: ExitScenario[],
  ownershipPercent: number,
  companyValuation: number,
  exerciseCost: number
): ExitScenarioResult[] {
  return scenarios.map((scenario) =>
    calculateExitScenarioResult(
      scenario,
      ownershipPercent,
      companyValuation,
      exerciseCost
    )
  );
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format large currency with full precision
 */
export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals: number = 1): string {
  if (!isFinite(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format ownership percentage (smaller numbers need more precision)
 */
export function formatOwnership(value: number): string {
  if (value < 0.01) {
    return `${value.toFixed(4)}%`;
  }
  if (value < 1) {
    return `${value.toFixed(3)}%`;
  }
  return `${value.toFixed(2)}%`;
}

/**
 * Format multiple for display
 */
export function formatMultiple(value: number): string {
  if (!isFinite(value)) return '—';
  return `${value.toFixed(2)}x`;
}

/**
 * Calculate FICA tax on NSO spread, accounting for SS wage cap
 *
 * Social Security (6.2%) only applies up to the wage base ($176,100 for 2025)
 * Medicare (1.45%) applies to all wages with no cap
 */
function calculateFicaTax(
  spreadTotal: number,
  annualWages?: number
): { ficaTax: number; ssCapped: boolean } {
  const medicareTax = spreadTotal * MEDICARE_RATE;

  // If no wages provided, use full FICA rate (conservative estimate)
  if (annualWages === undefined) {
    return {
      ficaTax: spreadTotal * FICA_RATE,
      ssCapped: false,
    };
  }

  // If wages already exceed SS cap, only Medicare applies
  if (annualWages >= SS_WAGE_CAP) {
    return {
      ficaTax: medicareTax,
      ssCapped: true,
    };
  }

  // If wages + spread exceed cap, only pay SS on portion up to cap
  const ssableAmount = Math.min(spreadTotal, SS_WAGE_CAP - annualWages);
  const ssTax = ssableAmount * SS_RATE;

  return {
    ficaTax: ssTax + medicareTax,
    ssCapped: ssableAmount < spreadTotal,
  };
}

/**
 * Calculate tax implications at exercise
 *
 * For ISO (Incentive Stock Options):
 * - No ordinary income at exercise
 * - Spread counts as AMT income (may trigger Alternative Minimum Tax)
 * - Simplified: assume 28% AMT rate on spread
 *
 * For NSO (Non-Qualified Stock Options):
 * - Spread is ordinary income at exercise
 * - Subject to federal income tax + FICA (Social Security + Medicare)
 * - SS tax is capped at the wage base ($176,100 for 2025)
 */
export function calculateTaxes(
  numberOfOptions: number,
  strikePrice: number,
  exerciseFMV: number,
  optionType: OptionType,
  federalTaxBracket: number,
  annualWages?: number
): TaxCalculation {
  const spread = Math.max(0, exerciseFMV - strikePrice);
  const spreadTotal = spread * numberOfOptions;

  if (optionType === 'ISO') {
    const estimatedAMT = spreadTotal * AMT_RATE;
    return {
      spread,
      spreadTotal,
      optionType,
      amtIncome: spreadTotal,
      estimatedAMT,
      estimatedTaxAtExercise: estimatedAMT,
    };
  } else {
    // NSO
    const { ficaTax, ssCapped } = calculateFicaTax(spreadTotal, annualWages);
    const incomeTax = spreadTotal * federalTaxBracket;
    const ordinaryIncomeTax = incomeTax + ficaTax;

    return {
      spread,
      spreadTotal,
      optionType,
      ordinaryIncome: spreadTotal,
      ordinaryIncomeTax,
      ficaTax,
      ssCapped,
      estimatedTaxAtExercise: ordinaryIncomeTax,
    };
  }
}

/**
 * Calculate liquidation waterfall for preferred vs common stock
 *
 * Liquidation preferences determine how exit proceeds are distributed:
 * - Preferred shareholders get paid first (usually 1x their investment)
 * - Remaining proceeds go to common shareholders (employees)
 *
 * Non-participating preferred: Gets MAX(liquidation preference, pro-rata share)
 * Participating preferred: Gets liquidation preference PLUS pro-rata share of remainder
 */
export function calculateWaterfall(
  exitValuation: number,
  preferredRounds: PreferredRound[],
  employeeOwnershipPercent: number
): WaterfallResult {
  if (preferredRounds.length === 0) {
    // No preferred stock - simple pro-rata distribution
    const employeePayout = (employeeOwnershipPercent / 100) * exitValuation;
    return {
      exitValue: exitValuation,
      preferredPayout: 0,
      commonPool: exitValuation,
      employeeOwnershipOfCommon: employeeOwnershipPercent,
      employeePayout,
    };
  }

  // Calculate total preferred ownership and investment
  const totalPreferredOwnership = preferredRounds.reduce(
    (sum, r) => sum + r.ownershipPercent,
    0
  );
  const totalCommonOwnership = 100 - totalPreferredOwnership;

  // Employee's share of the common pool (as % of common, not total)
  const employeeOwnershipOfCommon =
    totalCommonOwnership > 0
      ? (employeeOwnershipPercent / totalCommonOwnership) * 100
      : 0;

  let remainingValue = exitValuation;
  let preferredPayout = 0;

  // Sort rounds by seniority (later rounds usually senior, pay first)
  const sortedRounds = [...preferredRounds].reverse();

  // First pass: pay liquidation preferences
  for (const round of sortedRounds) {
    const preference = round.investedAmount * round.liquidationMultiple;
    const proRata = (round.ownershipPercent / 100) * exitValuation;

    if (round.preferredType === 'non-participating') {
      // Non-participating: choose preference OR convert to common (pro-rata)
      // They choose whichever is higher
      const payout = Math.min(remainingValue, Math.max(preference, proRata));
      preferredPayout += payout;
      remainingValue -= payout;
    } else {
      // Participating: get preference first
      const preferencePayout = Math.min(remainingValue, preference);
      preferredPayout += preferencePayout;
      remainingValue -= preferencePayout;
    }
  }

  // Second pass: participating preferred gets pro-rata of remainder
  for (const round of sortedRounds) {
    if (round.preferredType === 'participating' && remainingValue > 0) {
      const proRataOfRemainder =
        (round.ownershipPercent / 100) * remainingValue;
      preferredPayout += proRataOfRemainder;
      remainingValue -= proRataOfRemainder;
    }
  }

  const commonPool = Math.max(0, remainingValue);
  const employeePayout = (employeeOwnershipOfCommon / 100) * commonPool;

  return {
    exitValue: exitValuation,
    preferredPayout,
    commonPool,
    employeeOwnershipOfCommon,
    employeePayout,
  };
}

/**
 * Find the exit valuation needed for an employee to receive a target payout,
 * accounting for liquidation preferences.
 *
 * Uses binary search because the waterfall has piecewise linear regions
 * (due to MAX() in non-participating preferred calculations) that can't
 * be inverted with a single formula.
 */
export function findExitForTargetPayout(
  targetPayout: number,
  preferredRounds: PreferredRound[],
  ownershipPercent: number
): number {
  // No preferences or no ownership - simple calculation
  if (preferredRounds.length === 0 || ownershipPercent <= 0) {
    return ownershipPercent > 0 ? targetPayout / (ownershipPercent / 100) : 0;
  }

  // Binary search for the exit valuation
  let low = 0;
  let high = targetPayout * 100;

  // Ensure upper bound is high enough
  while (calculateWaterfall(high, preferredRounds, ownershipPercent).employeePayout < targetPayout) {
    high *= 2;
    if (high > 1e15) break; // Safety limit: $1 quadrillion
  }

  // Binary search to $1000 precision
  while (high - low > 1000) {
    const mid = (low + high) / 2;
    if (calculateWaterfall(mid, preferredRounds, ownershipPercent).employeePayout < targetPayout) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return high;
}

/**
 * Calculate future value of alternative investment using compound interest
 * Formula: FV = PV × (1 + r)^n
 */
export function calculateAlternativeInvestmentValue(
  principal: number,
  annualReturn: number,
  years: number
): number {
  return principal * Math.pow(1 + annualReturn, years);
}

/**
 * Calculate probability-weighted expected options value at a specific year
 *
 * Model assumptions:
 * - Startups typically don't exit before year 3
 * - Exit probability peaks around years 5-8
 * - Uses cumulative distribution for exit timing
 */
export function calculateOptionsExpectedValueAtYear(
  ownershipPercent: number,
  companyValuation: number,
  exerciseCost: number,
  year: number,
  scenarios: ExitScenario[] = DEFAULT_EXIT_SCENARIOS
): number {
  // Before year 3, very few exits occur
  if (year < 3) {
    return 0; // Options worth $0 until exit
  }

  // Cumulative exit probability: increases from year 3 to year 10
  // By year 10, assume most companies that will exit have done so
  const cumulativeExitProb = Math.min(1, (year - 2) / 8);

  // Calculate expected exit value using scenario probabilities
  const expectedExitValue = scenarios.reduce((sum, scenario) => {
    const exitValue = calculateExitValue(
      ownershipPercent,
      companyValuation,
      scenario.multiple
    );
    const profit = Math.max(0, exitValue - exerciseCost);
    return sum + scenario.probability * profit;
  }, 0);

  // Blend between no-exit ($0) and expected value based on timing probability
  return cumulativeExitProb * expectedExitValue;
}

/**
 * Generate opportunity cost comparison data over time
 */
export function calculateOpportunityCostComparison(
  exerciseCost: number,
  ownershipPercent: number,
  companyValuation: number,
  alternativeReturnRate: number,
  timeHorizonYears: number
): OpportunityCostResult {
  const dataPoints: OpportunityCostDataPoint[] = [];
  let breakEvenYear: number | null = null;

  for (let year = 0; year <= timeHorizonYears; year++) {
    const alternativeValue = calculateAlternativeInvestmentValue(
      exerciseCost,
      alternativeReturnRate,
      year
    );

    const optionsExpectedValue = calculateOptionsExpectedValueAtYear(
      ownershipPercent,
      companyValuation,
      exerciseCost,
      year
    );

    dataPoints.push({
      year,
      alternativeValue,
      optionsExpectedValue,
    });

    // Track first year options expected to exceed alternative net gain
    const alternativeGain = alternativeValue - exerciseCost;
    if (breakEvenYear === null && optionsExpectedValue > alternativeGain) {
      breakEvenYear = year;
    }
  }

  const finalPoint = dataPoints[dataPoints.length - 1];

  return {
    dataPoints,
    breakEvenYear,
    finalAlternativeValue: finalPoint.alternativeValue,
    finalOptionsExpectedValue: finalPoint.optionsExpectedValue,
  };
}

/**
 * Derive company stage from funding rounds
 * Uses the most recent (last) round to determine stage
 *
 * If no rounds: assume Seed (reasonable default for someone using this calculator)
 * Note: "Pre-Seed" would be more conservative but most users with options
 * are likely at least seed-stage
 *
 * Sources for stage definitions:
 * - SPDLoad Startup Failure Statistics 2025
 * - Embroker Startup Statistics
 */
export function deriveCompanyStage(fundingRounds: FundingRound[]): CompanyStage {
  if (fundingRounds.length === 0) {
    return 'Seed';
  }

  const lastRound = fundingRounds[fundingRounds.length - 1];
  const name = lastRound.name.toLowerCase();

  // Map round names to stages
  if (name.includes('series c') || name.includes('series d') || name.includes('d+')) {
    return 'Series C+';
  }
  if (name.includes('series b')) {
    return 'Series B';
  }
  if (name.includes('series a')) {
    return 'Series A';
  }
  if (name.includes('seed') || name.includes('pre-seed')) {
    return 'Seed';
  }

  // Default to Seed for unknown round names (bridge, extension, etc.)
  return 'Seed';
}

/**
 * Generate exit scenarios adjusted for company stage
 *
 * Earlier stages: higher failure rate, but if successful, higher upside potential
 * Later stages: lower failure rate, but returns more predictable/lower upside
 *
 * The adjustment works by:
 * 1. Setting failure probability based on stage (from STAGE_EXIT_ADJUSTMENTS)
 * 2. Redistributing the "saved" failure probability to success scenarios
 * 3. Weighting toward moderate outcomes for later stages (since unicorn potential reduced)
 *
 * Sources:
 * - SPDLoad Startup Failure Statistics 2025: Stage-specific failure rates
 * - YC Exit Data 2025: 93% of value from 8% of exits (unicorns)
 */
export function getStageAdjustedExitScenarios(
  stage: CompanyStage
): ExitScenario[] {
  const adjustment = STAGE_EXIT_ADJUSTMENTS[stage];
  const baseScenarios = DEFAULT_EXIT_SCENARIOS;

  // Calculate how much probability to redistribute from failure to success
  const baseFailure = baseScenarios[0].probability; // 0.75 (default failure rate)
  const targetFailure = adjustment.failureProb;
  const successBoost = baseFailure - targetFailure; // Positive if later stage (lower failure)

  // Track total probability to ensure it sums to 1.0
  let totalProb = 0;
  const adjustedScenarios = baseScenarios.map((scenario, index) => {
    if (index === 0) {
      // Failure scenario - use stage-specific rate
      totalProb += targetFailure;
      return { ...scenario, probability: targetFailure };
    }

    // For success scenarios, redistribute the saved failure probability
    // Weight toward moderate outcomes for later stages (unicorn potential lower)
    const isUnicorn = scenario.name === 'Unicorn' || scenario.name === 'Exceptional';

    // Calculate boost: unicorn scenarios get less boost at later stages
    const boost = isUnicorn
      ? successBoost * 0.1 * adjustment.unicornProb  // Small, stage-adjusted boost
      : successBoost * 0.225;  // Larger boost to moderate outcomes

    const newProb = scenario.probability + boost;
    totalProb += newProb;
    return { ...scenario, probability: newProb };
  });

  // Normalize to ensure probabilities sum to 1.0 (handle floating point errors)
  if (Math.abs(totalProb - 1.0) > 0.001) {
    const scale = 1.0 / totalProb;
    return adjustedScenarios.map(s => ({ ...s, probability: s.probability * scale }));
  }

  return adjustedScenarios;
}
