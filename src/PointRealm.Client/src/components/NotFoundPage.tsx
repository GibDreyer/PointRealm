import { PageShell } from "./shell/PageShell";
import { BackButton } from "./ui/BackButton";
import { Panel } from "./ui/Panel";
import { PageHeader } from "./ui/PageHeader";

export function NotFoundPage() {
  return (
    <PageShell backgroundDensity="high">
      <BackButton to="/" />
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Panel variant="realm" className="max-w-md w-full p-8 text-center">
          <PageHeader 
            title="Lost in the Void" 
            subtitle="The path you seek does not exist in this realm" 
            size="panel"
          />
          <div className="text-6xl my-8">🌫️</div>
          <p className="text-[var(--pr-text-muted)] italic mb-8">
            The magical currents have led you to a place of nothingness.
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}
