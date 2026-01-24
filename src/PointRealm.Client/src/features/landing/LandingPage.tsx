import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/Button';
import { RealmShell } from '@/app/layouts/RealmShell';
import { Panel } from '@/components/ui/Panel';
import { Coffee } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const tipUrl = import.meta.env.VITE_TIP_JAR_URL || '#';

  return (
    <RealmShell className="justify-center overflow-hidden">
      {/* Background Focal Glow (Specific to this page) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pr-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full">
        
        {/* Center Hero Panel */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, ease: "easeOut" }}
           className="w-full max-w-3xl"
        >
          <Panel 
            variant="default"
            className="text-center py-20 px-8 sm:px-16 border-pr-primary/10 shadow-2xl relative"
          >
            {/* Ambient pulse on the panel border */}
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-pr-primary/40 to-transparent animate-pulse" />

            {/* Title Section */}
            <div className="mb-12">
              <motion.h1 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-6xl sm:text-7xl md:text-8xl font-black tracking-[0.1em] text-pr-text uppercase mb-2"
                style={{ fontFamily: 'var(--pr-heading-font)', textShadow: '0 0 30px rgba(6, 182, 212, 0.4)' }}
              >
                PointRealm
              </motion.h1>

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-px w-12 bg-pr-primary/30" />
                <span className="text-pr-primary uppercase tracking-[0.3em] text-xs font-black">Co-op Estimation</span>
                <div className="h-px w-12 bg-pr-primary/30" />
              </div>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-pr-text-muted text-sm max-w-lg mx-auto leading-relaxed font-bold tracking-wide italic"
              >
                Assemble your party, inscribe the runes, and forge a consensus that will stand the test of the sprint.
              </motion.p>
            </div>

            {/* Actions Area */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
            >
              <Button 
                variant="primary" 
                onClick={() => navigate('/create')}
                className="min-w-[220px] shadow-glow-primary group relative overflow-hidden"
              >
                <span className="relative z-10">Summon Realm</span>
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/join')}
                className="min-w-[220px] group"
              >
                <span className="relative z-10">Enter Gateway</span>
              </Button>
            </motion.div>

            {/* Social / Info Footer */}
            <div className="flex items-center justify-center gap-6 pt-8 border-t border-pr-border/20 mt-4 opacity-40">
              <span className="text-[10px] uppercase font-black tracking-widest text-pr-text-muted">GPL-3.0</span>
              <div className="w-1 h-1 rounded-full bg-pr-border" />
              <span className="text-[10px] uppercase font-black tracking-widest text-pr-text-muted">Distributed Core</span>
              <div className="w-1 h-1 rounded-full bg-pr-border" />
              <span className="text-[10px] uppercase font-black tracking-widest text-pr-text-muted">Self-Hosted</span>
            </div>
          </Panel>
        </motion.div>

        {/* Footer / Tip Jar (Tasteful) */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.8 }}
           className="mt-16 text-center"
        >
          <a 
            href={tipUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 text-pr-text-muted/60 hover:text-pr-secondary transition-all text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <Coffee className="w-4 h-4 transition-transform group-hover:rotate-12" />
            <span>Toss a coin to the dev</span>
          </a>
        </motion.div>

      </div>
    </RealmShell>
  );
};
