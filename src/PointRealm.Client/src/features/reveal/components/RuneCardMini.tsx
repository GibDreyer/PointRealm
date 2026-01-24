import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RuneCardMiniProps {
  value: string | null;
  revealed: boolean;
  isCensored?: boolean; // For "hidden until reveal" even if data is present
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
  // If value is null (abstained/unknown), we usually show '?' or '-'
  const displayValue = value === null ? '?' : value;

  return (
    <div className={cn("relative w-10 h-14 perspective-500", className)}>
      <motion.div
        className="w-full h-full relative preserve-3d"
        initial={false}
        animate={{ rotateY: revealed && !isCensored ? 180 : 0 }}
        transition={{ duration: 0.3, delay: delay, ease: "easeInOut" }}
      >
        {/* Card Back */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden rounded border border-border bg-surface",
            "flex items-center justify-center",
            "bg-[url('/assets/card-back-pattern.png')] bg-cover bg-center opacity-80" // Placeholder texture if any
          )}
          style={{ transform: "rotateY(0deg)" }}
        >
          <div className="w-6 h-8 rounded border border-white/10 flex items-center justify-center">
             <div className="w-3 h-3 rounded-full bg-primary/20" />
          </div>
        </div>

        {/* Card Face */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden rounded border border-primary/30 bg-surfaceElevated",
            "flex items-center justify-center shadow-[0_0_10px_-2px_rgba(6,182,212,0.3)]"
          )}
          style={{ transform: "rotateY(180deg)" }}
        >
          <span className="text-lg font-bold font-heading text-primary drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
            {displayValue}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
