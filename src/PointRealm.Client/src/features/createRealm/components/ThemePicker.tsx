import { useTheme } from '../../../theme/ThemeProvider';
import { ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ThemePickerProps {
  selectedThemeKey: string;
  onThemeSelect: (key: string) => void;
}

export function ThemePicker({ selectedThemeKey, onThemeSelect }: ThemePickerProps) {
  const { availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTheme = availableThemes.find(t => t.key === selectedThemeKey) || availableThemes[0]!;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-[var(--pr-text-muted)] mb-1.5">
        Realm Theme
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-[var(--pr-radius-md)] border border-[var(--pr-border)] bg-[var(--pr-surface)] hover:border-[var(--pr-text-muted)] transition-colors focus:outline-none focus:border-[var(--pr-primary)] focus:ring-1 focus:ring-[var(--pr-primary)]"
      >
        <div className="flex items-center gap-3">
          {/* Color Chips */}
          <div className="flex -space-x-1">
             <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: selectedTheme.tokens.colors.bg }} />
             <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: selectedTheme.tokens.colors.primary }} />
             <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: selectedTheme.tokens.colors.secondary }} />
          </div>
          <span className="font-medium text-[var(--pr-text)]">{selectedTheme.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--pr-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-[var(--pr-radius-md)] border border-[var(--pr-border)] bg-[var(--pr-surface-elevated)] shadow-xl max-h-60 overflow-auto">
          {availableThemes.map((theme) => (
            <button
              key={theme.key}
              type="button"
              onClick={() => {
                onThemeSelect(theme.key);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-[var(--pr-surface)] transition-colors first:rounded-t-[var(--pr-radius-md)] last:rounded-b-[var(--pr-radius-md)]"
            >
              <div className="flex items-center gap-3">
                  <div className="flex -space-x-1">
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: theme.tokens.colors.bg }} />
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: theme.tokens.colors.primary }} />
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: theme.tokens.colors.secondary }} />
                  </div>
                  <span className={`text-sm ${selectedThemeKey === theme.key ? 'text-[var(--pr-primary)] font-bold' : 'text-[var(--pr-text)]'}`}>
                      {theme.name}
                  </span>
              </div>
              {selectedThemeKey === theme.key && <Check className="w-4 h-4 text-[var(--pr-primary)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
