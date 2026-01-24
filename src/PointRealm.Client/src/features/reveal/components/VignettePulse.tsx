import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from '../ProphecyReveal.module.css';

interface VignettePulseProps {
  active: boolean;
}

export const VignettePulse: React.FC<VignettePulseProps> = ({ active }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        className={styles.vignette}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      />
    )}
  </AnimatePresence>
);
