"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";

type Mode = "dark" | "light";

interface ThemeContextValue {
  mode: Mode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/**
 * Inline script that runs before first paint to set the theme.
 * Rendered as a raw `<script>` in the `<head>` via the root layout.
 */
export const themeScript = `
(function(){
  try {
    var t = localStorage.getItem("theme");
    if (t === "light" || t === "dark") {
      document.documentElement.setAttribute("data-mode", t);
    } else {
      document.documentElement.setAttribute("data-mode", "dark");
    }
  } catch(e) {
    document.documentElement.setAttribute("data-mode", "dark");
  }
})();
`;

function getMode(): Mode {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-mode");
  return attr === "light" ? "light" : "dark";
}

function subscribe(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mode"],
  });
  return () => observer.disconnect();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getMode, () => "dark" as Mode);

  const toggle = useCallback(() => {
    const next: Mode = getMode() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-mode", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
