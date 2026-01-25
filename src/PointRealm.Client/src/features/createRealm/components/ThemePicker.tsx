import { useTheme } from '../../../theme/ThemeProvider';
import { ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import styles from './ThemePicker.module.css';

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
    <div className={styles.container} ref={containerRef}>
      <label className={styles.label}>
        Realm Atmosphere
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
      >
        <div className={styles.themeInfo}>
          <div className={styles.colorChips}>
             <div className={styles.chip} style={{ backgroundColor: selectedTheme.tokens.colors.bg }} />
             <div className={styles.chip} style={{ backgroundColor: selectedTheme.tokens.colors.primary }} />
             <div className={styles.chip} style={{ backgroundColor: selectedTheme.tokens.colors.secondary }} />
          </div>
          <span className={styles.themeName}>{selectedTheme.name}</span>
        </div>
        <ChevronDown className={cn(styles.chevron, isOpen && styles.chevronActive)} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {availableThemes.map((theme) => (
            <button
              key={theme.key}
              type="button"
              onClick={() => {
                onThemeSelect(theme.key);
                setIsOpen(false);
              }}
              className={cn(styles.option, selectedThemeKey === theme.key && styles.optionActive)}
            >
              <div className={styles.optionContent}>
                  <div className={styles.colorChips}>
                    <div className={styles.chip} style={{ backgroundColor: theme.tokens.colors.bg }} />
                    <div className={styles.chip} style={{ backgroundColor: theme.tokens.colors.primary }} />
                    <div className={styles.chip} style={{ backgroundColor: theme.tokens.colors.secondary }} />
                  </div>
                  <span className={styles.optionName}>
                      {theme.name}
                  </span>
              </div>
              {selectedThemeKey === theme.key && <Check className={styles.check} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
