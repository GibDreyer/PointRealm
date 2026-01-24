import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';

interface GMControlsProps {
  phase: "lobby" | "voting" | "revealed";
  canGM: boolean;
  disabledReason?: string;
  onStartEncounter: () => Promise<void>;
  onReveal: () => Promise<void>;
  onReroll: () => Promise<void>;
  onSealOutcome: (value: string) => Promise<void>;
  className?: string;
}

export const GMControls: React.FC<GMControlsProps> = ({
  phase,
  canGM,
  disabledReason,
  onStartEncounter,
  onReveal,
  onReroll,
  // onSealOutcome,
  className
}) => {
  const { play } = useSound();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'reroll' | 'reset', onConfirm: () => Promise<void> } | null>(null);

  if (!canGM) return null;

  const handleAction = async (name: string, action: () => Promise<void>) => {
    try {
      setLoading(name);
      play('select');
      await action();
    } finally {
      setLoading(null);
    }
  };

  const confirmReroll = () => {
    setConfirmAction({
      type: 'reroll',
      onConfirm: async () => {
        setConfirmAction(null);
        await handleAction('reroll', onReroll);
      }
    });
  };

  return (
    <>
      <div className={cn("flex flex-col gap-4 bg-surface/40 backdrop-blur-sm p-4 rounded-xl border border-border/50", className)}>
        <div className="flex items-center gap-2 text-textMuted pb-2 border-b border-border/30">
          <Eye size={18} />
          <h2 className="text-sm uppercase tracking-widest font-bold">Facilitator</h2>
        </div>

        <div className="flex flex-col gap-3">
          {phase === 'lobby' && (
             <ControlBtn
               icon={<PlayCircle size={18} />}
               label="Begin Encounter"
               sub="Start a new round"
               onClick={() => handleAction('start', onStartEncounter)}
               loading={loading === 'start'}
               disabled={!!disabledReason}
               variant="primary"
             />
          )}

          {phase === 'voting' && (
            <ControlBtn
              icon={<Eye size={18} />}
              label="Reveal Prophecy"
              sub="Show all votes"
              onClick={() => handleAction('reveal', onReveal)}
              loading={loading === 'reveal'}
              disabled={!!disabledReason}
              variant="action"
            />
          )}

          {phase === 'revealed' && (
            <>
              <ControlBtn
                icon={<RefreshCw size={18} />}
                label="Re-roll Fates"
                sub="Clear and restart"
                onClick={confirmReroll}
                disabled={!!loading}
                variant="danger"
              />
              {/* Seal Button placeholder - usually triggered by selecting a card in revealed state */}
              <div className="text-xs text-center text-textMuted italic mt-2">
                Select a card to Seal Outcome
              </div>
            </>
          )}

          {disabledReason && (
            <div className="text-xs text-warning text-center bg-warning/10 p-2 rounded">
              {disabledReason}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog 
        isOpen={!!confirmAction} 
        onClose={() => setConfirmAction(null)} 
        onConfirm={confirmAction?.onConfirm}
        title="Re-roll the Fates?"
        description="This will clear all current votes and reset the round. This action cannot be undone."
      />
    </>
  );
};

interface ControlBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  loading?: boolean;
  variant?: 'primary' | 'action' | 'danger' | 'default';
}

const ControlBtn: React.FC<ControlBtnProps> = ({ icon, label, sub, loading, variant = 'default', className, ...props }) => {
  const variants = {
    primary: "bg-primary/20 hover:bg-primary/30 text-primary border-primary/30",
    action: "bg-secondary/20 hover:bg-secondary/30 text-secondary border-secondary/30",
    danger: "bg-danger/10 hover:bg-danger/20 text-danger border-danger/20",
    default: "bg-surfaceElevated hover:bg-surface border-border",
  };

  return (
    <button
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      <div className={cn("p-2 rounded-full bg-black/20", loading && "animate-spin")}>
        {loading ? <RefreshCw size={18} /> : icon}
      </div>
      <div className="flex flex-col items-start">
        <span className="text-sm font-bold leading-none">{label}</span>
        {sub && <span className="text-[10px] opacity-80 mt-1">{sub}</span>}
      </div>
    </button>
  );
};

const ConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: any;
  title: string;
  description: string;
}> = ({ isOpen, onClose, onConfirm, title, description }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center -translate-y-[100px] pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative pointer-events-auto bg-surface border border-danger/30 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-danger/0 via-danger to-danger/0" />
            
            <div className="flex flex-col gap-4 text-center items-center">
              <div className="p-3 rounded-full bg-danger/10 text-danger mb-2">
                <AlertTriangle size={24} />
              </div>
              
              <h3 className="text-lg font-bold font-heading">{title}</h3>
              <p className="text-sm text-textMuted">{description}</p>
              
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 rounded-lg border border-border hover:bg-surfaceElevated transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2 rounded-lg bg-danger hover:bg-danger/90 text-white font-bold transition-colors text-sm"
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
