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
    <RealmShell className="justify-center">
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
        
        {/* Center Hero Panel */}
        <Panel 
          variant="default" // Using default panel for the main focus
          className="max-w-2xl w-full text-center py-16 px-8 sm:px-12 border-pr-primary/20 shadow-[0_0_50px_-10px_rgba(6,182,212,0.15)]"
        >
          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter mb-4 text-pr-text"
            style={{ fontFamily: 'var(--pr-heading-font)', textShadow: '0 4px 20px rgba(6, 182, 212, 0.3)' }}
          >
            PointRealm
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl sm:text-2xl text-pr-primary mb-2 font-medium"
          >
            Co-op estimation, RPG style.
          </motion.p>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
             className="text-pr-text-muted mb-10 text-lg max-w-lg mx-auto"
          >
            Where parties gather to forge an estimate.
          </motion.p>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              variant="primary" 
              onClick={() => navigate('/create')}
              className="min-w-[180px] text-lg py-4 h-auto shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
            >
              Create Realm
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/join')}
              className="min-w-[180px] text-lg py-4 h-auto"
            >
              Join Realm
            </Button>
          </motion.div>

          {/* Microcopy */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-sm text-pr-text-muted uppercase tracking-widest font-semibold"
          >
            Free &bull; Open Source &bull; Self-Host Friendly
          </motion.div>
        </Panel>

        {/* Footer / Tip Jar */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.8 }}
           className="mt-12 text-center"
        >
          <a 
            href={tipUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-pr-text-muted hover:text-pr-secondary transition-colors text-sm font-medium px-4 py-2 rounded-full hover:bg-pr-surface/50"
          >
            <Coffee className="w-4 h-4" />
            <span>Toss a coin to your dev</span>
          </a>
        </motion.div>

      </div>
    </RealmShell>
  );
};
