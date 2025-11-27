// app/theme-provider.tsx
"use client";

import { useEffect } from "react";

/**
 * Utility to lighten or darken a hex color.
 * @param hex Color like "#ff00aa"
 * @param amount Positive = lighten, Negative = darken
 */
function adjustColor(hex: string, amount: number) {
  let col = hex.replace("#", "");
  if (col.length === 3) {
    col = col.split("").map((c) => c + c).join("");
  }

  const num = parseInt(col, 16);

  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `rgb(${r}, ${g}, ${b})`;
}

export function ThemeProvider({ themeColor }: { themeColor: string }) {
  useEffect(() => {
    if (!themeColor) return;

    // Base accent color
    document.documentElement.style.setProperty("--accent", themeColor);

    // Lighter variant (for active states, highlights)
    document.documentElement.style.setProperty(
      "--accent-light",
      adjustColor(themeColor, 40)
    );

    // Darker / hover variant
    document.documentElement.style.setProperty(
      "--accent-hover",
      adjustColor(themeColor, -40)
    );

    // Text color depending on theme – ensures contrast
    const fg = "#ffffff";
    document.documentElement.style.setProperty("--accent-foreground", fg);
  }, [themeColor]);

  return null;
}
