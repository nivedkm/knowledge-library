import { type FormEvent, useCallback, useEffect, useState } from "react";

import {
  type Book,
  createBook,
  listBooks,
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
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        return;
      }
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load books.",
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
        caughtError instanceof Error ? caughtError.message : "Unable to create book.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main>
      <section className="library-hero">
        <div>
          <p className="eyebrow">Personal knowledge library</p>
          <h1>Your books,<br />remembered.</h1>
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
            <span className="empty-state__symbol" aria-hidden="true">＋</span>
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
              <span className="book-card__arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
