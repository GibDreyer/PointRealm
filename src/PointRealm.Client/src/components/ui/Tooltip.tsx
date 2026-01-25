import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    className?: string;
    side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, className, side = "top" }: TooltipProps) {
    const [isVisible, setIsVisible] = React.useState(false);
    const [coords, setCoords] = React.useState({ top: 0, left: 0 });
    const triggerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (isVisible && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Simple positioning logic
            let top = rect.top;
            let left = rect.left + rect.width / 2;

            if (side === "top") top = rect.top - 8;
            if (side === "bottom") top = rect.bottom + 8;
            
            // Adjust to center horizontally for top/bottom
            // We rely on CSS transform translate for precise centering of the tooltip element itself
            
            setCoords({ top, left });
        }
    }, [isVisible, side]);

    const positionClasses = {
        top: "-translate-x-1/2 -translate-y-full",
        bottom: "-translate-x-1/2",
        left: "-translate-x-full -translate-y-1/2",
        right: "-translate-y-1/2",
    };

    return (
        <div 
            ref={triggerRef}
            className="relative inline-flex" 
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && createPortal(
                <div 
                    className={cn(
                        "fixed z-[9999] px-2 py-1 text-xs rounded bg-pr-surface-elevated border border-pr-border text-pr-text shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 pointer-events-none",
                        positionClasses[side],
                        className
                    )}
                    style={{ top: coords.top, left: coords.left }}
                >
                    {content}
                </div>,
                document.body
            )}
        </div>
    );
}
