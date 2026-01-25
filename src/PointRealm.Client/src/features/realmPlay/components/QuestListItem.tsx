import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Quest } from '@/types/realm';

interface QuestListItemProps {
    /** The quest data */
    quest: Quest;
    /** Whether this quest is currently active */
    isActive: boolean;
    /** Whether in edit mode (GM) */
    isEditing?: boolean;
    /** Whether the current user is GM */
    isGM?: boolean;
    /** Click handler for selecting the quest */
    onClick: () => void;
}

/**
 * A single quest item in the quest log list.
 * Shows quest title, status, and sealed estimate if applicable.
 */
export function QuestListItem({ 
    quest, 
    isActive, 
    isEditing = false, 
    isGM = false,
    onClick 
}: QuestListItemProps) {
    const isSealed = quest.status === 'Sealed';

    return (
        <motion.div
            layoutId={`quest-${quest.id}`}
            className="group cursor-pointer"
            onClick={onClick}
            style={{ marginTop: '.75rem' }}
        >
            <div
                style={{ padding: '.5rem' }}
                className={cn(
                    "relative transition-all duration-300 border overflow-hidden rounded-lg p-1",
                    isActive 
                        ? "border-pr-primary/60 bg-gradient-to-r from-pr-primary/20 to-pr-primary/10 shadow-[0_4px_24px_rgba(0,0,0,0.5),0_0_20px_rgba(74,158,255,0.15)]" 
                        : "border-pr-border/50 bg-[rgba(15,20,30,0.8)] hover:border-pr-primary/40 hover:bg-[rgba(20,25,35,0.9)] shadow-[0_4px_16px_rgba(0,0,0,0.5)]",
                    isSealed && "opacity-60"
                )}
            >
                <div className="p-5 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h4 className={cn(
                                "text-md font-bold truncate transition-colors font-heading tracking-wide",
                                isActive ? "text-pr-primary" : "text-white/90",
                                isSealed && "text-pr-text-muted"
                            )}>
                                {quest.title}
                            </h4>
                            {isActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-pr-primary animate-pulse shadow-[0_0_8px_var(--pr-primary-cyan)]" />
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border-l-2",
                                isSealed ? "text-pr-text-muted border-pr-text-muted/40" : 
                                isActive ? "text-pr-primary border-pr-primary/60" :
                                "text-white/40 border-white/10"
                            )}>
                                {quest.status}
                            </span>
                            {isSealed && quest.sealedEstimate && (
                                <span className="text-[10px] font-bold text-pr-text-muted/60 uppercase tracking-widest">
                                    Est: {quest.sealedEstimate}
                                </span>
                            )}
                        </div>
                    </div>

                    {isGM && !isSealed && isEditing && (
                        <div className="opacity-40 group-hover:opacity-100 transition-opacity p-1">
                            <GripVertical size={16} className="text-pr-text-muted/50 cursor-grab" />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
