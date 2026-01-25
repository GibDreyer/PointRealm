import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Toggle } from './Toggle';

interface ToggleSettingRowProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /** Icon component to display */
    icon: LucideIcon;
    /** Primary label text */
    label: string;
    /** Description/subtitle text */
    description: string;
    /** Additional className for the row container */
    rowClassName?: string | undefined;
}

/**
 * A row containing an icon, label, description, and toggle switch.
 * Used for settings forms with boolean options.
 * Supports react-hook-form register spread via InputHTMLAttributes.
 */
export const ToggleSettingRow = React.forwardRef<HTMLInputElement, ToggleSettingRowProps>(({
    icon: Icon,
    label,
    description,
    rowClassName,
    className,
    ...toggleProps
}, ref) => {
    return (
        <div className={`flex items-center justify-between gap-4 ${rowClassName || ''}`}>
            <div className="flex items-center gap-3">
                <Icon 
                    size={18} 
                    className="text-[var(--pr-text-muted)] shrink-0"
                />
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-heading font-bold text-[var(--pr-text-primary)] tracking-wide">
                        {label}
                    </span>
                    <span className="text-[10px] text-[var(--pr-text-muted)] uppercase tracking-widest font-medium">
                        {description}
                    </span>
                </div>
            </div>
            <Toggle 
                ref={ref}
                className={className}
                {...toggleProps}
            />
        </div>
    );
});

ToggleSettingRow.displayName = 'ToggleSettingRow';
