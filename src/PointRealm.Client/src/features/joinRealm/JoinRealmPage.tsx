import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Eye, Shield, Loader2, Edit2, Check, Sparkles } from 'lucide-react';

import { api } from '../../api/client';
import {
  getProfile,
  getRecentRealms,
  updateProfile,
  addOrUpdateRecentRealm,
  removeRecentRealm,
  clearRecentRealms,
  RecentRealmItem,
  STORAGE_KEYS
} from '../../lib/storage';
import { parseRealmCode } from './utils';
import { generateRandomDisplayName } from '@/lib/realmNames';
import { RecentRealmsList } from './components/RecentRealmsList';
import { Button } from '../../components/Button';
import { PageShell } from '../../components/shell/PageShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageFooter } from '../../components/ui/PageFooter';
import { BackButton } from '../../components/ui/BackButton';
import { Panel } from '../../components/ui/Panel';
import { Input } from '../../components/ui/Input';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Tooltip } from '../../components/ui/Tooltip';
import { useAuth } from '../auth/AuthContext';
import { authApi } from '@/api/auth';
import { formatThemeCopy, useThemeMode } from '@/theme/ThemeModeProvider';
import styles from './joinRealm.module.css';

export type RealmRole = 'participant' | 'observer';

interface JoinRealmResponse {
  memberToken?: string;
  memberId?: string;
  realmName?: string;
  themeKey?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getJoinErrorMessage = (error: unknown) => {
  const record = isRecord(error) ? error : null;
  const status = record && typeof record.status === 'number' ? record.status : undefined;
  const message = record && typeof record.message === 'string' ? record.message : undefined;
  const data = record && isRecord(record.data) ? record.data : null;
  const detail = data && typeof data.detail === 'string' ? data.detail : undefined;

  if (status === 404) return 'That realm does not exist.';
  if (status === 410) return 'That invite has expired. Ask the host for a new link.';
  if (status === 429) return 'Too many attempts. Try again shortly.';
  if (!status && (message === 'Failed to fetch' || message === 'Network Error')) {
    return 'Network error. Check your connection.';
  }
  return detail ?? message ?? 'Unable to join the realm.';
};

export function JoinRealmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const tipUrl = import.meta.env.VITE_TIP_JAR_URL || '/tip';
  const tipIsExternal = /^https?:\/\//i.test(tipUrl);
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { mode } = useThemeMode();

  const [displayName, setDisplayName] = useState('');
  const [realmInput, setRealmInput] = useState(searchParams.get('realmCode') || '');
  const [role, setRole] = useState<RealmRole>('participant');

