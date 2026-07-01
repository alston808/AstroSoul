"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { getSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard/natal-chart";

  const { signUp, signIn, signInWithMagicLink, isAuthenticated, isLoading } =
    useAuthStore();

  const [mode, setMode] = useState<"login" | "signup" | "magic">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [step, setStep] = useState<"auth" | "birthdata">("auth");

  // Birth data fields (collected during signup for seamless onboarding)
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [birthLat, setBirthLat] = useState("");
  const [birthLng, setBirthLng] = useState("");
  const [birthTz, setBirthTz] = useState("0");
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading && step === "auth") {
      router.push(redirectPath);
    }
  }, [isAuthenticated, isLoading, router, redirectPath, step]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    let result: { error?: string } = {};

    if (mode === "signup") {
      result = await signUp(email, password, name || undefined);
      if (!result.error) {
        setStep("birthdata");
        setSubmitting(false);
        return;
      }
    } else if (mode === "login") {
      result = await signIn(email, password);
    } else if (mode === "magic") {
      result = await signInWithMagicLink(email);
      if (!result.error) {
        setMagicSent(true);
        setSubmitting(false);
        return;
      }
    }

    if (result.error) {
      setError(result.error);
    }
    setSubmitting(false);
  };

  const handleBirthDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCalculating(true);

    try {
      const supabase = getSupabaseClient();
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        await supabase.from("profiles").upsert({
          id: currentUser.id,
          full_name: name || undefined,
          birth_date: birthDate || undefined,
          birth_time: birthTime || undefined,
          birth_lat: parseFloat(birthLat) || undefined,
          birth_lng: parseFloat(birthLng) || undefined,
          birth_tz: birthTz || "0",
        });
      }

      if (birthDate && birthLat && birthLng) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/calculate-chart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: birthDate,
            time: birthTime,
            latitude: parseFloat(birthLat),
            longitude: parseFloat(birthLng),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          sessionStorage.setItem("astroData", JSON.stringify(data));
        }
      }

      router.push(redirectPath);
    } catch {
      setError("Failed to calculate chart. You can also do this later.");
      setCalculating(false);
    }
  };

  const handleSkipBirthData = () => {
    router.push(redirectPath);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center galaxy-bg">
        <div className="glass-card p-12 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-violet border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lunar/60">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 galaxy-bg">
      <Link href="/" className="mb-8">
        <h1 className="text-3xl font-display neon-text-gold">✦ AstroSoul</h1>
      </Link>

      {step === "auth" ? (
        <div className="glass-card p-8 w-full max-w-md space-y-6">
        {/* Mode Tabs */}
        <div className="flex rounded-lg bg-void border border-nebula-light overflow-hidden">
          {(["login", "signup", "magic"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
                setMagicSent(false);
              }}
              className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 ${
                mode === m
                  ? "bg-violet/20 text-violet"
                  : "text-lunar/50 hover:text-lunar/80"
              }`}
            >
              {m === "login" ? "Login" : m === "signup" ? "Sign Up" : "Magic Link"}
            </button>
          ))}
        </div>

        {magicSent ? (
          <div className="text-center space-y-4 py-4">
            <div className="text-4xl">📧</div>
            <h2 className="text-xl font-display text-stellar">Check your email!</h2>
            <p className="text-lunar/70 text-sm">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in instantly.
            </p>
            <button
              onClick={() => {
                setMagicSent(false);
                setMode("login");
              }}
              className="text-electric text-sm underline"
            >
              ← Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field
                label="Full Name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Your name"
              />
            )}

            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />

            {mode !== "magic" && (
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            )}

            {error && (
              <p className="text-crimson text-sm text-center bg-crimson/10 rounded-lg py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !email || (mode !== "magic" && !password)}
              className="w-full py-3 rounded-lg bg-violet/20 border border-violet/40 text-violet
                         hover:bg-violet/30 hover:shadow-neon-purple transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> {mode === "signup" ? "Creating account..." : "Signing in..."}
                </span>
              ) : (
                <>
                  {mode === "login" && "✦ Sign In"}
                  {mode === "signup" && "✦ Create Account"}
                  {mode === "magic" && "✦ Send Magic Link"}
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-lunar/40">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
        </div>
      ) : (
        /* Step 2: Birth Data Collection after Signup */
        <div className="glass-card p-8 w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-display text-stellar mb-1">
              ✦ Welcome{name ? `, ${name}` : ""}!
            </h2>
            <p className="text-lunar/60 text-sm">
              Enter your birth details to reveal your natal chart.
            </p>
          </div>

          <form onSubmit={handleBirthDataSubmit} className="space-y-4">
            <Field label="Birth Date" type="date" value={birthDate} onChange={setBirthDate} />
            <Field label="Birth Time" type="time" value={birthTime} onChange={setBirthTime} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude" type="text" value={birthLat} onChange={setBirthLat} placeholder="e.g. 40.7128" />
              <Field label="Longitude" type="text" value={birthLng} onChange={setBirthLng} placeholder="e.g. -74.0060" />
            </div>
            <Field label="Timezone (UTC offset)" type="text" value={birthTz} onChange={setBirthTz} placeholder="-5" />

            {error && (
              <p className="text-crimson text-sm text-center bg-crimson/10 rounded-lg py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={calculating || !birthDate}
              className="w-full py-3 rounded-lg bg-violet/20 border border-violet/40 text-violet
                         hover:bg-violet/30 hover:shadow-neon-purple transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {calculating ? (
                <span className="inline-flex items-center gap-2"><Spinner /> Calculating...</span>
              ) : (
                "✦ Reveal My Chart ✦"
              )}
            </button>

            <button
              type="button"
              onClick={handleSkipBirthData}
              className="w-full text-xs text-lunar/40 hover:text-lunar/60 underline transition-colors"
            >
              Skip for now — I&apos;ll enter it later
            </button>
          </form>
        </div>
      )}

      {/* Navigation Tabs — links to different modes */}
      <nav className="mt-8 flex gap-4 flex-wrap justify-center">
        <Link
          href="/dashboard/natal-chart"
          className="glass-card px-6 py-3 text-sm text-electric hover:shadow-neon-cyan transition-all duration-300"
        >
          ✦ Natal Chart
        </Link>
        <Link
          href="/dashboard/karmic-path"
          className="glass-card px-6 py-3 text-sm text-stellar hover:shadow-neon-gold transition-all duration-300"
        >
          ✦ Karmic Contract
        </Link>
        <Link
          href="/dashboard/mystic-depths"
          className="glass-card px-6 py-3 text-sm text-violet hover:shadow-neon-purple transition-all duration-300"
        >
          ✦ Mystic Depths
        </Link>
      </nav>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs uppercase tracking-widest text-lunar/60">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="bg-void border border-nebula-light rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:border-violet focus:shadow-neon-purple
                   transition-all duration-200 text-white placeholder:text-white/20"
      />
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
