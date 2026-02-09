import React from 'react';
import { cn } from '../../lib/utils';
import { useThemeMode } from '@/theme/ThemeModeProvider';

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
  const { mode } = useThemeMode();

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex items-center justify-between gap-4 w-full">
        <h2 className={cn(
          "text-[0.75rem] font-bold font-heading opacity-90 whitespace-nowrap",
          "drop-shadow-[0_1px_2px_var(--pr-bg)]",
          mode.styles.sectionTitle
        )}>
          {title}
        </h2>
        {/* Line Separator */}
        <div className={cn(
          "h-px w-full bg-gradient-to-r to-transparent flex-1",
          mode.styles.sectionDivider
        )} />
      </div>
      
      {subtitle && (
        <p className={cn("text-[0.85rem] text-left", mode.styles.sectionSubtitle)}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
