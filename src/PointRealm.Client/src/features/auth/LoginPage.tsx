import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/api/client";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/shell/PageShell";
import { BackButton } from "@/components/ui/BackButton";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/ui/ToastSystem";
import { Tooltip } from "@/components/ui/Tooltip";
import { useThemeMode } from "@/theme/ThemeModeProvider";

import { useAuth } from "./AuthContext";
import { consumeAuthNotice } from "@/lib/storage/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const { mode } = useThemeMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const notice = consumeAuthNotice();
    if (notice) {
      setError(notice);
      toast(notice, "error");
    }
  }, [toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login({ email, password, rememberMe });
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

  const loginTitle = mode.key === 'fantasy'
    ? "Inscribe Your Presence"
    : mode.key === 'sci-fi'
      ? "Access Control"
      : "Sign In";
  const loginSubtitle = mode.key === 'fantasy'
    ? `Enter the ${mode.phrases.lobbyTitle}`
    : mode.key === 'sci-fi'
      ? "Enter the briefing bay"
      : "Use your account details";

  return (
    <PageShell backgroundDensity="medium">
      <BackButton to="/" />
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Panel variant="realm" className="max-w-md w-full p-8">
          <PageHeader title={loginTitle} subtitle={loginSubtitle} size="panel" />
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              tooltip="Use the email address tied to your account."
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="mage@pointrealm.app"
              required
            />
            <Input
              label="Password"
              tooltip="Enter your account password."
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
            <Tooltip content="Keep you signed in on this device.">
              <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-pr-text-muted">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-pr-border bg-pr-bg text-pr-primary focus:ring-pr-primary"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Remember me
              </label>
            </Tooltip>
            {error && <p className="text-xs text-pr-danger/80">{error}</p>}
            <Tooltip content="Sign in and open your account vault.">
              <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Entering..." : "Sign In"}
              </Button>
            </Tooltip>
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
