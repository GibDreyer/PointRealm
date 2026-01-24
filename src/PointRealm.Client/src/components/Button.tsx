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
  
  const variants = {
    primary: "bg-pr-primary text-black border-pr-primary shadow-[0_0_10px_var(--pr-primary)] hover:brightness-110",
    secondary: "bg-transparent text-pr-primary border-pr-primary hover:bg-pr-primary/10",
    danger: "bg-pr-danger/20 text-pr-danger border-pr-danger hover:bg-pr-danger/30 hover:shadow-[0_0_10px_var(--pr-danger)]",
    ghost: "bg-transparent text-pr-text-muted hover:text-pr-text",
  };

  return (
    <motion.button 
      ref={ref}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98, y: 0 }}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors duration-200",
        "px-6 py-3 rounded-[var(--pr-radius-md)] border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pr-primary",
        fullWidth ? "w-full" : "w-auto",
        variants[variant],
        className
      )}
      style={{
        fontFamily: 'var(--pr-body-font)',
        fontSize: 'var(--pr-font-scale-base)',
        ...props.style as any
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = "Button";
