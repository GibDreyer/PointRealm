import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './ConsensusIndicator.module.css';

interface ConsensusIndicatorProps {
  spread: number;
  className?: string;
}

export const ConsensusIndicator: React.FC<ConsensusIndicatorProps> = ({
  spread,
  className
}) => {
  const prefersReducedMotion = useReducedMotion() ?? false;

  const getConsensusColor = () => {
    if (spread <= 2) return 'linear-gradient(90deg, var(--pr-success), #22c55e)';
    if (spread <= 5) return 'linear-gradient(90deg, var(--pr-warning), #fbbf24)';
    return 'linear-gradient(90deg, var(--pr-danger), #f87171)';
  };

  const getConsensusText = () => {
    if (spread <= 2) return 'High agreement';
    if (spread <= 5) return 'Moderate spread';
    return 'Wide disagreement';
  };

  return (
    <motion.div 
      className={`${styles.consensus} ${className ?? ''}`}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <div className={styles.consensusLabel}>Consensus Level</div>
      <div className={styles.consensusBar}>
        <motion.div 
          className={styles.consensusFill}
          style={{ background: getConsensusColor() }}
          initial={prefersReducedMotion ? {} : { width: 0 }}
          animate={{ width: `${Math.max(20, 100 - spread * 8)}%` }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className={styles.consensusText}>{getConsensusText()}</div>
    </motion.div>
  );
};
