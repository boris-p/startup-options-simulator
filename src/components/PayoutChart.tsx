import { useMemo, useCallback, useDeferredValue } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  ReferenceDot,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, calculateWaterfall, findExitForTargetPayout } from "@/lib/calculations";
import {
  EXIT_VALUATION_SLIDER_CONFIG,
  OPPORTUNITY_COST_SLIDER_CONFIG,
} from "@/lib/defaults";
import { cn, useThrottledCallback } from "@/lib/utils";
import type { PreferredRound } from "@/types/options";
import { JargonTerm } from "./JargonTerm";

interface PayoutChartProps {
  ownershipPercent: number;
  companyValuation: number;
  exerciseCost: number;
  estimatedTax: number;
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

// Static objects to avoid recreating on every render
const CHART_MARGIN = { top: 5, right: 10, left: 0, bottom: 0 };
const AXIS_TICK = { fontSize: 10 };
const TOOLTIP_STYLE = {
  fontSize: 11,
  borderRadius: 6,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--background))",
};

// Exit valuations to plot (in billions) - using log scale X-axis
// Start at 0.01 ($10M) since log(0) is undefined
const EXIT_VALUATIONS_BILLIONS = [
  0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 32,
];

// Key exit valuations to highlight with dots (in billions)
const HIGHLIGHTED_EXIT_BILLIONS = new Set([0.05, 0.1, 0.5, 1, 5, 10, 32]);

function formatExitLabel(valueInBillions: number): string {
  if (valueInBillions <= 0) return "$0";
  if (valueInBillions < 0.1) return `$${Math.round(valueInBillions * 1000)}M`;
  if (valueInBillions < 1) return `$${(valueInBillions * 1000).toFixed(0)}M`;
  return `$${valueInBillions}B`;
}

function formatValuation(value: number): string {
  if (value >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    return billions >= 10
      ? `$${Math.round(billions)}B`
      : `$${billions.toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${Math.round(value / 1_000_000)}M`;
  }
  return formatCurrency(value);
}

// Logarithmic slider helpers
const LOG_MIN = Math.log(EXIT_VALUATION_SLIDER_CONFIG.min);
const LOG_MAX = Math.log(EXIT_VALUATION_SLIDER_CONFIG.max);

