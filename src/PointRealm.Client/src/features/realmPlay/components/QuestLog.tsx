import React, { useEffect, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Scroll, GripVertical, CheckCircle, Lock, Edit2, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';

interface Quest {
  id: string;
  title: string;
  status: "active" | "pending" | "completed";
  estimate?: string;
  order?: number;
}

interface QuestLogProps {
  quests: Quest[];
  activeQuestId?: string;
  canManage?: boolean;
  onSelectQuest: (id: string) => void;
  onAddQuest: () => void;
  onEditQuest: (id: string) => void;
  onDeleteQuest: (id: string) => void;
  onReorder: (idsInOrder: string[]) => void;
  className?: string;
}

export const QuestLog: React.FC<QuestLogProps> = ({
  quests,
  activeQuestId,
  canManage = false,
  onSelectQuest,
  onAddQuest,
  onEditQuest,
  onDeleteQuest,
  onReorder,
  className
}) => {
  const { play } = useSound();
  
  // Local state for optimistic reordering
  const [items, setItems] = useState(quests);

  useEffect(() => {
    setItems(quests);
  }, [quests]);

  const handleReorder = (newOrder: Quest[]) => {
    setItems(newOrder);
    onReorder(newOrder.map(q => q.id));
  };

  return (
    <div className={cn("flex flex-col gap-4 bg-surface/40 backdrop-blur-sm p-4 rounded-xl border border-border/50", className)}>
      <div className="flex items-center justify-between pb-2 border-b border-border/30">
        <div className="flex items-center gap-2 text-textMuted">
          <Scroll size={18} />
          <h2 className="text-sm uppercase tracking-widest font-bold">Quest Log</h2>
        </div>
        {canManage && (
          <button
            onClick={onAddQuest}
            className="p-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            aria-label="Add Quest"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      <Reorder.Group 
        axis="y" 
        values={items} 
        onReorder={canManage ? handleReorder : () => {}}
        className="flex flex-col gap-2 min-h-[100px]"
      >
        {items.map((quest) => (
          <QuestItem
            key={quest.id}
            quest={quest}
            isActive={quest.id === activeQuestId}
            canManage={canManage}
            onSelect={() => {
              play('select');
              onSelectQuest(quest.id);
            }}
            onEdit={() => onEditQuest(quest.id)}
            onDelete={() => onDeleteQuest(quest.id)}
          />
        ))}
        
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-textMuted/50 italic text-sm border border-dashed border-border rounded-lg">
            <span>No quests in the log...</span>
          </div>
        )}
      </Reorder.Group>
    </div>
  );
};

const QuestItem: React.FC<{
  quest: Quest;
  isActive: boolean;
  canManage: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ quest, isActive, canManage, onSelect, onEdit, onDelete }) => {
  return (
    <Reorder.Item
      value={quest}
      dragListener={canManage}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      className="relative"
    >
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-lg border transition-all",
          "hover:bg-surfaceElevated cursor-pointer",
          isActive 
            ? "bg-surfaceElevated border-primary/50 shadow-[inset_4px_0_0_0_rgb(6,182,212)]" 
            : "bg-surface border-transparent hover:border-border"
        )}
        onClick={onSelect}
      >
        {/* Drag Handle or Status Icon */}
        {canManage ? (
          <div className="cursor-grab active:cursor-grabbing text-textMuted hover:text-text p-1">
            <GripVertical size={16} />
          </div>
        ) : (
          <div className={cn("text-textMuted", isActive && "text-primary")}>
            {quest.status === 'completed' ? <CheckCircle size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-40" />}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "text-sm font-medium truncate",
              isActive ? "text-primary" : "text-text",
              quest.status === 'completed' && "line-through opacity-60"
            )}>
              {quest.title}
            </h3>
            {quest.status === 'completed' && (
              <span className="shrink-0 px-1.5 py-0.5 text-[10px] bg-success/10 text-success rounded border border-success/20 flex items-center gap-1">
                <Lock size={8} /> Sealed
              </span>
            )}
            {quest.estimate && quest.status === 'completed' && (
              <span className="shrink-0 text-xs font-mono font-bold text-success">
                {quest.estimate}
              </span>
            )}
          </div>
        </div>

        {/* GM Actions */}
        {canManage && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 text-textMuted hover:text-info hover:bg-info/10 rounded"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-textMuted hover:text-danger hover:bg-danger/10 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </motion.div>
    </Reorder.Item>
  );
};
