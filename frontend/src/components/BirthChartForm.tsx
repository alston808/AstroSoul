"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useChartStore } from "@/lib/stores/useChartStore";
import { getSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

interface BirthData {
  name: string;
  date: string;
  time: string;
  latitude: string;
  longitude: string;
  timezone: string;
}

export default function BirthChartForm() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const [form, setForm] = useState<BirthData>({
    name: "",
    date: "",
    time: "12:00",
    latitude: "",
    longitude: "",
    timezone: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill with stored birth data if authenticated
  useEffect(() => {
    async function loadProfile() {
      if (isAuthenticated && user) {
        try {
          const supabase = getSupabaseClient();
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, birth_date, birth_time, birth_lat, birth_lng, birth_tz")
            .eq("id", user.id)
            .single();

          if (profile?.birth_date) {
            setForm((prev) => ({
              ...prev,
              name: profile.full_name ?? prev.name,
              date: profile.birth_date ?? prev.date,
              time: profile.birth_time
                ? profile.birth_time.slice(0, 5)
                : prev.time,
              latitude: profile.birth_lat?.toString() ?? prev.latitude,
              longitude: profile.birth_lng?.toString() ?? prev.longitude,
              timezone: profile.birth_tz ?? prev.timezone,
            }));
          }
        } catch {
          // Ignore — profile may not have birth data yet
        }
      }
    }
    loadProfile();
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:3001/api/calculate-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          time: form.time,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        }),
      });

      if (!res.ok) throw new Error("Failed to calculate chart");

      const data = await res.json();

      // Store in sessionStorage for dashboard to consume
      sessionStorage.setItem("astroData", JSON.stringify(data));

      // Save to profile if authenticated
      if (isAuthenticated && user) {
        try {
          const supabase = getSupabaseClient();
          await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              full_name: form.name || undefined,
              birth_date: form.date || undefined,
              birth_time: form.time || undefined,
              birth_lat: parseFloat(form.latitude) || undefined,
              birth_lng: parseFloat(form.longitude) || undefined,
              birth_tz: form.timezone || "0",
            });
        } catch {
          // Non-critical — chart still works without profile save
        }
      }

      window.location.href = "/dashboard/natal-chart";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const update =
    (key: keyof BirthData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card p-8 w-full max-w-md space-y-5"
    >
      <h2 className="text-xl font-display text-stellar text-center mb-2">
        Enter Your Birth Details
      </h2>

      <Field
        label="Name"
        type="text"
        value={form.name}
        onChange={update("name")}
        placeholder="Your name"
      />
      <Field
        label="Birth Date"
        type="date"
        value={form.date}
        onChange={update("date")}
      />
      <Field
        label="Birth Time"
        type="time"
        value={form.time}
        onChange={update("time")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Latitude"
          type="text"
          value={form.latitude}
          onChange={update("latitude")}
          placeholder="e.g. 40.7128"
        />
        <Field
          label="Longitude"
          type="text"
          value={form.longitude}
          onChange={update("longitude")}
          placeholder="e.g. -74.0060"
        />
      </div>

      <Field
        label="Timezone (UTC offset)"
        type="text"
        value={form.timezone}
        onChange={update("timezone")}
        placeholder="-5"
      />

      {error && (
        <p className="text-crimson text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-violet/20 border border-violet/40 text-violet 
                   hover:bg-violet/30 hover:shadow-neon-purple transition-all duration-300
                   disabled:opacity-50 disabled:cursor-not-allowed font-semibold tracking-wide"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Calculating...
          </span>
        ) : (
          "✦ Reveal Your Chart ✦"
        )}
      </button>

      {/* Auth status */}
      {!authLoading && (
        <div className="text-center pt-1">
          {isAuthenticated && user ? (
            <p className="text-xs text-emerald/60">
              ✓ Signed in as {user.email}
            </p>
          ) : (
            <p className="text-xs text-lunar/40">
              <Link
                href="/auth"
                className="text-violet hover:text-violet/80 underline transition-colors"
              >
                Sign in
              </Link>{" "}
              to save your charts and unlock all readings
            </p>
          )}
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs uppercase tracking-widest text-lunar/60">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
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
