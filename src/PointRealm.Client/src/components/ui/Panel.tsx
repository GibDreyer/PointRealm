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
      default: "bg-pr-surface border border-pr-border shadow-soft",
      subtle: "bg-pr-surface/40 border border-pr-border/30",
      outline: "bg-transparent border-2 border-pr-border/50 border-dashed",
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "rounded-[var(--pr-radius-md)] relative overflow-hidden transition-colors duration-300",
          variants[variant],
          !noPadding && "p-6",
          className
        )}
        {...props}
      >
        {/* Stone/Parchment Texture Overlay (Very Subtle) */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
          style={{ backgroundImage: 'var(--pr-texture-surface-texture)' }}
        />

        {/* Inner Highlight (Bevel effect) */}
        <div className="absolute inset-0 pointer-events-none rounded-[var(--pr-radius-md)] ring-1 ring-white/10 ring-inset shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);

Panel.displayName = "Panel";
