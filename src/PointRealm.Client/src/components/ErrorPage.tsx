import { useRouteError } from "react-router-dom";
import { PageShell } from "./shell/PageShell";
import { BackButton } from "./ui/BackButton";
import { Panel } from "./ui/Panel";
import { PageHeader } from "./ui/PageHeader";

const getErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") return "Unknown error";
  const maybeError = error as { statusText?: string; message?: string };
  return maybeError.statusText || maybeError.message || "Unknown error";
};

export function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <PageShell backgroundDensity="high">
      <BackButton to="/" />
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Panel variant="realm" className="max-w-md w-full p-8">
          <PageHeader 
            title="Magical Turbulence" 
            subtitle="An unexpected rift has occurred" 
            size="panel"
          />
          <div className="text-6xl my-8">⚡</div>
          <p className="text-[var(--pr-text-muted)] italic mb-4">
            The spell has backfired in an unforeseen way.
          </p>
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm font-mono break-all">
            {getErrorMessage(error)}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
