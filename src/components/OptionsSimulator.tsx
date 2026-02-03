import { useState, useMemo, useEffect } from 'react';
import { OptionsInputs } from './OptionsInputs';
import { ResultsPanel } from './ResultsPanel';
import { RoundModeling } from './RoundModeling';
import { OpportunityCost } from './OpportunityCost';
import { TaxInfo } from './TaxInfo';
import { Glossary } from './Glossary';
import { References } from './References';
import { ExitScenariosEditor } from './ExitScenariosEditor';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { OptionsInput, FundingRound, CustomExitScenario } from '@/types/options';
import { DEFAULT_INPUTS, OPPORTUNITY_COST_DEFAULTS } from '@/lib/defaults';
import {
  calculateAllResultsWithFundingRounds,
  fundingRoundsToPreferredRounds,
  deriveCompanyStage,
  getStageAdjustedExitScenarios,
  customScenariosToExitScenarios,
} from '@/lib/calculations';
import { Trash2, Download, Upload, FileUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const STORAGE_KEY = 'options-simulator-state';

interface StoredState {
  inputs: OptionsInput;
  fundingRounds: FundingRound[];
  // UI state
  timeHorizon: number;
  alternativeRate: number;
  customExitValuation: number;
  includeOpportunityCost: boolean;
  includeTaxInCost: boolean;
  showFormula: boolean;
  taxInfoExpanded: boolean;
  taxInfoAdvanced: boolean;
  roundModelingAdvanced: boolean;
  customExitScenarios?: CustomExitScenario[] | null;
}

function isValidInputs(inputs: unknown): inputs is OptionsInput {
  if (!inputs || typeof inputs !== 'object') return false;
  const i = inputs as Record<string, unknown>;
  return (
    typeof i.numberOfOptions === 'number' && !isNaN(i.numberOfOptions) &&
    typeof i.strikePrice === 'number' && !isNaN(i.strikePrice) &&
    typeof i.currentFMV === 'number' && !isNaN(i.currentFMV) &&
    typeof i.companyValuation === 'number' && !isNaN(i.companyValuation) &&
    typeof i.ownershipPercent === 'number' && !isNaN(i.ownershipPercent) &&
    (i.optionType === 'ISO' || i.optionType === 'NSO')
  );
}

function loadFromStorage(): StoredState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<StoredState>;
      if (parsed && isValidInputs(parsed.inputs)) {
        return {
          inputs: parsed.inputs,
          fundingRounds: parsed.fundingRounds ?? [],
          timeHorizon: parsed.timeHorizon ?? OPPORTUNITY_COST_DEFAULTS.timeHorizonYears,
          alternativeRate: parsed.alternativeRate ?? OPPORTUNITY_COST_DEFAULTS.alternativeReturnRate,
          customExitValuation: parsed.customExitValuation ?? 1_000_000_000,
          includeOpportunityCost: parsed.includeOpportunityCost ?? true,
          includeTaxInCost: parsed.includeTaxInCost ?? false,
          showFormula: parsed.showFormula ?? false,
          taxInfoExpanded: parsed.taxInfoExpanded ?? false,
          taxInfoAdvanced: parsed.taxInfoAdvanced ?? false,
          roundModelingAdvanced: parsed.roundModelingAdvanced ?? false,
          customExitScenarios: parsed.customExitScenarios ?? null,
        };
      }
    }
  } catch {
    // Invalid JSON or localStorage not available
  }
  return null;
}

function saveToStorage(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage not available or quota exceeded
  }
}

function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage not available
  }
}

function getInitialState(): StoredState {
  const stored = loadFromStorage();
  if (stored) {
    return stored;
  }
  // Clear any corrupted data
  clearStorage();
  return {
    inputs: DEFAULT_INPUTS,
    fundingRounds: [],
    timeHorizon: OPPORTUNITY_COST_DEFAULTS.timeHorizonYears,
    alternativeRate: OPPORTUNITY_COST_DEFAULTS.alternativeReturnRate,
    customExitValuation: 1_000_000_000,
    includeOpportunityCost: true,
    includeTaxInCost: false,
    showFormula: false,
    taxInfoExpanded: false,
    taxInfoAdvanced: false,
    roundModelingAdvanced: false,
    customExitScenarios: null,
  };
}

