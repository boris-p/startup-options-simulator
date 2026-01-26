import { useMemo } from 'react';
import type { CalculatedResults, PreferredRound } from '@/types/options';
import {
  formatCurrency,
  formatPercent,
  formatOwnership,
} from '@/lib/calculations';
import { DEFAULT_EXIT_SCENARIOS } from '@/lib/defaults';
import { PayoutChart } from './PayoutChart';
import { JargonTerm } from './JargonTerm';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ResultsPanelProps {
  results: CalculatedResults;
  ownershipPercent: number;
  companyValuation: number;
  preferredRounds?: PreferredRound[];
  timeHorizon: number;
  onTimeHorizonChange: (years: number) => void;
  alternativeRate: number;
  customExitValuation: number;
  onCustomExitValuationChange: (v: number) => void;
  includeOpportunityCost: boolean;
  onIncludeOpportunityCostChange: (v: boolean) => void;
  includeTaxInCost: boolean;
  onIncludeTaxInCostChange: (v: boolean) => void;
  showFormula: boolean;
  onShowFormulaChange: (v: boolean) => void;
}

export function ResultsPanel({
  results,
  ownershipPercent,
  companyValuation,
  preferredRounds = [],
  timeHorizon,
  onTimeHorizonChange,
  alternativeRate,
  customExitValuation,
  onCustomExitValuationChange,
  includeOpportunityCost,
  onIncludeOpportunityCostChange,
  includeTaxInCost,
  onIncludeTaxInCostChange,
  showFormula,
  onShowFormulaChange,
}: ResultsPanelProps) {
  const paperGainVariant =
    results.paperGain > 0 ? 'positive' : results.paperGain < 0 ? 'negative' : 'neutral';

  const expectedValueVariant =
    results.expectedValue > 0
      ? 'positive'
      : results.expectedValue < 0
        ? 'negative'
        : 'neutral';

  // Calculate scenario breakdown for Expected Value tooltip
  const scenarioBreakdown = useMemo(() => {
    return DEFAULT_EXIT_SCENARIOS.map((scenario) => {
      const exitValue = (ownershipPercent / 100) * companyValuation * scenario.multiple;
      const weighted = scenario.probability * exitValue;
      return {
        name: scenario.name,
        probability: scenario.probability,
        multiple: scenario.multiple,
        exitValue,
        weighted,
      };
    });
  }, [ownershipPercent, companyValuation]);

  const totalWeighted = useMemo(
    () => scenarioBreakdown.reduce((sum, s) => sum + s.weighted, 0),
    [scenarioBreakdown]
  );

  // Format valuation for display (e.g., $50M)
  const formatValuation = (value: number) => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(0)}M`;
    }
    return formatCurrency(value);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">Your Numbers</h2>

      {/* All stats in one row */}
      <div className="grid grid-cols-4 gap-3 items-start">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide h-4"><JargonTerm termKey="exercise-cost">Cost</JargonTerm></p>
          <p className="text-base font-semibold">{formatCurrency(results.exerciseCost)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide h-4"><JargonTerm termKey="current-value">Value</JargonTerm></p>
          <p className="text-base font-semibold">{formatCurrency(results.currentValue)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide h-4"><JargonTerm termKey="paper-gain">Gain</JargonTerm></p>
          <p className={cn(
            'text-base font-semibold',
            paperGainVariant === 'positive' && 'text-green-600',
            paperGainVariant === 'negative' && 'text-red-600'
          )}>
            {formatCurrency(results.paperGain)}
          </p>
          <p className={cn(
            'text-xs',
            paperGainVariant === 'positive' && 'text-green-600',
            paperGainVariant === 'negative' && 'text-red-600'
          )}>
            {formatPercent(results.paperGainPercent)}
          </p>
        </div>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide h-4 cursor-help border-b border-dotted border-muted-foreground/50">
                Expected Value
              </p>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-75">
              <p className="font-medium mb-1">Probability-weighted outcome</p>
              <p className="text-[10px] text-muted-foreground mb-1.5">
                {ownershipPercent.toFixed(3)}% of {formatValuation(companyValuation)} (derived from options × FMV ÷ ownership)
              </p>
              <div className="text-muted-foreground space-y-0.5 text-[10px]">
                {scenarioBreakdown.map((s) => (
                  <div key={s.name} className="flex justify-between gap-2">
                    <span>{(s.probability * 100).toFixed(1)}% × {s.multiple}x exit</span>
                    <span>{formatCurrency(s.weighted)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 pt-1.5 border-t text-[10px]">
                <div className="flex justify-between">
                  <span>Weighted total</span>
                  <span>{formatCurrency(totalWeighted)}</span>
                </div>
                <div className="flex justify-between">
                  <span>− Exercise cost</span>
                  <span>{formatCurrency(results.exerciseCost)}</span>
                </div>
                <div className="flex justify-between font-medium text-foreground mt-0.5">
                  <span>Expected Value</span>
                  <span>{formatCurrency(results.expectedValue)}</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
          <p className={cn(
            'text-base font-semibold',
            expectedValueVariant === 'positive' && 'text-green-600',
            expectedValueVariant === 'negative' && 'text-red-600'
          )}>
            {formatCurrency(results.expectedValue)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="pt-2 border-t">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Profit by <JargonTerm termKey="exit-valuation">Exit Valuation</JargonTerm></p>
        <PayoutChart
          ownershipPercent={ownershipPercent}
          companyValuation={companyValuation}
          exerciseCost={results.exerciseCost}
          estimatedTax={results.taxCalculation?.estimatedTaxAtExercise ?? 0}
          preferredRounds={preferredRounds}
          timeHorizon={timeHorizon}
          onTimeHorizonChange={onTimeHorizonChange}
          alternativeRate={alternativeRate}
          customExitValuation={customExitValuation}
          onCustomExitValuationChange={onCustomExitValuationChange}
          includeOpportunityCost={includeOpportunityCost}
          onIncludeOpportunityCostChange={onIncludeOpportunityCostChange}
          includeTaxInCost={includeTaxInCost}
          onIncludeTaxInCostChange={onIncludeTaxInCostChange}
          showFormula={showFormula}
          onShowFormulaChange={onShowFormulaChange}
        />
      </div>

      {/* Dilution warning */}
      {results.totalDilutionPercent > 0 && (
        <div className="rounded border border-amber-200 bg-amber-50 p-2 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <span className="font-medium">After <JargonTerm termKey="dilution" className="text-amber-700 dark:text-amber-300 border-amber-700/50 dark:border-amber-300/50">Dilution</JargonTerm>:</span>{' '}
            {formatOwnership(results.ownershipAfterDilution)}{' '}
            <span className="text-amber-600">(-{results.totalDilutionPercent.toFixed(1)}%)</span>
          </p>
        </div>
      )}
    </div>
  );
}
