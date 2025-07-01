"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { DisplayModeProvider } from "@/contexts/DisplayModeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
    >
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <DisplayModeProvider>
                    {children}
                </DisplayModeProvider>
            </AuthProvider>
        </QueryClientProvider>
    </NextThemesProvider>
  );
}