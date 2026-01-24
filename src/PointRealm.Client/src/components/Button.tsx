import React from 'react';
import { cn } from '../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
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

  const variants = {
    primary: [
      "bg-[linear-gradient(180deg,#1a2a3a,rgba(6,182,212,0.2))]", // Deep blue/cyan gradient
      "text-pr-primary border border-pr-primary/80",
      "shadow-[inset_0_0_15px_rgba(6,182,212,0.3),0_0_15px_rgba(0,0,0,0.5)]",
      "hover:bg-[linear-gradient(180deg,#2a3a4a,rgba(6,182,212,0.3))]",
      "hover:border-pr-primary hover:shadow-[inset_0_0_20px_rgba(6,182,212,0.4),0_0_20px_rgba(6,182,212,0.3)]",
    ].join(" "),
    secondary: [
      "bg-[linear-gradient(180deg,#2a2215,rgba(230,176,78,0.2))]", // Deep bronze/gold gradient
      "text-pr-secondary border border-pr-secondary/80",
      "shadow-[inset_0_0_15px_rgba(230,176,78,0.3),0_0_15px_rgba(0,0,0,0.5)]",
      "hover:bg-[linear-gradient(180deg,#3a3225,rgba(230,176,78,0.3))]",
      "hover:border-pr-secondary hover:shadow-[inset_0_0_20px_rgba(230,176,78,0.4),0_0_20px_rgba(230,176,78,0.3)]",
    ].join(" "),
    danger: "bg-pr-danger/10 text-pr-danger border-pr-danger/30 hover:bg-pr-danger/20 hover:border-pr-danger/50",
    ghost: "bg-transparent text-pr-text-muted hover:text-pr-text hover:bg-white/5 border border-transparent hover:border-white/10",
  };

  return (
    <motion.button 
      ref={ref}
      whileHover={whileHover ?? { y: -2, scale: 1.02 }}
      whileTap={whileTap ?? { y: 1, scale: 0.98 }}
      transition={transition ?? { duration: 0.2, ease: "easeInOut" }}
      className={cn(
        "relative inline-flex items-center justify-center font-cinzel font-bold tracking-[0.1em] transition-all duration-300",
        "px-10 py-3 text-lg min-h-[58px] overflow-hidden",
        "clip-path-bevel", 
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pr-primary focus-visible:ring-offset-2 focus-visible:ring-offset-pr-bg",
        fullWidth ? "w-full" : "w-auto",
        variants[variant],
        className
      )}
      style={style as any}
      {...filteredProps}
    >
      {/* Glossy top highlight */}
      <span className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(255,255,255,0.1),transparent_50%)]" />

      {/* Decorative stars/diamonds on sides for primary/secondary */}
      {(variant === 'primary' || variant === 'secondary') && (
        <>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-current shadow-[0_0_8px_currentColor]" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-current shadow-[0_0_8px_currentColor]" />
        </>
      )}
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
});

Button.displayName = "Button";
