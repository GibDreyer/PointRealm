import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface PanelProps extends Omit<HTMLMotionProps<"div">, "children"> {
  variant?: 'default' | 'subtle' | 'outline';
  noPadding?: boolean;
  children?: React.ReactNode;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant = 'default', noPadding = false, children, ...props }, ref) => {
    
    const variants = {
      default: "bg-pr-surface border border-pr-border shadow-md",
      subtle: "bg-pr-surface/50 border border-pr-border/50",
      outline: "bg-transparent border border-pr-border border-dashed",
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "rounded-[var(--pr-radius-lg)] relative overflow-hidden",
          variants[variant],
          !noPadding && "p-6",
          className
        )}
        {...props}
      >
        {/* Inner Highlight (Bevel effect) */}
        <div className="absolute inset-0 pointer-events-none rounded-[var(--pr-radius-lg)] ring-1 ring-white/5 inset-shadow" />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);

Panel.displayName = "Panel";
