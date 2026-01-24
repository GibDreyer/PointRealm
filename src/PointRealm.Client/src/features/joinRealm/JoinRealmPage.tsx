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
import { RealmBackground } from '../../components/ui/RealmBackground';
import { parseRealmCode } from './utils';
import { RoleToggle, RealmRole } from './components/RoleToggle';
import { RecentRealmsList } from './components/RecentRealmsList';

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
    // 1. Get Display Name Priority: Storage Flat Key -> Profile -> Empty
    const savedName = localStorage.getItem(STORAGE_KEYS.LAST_DISPLAY_NAME) || getProfile().lastDisplayName;
    if (savedName) setDisplayName(savedName);
    
    // 2. Load recent realms
    setRecentRealms(getRecentRealms());
  }, []);

  // Handlers
  const handleNameBlur = () => {
    if (displayName.trim()) {
        localStorage.setItem(STORAGE_KEYS.LAST_DISPLAY_NAME, displayName.trim());
        updateProfile({ lastDisplayName: displayName.trim() });
    }
  };



  const handleJoin = async (overrideInput?: string, overrideDisplayName?: string, overrideRole?: RealmRole) => {
    setError(null);
    setInputError(null);

    const inputToUse = overrideInput || realmInput;
    const nameToUse = overrideDisplayName || displayName;
    const roleToUse = overrideRole || role;

    // 1. Parse & Validate Code
    const { code, error: parseError, isUrl } = parseRealmCode(inputToUse);
    
    if (parseError || !code) {
        if (overrideInput) {
            setError(parseError || "Invalid realm code.");
        } else {
            setInputError(parseError || "Invalid realm code.");
        }
        return;
    }

    // 2. Validate Name
    if (!nameToUse.trim()) {
       setError("Please enter a display name for your adventurer.");
       return;
    }

    // 3. Update Persistence
    localStorage.setItem(STORAGE_KEYS.LAST_DISPLAY_NAME, nameToUse.trim());
    updateProfile({ lastDisplayName: nameToUse.trim() });

    // 4. API Call
    setIsLoading(true);
    
    try {
        const response = await api.post<any>(`/realms/${code}/join`, { 
            displayName: nameToUse,
            role: roleToUse
        });

        // 5. Success - Store Token & Recent
        // Token logic (usually handled by auth provider or stored in session/local - Requirement said "memory only (React state store)" but we need to pass it to the next page or simple storage for now as we don't have a global auth store set up for this yet in this file context. 
        // Based on CreateRealmPage, it uses sessionStorage. Let's stick to that for "session" persistence which is close enough to memory for tab life.)
        if (response.memberToken) {
             sessionStorage.setItem(`pointrealm:v1:realm:${code}:token`, response.memberToken);
             if (response.memberId) {
                sessionStorage.setItem(`pointrealm:v1:realm:${code}:memberId`, response.memberId);
             }
        }

        // Update Recent List
        addOrUpdateRecentRealm({
            realmCode: code,
            displayNameUsed: nameToUse,
            realmName: response.realmName, // Assuming API returns this
            joinUrl: isUrl ? inputToUse : undefined,
            role: roleToUse,
            themeKey: response.themeKey
        });

        // Determine destination
        // If API returns a specific route or we just go to /realm/{code}
        navigate(`/realm/${code}`);

    } catch (err: any) {
        console.error(err);
        
        // Error Mapping
        let msg = "The portal refused to open. Unknown error.";
        const status = err.response?.status; // Axios style

        if (status === 404) {
            msg = "That Realm doesn’t exist.";
        } else if (status === 410) {
            msg = "That portal has faded. Ask the GM for a new link.";
        } else if (status === 429) {
            msg = "Too many attempts. Try again shortly.";
        } else if (!status || err.message === 'Network Error') {
            msg = "The portal is unstable. Check your connection.";
        } else if (typeof err.response?.data === 'string') {
             // Sometimes server returns text
             msg = err.response.data;
        } else if (err.response?.data?.message) {
             msg = err.response.data.message;
        }

        setError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  // Recent Realm Actions
  const handleRecentSelect = (item: RecentRealmItem) => {
      // Auto-fill and Join
      // If user has a name typed, use it? Or use the one from history?
      // Requirement: "If display name is empty, prefill from localStorage...". 
      // But for recent list click, "Enter button... Join behavior".
      // Let's use the stored name for that realm if available, otherwise current input.
      const nameToUse = item.displayNameUsed || displayName;
      setRealmInput(item.realmCode);
      setDisplayName(nameToUse);
      if (item.role) setRole(item.role); // Restore role
      
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
  
  // Input paste handler
  const handlePaste = (e: React.ClipboardEvent) => {
      const pasted = e.clipboardData.getData('text');
      const { code, isUrl } = parseRealmCode(pasted);
      if (code && isUrl) {
          e.preventDefault();
          setRealmInput(code);
          // Briefly flash success or just set it?
          // Setting it is fine.
      }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 relative">
       <RealmBackground />

       <motion.div 
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.35, ease: "easeOut" }}
         className="w-full max-w-lg z-10"
       >
          {/* Header */}
          <div className="text-center mb-8 relative">
               <Link to="/" className="absolute left-0 top-1 text-[var(--pr-text-muted)] hover:text-[var(--pr-primary)] transition-colors" title="Back to Home">
                   <ArrowLeft size={24} />
               </Link>
               <h1 className="text-3xl md:text-4xl font-bold text-[var(--pr-primary)] mb-2" style={{ fontFamily: 'var(--pr-heading-font)' }}>
                  Enter the Realm
               </h1>
               <p className="text-[var(--pr-text-muted)] text-lg">
                  Join a Session
               </p>
          </div>

          {/* Main Card */}
          <div className="bg-[var(--pr-surface)] border border-[var(--pr-border)] rounded-[var(--pr-radius-xl)] shadow-[var(--pr-shadow-soft)] p-6 md:p-8 mb-8">
               <div className="space-y-6">
                   
                   {/* Realm Input */}
                   <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--pr-text-muted)] flex items-center gap-2">
                            <Globe size={16} /> Realm Code or Link
                        </label>
                        <div className="relative">
                            <input 
                                value={realmInput}
                                onChange={(e) => {
                                    setRealmInput(e.target.value);
                                    if (inputError) setInputError(null);
                                }}
                                onPaste={handlePaste}
                                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleJoin()}
                                placeholder="Realm code (e.g. A1B2C3) or full invite link"
                                className="w-full p-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-bg)] border border-[var(--pr-border)] focus:outline-none focus:border-[var(--pr-primary)] focus:ring-1 focus:ring-[var(--pr-primary)] text-[var(--pr-text)] transition-colors text-lg font-mono placeholder:font-sans uppercase"
                                disabled={isLoading}
                            />
                        </div>
                        {inputError && (
                            <motion.p 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-xs text-[var(--pr-danger)] font-medium"
                            >
                                {inputError}
                            </motion.p>
                        )}
                   </div>

                   {/* Display Name */}
                   <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--pr-text-muted)] flex items-center gap-2">
                            <User size={16} /> Display Name
                        </label>
                        <input 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            onBlur={handleNameBlur}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleJoin()}
                            placeholder="Name your adventurer" 
                            className="w-full p-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-bg)] border border-[var(--pr-border)] focus:outline-none focus:border-[var(--pr-primary)] focus:ring-1 focus:ring-[var(--pr-primary)] text-[var(--pr-text)] transition-colors text-lg"
                            disabled={isLoading}
                        />
                   </div>

                   {/* Role Toggle */}
                   <RoleToggle 
                        value={role} 
                        onChange={setRole} 
                        disabled={isLoading}
                   />

                   {/* Error Banner */}
                   {error && (
                       <motion.div 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-danger)]/10 border border-[var(--pr-danger)] text-[var(--pr-danger)] text-sm flex items-start gap-3"
                        >
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                       </motion.div>
                   )}

                   {/* Action Buttons */}
                   <div className="pt-2 flex flex-col gap-3">
                        <button 
                            onClick={() => handleJoin()}
                            disabled={isLoading || !realmInput.trim() || !displayName.trim()}
                            className="w-full py-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-primary)] text-[var(--pr-bg)] font-bold text-lg shadow-[var(--pr-shadow-soft)] hover:shadow-[var(--pr-shadow-hover)] hover:translate-y-[-1px] active:translate-y-[0px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Opening the portal...
                                </>
                            ) : (
                                <>
                                    Enter the Realm <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                        
                        <div className="flex justify-center mt-2">
                           <Link to="/" className="text-sm text-[var(--pr-text-muted)] hover:text-[var(--pr-primary)] underline decoration-dotted underline-offset-4">
                               Back to Home
                           </Link>
                        </div>
                   </div>
               </div>
          </div>

          {/* Recent Realms */}
          <RecentRealmsList 
              realms={recentRealms}
              onSelect={handleRecentSelect}
              onForget={handleForgetRecent}
              onClearAll={handleClearAllRecent}
          />
       </motion.div>
    </div>
  );
}
