import { useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { JargonTerm } from '@/components/JargonTerm';
import { RefLink } from '@/components/RefLink';
import type { PreferredRound, WaterfallResult } from '@/types/options';
import {
  calculateWaterfall,
  formatCurrency,
} from '@/lib/calculations';
import {
  DEFAULT_EXIT_VALUATIONS,
  EXIT_VALUATION_SLIDER_CONFIG,
  type ExitValuationScenario,
} from '@/lib/defaults';
import { cn, useThrottledCallback } from '@/lib/utils';

interface ExitScenariosProps {
  ownershipPercent: number;
  companyValuation: number;
  exerciseCost: number;
  preferredRounds?: PreferredRound[];
}

interface ValuationScenarioCardProps {
  scenario: ExitValuationScenario;
  ownershipPercent: number;
  exerciseCost: number;
  companyValuation: number;
  waterfall?: WaterfallResult;
}

function formatValuation(value: number): string {
  if (value >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    return billions >= 10 ? `$${Math.round(billions)}B` : `$${billions.toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${Math.round(value / 1_000_000)}M`;
  }
  return formatCurrency(value);
}

function ValuationScenarioCard({
  scenario,
  ownershipPercent,
  exerciseCost,
  companyValuation,
  waterfall,
}: ValuationScenarioCardProps) {
  // Calculate payout based on absolute exit valuation
  const proRataPayout = (ownershipPercent / 100) * scenario.value;
  const payout = waterfall ? waterfall.employeePayout : proRataPayout;
  const profit = payout - exerciseCost;
  const profitVariant =
    profit > 0 ? 'positive' : profit < 0 ? 'negative' : 'neutral';

  // Calculate implied multiple from current valuation
  const impliedMultiple = companyValuation > 0 ? scenario.value / companyValuation : 0;

  // Show impact of liquidation preferences
  const hasPreferenceImpact = waterfall && waterfall.employeePayout < proRataPayout;

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded border p-2 text-center',
        profitVariant === 'positive' && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30',
        profitVariant === 'negative' && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30',
        profitVariant === 'neutral' && 'border-muted bg-muted/30'
      )}
    >
      <p className="text-[10px] font-medium text-muted-foreground">
        {scenario.name}
        {impliedMultiple > 0 && (
          <span className="text-[9px] opacity-60"> ({impliedMultiple.toFixed(1)}x)</span>
        )}
      </p>
      <p className="text-sm font-semibold">
        {formatCurrency(payout)}
      </p>
      <p
        className={cn(
          'text-xs',
          profitVariant === 'positive' && 'text-green-600',
          profitVariant === 'negative' && 'text-red-600',
          profitVariant === 'neutral' && 'text-muted-foreground'
        )}
      >
        {profit >= 0 ? '+' : ''}
        {formatCurrency(profit)}
      </p>
      {hasPreferenceImpact && (
        <p className="text-[9px] text-amber-600 dark:text-amber-400">
          -{formatCurrency(proRataPayout - waterfall.employeePayout)} pref
        </p>
      )}
    </div>
  );
}

export function ExitScenarios({
  ownershipPercent,
  companyValuation,
  exerciseCost,
  preferredRounds = [],
}: ExitScenariosProps) {
  const [customExitValuation, setCustomExitValuation] = useState<number>(2_000_000_000); // $2B default

  // Throttle slider changes to prevent recharts infinite loop with React 19
  const throttledSetCustomExitValuation = useThrottledCallback(
    useCallback((v: number) => setCustomExitValuation(v), []),
    50
  );

  const hasPreferred = preferredRounds.length > 0;

  // Calculate scenarios with optional waterfall
  const scenariosWithWaterfall = DEFAULT_EXIT_VALUATIONS.map((scenario) => {
    const waterfall = hasPreferred
      ? calculateWaterfall(scenario.value, preferredRounds, ownershipPercent)
      : undefined;
    return { scenario, waterfall };
  });

  // Custom scenario calculations
  const customProRataPayout = (ownershipPercent / 100) * customExitValuation;
  const customWaterfall = hasPreferred
    ? calculateWaterfall(customExitValuation, preferredRounds, ownershipPercent)
    : undefined;
  const customPayout = customWaterfall ? customWaterfall.employeePayout : customProRataPayout;
  const customProfit = customPayout - exerciseCost;
  const customImpliedMultiple = companyValuation > 0 ? customExitValuation / companyValuation : 0;
  const customHasPreferenceImpact = customWaterfall && customWaterfall.employeePayout < customProRataPayout;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          If Company Sells For...
          <RefLink refId="pitchbook-nvca" />
        </h3>
        {hasPreferred && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            With <JargonTerm termKey="liquidation-preference" className="text-amber-600 dark:text-amber-400 border-amber-600/50">liquidation preferences</JargonTerm>
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {scenariosWithWaterfall.map(({ scenario, waterfall }) => (
          <ValuationScenarioCard
            key={scenario.name}
            scenario={scenario}
            ownershipPercent={ownershipPercent}
            exerciseCost={exerciseCost}
            companyValuation={companyValuation}
            waterfall={waterfall}
          />
        ))}

        {/* Custom scenario */}
        <div
          className={cn(
            'flex flex-col items-center rounded border p-2 text-center',
            customProfit > 0 && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30',
            customProfit < 0 && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30',
            customProfit === 0 && 'border-muted bg-muted/30'
          )}
        >
          <p className="text-[10px] font-medium text-muted-foreground">
            {formatValuation(customExitValuation)}
            {customImpliedMultiple > 0 && (
              <span className="text-[9px] opacity-60"> ({customImpliedMultiple.toFixed(1)}x)</span>
            )}
          </p>
          <p className="text-sm font-semibold">
            {formatCurrency(customPayout)}
          </p>
          <p
            className={cn(
              'text-xs',
              customProfit > 0 && 'text-green-600',
              customProfit < 0 && 'text-red-600'
            )}
          >
            {customProfit >= 0 ? '+' : ''}
            {formatCurrency(customProfit)}
          </p>
          {customHasPreferenceImpact && (
            <p className="text-[9px] text-amber-600 dark:text-amber-400">
              -{formatCurrency(customProRataPayout - customWaterfall.employeePayout)} pref
            </p>
          )}
        </div>
      </div>

      {/* Custom exit valuation slider */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-[10px] text-muted-foreground shrink-0">Custom:</span>
        <Slider
          value={[customExitValuation]}
          onValueChange={([v]) => throttledSetCustomExitValuation(v)}
          min={EXIT_VALUATION_SLIDER_CONFIG.min}
          max={EXIT_VALUATION_SLIDER_CONFIG.max}
          step={EXIT_VALUATION_SLIDER_CONFIG.step}
          className="flex-1"
        />
        <span className="text-xs font-medium shrink-0 w-14 text-right">
          {formatValuation(customExitValuation)}
        </span>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Your {ownershipPercent.toFixed(4)}% ownership
        {hasPreferred && ' • Preferred shareholders paid first'}
      </p>
    </div>
  );
}
