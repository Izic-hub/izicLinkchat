import React from "react";
import { Check } from "lucide-react";
import { useTheme, THEME_LABELS } from "../lib/ThemeContext";

const SWATCH = { light: "#4338CA", dark: "#7C74FF", sunset: "#F2703C", ocean: "#0E7C86" };

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          title={THEME_LABELS[t]}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer", padding: 4,
          }}
        >
          <span
            style={{
              width: 34, height: 34, borderRadius: "50%", background: SWATCH[t],
              display: "flex", alignItems: "center", justifyContent: "center",
              border: theme === t ? "2px solid var(--ink)" : "2px solid transparent",
              boxShadow: theme === t ? "0 0 0 2px var(--surface)" : "none",
            }}
          >
            {theme === t && <Check size={14} color="#fff" />}
          </span>
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "Inter, sans-serif" }}>{THEME_LABELS[t]}</span>
        </button>
      ))}
    </div>
  );
}
