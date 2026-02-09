import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';
import { ConsensusIndicator } from './ConsensusIndicator';
import { useThemeMode } from '@/theme/ThemeModeProvider';
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
  spread?: number | null;
}

export const VoteChart: React.FC<VoteChartProps> = ({
  data,
  revealed,
  totalVotes,
  compact = false,
  spread = null,
}) => {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { mode } = useThemeMode();
  
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
        {compact ? (
          <SectionHeader title={`${mode.labels.rune} Analysis`} className="mb-0" />
        ) : (
          <SectionHeader title={`${mode.labels.rune} Analysis`} subtitle="Results" className="mb-0" />
        )}
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📊</div>
          <div className={styles.emptyText}>{mode.key === 'fantasy' ? 'Awaiting revelation...' : 'Awaiting results...'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.wrapper, compact && "gap-4")}>
      {compact ? (
        <SectionHeader title={`${mode.labels.rune} Analysis`} className="mb-0" />
      ) : (
        <SectionHeader title={`${mode.labels.rune} Analysis`} subtitle="Results" className="mb-0" />
      )}
      
      {/* Stats Row */}
      {stats && (
        <motion.div 
          className={cn(styles.statsRow, compact && styles.statsRowCompact)}
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.average}</div>
            <div className={styles.statLabel}>AVG</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.mode}</div>
            <div className={styles.statLabel}>MODE</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalVotes}</div>
            <div className={styles.statLabel}>{`${mode.labels.rune.toUpperCase()}S`}</div>
          </div>
        </motion.div>
      )}
      
      {/* Bar Chart */}
      <div className={compact ? "flex-1 min-h-0 pr-2" : styles.chartContainer}>
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
      
      {revealed && spread !== null && spread !== undefined && (
        <ConsensusIndicator spread={spread} className="mt-2" />
      )}
    </div>
  );
};
