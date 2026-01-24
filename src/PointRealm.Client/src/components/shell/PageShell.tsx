import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FantasySky3D } from '@/components/backgrounds/FantasySky3D';

interface PageShellProps {
  children: React.ReactNode;
  className?: string | undefined;
  contentClassName?: string | undefined;
  showBackground?: boolean;
  backgroundDensity?: 'low' | 'medium' | 'high';
  backgroundVariant?: 'default' | 'realm';
  reducedMotion?: boolean;
}

export const PageShell: React.FC<PageShellProps> = ({
  children,
  className,
  contentClassName,
  showBackground = true,
  backgroundDensity = 'medium',
  backgroundVariant = 'default',
  reducedMotion,
}) => {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const shouldReduceMotion = reducedMotion ?? prefersReducedMotion;

  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-pr-bg text-pr-text", className)}>
      {showBackground && (
        <FantasySky3D 
          variant={backgroundVariant} 
          reducedMotion={shouldReduceMotion} 
        />
      )}
      <main className={cn("relative z-10 min-h-screen w-full", contentClassName)}>
        {children}
      </main>
    </div>
  );
};
