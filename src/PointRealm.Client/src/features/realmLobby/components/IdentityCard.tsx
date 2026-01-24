import { useState, useEffect } from 'react';
import { User, Save, Loader2, Edit2 } from 'lucide-react';
import { hub } from '../../../realtime/hub';
import { STORAGE_KEYS, updateProfile } from '../../../lib/storage';

interface Props {
    currentName: string;
}

export function IdentityCard({ currentName }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(currentName);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync if remote changes and we are not editing
    useEffect(() => {
        if (!isEditing) {
            setName(currentName);
        }
    }, [currentName, isEditing]);

    const handleSave = async () => {
        const trimmed = name.trim();
        if (trimmed.length < 2 || trimmed.length > 24) {
            setError("Name must be 2-24 characters.");
            return;
        }

        if (trimmed === currentName) {
            setIsEditing(false);
            setError(null);
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await hub.invoke("SetDisplayName", trimmed);
            
            // Persist locally too
            localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, trimmed);
            updateProfile({ lastDisplayName: trimmed });
            
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            setError("Failed to rename.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setIsEditing(false);
            setName(currentName);
            setError(null);
        } 
    };

    return (
        <div className="w-full bg-[var(--pr-surface)] border border-[var(--pr-border)] rounded-[var(--pr-radius-xl)] p-5 shadow-[var(--pr-shadow-soft)] mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--pr-text-muted)] mb-4 flex items-center gap-2">
                <User size={16} /> Your Identity
            </h3>

            {isEditing ? (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 p-2 rounded-[var(--pr-radius-md)] bg-[var(--pr-bg)] border border-[var(--pr-border)] text-[var(--pr-text)] focus:border-[var(--pr-primary)] focus:outline-none"
                            placeholder="Your Name"
                            autoFocus
                            disabled={isSaving}
                        />
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[var(--pr-primary)] text-[var(--pr-bg)] p-2 rounded-[var(--pr-radius-md)] disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        </button>
                    </div>
                    {error && <p className="text-xs text-[var(--pr-danger)]">{error}</p>}
                </div>
            ) : (
                <div className="flex items-center justify-between group">
                    <span className="text-lg font-bold text-[var(--pr-text)] truncate" title={currentName}>
                        {currentName}
                    </span>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-[var(--pr-text-muted)] hover:text-[var(--pr-primary)] transition-colors p-1"
                        aria-label="Edit Name"
                    >
                        <Edit2 size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
