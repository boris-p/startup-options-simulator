import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { JargonTerm } from '@/components/JargonTerm';
import type { OptionsInput } from '@/types/options';
import { SLIDER_CONFIG } from '@/lib/defaults';
import { deriveValuationFromOwnership } from '@/lib/calculations';
import { useThrottledCallback } from '@/lib/utils';

interface OptionsInputsProps {
  inputs: OptionsInput;
  onChange: (inputs: OptionsInput) => void;
}

interface SliderInputProps {
  label: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  formatDisplay?: (value: number) => string;
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix = '',
  suffix = '',
  formatDisplay,
}: SliderInputProps) {
  const displayValue = formatDisplay ? formatDisplay(value) : value.toString();
  const [inputText, setInputText] = useState(displayValue);
  const [isFocused, setIsFocused] = useState(false);

  // Throttle slider changes to prevent recharts infinite loop with React 19
  const throttledOnChange = useThrottledCallback(
    useCallback((v: number) => onChange(v), [onChange]),
    50
  );

  // Sync input text with external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setInputText(displayValue);
    }
  }, [displayValue, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow typing freely - only strip truly invalid chars
    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
    setInputText(rawValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = parseFloat(inputText);
    if (!isNaN(numValue)) {
      // Clamp to valid range on blur
      const clamped = Math.min(max, Math.max(min, numValue));
      onChange(clamped);
      setInputText(formatDisplay ? formatDisplay(clamped) : clamped.toString());
    } else {
      // Reset to current value if invalid
      setInputText(displayValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number for easier editing
    setInputText(value.toString());
  };

  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs font-medium text-muted-foreground shrink-0 w-24">
        {label}
      </Label>
      <Slider
        value={[value]}
        onValueChange={([v]) => throttledOnChange(v)}
        min={min}
        max={max}
        step={step}
        className="flex-1"
      />
      <div className="flex items-center gap-0.5 shrink-0">
        {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
        <Input
          type="text"
          inputMode="decimal"
          value={inputText}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="h-6 w-20 text-right text-xs font-medium px-1.5"
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

export function OptionsInputs({ inputs, onChange }: OptionsInputsProps) {
  const updateInput = <K extends keyof OptionsInput>(key: K, value: OptionsInput[K]) => {
    onChange({ ...inputs, [key]: value });
  };

  // Auto-derive company valuation from ownership (runs silently in background)
  const derivedValuation = deriveValuationFromOwnership(
    inputs.numberOfOptions,
    inputs.currentFMV,
    inputs.ownershipPercent
  );

  // Sync derived valuation to inputs
  useEffect(() => {
    if (derivedValuation > 0 && derivedValuation !== inputs.companyValuation) {
      const clamped = Math.min(derivedValuation, SLIDER_CONFIG.companyValuation.max);
      updateInput('companyValuation', clamped);
    }
  }, [derivedValuation]);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">Your Options</h2>

      <div className="space-y-3">
        <SliderInput
          label="Number of Options"
          value={inputs.numberOfOptions}
          onChange={(v) => updateInput('numberOfOptions', v)}
          min={SLIDER_CONFIG.numberOfOptions.min}
          max={SLIDER_CONFIG.numberOfOptions.max}
          step={SLIDER_CONFIG.numberOfOptions.step}
          formatDisplay={(v) => v.toLocaleString()}
        />

        <SliderInput
          label={<JargonTerm termKey="strike-price" />}
          value={inputs.strikePrice}
          onChange={(v) => updateInput('strikePrice', v)}
          min={SLIDER_CONFIG.strikePrice.min}
          max={SLIDER_CONFIG.strikePrice.max}
          step={SLIDER_CONFIG.strikePrice.step}
          prefix="$"
          formatDisplay={(v) => v.toFixed(2)}
        />

        <SliderInput
          label={<><JargonTerm termKey="fmv">FMV</JargonTerm> (<JargonTerm termKey="409a">409A</JargonTerm>)</>}
          value={inputs.currentFMV}
          onChange={(v) => updateInput('currentFMV', v)}
          min={SLIDER_CONFIG.currentFMV.min}
          max={SLIDER_CONFIG.currentFMV.max}
          step={SLIDER_CONFIG.currentFMV.step}
          prefix="$"
          formatDisplay={(v) => v.toFixed(2)}
        />

        <SliderInput
          label={<JargonTerm termKey="ownership">Ownership</JargonTerm>}
          value={inputs.ownershipPercent}
          onChange={(v) => updateInput('ownershipPercent', v)}
          min={SLIDER_CONFIG.ownershipPercent.min}
          max={SLIDER_CONFIG.ownershipPercent.max}
          step={SLIDER_CONFIG.ownershipPercent.step}
          suffix="%"
          formatDisplay={(v) => v.toFixed(3)}
        />

      </div>
    </div>
  );
}
