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
      <section className="library-hero">
        <div>
          <h1>
            Your books,
            <br />
            remembered.
          </h1>
          <p className="hero-copy">
            Save the ideas worth keeping. Search and grounded answers arrive in
            later milestones.
          </p>
        </div>

        <form className="create-card" onSubmit={handleCreate}>
          <div>
            <p className="form-kicker">Add to your shelf</p>
            <h2>New book</h2>
          </div>
          <label>
            Title
            <input
              required
              maxLength={255}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Thinking in Systems"
            />
          </label>
          <label>
            Author
            <input
              required
              maxLength={255}
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="e.g. Donella Meadows"
            />
          </label>
          <button className="button button--primary" disabled={isCreating}>
            {isCreating ? "Adding…" : "Add book"}
          </button>
        </form>
      </section>

      <KnowledgeSearch />

      <section className="library-section" aria-labelledby="library-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your collection</p>
            <h2 id="library-title">Library</h2>
          </div>
          <span className="count-badge">
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
          <div className="empty-state">
            <span className="empty-state__symbol" aria-hidden="true">
              ＋
            </span>
            <h3>No books yet</h3>
            <p>Add the first book you want to remember.</p>
          </div>
        ) : null}

        <div className="book-grid">
          {books?.map((book, index) => (
            <Link className="book-card" to={`/books/${book.id}`} key={book.id}>
              <span className="book-card__number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="book-card__body">
                <h3>{book.title}</h3>
                <p>{book.author}</p>
              </div>
              <div className="book-card__meta">
                <span>
                  {book.note_count} {book.note_count === 1 ? "note" : "notes"}
                </span>
                <span>Edited {formatRelativeDate(book.last_activity_at)}</span>
              </div>
              <span className="book-card__arrow" aria-hidden="true">
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

  return (
    <section className="search-panel" aria-labelledby="search-title">
      <div className="search-panel__card">
        <div className="search-panel__header">
          <div>
            <h2 id="search-title">Search the library</h2>
          </div>
          <div
            className="search-filters"
            role="group"
            aria-label="Search filters"
          >
            <button
              className={
                kind === "all" ? "search-filter is-selected" : "search-filter"
              }
              type="button"
              aria-pressed={kind === "all"}
              onClick={() => handleFilterChange("all")}
            >
              All
            </button>
            <button
              className={
                kind === "note" ? "search-filter is-selected" : "search-filter"
              }
              type="button"
              aria-pressed={kind === "note"}
              onClick={() => handleFilterChange("note")}
            >
              Notes
            </button>
            <button
              className={
                kind === "quote" ? "search-filter is-selected" : "search-filter"
              }
              type="button"
              aria-pressed={kind === "quote"}
              onClick={() => handleFilterChange("quote")}
            >
              Quotes
            </button>
          </div>
        </div>

        <form className="search-panel__form" onSubmit={handleSubmit}>
          <label className="search-panel__field">
            Question
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What did I note about retrieval practice?"
            />
          </label>
          <div className="button-row">
            <button
              className="button button--primary"
              type="submit"
              disabled={isSearching}
            >
              {isSearching ? "Searching…" : "Search notes"}
            </button>
          </div>
        </form>

        {error === null ? null : (
          <ErrorMessage message={error} onRetry={() => void runSearch()} />
        )}

        {isSearching ? <LoadingMessage label="Searching your notes…" /> : null}

        {result === null || isSearching ? null : (
          <div className="search-results" aria-live="polite">
            <div className="search-answer">
              <span className="search-answer__label">Grounded answer</span>
              <p>{result.answer}</p>
            </div>

            {result.results.length === 0 ? (
              <div className="search-empty">
                <h3>No strong matches</h3>
                <p>
                  Try a more specific question, or switch between notes and
                  quotes.
                </p>
              </div>
            ) : (
              <div className="search-result-list">
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
    <article className="search-result">
      <div className="search-result__meta">
        <span className="entry-kind">{result.note_kind}</span>
        <span>{result.book_title}</span>
        {result.source_location === null ? (
          <span></span>
        ) : (
          <span>{result.source_location}</span>
        )}
      </div>
      {result.note_title === null ? null : <h3>{result.note_title}</h3>}
      <p className="search-result__preview">{result.excerpt}</p>
      <div className="search-result__foot">
        <span className="search-result__score">
          Match score {result.score.toFixed(2)}
        </span>
        <Link className="search-result__link" to={`/books/${result.book_id}`}>
          Open book
        </Link>
      </div>
    </article>
  );
}
