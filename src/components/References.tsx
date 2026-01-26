import { REFERENCES } from '@/data/references';
import { ExternalLink } from 'lucide-react';

export function References() {
  return (
    <div className="mt-6 pt-4 border-t border-border/50">
      <h3 className="text-xs font-medium text-muted-foreground mb-3">
        References
      </h3>
      <ol className="space-y-1.5 text-[11px] text-muted-foreground">
        {REFERENCES.map((ref, index) => (
          <li
            key={ref.id}
            id={`ref-${ref.id}`}
            className="flex gap-2 transition-colors duration-300 rounded px-1 -mx-1"
          >
            <span className="text-muted-foreground/60 w-4 shrink-0">
              [{index + 1}]
            </span>
            <div className="min-w-0">
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <span className="font-medium">{ref.shortName}</span>
                <span className="text-muted-foreground/60">—</span>
                <span className="truncate">{ref.title}</span>
                <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-50" />
              </a>
              <span className="text-muted-foreground/50 ml-1">
                ({ref.date})
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
