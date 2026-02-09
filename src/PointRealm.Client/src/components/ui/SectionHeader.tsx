import React from 'react';
import { cn } from '../../lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string | undefined;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  className,
}) => {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex items-center justify-between gap-4 w-full">
        <h2 className="
          text-[0.75rem] font-bold font-heading 
          text-[var(--pr-secondary-gold)] 
          tracking-[0.18em] uppercase font-variant-small-caps
          opacity-90 whitespace-nowrap
          drop-shadow-[0_1px_2px_var(--pr-bg)]
        ">
          {title}
        </h2>
        {/* Line Separator */}
        <div className="h-px w-full bg-gradient-to-r from-[color-mix(in_srgb,var(--pr-secondary),transparent_60%)] to-transparent flex-1" />
      </div>
      
      {subtitle && (
        <p className="text-[0.85rem] text-pr-text-muted/75 text-left">
          {subtitle}
        </p>
      )}
    </div>
  );
};
