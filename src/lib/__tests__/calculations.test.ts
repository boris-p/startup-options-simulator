import { describe, it, expect } from 'vitest';
import {
  deriveValuationFromOwnership,
  calculateExerciseCost,
  calculateCurrentValue,
  calculatePaperGain,
  calculatePaperGainPercent,
  calculateBreakEvenMultiple,
  calculateOwnershipAfterDilution,
  calculateTotalDilution,
  calculateExitValue,
  calculateProfit,
  calculateROI,
  calculateExpectedValue,
  calculateAllResults,
  calculateExitScenarioResult,
  calculateAllExitScenarios,
  formatCurrency,
  formatCurrencyFull,
  formatPercent,
  formatOwnership,
  formatMultiple,
} from '../calculations';
import type { DilutionRound, ExitScenario, OptionsInput } from '@/types/options';

describe('deriveValuationFromOwnership', () => {
  it('derives valuation correctly', () => {
    // 10,000 options × $5 FMV = $50,000 value
    // If that's 0.1% ownership → Company = $50M
    expect(deriveValuationFromOwnership(10000, 5, 0.1)).toBe(50_000_000);
  });

  it('handles 1% ownership', () => {
    // 10,000 options × $10 FMV = $100,000 value
    // If that's 1% ownership → Company = $10M
    expect(deriveValuationFromOwnership(10000, 10, 1)).toBe(10_000_000);
  });

  it('handles zero ownership', () => {
    expect(deriveValuationFromOwnership(10000, 5, 0)).toBe(0);
  });

  it('handles zero options', () => {
    expect(deriveValuationFromOwnership(0, 5, 0.1)).toBe(0);
  });

  it('handles negative ownership', () => {
    expect(deriveValuationFromOwnership(10000, 5, -0.1)).toBe(0);
  });
});

describe('calculateExerciseCost', () => {
  it('calculates basic exercise cost', () => {
    expect(calculateExerciseCost(10000, 1.5)).toBe(15000);
  });

  it('handles zero options', () => {
    expect(calculateExerciseCost(0, 1.5)).toBe(0);
  });

  it('handles large numbers', () => {
    expect(calculateExerciseCost(1000000, 50)).toBe(50000000);
  });

  it('handles decimal strike prices', () => {
    expect(calculateExerciseCost(1000, 0.25)).toBe(250);
  });
});

describe('calculateCurrentValue', () => {
  it('calculates basic current value', () => {
    expect(calculateCurrentValue(10000, 8)).toBe(80000);
  });

  it('handles zero FMV', () => {
    expect(calculateCurrentValue(10000, 0)).toBe(0);
  });

  it('handles zero options', () => {
    expect(calculateCurrentValue(0, 8)).toBe(0);
  });
});

describe('calculatePaperGain', () => {
  it('calculates positive paper gain', () => {
    expect(calculatePaperGain(80000, 15000)).toBe(65000);
  });

  it('calculates negative paper gain (underwater)', () => {
    expect(calculatePaperGain(10000, 15000)).toBe(-5000);
  });

  it('calculates zero paper gain', () => {
    expect(calculatePaperGain(15000, 15000)).toBe(0);
  });
});

describe('calculatePaperGainPercent', () => {
  it('calculates positive percentage', () => {
    expect(calculatePaperGainPercent(65000, 15000)).toBeCloseTo(433.33, 1);
  });

  it('calculates negative percentage', () => {
    expect(calculatePaperGainPercent(-5000, 15000)).toBeCloseTo(-33.33, 1);
  });

  it('handles zero exercise cost', () => {
    expect(calculatePaperGainPercent(1000, 0)).toBe(0);
  });
});

describe('calculateBreakEvenMultiple', () => {
  it('calculates break-even below 1x (in the money)', () => {
    expect(calculateBreakEvenMultiple(1.5, 8)).toBeCloseTo(0.1875);
  });

  it('calculates break-even above 1x (underwater)', () => {
    expect(calculateBreakEvenMultiple(8, 2)).toBe(4);
  });

  it('calculates 1x break-even (at the money)', () => {
    expect(calculateBreakEvenMultiple(5, 5)).toBe(1);
  });

  it('handles zero FMV', () => {
    expect(calculateBreakEvenMultiple(5, 0)).toBe(Infinity);
  });
});

