"use client";

import { useAuth } from "@/contexts/AuthContext";
import DashboardClientLayout from "@/components/layouts/DashboardClientLayout";
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // On the login page, we never show the dashboard layout.
  if (pathname === '/') {
    return <>{children}</>;
  }
  
  // While checking auth state, show a loading indicator.
  // This prevents a flash of un-styled content on page load.
  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If authenticated, wrap the page in the full dashboard layout.
  if (isAuthenticated) {
    return <DashboardClientLayout>{children}</DashboardClientLayout>;
  }

  // If not authenticated and not on a public page,
  // page-level logic should handle redirection.
  // For now, we render children, which will likely trigger a redirect.
  return <>{children}</>;
}