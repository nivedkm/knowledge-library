import type { ReactNode } from "react";

import { Link } from "./Link";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="WisdomAI home">
          <span className="brand__mark">W</span>
          <span>WisdomAI</span>
        </Link>
        <p className="local-label">
          <span aria-hidden="true" />
          Local knowledge library
        </p>
      </header>
      {children}
    </div>
  );
}
