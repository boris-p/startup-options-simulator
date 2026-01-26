import { useMemo, useDeferredValue, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { JargonTerm } from '@/components/JargonTerm';
import {
  calculateOpportunityCostComparison,
  formatCurrency,
  findExitForTargetPayout,
} from '@/lib/calculations';
import type { PreferredRound } from '@/types/options';
import { OPPORTUNITY_COST_SLIDER_CONFIG } from '@/lib/defaults';
import { useThrottledCallback } from '@/lib/utils';

interface OpportunityCostProps {
  exerciseCost: number;
  estimatedTax: number;
  includeTaxInCost: boolean;
  ownershipPercent: number;
  companyValuation: number;
  timeHorizon: number;
  alternativeRate: number;
  onAlternativeRateChange: (rate: number) => void;
  preferredRounds: PreferredRound[];
}

const CHART_MARGIN = { top: 5, right: 5, left: 0, bottom: 0 };
const AXIS_TICK = { fontSize: 10 };
const TOOLTIP_STYLE = {
  fontSize: 11,
  borderRadius: 6,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--background))',
};

export function OpportunityCost({
  exerciseCost,
  estimatedTax,
  includeTaxInCost,
  ownershipPercent,
  companyValuation,
  timeHorizon,
  alternativeRate,
  onAlternativeRateChange,
  preferredRounds,
}: OpportunityCostProps) {
  // Throttle slider changes to prevent recharts infinite loop with React 19
  const throttledSetAlternativeRate = useThrottledCallback(
    useCallback((v: number) => onAlternativeRateChange(v), [onAlternativeRateChange]),
    50
  );

  // Calculate effective cost (exercise cost + tax if included)
  const effectiveCost = includeTaxInCost ? exerciseCost + estimatedTax : exerciseCost;

  const comparisonData = useMemo(
    () =>
      calculateOpportunityCostComparison(
        effectiveCost,
        ownershipPercent,
        companyValuation,
        alternativeRate,
        timeHorizon
      ),
    [effectiveCost, ownershipPercent, companyValuation, alternativeRate, timeHorizon]
  );

  // Defer chart data to prevent recharts infinite loop with React 19
  const deferredData = useDeferredValue(comparisonData.dataPoints);
  const deferredEffectiveCost = useDeferredValue(effectiveCost);

  const tickFormatter = useCallback((v: number) => formatCurrency(v), []);
  const tooltipFormatter = useCallback(
    (value: number | undefined) => formatCurrency(value ?? 0),
    []
  );

  // Calculate what exit valuation needed to beat index fund
  // Uses binary search to account for liquidation preferences
  const exitNeededToBeatIndex = useMemo(() => {
    if (ownershipPercent <= 0) return 0;
    const targetPayout = comparisonData.finalAlternativeValue;
    return findExitForTargetPayout(targetPayout, preferredRounds, ownershipPercent);
  }, [comparisonData.finalAlternativeValue, ownershipPercent, preferredRounds]);

  const formatExitValuation = (value: number) => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `$${Math.round(value / 1_000_000)}M`;
    }
    return formatCurrency(value);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">
        Alternative Investment
      </h3>

      <p className="text-[10px] text-muted-foreground">
        If you invested {formatCurrency(effectiveCost)}{includeTaxInCost && ' (cost + tax)'} in an{' '}
        <JargonTerm termKey="sp500-returns">S&P 500 index fund</JargonTerm>{' '}
        instead
      </p>

      {/* Input controls */}
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Alternative Return Rate
        </Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[alternativeRate]}
            onValueChange={([v]) => throttledSetAlternativeRate(v)}
            min={OPPORTUNITY_COST_SLIDER_CONFIG.alternativeReturnRate.min}
            max={OPPORTUNITY_COST_SLIDER_CONFIG.alternativeReturnRate.max}
            step={OPPORTUNITY_COST_SLIDER_CONFIG.alternativeReturnRate.step}
            className="flex-1"
          />
          <Input
            type="number"
            value={Math.round(alternativeRate * 100)}
            onChange={(e) => {
              const val = parseFloat(e.target.value) / 100;
              if (!isNaN(val) && val >= 0.01 && val <= 0.2) {
                onAlternativeRateChange(val);
              }
            }}
            className="w-14 h-7 text-xs text-center px-1"
            min={1}
            max={20}
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={deferredData} margin={CHART_MARGIN}>
            <XAxis
              dataKey="year"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}yr`}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={tickFormatter}
              width={55}
            />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={TOOLTIP_STYLE}
            />
            <ReferenceLine
              y={deferredEffectiveCost}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            <Line
              type="monotone"
              dataKey="alternativeValue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Index Fund"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded border p-2">
          <p className="text-[10px] text-muted-foreground uppercase">
            Principal
          </p>
          <p className="text-sm font-semibold">
            {formatCurrency(effectiveCost)}
          </p>
        </div>
        <div className="rounded border p-2">
          <p className="text-[10px] text-muted-foreground uppercase">
            Index at {timeHorizon}yr
          </p>
          <p className="text-sm font-semibold text-blue-600">
            {formatCurrency(comparisonData.finalAlternativeValue)}
          </p>
        </div>
      </div>

      {/* Key insight - what exit do you need? */}
      <div className="rounded bg-muted/50 p-2 text-xs">
        <p className="font-medium mb-1">To beat the index fund at {timeHorizon} years:</p>
        <p className="text-muted-foreground">
          Company needs to exit at{' '}
          <span className="font-semibold text-foreground">
            {formatExitValuation(exitNeededToBeatIndex)}
          </span>{' '}
          or higher for your options to be worth more than{' '}
          <span className="text-blue-600">
            {formatCurrency(comparisonData.finalAlternativeValue)}
          </span>
          {' '}(what {formatCurrency(effectiveCost)}{includeTaxInCost && ' cost + tax'} would grow to in an index fund).
        </p>
      </div>
    </div>
  );
}
