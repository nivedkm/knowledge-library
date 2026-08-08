import { afterEach, expect, test, vi } from "vitest";

import { createBook, listBooks, searchNotes } from "./catalog";

afterEach(() => {
  vi.restoreAllMocks();
});

test("lists books through the versioned API", async () => {
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

  await listBooks();

  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:8000/api/v1/books?limit=100&offset=0",
    expect.objectContaining({ signal: undefined }),
  );
});

test("sends JSON when creating a book", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        id: "book-id",
        title: "Deep Work",
        author: "Cal Newport",
      }),
      { status: 201 },
    ),
  );

  await createBook({ title: "Deep Work", author: "Cal Newport" });

  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:8000/api/v1/books",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        title: "Deep Work",
        author: "Cal Newport",
      }),
    }),
  );
});

test("sends a grounded search request", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        question: "What helps recall?",
        answer: "From your notes: Retrieval practice strengthens later recall.",
        results: [],
      }),
      { status: 200 },
    ),
  );

  await searchNotes("What helps recall?", "quote");

  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:8000/api/v1/search",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        question: "What helps recall?",
        kind: "quote",
      }),
    }),
  );
});
