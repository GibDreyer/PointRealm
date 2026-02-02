import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from './Tooltip';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  helper?: string | undefined;
  error?: string | undefined;
  wrapperClassName?: string | undefined;
  tooltip?: string | undefined;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  className, 
  wrapperClassName,
  label,
  helper,
  error,
  tooltip,
  rightElement,
  ...props 
}, ref) => {
  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label && (
        <div className={styles.labelRow}>
          <label className={styles.label}>{label}</label>
          {tooltip && (
            <Tooltip content={tooltip}>
              <button
                type="button"
                className={styles.tooltipButton}
                aria-label={`${label} info`}
              >
                <Info size={14} />
              </button>
            </Tooltip>
          )}
        </div>
      )}
      {helper && <p className={styles.helper}>{helper}</p>}
      <div className={styles.inputContainer}>
        <input 
          ref={ref}
          className={cn(styles.input, error && "border-pr-danger", rightElement && styles.hasRightElement, className)} 
          {...props}
        />
        {rightElement && (
          <div className={styles.rightElement}>
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
