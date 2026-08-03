import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { App } from "./App";

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

test("shows the empty library state", async () => {
  window.history.replaceState({}, "", "/");
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify([]), { status: 200 }),
  );

  render(<App />);

  expect(await screen.findByText("No books yet")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "New book" })).toBeInTheDocument();
});

test("creates a book and refreshes the library", async () => {
  window.history.replaceState({}, "", "/");
  const book = {
    id: "58173bf8-e370-4628-b71a-14d769fb9ce1",
    title: "Deep Work",
    author: "Cal Newport",
    created_at: "2026-07-27T12:00:00Z",
    updated_at: "2026-07-27T12:00:00Z",
    note_count: 0,
    last_activity_at: "2026-07-27T12:00:00Z",
  };
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
    .mockResolvedValueOnce(
      new Response(JSON.stringify(book), { status: 201 }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify([book]), { status: 200 }),
    );

  render(<App />);
  await screen.findByText("No books yet");

  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Deep Work" },
  });
  fireEvent.change(screen.getByLabelText("Author"), {
    target: { value: "Cal Newport" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add book" }));

  expect(await screen.findByRole("heading", { name: "Deep Work" })).toBeInTheDocument();
  expect(screen.getByText("Cal Newport")).toBeInTheDocument();
});

test("switches the composer to quote mode and renders saved quotes distinctly", async () => {
  const book = {
    id: "58173bf8-e370-4628-b71a-14d769fb9ce1",
    title: "Meditations",
    author: "Marcus Aurelius",
    created_at: "2026-07-28T12:00:00Z",
    updated_at: "2026-07-28T12:00:00Z",
    note_count: 1,
    last_activity_at: "2026-07-28T12:00:00Z",
  };
  window.history.replaceState({}, "", `/books/${book.id}`);
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify(book), { status: 200 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: "5a9840e4-68ba-4e68-b534-50bd58b71c94",
            book_id: book.id,
            title: "A guiding thought",
            kind: "quote",
            body: "You have power over your mind — not outside events.",
            source_location: "Book 12",
            created_at: "2026-07-28T12:00:00Z",
            updated_at: "2026-07-28T12:00:00Z",
          },
        ]),
        { status: 200 },
      ),
    );

  render(<App />);

  const renderedQuote = await screen.findByText(
    "You have power over your mind — not outside events.",
  );
  expect(renderedQuote.tagName).toBe("BLOCKQUOTE");
  fireEvent.click(screen.getByRole("button", { name: "Quote" }));
  expect(screen.getByRole("heading", { name: "New quote" })).toBeInTheDocument();
});
