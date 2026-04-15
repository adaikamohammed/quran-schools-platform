"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // قراءة الإعداد المحفوظ عند أول تحميل
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("qsp-theme") as Theme | null;
      if (saved === "dark" || saved === "light") {
        setThemeState(saved);
      } else {
        // كشف تفضيل النظام تلقائياً
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setThemeState(prefersDark ? "dark" : "light");
      }
    } catch {
      // ignore
    }
  }, []);

  // تطبيق class على <html> عند كل تغيير
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("qsp-theme", theme);
    } catch {
      // ignore
    }
  }, [theme, mounted]);

  const toggleTheme = () =>
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider
      value={{ theme, isDark: theme === "dark", toggleTheme, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
