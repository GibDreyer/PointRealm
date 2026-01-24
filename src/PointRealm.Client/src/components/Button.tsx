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
  const { style, whileHover, whileTap, transition, ...filteredProps } = props;

  const variants = {
    primary: "bg-pr-primary text-black border-pr-primary/50 shadow-glow-primary hover:brightness-110",
    secondary: "bg-pr-secondary text-black border-pr-secondary/50 shadow-glow-secondary hover:brightness-110",
    danger: "bg-pr-danger/10 text-pr-danger border-pr-danger/30 hover:bg-pr-danger/20 hover:border-pr-danger/50",
    ghost: "bg-transparent text-pr-text-muted hover:text-pr-text hover:bg-white/5",
  };

  return (
    <motion.button 
      ref={ref}
      whileHover={whileHover ?? { y: -1 }}
      whileTap={whileTap ?? { y: 1 }}
      transition={transition ?? { duration: 0.2, ease: "easeInOut" }}
      className={cn(
        "inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-200",
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
