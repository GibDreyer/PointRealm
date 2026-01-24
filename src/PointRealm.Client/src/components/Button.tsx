import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = {
    fontFamily: 'var(--pr-body-font)',
    fontSize: 'var(--pr-font-scale-base)',
    fontWeight: 600,
    padding: '12px 24px',
    borderRadius: 'var(--pr-radius-md)',
    cursor: 'pointer',
    transition: 'all var(--pr-motion-fast-ms) var(--pr-loop-easing)',
    border: '1px solid transparent',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth ? '100%' : 'auto',
    position: 'relative' as const,
    overflow: 'hidden',
  };

  const variants: Record<ButtonVariant, { backgroundColor: string; color: string; boxShadow?: string; border?: string }> = {
    primary: {
      backgroundColor: 'var(--pr-primary)',
      color: '#000',
      boxShadow: 'var(--pr-shadow-soft)',
      border: '1px solid var(--pr-primary)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--pr-primary)',
      border: '1px solid var(--pr-primary)',
      boxShadow: 'none',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--pr-text-muted)',
      border: 'none',
      boxShadow: 'none',
    },
  };

  // We are using inline styles for simplicity here, but focus-visible is harder with inline.
  // I'll stick to a style tag or class generation if I could, but standard React inline styles don't support pseudo-classes.
  // Given the project seems to use plain CSS/modules or just global styles, I will add a localized style object but I really need a way to handle hover/focus.
  // Since I can't easily add a css file right now without extra setup, I will use a simple inline style + a unique class for focus in a style block if this was a larger app.
  // However, I can use a `style` tag in the component for scoped css if needed, or rely on the `className` to hook into global utility classes if they existed.
  // I will produce a style tag for this component to handle hover/focus properly.
  
  const uniqueClass = `pr-btn-${variant}`;
  
  return (
    <>
      <style>{`
        .${uniqueClass} {
          background-color: ${variants[variant].backgroundColor};
          color: ${variants[variant].color};
          border: ${variants[variant].border || 'none'};
          box-shadow: ${variants[variant].boxShadow || 'none'};
        }
        .${uniqueClass}:hover {
          transform: translateY(-2px);
          box-shadow: var(--pr-shadow-hover);
          ${variant === 'secondary' ? 'background-color: rgba(6, 182, 212, 0.1);' : ''}
          ${variant === 'primary' ? 'filter: brightness(110%);' : ''}
        }
        .${uniqueClass}:active {
          transform: translateY(0);
          box-shadow: var(--pr-shadow-pressed);
        }
        .${uniqueClass}:focus-visible {
          box-shadow: 0 0 0 2px var(--pr-bg), 0 0 0 4px var(--pr-primary);
        }
      `}</style>
      <button 
        className={`${uniqueClass} ${className}`}
        style={{
          ...baseStyles,
          // merge width if overridden
        }}
        {...props}
      >
        {children}
      </button>
    </>
  );
};
