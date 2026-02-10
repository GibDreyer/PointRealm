import React from 'react';
import { Sparkles, Cpu, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeMode } from '@/theme/ThemeModeProvider';

const modeIcons = {
  fantasy: Sparkles,
  'sci-fi': Cpu,
  minimal: Minus,
} as const;

export const ThemeModeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { mode, setModeKey, availableModes } = useThemeMode();

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full border px-2 py-1 backdrop-blur-sm shadow-sm',
        mode.styles.toggle,
        className
      )}
      role="group"
      aria-label="Theme mode"
    >
      {availableModes.map((option) => {
        const Icon = modeIcons[option.key];
        const isActive = option.key === mode.key;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => setModeKey(option.key)}
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition',
              'hover:text-pr-text',
              isActive ? mode.styles.toggleActive : 'text-pr-text-muted'
            )}
            aria-pressed={isActive}
            aria-label={`Switch to ${option.label} theme`}
            title={`Switch to ${option.label} theme`}
          >
            <Icon size={12} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
