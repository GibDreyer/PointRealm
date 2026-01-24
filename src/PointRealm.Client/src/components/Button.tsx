import React from 'react';
import { cn } from '../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

// Combine HTMLButtonElement props with HTMLMotionProps used by framer-motion
// We omit the conflicting types to avoid TS errors
type MotionButtonProps = Omit<HTMLMotionProps<"button">, "className" | "style"> & ButtonProps;

export const Button = React.forwardRef<HTMLButtonElement, MotionButtonProps>(({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className,
  ...props 
}, ref) => {
  const { style, ...filteredProps } = props;

  const variants = {
    primary: "bg-pr-primary text-black border-pr-primary/50 shadow-[0_0_15px_-5px_rgba(6,182,212,0.5)] hover:shadow-[0_0_20px_-2px_rgba(6,182,212,0.6)] hover:brightness-110",
    secondary: "bg-pr-secondary text-black border-pr-secondary/50 shadow-[0_0_15px_-5px_rgba(251,191,36,0.4)] hover:shadow-[0_0_20px_-2px_rgba(251,191,36,0.5)] hover:brightness-110",
    danger: "bg-pr-danger/10 text-pr-danger border-pr-danger/30 hover:bg-pr-danger/20 hover:border-pr-danger/50 hover:shadow-[0_0_15px_-5px_rgba(244,63,94,0.4)]",
    ghost: "bg-transparent text-pr-text-muted hover:text-pr-text hover:bg-white/5",
  };

  return (
    <motion.button 
      ref={ref}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.98, y: 0 }}
      className={cn(
        "inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-300",
        "px-6 py-3 rounded-[var(--pr-radius-md)] border text-xs",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pr-primary focus-visible:ring-offset-2 focus-visible:ring-offset-pr-bg",
        fullWidth ? "w-full" : "w-auto",
        variants[variant],
        className
      )}
      style={style as any}
      {...filteredProps}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = "Button";
