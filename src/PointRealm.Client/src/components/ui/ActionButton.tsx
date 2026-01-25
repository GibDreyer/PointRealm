import React from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Icon element to display */
    icon: React.ReactNode;
    /** Primary label text */
    label: string;
    /** Optional subtitle/description */
    sub?: string;
    /** Loading state - shows spinner */
    loading?: boolean;
    /** Visual variant */
    variant?: 'primary' | 'action' | 'danger' | 'default';
}

const variants = {
    primary: "bg-primary/20 hover:bg-primary/30 text-primary border-primary/30",
    action: "bg-secondary/20 hover:bg-secondary/30 text-secondary border-secondary/30",
    danger: "bg-danger/10 hover:bg-danger/20 text-danger border-danger/20",
    default: "bg-surfaceElevated hover:bg-surface border-border",
};

/**
 * Reusable action button with icon, label, and optional subtitle.
 * Used for prominent actions in control panels.
 */
export function ActionButton({ 
    icon, 
    label, 
    sub, 
    loading, 
    variant = 'default', 
    className, 
    disabled,
    ...props 
}: ActionButtonProps) {
    return (
        <button
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            <div className={cn("p-2 rounded-full bg-black/20", loading && "animate-spin")}>
                {loading ? <RefreshCw size={18} /> : icon}
            </div>
            <div className="flex flex-col items-start">
                <span className="text-sm font-bold leading-none">{label}</span>
                {sub && <span className="text-[10px] opacity-80 mt-1">{sub}</span>}
            </div>
        </button>
    );
}
