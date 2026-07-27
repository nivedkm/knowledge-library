import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { App } from "./App";

afterEach(() => {
  vi.restoreAllMocks();
});

test("shows that the local API is connected", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        status: "ok",
        service: "wisdom-api",
      }),
      { status: 200 },
    ),
  );

  render(<App />);

  expect(await screen.findByText("Local API connected")).toBeInTheDocument();
});

