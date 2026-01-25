import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { ToastProvider } from "../../components/ui/ToastSystem";
import { RealtimeProvider } from "./RealtimeProvider";

const queryClient = new QueryClient();

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
