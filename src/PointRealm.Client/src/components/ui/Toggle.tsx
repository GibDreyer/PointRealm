import React from 'react';
import styles from './Toggle.module.css';
import { cn } from '@/lib/utils';

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(({ 
  className, 
  label, 
  description,
  ...props 
}, ref) => {
  return (
    <label className={cn(styles.wrapper, className)}>
      <div className={styles.switch}>
        <input 
          type="checkbox" 
          className={styles.input} 
          ref={ref} 
          {...props} 
        />
        <span className={styles.track}>
          <span className={styles.thumb} />
        </span>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className="text-xs text-[var(--pr-text-muted)]">{description}</span>}
        </div>
      )}
    </label>
  );
});

Toggle.displayName = 'Toggle';
