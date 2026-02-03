import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { JargonTerm } from "@/components/JargonTerm";
import { RefLink } from "@/components/RefLink";
import type { PreferredRound, PreferredType } from "@/types/options";
import {
  FUNDING_ROUNDS,
  SLIDER_CONFIG,
  TYPICAL_INVESTOR_OWNERSHIP,
  createPreferredRound,
} from "@/lib/defaults";
import { formatCurrency } from "@/lib/calculations";
import { Plus, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUND_JARGON_KEYS: Record<string, string> = {
  Seed: "seed",
  "Series A": "series-a",
  "Series B": "series-b",
  "Series C": "series-c",
  "Series D+": "series-d",
};

interface PreferredStockModelingProps {
  rounds: PreferredRound[];
  onChange: (rounds: PreferredRound[]) => void;
}

export function PreferredStockModeling({
  rounds,
  onChange,
}: PreferredStockModelingProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addRound = (name: string) => {
    const newRound = createPreferredRound(name);
    onChange([...rounds, newRound]);
  };

  const removeLastRound = () => {
    if (rounds.length > 0) {
      onChange(rounds.slice(0, -1));
    }
  };

  const updateRound = (id: string, updates: Partial<PreferredRound>) => {
    onChange(rounds.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const resetAdvancedToDefaults = () => {
    onChange(
      rounds.map((r) => ({
        ...r,
        ownershipPercent: TYPICAL_INVESTOR_OWNERSHIP[r.name] ?? 15,
        liquidationMultiple: 1,
        preferredType: "non-participating" as PreferredType,
      }))
    );
  };

  // Only show the next round in sequence (must add in order)
  const addedRoundNames = rounds.map((r) => r.name);
  const nextRoundIndex =
    addedRoundNames.length > 0
      ? FUNDING_ROUNDS.indexOf(addedRoundNames[addedRoundNames.length - 1]) + 1
      : 0;
  const nextRound =
    nextRoundIndex < FUNDING_ROUNDS.length
      ? FUNDING_ROUNDS[nextRoundIndex]
      : null;

  const totalInvested = rounds.reduce((sum, r) => sum + r.investedAmount, 0);
  const totalPreferredOwnership = rounds.reduce(
    (sum, r) => sum + r.ownershipPercent,
    0
  );

  const formatAmount = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    return `$${(value / 1_000).toFixed(0)}K`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          <JargonTerm termKey="liquidation-preference">Liquidation Preferences</JargonTerm>
        </h3>
        <div className="flex items-center gap-3">
          {rounds.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {formatCurrency(totalInvested)} invested
            </span>
          )}
          {rounds.length > 0 && (
            <div className="flex items-center gap-2">
              {showAdvanced && (
                <button
                  type="button"
                  onClick={resetAdvancedToDefaults}
                  className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Reset to standard terms"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Reset
                </button>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Advanced</span>
                <Switch
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add next round button */}
      {nextRound && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addRound(nextRound)}
            className="h-6 text-xs gap-0.5 px-2"
          >
            <Plus className="h-3 w-3" />
            <JargonTerm termKey={ROUND_JARGON_KEYS[nextRound]}>
              {nextRound}
            </JargonTerm>
          </Button>
          {rounds.length === 0 && (
            <span className="text-[10px] text-muted-foreground">
              Model investor liquidation preferences
            </span>
          )}
        </div>
      )}

      {/* Existing rounds */}
      {rounds.length > 0 && (
        <div className="space-y-3">
          {rounds.map((round, index) => {
            const jargonKey = ROUND_JARGON_KEYS[round.name];
            const isLast = index === rounds.length - 1;
            return (
              <div key={round.id} className="space-y-2 p-2 rounded bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    {jargonKey ? (
                      <JargonTerm termKey={jargonKey}>{round.name}</JargonTerm>
                    ) : (
                      round.name
                    )}
                  </Label>
                  {isLast && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeLastRound}
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Amount Raised - always visible */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Amount Raised
                    </span>
                    <span className="text-xs font-medium">
                      {formatAmount(round.investedAmount)}
                    </span>
                  </div>
                  <Slider
                    value={[round.investedAmount]}
                    onValueChange={([v]) =>
                      updateRound(round.id, { investedAmount: v })
                    }
                    min={SLIDER_CONFIG.investedAmount.min}
                    max={SLIDER_CONFIG.investedAmount.max}
                    step={SLIDER_CONFIG.investedAmount.step}
                  />
                </div>

                {/* Advanced fields - hidden by default */}
                {showAdvanced && (
                  <>
                    {/* Ownership */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          Ownership
                        </span>
                        <span className="text-xs font-medium">
                          {round.ownershipPercent}%
                        </span>
                      </div>
                      <Slider
                        value={[round.ownershipPercent]}
                        onValueChange={([v]) =>
                          updateRound(round.id, { ownershipPercent: v })
                        }
                        min={SLIDER_CONFIG.investorOwnership.min}
                        max={SLIDER_CONFIG.investorOwnership.max}
                        step={SLIDER_CONFIG.investorOwnership.step}
                      />
                    </div>

                    {/* Liquidation Multiple */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-[10px] text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50 transition-colors hover:text-foreground">
                              Liquidation Multiple
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-70">
                            <p className="font-medium mb-1">Liquidation Preference Multiple</p>
                            <p className="text-muted-foreground leading-relaxed">
                              How many times their investment investors get back before common shareholders (employees) receive anything. A 1x multiple means they get their money back first; 2x means double.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-xs font-medium">
                          {round.liquidationMultiple}x
                        </span>
                      </div>
                      <Slider
                        value={[round.liquidationMultiple]}
                        onValueChange={([v]) =>
                          updateRound(round.id, { liquidationMultiple: v })
                        }
                        min={SLIDER_CONFIG.liquidationMultiple.min}
                        max={SLIDER_CONFIG.liquidationMultiple.max}
                        step={SLIDER_CONFIG.liquidationMultiple.step}
                      />
                    </div>

                    {/* Preferred Type Toggle */}
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() =>
                              updateRound(round.id, {
                                preferredType: "non-participating" as PreferredType,
                              })
                            }
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                              round.preferredType === "non-participating"
                                ? "bg-muted-foreground/20 text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Non-Participating
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-70">
                          <p className="font-medium mb-1">Non-Participating Preferred</p>
                          <p className="text-muted-foreground leading-relaxed">
                            Investors choose the GREATER of: their liquidation preference OR converting to common shares. Most founder-friendly.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-muted-foreground/50">|</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() =>
                              updateRound(round.id, {
                                preferredType: "participating" as PreferredType,
                              })
                            }
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                              round.preferredType === "participating"
                                ? "bg-muted-foreground/20 text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Participating
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-70">
                          <p className="font-medium mb-1">Participating Preferred</p>
                          <p className="text-muted-foreground leading-relaxed">
                            Investors get BOTH: their liquidation preference AND their pro-rata share. More investor-favorable.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Summary */}
          <div className="rounded bg-muted/50 p-2 text-xs space-y-1">
            {showAdvanced && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preferred ownership</span>
                  <span className="font-medium">{totalPreferredOwnership}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Common ownership</span>
                  <span className="font-medium">
                    {(100 - totalPreferredOwnership).toFixed(1)}%
                  </span>
                </div>
              </>
            )}
            <p className="text-[10px] text-muted-foreground">
              Assumes 1x non-participating (96% of deals)
              <RefLink refId="carta-liquidation-prefs" />
            </p>
          </div>
        </div>
      )}

      {rounds.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add investor rounds to model liquidation preferences
        </p>
      )}
    </div>
  );
}
