import { useState } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { Theme } from '../../theme/types';

export function CreateRealmPage() {
  const { availableThemes, setThemeKey, theme: currentTheme } = useTheme();
  const [selectedThemeKey, setSelectedThemeKey] = useState<string>(currentTheme.key);

  const handleThemeSelect = (theme: Theme) => {
    setSelectedThemeKey(theme.key);
    setThemeKey(theme.key); // Instant preview
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-2 text-[var(--pr-primary)]" style={{ fontFamily: 'var(--pr-heading-font)' }}>
        Create a Realm
      </h1>
      <p className="text-[var(--pr-text-muted)] mb-8 text-lg">
        Forge a new world. Choose its essence.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {availableThemes.map((theme) => (
          <button
            key={theme.key}
            onClick={() => handleThemeSelect(theme)}
            className={`
              relative group overflow-hidden rounded-[var(--pr-radius-lg)] border-2 text-left transition-all duration-300
              ${selectedThemeKey === theme.key ? 'border-[var(--pr-primary)] shadow-[var(--pr-primary-glow)]' : 'border-[var(--pr-border)] hover:border-[var(--pr-text-muted)]'}
            `}
            style={{
              backgroundColor: theme.tokens.colors.surface,
            }}
          >
            {/* Header / Preview Area */}
            <div 
                className="h-32 w-full relative p-4"
                style={{
                  background: `linear-gradient(135deg, ${theme.tokens.colors.bg}, ${theme.tokens.colors.surface})`
                }}
            >
                <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: theme.tokens.colors.primary + '20', // rudimentary pattern fallback
                        // If we had actual textures, we'd use them here
                    }}
                />
                
                {/* Mini RuneCard Mockup */}
                <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-20 rounded border flex items-center justify-center shadow-lg"
                    style={{
                        backgroundColor: theme.tokens.colors.surfaceElevated,
                        borderColor: theme.tokens.colors.primary,
                        boxShadow: theme.tokens.glow.primaryGlow
                    }}
                >
                    <div className="w-8 h-8 rounded-full opacity-80" style={{ backgroundColor: theme.tokens.colors.secondary }} />
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="text-lg font-bold mb-1" style={{ color: theme.tokens.colors.text }}>{theme.name}</h3>
                <p className="text-sm opacity-70 mb-4 line-clamp-2" style={{ color: theme.tokens.colors.textMuted }}>
                  {theme.description}
                </p>

                {/* Swatches */}
                <div className="flex gap-2">
                    {[theme.tokens.colors.primary, theme.tokens.colors.secondary, theme.tokens.colors.bg, theme.tokens.colors.surface].map((color, i) => (
                        <div 
                            key={i} 
                            className="w-6 h-6 rounded-full border border-white/10 shadow-sm"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>
            
            {/* Active Indicator */}
            {selectedThemeKey === theme.key && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--pr-primary)] rounded-full flex items-center justify-center text-black font-bold">
                    ✓
                </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8 p-6 rounded-[var(--pr-radius-md)] border border-[var(--pr-border)] bg-[var(--pr-surface)]">
        <h2 className="text-xl font-bold mb-4">Realm Details</h2>
        <div className="space-y-4">
             <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--pr-text-muted)]">Realm Name</label>
                <input 
                    type="text" 
                    placeholder="Enter realm name..." 
                    className="w-full p-3 rounded-[var(--pr-radius-md)] bg-[var(--pr-bg)] border border-[var(--pr-border)] focus:outline-none focus:border-[var(--pr-primary)] text-[var(--pr-text)] transition-colors"
                />
             </div>
             <button className="px-6 py-3 rounded-[var(--pr-radius-md)] bg-[var(--pr-primary)] text-[var(--pr-bg)] font-bold shadow-[var(--pr-shadow-soft)] hover:shadow-[var(--pr-shadow-hover)] transition-all">
                Create Realm
             </button>
        </div>
      </div>
    </div>
  );
}
