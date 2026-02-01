import React from 'react';
import { cn } from '../../lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface RuneChipProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  active?: boolean;
}

export const RuneChip: React.FC<RuneChipProps> = ({ 
  children, 
  active = false,
  className, 
  ...props 
}) => {
  const { style, ...filteredProps } = props;

  const styleProp = style ? { style } : {};

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative group inline-flex items-center justify-center px-4 py-2 min-h-[36px] rounded-[4px] font-heading font-bold text-xs uppercase tracking-[0.1em] transition-all duration-300 select-none overflow-hidden pr-rune-chip",
        active 
          ? "text-black shadow-[0_0_15px_rgba(230,176,78,0.4)] pr-rune-chip-active" 
          : "text-[var(--pr-text-muted)] hover:text-white",
        className
      )}
      {...styleProp}
      {...filteredProps}
    >
      {/* Background Texture */}
      <span className={cn(
        "absolute inset-0 z-0",
        active
          ? "bg-[linear-gradient(45deg,#e6b04e,#f9d489)]" // Gold gradient
          : "bg-[var(--pr-surface-elevated)] border border-[var(--pr-surface-border)] group-hover:border-[var(--pr-primary-dim)]"
      )}>
        {!active && <span className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] mix-blend-overlay" />}
      </span>

      {/* Active Glow/Glitter Overlay */}
      {active && (
         <span className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-20 mix-blend-overlay" />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>

      {/* Selection Indicator Diamond (Bottom) */}
      {active && (
        <motion.span 
          layoutId="rune-active"
          className="absolute -bottom-1 w-1.5 h-1.5 rotate-45 bg-white shadow-[0_0_5px_white] z-20"
        />
      )}
    </motion.button>
  );
};
