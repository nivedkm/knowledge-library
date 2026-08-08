import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  type Book,
  type Note,
  type NoteKind,
  createNote,
  deleteBook,
  deleteNote,
  getBook,
  listNotes,
  updateBook,
  updateNote,
} from "../../api/catalog";
import { ErrorMessage, LoadingMessage } from "../../components/Feedback";
import { Link } from "../../components/Link";
import { navigate } from "../../routing";
import { formatDate, formatRelativeDate } from "../../utils/date";

interface BookDetailPageProps {
  bookId: string;
}

export function BookDetailPage({ bookId }: BookDetailPageProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      const [loadedBook, loadedNotes] = await Promise.all([
        getBook(bookId, signal),
        listNotes(bookId, signal),
      ]);
      setBook(loadedBook);
      setNotes(loadedNotes);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        return;
      }
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load this book.",
      );
    }
  }, [bookId]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getBook(bookId, controller.signal),
      listNotes(bookId, controller.signal),
    ])
      .then(([loadedBook, loadedNotes]) => {
        setBook(loadedBook);
        setNotes(loadedNotes);
      })
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
            : "Unable to load this book.",
        );
      });
    return () => controller.abort();
  }, [bookId]);

  async function handleDeleteBook() {
    if (
      book === null ||
      !window.confirm(`Delete “${book.title}” and all of its notes?`)
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBook(book.id);
      navigate("/");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to delete book.",
      );
      setIsDeleting(false);
    }
  }

  if (book === null && error === null) {
    return <main className="detail-page"><LoadingMessage label="Opening book…" /></main>;
  }

  if (book === null) {
    return (
      <main className="detail-page">
        <Link className="back-link" to="/">← Back to library</Link>
        <ErrorMessage message={error ?? "Book not found."} />
      </main>
    );
  }

  return (
    <main className="detail-page">
      <Link className="back-link" to="/">← Back to library</Link>

      <section className="book-header">
        <div>
          <p className="eyebrow">Book notes</p>
          <h1>{book.title}</h1>
          <p className="book-author">by {book.author}</p>
          <div className="book-facts">
            <span>{book.note_count} {book.note_count === 1 ? "note" : "notes"}</span>
            <span>Last activity {formatRelativeDate(book.last_activity_at)}</span>
          </div>
        </div>
        <BookSettings
          book={book}
          onSaved={() => void loadData()}
          onDelete={() => void handleDeleteBook()}
          isDeleting={isDeleting}
        />
      </section>

      {error === null ? null : (
        <ErrorMessage message={error} onRetry={() => void loadData()} />
      )}

      <section className="notes-layout">
        <NoteComposer bookId={book.id} onCreated={() => void loadData()} />
        <div className="notes-column">
          <div className="section-heading section-heading--compact">
            <div>
              <h2>Notes</h2>
            </div>
          </div>

          {notes === null ? <LoadingMessage label="Loading notes…" /> : null}
          {notes?.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <h3>No notes yet</h3>
              <p>Capture the first idea from this book.</p>
            </div>
          ) : null}
          {notes?.map((note) => (
            <NoteCard note={note} key={note.id} onChanged={() => void loadData()} />
          ))}
        </div>
      </section>
    </main>
  );
}