describe('calculateOwnershipAfterDilution', () => {
  it('calculates single round dilution', () => {
    const rounds: DilutionRound[] = [
      { id: '1', name: 'Series A', dilutionPercent: 20 },
    ];
    expect(calculateOwnershipAfterDilution(0.1, rounds)).toBeCloseTo(0.08);
  });

  it('calculates multiple round dilution (compound)', () => {
    const rounds: DilutionRound[] = [
      { id: '1', name: 'Series A', dilutionPercent: 20 },
      { id: '2', name: 'Series B', dilutionPercent: 15 },
    ];
    // 0.1 * 0.8 * 0.85 = 0.068
    expect(calculateOwnershipAfterDilution(0.1, rounds)).toBeCloseTo(0.068);
  });

  it('handles 100% dilution', () => {
    const rounds: DilutionRound[] = [
      { id: '1', name: 'Round', dilutionPercent: 100 },
    ];
    expect(calculateOwnershipAfterDilution(0.1, rounds)).toBe(0);
  });

  it('handles no dilution rounds', () => {
    expect(calculateOwnershipAfterDilution(0.1, [])).toBe(0.1);
  });

  it('handles zero initial ownership', () => {
    const rounds: DilutionRound[] = [
      { id: '1', name: 'Series A', dilutionPercent: 20 },
    ];
    expect(calculateOwnershipAfterDilution(0, rounds)).toBe(0);
  });
});

describe('calculateTotalDilution', () => {
  it('calculates single round total dilution', () => {
    const rounds: DilutionRound[] = [
      { id: '1', name: 'Series A', dilutionPercent: 20 },
    ];
    expect(calculateTotalDilution(rounds)).toBeCloseTo(20);
  });

  it('calculates compound dilution percentage', () => {
    const rounds: DilutionRound[] = [
      { id: '1', name: 'Series A', dilutionPercent: 20 },
      { id: '2', name: 'Series B', dilutionPercent: 15 },
    ];
    // Total retention = 0.8 * 0.85 = 0.68, so dilution = 32%
    expect(calculateTotalDilution(rounds)).toBeCloseTo(32);
  });

  it('handles no rounds', () => {
    expect(calculateTotalDilution([])).toBe(0);
  });
});

describe('calculateExitValue', () => {
  it('calculates exit value at 1x', () => {
    // 0.1% of $50M at 1x = $50,000
    expect(calculateExitValue(0.1, 50_000_000, 1)).toBe(50000);
  });

  it('calculates exit value at 10x', () => {
    // 0.1% of $50M at 10x = $500,000
    expect(calculateExitValue(0.1, 50_000_000, 10)).toBe(500000);
  });

  it('handles 0x (failure)', () => {
    expect(calculateExitValue(0.1, 50_000_000, 0)).toBe(0);
  });

  it('handles zero ownership', () => {
    expect(calculateExitValue(0, 50_000_000, 10)).toBe(0);
  });
});

describe('calculateProfit', () => {
  it('calculates positive profit', () => {
    expect(calculateProfit(100000, 15000)).toBe(85000);
  });

  it('calculates negative profit (loss)', () => {
    expect(calculateProfit(10000, 15000)).toBe(-5000);
  });

  it('calculates zero profit at exit 0', () => {
    expect(calculateProfit(0, 15000)).toBe(-15000);
  });
});

describe('calculateROI', () => {
  it('calculates positive ROI', () => {
    expect(calculateROI(85000, 15000)).toBeCloseTo(566.67, 1);
  });

  it('calculates negative ROI', () => {
    expect(calculateROI(-15000, 15000)).toBe(-100);
  });

  it('handles zero exercise cost with profit', () => {
    expect(calculateROI(1000, 0)).toBe(Infinity);
  });

  it('handles zero exercise cost with no profit', () => {
    expect(calculateROI(0, 0)).toBe(0);
  });
});

describe('calculateExpectedValue', () => {
  it('calculates expected value with custom scenarios', () => {
    const scenarios: ExitScenario[] = [
      { name: 'Fail', multiple: 0, probability: 0.5 },
      { name: 'Success', multiple: 10, probability: 0.5 },
    ];
    // 0.1% of $50M: at 0x = $0, at 10x = $500K
    // EV = 0.5 * 0 + 0.5 * 500000 = 250000
    // Net = 250000 - 15000 = 235000
    expect(calculateExpectedValue(0.1, 50_000_000, 15000, scenarios)).toBe(235000);
  });

  it('calculates negative expected value', () => {
    const scenarios: ExitScenario[] = [
      { name: 'Fail', multiple: 0, probability: 1 },
    ];
    expect(calculateExpectedValue(0.1, 50_000_000, 15000, scenarios)).toBe(-15000);
  });

  it('handles zero ownership', () => {
    const scenarios: ExitScenario[] = [
      { name: 'Success', multiple: 10, probability: 1 },
    ];
    expect(calculateExpectedValue(0, 50_000_000, 15000, scenarios)).toBe(-15000);
  });
});

