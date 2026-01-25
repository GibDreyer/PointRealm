import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /**
   * Where to navigate to when clicked. Defaults to "/"
   */
  to?: string;
  /**
   * Optional custom click handler. If provided, navigation via 'to' is skipped.
   */
  onClick?: () => void;
  /**
   * Accessibility label. Defaults to "Back"
   */
  label?: string;
  /**
   * Additional classes for the container
   */
  className?: string;
  /**
   * Whether to use fixed (default) or absolute positioning
   */
  position?: 'fixed' | 'absolute';
}

/**
 * A consistent, themed back button used across all pages.
 * Based on the design from the Create Realm page.
 */
export const BackButton: React.FC<BackButtonProps> = ({
  to = "/",
  onClick,
  label = "Back",
  className,
  position = 'fixed'
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(to);
    }
  };

  return (
    <div 
      className={cn(
        position === 'fixed' ? "fixed z-[100]" : "absolute z-50",
        className
      )}
      style={{ top: '2rem', left: '2rem' }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        className="
          flex items-center justify-center
          w-[44px] h-[44px] rounded-full
          text-[var(--pr-text-muted)] bg-black/40
          border border-[var(--pr-surface-border)]
          transition-all duration-300 ease-[var(--pr-ease-out)]
          hover:text-white hover:border-[var(--pr-primary-cyan)]
          hover:bg-[rgba(74,158,255,0.15)]
          hover:scale-110 hover:shadow-[0_0_15px_rgba(74,158,255,0.2)]
          backdrop-blur-sm group
        "
      >
        <ArrowLeft className="w-[22px] h-[22px] transition-transform group-hover:-translate-x-0.5" />
      </button>
    </div>
  );
};
