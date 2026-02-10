import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, WifiOff } from 'lucide-react';
import type { ConnectionStatus } from './types';
import { cn } from '@/lib/utils';

interface Props {
  status: ConnectionStatus;
  onRetry?: () => void;
  className?: string;
}

const STATUS_COPY: Record<
  ConnectionStatus,
  { title: string; subtitle: string }
> = {
  connected: { title: '', subtitle: '' },
  connecting: { title: 'Weaving the portal...', subtitle: 'Linking to the realm' },
  reconnecting: {
    title: 'The portal is unstable… reconnecting',
    subtitle: 'Connection lost',
  },
  disconnected: {
    title: 'The portal has fallen silent',
    subtitle: 'Connection lost',
  },
  error: {
    title: 'The sigil has faded',
    subtitle: 'Connection lost',
  },
};

export function ConnectionStatusBanner({ status, onRetry, className }: Props) {
  if (status === 'connected') return null;

  const copy = STATUS_COPY[status];
  const isWorking = status === 'connecting' || status === 'reconnecting';
  const Icon = status === 'error' ? AlertTriangle : status === 'disconnected' ? WifiOff : Loader2;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={cn(
        'sticky top-0 z-[120] w-full border-b border-pr-border/70',
        'bg-pr-surface/90 backdrop-blur-md',
        'shadow-[0_8px_24px_rgba(0,0,0,0.35)]',
        className
      )}
    >
      <div className="relative max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'var(--pr-texture-noise-overlay)' }} />
        <div className="absolute inset-0 pointer-events-none rounded-b-2xl ring-1 ring-white/5 ring-inset" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-pr-primary/10 border border-pr-primary/20 shadow-[0_0_12px_rgba(96,215,255,0.18)]">
            <Icon size={16} className={cn('text-pr-primary', isWorking && 'animate-spin')} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.35em] text-pr-text-muted">Realm Signal</span>
            <span className="text-sm font-semibold text-pr-text">{copy.title}</span>
            <span className="text-[11px] text-pr-text-muted">{copy.subtitle}</span>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isWorking}
            className="relative z-10 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.35em] font-black border border-pr-primary/30 text-pr-primary hover:text-pr-text hover:border-pr-primary/60 transition-all disabled:opacity-50 bg-black/30"
            aria-label="Retry connection"
            title="Retry connection"
          >
            {isWorking ? 'Stabilizing…' : 'Relink'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
