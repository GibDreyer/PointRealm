import { useState, useEffect } from 'react';
import { X, Save, Loader2, Eye, EyeOff, UserX } from 'lucide-react';
import { RealmSettings } from '../types';
import { ThemePicker } from '../../createRealm/components/ThemePicker';
import { api } from '../../../api/client';

interface Props {
    realmCode: string;
    currentSettings: RealmSettings;
    currentThemeKey: string;
    isOpen: boolean;
    onClose: () => void;
}

export function RealmSettingsDialog({ realmCode, currentSettings, currentThemeKey, isOpen, onClose }: Props) {
    const [settings, setSettings] = useState<RealmSettings>(currentSettings);
    const [themeKey, setThemeKey] = useState(currentThemeKey);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
             setSettings(currentSettings);
             setThemeKey(currentThemeKey);
        }
    }, [isOpen, currentSettings, currentThemeKey]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.patch(`/realms/${realmCode}/settings`, {
                themeKey,
                settings
            });
            onClose();
        } catch (err) {
            console.error("Failed to update settings", err);
            // Could set error state here
        } finally {
            setIsSaving(false);
        }
    };
    
    // Helper for checkboxes
    const toggle = (key: keyof RealmSettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[var(--pr-surface)] border border-[var(--pr-border)] rounded-[var(--pr-radius-xl)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-[var(--pr-border)] flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--pr-text)]">Realm Settings</h2>
                    <button onClick={onClose} className="text-[var(--pr-text-muted)] hover:text-[var(--pr-text)] disabled:opacity-50" disabled={isSaving}>
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Toggles */}
                    <div className="space-y-4">
                         <h3 className="text-sm font-bold uppercase text-[var(--pr-text-muted)]">Mechanics</h3>
                         
                         <label className="flex items-center justify-between p-3 rounded-[var(--pr-radius-md)] hover:bg-[var(--pr-surface-hover)] cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Eye className="text-[var(--pr-primary)]" />
                                <div>
                                    <span className="block font-medium text-[var(--pr-text)]">Auto Reveal</span>
                                    <span className="text-xs text-[var(--pr-text-muted)]">Show cards when everyone votes</span>
                                </div>
                            </div>
                            <input type="checkbox" checked={settings.autoReveal} onChange={() => toggle('autoReveal')} className="w-5 h-5 accent-[var(--pr-primary)]" disabled={isSaving} />
                         </label>

                         <label className="flex items-center justify-between p-3 rounded-[var(--pr-radius-md)] hover:bg-[var(--pr-surface-hover)] cursor-pointer">
                            <div className="flex items-center gap-3">
                                <UserX className="text-[var(--pr-primary)]" />
                                <div>
                                    <span className="block font-medium text-[var(--pr-text)]">Allow Abstain</span>
                                    <span className="text-xs text-[var(--pr-text-muted)]">Allow '?' card</span>
                                </div>
                            </div>
                            <input type="checkbox" checked={settings.allowAbstain} onChange={() => toggle('allowAbstain')} className="w-5 h-5 accent-[var(--pr-primary)]" disabled={isSaving} />
                         </label>

                         <label className="flex items-center justify-between p-3 rounded-[var(--pr-radius-md)] hover:bg-[var(--pr-surface-hover)] cursor-pointer">
                            <div className="flex items-center gap-3">
                                <EyeOff className="text-[var(--pr-primary)]" />
                                <div>
                                    <span className="block font-medium text-[var(--pr-text)]">Hide Vote Counts</span>
                                    <span className="text-xs text-[var(--pr-text-muted)]">Don't show who has voted</span>
                                </div>
                            </div>
                            <input type="checkbox" checked={settings.hideVoteCounts} onChange={() => toggle('hideVoteCounts')} className="w-5 h-5 accent-[var(--pr-primary)]" disabled={isSaving} />
                         </label>
                    </div>

                    <div className="h-px bg-[var(--pr-border)]" />

                     {/* Theme Picker */}
                     <div className="space-y-4">
                         <h3 className="text-sm font-bold uppercase text-[var(--pr-text-muted)]">Theme</h3>
                         <ThemePicker selectedThemeKey={themeKey} onThemeSelect={setThemeKey} />
                     </div>
                </div>

                <div className="p-4 border-t border-[var(--pr-border)] flex justify-end gap-3 bg-[var(--pr-surface)]">
                    <button 
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-[var(--pr-text-muted)] hover:text-[var(--pr-text)] font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-[var(--pr-primary)] text-[var(--pr-bg)] rounded-[var(--pr-radius-md)] font-bold shadow-[var(--pr-shadow-soft)] hover:shadow-[var(--pr-shadow-hover)] flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
