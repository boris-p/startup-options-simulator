import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { JargonTerm } from "@/components/JargonTerm";
import { RefLink } from "@/components/RefLink";
import type { DilutionRound } from "@/types/options";
import {
  FUNDING_ROUNDS,
  SLIDER_CONFIG,
  createDilutionRound,
} from "@/lib/defaults";
import { formatOwnership } from "@/lib/calculations";
import { Plus, X } from "lucide-react";

const ROUND_JARGON_KEYS: Record<string, string> = {
  Seed: "seed",
  "Series A": "series-a",
  "Series B": "series-b",
  "Series C": "series-c",
  "Series D+": "series-d",
};

interface DilutionModelingProps {
  rounds: DilutionRound[];
  onChange: (rounds: DilutionRound[]) => void;
  currentOwnership: number;
  ownershipAfterDilution: number;
  totalDilutionPercent: number;
}

export function DilutionModeling({
  rounds,
  onChange,
  currentOwnership,
  ownershipAfterDilution,
  totalDilutionPercent,
}: DilutionModelingProps) {
  const addRound = (name: string) => {
    const newRound = createDilutionRound(name);
    onChange([...rounds, newRound]);
  };

  const removeLastRound = () => {
    if (rounds.length > 0) {
      onChange(rounds.slice(0, -1));
    }
  };

  const updateRound = (id: string, dilutionPercent: number) => {
    onChange(rounds.map((r) => (r.id === id ? { ...r, dilutionPercent } : r)));
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          <JargonTerm termKey="dilution">Dilution</JargonTerm> Modeling
          <RefLink refId="carta-dilution" />
        </h3>
        {rounds.length > 0 && (
          <span className="text-xs text-amber-600">
            -{totalDilutionPercent.toFixed(1)}% dilution
          </span>
        )}
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
              (rounds must be added in order)
            </span>
          )}
        </div>
      )}

      {/* Existing rounds */}
      {rounds.length > 0 && (
        <div className="space-y-2">
          {rounds.map((round, index) => {
            const jargonKey = ROUND_JARGON_KEYS[round.name];
            const isLast = index === rounds.length - 1;
            return (
              <div key={round.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    {jargonKey ? (
                      <JargonTerm termKey={jargonKey}>{round.name}</JargonTerm>
                    ) : (
                      round.name
                    )}
                  </Label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium w-8 text-right">
                      {round.dilutionPercent}%
                    </span>
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
                    {!isLast && <div className="w-5" />}
                  </div>
                </div>
                <Slider
                  value={[round.dilutionPercent]}
                  onValueChange={([v]) => updateRound(round.id, v)}
                  min={SLIDER_CONFIG.dilutionPercent.min}
                  max={SLIDER_CONFIG.dilutionPercent.max}
                  step={SLIDER_CONFIG.dilutionPercent.step}
                />
              </div>
            );
          })}

          {/* Summary */}
          <div className="rounded bg-muted/50 p-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current</span>
              <span className="font-medium">
                {formatOwnership(currentOwnership)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">After dilution</span>
              <span className="font-medium text-amber-600">
                {formatOwnership(ownershipAfterDilution)}
              </span>
            </div>
          </div>
        </div>
      )}

      {rounds.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add rounds to model future dilution
        </p>
      )}
    </div>
  );
}