export function OptionsSimulator() {
  const [initialState] = useState(getInitialState);
  const [inputs, setInputs] = useState<OptionsInput>(initialState.inputs);
  const [fundingRounds, setFundingRounds] = useState<FundingRound[]>(initialState.fundingRounds);
  const [timeHorizon, setTimeHorizon] = useState(initialState.timeHorizon);
  const [alternativeRate, setAlternativeRate] = useState(initialState.alternativeRate);
  const [customExitValuation, setCustomExitValuation] = useState(initialState.customExitValuation);
  const [includeOpportunityCost, setIncludeOpportunityCost] = useState(initialState.includeOpportunityCost);
  const [includeTaxInCost, setIncludeTaxInCost] = useState(initialState.includeTaxInCost);
  const [showFormula, setShowFormula] = useState(initialState.showFormula);
  const [taxInfoExpanded, setTaxInfoExpanded] = useState(initialState.taxInfoExpanded);
  const [taxInfoAdvanced, setTaxInfoAdvanced] = useState(initialState.taxInfoAdvanced);
  const [roundModelingAdvanced, setRoundModelingAdvanced] = useState(initialState.roundModelingAdvanced);
  const [customExitScenarios, setCustomExitScenarios] = useState<CustomExitScenario[] | null>(initialState.customExitScenarios ?? null);
  const [exitEditorOpen, setExitEditorOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage({
      inputs,
      fundingRounds,
      timeHorizon,
      alternativeRate,
      customExitValuation,
      includeOpportunityCost,
      includeTaxInCost,
      showFormula,
      taxInfoExpanded,
      taxInfoAdvanced,
      roundModelingAdvanced,
      customExitScenarios,
    });
  }, [inputs, fundingRounds, timeHorizon, alternativeRate, customExitValuation, includeOpportunityCost, includeTaxInCost, showFormula, taxInfoExpanded, taxInfoAdvanced, roundModelingAdvanced, customExitScenarios]);

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setFundingRounds([]);
    setTimeHorizon(OPPORTUNITY_COST_DEFAULTS.timeHorizonYears);
    setAlternativeRate(OPPORTUNITY_COST_DEFAULTS.alternativeReturnRate);
    setCustomExitValuation(1_000_000_000);
    setIncludeOpportunityCost(true);
    setIncludeTaxInCost(false);
    setShowFormula(false);
    setTaxInfoExpanded(false);
    setTaxInfoAdvanced(false);
    setRoundModelingAdvanced(false);
    setCustomExitScenarios(null);
    clearStorage();
  };

  const handleExport = () => {
    const state: StoredState = {
      inputs,
      fundingRounds,
      timeHorizon,
      alternativeRate,
      customExitValuation,
      includeOpportunityCost,
      includeTaxInCost,
      showFormula,
      taxInfoExpanded,
      taxInfoAdvanced,
      roundModelingAdvanced,
      customExitScenarios,
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'options-simulator.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const processImportFile = (file: File) => {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as StoredState;
        if (isValidInputs(parsed.inputs)) {
          setInputs(parsed.inputs);
          setFundingRounds(parsed.fundingRounds ?? []);
          setTimeHorizon(parsed.timeHorizon ?? OPPORTUNITY_COST_DEFAULTS.timeHorizonYears);
          setAlternativeRate(parsed.alternativeRate ?? OPPORTUNITY_COST_DEFAULTS.alternativeReturnRate);
          setCustomExitValuation(parsed.customExitValuation ?? 1_000_000_000);
          setIncludeOpportunityCost(parsed.includeOpportunityCost ?? true);
          setIncludeTaxInCost(parsed.includeTaxInCost ?? false);
          setShowFormula(parsed.showFormula ?? false);
          setTaxInfoExpanded(parsed.taxInfoExpanded ?? false);
          setTaxInfoAdvanced(parsed.taxInfoAdvanced ?? false);
          setRoundModelingAdvanced(parsed.roundModelingAdvanced ?? false);
          setCustomExitScenarios(parsed.customExitScenarios ?? null);
          setImportModalOpen(false);
        } else {
          setImportError('Invalid file format: missing or invalid inputs');
        }
      } catch {
        setImportError('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImportFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      processImportFile(file);
    } else {
      setImportError('Please drop a JSON file');
    }
  };

  // Derive company stage from funding rounds
  const companyStage = useMemo(
    () => deriveCompanyStage(fundingRounds),
    [fundingRounds]
  );

  // Get stage-adjusted exit scenarios (used as defaults and for reset)
  const stageAdjustedScenarios = useMemo(
    () => getStageAdjustedExitScenarios(companyStage),
    [companyStage]
  );

  // Convert custom scenarios to ExitScenario format, or use stage-adjusted defaults
  const exitScenarios = useMemo(() => {
    if (customExitScenarios) {
      return customScenariosToExitScenarios(customExitScenarios, inputs.companyValuation);
    }
    return stageAdjustedScenarios;
  }, [customExitScenarios, inputs.companyValuation, stageAdjustedScenarios]);

  const results = useMemo(
    () => calculateAllResultsWithFundingRounds(inputs, fundingRounds, exitScenarios),
    [inputs, fundingRounds, exitScenarios]
  );

  // Convert to PreferredRound[] for waterfall calculations
  const preferredRounds = useMemo(
    () => fundingRoundsToPreferredRounds(fundingRounds),
    [fundingRounds]
  );

  // Ownership to use for exit scenarios (after dilution if modeled)
  const effectiveOwnership =
    fundingRounds.length > 0
      ? results.ownershipAfterDilution
      : inputs.ownershipPercent;

  return (
    <TooltipProvider delayDuration={200}>
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-4 text-center relative">
        <h1 className="text-2xl font-bold tracking-tight">
          Options Exercise Simulator
        </h1>
        <p className="text-sm text-muted-foreground">
          Should you exercise your startup options?
        </p>
        <div className="absolute right-0 top-0 flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => { setImportModalOpen(true); setImportError(null); }}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Import values from JSON"
              >
                <Upload className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Import from JSON file</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleExport}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Export values to JSON"
              >
                <Download className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Export to JSON file</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Reset all values"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Reset all values to defaults</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Main content - two columns */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left column - Inputs + Round Modeling */}
        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
          <OptionsInputs inputs={inputs} onChange={setInputs} />
          <div className="border-t pt-4">
            <RoundModeling
              rounds={fundingRounds}
              onChange={setFundingRounds}
              currentOwnership={inputs.ownershipPercent}
              ownershipAfterDilution={results.ownershipAfterDilution}
              totalDilutionPercent={results.totalDilutionPercent}
              showAdvanced={roundModelingAdvanced}
              onShowAdvancedChange={setRoundModelingAdvanced}
            />
          </div>
        </div>

        {/* Right column - Results */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <ResultsPanel
            results={results}
            ownershipPercent={effectiveOwnership}
            companyValuation={inputs.companyValuation}
            preferredRounds={preferredRounds}
            exitScenarios={exitScenarios}
            companyStage={companyStage}
            hasCustomExitScenarios={customExitScenarios !== null}
            onEditExitScenarios={() => setExitEditorOpen(true)}
            timeHorizon={timeHorizon}
            onTimeHorizonChange={setTimeHorizon}
            alternativeRate={alternativeRate}
            customExitValuation={customExitValuation}
            onCustomExitValuationChange={setCustomExitValuation}
            includeOpportunityCost={includeOpportunityCost}
            onIncludeOpportunityCostChange={setIncludeOpportunityCost}
            includeTaxInCost={includeTaxInCost}
            onIncludeTaxInCostChange={setIncludeTaxInCost}
            showFormula={showFormula}
            onShowFormulaChange={setShowFormula}
          />
        </div>
      </div>

      {/* Bottom section - Opportunity Cost + Tax Info side by side */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Opportunity Cost - left */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <OpportunityCost
            exerciseCost={results.exerciseCost}
            estimatedTax={results.taxCalculation?.estimatedTaxAtExercise ?? 0}
            includeTaxInCost={includeTaxInCost}
            ownershipPercent={effectiveOwnership}
            companyValuation={inputs.companyValuation}
            timeHorizon={timeHorizon}
            alternativeRate={alternativeRate}
            onAlternativeRateChange={setAlternativeRate}
            preferredRounds={preferredRounds}
          />
        </div>

        {/* Tax Info - right */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          {results.taxCalculation && (
            <TaxInfo
              taxCalculation={results.taxCalculation}
              optionType={inputs.optionType}
              federalTaxBracket={inputs.federalTaxBracket ?? 0.32}
              annualWages={inputs.annualWages}
              onOptionTypeChange={(type) => setInputs({ ...inputs, optionType: type })}
              onTaxBracketChange={(bracket) => setInputs({ ...inputs, federalTaxBracket: bracket })}
              onAnnualWagesChange={(wages) => setInputs({ ...inputs, annualWages: wages })}
              isExpanded={taxInfoExpanded}
              onExpandedChange={setTaxInfoExpanded}
              showAdvanced={taxInfoAdvanced}
              onShowAdvancedChange={setTaxInfoAdvanced}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        <p>Not financial or tax advice. Consult a professional.</p>
      </div>

      {/* Glossary */}
      <Glossary />

      {/* References */}
      <References />
    </div>

    {/* Exit Scenarios Editor */}
    <ExitScenariosEditor
      customScenarios={customExitScenarios}
      onSave={setCustomExitScenarios}
      onReset={() => setCustomExitScenarios(null)}
      open={exitEditorOpen}
      onOpenChange={setExitEditorOpen}
      companyStage={companyStage}
    />

    {/* Import Modal */}
    <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
      <DialogContent className="sm:max-w-sm p-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base">Import Configuration</DialogTitle>
          <DialogDescription className="text-xs">
            Restore simulator values from a JSON file.
          </DialogDescription>
        </DialogHeader>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            mt-2 border border-dashed rounded-md p-6 text-center transition-all cursor-pointer
            ${isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'}
          `}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className={`transition-transform ${isDragging ? 'scale-110' : ''}`}>
            <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground/70" />
          </div>
          <p className="text-xs font-medium text-foreground/80">
            {isDragging ? 'Drop to import' : 'Drop JSON file here'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            or click to browse
          </p>
          <input
            id="file-input"
            type="file"
            accept=".json,application/json"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
        {importError && (
          <p className="text-xs text-destructive mt-1.5">{importError}</p>
        )}
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
}
