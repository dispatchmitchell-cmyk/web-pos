// app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Staff = {
  id: number;
  name: string;
  username: string;
  role: string;
  permissions_level: number;
};

type BusinessSettings = {
  business_name: string;
  business_logo_url: string | null;
  theme_color: string;
  logo_width: number | null;
  logo_height: number | null;
};

export default function SettingsPage() {
  const router = useRouter();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // form fields
  const [businessName, setBusinessName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [themeColor, setThemeColor] = useState("#d946ef");

  const [logoWidth, setLogoWidth] = useState(60);
  const [logoHeight, setLogoHeight] = useState(60);

  // ---------------------------------------------------------
  // LOAD session + settings
  // ---------------------------------------------------------
  useEffect(() => {
    async function load() {
      const s = await fetch("/api/auth/session").then((r) => r.json());
      setStaff(s.staff || null);

      const bs = await fetch("/api/settings/business").then((r) => r.json());
      if (bs.settings) {
        setSettings(bs.settings);
        setBusinessName(bs.settings.business_name);
        setLogoUrl(bs.settings.business_logo_url);
        setThemeColor(bs.settings.theme_color);

        setLogoWidth(bs.settings.logo_width ?? 60);
        setLogoHeight(bs.settings.logo_height ?? 60);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );

  if (!staff)
    return <div className="p-10 text-white">Not authenticated</div>;

  if (staff.permissions_level < 900)
    return (
      <div className="p-10 text-red-400 text-xl">
        You do not have permission to view this page.
      </div>
    );

  // ---------------------------------------------------------
  // UPLOAD LOGO
  // ---------------------------------------------------------
  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/settings/upload-logo", {
      method: "POST",
      body: form,
    });

    const json = await res.json();

    if (json.error) {
      alert("Upload failed: " + json.error);
      setUploading(false);
      return;
    }

    setLogoUrl(json.url);
    setUploading(false);
  }

  // ---------------------------------------------------------
  // SAVE SETTINGS (auto-refresh added)
  // ---------------------------------------------------------
  async function saveSettings() {
    const res = await fetch("/api/settings/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_name: businessName,
        business_logo_url: logoUrl,
        theme_color: themeColor,
        logo_width: logoWidth,
        logo_height: logoHeight,
      }),
    });

    if (!res.ok) return alert("Failed to save");

    alert("Settings saved!");

    // 🔥 Auto-refresh page so new logo/theme is applied in navbar
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-8 pt-24 max-w-3xl mx-auto space-y-10">

      {/* Profile */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
        <p>Name: {staff.name}</p>
        <p>Role: {staff.role}</p>
        <p>Username: {staff.username}</p>
      </div>

      {/* Business Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
        <h2 className="text-2xl font-bold">Business Settings</h2>

        {/* Name */}
        <div>
          <label className="block text-sm mb-1">Business Name</label>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm mb-1">Accent Colour</label>
          <input
            type="color"
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
            className="w-20 h-10 cursor-pointer"
          />
        </div>

        {/* Logo Preview */}
        <div>
          <label className="block text-sm mb-2">Business Logo</label>

          <div className="flex items-center gap-4">
            <div
              className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center"
              style={{ width: logoWidth, height: logoHeight }}
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={logoWidth}
                  height={logoHeight}
                  className="object-contain"
                />
              ) : (
                <span className="text-slate-500">No Logo</span>
              )}
            </div>

            <div>
              <input type="file" accept="image/*" onChange={uploadLogo} />
              {uploading && (
                <p className="text-xs text-slate-400 mt-1">Uploading...</p>
              )}
            </div>
          </div>
        </div>

        {/* Logo Sizing */}
        <div className="flex gap-4">
          <div>
            <label className="block text-sm mb-1">Logo Width (px)</label>
            <input
              type="number"
              value={logoWidth}
              onChange={(e) => setLogoWidth(Number(e.target.value))}
              className="p-2 bg-slate-800 border border-slate-700 rounded w-24"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Logo Height (px)</label>
            <input
              type="number"
              value={logoHeight}
              onChange={(e) => setLogoHeight(Number(e.target.value))}
              className="p-2 bg-slate-800 border border-slate-700 rounded w-24"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={saveSettings}
          className="
            px-4 py-2 rounded-lg font-semibold
            bg-[color:var(--accent)]
            hover:bg-[color:var(--accent-hover)]
          "
        >
          Save Business Settings
        </button>
      </div>

      {/* Logout */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
        <form action="/api/auth/logout" method="POST">
          <button className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-md font-semibold">
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