  const [recentRealms, setRecentRealms] = useState<RecentRealmItem[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedName = (isAuthenticated && user?.displayName) 
      ? user.displayName 
      : (localStorage.getItem(STORAGE_KEYS.DISPLAY_NAME) || getProfile().lastDisplayName);
    if (savedName) setDisplayName(savedName);
    setRecentRealms(getRecentRealms());
  }, [isAuthenticated, user?.displayName]);

  useEffect(() => {
    const codeFromUrl = searchParams.get('realmCode');
    if (codeFromUrl) {
      setRealmInput(codeFromUrl);
    }
  }, [searchParams]);

  const handleNameBlur = () => {
    if (displayName.trim()) {
      localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, displayName.trim());
      updateProfile({ lastDisplayName: displayName.trim() });
    }
  };

  const handleSaveProfileName = async () => {
    if (!displayName || displayName === user?.displayName) {
      setIsEditingName(false);
      return;
    }

    setIsUpdatingName(true);
    try {
      await authApi.updateProfile({ displayName: displayName });
      await refreshUser();
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update profile name:", err);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleJoin = async (overrideInput?: string, overrideDisplayName?: string, overrideRole?: RealmRole) => {
    setError(null);
    setInputError(null);

    const inputToUse = overrideInput || realmInput;
    const nameToUse = overrideDisplayName || displayName;
    const roleToUse = overrideRole || role;

    const { code, error: parseError, isUrl } = parseRealmCode(inputToUse);

    if (parseError || !code) {
      if (overrideInput) {
        setError(parseError || 'Invalid realm code.');
      } else {
        setInputError(parseError || 'Invalid realm code.');
      }
      return;
    }

    if (!nameToUse.trim()) {
      setError('Please enter a display name.');
      return;
    }

    localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, nameToUse.trim());
    updateProfile({ lastDisplayName: nameToUse.trim() });

    if (isAuthenticated && nameToUse.trim() !== user?.displayName) {
      try {
        await authApi.updateProfile({ displayName: nameToUse.trim() });
        await refreshUser();
      } catch (err) {
        console.error("Failed to update account profile:", err);
      }
    }

    setIsLoading(true);

    try {
      const response = await api.post<JoinRealmResponse>(`/realms/${code}/join`, {
        displayName: nameToUse,
        role: roleToUse
      });

      if (response.memberToken) {
        sessionStorage.setItem(`pointrealm:v1:realm:${code}:token`, response.memberToken);
        if (response.memberId) {
          sessionStorage.setItem(`pointrealm:v1:realm:${code}:memberId`, response.memberId);
        }
      }

      addOrUpdateRecentRealm({
        realmCode: code,
        displayNameUsed: nameToUse,
        realmName: response.realmName,
        joinUrl: isUrl ? inputToUse : undefined,
        role: roleToUse,
        themeKey: response.themeKey
      });

      navigate(`/realm/${code}`);
    } catch (err) {
      console.error(err);
      setError(getJoinErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecentSelect = (item: RecentRealmItem) => {
    const nameToUse = item.displayNameUsed || displayName;
    setRealmInput(item.realmCode);
    setDisplayName(nameToUse);
    if (item.role) setRole(item.role as RealmRole);
    handleJoin(item.realmCode, nameToUse, (item.role as RealmRole) || 'participant');
  };

  const handleForgetRecent = (code: string) => {
    removeRecentRealm(code);
    setRecentRealms(getRecentRealms());
  };

  const handleClearAllRecent = () => {
    if (confirm('Clear all visited realms?')) {
      clearRecentRealms();
      setRecentRealms([]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text');
    const { code, isUrl } = parseRealmCode(pasted);
    if (code && isUrl) {
      e.preventDefault();
      setRealmInput(code);
    }
  };

  return (
    <PageShell
      backgroundDensity="low"
      reducedMotion={prefersReducedMotion}
      className="relative"
      contentClassName={styles.page}
    >
      <BackButton to="/" />
      
      <div className={styles.container}>
        <motion.div
          className={styles.mainContent}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: 'easeOut' }}
        >
          <Panel variant="realm" className={styles.panel}>
            <div className={styles.panelInner}>
              <PageHeader
                title={formatThemeCopy("Enter the {realm}", mode.labels)}
                subtitle={formatThemeCopy("Join a {realm} session.", mode.labels)}
                size="panel"
                className={styles.header || ''}
              />

              {error && (
                <div className={styles.error} role="alert">
                  <span className={styles.errorTitle}>Unable to join</span>
                  <span className={styles.errorMessage}>{error}</span>
                </div>
              )}

              <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleJoin(); }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  <div className={styles.field}>
                    <Input
                      label={formatThemeCopy("{realm} Code or Link", mode.labels)}
                      tooltip={formatThemeCopy("Paste a full invite link or a short {realm} code.", mode.labels)}
                      helper="Paste an invite"
                      value={realmInput}
                      onChange={(e) => {
                        setRealmInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      onPaste={handlePaste}
                      onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleJoin()}
                      placeholder={formatThemeCopy("{realm} code...", mode.labels)}
                      disabled={isLoading}
                      error={inputError || undefined}
                      className="bg-black/20"
                    />
                  </div>

                  <div className={styles.field}>
                    <Input
                      label="Display Name"
                      tooltip={isAuthenticated ? "This is your permanent account identity." : `Your name as it appears to the ${mode.labels.party.toLowerCase()}.`}
                      helper={isAuthenticated ? "Updates account profile" : `${mode.labels.party} alias`}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onBlur={handleNameBlur}
                      onKeyDown={(e) => e.key === 'Enter' && !isLoading && !isUpdatingName && handleJoin()}
                      placeholder={isAuthenticated ? user?.displayName || "Your Name" : "e.g. Archmage"}
                      disabled={isLoading || isUpdatingName}
                      readOnly={isAuthenticated && !isEditingName}
                      className="bg-black/20"
                      rightElement={isAuthenticated ? (
                        isEditingName ? (
                          <Tooltip content="Confirm and save name to your profile">
                            <button
                              type="button"
                              className={styles.randomizeBtn}
                              onClick={handleSaveProfileName}
                              disabled={isUpdatingName}
                              aria-label="Save name"
                            >
                              {isUpdatingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                          </Tooltip>
                        ) : (
                          <Tooltip content="Linked to account. Click to change your profile name.">
                            <button
                              type="button"
                              className={styles.randomizeBtn}
                              onClick={() => setIsEditingName(true)}
                              aria-label="Edit name"
                            >
                              <Edit2 size={16} />
                            </button>
                          </Tooltip>
                        )
                      ) : (
                        <Tooltip content="Generate a fantasy adventurer name.">
                          <button
                            type="button"
                            className={styles.randomizeBtn}
                            onClick={() => setDisplayName(generateRandomDisplayName())}
                            aria-label="Generate random display name"
                          >
                            <Sparkles size={16} />
                          </button>
                        </Tooltip>
                      )}
                    />
                  </div>
                </div>

                <section className={styles.section}>
                  <SectionHeader 
                      title="Role" 
                      subtitle="Choose your role" 
                      className="mb-2"
                  />
                  <div className={styles.roleGrid} role="radiogroup" aria-label="Choose your role">
                    <Tooltip content="Participants can vote and help estimate quests.">
                      <button
                        type="button"
                        className={role === 'participant' ? `${styles.roleCard} ${styles.roleCardActive}` : styles.roleCard}
                        onClick={() => setRole('participant')}
                        disabled={isLoading}
                        role="radio"
                        aria-checked={role === 'participant'}
                      >
                        <div className={styles.roleIcon} aria-hidden="true">
                          <Shield />
                        </div>
                        <div className={styles.roleText}>
                          <span className={styles.roleTitle}>Participant</span>
                          <span className={styles.roleDescription}>Vote and take part in encounters</span>
                        </div>
                      </button>
                    </Tooltip>
                    <Tooltip content="Observers can watch the session without casting votes.">
                      <button
                        type="button"
                        className={role === 'observer' ? `${styles.roleCard} ${styles.roleCardActive}` : styles.roleCard}
                        onClick={() => setRole('observer')}
                        disabled={isLoading}
                        role="radio"
                        aria-checked={role === 'observer'}
                      >
                        <div className={styles.roleIcon} aria-hidden="true">
                          <Eye />
                        </div>
                        <div className={styles.roleText}>
                          <span className={styles.roleTitle}>Observer</span>
                          <span className={styles.roleDescription}>Watch without voting</span>
                        </div>
                      </button>
                    </Tooltip>
                  </div>
                </section>

                <div className="pt-4">
                  <Tooltip content={formatThemeCopy("Connect to the {realm} with the selected role and name.", mode.labels)}>
                    <Button
                      onClick={() => handleJoin()}
                      disabled={isLoading || !realmInput.trim() || !displayName.trim()}
                      fullWidth
                      variant="primary"
                      className="h-14 text-lg tracking-[0.2em] uppercase font-bold"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className={styles.spinner} />
                          Joining...
                        </>
                      ) : (
                        formatThemeCopy("Enter {realm}", mode.labels)
                      )}
                    </Button>
                  </Tooltip>
                </div>
              </form>
            </div>
          </Panel>
        </motion.div>

        <div className={styles.sideContent}>
          <RecentRealmsList
            realms={recentRealms}
            onSelect={handleRecentSelect}
            onForget={handleForgetRecent}
            onClearAll={handleClearAllRecent}
          />
        </div>
      </div>

      <PageFooter
        tipUrl={tipUrl}
        tipIsExternal={tipIsExternal}
        className={styles.footer || ''}
      />
    </PageShell>
  );
}
