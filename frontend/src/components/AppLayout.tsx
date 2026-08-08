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
        <Link className="brand" to="/" aria-label="WisdomAI home">
          <span className="brand__mark">W</span>
          <span>WisdomAI</span>
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
