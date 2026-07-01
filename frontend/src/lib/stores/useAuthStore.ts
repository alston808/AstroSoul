/**
 * Auth State Store (Zustand)
 * Manages Supabase auth session, user profile, and chart data persistence.
 */

import { create } from "zustand";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface ChartRecord {
  id: string;
  name: string | null;
  birth_date: string;
  birth_time: string;
  ascendant_sign: string | null;
  created_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  charts: ChartRecord[];

  /** Initialize auth state (call once on app mount) */
  init: () => Promise<void>;

  /** Sign up with email + password */
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>;

  /** Sign in with email + password */
  signIn: (email: string, password: string) => Promise<{ error?: string }>;

  /** Sign in with magic link */
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;

  /** Sign out */
  signOut: () => Promise<void>;

  /** Load user's saved charts */
  loadCharts: () => Promise<void>;

  /** Set user and session directly (used by callback route) */
  setSession: (user: User | null, session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  charts: [],

  init: async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        isLoading: false,
      });

      if (session?.user) {
        get().loadCharts();
      }
    } catch {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, name) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name ?? "" },
      },
    });
    if (error) return { error: error.message };
    set({
      user: data.user,
      session: data.session,
      isAuthenticated: !!data.user,
    });
    return {};
  },

  signIn: async (email, password) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    set({
      user: data.user,
      session: data.session,
      isAuthenticated: true,
    });
    get().loadCharts();
    return {};
  },

  signInWithMagicLink: async (email) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) return { error: error.message };
    return {};
  },

  signOut: async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      charts: [],
    });
  },

  loadCharts: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("birth_charts")
        .select("id, name, birth_date, birth_time, ascendant_sign, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        set({ charts: data as ChartRecord[] });
      }
    } catch {
      // Silently fail — charts load is non-critical
    }
  },

  setSession: (user, session) => {
    set({ user, session, isAuthenticated: !!user });
    if (user) get().loadCharts();
  },
}));
