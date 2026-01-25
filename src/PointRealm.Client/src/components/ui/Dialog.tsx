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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div 
                className={cn(
                    "w-full max-w-lg bg-[#0f1218] border border-pr-border/40 rounded-[var(--pr-radius-xl)] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] relative overflow-hidden animate-in zoom-in-95 duration-200", 
                    className
                )}
                role="dialog"
                aria-modal="true"
            >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pr-primary to-transparent opacity-50" />

                {(title || showCloseData) && (
                    <div className="p-5 border-b border-pr-border/30 flex items-center justify-between shrink-0">
                        {title ? (
                            <SectionHeader title={title} subtitle={subtitle || ""} className="mb-0" />
                        ) : <div />}
                        
                        {showCloseData && (
                            <button 
                                onClick={onClose} 
                                className="p-2 text-pr-text-muted hover:text-pr-text hover:bg-pr-surface-2 rounded-full transition-all"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                <div className={cn("flex-1 overflow-y-auto overflow-x-hidden p-6", contentClassName)}>
                    {children}
                </div>
            </div>
        </div>
    );
}
