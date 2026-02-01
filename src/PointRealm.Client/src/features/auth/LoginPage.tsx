import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { ApiError } from "@/api/client";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/shell/PageShell";
import { BackButton } from "@/components/ui/BackButton";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/ui/ToastSystem";
import { setAuthToken, setAuthUser } from "@/lib/storage/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authApi.login({ email, password, rememberMe });
      setAuthToken(response.accessToken);
      setAuthUser(response.user);
      toast("Welcome back!", "success");
      navigate("/account");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed.";
      setError(message);
      toast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell backgroundDensity="medium">
      <BackButton to="/" />
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Panel variant="realm" className="max-w-md w-full p-8">
          <PageHeader title="Inscribe Your Presence" subtitle="Enter the Tavern" size="panel" />
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="mage@pointrealm.app"
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
            <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-pr-text-muted">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-pr-border bg-pr-bg text-pr-primary focus:ring-pr-primary"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Remember me
            </label>
            {error && <p className="text-xs text-pr-danger/80">{error}</p>}
            <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Entering..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-pr-text-muted">
            New to PointRealm?{" "}
            <button
              type="button"
              onClick={() => navigate("/auth/register")}
              className="text-pr-primary hover:text-pr-primary-light underline underline-offset-4"
            >
              Create an account
            </button>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
