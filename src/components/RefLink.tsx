import { getReferenceIndex } from '@/data/references';

interface RefLinkProps {
  refId: string;
}

export function RefLink({ refId }: RefLinkProps) {
  const index = getReferenceIndex(refId);

  if (index === 0) {
    console.warn(`Reference not found: ${refId}`);
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(`ref-${refId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Brief highlight effect
      element.classList.add('bg-primary/10');
      setTimeout(() => element.classList.remove('bg-primary/10'), 1500);
    }
  };

  return (
    <a
      href={`#ref-${refId}`}
      onClick={handleClick}
      className="text-[9px] text-muted-foreground hover:text-primary align-super ml-0.5 cursor-pointer transition-colors"
      title="View source"
    >
      [{index}]
    </a>
  );
}
