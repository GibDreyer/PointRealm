import { useState, useEffect, type ReactNode } from 'react';
import { cn } from '../../../lib/utils';
import { Save, Loader2, Eye, EyeOff, UserX } from 'lucide-react';
import { RealmSettings } from '../types';
import { ThemePicker } from '../../createRealm/components/ThemePicker';
import { api } from '../../../api/client';
import { Button } from '../../../components/Button';
import { Dialog } from '../../../components/ui/Dialog';

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
        } finally {
            setIsSaving(false);
        }
    };
    
    const toggle = (key: keyof RealmSettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (!isOpen) return null;

    return (
        <Dialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Realm Settings" 
            subtitle={`Modifying ${realmCode}`}
            className="max-w-2xl"
        >
            <div className="space-y-8">
                {/* Toggles */}
                <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-pr-text-muted tracking-[0.2em]">Mechanics & Rules</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <ToggleRow 
                            label="Auto Reveal" 
                            description="Show cards when everyone votes"
                            icon={<Eye size={18} />}
                            checked={settings.autoReveal}
                            onChange={() => toggle('autoReveal')}
                            disabled={isSaving}
                            />
                            <ToggleRow 
                            label="Allow Abstain" 
                            description="Allow '?' card"
                            icon={<UserX size={18} />}
                            checked={settings.allowAbstain}
                            onChange={() => toggle('allowAbstain')}
                            disabled={isSaving}
                            />
                            <ToggleRow 
                            label="Hide Vote Counts" 
                            description="Don't show who has voted"
                            icon={<EyeOff size={18} />}
                            checked={settings.hideVoteCounts}
                            onChange={() => toggle('hideVoteCounts')}
                            disabled={isSaving}
                            />
                        </div>
                </div>

                <div className="h-px bg-pr-border/20" />

                    {/* Theme Picker */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-pr-text-muted tracking-[0.2em]">Visual Theme</h3>
                        <ThemePicker selectedThemeKey={themeKey} onThemeSelect={setThemeKey} />
                    </div>
            </div>

            <div className="mt-8 pt-5 border-t border-pr-border/30 flex justify-end gap-3">
                <Button 
                    onClick={onClose}
                    disabled={isSaving}
                    variant="secondary"
                    className="px-6"
                >
                    Discard
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    variant="primary"
                    className="px-8"
                >
                    {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                    Inscribe Changes
                </Button>
            </div>
        </Dialog>
    );
}

interface ToggleRowProps {
    label: string;
    description: string;
    icon: ReactNode;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}

function ToggleRow({ label, description, icon, checked, onChange, disabled }: ToggleRowProps) {
    return (
        <label className={cn(
            "flex items-center justify-between p-4 rounded-[var(--pr-radius-md)] border transition-all cursor-pointer",
            checked ? "bg-pr-primary/5 border-pr-primary/30 shadow-[0_0_15px_-5px_rgba(6,182,212,0.1)]" : "bg-pr-bg/40 border-pr-border/20 hover:border-pr-border/50",
            disabled && "opacity-50 cursor-not-allowed"
        )}>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center border transition-colors",
                    checked ? "bg-pr-primary/10 border-pr-primary/20 text-pr-primary" : "bg-pr-surface-2 border-pr-border/20 text-pr-text-muted"
                )}>
                    {icon}
                </div>
                <div>
                    <span className="block font-bold text-sm text-pr-text">{label}</span>
                    <span className="text-[10px] text-pr-text-muted font-medium uppercase tracking-tighter opacity-70">{description}</span>
                </div>
            </div>
            <div className={cn(
                "w-10 h-5 rounded-full relative transition-colors duration-200 border",
                checked ? "bg-pr-primary border-pr-primary" : "bg-pr-bg border-pr-border/30"
            )}>
                <div className={cn(
                    "absolute top-0.5 w-[14px] h-[14px] rounded-full transition-transform duration-200 shadow-sm",
                    checked ? "translate-x-[20px] bg-pr-bg" : "translate-x-1 bg-pr-text-muted/50"
                )} />
            </div>
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" disabled={disabled} />
        </label>
    );
}
