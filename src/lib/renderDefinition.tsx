/**
 * Shared utility for rendering jargon definitions with formula styling.
 * Used by both JargonTerm.tsx (tooltips) and Glossary.tsx (full display).
 */

// Check if a line looks like a formula (contains math symbols)
export function isFormulaLine(line: string): boolean {
  return /[=÷×%]/.test(line) && (line.includes('=') || line.startsWith('•'));
}

// Render definition with support for paragraphs and formula styling
export function renderDefinition(definition: string) {
  const paragraphs = definition.split('\n\n');

  return paragraphs.map((para, i) => {
    const lines = para.split('\n');
    const hasFormulas = lines.some(isFormulaLine);

    if (hasFormulas) {
      return (
        <div key={i} className="font-mono text-[10px] bg-muted p-1.5 rounded my-1.5">
          {lines.map((line, j) => (
            <div key={j}>{line}</div>
          ))}
        </div>
      );
    }

    return (
      <p key={i} className="text-muted-foreground leading-relaxed mb-1.5 last:mb-0">
        {para}
      </p>
    );
  });
}

// Compact version for inline glossary display (smaller text, tighter spacing)
export function renderDefinitionCompact(definition: string) {
  const paragraphs = definition.split('\n\n');

  return paragraphs.map((para, i) => {
    const lines = para.split('\n');
    const hasFormulas = lines.some(isFormulaLine);

    if (hasFormulas) {
      return (
        <div key={i} className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded mt-0.5 inline-block">
          {lines.map((line, j) => (
            <div key={j} className="leading-tight">{line}</div>
          ))}
        </div>
      );
    }

    // For compact mode, inline text
    if (i === 0) {
      return <span key={i}>{para}</span>;
    }

    return (
      <span key={i} className="block mt-0.5">
        {para}
      </span>
    );
  });
}
