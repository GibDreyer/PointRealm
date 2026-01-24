import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';

interface RuneCardProps {
  value: string;
  label?: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect: (value: string) => void;
}

export const RuneCard: React.FC<RuneCardProps> = ({
  value,
  label,
  selected = false,
  disabled = false,
  onSelect,
}) => {
  const { play } = useSound();

  const handleSelect = () => {
    if (disabled) return;
    if (!selected) play('select');
    onSelect(value);
  };

  return (
    <motion.button
      layout
      onClick={handleSelect}
      disabled={disabled}
      aria-pressed={selected}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!disabled ? { scale: 1.05, y: -4, rotateX: 5 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={cn(
        "relative group flex flex-col items-center justify-center",
        "w-24 h-36 rounded-xl border-2 transition-colors duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "select-none cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed grayscale",
        selected 
          ? "bg-surfaceElevated border-primary shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]" 
          : "bg-surface border-border hover:border-primary/50"
      )}
    >
      {/* Inner Bevel/Highlight */}
      <div className="absolute inset-1 rounded-lg border border-white/5 pointer-events-none" />

      {/* Shimmer Effect (Hover) */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/5 to-transparent z-10"
          initial={{ x: '-100%', opacity: 0 }}
          whileHover={{ x: '100%', opacity: 1, transition: { duration: 0.6 } }}
        />
      )}

      {/* Rune Value */}
      <span className={cn(
        "text-3xl font-heading font-bold z-20 transition-all duration-300",
        selected ? "text-primary drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "text-textMuted group-hover:text-text"
      )}>
        {value}
      </span>

      {/* Optional Label */}
      {label && (
        <span className="absolute bottom-2 text-[10px] uppercase tracking-wider text-textMuted/60 z-20">
          {label}
        </span>
      )}

      {/* Selected Pulse Ring */}
      {selected && (
        <motion.div
          layoutId="rune-selected-ring"
          className="absolute inset-[-4px] rounded-2xl border-2 border-primary/30 z-0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
};
