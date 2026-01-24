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
    <div className={cn("flex flex-col gap-4", className)}>
      <header className="mb-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-pr-text-muted mb-1">
              Ritual Consensus
          </h3>
          <div className="h-px bg-gradient-to-r from-pr-primary/30 to-transparent w-32" />
      </header>
      
      <div className="space-y-4">
          {distribution.map((item, index) => {
            const barWidth = (item.count / maxCount) * 100; 

            return (
              <motion.div 
                key={item.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 + 0.3 }}
                className="flex items-center gap-4"
              >
                {/* Value Chip */}
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-pr-surface border border-pr-border/30 font-black text-sm text-pr-text shrink-0 shadow-sm">
                  {item.value}
                </div>

                {/* Progress Group */}
                <div className="flex-1 flex flex-col gap-1">
                    <div className="flex justify-between items-center px-0.5">
                        <span className="text-[10px] font-bold text-pr-text/60 uppercase tracking-tighter">Agreement</span>
                        <span className="text-[10px] font-black text-pr-primary">{item.count} Chosen</span>
                    </div>
                    <div className="h-2 flex items-center bg-pr-surface-2/50 rounded-full overflow-hidden border border-pr-border/10">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-pr-primary/40 to-pr-primary rounded-full relative shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                      >
                          {/* Inner shine */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
                      </motion.div>
                    </div>
                </div>
              </motion.div>
            );
          })}
      </div>
      
      {distribution.length === 0 && (
         <div className="text-center text-pr-text-muted/40 py-8 italic border border-dashed border-pr-border/20 rounded-xl bg-pr-bg/20">
            <p className="text-xs uppercase tracking-widest font-bold">No consensus recorded</p>
         </div>
      )}
    </div>
  );
};
