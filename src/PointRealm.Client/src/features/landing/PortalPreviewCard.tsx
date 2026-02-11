import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type PortalPreviewCardProps = {
  prefersReducedMotion?: boolean;
};

const RUNES = [1, 2, 3, 5, 8] as const;

const CONSENSUS_EXAMPLES: Record<number, string> = {
  1: 'Quick task. Everyone aligns around "tiny tweak".',
  2: 'Small change. Team can deliver with little risk.',
  3: 'Straightforward story. A bit of testing, still predictable.',
  5: 'Medium quest. Some unknowns, but shared understanding emerges.',
  8: 'Big uncertainty. Team agrees to split and clarify first.',
};

export const PortalPreviewCard: React.FC<PortalPreviewCardProps> = ({ prefersReducedMotion = false }) => {
  const framerReducedMotion = useReducedMotion() ?? false;
  const reducedMotion = prefersReducedMotion || framerReducedMotion;
  const [selectedRune, setSelectedRune] = React.useState<number | null>(null);

  const revealMessage = selectedRune
    ? `You picked ${selectedRune}. ${CONSENSUS_EXAMPLES[selectedRune]}`
    : 'Pick a rune to preview how consensus is revealed.';

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut', delay: 0.1 }}
      className="relative w-full max-w-sm mx-auto overflow-hidden border rounded-xl select-none"
      style={{
        backgroundColor: 'var(--pr-surface-elevated)',
        borderColor: 'var(--pr-border)',
        boxShadow: 'var(--pr-shadow-soft)',
      }}
    >
      {/* Header with Title and Code */}
      <div className="p-6 pb-4">
        <h3
          className="text-lg font-bold mb-1"
          style={{ fontFamily: 'var(--pr-heading-font)', color: 'var(--pr-text)' }}
        >
          30-second demo
        </h3>
        <p
          className="text-sm mb-4"
          style={{ color: 'var(--pr-text-muted)' }}
        >
          Pick a rune like a teammate, then reveal what "team consensus" looks like.
        </p>

        {/* Fake Code Pill */}
        <div 
          className="inline-flex items-center justify-center px-4 py-2 font-mono text-xl font-bold rounded-lg w-full mb-2 tracking-widest"
          style={{ 
            backgroundColor: 'color-mix(in srgb, var(--pr-bg), transparent 70%)', 
            color: 'var(--pr-primary)',
            fontFamily: 'var(--pr-mono-font)',
            border: '1px solid var(--pr-border)'
          }}
        >
          PR-7K3Q
        </div>
      </div>

      {/* Rune Divider */}
      <div className="flex items-center justify-center py-2 opacity-50">
        <svg width="100%" height="16" viewBox="0 0 200 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 8H90L100 8L110 8H200" stroke="var(--pr-border)" strokeWidth="1"/>
          <path d="M100 4L104 8L100 12L96 8L100 4Z" fill="var(--pr-secondary)"/>
        </svg>
      </div>

      {/* Rune Cards Section */}
      <div className="p-6 pt-2 bg-[color-mix(in_srgb,var(--pr-bg),transparent_80%)]">
        <div className="flex justify-between items-center space-x-2">
          {RUNES.map((val, i) => {
            const isSelected = selectedRune === val;
            return (
            <button
              key={val}
              type="button"
              aria-label={`Pick rune ${val}`}
              aria-pressed={isSelected}
              onClick={() => setSelectedRune(val)}
              className="h-16 w-10 rounded border flex items-center justify-center relative"
              style={{
                backgroundColor: 'var(--pr-surface)',
                borderColor: 'var(--pr-border)',
                boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--pr-text), transparent 95%)',
                transform: `rotate(${i % 2 === 0 ? 2 : -2}deg)`,
                outline: isSelected ? '2px solid var(--pr-primary)' : 'none',
                outlineOffset: '2px',
              }}
            >
              <span
                className="font-bold text-sm"
                style={{ color: isSelected ? 'var(--pr-primary)' : 'var(--pr-text-muted)' }}
              >
                {val}
              </span>
            </button>
            );
          })}
        </div>
        <motion.div
          aria-live="polite"
          className="mt-4 rounded-md border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--pr-border)',
            backgroundColor: 'color-mix(in srgb, var(--pr-primary), transparent 92%)',
            color: 'var(--pr-text)',
          }}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
        >
          {revealMessage}
        </motion.div>
      </div>

      {/* Glow Effect (Subtle) under header */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'var(--pr-primary)',
          opacity: 0.1,
          transform: 'translate(40%, -40%)'
        }}
      />
    </motion.div>
  );
};
