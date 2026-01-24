import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, ArrowRight, ArrowLeft, Globe, User } from 'lucide-react';

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
import { RealmShell } from '../../app/layouts/RealmShell';
import { parseRealmCode } from './utils';
import { RoleToggle, RealmRole } from './components/RoleToggle';
import { RecentRealmsList } from './components/RecentRealmsList';
import { Panel } from '../../components/ui/Panel';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Button } from '../../components/Button';

export function JoinRealmPage() {
  const navigate = useNavigate();
  
  // State
  const [displayName, setDisplayName] = useState('');
  const [realmInput, setRealmInput] = useState('');
  const [role, setRole] = useState<RealmRole>('participant');
  
  const [recentRealms, setRecentRealms] = useState<RecentRealmItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize
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
            setError(parseError || "Invalid realm code.");
        } else {
            setInputError(parseError || "Invalid realm code.");
        }
        return;
    }

    if (!nameToUse.trim()) {
       setError("Please enter a display name for your adventurer.");
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
        let msg = "The portal refused to open. Unknown error.";
        const status = err.status;

        if (status === 404) {
            msg = "That Realm doesn’t exist.";
        } else if (status === 410) {
            msg = "That portal has faded. Ask the GM for a new link.";
        } else if (status === 429) {
            msg = "Too many attempts. Try again shortly.";
        } else if (!status && (err.message === 'Failed to fetch' || err.message === 'Network Error')) {
            msg = "The portal is unstable. Check your connection.";
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
      if (item.role) setRole(item.role);
      handleJoin(item.realmCode, nameToUse, item.role || 'participant');
  };

  const handleForgetRecent = (code: string) => {
      removeRecentRealm(code);
      setRecentRealms(getRecentRealms());
  };

  const handleClearAllRecent = () => {
      if (confirm("Clear all visited realms?")) {
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
    <RealmShell className="justify-center">
       <motion.div 
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         className="w-full max-w-lg mx-auto"
       >
          <Panel className="relative">
              {/* Header */}
              <header className="mb-8 text-center relative">
                  <Link to="/" className="absolute left-0 top-1 text-pr-text-muted hover:text-pr-primary transition-colors" title="Back to Home">
                      <ArrowLeft size={20} />
                  </Link>
                  <SectionHeader 
                    title="Enter the Realm" 
                    subtitle="Join a session" 
                    align="center"
                    className="mb-0"
                  />
              </header>

              <div className="space-y-6">
                  {/* Realm Input */}
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-pr-text-muted flex items-center gap-2">
                          <Globe size={16} /> Realm Code or Link
                      </label>
                      <input 
                          value={realmInput}
                          onChange={(e) => {
                              setRealmInput(e.target.value);
                              if (inputError) setInputError(null);
                          }}
                          onPaste={handlePaste}
                          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleJoin()}
                          placeholder="CODE or LINK"
                          className="w-full p-4 rounded-[var(--pr-radius-md)] bg-pr-bg border border-pr-border focus:border-pr-primary focus:ring-1 focus:ring-pr-primary text-pr-text transition-colors text-lg font-mono placeholder:font-sans uppercase"
                          disabled={isLoading}
                      />
                      {inputError && <p className="text-xs text-pr-danger font-medium mt-1">{inputError}</p>}
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-pr-text-muted flex items-center gap-2">
                          <User size={16} /> Display Name
                      </label>
                      <input 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          onBlur={handleNameBlur}
                          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleJoin()}
                          placeholder="Name your adventurer" 
                          className="w-full p-4 rounded-[var(--pr-radius-md)] bg-pr-bg border border-pr-border focus:border-pr-primary focus:ring-1 focus:ring-pr-primary text-pr-text transition-colors text-lg"
                          disabled={isLoading}
                      />
                  </div>

                  <RoleToggle 
                      value={role} 
                      onChange={setRole} 
                      disabled={isLoading}
                  />

                  {error && (
                      <div className="p-4 rounded-[var(--pr-radius-md)] bg-pr-danger/10 border border-pr-danger text-pr-danger text-sm flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <span>{error}</span>
                      </div>
                  )}

                  <Button 
                      onClick={() => handleJoin()}
                      disabled={isLoading || !realmInput.trim() || !displayName.trim()}
                      fullWidth
                      variant="primary"
                      className="py-4 text-lg"
                  >
                      {isLoading ? (
                          <>
                              <Loader2 className="animate-spin mr-2" size={20} />
                              Opening Portal...
                          </>
                      ) : (
                          <>
                              Enter the Realm <ArrowRight className="ml-2" size={20} />
                          </>
                      )}
                  </Button>
              </div>
          </Panel>

          {/* Recent Realms Section */}
          <div className="mt-8">
              <RecentRealmsList 
                  realms={recentRealms}
                  onSelect={handleRecentSelect}
                  onForget={handleForgetRecent}
                  onClearAll={handleClearAllRecent}
              />
          </div>
       </motion.div>
    </RealmShell>
  );
}
