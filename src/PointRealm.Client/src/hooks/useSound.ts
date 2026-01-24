import { useState, useEffect, useCallback } from 'react';

const SFX = {
  select: '/sfx/select.mp3',
  hover: '/sfx/hover.mp3',
  reveal: '/sfx/reveal.mp3',
  join: '/sfx/join.mp3',
  seal: '/sfx/seal.mp3',
} as const;

export type SoundName = keyof typeof SFX;

const STORAGE_KEY = 'pointrealm:sound:enabled';

export function useSound() {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? false : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isEnabled));
  }, [isEnabled]);

  const toggle = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  const play = useCallback((name: SoundName) => {
    if (!isEnabled) return;

    try {
      const audio = new Audio(SFX[name]);
      audio.volume = 0.4;
      audio.play().catch(err => {
        // Auto-play policy might block this if no interaction yet
        console.warn('Audio play blocked', err);
      });
    } catch (e) {
      console.error('Failed to play sound', e);
    }
  }, [isEnabled]);

  return { isEnabled, toggle, play };
}
