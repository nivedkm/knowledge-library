import { useEffect, useState, type ReactNode } from "react";

import { Link } from "./Link";
import {
  applyTheme,
  getInitialTheme,
  saveTheme,
  type ThemeMode,
} from "../theme";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  return (
    <div className="min-h-screen">
      <header className="relative flex w-full max-w-site items-center justify-center mx-auto py-5 border-b border-line">
        <Link className="flex justify-center items-center gap-3 text-ink font-serif text-xl font-bold no-underline focus-ring" to="/" aria-label="Personal Knowledge Library home">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          <span>Personal Knowledge Library</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        </Link>
        <div className="absolute right-0 flex items-center gap-4">
          <button
            className="inline-flex items-center gap-2 border border-line rounded-full px-4 py-2 text-ink bg-surface-strong text-xs font-extrabold cursor-pointer shadow-[0_0.5rem_1.25rem_var(--shadow-color)] hover:border-hover-border transition-colors focus-ring"
            type="button"
            aria-pressed={theme === "dark"}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
