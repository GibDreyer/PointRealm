import { useEffect, useState } from "react";
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
import {
  clearAuthToken,
  clearAuthUser,
  getAuthToken,
  getAuthUser,
  setAuthUser,
} from "@/lib/storage/auth";

export function AccountPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token] = useState(getAuthToken());
  const [user, setUser] = useState(getAuthUser());
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl ?? "");
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    authApi
      .whoami()
      .then((data) => {
        if (!isMounted) return;
        setUser(data);
        setAuthUser(data);
        setDisplayName(data.displayName ?? "");
        setProfileImageUrl(data.profileImageUrl ?? "");
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err instanceof ApiError && err.status === 401) {
          clearAuthToken();
          clearAuthUser();
          setUser(null);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load account.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      const updated = await authApi.updateProfile({
        displayName: displayName || null,
        profileImageUrl: profileImageUrl || null,
      });
      setUser(updated);
      setAuthUser(updated);
      toast("Profile updated.", "success");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update profile.";
      setError(message);
      toast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore server logout failures
    }
    clearAuthToken();
    clearAuthUser();
    setUser(null);
    toast("Signed out.", "info");
    navigate("/");
  };

  if (!token) {
    return (
      <PageShell backgroundDensity="medium">
        <BackButton to="/" />
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Panel variant="realm" className="max-w-md w-full p-8 text-center">
            <PageHeader title="Account Vault" subtitle="Your profile awaits" size="panel" />
            <p className="mt-6 text-sm text-pr-text-muted">
              Create an account to keep your realms and profile details in sync across devices.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button variant="primary" onClick={() => navigate("/auth/login")}>
                Sign In
              </Button>
              <Button variant="secondary" onClick={() => navigate("/auth/register")}>
                Create Account
              </Button>
            </div>
          </Panel>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell backgroundDensity="medium">
      <BackButton to="/" />
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Panel variant="realm" className="max-w-md w-full p-8">
          <PageHeader title="Account Vault" subtitle="Steward your profile" size="panel" />
          {isLoading ? (
            <p className="mt-6 text-sm text-pr-text-muted">Summoning your profile...</p>
          ) : (
            <>
              {user && (
                <div className="mt-6 rounded-lg border border-pr-border/50 bg-pr-surface/40 p-4 text-xs">
                  <p className="text-pr-text-muted uppercase tracking-[0.2em]">Signed in as</p>
                  <p className="mt-2 text-sm text-pr-text">{user.email}</p>
                </div>
              )}
              <form className="mt-6 space-y-4" onSubmit={handleSave}>
                <Input
                  label="Display name"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Mystic Wanderer"
                />
                <Input
                  label="Profile image URL"
                  type="url"
                  value={profileImageUrl}
                  onChange={(event) => setProfileImageUrl(event.target.value)}
                  placeholder="https://..."
                />
                {profileImageUrl && (
                  <img
                    src={profileImageUrl}
                    alt="Profile preview"
                    className="h-20 w-20 rounded-full border border-pr-border/40 object-cover"
                  />
                )}
                {error && <p className="text-xs text-pr-danger/80">{error}</p>}
                <Button type="submit" variant="primary" fullWidth disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </form>
              <div className="mt-6">
                <Button variant="ghost" fullWidth onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            </>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
