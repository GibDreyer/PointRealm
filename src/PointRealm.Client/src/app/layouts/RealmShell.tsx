import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RealmBackground } from '../../components/ui/RealmBackground';
import { cn } from '../../lib/utils';

interface RealmShellProps {
  children: React.ReactNode;
  className?: string;
  showBackground?: boolean;
}

export const RealmShell: React.FC<RealmShellProps> = ({ 
  children, 
  className,
  showBackground = true 
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-pr-bg text-pr-text selection:bg-pr-primary selection:text-black">
      {/* Global Background */}
      {showBackground && <RealmBackground />}

      {/* Main Content Container */}
      <main className={cn(
        "relative z-10 w-full min-h-screen flex flex-col items-center",
        "p-4 sm:p-6 lg:p-8", 
        className
      )}>
        {/* Max width wrapper */}
        <div className="w-full max-w-6xl flex-1 flex flex-col">
          <motion.div
            // key={location.pathname} // Disable key-based remounting for now to avoid jumpiness during nav inside same layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: prefersReducedMotion ? 0 : 0.3,
              ease: "easeOut" 
            }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
