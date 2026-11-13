"use client";

import React, { useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

export const ThemeToggle: React.FC = () => {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  // Sync state to <html> attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="touch-target min-h-[44px] min-w-[44px] p-2 rounded-full text-secondary hover:text-primary hover:bg-surface border border-transparent hover:border-border transition-colors"
      aria-label={
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-gold" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5 text-forest" aria-hidden="true" />
      )}
    </button>
  );
};
