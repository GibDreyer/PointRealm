import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SoundToggle } from '@/components/SoundToggle';
import { AccountStatus } from '@/components/ui/AccountStatus';

interface RealmShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

export const RealmShell: React.FC<RealmShellProps> = ({
  children,
  title,
  subtitle,
  rightSlot,
  className
}) => {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-bg text-text selection:bg-primary/30", className)}>
      {/* Background Layers */}
      <BackgroundEffects reduceMotion={!!shouldReduceMotion} />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-border/40 bg-surface/80 backdrop-blur-md">
        <div className="container mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex flex-col justify-center">
            {title && (
              <h1 className="text-lg font-heading tracking-wider font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-info to-secondary animate-pulse-slow">
                {title}
              </h1>
            )}
            {subtitle && (
              <span className="text-xs text-textMuted uppercase tracking-widest opacity-80">
                {subtitle}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <SoundToggle />
            <AccountStatus />
            {rightSlot}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 pt-24 pb-8 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

const BackgroundEffects: React.FC<{ reduceMotion: boolean }> = ({ reduceMotion }) => {
  if (reduceMotion) {
    return (
      <div className="absolute inset-0 z-0 opacity-20 bg-[url('/noise.png')] mix-blend-overlay pointer-events-none" />
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Ambient Gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-surfaceElevated via-bg to-bg opacity-80" />
      
      {/* Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <FloatingParticle key={i} index={i} />
        ))}
      </div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
    </div>
  );
};

const FloatingParticle: React.FC<{ index?: number }> = () => {
  const randomX = Math.random() * 100;
  const randomDuration = 10 + Math.random() * 20;
  const randomDelay = Math.random() * 5;
  const size = 2 + Math.random() * 4;

  return (
    <motion.div
      className="absolute rounded-full bg-primary/20 blur-[1px]"
      style={{
        left: `${randomX}%`,
        width: size,
        height: size,
      }}
      animate={{
        y: ['110vh', '-10vh'],
        opacity: [0, 0.5, 0],
      }}
      transition={{
        duration: randomDuration,
        repeat: Infinity,
        delay: randomDelay,
        ease: "linear",
      }}
    />
  );
};
