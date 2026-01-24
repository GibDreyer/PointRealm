import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Particles from 'react-tsparticles';
import type { Engine, ISourceOptions } from 'tsparticles-engine';
import { loadSlim } from 'tsparticles-slim';
import { useReducedMotion } from 'framer-motion';
import { useTheme } from '@/theme/ThemeProvider';
import styles from './StarfieldBackground.module.css';

type Density = 'low' | 'medium' | 'high';

interface StarfieldBackgroundProps {
  density?: Density;
  reducedMotion?: boolean;
  variant?: 'default' | 'realm';
}

interface ThemeTokens {
  primary: string;
  secondary: string;
  textMuted: string;
}

const densityMap: Record<Density, number> = {
  low: 0.7,
  medium: 1,
  high: 1.3,
};

const getCount = (base: number, density: Density, isMobile: boolean, reducedMotion: boolean) => {
  const mobileScale = isMobile ? 0.56 : 1;
  const reducedScale = reducedMotion ? 0.5 : 1;
  return Math.max(1, Math.round(base * densityMap[density] * mobileScale * reducedScale));
};

export const getStarfieldOptions = (
  themeTokens: ThemeTokens,
  reducedMotion: boolean,
  density: Density,
  isMobile: boolean,
  variant: 'stars' | 'embers'
): ISourceOptions => {
  const isStars = variant === 'stars';
  const baseCount = isStars ? 80 : 6;
  const count = getCount(baseCount, density, isMobile, reducedMotion);

  const speedRange: [number, number] = isStars ? [0.15, 0.35] : [0.08, 0.18];
  const speed = reducedMotion ? 0.02 : speedRange[1];

  const sizeRange: [number, number] = isStars ? [0.6, 1.8] : [1.0, 2.5];
  const opacityRange: [number, number] = isStars ? [0.4, 0.9] : [0.15, 0.35];

  return {
    fullScreen: { enable: false },
    detectRetina: true,
    fpsLimit: 60,
    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
    particles: {
      number: {
        value: count,
        density: {
          enable: true,
          area: 900,
        },
      },
      color: {
        value: isStars
          ? [themeTokens.textMuted, themeTokens.primary]
          : [themeTokens.secondary],
      },
      opacity: {
        value: { min: opacityRange[0], max: opacityRange[1] },
        animation: {
          enable: isStars && !reducedMotion,
          speed: 0.4,
          minimumValue: opacityRange[0],
          sync: false,
        },
      },
      size: {
        value: { min: sizeRange[0], max: sizeRange[1] },
      },
      move: {
        enable: true,
        speed,
        direction: 'none',
        straight: false,
        outModes: { default: 'out' },
      },
      shape: { type: 'circle' },
    },
    interactivity: {
      events: {
        onHover: { enable: false, mode: [] },
        onClick: { enable: false, mode: [] },
        resize: true,
      },
    },
  };
};

export const StarfieldBackground: React.FC<StarfieldBackgroundProps> = ({
  density = 'medium',
  reducedMotion,
  variant = 'default',
}) => {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const shouldReduceMotion = reducedMotion ?? prefersReducedMotion;
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  const themeTokens = useMemo<ThemeTokens>(() => ({
    primary: theme.tokens.colors.primary,
    secondary: theme.tokens.colors.secondary,
    textMuted: theme.tokens.colors.textMuted,
  }), [theme.tokens.colors.primary, theme.tokens.colors.secondary, theme.tokens.colors.textMuted]);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const starsOptions = useMemo(
    () => getStarfieldOptions(themeTokens, shouldReduceMotion, density, isMobile, 'stars'),
    [themeTokens, shouldReduceMotion, density, isMobile]
  );

  const embersOptions = useMemo(
    () => getStarfieldOptions(themeTokens, shouldReduceMotion, density, isMobile, 'embers'),
    [themeTokens, shouldReduceMotion, density, isMobile]
  );
  const showParticles = variant === 'default';
  const showEmbers = variant === 'default';
  const showBackdrop = variant === 'default';
  const showHorizon = variant === 'default';
  const showForeground = variant === 'default';
  const showRunes = variant === 'realm';

  return (
    <div
      className={styles.wrapper}
      aria-hidden="true"
      data-reduced-motion={shouldReduceMotion ? 'true' : 'false'}
      data-variant={variant}
    >
      <div className={`${styles.layer} ${styles.baseGradient}`} />
      {showBackdrop && <div className={`${styles.layer} ${styles.backdrop}`} />}
      {showParticles && <Particles className={styles.stars} init={particlesInit} options={starsOptions} />}
      {showEmbers && <Particles className={styles.embers} init={particlesInit} options={embersOptions} />}
      <div className={`${styles.fog} ${styles.fogOne}`} />
      <div className={`${styles.fog} ${styles.fogTwo}`} />
      <div className={`${styles.fog} ${styles.fogThree}`} />
      {showHorizon && <div className={styles.horizon} />}
      {showForeground && <div className={styles.foreground} />}
      {showRunes && <div className={styles.runeShimmer} />}
      <div className={styles.vignette} />
      <div className={styles.noise} />
    </div>
  );
};
