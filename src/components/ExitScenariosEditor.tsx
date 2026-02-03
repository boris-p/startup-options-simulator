import { useState, useEffect, useMemo } from 'react';
import type { CustomExitScenario, CompanyStage } from '@/types/options';
import { validateExitScenarioProbabilities } from '@/lib/calculations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RotateCcw, Plus, X } from 'lucide-react';

interface ExitScenariosEditorProps {
  customScenarios: CustomExitScenario[] | null;
  onSave: (scenarios: CustomExitScenario[]) => void;
  onReset: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyStage?: CompanyStage;
}

export function ExitScenariosEditor({
  customScenarios,
  onSave,
  onReset,
  open,
  onOpenChange,
  companyStage,
}: ExitScenariosEditorProps) {
  const [draft, setDraft] = useState<CustomExitScenario[]>([]);

  // Initialize draft when dialog opens
  useEffect(() => {
    if (open) {
      if (customScenarios && customScenarios.length > 0) {
        setDraft(customScenarios.map(s => ({ ...s })));
      } else {
        setDraft([]);
      }
    }
  }, [open, customScenarios]);

  const validation = useMemo(
    () => validateExitScenarioProbabilities(draft),
    [draft]
  );

  const totalPercent = validation.total * 100;
  const diff = totalPercent - 100;
  const canSave = validation.isValid && draft.length > 0;

  const addRow = () => {
    setDraft(prev => [...prev, { name: '', exitValue: 0, probability: 0 }]);
  };

  const removeRow = (index: number) => {
    setDraft(prev => prev.filter((_, i) => i !== index));
  };

  const updateName = (index: number, name: string) => {
    setDraft(prev => prev.map((s, i) => i === index ? { ...s, name } : s));
  };

  const updateExitValueM = (index: number, raw: string) => {
    const millions = parseFloat(raw);
    setDraft(prev => prev.map((s, i) =>
      i === index ? { ...s, exitValue: isNaN(millions) ? 0 : Math.max(0, millions) * 1_000_000 } : s
    ));
  };

  const updateProbability = (index: number, raw: string) => {
    const value = parseFloat(raw);
    setDraft(prev => prev.map((s, i) =>
      i === index ? { ...s, probability: isNaN(value) ? 0 : value / 100 } : s
    ));
  };

  const handleSave = () => {
    if (canSave) {
      onSave(draft);
      onOpenChange(false);
    }
  };

  const handleClear = () => {
    onReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base">Customize Exit Scenarios</DialogTitle>
          <DialogDescription className="text-xs">
            Define custom exit valuations and their probabilities.
            {companyStage && (
              <span className="block mt-0.5">
                Stage: <span className="font-medium text-foreground">{companyStage}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-1.5">
          {draft.length > 0 && (
            <>
              {/* Header row */}
              <div className="grid grid-cols-[1fr_100px_70px_24px] gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide px-0.5">
                <span>Label</span>
                <span>Exit ($M)</span>
                <span className="text-right">Prob.</span>
                <span />
              </div>

              {/* Scenario rows */}
              {draft.map((scenario, index) => (
                <div key={index} className="grid grid-cols-[1fr_100px_70px_24px] gap-1.5 items-center">
                  <input
                    type="text"
                    placeholder="e.g. Acqui-hire"
                    value={scenario.name}
                    onChange={(e) => updateName(index, e.target.value)}
                    className="w-full h-7 text-xs rounded border border-input bg-background px-1.5 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                  />
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="100"
                      value={scenario.exitValue > 0 ? scenario.exitValue / 1_000_000 : ''}
                      onChange={(e) => updateExitValueM(index, e.target.value)}
                      className="w-full h-7 text-xs text-right pr-6 rounded border border-input bg-background px-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">$M</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={parseFloat((scenario.probability * 100).toFixed(1))}
                      onChange={(e) => updateProbability(index, e.target.value)}
                      className="w-full h-7 text-xs text-right pr-3 rounded border border-input bg-background px-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="h-7 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove scenario"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Total row */}
              <div className="grid grid-cols-[1fr_100px_70px_24px] gap-1.5 items-center pt-1.5 border-t">
                <span className="text-xs font-medium">Total</span>
                <span />
                <span className={`text-xs font-semibold text-right pr-3.5 ${
                  validation.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totalPercent.toFixed(1)}%
                  {!validation.isValid && draft.length > 0 && (
                    <span className="text-[10px] font-normal ml-0.5">
                      ({diff > 0 ? '+' : ''}{diff.toFixed(1)}%)
                    </span>
                  )}
                </span>
                <span />
              </div>

              {!validation.isValid && draft.length > 0 && (
                <p className="text-[10px] text-red-600">
                  Probabilities must sum to 100% to save.
                </p>
              )}
            </>
          )}

          {draft.length === 0 && (
            <p className="text-xs text-muted-foreground py-3 text-center">
              No custom scenarios. Add rows to define your own exit probabilities.
            </p>
          )}

          {/* Add row button */}
          <button
            type="button"
            onClick={addRow}
            className="w-full h-7 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-muted-foreground/50 rounded transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add scenario
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-3">
          <div>
            {customScenarios && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Clear custom
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="px-3 py-1.5 text-xs font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
