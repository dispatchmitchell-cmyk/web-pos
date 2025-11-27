// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";
import { ThemeProvider } from "./theme-provider";
import { getSession } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Galaxy Nightclub POS",
  description: "POS system for Galaxy Nightclub",
};

// -------------------------------
// DIRECT SUPABASE SERVER QUERY
// -------------------------------
async function loadBusinessSettings() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from("business_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load business settings:", error);
    return {};
  }

  return data || {};
}

// -------------------------------
// ROOT LAYOUT
// -------------------------------
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  const navSession = session?.staff
    ? {
        id: session.staff.id,
        name: session.staff.name,
        username: session.staff.username,
        role: session.staff.role,
        permissions_level: session.staff.permissions_level,
      }
    : null;

  // DIRECTLY LOAD SETTINGS FROM SUPABASE (NOT OWN API)
  const settings = await loadBusinessSettings();

  const businessName = settings.business_name || "My Business";
  const businessLogo = settings.business_logo_url || "/logo.png";
  const themeColor = settings.theme_color || "#d946ef";
  const logoWidth = settings.logo_width ?? 60;
  const logoHeight = settings.logo_height ?? 60;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100`}
      >
        <ThemeProvider themeColor={themeColor} />

        {navSession && (
          <NavBar
            session={navSession}
            businessName={businessName}
            businessLogo={businessLogo}
            logoWidth={logoWidth}
            logoHeight={logoHeight}
          />
        )}

        <main className="min-h-screen pt-20">{children}</main>
      </body>
    </html>
  );
}
