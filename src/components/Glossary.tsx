import { JARGON, type JargonCategory } from '@/data/jargon';
import { renderDefinitionCompact } from '@/lib/renderDefinition';

const CATEGORY_LABELS: Record<JargonCategory, string> = {
  'option-types': 'Option Types',
  'valuation': 'Valuation',
  'ownership': 'Ownership & Dilution',
  'exercise': 'Exercise & Value',
  'analysis': 'Analysis',
  'exit-scenarios': 'Exit Scenarios',
  'tax': 'Tax',
};

const CATEGORY_ORDER: JargonCategory[] = [
  'option-types',
  'valuation',
  'ownership',
  'exercise',
  'analysis',
  'exit-scenarios',
  'tax',
];

export function Glossary() {
  // Group terms by category
  const termsByCategory = Object.entries(JARGON).reduce(
    (acc, [key, def]) => {
      if (!acc[def.category]) {
        acc[def.category] = [];
      }
      acc[def.category].push({ key, ...def });
      return acc;
    },
    {} as Record<JargonCategory, Array<{ key: string; term: string; definition: string; category: JargonCategory }>>
  );

  return (
    <div className="mt-6 pt-4 border-t border-border/50">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">
        Glossary
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {CATEGORY_ORDER.map((category) => {
          const terms = termsByCategory[category];
          if (!terms || terms.length === 0) return null;

          return (
            <div key={category}>
              <h4 className="text-xs font-semibold text-foreground/80 mb-1">
                {CATEGORY_LABELS[category]}
              </h4>
              <dl className="space-y-1">
                {terms.map(({ key, term, definition }) => (
                  <div key={key} className="text-[11px] leading-snug">
                    <dt className="font-medium text-foreground inline">
                      {term}:
                    </dt>{' '}
                    <dd className="text-muted-foreground inline">
                      {renderDefinitionCompact(definition)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
