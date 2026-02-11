import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowUp, Download, Edit2, Info, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { Tooltip } from '../../../components/ui/Tooltip';
import { cn } from '../../../lib/utils';
import { useRealmStore } from '../../../state/realmStore';
import { useRealmClient } from '@/app/providers/RealtimeProvider';
import { realmRecapApi } from '@/api/realmRecap';

interface QuestListItem {
    id: string;
    title: string;
    version?: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    quests: QuestListItem[];
    activeQuestId: string | undefined;
    canManage?: boolean;
}

export function QuestManagementDialog({ isOpen, onClose, quests, activeQuestId, canManage = true }: Props) {
    const [newQuestTitle, setNewQuestTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [pendingQuestIds, setPendingQuestIds] = useState<Record<string, boolean>>({});
    const [isReordering, setIsReordering] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [localQuests, setLocalQuests] = useState(quests);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const snapshot = useRealmStore((s) => s.realmSnapshot);
    const questLogVersion = snapshot?.questLogVersion ?? null;
    const realmCode = snapshot?.realmCode;
    const client = useRealmClient();

    useEffect(() => {
        setLocalQuests(quests);
    }, [quests]);

    const questById = useMemo(() => {
        return new Map((snapshot?.questLog?.quests ?? []).map((quest) => [quest.id, quest]));
    }, [snapshot?.questLog?.quests]);

    const markPending = (questId: string, isPending: boolean) => {
        setPendingQuestIds((prev) => {
            if (isPending) return { ...prev, [questId]: true };
            const next = { ...prev };
            delete next[questId];
            return next;
        });
    };

    const refreshSnapshot = () => client.requestFullSnapshot().catch(() => undefined);

    const handleCreateQuest = async () => {
        const trimmed = newQuestTitle.trim();
        if (!trimmed || !canManage) return;
        if (questLogVersion === null) {
            console.warn('Quest log version not available yet.');
            return;
        }

        try {
            await client.addQuest({
                title: trimmed,
                description: '',
                questLogVersion,
            });
            setNewQuestTitle('');
            setIsCreating(false);
            await refreshSnapshot();
        } catch (err) {
            console.error(err);
        }
    };

    const handleBeginEdit = (questId: string, currentTitle: string) => {
        if (!canManage) return;
        setEditingQuestId(questId);
        setEditingTitle(currentTitle);
    };

    const handleSaveEdit = async () => {
        if (!canManage || !editingQuestId) return;

        const trimmed = editingTitle.trim();
        const quest = questById.get(editingQuestId);
        if (!trimmed || !quest?.version) return;

        markPending(editingQuestId, true);
        try {
            await client.updateQuest({
                questId: editingQuestId,
                title: trimmed,
                description: quest.description ?? '',
                questVersion: quest.version,
            });
            setEditingQuestId(null);
            setEditingTitle('');
            await refreshSnapshot();
        } catch (err) {
            console.error(err);
        } finally {
            markPending(editingQuestId, false);
        }
    };

    const handleDeleteQuest = async (questId: string) => {
        if (!canManage) return;

        const quest = questById.get(questId);
        if (!quest?.version || questLogVersion === null) return;

        markPending(questId, true);
        try {
            await client.deleteQuest({
                questId,
                questVersion: quest.version,
                questLogVersion,
            });
            setLocalQuests((prev) => prev.filter((q) => q.id !== questId));
            await refreshSnapshot();
        } catch (err) {
            console.error(err);
        } finally {
            markPending(questId, false);
        }
    };

    const handleMoveQuest = async (questId: string, direction: 'up' | 'down') => {
        if (!canManage || questLogVersion === null) return;

        const currentIndex = localQuests.findIndex((q) => q.id === questId);
        if (currentIndex < 0) return;

        const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (nextIndex < 0 || nextIndex >= localQuests.length) return;

        const reordered = [...localQuests];
        const [moved] = reordered.splice(currentIndex, 1);
        if (!moved) return;
        reordered.splice(nextIndex, 0, moved);

        setLocalQuests(reordered);
        setIsReordering(true);
        try {
            await client.reorderQuests({
                newOrder: reordered.map((q) => q.id),
                questLogVersion,
            });
            await refreshSnapshot();
        } catch (err) {
            console.error(err);
            setLocalQuests(quests);
        } finally {
            setIsReordering(false);
        }
    };

    const handleQuestKeyDown = (event: KeyboardEvent<HTMLDivElement>, questId: string) => {
        if (!canManage) return;

        if (event.altKey && event.key === 'ArrowUp') {
            event.preventDefault();
            void handleMoveQuest(questId, 'up');
        }

        if (event.altKey && event.key === 'ArrowDown') {
            event.preventDefault();
            void handleMoveQuest(questId, 'down');
        }
    };

    const handleExportCsv = async () => {
        if (!realmCode || !canManage) return;

        setIsExporting(true);
        try {
            const csvBlob = await realmRecapApi.exportQuestsCsv(realmCode);
            const url = URL.createObjectURL(csvBlob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `${realmCode}-quests.csv`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportCsv = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!realmCode || !canManage) return;

        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            await realmRecapApi.importQuestsCsv(realmCode, file);
            await refreshSnapshot();
        } catch (err) {
            console.error(err);
        } finally {
            event.target.value = '';
            setIsImporting(false);
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Quest Log"
            subtitle="Manage your journey"
        >
            <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-pr-primary/5 rounded-xl border border-pr-primary/20 text-sm text-pr-text/90 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-pr-primary/40" />
                    <Info size={18} className="shrink-0 text-pr-primary mt-0.5" />
                    <div className="space-y-1">
                        <p className="font-bold text-xs uppercase tracking-wider text-pr-primary">The Quest Log</p>
                        <div className="text-[11px] leading-relaxed opacity-80">
                            <span>Quests are the planning cards your party estimates and resolves together.</span>
                            <Tooltip content="Tip: use Edit to refine titles, Delete to remove old work, and Alt+Arrow keys to reorder quickly.">
                                <span className="underline decoration-pr-primary/40 decoration-dashed underline-offset-2 cursor-help mx-0.5">How it works</span>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-pr-text-muted">Available Quests</h3>
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,text/csv"
                                className="hidden"
                                onChange={handleImportCsv}
                                aria-label="Import quest CSV"
                            />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!canManage || isImporting}
                                variant="ghost"
                                className="h-7 text-[10px] uppercase px-2"
                                title="Import quests from CSV"
                            >
                                <Upload size={12} className="mr-1" /> Import CSV
                            </Button>
                            <Button
                                onClick={handleExportCsv}
                                disabled={!canManage || isExporting}
                                variant="ghost"
                                className="h-7 text-[10px] uppercase px-2"
                                title="Export quest log to CSV"
                            >
                                <Download size={12} className="mr-1" /> Export CSV
                            </Button>
                            <Button
                                onClick={() => setIsCreating(true)}
                                disabled={!canManage || isCreating}
                                variant="ghost"
                                className="h-7 text-[10px] uppercase px-2"
                            >
                                <Plus size={12} className="mr-1" /> New Quest
                            </Button>
                        </div>
                    </div>

                    {isCreating && canManage && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                            <input
                                value={newQuestTitle}
                                onChange={(e) => setNewQuestTitle(e.target.value)}
                                placeholder="Quest title..."
                                className="flex-1 h-9 px-3 rounded text-sm bg-pr-bg border border-pr-border focus:border-pr-primary outline-none"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && void handleCreateQuest()}
                            />
                            <Button onClick={() => void handleCreateQuest()} variant="primary" className="h-9 px-3 text-xs">Add</Button>
                            <Button onClick={() => setIsCreating(false)} variant="ghost" className="h-9 px-3 text-xs">Cancel</Button>
                        </div>
                    )}

                    <div className="space-y-1 max-h-[300px] overflow-y-auto" role="list" aria-label="Quest list">
                        {localQuests.length === 0 ? (
                            <div className="text-center py-8 text-pr-text-muted text-xs border border-dashed border-pr-border/30 rounded-lg">
                                <p className="italic">No quests yet.</p>
                                <p className="mt-1 opacity-80">Create your first quest or import a CSV backlog to get started.</p>
                            </div>
                        ) : (
                            localQuests.map((quest, index) => {
                                const isEditing = editingQuestId === quest.id;
                                const isPending = pendingQuestIds[quest.id];

                                return (
                                    <div
                                        key={quest.id}
                                        role="listitem"
                                        tabIndex={0}
                                        onKeyDown={(event) => handleQuestKeyDown(event, quest.id)}
                                        className={cn(
                                            'flex items-center gap-2 p-3 rounded bg-pr-surface-2 border border-pr-border/10 hover:border-pr-primary/30 transition-colors',
                                            isPending && 'opacity-60'
                                        )}
                                        aria-label={`Quest ${quest.title}. ${index + 1} of ${localQuests.length}`}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <button
                                                type="button"
                                                className="p-1 rounded hover:bg-pr-primary/10 disabled:opacity-30"
                                                onClick={() => void handleMoveQuest(quest.id, 'up')}
                                                disabled={!canManage || index === 0 || isReordering}
                                                aria-label={`Move ${quest.title} up`}
                                                title="Move up (Alt+ArrowUp)"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                className="p-1 rounded hover:bg-pr-primary/10 disabled:opacity-30"
                                                onClick={() => void handleMoveQuest(quest.id, 'down')}
                                                disabled={!canManage || index === localQuests.length - 1 || isReordering}
                                                aria-label={`Move ${quest.title} down`}
                                                title="Move down (Alt+ArrowDown)"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                        </div>

                                        {isEditing ? (
                                            <input
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                className="flex-1 h-8 px-2 rounded text-sm bg-pr-bg border border-pr-border focus:border-pr-primary outline-none"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        void handleSaveEdit();
                                                    }
                                                    if (e.key === 'Escape') {
                                                        setEditingQuestId(null);
                                                        setEditingTitle('');
                                                    }
                                                }}
                                                aria-label={`Edit title for ${quest.title}`}
                                            />
                                        ) : (
                                            <span className={cn(
                                                'flex-1 text-sm font-medium',
                                                activeQuestId === quest.id ? 'text-pr-primary' : 'text-pr-text'
                                            )}>
                                                {quest.title}
                                            </span>
                                        )}

                                        {activeQuestId === quest.id && (
                                            <span className="text-[10px] uppercase tracking-widest text-pr-primary">Active</span>
                                        )}

                                        {canManage && (
                                            <div className="flex items-center gap-1">
                                                {isEditing ? (
                                                    <>
                                                        <Button onClick={() => void handleSaveEdit()} variant="ghost" className="h-7 px-2 text-[10px]">Save</Button>
                                                        <Button onClick={() => { setEditingQuestId(null); setEditingTitle(''); }} variant="ghost" className="h-7 px-2 text-[10px]">Cancel</Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="p-1.5 rounded hover:bg-pr-primary/10"
                                                            onClick={() => handleBeginEdit(quest.id, quest.title)}
                                                            aria-label={`Edit ${quest.title}`}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="p-1.5 rounded hover:bg-pr-danger/10 text-pr-danger"
                                                            onClick={() => void handleDeleteQuest(quest.id)}
                                                            aria-label={`Delete ${quest.title}`}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {!canManage && (
                        <p className="text-[11px] text-pr-text-muted">
                            Only the GM can edit the quest log, import/export CSV, or reorder quests.
                        </p>
                    )}
                </div>
            </div>
        </Dialog>
    );
}
