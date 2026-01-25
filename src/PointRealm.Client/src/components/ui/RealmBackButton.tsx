import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealmBackButtonProps {
  to?: string;
  className?: string;
  label?: string;
  onClick?: () => void;
}

export const RealmBackButton = ({ to = "/", className, label = "Back", onClick }: RealmBackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(to);
    }
  };

  return (
    <div className={cn("fixed top-4 left-4 lg:top-8 lg:left-8 z-50", className)}>
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
        "
      >
        <ArrowLeft className="w-[22px] h-[22px]" />
      </button>
    </div>
  );
};
