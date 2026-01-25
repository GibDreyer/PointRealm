import React from 'react';
import { cn } from '../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  "aria-label"?: string;
}

type MotionButtonProps = Omit<HTMLMotionProps<"button">, "className" | "style"> & ButtonProps;

/**
 * ButtonSVG renders the provided RPG background SVG using CSS variables
 * to allow dynamic color thematic updates while maintaining the high-fidelity
 * ornaments, sheen, and textures.
 */
const ButtonSVG = ({ variant }: { variant: ButtonVariant }) => {
  if (variant === 'ghost') return null;

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible" 
      viewBox="0 0 660 124" 
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`frameStroke-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--btn-accent-light)"></stop>
          <stop offset="0.35" stopColor="var(--btn-accent-main)"></stop>
          <stop offset="0.7" stopColor="var(--btn-accent-dim)"></stop>
          <stop offset="1" stopColor="var(--btn-accent-dark)"></stop>
        </linearGradient>

        <radialGradient id={`fillGrad-${variant}`} cx="50%" cy="45%" r="80%">
          <stop offset="0" stopColor="var(--btn-accent-main)"></stop>
          <stop offset="0.45" stopColor="var(--btn-accent-dim)"></stop>
          <stop offset="1" stopColor="var(--btn-accent-dark)"></stop>
        </radialGradient>

        <linearGradient id={`topSheen-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.4"></stop>
          <stop offset="1" stopColor="white" stopOpacity="0"></stop>
        </linearGradient>

        <filter id={`texture-${variant}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" result="n"></feTurbulence>
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0.2 0" result="tint"></feColorMatrix>
          <feComposite in="tint" in2="SourceGraphic" operator="in" result="maskedTint" />
          <feBlend in="SourceGraphic" in2="maskedTint" mode="multiply"></feBlend>
        </filter>

        <filter id={`glow-${variant}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="b"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>

        <linearGradient id={`diamondGrad-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="white"></stop>
          <stop offset="0.5" stopColor="var(--btn-accent-light)"></stop>
          <stop offset="1" stopColor="var(--btn-accent-main)"></stop>
        </linearGradient>
      </defs>

      {/* Outer Shadow Edge */}
      <path d="M12 100 H648" stroke="black" strokeOpacity="0.3" strokeWidth="2"></path>

      {/* Main Frame Shell */}
      <rect x="8" y="18" width="644" height="88" rx="6" fill="black" opacity="0.4"></rect>
      
      {/* Dynamic Colored Body */}
      <rect x="10" y="20" width="640" height="84" rx="6" fill={`url(#fillGrad-${variant})`} filter={`url(#texture-${variant})`}></rect>
      
      {/* Structural Stroke */}
      <rect x="10" y="20" width="640" height="84" rx="6" fill="none" stroke={`url(#frameStroke-${variant})`} strokeWidth="3"></rect>

      {/* Bevel Highlights */}
      <rect x="14" y="24" width="632" height="76" rx="5" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1.5"></rect>
      <rect x="16" y="26" width="628" height="72" rx="4" fill="none" stroke="black" strokeOpacity="0.2" strokeWidth="1.2"></rect>

      {/* Top Gloss Sheen */}
      <path d="M14 26 H646 A4 4 0 0 1 650 30 V46 H10 V30 A4 4 0 0 1 14 26 Z" fill={`url(#topSheen-${variant})`} opacity="0.5"></path>

      {/* Side Diamonds & Rays Removed */ }


      {/* Corner Carvings */}
      <g opacity="0.4" fill="white">
        <path d="M18 28 l10 0 l-6 6 l-6 0 z" />
        <path d="M18 96 l10 0 l-6 -6 l-6 0 z" />
        <path d="M642 28 l-10 0 l6 6 l6 0 z" />
        <path d="M642 96 l-10 0 l6 -6 l6 0 z" />
      </g>
    </svg>
  );
};

export const Button = React.forwardRef<HTMLButtonElement, MotionButtonProps>(({
  children,
  variant = 'primary',
  fullWidth = false,
  className,
  ...props
}, ref) => {
  const { style, ...filteredProps } = props;

  // Determine base colors from CSS variables depending on the variant
  const baseColorVar = variant === 'secondary' ? 'var(--pr-secondary)' : 
                       variant === 'danger' ? 'var(--pr-danger)' : 
                       'var(--pr-primary)';
  
  // We use CSS color-mix to derive the multi-tone scales from the single base theme color
  const cssVariables = variant === 'ghost' ? {} : {
    '--btn-accent-light': `color-mix(in srgb, ${baseColorVar}, white 40%)`,
    '--btn-accent-main': baseColorVar,
    '--btn-accent-dim': `color-mix(in srgb, ${baseColorVar}, black 40%)`,
    '--btn-accent-dark': `color-mix(in srgb, ${baseColorVar}, black 85%)`,
  } as React.CSSProperties;

  const textColor = variant === 'ghost' ? 'var(--pr-text-muted)' : '#ffffff';
  const glowShadow = variant === 'ghost' ? '' : `0 0 40px color-mix(in srgb, ${baseColorVar}, transparent 55%)`;

  return (
    <motion.button 
      ref={ref}
      whileHover="hover"
      whileTap="tap"
      initial="initial"
      className={cn(
        "group relative inline-flex items-center justify-center font-heading font-black tracking-[0.12em] transition-all duration-300",
        "px-16 py-6 min-h-[72px] text-xl select-none overflow-visible",
        "bg-transparent border-none active:scale-95", 
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-primary",
        fullWidth ? "w-full" : "w-auto",
        className
      )}
      style={{
        ...style as any,
        ...cssVariables,
        color: textColor,
      }}
      {...filteredProps}
    >
      {/* 1. High-Fidelity RPG SVG Background */}
      <ButtonSVG variant={variant} />

      {/* 2. Interactive Outer Glow Layer */}
      <motion.span 
        className="absolute inset-4 z-[-1] rounded-lg opacity-0 transition-all duration-300"
        variants={{
          hover: { opacity: 1, scale: 1.1, filter: "blur(20px)" }
        }}
        style={{ 
          backgroundColor: variant === 'ghost' ? 'transparent' : `color-mix(in srgb, ${baseColorVar}, transparent 50%)`, 
          boxShadow: glowShadow,
          filter: "blur(24px)"
        }}
      />
      
      {/* 3. Button Content (Label) */}
      <motion.span 
        className="relative z-10 flex items-center gap-2 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]"
        variants={{
          initial: { scale: 1, y: 0 },
          hover: { scale: 1.05, y: -1 }
        }}
      >
        {children}
      </motion.span>

      {/* 4. Magical Sheen Sweep (on Hover) */}
      {variant !== 'ghost' && (
        <motion.span 
          className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-lg opacity-0 group-hover:opacity-100"
          transition={{ duration: 0.3 }}
        >
          <motion.span 
            className="absolute inset-0 w-[150%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[35deg]"
            animate={{ 
              x: ["-100%", "200%"] 
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2, 
              ease: "easeInOut",
              repeatDelay: 0.5
            }}
          />
        </motion.span>
      )}
    </motion.button>
  );
});

Button.displayName = "Button";
