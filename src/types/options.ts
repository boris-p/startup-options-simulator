// Types for the Options Exercise Calculator

export type OptionType = 'ISO' | 'NSO';

/**
 * Company funding stage, used to adjust exit probability estimates
 * Derived from the most recent funding round
 */
export type CompanyStage = 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C+';

export interface OptionsInput {
  numberOfOptions: number;
  strikePrice: number;
  currentFMV: number;
  companyValuation: number; // Last known valuation
  ownershipPercent: number; // Your ownership percentage
  optionType: OptionType;
  federalTaxBracket?: number; // Federal marginal tax rate (e.g., 0.32 for 32%)
  annualWages?: number; // Annual wages for FICA calculation (affects SS cap)
}

export interface DilutionRound {
  id: string;
  name: string;
  dilutionPercent: number;
}

export interface ExitScenario {
  name: string;
  multiple: number;
  probability: number; // For expected value calculation
}

export interface TaxCalculation {
  spread: number; // exerciseFMV - strikePrice (per share)
  spreadTotal: number; // spread × numberOfOptions
  optionType: OptionType;
  // ISO-specific
  amtIncome?: number; // Spread counts as AMT income
  estimatedAMT?: number; // Simplified: spreadTotal × 28%
  // NSO-specific
  ordinaryIncome?: number; // Spread is ordinary income
  ordinaryIncomeTax?: number; // spreadTotal × (taxBracket + FICA)
  ficaTax?: number; // FICA portion of NSO tax (may be reduced if SS capped)
  ssCapped?: boolean; // True if SS wage cap was hit
  // Combined
  estimatedTaxAtExercise: number; // Total estimated tax liability at exercise
}

export interface CalculatedResults {
  exerciseCost: number;
  currentValue: number;
  paperGain: number;
  paperGainPercent: number;
  breakEvenMultiple: number;
  ownershipAfterDilution: number;
  totalDilutionPercent: number;
  expectedValue: number;
  taxCalculation?: TaxCalculation;
}

export interface ExitScenarioResult {
  scenario: ExitScenario;
  exitValue: number;
  profit: number;
  roi: number;
}

// Preferred stock types for liquidation preference modeling
export type PreferredType = 'non-participating' | 'participating';

export interface PreferredRound {
  id: string;
  name: string; // "Series A", "Series B", etc.
  investedAmount: number; // Total $ invested in this round
  liquidationMultiple: number; // Usually 1x, sometimes 2x
  preferredType: PreferredType;
  ownershipPercent: number; // % of company this round owns
}

// Unified funding round combining dilution + liquidation preferences
export interface FundingRound {
  id: string;
  name: string; // "Seed", "Series A", etc.
  // Dilution modeling (also determines investor ownership for waterfall)
  dilutionPercent: number;
  // Liquidation preference
  amountRaised: number;
  // Advanced fields (hidden by default, use standard defaults)
  liquidationMultiple: number; // Usually 1x
  preferredType: PreferredType; // Usually non-participating
}

export interface WaterfallResult {
  exitValue: number;
  preferredPayout: number; // What preferred shareholders get
  commonPool: number; // What's left for common shareholders
  employeeOwnershipOfCommon: number; // Employee's % of common pool
  employeePayout: number; // Final employee payout after waterfall
}

export interface CalculatorState {
  inputs: OptionsInput;
  dilutionRounds: DilutionRound[];
  preferredRounds: PreferredRound[];
  customExitMultiple: number;
}

export interface OpportunityCostDataPoint {
  year: number;
  alternativeValue: number;
  optionsExpectedValue: number;
}

export interface OpportunityCostResult {
  dataPoints: OpportunityCostDataPoint[];
  breakEvenYear: number | null;
  finalAlternativeValue: number;
  finalOptionsExpectedValue: number;
}
