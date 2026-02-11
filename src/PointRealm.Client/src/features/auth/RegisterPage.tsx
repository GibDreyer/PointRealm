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
import { setAuthSession, setAuthUser } from "@/lib/storage/auth";
import { Tooltip } from "@/components/ui/Tooltip";
import { useThemeMode } from "@/theme/ThemeModeProvider";

export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mode } = useThemeMode();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayNamePlaceholder = mode.key === 'fantasy'
    ? "Mystic Wanderer"
    : mode.key === 'sci-fi'
      ? "Pilot Nova"
      : "Alex Morgan";
  const registerTitle = mode.key === 'fantasy'
    ? "Join the Order"
    : mode.key === 'sci-fi'
      ? "Create Crew Profile"
      : "Create Account";
  const registerSubtitle = mode.key === 'fantasy'
    ? "Register your lineage"
    : mode.key === 'sci-fi'
      ? "Initialize your profile"
      : "Set up your profile";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      const message = "Password must be at least 8 characters.";
      setError(message);
      toast(message, "error");
      return;
    }

    if (password !== confirmPassword) {
      const message = "Passwords do not match.";
      setError(message);
      toast(message, "error");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const trimmedDisplayName = displayName.trim();
      const response = await authApi.register({
        email,
        password,
        displayName: trimmedDisplayName || email,
      });
      setAuthSession({ token: response.accessToken, expiresAt: response.expiresAt, persist: false });
      setAuthUser(response.user, { persist: false });
      toast("Account created!", "success");
      navigate("/account");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Registration failed.";
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
          <PageHeader title={registerTitle} subtitle={registerSubtitle} size="panel" />
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Display name"
              tooltip="Shown in realms. You can change this later."
              type="text"
              autoComplete="nickname"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={displayNamePlaceholder}
            />
            <Input
              label="Email"
              tooltip="We'll use this to sign you in."
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="mage@pointrealm.app"
              required
            />
            <Input
              label="Password"
              tooltip="At least 8 characters."
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
            <Input
              label="Confirm password"
              tooltip="Re-enter your password to confirm."
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
            {error && <p className="text-xs text-pr-danger/80">{error}</p>}
            <Tooltip content={`Create your account and jump into ${mode.phrases.lobbyTitle.toLowerCase()}.`}>
              <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Account"}
              </Button>
            </Tooltip>
          </form>
          <div className="mt-6 text-center text-xs text-pr-text-muted">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/auth/login")}
              className="text-pr-primary hover:text-pr-primary-light underline underline-offset-4"
            >
              Sign in
            </button>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
