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
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-black font-heading text-pr-text tracking-widest uppercase"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-[10px] text-pr-text-muted uppercase tracking-[0.2em] mt-1 font-bold italic"
        >
          {subtitle}
        </motion.p>
      )}
      
      {/* Subtle Glowing Divider */}
      <div className={cn(
          "h-px w-full max-w-[60px] bg-gradient-to-r from-pr-primary/50 to-transparent mt-3",
          align === 'center' && "mx-auto bg-gradient-to-r from-transparent via-pr-primary/50 to-transparent",
          align === 'right' && "ml-auto bg-gradient-to-l from-pr-primary/50 to-transparent"
      )} />
    </div>
  );
};
