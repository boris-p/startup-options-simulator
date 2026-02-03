import type { TaxCalculation, OptionType } from '@/types/options';
import { TAX_INFO, TAX_BRACKETS } from '@/lib/defaults';
import { formatCurrencyFull } from '@/lib/calculations';
import { JargonTerm } from '@/components/JargonTerm';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface TaxInfoProps {
  taxCalculation: TaxCalculation;
  optionType: OptionType;
  federalTaxBracket: number;
  annualWages?: number;
  onOptionTypeChange: (type: OptionType) => void;
  onTaxBracketChange: (bracket: number) => void;
  onAnnualWagesChange: (wages: number | undefined) => void;
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  showAdvanced: boolean;
  onShowAdvancedChange: (show: boolean) => void;
}

export function TaxInfo({
  taxCalculation,
  optionType,
  federalTaxBracket,
  annualWages,
  onOptionTypeChange,
  onTaxBracketChange,
  onAnnualWagesChange,
  isExpanded,
  onExpandedChange,
  showAdvanced,
  onShowAdvancedChange,
}: TaxInfoProps) {
  const { spreadTotal, estimatedTaxAtExercise, ssCapped } = taxCalculation;
  const info = TAX_INFO[optionType];

  const handleWagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onAnnualWagesChange(undefined);
    } else {
      const numValue = parseFloat(value.replace(/,/g, ''));
      if (!isNaN(numValue) && numValue >= 0) {
        onAnnualWagesChange(numValue);
      }
    }
  };

  const formatWagesInput = (wages: number | undefined): string => {
    if (wages === undefined) return '';
    return wages.toLocaleString();
  };

  const getFicaDescription = (): string => {
    if (optionType === 'ISO') {
      return 'ISO: Spread × 28% AMT rate (simplified estimate)';
    }
    if (annualWages === undefined) {
      return 'NSO: Spread × (tax bracket + 7.65% FICA)';
    }
    if (ssCapped) {
      return 'NSO: Spread × (tax bracket + 1.45% Medicare) — SS capped';
    }
    return 'NSO: Spread × (tax bracket + 7.65% FICA)';
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Tax Considerations</h3>
          <span className="text-xs text-muted-foreground">
            <JargonTerm termKey={optionType.toLowerCase()}>{optionType}</JargonTerm> • <JargonTerm termKey="spread">Spread</JargonTerm>: {formatCurrencyFull(spreadTotal)}
          </span>
        </div>
        {optionType === 'ISO' ? (
          <button
            type="button"
            onClick={() => onExpandedChange(!isExpanded)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Advanced</span>
            <Switch
              checked={showAdvanced}
              onCheckedChange={onShowAdvancedChange}
            />
          </div>
        )}
      </div>

      {/* Option Type & Tax Bracket - side by side */}
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">
            Option Type
          </Label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onOptionTypeChange('ISO')}
              className={cn(
                'flex-1 rounded border px-2 py-1 text-xs font-medium transition-colors',
                optionType === 'ISO'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent'
              )}
            >
              <JargonTerm termKey="iso" className={optionType === 'ISO' ? 'text-primary-foreground border-primary-foreground/50' : ''}>ISO</JargonTerm>
            </button>
            <button
              type="button"
              onClick={() => onOptionTypeChange('NSO')}
              className={cn(
                'flex-1 rounded border px-2 py-1 text-xs font-medium transition-colors',
                optionType === 'NSO'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent'
              )}
            >
              <JargonTerm termKey="nso" className={optionType === 'NSO' ? 'text-primary-foreground border-primary-foreground/50' : ''}>NSO</JargonTerm>
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">
            <JargonTerm termKey="tax-bracket">Tax Bracket</JargonTerm>
          </Label>
          <div className="flex gap-1 flex-wrap">
            {TAX_BRACKETS.map((bracket) => (
              <Tooltip key={bracket.value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onTaxBracketChange(bracket.value)}
                    className={cn(
                      'rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                      federalTaxBracket === bracket.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent'
                    )}
                  >
                    {bracket.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {bracket.range}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      {/* Tax summary - always visible */}
      {spreadTotal > 0 && (
        <div className="mt-2 rounded bg-muted/50 p-2 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              <JargonTerm termKey="spread">Spread</JargonTerm> at exercise
            </span>
            <span className="font-medium">{formatCurrencyFull(spreadTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Estimated tax at exercise
            </span>
            <span className="font-medium text-destructive">
              ~{formatCurrencyFull(estimatedTaxAtExercise)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground pt-1 border-t">
            {getFicaDescription()}
          </p>
        </div>
      )}

      {/* ISO expanded content - controlled by chevron */}
      {optionType === 'ISO' && isExpanded && (
        <div className="mt-3 space-y-3">
          <div>
            <h4 className="text-xs font-medium">{info.title}</h4>
            <ul className="mt-1 space-y-1">
              {info.points.map((point, index) => (
                <li key={index} className="text-xs text-muted-foreground flex gap-1.5">
                  <span className="text-primary">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {spreadTotal > 0 && (
            <div className="rounded bg-amber-50 border border-amber-200 p-2 dark:bg-amber-950/30 dark:border-amber-900">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong><JargonTerm termKey="amt" className="text-amber-800 dark:text-amber-200 border-amber-800/50 dark:border-amber-200/50">AMT</JargonTerm> Alert:</strong> {formatCurrencyFull(spreadTotal)} spread counts as AMT income.
                Estimated AMT: ~{formatCurrencyFull(taxCalculation.estimatedAMT ?? 0)}
              </p>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground italic">
            Not tax advice. Consult a tax professional. Actual AMT depends on your total income and deductions.
          </p>
        </div>
      )}

      {/* NSO expanded content - controlled by Advanced toggle */}
      {optionType === 'NSO' && showAdvanced && (
        <div className="mt-3 space-y-3">
          <div>
            <h4 className="text-xs font-medium">{info.title}</h4>
            <ul className="mt-1 space-y-1">
              {info.points.map((point, index) => (
                <li key={index} className="text-xs text-muted-foreground flex gap-1.5">
                  <span className="text-primary">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {spreadTotal > 0 && (
            <div className="rounded bg-blue-50 border border-blue-200 p-2 dark:bg-blue-950/30 dark:border-blue-900">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Tax at Exercise:</strong> <JargonTerm termKey="ordinary-income" className="text-blue-800 dark:text-blue-200 border-blue-800/50 dark:border-blue-200/50">Ordinary income</JargonTerm> tax on {formatCurrencyFull(spreadTotal)}.
                Estimated tax: ~{formatCurrencyFull(taxCalculation.ordinaryIncomeTax ?? 0)} (includes <JargonTerm termKey="fica" className="text-blue-800 dark:text-blue-200 border-blue-800/50 dark:border-blue-200/50">FICA</JargonTerm>)
                {ssCapped && (
                  <span className="block mt-1 text-green-700 dark:text-green-400">
                    SS capped — only 1.45% Medicare applies
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="space-y-1.5 p-2 rounded bg-muted/30">
            <div className="flex items-center gap-2">
              <Label htmlFor="annual-wages" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Annual Wages
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50 transition-colors hover:text-foreground">
                    (for <JargonTerm termKey="ss-wage-cap" className="text-[10px]">SS cap</JargonTerm> calculation)
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-70">
                  <p className="text-muted-foreground leading-relaxed">
                    Social Security tax (6.2%) is capped at $176,100 for 2025.
                    If your salary already exceeds this, only Medicare (1.45%) applies to your options spread.
                  </p>
                  <a
                    href="https://www.ssa.gov/oact/cola/cbb.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline mt-1 inline-block"
                  >
                    SSA: Contribution and Benefit Base
                  </a>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">$</span>
              <input
                id="annual-wages"
                type="text"
                inputMode="numeric"
                value={formatWagesInput(annualWages)}
                onChange={handleWagesChange}
                placeholder="e.g. 150,000"
                className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {annualWages !== undefined && (
                <button
                  type="button"
                  onClick={() => onAnnualWagesChange(undefined)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground italic">
            Not tax advice. Consult a tax professional.
          </p>
        </div>
      )}
    </div>
  );
}