describe('calculateAllResults', () => {
  it('calculates all results correctly', () => {
    const inputs: OptionsInput = {
      numberOfOptions: 10000,
      strikePrice: 1.5,
      currentFMV: 8,
      companyValuation: 50_000_000,
      ownershipPercent: 0.1,
      optionType: 'ISO',
    };
    const dilutionRounds: DilutionRound[] = [
      { id: '1', name: 'Series A', dilutionPercent: 20 },
    ];

    const results = calculateAllResults(inputs, dilutionRounds);

    expect(results.exerciseCost).toBe(15000);
    expect(results.currentValue).toBe(80000);
    expect(results.paperGain).toBe(65000);
    expect(results.paperGainPercent).toBeCloseTo(433.33, 1);
    expect(results.breakEvenMultiple).toBeCloseTo(0.1875);
    expect(results.ownershipAfterDilution).toBeCloseTo(0.08);
    expect(results.totalDilutionPercent).toBeCloseTo(20);
  });

  it('handles no dilution', () => {
    const inputs: OptionsInput = {
      numberOfOptions: 10000,
      strikePrice: 1,
      currentFMV: 5,
      companyValuation: 50_000_000,
      ownershipPercent: 0.1,
      optionType: 'ISO',
    };

    const results = calculateAllResults(inputs, []);

    expect(results.ownershipAfterDilution).toBe(0.1);
    expect(results.totalDilutionPercent).toBe(0);
  });
});

describe('calculateExitScenarioResult', () => {
  it('calculates scenario result correctly', () => {
    const scenario: ExitScenario = { name: 'Strong', multiple: 5, probability: 0.05 };
    const result = calculateExitScenarioResult(scenario, 0.1, 50_000_000, 15000);

    // 0.1% of $50M at 5x = $250,000
    expect(result.exitValue).toBe(250000);
    expect(result.profit).toBe(235000);
    expect(result.roi).toBeCloseTo(1566.67, 1);
    expect(result.scenario).toBe(scenario);
  });

  it('handles failure scenario', () => {
    const scenario: ExitScenario = { name: 'Failure', multiple: 0, probability: 0.75 };
    const result = calculateExitScenarioResult(scenario, 0.1, 50_000_000, 15000);

    expect(result.exitValue).toBe(0);
    expect(result.profit).toBe(-15000);
    expect(result.roi).toBe(-100);
  });
});

describe('calculateAllExitScenarios', () => {
  it('calculates all scenarios', () => {
    const scenarios: ExitScenario[] = [
      { name: 'Fail', multiple: 0, probability: 0.75 },
      { name: '2x', multiple: 2, probability: 0.10 },
    ];
    const results = calculateAllExitScenarios(scenarios, 0.1, 50_000_000, 15000);

    expect(results).toHaveLength(2);
    expect(results[0].scenario.name).toBe('Fail');
    expect(results[1].scenario.name).toBe('2x');
  });
});

describe('formatCurrency', () => {
  it('formats millions', () => {
    expect(formatCurrency(1500000)).toBe('$1.5M');
  });

  it('formats thousands', () => {
    expect(formatCurrency(15000)).toBe('$15.0K');
  });

  it('formats small amounts', () => {
    expect(formatCurrency(500)).toBe('$500');
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-15000)).toBe('$-15.0K');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });
});

describe('formatCurrencyFull', () => {
  it('formats with full precision', () => {
    expect(formatCurrencyFull(15000)).toBe('$15,000');
  });

  it('formats large numbers', () => {
    expect(formatCurrencyFull(1500000)).toBe('$1,500,000');
  });

  it('formats negative numbers', () => {
    expect(formatCurrencyFull(-15000)).toBe('-$15,000');
  });
});

describe('formatPercent', () => {
  it('formats positive percentage with sign', () => {
    expect(formatPercent(433.33)).toBe('+433.3%');
  });

  it('formats negative percentage', () => {
    expect(formatPercent(-33.33)).toBe('-33.3%');
  });

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('+0.0%');
  });

  it('handles custom decimals', () => {
    expect(formatPercent(433.333, 2)).toBe('+433.33%');
  });

  it('handles infinity', () => {
    expect(formatPercent(Infinity)).toBe('—');
  });
});

describe('formatOwnership', () => {
  it('formats tiny ownership with 4 decimals', () => {
    expect(formatOwnership(0.0012)).toBe('0.0012%');
  });

  it('formats small ownership with 3 decimals', () => {
    expect(formatOwnership(0.123)).toBe('0.123%');
  });

  it('formats larger ownership with 2 decimals', () => {
    expect(formatOwnership(5.5)).toBe('5.50%');
  });
});

describe('formatMultiple', () => {
  it('formats normal multiple', () => {
    expect(formatMultiple(1.5)).toBe('1.50x');
  });

  it('formats whole number multiple', () => {
    expect(formatMultiple(10)).toBe('10.00x');
  });

  it('formats small multiple', () => {
    expect(formatMultiple(0.19)).toBe('0.19x');
  });

  it('handles infinity', () => {
    expect(formatMultiple(Infinity)).toBe('—');
  });
});
