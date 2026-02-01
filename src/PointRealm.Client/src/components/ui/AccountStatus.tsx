import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { User, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

interface AccountStatusProps {
  className?: string;
}

export const AccountStatus: React.FC<AccountStatusProps> = ({ className }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button 
          variant="ghost" 
          onClick={() => navigate("/auth/login")}
          className="text-pr-text-muted hover:text-pr-primary px-4 py-2 min-h-[auto] text-sm"
        >
          Sign In
        </Button>
      </div>
    );
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || "Traveler";

  return (
    <div className={cn("relative z-50", className)} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          "bg-black/20 border border-white/10 hover:bg-black/40 hover:border-pr-primary/50",
          "transition-all duration-200 group",
          isOpen && "border-pr-primary bg-black/40"
        )}
      >
        <div className="w-6 h-6 rounded-full bg-pr-primary/20 flex items-center justify-center text-pr-primary">
          <User size={14} />
        </div>
        <span className="text-sm font-medium text-pr-text/90 group-hover:text-white">
          Hi, {displayName}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 py-1 rounded-lg border border-pr-surface-border bg-pr-surface shadow-xl backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 py-2 border-b border-white/5">
              <p className="text-xs text-pr-text-muted uppercase tracking-wider font-bold">Account</p>
              <p className="text-sm text-pr-text truncate">{user?.email}</p>
            </div>
            
            <div className="p-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/account");
                }}
                className="flex items-center w-full gap-2 px-3 py-2 text-sm text-pr-text hover:bg-white/5 rounded-md transition-colors"
              >
                <Shield size={16} className="text-pr-primary" />
                View Account
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex items-center w-full gap-2 px-3 py-2 text-sm text-pr-danger hover:bg-pr-danger/10 rounded-md transition-colors"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
