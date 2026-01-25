import { z } from 'zod';

export const themeSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  tokens: z.object({
    colors: z.object({
      bg: z.string(),
      surface: z.string(),
      surfaceElevated: z.string(),
      text: z.string(),
      textMuted: z.string(),
      border: z.string(),
      primary: z.string(),
      secondary: z.string(),
      success: z.string(),
      danger: z.string(),
      warning: z.string(),
      info: z.string(),
    }),
    glow: z.object({
      primaryGlow: z.string(),
      secondaryGlow: z.string(),
    }),
    typography: z.object({
      headingFont: z.string(),
      bodyFont: z.string(),
      monoFont: z.string(),
      fontScaleBase: z.string(),
      fontScaleRatio: z.string(),
    }),
    radii: z.object({
      sm: z.string(),
      md: z.string(),
      lg: z.string(),
      xl: z.string(),
    }),
    shadows: z.object({
      soft: z.string(),
      hover: z.string(),
      pressed: z.string(),
    }),
    motion: z.object({
      fastMs: z.string(),
      baseMs: z.string(),
      slowMs: z.string(),
      enterEasing: z.string(),
      loopEasing: z.string(),
    }),
  }),
  assets: z.object({
    textures: z.object({
      noiseOverlay: z.string().optional(),
      surfaceTexture: z.string().optional(),
      dividerSvg: z.string().optional(),
      cardBackPattern: z.string().optional(),
    }).optional(),
  }).optional(),
  effects: z.object({
    particlesEnabled: z.boolean().optional(),
    vignettePulseEnabled: z.boolean().optional(),
    vibe: z.enum(['space', 'forest', 'water', 'fire', 'arcane']).optional(),
    particleColor: z.string().optional(),
  }).optional(),
});

export type Theme = z.infer<typeof themeSchema>;
