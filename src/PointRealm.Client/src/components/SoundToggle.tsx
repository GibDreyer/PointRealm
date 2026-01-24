import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';

interface SoundToggleProps {
  className?: string;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ className }) => {
  const { isEnabled, toggle } = useSound();

  return (
    <button
      onClick={toggle}
      className={cn(
        "p-2 rounded-full transition-colors duration-200",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      aria-label={isEnabled ? "Mute sounds" : "Enable sounds"}
      title={isEnabled ? "Mute sounds" : "Enable sounds"}
    >
      {isEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </button>
  );
};