// Convert actual value to slider position (0-100)
function valueToSlider(value: number): number {
  const clamped = Math.max(
    EXIT_VALUATION_SLIDER_CONFIG.min,
    Math.min(EXIT_VALUATION_SLIDER_CONFIG.max, value),
  );
  return ((Math.log(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
}

// Convert slider position (0-100) to actual value
function sliderToValue(sliderPos: number): number {
  const logValue = LOG_MIN + (sliderPos / 100) * (LOG_MAX - LOG_MIN);
  return Math.round(Math.exp(logValue) / 1_000_000) * 1_000_000; // Round to nearest million
}

export function PayoutChart({
  ownershipPercent,
  companyValuation,
  exerciseCost,
  estimatedTax,
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
}: PayoutChartProps) {
  const hasPreferred = preferredRounds.length > 0;

  // Use lower throttle for smoother slider movement
  const throttledSetCustomExit = useThrottledCallback(
    useCallback((v: number) => onCustomExitValuationChange(v), [onCustomExitValuationChange]),
    16, // ~60fps for smooth animation
  );
  const throttledSetTimeHorizon = useThrottledCallback(
    useCallback((v: number) => onTimeHorizonChange(v), [onTimeHorizonChange]),
    50,
  );

  // Defer custom exit for chart rendering
  const deferredCustomExitValuation = useDeferredValue(customExitValuation);

  // Generate data points for exit valuations - now using numeric X-axis (exitBillions)
  const rawData = useMemo(
    () =>
      EXIT_VALUATIONS_BILLIONS.map((exitBillions) => {
        const exitValuation = exitBillions * 1_000_000_000;
        const exitValue = (ownershipPercent / 100) * exitValuation;

        // Calculate payout after liquidation preferences if applicable
        let payoutAfterPref = exitValue;
        if (hasPreferred && exitValuation > 0) {
          const waterfall = calculateWaterfall(
            exitValuation,
            preferredRounds,
            ownershipPercent,
          );
          payoutAfterPref = waterfall.employeePayout;
        }

        // Calculate profit (payout - exercise cost)
        const profit = exitValue - exerciseCost;
        const profitAfterPref = payoutAfterPref - exerciseCost;

        return {
          exitBillions, // Numeric X-axis value
          exitLabel: formatExitLabel(exitBillions),
          exitValuation,
          payout: Math.max(0, exitValue),
          payoutAfterPref: Math.max(0, payoutAfterPref),
          profit,
          profitAfterPref,
          isHighlighted: HIGHLIGHTED_EXIT_BILLIONS.has(exitBillions),
        };
      }),
    [ownershipPercent, exerciseCost, hasPreferred, preferredRounds],
  );

  // Defer chart data updates to break synchronous update cycles with recharts 3.x
  const data = useDeferredValue(rawData);
  const deferredExerciseCost = useDeferredValue(exerciseCost);

  // Find break-even exit valuation (accounts for liquidation preferences)
  const rawBreakEvenValuation = useMemo(() => {
    if (ownershipPercent <= 0) return 0;
    return findExitForTargetPayout(exerciseCost, preferredRounds, ownershipPercent);
  }, [exerciseCost, ownershipPercent, preferredRounds]);
  const breakEvenValuation = useDeferredValue(rawBreakEvenValuation);

  // Format break-even for display
  const breakEvenDisplay = useMemo(() => {
    if (breakEvenValuation >= 1_000_000_000) {
      return `$${(breakEvenValuation / 1_000_000_000).toFixed(1)}B`;
    }
    if (breakEvenValuation >= 1_000_000) {
      return `$${(breakEvenValuation / 1_000_000).toFixed(0)}M`;
    }
    return formatCurrency(breakEvenValuation);
  }, [breakEvenValuation]);

  // Calculate Y-axis domain to include negative values (profit-based)
  const yDomain = useMemo(() => {
    const profits = data.map((d) =>
      hasPreferred ? d.profitAfterPref : d.profit,
    );
    const minProfit = Math.min(...profits);
    const maxProfit = Math.max(...profits);

    // Include 0 line, and add padding
    const paddedMin = Math.min(0, minProfit * 1.1);
    const paddedMax = Math.max(0, maxProfit * 1.1);

    // Round to nice numbers
    const magnitude = Math.pow(
      10,
      Math.floor(Math.log10(Math.abs(paddedMax - paddedMin) || 1)),
    );
    const roundedMin = Math.floor(paddedMin / magnitude) * magnitude;
    const roundedMax = Math.ceil(paddedMax / magnitude) * magnitude;

    return [roundedMin, roundedMax];
  }, [data, hasPreferred]);

  // Calculate custom exit payout and profit
  const customPayout = useMemo(() => {
    const proRata = (ownershipPercent / 100) * deferredCustomExitValuation;
    if (hasPreferred && deferredCustomExitValuation > 0) {
      const waterfall = calculateWaterfall(
        deferredCustomExitValuation,
        preferredRounds,
        ownershipPercent,
      );
      return waterfall.employeePayout;
    }
    return proRata;
  }, [
    deferredCustomExitValuation,
    ownershipPercent,
    hasPreferred,
    preferredRounds,
  ]);

  const customProfit = customPayout - deferredExerciseCost;
  const customExitBillions = deferredCustomExitValuation / 1_000_000_000;
  const customImpliedMultiple =
    companyValuation > 0 ? customExitValuation / companyValuation : 0;

  // Calculate effective cost (exercise cost + tax if included)
  const effectiveCost = includeTaxInCost
    ? deferredExerciseCost + estimatedTax
    : deferredExerciseCost;

  // Calculate what effective cost would grow to in index fund over time horizon
  const indexFundValue = useMemo(() => {
    return effectiveCost * Math.pow(1 + alternativeRate, timeHorizon);
  }, [effectiveCost, alternativeRate, timeHorizon]);

  // Determine if options beat index fund
  const optionsBeatIndex = customPayout > indexFundValue;

  // Memoize callback functions to prevent recharts re-render issues
  const xTickFormatter = useCallback(
    (value: number) => formatExitLabel(value),
    [],
  );
  const yTickFormatter = useCallback((v: number) => formatCurrency(v), []);
  const tooltipFormatter = useCallback(
    (value: number | undefined) => {
      return [formatCurrency(value ?? 0), "Profit"];
    },
    [],
  );
  const labelFormatter = useCallback((value: unknown) => {
    const numValue = typeof value === "number" ? value : 0;
    return `Exit: ${formatExitLabel(numValue)}`;
  }, []);

  return (
    <div className="space-y-3">
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={CHART_MARGIN}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lossGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="prefGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(45 93% 47%)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(45 93% 47%)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="exitBillions"
              type="number"
              scale="log"
              domain={[0.01, 32]}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={xTickFormatter}
              ticks={[0.05, 0.1, 0.5, 1, 5, 10, 32]}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={yTickFormatter}
              width={55}
              domain={yDomain}
            />
            <RechartsTooltip
              formatter={tooltipFormatter}
              labelFormatter={labelFormatter}
              contentStyle={TOOLTIP_STYLE}
            />

            {/* Profit line (what you make after exercise cost) */}
            <Area
              type="monotone"
              dataKey={hasPreferred ? "profitAfterPref" : "profit"}
              stroke={hasPreferred ? "hsl(45 93% 47%)" : "hsl(var(--primary))"}
              strokeWidth={2}
              fill="url(#profitGradient)"
            />

            {/* Zero line (break-even) - rendered after areas so it's visible on top */}
            <ReferenceLine
              y={0}
              stroke="#aaaaaa"
              strokeDasharray="4 4"
              strokeWidth={0.75}
              ifOverflow="extendDomain"
            />

            {/* Highlighted dots at key exit valuations */}
            {data
              .filter((d) => d.isHighlighted)
              .map((point) => {
                const yValue = hasPreferred
                  ? point.profitAfterPref
                  : point.profit;
                const isProfit = yValue > 0;
                return (
                  <ReferenceDot
                    key={point.exitBillions}
                    x={point.exitBillions}
                    y={yValue}
                    r={6}
                    fill={isProfit ? "#22c55e" : "#ef4444"}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              })}

            {/* Custom exit interactive dot - blue */}
            <ReferenceDot
              x={customExitBillions}
              y={customProfit}
              r={8}
              fill="#3b82f6"
              stroke="white"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-[10px] text-muted-foreground pb-4 px-1">
          <span>Break-even point: {breakEvenDisplay}</span>
        </div>
      </div>

      {/* Custom exit slider */}
      <div className="rounded border p-3 space-y-2 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Custom exit sum:</span>
          <span className="text-sm font-semibold">
            {formatValuation(customExitValuation)}
            {customImpliedMultiple > 0 && (
              <span className="text-[10px] text-muted-foreground ml-1">
                ({customImpliedMultiple.toFixed(1)}x)
              </span>
            )}
          </span>
        </div>
        <Slider
          value={[valueToSlider(customExitValuation)]}
          onValueChange={([v]) => throttledSetCustomExit(sliderToValue(v))}
          min={0}
          max={100}
          step={0.5}
        />

        {/* Time horizon slider */}
        <div className="flex items-center justify-between pt-3">
          <span className="text-xs text-muted-foreground">
            <JargonTerm termKey="time-to-exit">Time to exit:</JargonTerm>
          </span>
          <div className="flex items-center gap-2">
            <Slider
              value={[timeHorizon]}
              onValueChange={([v]) => throttledSetTimeHorizon(v)}
              min={OPPORTUNITY_COST_SLIDER_CONFIG.timeHorizonYears.min}
              max={OPPORTUNITY_COST_SLIDER_CONFIG.timeHorizonYears.max}
              step={OPPORTUNITY_COST_SLIDER_CONFIG.timeHorizonYears.step}
              className="w-24"
            />
            <Input
              type="number"
              value={timeHorizon}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= 15) {
                  onTimeHorizonChange(val);
                }
              }}
              className="w-12 h-6 text-xs text-center px-1"
              min={1}
              max={15}
            />
            <span className="text-xs text-muted-foreground">yr</span>
          </div>
        </div>

        {/* Results comparison */}
        <div className="pt-2 border-t space-y-1.5">
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                  Your payout:
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs max-w-[200px]">
                <p className="font-medium mb-1">Payout at {formatValuation(customExitValuation)} exit</p>
                <p className="text-muted-foreground">
                  {ownershipPercent.toFixed(3)}% × {formatValuation(customExitValuation)} = {formatCurrency(customPayout)}
                </p>
              </TooltipContent>
            </Tooltip>
            <span className="text-sm font-semibold">
              {formatCurrency(customPayout)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                  Profit:
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs max-w-[220px]">
                <p className="font-medium mb-1">Profit = Payout − Exercise Cost</p>
                <p className="text-muted-foreground">
                  {formatCurrency(customPayout)} − {formatCurrency(exerciseCost)} = {formatCurrency(customProfit)}
                </p>
              </TooltipContent>
            </Tooltip>
            <span
              className={cn(
                "text-sm font-semibold",
                customProfit > 0 && "text-green-600",
                customProfit < 0 && "text-red-600",
              )}
            >
              {customProfit >= 0 ? "+" : ""}
              {formatCurrency(customProfit)}
            </span>
          </div>

          {/* Opportunity cost toggle */}
          <div className="flex items-center justify-between pt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                  Include opportunity cost
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs max-w-[220px]">
                <p className="font-medium mb-1">Opportunity Cost Comparison</p>
                <p className="text-muted-foreground">
                  Compare your options payout against what you&apos;d have if you invested the exercise cost in an S&P 500 index fund instead.
                </p>
              </TooltipContent>
            </Tooltip>
            <Switch
              checked={includeOpportunityCost}
              onCheckedChange={onIncludeOpportunityCostChange}
            />
          </div>

          {/* Include tax toggle (only when opportunity cost is enabled) */}
          {includeOpportunityCost && estimatedTax > 0 && (
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                    Include tax at exercise
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs max-w-[220px]">
                  <p className="font-medium mb-1">Tax as Opportunity Cost</p>
                  <p className="text-muted-foreground">
                    Add estimated tax (~{formatCurrency(estimatedTax)}) to the exercise cost. This total is what you&apos;d pay upfront and could invest elsewhere instead.
                  </p>
                </TooltipContent>
              </Tooltip>
              <Switch
                checked={includeTaxInCost}
                onCheckedChange={onIncludeTaxInCostChange}
              />
            </div>
          )}

          {/* Index fund row (conditional) */}
          {includeOpportunityCost && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Index fund ({timeHorizon}yr):
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {formatCurrency(indexFundValue)}
              </span>
            </div>
          )}

          {/* Winner calculation and indicator */}
          <div className="mt-3 pt-2 border-t space-y-2">
            {/* Collapsible formula breakdown */}
            <button
              type="button"
              onClick={() => onShowFormulaChange(!showFormula)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="font-mono">{showFormula ? "▼" : "▶"}</span>
              <span>{showFormula ? "Hide" : "Show"} calculation</span>
            </button>

            {showFormula && (
              <div className="text-[10px] text-muted-foreground font-mono bg-muted/30 rounded p-2.5 space-y-3">
                {/* Step 1: Payout calculation */}
                <div className="space-y-0.5">
                  <div className="text-[9px] text-muted-foreground/70 font-sans font-medium">
                    Step 1: Calculate Payout
                  </div>
                  <div className="pl-2">
                    <div>Payout = Ownership% × Exit Valuation</div>
                    <div className="text-muted-foreground/80">
                      = {ownershipPercent.toFixed(3)}% × {formatValuation(customExitValuation)}
                    </div>
                    <div className="font-semibold">
                      = {formatCurrency(customPayout)}
                    </div>
                  </div>
                </div>

                {includeOpportunityCost ? (
                  <>
                    {/* Step 2: Index fund calculation */}
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-muted-foreground/70 font-sans font-medium">
                        Step 2: Calculate Index Fund Alternative
                      </div>
                      <div className="pl-2">
                        {includeTaxInCost && estimatedTax > 0 ? (
                          <>
                            <div>Total Cost = Exercise + Tax</div>
                            <div className="text-muted-foreground/80">
                              = {formatCurrency(exerciseCost)} + {formatCurrency(estimatedTax)} = {formatCurrency(effectiveCost)}
                            </div>
                            <div className="mt-1">Index Fund = Total Cost × {(1 + alternativeRate).toFixed(2)}<sup>{timeHorizon}</sup></div>
                            <div className="text-muted-foreground/80">
                              = {formatCurrency(effectiveCost)} × {(1 + alternativeRate).toFixed(2)}<sup>{timeHorizon}</sup>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>Index Fund = Cost × {(1 + alternativeRate).toFixed(2)}<sup>{timeHorizon}</sup></div>
                            <div className="text-muted-foreground/80">
                              = {formatCurrency(exerciseCost)} × {(1 + alternativeRate).toFixed(2)}<sup>{timeHorizon}</sup>
                            </div>
                          </>
                        )}
                        <div className="font-semibold">
                          = {formatCurrency(indexFundValue)}
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Comparison */}
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-muted-foreground/70 font-sans font-medium">
                        Step 3: Compare (Net Gain vs Market)
                      </div>
                      <div className="pl-2">
                        <div>Net Gain = Payout − Index Fund</div>
                        <div className="text-muted-foreground/80">
                          = {formatCurrency(customPayout)} − {formatCurrency(indexFundValue)}
                        </div>
                        <div className={cn(
                          "font-semibold",
                          customPayout - indexFundValue > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          = {customPayout - indexFundValue >= 0 ? "+" : ""}{formatCurrency(customPayout - indexFundValue)}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Step 2: Profit calculation (no opportunity cost) */
                  <div className="space-y-0.5">
                    <div className="text-[9px] text-muted-foreground/70 font-sans font-medium">
                      Step 2: Calculate Profit
                    </div>
                    <div className="pl-2">
                      <div>Profit = Payout − Exercise Cost</div>
                      <div className="text-muted-foreground/80">
                        = {formatCurrency(customPayout)} − {formatCurrency(exerciseCost)}
                      </div>
                      <div className={cn(
                        "font-semibold",
                        customProfit > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        = {customProfit >= 0 ? "+" : ""}{formatCurrency(customProfit)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Winner indicator */}
            <div
              className={cn(
                "rounded px-2 py-1.5 text-xs font-medium text-center",
                (includeOpportunityCost ? optionsBeatIndex : customProfit > 0)
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
              )}
            >
              {(includeOpportunityCost ? optionsBeatIndex : customProfit > 0) ? (
                <>
                  Exercising wins by{" "}
                  {formatCurrency(includeOpportunityCost
                    ? customPayout - indexFundValue
                    : customProfit
                  )}
                </>
              ) : (
                <>
                  Exercising loses by{" "}
                  {formatCurrency(includeOpportunityCost
                    ? indexFundValue - customPayout
                    : Math.abs(customProfit)
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
