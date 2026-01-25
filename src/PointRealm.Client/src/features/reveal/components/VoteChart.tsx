import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader } from '@/components/ui/SectionHeader';
import styles from './VoteChart.module.css';

export interface ChartDataItem {
  value: string;
  count: number;
}

interface VoteChartProps {
  data: ChartDataItem[];
  revealed: boolean;
  totalVotes: number;
  compact?: boolean;
}

export const VoteChart: React.FC<VoteChartProps> = ({
  data,
  revealed,
  totalVotes,
  compact = false,
}) => {
  const prefersReducedMotion = useReducedMotion() ?? false;
  
  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);
  
  // ... stats calculation code remains same ...
  const stats = useMemo(() => {
    // ... same logic ...
    if (!data.length) return null;
    
    const numericData = data
      .filter(d => !isNaN(Number(d.value)))
      .map(d => ({ value: Number(d.value), count: d.count }));
    
    if (!numericData.length) return null;
    
    const totalWeight = numericData.reduce((sum, d) => sum + d.count, 0);
    const weightedSum = numericData.reduce((sum, d) => sum + d.value * d.count, 0);
    const average = weightedSum / totalWeight;
    
    const mode = numericData.length > 0 
      ? numericData.reduce((maxItem, d) => d.count > maxItem.count ? d : maxItem, numericData[0]!)
      : undefined;
    
    const values = numericData.map(d => d.value);
    const min = Math.min(...values);
    const max = values.length > 0 ? Math.max(...values) : min;
    
    return {
      average: average.toFixed(1),
      mode: mode?.value,
      min,
      max,
      spread: max - min,
    };
  }, [data]);

  if (!revealed || data.length === 0) {
    return (
      <div className={styles.wrapper}>
        {!compact && <SectionHeader title="Vote Analysis" subtitle="Results" className="mb-0" />}
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📊</div>
          <div className={styles.emptyText}>Awaiting revelation...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "flex flex-col gap-4 w-full h-full" : styles.wrapper}>
      {!compact && <SectionHeader title="Vote Analysis" subtitle="Results" className="mb-0" />}
      
      {/* Stats Row */}
      {stats && (
        <motion.div 
          className={compact ? "grid grid-cols-3 gap-2" : styles.statsRow}
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className={compact ? "bg-black/20 rounded p-2 text-center border border-white/5" : styles.statCard}>
            <div className={compact ? "text-xl font-bold text-pr-primary leading-none" : styles.statValue}>{stats.average}</div>
            <div className={compact ? "text-[10px] uppercase tracking-wider text-pr-text-muted mt-1" : styles.statLabel}>AVG</div>
          </div>
          <div className={compact ? "bg-black/20 rounded p-2 text-center border border-white/5" : styles.statCard}>
            <div className={compact ? "text-xl font-bold text-pr-primary leading-none" : styles.statValue}>{stats.mode}</div>
            <div className={compact ? "text-[10px] uppercase tracking-wider text-pr-text-muted mt-1" : styles.statLabel}>MODE</div>
          </div>
          <div className={compact ? "bg-black/20 rounded p-2 text-center border border-white/5" : styles.statCard}>
            <div className={compact ? "text-xl font-bold text-pr-text leading-none" : styles.statValue}>{totalVotes}</div>
            <div className={compact ? "text-[10px] uppercase tracking-wider text-pr-text-muted mt-1" : styles.statLabel}>VOTES</div>
          </div>
        </motion.div>
      )}
      
      {/* Bar Chart */}
      <div className={compact ? "flex-1 min-h-0 overflow-y-auto pr-2" : styles.chartContainer}>
        <div className={styles.chart}>
          {data.map((item, index) => {
            const percentage = (item.count / maxCount) * 100;
            const votePercentage = ((item.count / totalVotes) * 100).toFixed(0);
            
            return (
              <motion.div 
                key={item.value} 
                className={styles.barGroup}
                initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <div className={styles.barLabel}>
                  <span className={styles.barValue}>{item.value}</span>
                </div>
                <div className={styles.barTrack}>
                  <motion.div 
                    className={styles.barFill}
                    initial={prefersReducedMotion ? { width: `${percentage}%` } : { width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className={styles.barGlow} />
                  </motion.div>
                  <div className={styles.barMarkers}>
                    {[25, 50, 75].map(mark => (
                      <div key={mark} className={styles.barMarker} style={{ left: `${mark}%` }} />
                    ))}
                  </div>
                </div>
                <div className={styles.barCount}>
                  <span className={styles.countNumber}>{item.count}</span>
                  <span className={styles.countPercent}>({votePercentage}%)</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Consensus Indicator */}
      {stats && data.length > 1 && (
        <motion.div 
          className={styles.consensus}
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className={styles.consensusLabel}>Consensus Level</div>
          <div className={styles.consensusBar}>
            <motion.div 
              className={styles.consensusFill}
              style={{ 
                background: stats.spread <= 2 
                  ? 'linear-gradient(90deg, var(--pr-success), #22c55e)' 
                  : stats.spread <= 5 
                    ? 'linear-gradient(90deg, var(--pr-warning), #fbbf24)'
                    : 'linear-gradient(90deg, var(--pr-danger), #f87171)'
              }}
              initial={prefersReducedMotion ? {} : { width: 0 }}
              animate={{ width: `${Math.max(20, 100 - stats.spread * 8)}%` }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className={styles.consensusText}>
            {stats.spread <= 2 ? 'High agreement' : stats.spread <= 5 ? 'Moderate spread' : 'Wide disagreement'}
          </div>
        </motion.div>
      )}
    </div>
  );
};
