import { cn } from '@/lib/utils';

const DEFAULT_EMOJIS = [
  '😀',
  '😄',
  '😎',
  '🤠',
  '🧙',
  '🧝',
  '🧛',
  '🧟',
  '🦸',
  '🐉',
  '🦄',
  '🪄',
  '⚔️',
  '🛡️',
  '🔥',
  '🌙',
  '⭐',
  '💫',
  '🍀',
  '🐺',
  '🦊',
  '🐻',
  '🦉',
  '🐸',
];

interface EmojiPickerProps {
  selectedEmoji?: string | null;
  onSelect?: (emoji: string) => void;
  className?: string;
  disabled?: boolean;
}

export function EmojiPicker({
  selectedEmoji,
  onSelect,
  className,
  disabled = false,
}: EmojiPickerProps) {
  return (
    <div className={cn('grid grid-cols-6 gap-2', className)}>
      {DEFAULT_EMOJIS.map((emoji) => {
        const isSelected = selectedEmoji === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect?.(emoji)}
            disabled={disabled}
            aria-pressed={isSelected}
            className={cn(
              'h-10 w-10 rounded-lg border text-lg transition-all',
              'bg-pr-surface/30 border-pr-border/30 hover:border-pr-primary/50 hover:bg-pr-surface/60',
              isSelected && 'border-pr-primary bg-pr-primary/10 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
              disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
