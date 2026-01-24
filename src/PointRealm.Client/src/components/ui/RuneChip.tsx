import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface RuneChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  active?: boolean;
}

export const RuneChip: React.FC<RuneChipProps> = ({ 
  children, 
  active = false,
  className, 
  ...props 
}) => {
  // Omit conflicting props from props to avoid type errors with motion.button
  const { onAnimationStart, onDrag, onDragEnd, onDragStart, style, ...filteredProps } = props;

  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: "0 0 10px var(--pr-primary)" }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors",
        "border border-pr-border",
        active 
          ? "bg-pr-primary text-black border-pr-primary shadow-[0_0_10px_var(--pr-primary)]" 
          : "bg-pr-surface text-pr-text-muted hover:text-pr-text hover:border-pr-primary/50",
        className
      )}
      style={style as any}
      {...filteredProps}
    >
      {children}
    </motion.button>
  );
};
