"use client";

import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * AuthGuard — wraps protected pages.
 * Redirects unauthenticated users to /auth.
 */
export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading, init } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center galaxy-bg">
        {fallback ?? (
          <div className="glass-card p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-violet border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-lunar/60">Loading...</p>
          </div>
        )}
      </div>
    );
  }

  if (!isAuthenticated) return null; // useEffect redirects

  return <>{children}</>;
}
