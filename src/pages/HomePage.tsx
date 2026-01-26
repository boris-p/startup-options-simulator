import { OptionsCalculator } from '@/components/OptionsCalculator';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <OptionsCalculator />
      </main>
    </div>
  );
}
