import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  className,
  align = 'left' 
}) => {
  return (
    <div className={cn("mb-6", {
      'text-center': align === 'center',
      'text-right': align === 'right',
      'text-left': align === 'left',
    }, className)}>
      <motion.h2 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-2xl font-bold font-heading text-pr-text tracking-tight"
        style={{ fontFamily: 'var(--pr-heading-font)' }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-pr-text-muted uppercase tracking-widest mt-1 font-semibold"
        >
          {subtitle}
        </motion.p>
      )}
      
      {/* Decorative divider if center aligned */}
      {align === 'center' && (
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-pr-primary to-transparent mx-auto mt-4 opacity-50" />
      )}
    </div>
  );
};
