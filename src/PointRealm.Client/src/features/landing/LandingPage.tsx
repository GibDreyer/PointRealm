import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Beer } from 'lucide-react';
import { Button } from '@/components/Button';
import { PageShell } from '@/components/shell/PageShell';
import styles from './landing.module.css';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const tipUrl = import.meta.env.VITE_TIP_JAR_URL || '/tip';
  const tipIsExternal = /^https?:\/\//i.test(tipUrl);
  const enter = { opacity: 1, y: 0 };
  const enterFrom = { opacity: 0, y: 14 };
  const easeOut = "easeOut";

  return (
    <PageShell
      backgroundDensity="medium"
      reducedMotion={prefersReducedMotion}
      contentClassName={styles.page}
    >
      <section className={styles.hero}>
        <motion.h1
          className={styles.title}
          initial={enterFrom}
          animate={enter}
          transition={{ duration: 0.28, ease: easeOut }}
        >
          <span className={styles.titleOrnament} aria-hidden="true" />
          <span className={styles.titleText}>PointRealm</span>
          <span className={styles.titleOrnament} aria-hidden="true" />
        </motion.h1>
        <motion.p
          className={styles.subtitle}
          initial={enterFrom}
          animate={enter}
          transition={{ duration: 0.25, ease: easeOut, delay: 0.05 }}
        >
          Co-op estimation, RPG style.
        </motion.p>
        <div className={styles.runeDivider} aria-hidden="true">
          <span className={styles.runeGem} />
        </div>
        <motion.div
          className={styles.actions}
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.3, ease: easeOut, delay: 0.12, staggerChildren: 0.07 },
            },
          }}
        >
          <motion.div variants={{ hidden: enterFrom, show: enter }}>
            <Button
              variant="ghost"
              onClick={() => navigate('/create')}
              className={`${styles.heroButton} ${styles.primaryButton} normal-case text-base sm:text-lg tracking-[0.08em]`}
            >
              Create Realm
            </Button>
          </motion.div>
          <motion.div variants={{ hidden: enterFrom, show: enter }}>
            <Button
              variant="ghost"
              onClick={() => navigate('/join')}
              className={`${styles.heroButton} ${styles.secondaryButton} normal-case text-base sm:text-lg tracking-[0.08em]`}
            >
              Join Realm
            </Button>
          </motion.div>
        </motion.div>
        <motion.p
          className={styles.microcopy}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: easeOut, delay: 0.2 }}
        >
          Free, open source, self-host friendly.
        </motion.p>
        <motion.a
          className={styles.tip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: easeOut, delay: 0.28 }}
          href={tipUrl}
          target={tipIsExternal ? "_blank" : undefined}
          rel={tipIsExternal ? "noopener noreferrer" : undefined}
        >
          <Beer className={styles.tipIcon} aria-hidden="true" />
          Toss a coin to your dev
        </motion.a>
      </section>
    </PageShell>
  );
};
