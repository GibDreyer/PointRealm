import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DistributionItem {
  value: string;
  count: number;
}

interface RuneDistributionProps {
  distribution: DistributionItem[];
  className?: string;
}

export const RuneDistribution: React.FC<RuneDistributionProps> = ({
  distribution,
  className
}) => {
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h3 className="text-sm font-bold uppercase tracking-widest text-textMuted border-b border-border/30 pb-2 mb-2">
        Rune Distribution <span className="text-xs text-textMuted/60 normal-case">(Summary)</span>
      </h3>
      
      {distribution.map((item, index) => {
        // Calculate percentage but keep bar visible even for small counts
        const barWidth = (item.count / maxCount) * 100; 

        return (
          <motion.div 
            key={item.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 + 0.3, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            {/* Value Chip */}
            <div className="w-8 h-8 flex items-center justify-center rounded bg-surface border border-border font-bold text-sm text-text shrink-0">
              {item.value}
            </div>

            {/* Bar */}
            <div className="flex-1 h-8 flex items-center bg-surface/30 rounded overflow-hidden relative">
              <motion.div 
                className={cn(
                  "h-full rounded-r relative",
                  "bg-gradient-to-r from-primary/20 to-primary/40 border-r border-primary/50"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
              >
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
              </motion.div>
              
              {/* Count Label (positioned end of the row) */}
              <div className="absolute right-3 text-xs font-mono text-textMuted font-bold">
                 {item.count} <span className="font-normal opacity-50">voted</span>
              </div>
            </div>
          </motion.div>
        );
      })}
      
      {distribution.length === 0 && (
         <div className="text-center text-textMuted text-sm py-4 italic opacity-60">
            No votes recorded.
         </div>
      )}
    </div>
  );
};
