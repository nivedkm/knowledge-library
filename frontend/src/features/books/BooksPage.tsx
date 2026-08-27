import { type FormEvent, useCallback, useEffect, useState } from "react";

import {
  type Book,
  createBook,
  listBooks,
  searchNotes,
  type SearchKindFilter,
  type SearchResponse,
  type SearchResult,
} from "../../api/catalog";
import { ErrorMessage, LoadingMessage } from "../../components/Feedback";
import { Link } from "../../components/Link";
import { formatRelativeDate } from "../../utils/date";

export function BooksPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadBooks = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      setBooks(await listBooks(signal));
    } catch (caughtError) {
      if (
        caughtError instanceof DOMException &&
        caughtError.name === "AbortError"
      ) {
        return;
      }
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load books.",
      );
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    listBooks(controller.signal)
      .then(setBooks)
      .catch((caughtError: unknown) => {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load books.",
        );
      });
    return () => controller.abort();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      await createBook({ title, author });
      setTitle("");
      setAuthor("");
      await loadBooks();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create book.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main>
      <section className="grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.6fr)] items-center gap-[clamp(3rem,8vw,8rem)] w-full max-w-site mx-auto py-[clamp(4rem,9vw,8rem)]">
        <div>
          <h1 className="mb-6 font-serif text-[clamp(2.7rem,7vw,6.5rem)] font-medium tracking-tight leading-none max-w-[12ch]">
            Your books,
            <br />
            remembered.
          </h1>
          <p className="text-muted max-w-2xl text-[clamp(1rem,1.8vw,1.2rem)] leading-relaxed m-0">
            Add books, write notes, and retrieve them later using what you remember about them.
          </p>
        </div>

        <form className="grid gap-4 p-[clamp(1.5rem,4vw,2.25rem)] border border-line rounded-2xl bg-surface shadow-custom" onSubmit={handleCreate}>
          <div>
            <p className="mb-3 text-forest opacity-90 text-[0.72rem] font-extrabold tracking-[0.16em] uppercase">Add to your shelf</p>
            <h2 className="m-0 font-serif text-3xl font-medium">New book</h2>
          </div>
          <label className="grid gap-2 text-ink/80 text-[0.78rem] font-extrabold tracking-wide">
            Title
            <input
              className="w-full border border-line rounded-lg text-ink bg-surface-strong px-4 py-3 text-[0.95rem] font-medium leading-relaxed focus-ring placeholder:text-muted/50"
              required
              maxLength={255}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. The Old Man and the Sea"
            />
          </label>
          <label className="grid gap-2 text-ink/80 text-[0.78rem] font-extrabold tracking-wide">
            Author
            <input
              className="w-full border border-line rounded-lg text-ink bg-surface-strong px-4 py-3 text-[0.95rem] font-medium leading-relaxed focus-ring placeholder:text-muted/50"
              required
              maxLength={255}
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="e.g. Ernest Hemingway"
            />
          </label>
          <button className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold cursor-pointer text-paper bg-forest disabled:opacity-60 disabled:cursor-wait focus-ring" disabled={isCreating}>
            {isCreating ? "Adding…" : "Add book"}
          </button>
        </form>
      </section>

      <KnowledgeSearch />

      <section className="min-h-[30rem] bg-surface pt-[clamp(3rem,7vw,6rem)] pb-[clamp(3rem,7vw,6rem)] px-[max(1.5rem,calc((100vw-1200px)/2))]" aria-labelledby="library-title">
        <div className="flex items-end justify-between gap-8 mb-8">
          <div>
            <p className="mb-3 text-forest opacity-90 text-[0.72rem] font-extrabold tracking-[0.16em] uppercase">Your collection</p>
            <h2 id="library-title" className="m-0 font-serif text-[clamp(2.4rem,5vw,4rem)] font-medium tracking-tight">Library</h2>
          </div>
          <span className="px-3 py-2 border border-line rounded-full text-muted text-[0.78rem] font-bold">
            {books === null ? "—" : books.length} books
          </span>
        </div>

        {error === null ? null : (
          <ErrorMessage message={error} onRetry={() => void loadBooks()} />
        )}

        {books === null && error === null ? (
          <LoadingMessage label="Opening your library…" />
        ) : null}

        {books?.length === 0 ? (
          <div className="grid min-h-[18rem] place-items-center content-center border border-dashed border-line rounded-2xl text-muted text-center">
            <span className="grid w-14 h-14 place-items-center mb-4 border border-line rounded-full text-2xl" aria-hidden="true">
              ＋
            </span>
            <h3 className="mb-1.5 text-ink font-serif text-2xl font-medium">No books yet</h3>
            <p className="m-0">Add the first book you want to remember.</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {books?.map((book, index) => (
            <Link className="relative flex flex-col justify-between min-h-[19rem] overflow-hidden p-6 border border-line rounded-2xl text-ink bg-paper no-underline transition-all duration-150 hover:-translate-y-1 hover:border-hover-border hover:shadow-custom-hover focus-ring [&:nth-child(3n+2)]:bg-forest-soft" to={`/books/${book.id}`} key={book.id}>
              <span className="text-muted font-mono text-xs">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="mb-2.5 font-serif text-[clamp(1.6rem,3vw,2.2rem)] font-medium tracking-tight leading-[1.05]">
                <h3>{book.title}</h3>
                <p className="text-muted text-lg mt-2 font-sans">{book.author}</p>
              </div>
              <div className="flex flex-col gap-1 text-muted text-[0.76rem]">
                <span>
                  {book.note_count} {book.note_count === 1 ? "note" : "notes"}
                </span>
                <span>Edited {formatRelativeDate(book.last_activity_at)}</span>
              </div>
              <span className="absolute top-5 right-5 text-lg" aria-hidden="true">
                ↗
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function KnowledgeSearch() {
  const [question, setQuestion] = useState("");
  const [kind, setKind] = useState<SearchKindFilter>("all");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(nextQuestion = question, nextKind = kind) {
    const trimmedQuestion = nextQuestion.trim();
    if (trimmedQuestion === "") {
      setResult(null);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      setResult(await searchNotes(trimmedQuestion, nextKind));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to search your notes.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch();
  }

  function handleFilterChange(nextKind: SearchKindFilter) {
    setKind(nextKind);
    if (question.trim() === "") {
      return;
    }

    void runSearch(question, nextKind);
  }

  const baseFilterClass = "border border-line rounded-full px-3.5 py-2 text-muted bg-surface-strong text-[0.76rem] font-extrabold cursor-pointer focus-ring transition-colors";
  const selectedFilterClass = "text-paper bg-forest border-forest";

  return (
    <section className="w-full max-w-site mx-auto pb-8" aria-labelledby="search-title">
      <div className="grid gap-4 p-[clamp(1.5rem,4vw,2.25rem)] border border-line rounded-2xl bg-surface shadow-custom">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="search-title" className="m-0 font-serif text-3xl font-medium">Search the library</h2>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Search filters"
          >
            <button
              className={`${baseFilterClass} ${kind === 'all' ? selectedFilterClass : ''}`}
              type="button"
              aria-pressed={kind === "all"}
              onClick={() => handleFilterChange("all")}
            >
              All
            </button>
            <button
              className={`${baseFilterClass} ${kind === 'note' ? selectedFilterClass : ''}`}
              type="button"
              aria-pressed={kind === "note"}
              onClick={() => handleFilterChange("note")}
            >
              Notes
            </button>
            <button
              className={`${baseFilterClass} ${kind === 'quote' ? selectedFilterClass : ''}`}
              type="button"
              aria-pressed={kind === "quote"}
              onClick={() => handleFilterChange("quote")}
            >
              Quotes
            </button>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <input
                className="w-full border border-line rounded-lg text-ink bg-surface-strong px-4 py-3 text-[0.95rem] font-medium leading-relaxed focus-ring placeholder:text-muted/50 flex-1"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="What did I note about habit formation?"
              />
              <button
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold cursor-pointer text-paper bg-forest disabled:opacity-60 disabled:cursor-wait focus-ring shrink-0"
                type="submit"
                disabled={isSearching}
              >
                {isSearching ? "Searching…" : "Search notes"}
              </button>
            </div>
          </label>
        </form>

        {error === null ? null : (
          <ErrorMessage message={error} onRetry={() => void runSearch()} />
        )}

        {isSearching ? <LoadingMessage label="Searching your notes…" /> : null}

        {result === null || isSearching ? null : (
          <div className="grid gap-4" aria-live="polite">
            <div className="grid gap-1.5 p-4 border border-line rounded-2xl bg-forest-soft/35">
              <span className="text-muted text-[0.72rem] font-extrabold tracking-[0.16em] uppercase">Grounded answer</span>
              <p className="m-0 text-ink leading-[1.7]">{result.answer}</p>
            </div>

            {result.results.length === 0 ? (
              <div className="grid gap-1.5 p-5 border border-dashed border-line rounded-2xl text-muted bg-surface">
                <h3 className="m-0 text-ink font-serif text-xl font-medium">No strong matches</h3>
                <p className="m-0">
                  Try a more specific question, or switch between notes and
                  quotes.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {result.results.slice(0, 5).map((searchResult) => (
                  <SearchResultCard
                    key={searchResult.note_id}
                    result={searchResult}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <article className="grid gap-3 py-4 border-t border-line first:pt-0 first:border-t-0">
      <div className="flex flex-wrap items-center gap-2 text-muted text-[0.76rem] font-bold">
        <span className="text-forest">{result.note_kind}</span>
        <span>{result.book_title}</span>
        {result.source_location === null ? (
          <span></span>
        ) : (
          <span>{result.source_location}</span>
        )}
      </div>
      {result.note_title === null ? null : <h3 className="m-0 font-serif text-xl font-medium">{result.note_title}</h3>}
      <p className="m-0 text-ink leading-relaxed break-words whitespace-pre-wrap">{result.excerpt}</p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-muted text-[0.74rem] font-bold">
          Match score {result.score.toFixed(2)}
        </span>
        <Link className="text-forest text-[0.78rem] font-extrabold no-underline hover:underline focus-ring" to={`/books/${result.book_id}`}>
          Open book
        </Link>
      </div>
    </article>
  );
}
