import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RuneCardMiniProps {
  value: string | null;
  revealed: boolean;
  isCensored?: boolean;
  className?: string;
  delay?: number;
}

export const RuneCardMini: React.FC<RuneCardMiniProps> = ({
  value,
  revealed,
  isCensored = false,
  className,
  delay = 0
}) => {
  const displayValue = value === null ? '?' : value;

  return (
    <div className={cn("relative w-10 h-14 perspective-500", className)}>
      <motion.div
        className="w-full h-full relative preserve-3d"
        initial={false}
        animate={{ rotateY: revealed && !isCensored ? 180 : 0 }}
        transition={{ duration: 0.5, delay: delay, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Card Back - The Unrevealed State */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden rounded-md border border-pr-border/30 bg-pr-surface",
            "flex items-center justify-center overflow-hidden"
          )}
          style={{ transform: "rotateY(0deg)" }}
        >
          {/* Subtle Rune pattern on back */}
          <div className="absolute inset-0 bg-pr-primary/5 opacity-20 pointer-events-none" />
          <div className="w-5 h-7 rounded border border-pr-primary/10 flex items-center justify-center">
             <div className="w-2 h-2 rounded-full bg-pr-primary/20 shadow-[0_0_8px_rgba(6,182,212,0.2)]" />
          </div>
        </div>

        {/* Card Face - The Revealed State */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden rounded-md border border-pr-primary/40 bg-pr-surface-2",
            "flex items-center justify-center shadow-[0_0_15px_-5px_rgba(6,182,212,0.3)]"
          )}
          style={{ transform: "rotateY(180deg)" }}
        >
          <span className="text-lg font-black tracking-tighter text-pr-primary">
            {displayValue}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
