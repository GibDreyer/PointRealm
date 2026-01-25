import { PageShell } from "@/components/shell/PageShell";
import { BackButton } from "@/components/ui/BackButton";
import { Panel } from "@/components/ui/Panel";
import { PageHeader } from "@/components/ui/PageHeader";

export function RegisterPage() {
  return (
    <PageShell backgroundDensity="medium">
      <BackButton to="/" />
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Panel variant="realm" className="max-w-md w-full p-8 text-center">
          <PageHeader 
            title="Join the Order" 
            subtitle="Register your lineage" 
            size="panel"
          />
          <div className="mt-8">
            <p className="text-[var(--pr-text-muted)] italic">
              Enrollment scrolls are currently being enchanted.
            </p>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
