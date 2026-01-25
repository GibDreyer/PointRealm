import React, { useState } from 'react';
import { PlayCircle, Eye, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { ActionButton } from '@/components/ui/ActionButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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
  const [showConfirmReroll, setShowConfirmReroll] = useState(false);

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

  const handleConfirmReroll = async () => {
    setShowConfirmReroll(false);
    await handleAction('reroll', onReroll);
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
             <ActionButton
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
            <ActionButton
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
              <ActionButton
                icon={<RefreshCw size={18} />}
                label="Re-roll Fates"
                sub="Clear and restart"
                onClick={() => setShowConfirmReroll(true)}
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
        isOpen={showConfirmReroll} 
        onClose={() => setShowConfirmReroll(false)} 
        onConfirm={handleConfirmReroll}
        title="Re-roll the Fates?"
        description="This will clear all current votes and reset the round. This action cannot be undone."
        variant="danger"
      />
    </>
  );
};
