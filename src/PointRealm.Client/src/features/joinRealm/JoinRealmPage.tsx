import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Eye, Shield, Loader2 } from 'lucide-react';

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
import { RecentRealmsList } from './components/RecentRealmsList';
import { Button } from '../../components/Button';
import { PageShell } from '../../components/shell/PageShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageFooter } from '../../components/ui/PageFooter';
import styles from './joinRealm.module.css';

export type RealmRole = 'participant' | 'observer';

export function JoinRealmPage() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const tipUrl = import.meta.env.VITE_TIP_JAR_URL || '/tip';
  const tipIsExternal = /^https?:\/\//i.test(tipUrl);

  const [displayName, setDisplayName] = useState('');
  const [realmInput, setRealmInput] = useState('');
  const [role, setRole] = useState<RealmRole>('participant');

  const [recentRealms, setRecentRealms] = useState<RecentRealmItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem(STORAGE_KEYS.DISPLAY_NAME) || getProfile().lastDisplayName;
    if (savedName) setDisplayName(savedName);
    setRecentRealms(getRecentRealms());
  }, []);

  const handleNameBlur = () => {
    if (displayName.trim()) {
      localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, displayName.trim());
      updateProfile({ lastDisplayName: displayName.trim() });
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

    setIsLoading(true);

    try {
      const response = await api.post<any>(`/realms/${code}/join`, {
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
    } catch (err: any) {
      console.error(err);
      let msg = 'Unable to join the realm.';
      const status = err.status;

      if (status === 404) {
        msg = 'That realm does not exist.';
      } else if (status === 410) {
        msg = 'That invite has expired. Ask the host for a new link.';
      } else if (status === 429) {
        msg = 'Too many attempts. Try again shortly.';
      } else if (!status && (err.message === 'Failed to fetch' || err.message === 'Network Error')) {
        msg = 'Network error. Check your connection.';
      } else if (err.data?.detail) {
        msg = err.data.detail;
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
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
      backgroundDensity="medium"
      reducedMotion={prefersReducedMotion}
      contentClassName={styles.page}
    >
      <motion.section
        className={styles.panel}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: 'easeOut' }}
      >
        <PageHeader
          title="Enter the Realm"
          subtitle="Join a session."
          size="panel"
          className={styles.header}
        />

        {error && (
          <div className={styles.error} role="alert">
            <span className={styles.errorTitle}>Unable to join</span>
            <span className={styles.errorMessage}>{error}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleJoin(); }}>
          <div className={styles.field}>
            <label className={styles.label}>Realm Code or Link</label>
            <p className={styles.helper}>Paste an invite or enter a realm code</p>
            <input
              value={realmInput}
              onChange={(e) => {
                setRealmInput(e.target.value);
                if (inputError) setInputError(null);
              }}
              onPaste={handlePaste}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleJoin()}
              placeholder="Realm code or link"
              className={styles.input}
              disabled={isLoading}
            />
            {inputError && <p className={styles.errorInline}>{inputError}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Display Name</label>
            <p className={styles.helper}>How the party will see you</p>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleJoin()}
              placeholder="e.g. Archmage"
              className={styles.input}
              disabled={isLoading}
            />
          </div>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Choose Your Role</h2>
              <p className={styles.sectionSubtitle}>How you will enter the realm</p>
            </div>
            <div className={styles.roleGrid} role="radiogroup" aria-label="Choose your role">
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
            </div>
          </section>

          <div className={styles.actions}>
            <Button
              onClick={() => handleJoin()}
              disabled={isLoading || !realmInput.trim() || !displayName.trim()}
              fullWidth
              variant="ghost"
              className={`${styles.primaryButton} normal-case text-base sm:text-lg tracking-[0.08em]`}
            >
              {isLoading ? (
                <>
                  <Loader2 className={styles.spinner} />
                  Joining...
                </>
              ) : (
                'Join Realm'
              )}
            </Button>
          </div>
        </form>
      </motion.section>

      <RecentRealmsList
        realms={recentRealms}
        onSelect={handleRecentSelect}
        onForget={handleForgetRecent}
        onClearAll={handleClearAllRecent}
      />

      <PageFooter
        tipUrl={tipUrl}
        tipIsExternal={tipIsExternal}
        className={styles.footer}
        backLinkLabel="Back to Tavern"
        onBackClick={() => navigate('/')}
      />
    </PageShell>
  );
}
