import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { JARGON, type JargonDefinition } from '@/data/jargon';
import { renderDefinition } from '@/lib/renderDefinition';
import { cn } from '@/lib/utils';

interface JargonTermProps {
  termKey: string;
  children?: React.ReactNode;
  className?: string;
}

export function JargonTerm({ termKey, children, className }: JargonTermProps) {
  const definition: JargonDefinition | undefined = JARGON[termKey];

  if (!definition) {
    console.warn(`Jargon term not found: ${termKey}`);
    return <span className={className}>{children ?? termKey}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'text-jargon border-b border-dotted border-jargon/50 cursor-help transition-colors hover:text-jargon/80',
            className
          )}
        >
          {children ?? definition.term}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-70">
        <p className="font-medium mb-1">{definition.term}</p>
        {renderDefinition(definition.definition)}
      </TooltipContent>
    </Tooltip>
  );
}
