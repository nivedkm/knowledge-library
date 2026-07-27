import { useEffect, useState } from "react";

import { fetchHealth } from "./api/health";

type ApiStatus = "checking" | "connected" | "unavailable";

export function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetchHealth(controller.signal)
      .then(() => setApiStatus("connected"))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setApiStatus("unavailable");
      });

    return () => controller.abort();
  }, []);

  const statusText = {
    checking: "Checking the local API…",
    connected: "Local API connected",
    unavailable: "Local API unavailable",
  }[apiStatus];

  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Your reading, made searchable</p>
        <h1 id="page-title">WisdomAI</h1>
        <p className="summary">
          A private, local-first home for your books, notes, and questions.
        </p>

        <div className={`status status--${apiStatus}`} role="status">
          <span className="status__dot" aria-hidden="true" />
          {statusText}
        </div>
      </section>

      <section className="milestone" aria-labelledby="milestone-title">
        <p className="step">Milestone 1</p>
        <h2 id="milestone-title">The foundation is ready.</h2>
        <p>
          This screen currently tests one important thing: the React frontend
          can communicate with the FastAPI backend.
        </p>
      </section>
    </main>
  );
}

