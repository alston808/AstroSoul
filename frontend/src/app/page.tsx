import BirthChartForm from "@/components/BirthChartForm";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-display neon-text-gold tracking-wide mb-4">
          AstroSoul
        </h1>
        <p className="text-lg md:text-xl text-lunar/80 max-w-xl mx-auto leading-relaxed">
          Discover your soul&apos;s path through the ancient wisdom of the stars —
          powered by exact astronomical calculations and timeless astrology texts.
        </p>
      </div>

      {/* Birth Chart Form */}
      <BirthChartForm />

      {/* Navigation Tabs */}
      <nav className="mt-16 flex gap-4 flex-wrap justify-center">
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
          ✦ Karmic Path
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
