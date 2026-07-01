"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import Link from "next/link";

/**
 * AuthProvider — initializes auth state on mount and provides
 * a global user nav bar with sign in/out controls.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, signOut, init } = useAuthStore();

  useEffect(() => {
    init();
  }, []);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = (() => {
      // Dynamic import to avoid SSR issues
      return { data: { subscription: { unsubscribe: () => {} } } };
    })();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* Top Nav Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-nebula-light/20 rounded-none">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-display text-stellar hover:neon-text-gold transition-all"
          >
            ✦ AstroSoul
          </Link>

          <nav className="flex items-center gap-3 text-xs">
            {isLoading ? (
              <span className="text-lunar/30">Loading...</span>
            ) : isAuthenticated && user ? (
              <>
                <Link
                  href="/dashboard/natal-chart"
                  className="text-electric hover:text-electric/80 transition-colors"
                >
                  Chart
                </Link>
                <Link
                  href="/dashboard/karmic-path"
                  className="text-stellar hover:text-stellar/80 transition-colors"
                >
                  Karma
                </Link>
                <Link
                  href="/dashboard/mystic-depths"
                  className="text-violet hover:text-violet/80 transition-colors"
                >
                  Mystic
                </Link>
                <Link
                  href="/my-charts"
                  className="text-lunar/60 hover:text-lunar transition-colors"
                >
                  My Charts
                </Link>
                <span className="text-lunar/30">|</span>
                <span className="text-lunar/50">
                  {user.email?.split("@")[0]}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-lunar/40 hover:text-crimson transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="text-violet hover:text-violet/80 transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main content — add top padding for fixed header */}
      <div className="pt-12">{children}</div>
    </>
  );
}
