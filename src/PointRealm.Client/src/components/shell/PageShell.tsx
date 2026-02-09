import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FantasySky3D } from '@/components/backgrounds/FantasySky3D';
import { useTheme } from '@/theme/ThemeProvider';
import { AccountStatus } from '@/components/ui/AccountStatus';
import { ThemeModeToggle } from '@/components/ui/ThemeModeToggle';
import { useThemeMode } from '@/theme/ThemeModeProvider';

interface PageShellProps {
  children: React.ReactNode;
  className?: string | undefined;
  contentClassName?: string | undefined;
  showBackground?: boolean;
  backgroundDensity?: 'low' | 'medium' | 'high';
  backgroundVariant?: 'default' | 'realm';
  reducedMotion?: boolean;
  hideAccountStatus?: boolean;
  showThemeToggle?: boolean;
}

export const PageShell: React.FC<PageShellProps> = ({
  children,
  className,
  contentClassName,
  showBackground = true,
  backgroundDensity = 'medium',
  backgroundVariant = 'default',
  reducedMotion,
  hideAccountStatus = false,
  showThemeToggle = true,
}) => {
  const { theme } = useTheme();
  const { mode } = useThemeMode();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const shouldReduceMotion = reducedMotion ?? prefersReducedMotion;
  const showBackdrop = showBackground && mode.showBackdrop;

  const vibe = theme.effects?.vibe || 'arcane';
  const particleColor = theme.effects?.particleColor || 'var(--pr-primary)';

  return (
    <div
      className={cn("relative min-h-screen w-full overflow-hidden", mode.styles.shell, className)}
      data-background-density={backgroundDensity}
    >
      {showBackdrop && (
        <>
          <FantasySky3D 
            variant={backgroundVariant} 
            reducedMotion={shouldReduceMotion} 
            vibe={vibe}
            primaryColor={particleColor}
          />
          <div className="bg-gradient-overlay" />
          <div className="vignette-focus" />
          <div className="magical-border" />
        </>
      )}
      {showThemeToggle && (
        <ThemeModeToggle className="fixed top-6 left-6 z-40" />
      )}
      {!hideAccountStatus && <AccountStatus className="fixed top-8 right-8" />}
      <main className={cn("relative z-10 min-h-screen w-full", contentClassName)}>
        {children}
      </main>
    </div>
  );
};
