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
    <RealmShell className="justify-center overflow-hidden">
       {/* Focal Glow */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pr-primary/[0.05] rounded-full blur-[100px] pointer-events-none z-0" />

       <motion.div 
         initial={{ opacity: 0, scale: 0.98 }}
         animate={{ opacity: 1, scale: 1 }}
         className="w-full max-w-lg mx-auto relative z-10 py-8"
       >
          <Panel className="relative">
              {/* Header */}
              <header className="mb-10 text-center relative">
                  <Link to="/" className="absolute left-0 top-1.5 text-pr-text-muted/60 hover:text-pr-primary transition-all duration-300 hover:-translate-x-1" title="Back to Home">
                      <ArrowLeft size={18} />
                  </Link>
                  <SectionHeader 
                    title="Enter Realm" 
                    subtitle="Cross the Threshold" 
                    align="center"
                    className="mb-0"
                  />
              </header>

              <div className="space-y-8">
                  {/* Realm Input */}
                  <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-pr-primary/70 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Globe size={14} className="opacity-70" /> Sigil or Gateway Link
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
                          className="w-full p-4 rounded-lg bg-pr-bg border border-pr-border/60 focus:border-pr-primary/50 focus:ring-1 focus:ring-pr-primary/30 text-pr-text transition-all duration-300 text-lg font-mono placeholder:font-sans placeholder:text-xs placeholder:tracking-[0.1em] uppercase shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                          disabled={isLoading}
                      />
                      {inputError && <p className="text-[10px] font-bold uppercase tracking-widest text-pr-danger mt-1.5">{inputError}</p>}
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-pr-primary/70 uppercase tracking-[0.2em] flex items-center gap-2">
                          <User size={14} className="opacity-70" /> Identity Inscription
                      </label>
                      <input 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          onBlur={handleNameBlur}
                          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleJoin()}
                          placeholder="Name your adventurer" 
                          className="w-full p-4 rounded-lg bg-pr-bg border border-pr-border/60 focus:border-pr-primary/50 focus:ring-1 focus:ring-pr-primary/30 text-pr-text transition-all duration-300 text-lg placeholder:text-xs placeholder:tracking-[0.1em] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                          disabled={isLoading}
                      />
                  </div>

                  <RoleToggle 
                      value={role} 
                      onChange={setRole} 
                      disabled={isLoading}
                  />

                  {error && (
                      <div className="p-5 rounded-lg bg-pr-danger/10 border border-pr-danger/30 text-pr-danger text-sm flex items-start gap-4 shadow-lg">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
                          <div>
                              <strong className="block text-xs uppercase tracking-[0.2em] font-black pb-1">The portal resists</strong>
                              <span className="text-[11px] font-bold italic opacity-70 leading-relaxed">{error}</span>
                          </div>
                      </div>
                  )}

                  <Button 
                      onClick={() => handleJoin()}
                      disabled={isLoading || !realmInput.trim() || !displayName.trim()}
                      fullWidth
                      variant="primary"
                      className="py-8 shadow-glow-primary group"
                  >
                      {isLoading ? (
                          <>
                              <Loader2 className="animate-spin mr-3 opacity-80" size={20} />
                              <span className="tracking-[0.2em] font-black uppercase">Opening Portal...</span>
                          </>
                      ) : (
                          <>
                              <span className="tracking-[0.2em] font-black uppercase">Enter the Realm</span>
                              <ArrowRight className="ml-3 transition-transform group-hover:translate-x-1.5 duration-300 opacity-80" size={20} />
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
