import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/Button';
import { PageShell } from '@/components/shell/PageShell';
import { PageFooter } from '@/components/ui/PageFooter';
import { PageHeader } from '@/components/ui/PageHeader';
import { useThemeMode } from '@/theme/ThemeModeProvider';
import { PortalPreviewCard } from './PortalPreviewCard';
import styles from './landing.module.css';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const tipUrl = import.meta.env.VITE_TIP_JAR_URL || '/tip';
  const tipIsExternal = /^https?:\/\//i.test(tipUrl);
  const enter = { opacity: 1, y: 0 };
  const enterFrom = { opacity: 0, y: 14 };
  const easeOut = 'easeOut';
  const { mode } = useThemeMode();

  return (
    <PageShell
      backgroundDensity="medium"
      reducedMotion={prefersReducedMotion}
      contentClassName={styles.page}
    >
      <section className={styles.hero}>
        <motion.div
          className={styles.headerWrap}
          initial={prefersReducedMotion ? false : enterFrom}
          animate={enter}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: easeOut }}
        >
          <PageHeader
            title="PointRealm"
            subtitle={mode.phrases.tagline}
            size="hero"
            showOrnaments
          />
        </motion.div>
        <motion.div
          className={styles.actions}
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: {
              opacity: 1,
              y: 0,
              transition: prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.3, ease: easeOut, delay: 0.12, staggerChildren: 0.07 },
            },
          }}
        >
          <motion.div variants={{ hidden: enterFrom, show: enter }}>
            <Button
              variant="primary"
              onClick={() => navigate('/create')}
              className={styles.heroButton}
            >
              {mode.phrases.createRealm}
            </Button>
          </motion.div>
          <motion.div variants={{ hidden: enterFrom, show: enter }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/join')}
              className={styles.heroButton}
            >
              {mode.phrases.joinRealm}
            </Button>
          </motion.div>
        </motion.div>
        <motion.div
          className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: easeOut, delay: 0.18 }}
        >
          <Button variant="ghost" onClick={() => navigate('/auth/login')}>
            Sign In
          </Button>
          <Button variant="ghost" onClick={() => navigate('/auth/register')}>
            Create Account
          </Button>
          <Button variant="ghost" onClick={() => navigate('/account')}>
            View Account
          </Button>
        </motion.div>
        <section className={styles.onboarding} aria-label="How PointRealm works">
          <div className={styles.howItWorks}>
            <h2 className={styles.sectionTitle}>How it works in 30 seconds</h2>
            <ol className={styles.steps}>
              <li>
                <strong>1. Join a realm</strong>
                <p>Share a short room code so everyone estimates the same story together.</p>
              </li>
              <li>
                <strong>2. Pick your rune</strong>
                <p>Vote privately with a card value that reflects effort and uncertainty.</p>
              </li>
              <li>
                <strong>3. Reveal and align</strong>
                <p>See everyone&apos;s picks at once, discuss differences, and lock a team estimate.</p>
              </li>
            </ol>
          </div>
          <PortalPreviewCard prefersReducedMotion={prefersReducedMotion} />
        </section>
        <motion.div
          className={styles.footerWrap}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: easeOut, delay: 0.2 }}
        >
          <PageFooter tipUrl={tipUrl} tipIsExternal={tipIsExternal} />
        </motion.div>
      </section>
    </PageShell>
  );
};
