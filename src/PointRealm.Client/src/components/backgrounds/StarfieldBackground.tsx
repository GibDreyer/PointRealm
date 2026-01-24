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
  const mobileScale = isMobile ? 0.6 : 1;
  const reducedScale = reducedMotion ? 0.4 : 1;
  return Math.max(1, Math.round(base * densityMap[density] * mobileScale * reducedScale));
};

export const getParticleOptions = (
  themeTokens: ThemeTokens,
  reducedMotion: boolean,
  density: Density,
  isMobile: boolean,
  type: 'stars' | 'nebula' | 'embers'
): ISourceOptions => {
  const isStars = type === 'stars';
  const isNebula = type === 'nebula';
  
  let baseCount = 80;
  if (isNebula) baseCount = 150;
  if (type === 'embers') baseCount = 10;

  const count = getCount(baseCount, density, isMobile, reducedMotion);

  return {
    fullScreen: { enable: false },
    detectRetina: true,
    fpsLimit: 60,
    particles: {
      number: {
        value: count,
        density: { enable: true, area: 900 },
      },
      color: {
        value: isStars ? ["#ffffff", themeTokens.primary] : 
               isNebula ? [themeTokens.primary, themeTokens.secondary, "#ffffff"] :
               [themeTokens.secondary],
      },
      opacity: {
        value: isStars ? { min: 0.4, max: 1 } : 
               isNebula ? { min: 0.1, max: 0.4 } : 
               { min: 0.2, max: 0.6 },
        animation: {
          enable: !reducedMotion,
          speed: isStars ? 1 : 0.5,
          minimumValue: 0.1,
          sync: false,
        },
      },
      size: {
        value: isStars ? { min: 0.5, max: 2 } : 
               isNebula ? { min: 1, max: 3 } : 
               { min: 1, max: 4 },
        animation: {
          enable: !reducedMotion,
          speed: 1,
          minimumValue: 0.5,
          sync: false
        }
      },
      move: {
        enable: true,
        speed: isStars ? 0.4 : isNebula ? 0.2 : 0.3,
        direction: 'none',
        random: true,
        straight: false,
        outModes: { default: 'out' },
        attract: {
            enable: !reducedMotion,
            rotate: { x: 600, y: 1200 }
        }
      },
      shape: { type: 'circle' },
      // Add twinkling effect for nebula
      twinkle: isNebula ? {
        particles: {
            enable: true,
            color: "#ffffff",
            frequency: 0.05,
            opacity: 1
        }
      } : undefined
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

  const starOptions = useMemo(() => getParticleOptions(themeTokens, shouldReduceMotion, density, isMobile, 'stars'), [themeTokens, shouldReduceMotion, density, isMobile]);
  const nebulaOptions = useMemo(() => getParticleOptions(themeTokens, shouldReduceMotion, density, isMobile, 'nebula'), [themeTokens, shouldReduceMotion, density, isMobile]);
  const emberOptions = useMemo(() => getParticleOptions(themeTokens, shouldReduceMotion, density, isMobile, 'embers'), [themeTokens, shouldReduceMotion, density, isMobile]);

  return (
    <div
      className={styles.wrapper}
      aria-hidden="true"
      data-reduced-motion={shouldReduceMotion ? 'true' : 'false'}
      data-variant={variant}
    >
      <div className={`${styles.layer} ${styles.baseGradient}`} />
      
      {/* Background Star Layer */}
      <Particles className={styles.stars} init={particlesInit} options={starOptions} />
      
      {/* Nebula/Cosmic Dust Layer */}
      <div className={styles.nebulaSystem}>
         <Particles className={styles.nebula} init={particlesInit} options={nebulaOptions} />
      </div>

      <div className={`${styles.fog} ${styles.fogOne}`} />
      <div className={`${styles.fog} ${styles.fogTwo}`} />
      <div className={`${styles.fog} ${styles.fogThree}`} />

      {/* Embers/Foreground Sparks */}
      <Particles className={styles.embers} init={particlesInit} options={emberOptions} />

      <div className={styles.horizon} />
      <div className={styles.foreground} />
      <div className={styles.vignette} />
      <div className={styles.noise} />
    </div>
  );
};
