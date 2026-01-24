import { useMemo } from 'react';
import { Theme } from '../../../theme/types';
import { LucideSword, LucideSparkles } from 'lucide-react';

interface ThemePreviewProps {
  theme: Theme;
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  // Generate CSS variables for the preview scope
  const style = useMemo(() => {
    const vars: Record<string, string> = {};
    const set = (name: string, value: string) => {
      vars[`--pr-${name}`] = value;
    };

    // Colors
    Object.entries(theme.tokens.colors).forEach(([key, value]) => {
      const kebab = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
      set(kebab, value);
    });

    // Glow
    Object.entries(theme.tokens.glow).forEach(([key, value]) => {
      const kebab = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
      set(kebab, value);
    });

    // Typography
    Object.entries(theme.tokens.typography).forEach(([key, value]) => {
      const kebab = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
      set(kebab, value);
    });

    // Radii
    Object.entries(theme.tokens.radii).forEach(([key, value]) => {
        set(`radius-${key}`, value);
    });

    // Shadows
    Object.entries(theme.tokens.shadows).forEach(([key, value]) => {
        set(`shadow-${key}`, value);
    });
    
    // Textures
    if (theme.assets?.textures) {
        Object.entries(theme.assets.textures).forEach(([key, value]) => {
            if (value) {
                const kebab = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
                set(`texture-${kebab}`, `url('${value}')`);
            }
        });
    }

    return vars as React.CSSProperties;
  }, [theme]);

  return (
    <div 
      className="w-full rounded-[var(--pr-radius-lg)] border-2 border-[var(--pr-border)] overflow-hidden flex flex-col"
      style={{
        ...style,
        backgroundColor: 'var(--pr-bg)',
        color: 'var(--pr-text)',
        fontFamily: 'var(--pr-body-font)',
      }}
    >
      {/* Header Preview */}
      <div className="p-4 border-b border-[var(--pr-border)] flex items-center justify-between" style={{ background: 'var(--pr-surface)' }}>
        <div className="flex items-center gap-2">
            <LucideSparkles className="w-5 h-5 text-[var(--pr-primary)]" />
            <h3 className="font-bold text-[var(--pr-primary)] text-lg" style={{ fontFamily: 'var(--pr-heading-font)' }}>
                {theme.name}
            </h3>
        </div>
        <div className="text-xs px-2 py-1 rounded-[var(--pr-radius-sm)] bg-[var(--pr-surface-elevated)] border border-[var(--pr-border)]">
            Preview
        </div>
      </div>

      <div className="p-6 flex flex-col items-center gap-6 relative">
         {/* Background pattern if any */}
         <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'var(--pr-texture-noise-overlay)' }} />

         {/* Sample Rune Card */}
         <div 
            className="relative w-32 h-48 rounded-[var(--pr-radius-md)] flex flex-col items-center justify-center border-2 border-[var(--pr-primary)] shadow-[var(--pr-shadow-soft)] transition-transform hover:-translate-y-1"
            style={{ 
                backgroundColor: 'var(--pr-surface-elevated)',
                boxShadow: 'var(--pr-primary-glow)'
            }}
         >
            <div className="absolute inset-2 border border-[var(--pr-border)] opacity-30 rounded-[var(--pr-radius-sm)]" />
            
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-[var(--pr-surface)] border border-[var(--pr-primary)]">
                 <span className="text-2xl font-bold text-[var(--pr-primary)]">8</span>
            </div>
            <span className="text-xs uppercase tracking-widest text-[var(--pr-text-muted)]">FIB</span>
         </div>

         {/* Sample Button */}
         <button 
            className="px-6 py-2 rounded-[var(--pr-radius-md)] font-bold text-[var(--pr-bg)] shadow-[var(--pr-shadow-soft)] flex items-center gap-2"
            style={{ 
                backgroundColor: 'var(--pr-primary)',
            }}
         >
            <LucideSword className="w-4 h-4" />
            <span>Summon</span>
         </button>
         
         {/* Divider Accent */}
         {theme.assets?.textures?.dividerSvg ? (
             <div 
                className="w-full h-4 bg-contain bg-center bg-no-repeat opacity-50"
                style={{ backgroundImage: `url('${theme.assets.textures.dividerSvg}')` }}
             />
         ) : (
             <div className="w-full h-px bg-[var(--pr-border)]" />
         )}
         
         <div className="text-center text-sm text-[var(--pr-text-muted)] max-w-[200px]">
            {theme.description}
         </div>
      </div>
    </div>
  );
}
