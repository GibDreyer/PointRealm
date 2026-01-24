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

export const Button = React.forwardRef<HTMLButtonElement, MotionButtonProps>(({
  children,
  variant = 'primary',
  fullWidth = false,
  className,
  ...props
}, ref) => {
  const { style, whileHover, whileTap, transition, ...filteredProps } = props;

  const themes = {
    primary: {
      base: "rgba(2, 6, 23, 0.5)", // Even more translucent
      accent: "#38bdf8", // Sky blue/Cyan
      hoverFill: "rgba(14, 165, 233, 0.6)", 
      text: "#38bdf8",
      hoverText: "#ffffff",
      glow: "0 0 25px rgba(56, 189, 248, 0.4)",
    },
    secondary: {
      base: "rgba(12, 10, 9, 0.5)", 
      accent: "#f59e0b", // Amber/Gold
      hoverFill: "rgba(217, 119, 6, 0.6)",
      text: "#f59e0b",
      hoverText: "#0c0a09",
      glow: "0 0 25px rgba(245, 158, 11, 0.4)",
    },
    danger: {
      base: "rgba(24, 8, 8, 0.5)",
      accent: "#ef4444",
      hoverFill: "rgba(220, 38, 38, 0.6)",
      text: "#ef4444",
      hoverText: "#ffffff",
      glow: "0 0 20px rgba(239, 68, 68, 0.4)",
    },
    ghost: {
      base: "transparent",
      accent: "rgba(255,255,255,0.2)",
      hoverFill: "rgba(255,255,255,0.1)",
      text: "var(--pr-text-muted)",
      hoverText: "#ffffff",
      glow: "",
    }
  };

  const currentTheme = themes[variant];

  return (
    <motion.button 
      ref={ref}
      whileHover="hover"
      whileTap="tap"
      initial="initial"
      className={cn(
        "group relative inline-flex items-center justify-center font-heading font-black tracking-[0.05em] transition-all duration-200",
        "px-12 py-5 min-h-[64px] text-xl select-none overflow-hidden",
        "bg-transparent border-none shadow-lg", 
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-primary",
        fullWidth ? "w-full" : "w-auto",
        className
      )}
      style={{
        ...style as any,
        backgroundColor: currentTheme.base,
        color: currentTheme.text,
      }}
      {...filteredProps}
    >
      {/* 1. Subtle Inner Frame Outline */}
      <span className="absolute inset-0 z-0 border border-white/10 pointer-events-none" />
      
      {/* 2. Heavy Texture Overlay */}
      <span className="absolute inset-0 z-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]" />

      {/* 3. Aggressive Slashing Fill */}
      <motion.span 
        className="absolute z-0 pointer-events-none block origin-center"
        variants={{
          initial: { 
            top: "50%", 
            left: "50%", 
            width: "2px", 
            height: "800%", 
            backgroundColor: currentTheme.accent,
            rotate: -70,
            x: "-50%",
            y: "-50%",
            opacity: 0.1
          },
          hover: { 
            width: "120%", 
            rotate: -90, 
            opacity: 1,
            backgroundColor: currentTheme.hoverFill,
            transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } 
          },
          tap: {
            scale: 1.05,
            filter: "brightness(1.2)"
          }
        }}
      />

      {/* 4. Text Content */}
      <motion.span 
        className="relative z-10 flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
        variants={{
          initial: { color: currentTheme.text, scale: 1 },
          hover: { color: currentTheme.hoverText, scale: 1.05 }
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>

      {/* 5. Hover Glow Explosion */}
      <span className={cn(
        "absolute inset-0 z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-300",
      )} 
      style={{ boxShadow: currentTheme.glow }}
      />
      
      {/* 6. Corner Decorative Dots */}
      <span className="absolute top-1.5 left-1.5 w-1 h-1 bg-current opacity-40" />
      <span className="absolute top-1.5 right-1.5 w-1 h-1 bg-current opacity-40" />
      <span className="absolute bottom-1.5 left-1.5 w-1 h-1 bg-current opacity-40" />
      <span className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-current opacity-40" />
    </motion.button>
  );
});

Button.displayName = "Button";
