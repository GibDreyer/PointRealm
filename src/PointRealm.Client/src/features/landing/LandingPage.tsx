import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/Button';
import { PortalPreviewCard } from './PortalPreviewCard';

/* 
  Background Effect Component
  Renders noise overlay and floating particles using CSS animations
*/
const BackgroundEffects = () => {
  const prefersReducedMotion = useReducedMotion();

  // Simple clean noise data uri (tiny pattern)
  const noiseUrl = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Base Background Color will come from body/theme, but we ensure coverage */}
      <div 
        className="absolute inset-0" 
        style={{ backgroundColor: 'var(--pr-bg)' }}
      />

      {/* Noise Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: noiseUrl }}
      />

      {/* Fog / Star layers - only if motion allowed */}
      {!prefersReducedMotion && (
        <>
           {/* Drifting Stars/Particles Layer 1 */}
           <div 
            className="absolute inset-0 opacity-30"
            style={{
               background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 1px, transparent 1px)',
               backgroundSize: '60px 60px',
               animation: 'drift 60s linear infinite',
            }}
           />
           {/* Drifting Stars Layer 2 (Offset) */}
           <div 
             className="absolute inset-0 opacity-20"
             style={{
               background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 1px, transparent 1px)',
               backgroundSize: '90px 90px',
               animation: 'drift-reverse 80s linear infinite',
             }}
           />
           {/* Single Glow Accent (Top Left-ish) */}
           <div 
             className="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] rounded-full blur-[100px] opacity-20"
             style={{ background: 'var(--pr-primary)' }}
           />
        </>
      )}

      {/* Styles for drift animations */}
      <style>{`
        @keyframes drift {
          from { transform: translateY(0); }
          to { transform: translateY(-60px); }
        }
        @keyframes drift-reverse {
          from { transform: translateY(0); }
          to { transform: translateY(60px); }
        }
      `}</style>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const tipUrl = import.meta.env.VITE_TIP_JAR_URL || '#';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.35, 
        ease: "easeOut" as const,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" as const } 
    }
  };

  return (
    <>
      <BackgroundEffects />
      
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-[1100px] h-full flex flex-col justify-between">
          
          {/* Main Grid Layout */}
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 items-center lg:items-center py-12 lg:py-24">
            
            {/* Left Column: Hero Content */}
            <motion.div 
              className="w-full text-center lg:text-left space-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div>
                <motion.h1 
                  variants={itemVariants}
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight"
                  style={{ fontFamily: 'var(--pr-heading-font)', color: 'var(--pr-text)' }}
                >
                  PointRealm
                </motion.h1>
                <motion.h2 
                  variants={itemVariants}
                  className="text-xl sm:text-2xl font-medium opacity-90 mb-6"
                  style={{ color: 'var(--pr-primary)' }}
                >
                  Co-op estimation, RPG style.
                </motion.h2>
                
                <motion.div variants={itemVariants} className="space-y-1">
                  <p className="text-sm font-medium uppercase tracking-wider opacity-60" style={{ color: 'var(--pr-text)' }}>
                    Free, open source, self-host friendly.
                  </p>
                  <p className="text-base sm:text-lg max-w-md mx-auto lg:mx-0 opacity-80" style={{ color: 'var(--pr-text-muted)' }}>
                    Real-time planning poker with realms, quests, and encounters.
                  </p>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <motion.div 
                variants={itemVariants} 
                className="flex flex-col sm:flex-row gap-4 w-full justify-center lg:justify-start pt-4"
              >
                <div className="w-full sm:w-auto">
                  <Button 
                    variant="primary" 
                    fullWidth 
                    onClick={() => navigate('/create')}
                    aria-label="Create a new realm"
                  >
                    Create Realm
                  </Button>
                </div>
                <div className="w-full sm:w-auto">
                  <Button 
                    variant="secondary" 
                    fullWidth 
                    onClick={() => navigate('/join')}
                    aria-label="Join an existing realm"
                  >
                    Join Realm
                  </Button>
                </div>
              </motion.div>

            </motion.div>

            {/* Right Column: Portal Preview */}
            <motion.div 
              className="w-full mt-12 lg:mt-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <PortalPreviewCard />
            </motion.div>

          </div>

          {/* Footer */}
          <motion.footer 
            className="w-full py-8 border-t flex flex-col sm:flex-row justify-between items-center text-sm gap-4"
            style={{ borderColor: 'var(--pr-border)', color: 'var(--pr-text-muted)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div>
              Open source. Self-hosted. No nonsense.
            </div>
            
            <a 
              href={tipUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline transition-colors"
              style={{ color: 'var(--pr-text-muted)' }}
            >
              Buy the dev a coffee
            </a>
          </motion.footer>

        </div>
      </main>
    </>
  );
};
