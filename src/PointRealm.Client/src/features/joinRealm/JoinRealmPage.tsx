import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { getProfile, getRecentRealms, updateProfile, addOrUpdateRecentRealm, removeRecentRealm, clearRecentRealms, RecentRealmItem } from '../../lib/storage';
import { Trash2, History, ArrowRight, X, Globe, User } from 'lucide-react';

function timeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

export function JoinRealmPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [realmInput, setRealmInput] = useState('');
  const [recentRealms, setRecentRealms] = useState<RecentRealmItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const profile = getProfile();
    if (profile.lastDisplayName) setDisplayName(profile.lastDisplayName);
    
    // Refresh list on mount
    setRecentRealms(getRecentRealms());
  }, []);

  const handleNameBlur = () => {
    if (displayName.trim()) {
      updateProfile({ lastDisplayName: displayName.trim() });
    }
  };

  const parseRealmInput = (input: string): { code: string, joinUrl?: string } => {
    const trimmed = input.trim();
    if (trimmed.startsWith('http')) {
        try {
            const url = new URL(trimmed);
            // Attempt to grab the last segment as the code
            const segments = url.pathname.split('/').filter(Boolean);
            const segment = segments[segments.length - 1];
            if (segments.length > 0 && segment) {
                return { code: segment, joinUrl: trimmed };
            }
        } catch {
            // Fallback if URL parsing fails
        }
    }
    return { code: trimmed };
  };

  const handleJoin = async (overrideInput?: string, overrideDisplayName?: string) => {
    setError(null);
    setIsLoading(true);

    const inputToUse = overrideInput || realmInput;
    const nameToUse = overrideDisplayName || displayName;

    const { code, joinUrl } = parseRealmInput(inputToUse);
    
    if (!code) {
      setError('Please enter a realm code or URL.');
      setIsLoading(false);
      return;
    }

    if (!nameToUse.trim()) {
      setError('Please enter a display name.');
      setIsLoading(false);
      return;
    }

    // Ensure profile is updated
    updateProfile({ lastDisplayName: nameToUse.trim() });

    try {
      // Calls the /join endpoint
      const response = await api.post<any>('/join', { 
        realmCode: code, 
        displayName: nameToUse 
      });

      // Based on server response, update persistence
      // Assuming response structure might contain realm details
      addOrUpdateRecentRealm({
        realmCode: response.realmCode || code, 
        displayNameUsed: nameToUse,
        joinUrl: joinUrl, // explicit URL took precedence
        realmName: response.realmName, // if server returns it
        themeKey: response.themeKey,   // if server returns it
        role: response.role || 'participant'
      });
      
      // Update local list state immediately so if we navigate back it's fresh
      setRecentRealms(getRecentRealms());

      navigate(`/realm/${code.toUpperCase()}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to join realm. Check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForget = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    removeRecentRealm(code);
    setRecentRealms(getRecentRealms());
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear your recent realms history?')) {
        clearRecentRealms();
        setRecentRealms([]);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3 text-[var(--pr-primary)]" style={{ fontFamily: 'var(--pr-heading-font)' }}>
          Join a Realm
        </h1>
        <p className="text-[var(--pr-text-muted)] text-lg">
          Enter the code to step into another world.
        </p>
      </div>

      <div className="bg-[var(--pr-surface)] border border-[var(--pr-border)] rounded-[var(--pr-radius-lg)] p-8 shadow-lg mb-10">
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--pr-text-muted)] flex items-center gap-2">
                    <User size={16} /> Display Name
                </label>
                <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="e.g. Traveler" 
                    className="w-full p-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-bg)] border border-[var(--pr-border)] focus:outline-none focus:border-[var(--pr-primary)] text-[var(--pr-text)] transition-colors text-lg"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--pr-text-muted)] flex items-center gap-2">
                    <Globe size={16} /> Realm Code or URL
                </label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={realmInput}
                        onChange={(e) => setRealmInput(e.target.value)}
                        placeholder="e.g. XY72-99AB" 
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        className="flex-1 p-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-bg)] border border-[var(--pr-border)] focus:outline-none focus:border-[var(--pr-primary)] text-[var(--pr-text)] transition-colors text-lg font-mono placeholder:font-sans uppercase"
                    />
                    <button 
                        onClick={() => handleJoin()}
                        disabled={isLoading}
                        className="px-8 py-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-primary)] text-[var(--pr-bg)] font-bold shadow-[var(--pr-shadow-soft)] hover:shadow-[var(--pr-shadow-hover)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Joining...' : <>Join <ArrowRight size={20} /></>}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {error}
                </div>
            )}
        </div>
      </div>

      {recentRealms.length > 0 && (
          <div>
              <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--pr-text)]">
                      <History size={20} /> Recent Realms
                  </h2>
                  <button 
                    onClick={handleClearAll}
                    className="text-xs text-[var(--pr-text-muted)] hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                      <Trash2 size={12} /> Clear History
                  </button>
              </div>

              <div className="grid gap-3">
                  {recentRealms.map((realm) => (
                      <div 
                        key={realm.realmCode}
                        className="group flex items-center justify-between p-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-surface)] border border-[var(--pr-border)] hover:border-[var(--pr-primary)] transition-all cursor-pointer"
                        onClick={() => {
                            setRealmInput(realm.realmCode);
                            // Auto-fill name if it was different? Maybe better to use current if set, or last used for that realm?
                            // Requirement: "rejoin is done by realmCode + displayName"
                            // If user is empty, fill it. If user has typed something new, maybe keep it?
                            // Let's adopt the "last used name for this realm" if current input is empty, otherwise keep current.
                            if (!displayName && realm.displayNameUsed) {
                                setDisplayName(realm.displayNameUsed);
                            }
                        }}
                      >
                          <div className="flex-1">
                              <div className="flex items-center gap-3">
                                  <span className="font-mono text-lg font-bold text-[var(--pr-primary)]">{realm.realmCode}</span>
                                  {realm.realmName && <span className="text-sm font-medium opacity-80">{realm.realmName}</span>}
                                  {realm.role === 'observer' && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--pr-surface-elevated)] border border-[var(--pr-border)]">Observer</span>}
                              </div>
                              <div className="text-xs text-[var(--pr-text-muted)] mt-1 flex items-center gap-2">
                                  <span>{timeAgo(realm.lastVisitedAt)}</span>
                                  <span>•</span>
                                  <span>Used as: <span className="text-[var(--pr-text)]">{realm.displayNameUsed}</span></span>
                              </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleJoin(realm.realmCode, realm.displayNameUsed);
                                }}
                                className="px-3 py-1.5 text-sm font-medium rounded-[var(--pr-radius-sm)] bg-[var(--pr-primary)] text-[var(--pr-bg)] hover:brightness-110"
                              >
                                  Enter
                              </button>
                              <button
                                onClick={(e) => handleForget(e, realm.realmCode)}
                                className="p-2 text-[var(--pr-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-[var(--pr-radius-sm)] transition-colors"
                                title="Forget this realm"
                              >
                                  <X size={16} />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
}
