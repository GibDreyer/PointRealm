import React from 'react';
import { cn } from '@/lib/utils';
import styles from './ScrollPanel.module.css';

interface ScrollPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  maxHeight?: string | number;
}

export const ScrollPanel = React.forwardRef<HTMLDivElement, ScrollPanelProps>(({ 
  className, 
  maxHeight,
  children, 
  style,
  ...props 
}, ref) => {
  return (
    <div 
      ref={ref}
      className={cn(styles.scrollPanel, className)}
      style={{ maxHeight, ...style }}
      {...props}
    >
      {children}
    </div>
  );
});

ScrollPanel.displayName = 'ScrollPanel';
