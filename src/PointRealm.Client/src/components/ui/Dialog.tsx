import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    showCloseData?: boolean;
}

export function Dialog({ 
    isOpen, 
    onClose, 
    title, 
    subtitle, 
    children, 
    className, 
    contentClassName,
    showCloseData = true 
}: DialogProps) {
    // Esc key to close
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--pr-bg),transparent_20%)] backdrop-blur-md animate-in fade-in duration-300">
            <div 
                className={cn(
                    "w-full max-w-lg bg-[var(--pr-surface)] border border-pr-border/40 rounded-[var(--pr-radius-xl)] shadow-[var(--pr-shadow-soft)] flex flex-col max-h-[90vh] relative overflow-hidden animate-in zoom-in-95 duration-200", 
                    className
                )}
                role="dialog"
                aria-modal="true"
            >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pr-primary to-transparent opacity-50" />

                {(title || showCloseData) && (
                    <div className={cn(
                        "flex items-center justify-between shrink-0 relative",
                        title ? "p-5 border-b border-pr-border/30" : "p-0"
                    )}>
                        {title && (
                            <SectionHeader title={title} subtitle={subtitle || ""} className="mb-0" />
                        )}
                        
                        {showCloseData && (
                            <button 
                                onClick={onClose} 
                                className={cn(
                                    "text-pr-text-muted hover:text-pr-text hover:bg-pr-surface-2 rounded-full transition-all z-50",
                                    title ? "p-2" : "absolute top-4 right-4 p-2 bg-[color-mix(in_srgb,var(--pr-bg),transparent_80%)] backdrop-blur-sm"
                                )}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                <div className={cn("flex-1 overflow-y-auto overflow-x-hidden", title ? "p-6" : "p-0", contentClassName)}>
                    {children}
                </div>
            </div>
        </div>
    );
}
