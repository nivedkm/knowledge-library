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
    <div className="app">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Personal Knowledge Library home">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          <span>Personal Knowledge Library</span>
        </Link>
        <div className="site-header__meta">
          <button
            className="theme-toggle"
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
