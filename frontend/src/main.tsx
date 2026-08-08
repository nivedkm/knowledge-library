import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./styles.css";
import { applyTheme, getInitialTheme } from "./theme";

applyTheme(getInitialTheme());

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("The root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
