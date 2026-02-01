import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { ApiError } from "@/api/client";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/shell/PageShell";
import { BackButton } from "@/components/ui/BackButton";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/ui/ToastSystem";
import { Tooltip } from "@/components/ui/Tooltip";
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
  const [profileImageInput, setProfileImageInput] = useState(
    user?.profileImageUrl && user.profileImageUrl.startsWith("data:") ? "" : user?.profileImageUrl ?? ""
  );
  const [profileEmoji, setProfileEmoji] = useState(user?.profileEmoji ?? "");
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const maxImageSizeBytes = 1_048_576;

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
        setProfileImageInput(
          data.profileImageUrl && data.profileImageUrl.startsWith("data:") ? "" : data.profileImageUrl ?? ""
        );
        setProfileEmoji(data.profileEmoji ?? "");
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
        profileEmoji: profileEmoji || null,
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxImageSizeBytes) {
      setImageError("Profile image must be 1MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() ?? "";
      setProfileImageUrl(result);
      setProfileImageInput("");
      setImageError(null);
    };
    reader.onerror = () => {
      setImageError("Unable to read that image.");
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setProfileImageUrl("");
    setProfileImageInput("");
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
              <Tooltip content="Sign in to sync your profile across devices.">
                <Button variant="primary" onClick={() => navigate("/auth/login")}>
                  Sign In
                </Button>
              </Tooltip>
              <Tooltip content="Create a new account to save your profile.">
                <Button variant="secondary" onClick={() => navigate("/auth/register")}>
                  Create Account
                </Button>
              </Tooltip>
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
                  tooltip="This is how others will see you in realms."
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Mystic Wanderer"
                />
                <Input
                  label="Profile image URL"
                  tooltip="Paste a link to a public avatar image."
                  type="url"
                  value={profileImageInput}
                  onChange={(event) => {
                    setProfileImageInput(event.target.value);
                    setProfileImageUrl(event.target.value);
                    setImageError(null);
                  }}
                  placeholder="https://..."
                />
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-pr-text-muted">
                    Upload profile image (max 1MB)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2 block w-full text-xs text-pr-text-muted file:mr-4 file:rounded-md file:border-0 file:bg-pr-primary/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-pr-primary hover:file:bg-pr-primary/30"
                    />
                  </label>
                  {profileImageUrl && (
                    <div className="flex items-center gap-3">
                      <img
                        src={profileImageUrl}
                        alt="Profile preview"
                        className="h-20 w-20 rounded-full border border-pr-border/40 object-cover"
                      />
                      <Button type="button" variant="ghost" onClick={handleClearImage}>
                        Remove image
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-pr-text-muted">
                    Or choose an emoji
                  </p>
                  <EmojiPicker selectedEmoji={profileEmoji || null} onSelect={setProfileEmoji} />
                  {profileEmoji && (
                    <Button type="button" variant="ghost" onClick={() => setProfileEmoji("")}>
                      Clear emoji
                    </Button>
                  )}
                </div>
                {!profileImageUrl && profileEmoji && (
                  <div className="h-20 w-20 rounded-full border border-pr-border/40 bg-pr-surface/40 flex items-center justify-center text-3xl">
                    <span aria-label="Profile emoji preview">{profileEmoji}</span>
                  </div>
                )}
                {imageError && <p className="text-xs text-pr-danger/80">{imageError}</p>}
                {error && <p className="text-xs text-pr-danger/80">{error}</p>}
                <Tooltip content="Save your updated profile details.">
                  <Button type="submit" variant="primary" fullWidth disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Profile"}
                  </Button>
                </Tooltip>
              </form>
              <div className="mt-6">
                <Tooltip content="Sign out and return to the tavern.">
                  <Button variant="ghost" fullWidth onClick={handleLogout}>
                    Sign Out
                  </Button>
                </Tooltip>
              </div>
            </>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
