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
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "inline-flex items-center justify-center px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300",
        "border",
        active 
          ? "bg-pr-primary text-black border-pr-primary shadow-[0_0_20px_-5px_var(--pr-primary)] z-10" 
          : "bg-pr-surface/60 text-pr-text-muted border-pr-border/50 hover:text-pr-text hover:border-pr-primary/40 hover:bg-pr-surface/80",
        className
      )}
      style={style as any}
      {...filteredProps}
    >
      {children}
    </motion.button>
  );
};
