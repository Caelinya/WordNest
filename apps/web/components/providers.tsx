"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { DisplayModeProvider } from "@/contexts/DisplayModeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "@/types/notes";

const queryClient = new QueryClient();

export default function Providers({ children, user }: { children: React.ReactNode, user: User | null }) {
  return (
    <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
    >
        <QueryClientProvider client={queryClient}>
            <AuthProvider initialUser={user}>
                <DisplayModeProvider>
                    {children}
                </DisplayModeProvider>
            </AuthProvider>
        </QueryClientProvider>
    </NextThemesProvider>
  );
}