import React from 'react';
import { Info, LucideIcon } from 'lucide-react';
import { Toggle } from './Toggle';
import { Tooltip } from './Tooltip';

interface ToggleSettingRowProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /** Icon component to display */
    icon: LucideIcon;
    /** Primary label text */
    label: string;
    /** Description/subtitle text */
    description: string;
    /** Optional tooltip for the label */
    tooltip?: string | undefined;
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
    tooltip,
    rowClassName,
    className,
    ...toggleProps
}, ref) => {
    return (
        <div className={`flex items-center justify-between gap-4 ${rowClassName || ''}`}>
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 shrink-0">
                    <Icon 
                        size={20} 
                        className="text-[var(--pr-text-muted)]"
                    />
                </div>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-heading font-bold text-[var(--pr-text-primary)] tracking-wide">
                            {label}
                        </span>
                        {tooltip && (
                            <Tooltip content={tooltip}>
                                <button
                                    type="button"
                                    aria-label={`${label} info`}
                                    className="inline-flex items-center justify-center text-[var(--pr-text-muted)] transition-colors hover:text-[var(--pr-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-full"
                                >
                                    <Info size={14} />
                                </button>
                            </Tooltip>
                        )}
                    </div>
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
