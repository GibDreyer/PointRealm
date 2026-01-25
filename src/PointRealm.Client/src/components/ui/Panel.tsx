import React from 'react';
import { cn } from '@/lib/utils';
import styles from './Panel.module.css';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow' | 'realm';
  noPadding?: boolean;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(({ 
  className, 
  variant = 'default',
  noPadding = false,
  children, 
  ...props 
}, ref) => {
  return (
    <div 
      ref={ref}
      className={cn(
        styles.panel, 
        variant === 'glow' && styles.panelGlow,
        variant === 'realm' && styles.panelRealm,
        noPadding && styles.noPadding,
        className
      )}       {...props}
    >
      {children}
    </div>
  );
});

Panel.displayName = 'Panel';
