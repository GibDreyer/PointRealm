import React from 'react';
import { cn } from '@/lib/utils';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  helper?: string | undefined;
  error?: string | undefined;
  wrapperClassName?: string | undefined;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  className, 
  wrapperClassName,
  label,
  helper,
  error,
  ...props 
}, ref) => {
  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label && <label className={styles.label}>{label}</label>}
      {helper && <p className={styles.helper}>{helper}</p>}
      <input 
        ref={ref}
        className={cn(styles.input, error && "border-pr-danger", className)} 
        {...props}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
