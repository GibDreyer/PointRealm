import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { ThemeModeProvider } from "../../theme/ThemeModeProvider";
import { ToastProvider } from "../../components/ui/ToastSystem";
import { RealtimeProvider } from "./RealtimeProvider";
import { AuthProvider } from "@/features/auth/AuthContext";

const queryClient = new QueryClient();

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ThemeModeProvider>
            <ToastProvider>
              <RealtimeProvider>
                {children}
              </RealtimeProvider>
            </ToastProvider>
          </ThemeModeProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
