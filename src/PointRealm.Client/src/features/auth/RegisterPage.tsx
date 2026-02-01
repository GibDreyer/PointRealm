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

export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      setAuthToken(response.accessToken);
      setAuthUser(response.user);
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
          <PageHeader title="Join the Order" subtitle="Register your lineage" size="panel" />
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Display name"
              type="text"
              autoComplete="nickname"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Mystic Wanderer"
            />
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
            {error && <p className="text-xs text-pr-danger/80">{error}</p>}
            <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>
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