interface BookSettingsProps {
  book: Book;
  onSaved: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function BookSettings({
  book,
  onSaved,
  onDelete,
  isDeleting,
}: BookSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await updateBook(book.id, { title, author });
      setIsEditing(false);
      onSaved();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update book.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <form className="settings-card" onSubmit={handleSubmit}>
        <label>
          Title
          <input required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Author
          <input required maxLength={255} value={author} onChange={(event) => setAuthor(event.target.value)} />
        </label>
        {error === null ? null : <p className="field-error" role="alert">{error}</p>}
        <div className="button-row">
          <button className="button button--primary" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button className="button button--quiet" type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="book-actions">
      <button className="button button--quiet" type="button" onClick={() => setIsEditing(true)}>
        Edit book
      </button>
      <button className="button button--danger" type="button" disabled={isDeleting} onClick={onDelete}>
        {isDeleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}

function NoteComposer({ bookId, onCreated }: { bookId: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<NoteKind>("note");
  const [body, setBody] = useState("");
  const [sourceLocation, setSourceLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await createNote(bookId, {
        title: title || null,
        kind,
        body,
        source_location: sourceLocation || null,
      });
      setTitle("");
      setBody("");
      setSourceLocation("");
      onCreated();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to add note.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="note-composer" onSubmit={handleSubmit}>
      <div>
        <h2>New {kind}</h2>
      </div>
      <EntryKindSwitch kind={kind} onChange={setKind} />
      <label>
        Heading <span>optional</span>
        <input maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What is this idea about?" />
      </label>
      <label>
        {kind === "quote" ? "Quote" : "Your note"}
        <textarea required maxLength={100000} rows={9} value={body} onChange={(event) => setBody(event.target.value)} placeholder={kind === "quote" ? "Copy the passage exactly…" : "Write the idea in your own words…"} />
      </label>
      <label>
        Source <span>optional</span>
        <input maxLength={100} value={sourceLocation} onChange={(event) => setSourceLocation(event.target.value)} placeholder="Page 42 or Chapter 3" />
      </label>
      {error === null ? null : <p className="field-error" role="alert">{error}</p>}
      <button className="button button--primary" disabled={isSaving}>
        {isSaving ? "Saving…" : `Save ${kind}`}
      </button>
    </form>
  );
}

function NoteCard({ note, onChanged }: { note: Note; onChanged: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title ?? "");
  const [kind, setKind] = useState<NoteKind>(note.kind);
  const [body, setBody] = useState(note.body);
  const [sourceLocation, setSourceLocation] = useState(note.source_location ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await updateNote(note.id, {
        title: title || null,
        kind,
        body,
        source_location: sourceLocation || null,
      });
      setIsEditing(false);
      onChanged();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update note.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this note?")) {
      return;
    }
    setError(null);
    try {
      await deleteNote(note.id);
      onChanged();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete note.",
      );
    }
  }

  if (isEditing) {
    return (
      <form className={`note-card note-card--editing note-card--${kind}`} onSubmit={handleUpdate}>
        <label>
          Heading
          <input maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          {kind === "quote" ? "Quote" : "Note"}
          <textarea required maxLength={100000} rows={7} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <EntryKindSwitch kind={kind} onChange={setKind} />
        <label>
          Source
          <input maxLength={100} value={sourceLocation} onChange={(event) => setSourceLocation(event.target.value)} />
        </label>
        {error === null ? null : <p className="field-error" role="alert">{error}</p>}
        <div className="button-row">
          <button className="button button--primary" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </button>
          <button className="button button--quiet" type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className={`note-card note-card--${note.kind}`}>
      <div className="note-card__topline">
        <time dateTime={note.updated_at}>{formatDate(note.updated_at)}</time>
        <span>{note.source_location ?? ""}</span>
      </div>
      {note.title === null ? null : <h3>{note.title}</h3>}
      {note.kind === "quote" ? (
        <blockquote className="quote-body">{note.body}</blockquote>
      ) : (
        <p className="note-body">{note.body}</p>
      )}
      {error === null ? null : <p className="field-error" role="alert">{error}</p>}
      <div className="note-actions">
        <button type="button" onClick={() => setIsEditing(true)}>Edit</button>
        <button type="button" onClick={() => void handleDelete()}>Delete</button>
      </div>
    </article>
  );
}

function EntryKindSwitch({
  kind,
  onChange,
}: {
  kind: NoteKind;
  onChange: (kind: NoteKind) => void;
}) {
  return (
    <div className="kind-switch" role="group" aria-label="Entry type">
      <button
        className={kind === "note" ? "kind-switch__option is-selected" : "kind-switch__option"}
        type="button"
        aria-pressed={kind === "note"}
        onClick={() => onChange("note")}
      >
        Note
      </button>
      <button
        className={kind === "quote" ? "kind-switch__option is-selected" : "kind-switch__option"}
        type="button"
        aria-pressed={kind === "quote"}
        onClick={() => onChange("quote")}
      >
        Quote
      </button>
    </div>
  );
}
