import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Cinzel, Inter } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "AstroSoul – Discover Your Soul's Path",
  description:
    "Hyper-personalized astrology insights powered by exact astronomical calculations and ancient wisdom texts.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "AstroSoul",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable}`}>
      <body className="galaxy-bg min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
