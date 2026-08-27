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
    return <main className="w-full max-w-site mx-auto pt-8 pb-24"><LoadingMessage label="Opening book…" /></main>;
  }

  if (book === null) {
    return (
      <main className="w-full max-w-site mx-auto pt-8 pb-24">
        <Link className="inline-block my-4 mb-12 text-muted text-[0.84rem] font-bold no-underline hover:text-forest focus-ring" to="/">← Back to library</Link>
        <ErrorMessage message={error ?? "Book not found."} />
      </main>
    );
  }

  return (
    <main className="w-full max-w-site mx-auto pt-8 pb-24">
      <Link className="inline-block my-4 mb-12 text-muted text-[0.84rem] font-bold no-underline hover:text-forest focus-ring" to="/">← Back to library</Link>

      <section className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-6 md:gap-12 items-start pb-16">
        <div>
          <p className="mb-[0.9rem] text-forest opacity-90 text-[0.72rem] font-extrabold tracking-[0.16em] uppercase">Book notes</p>
          <h1 className="max-w-[14ch] mb-4 font-serif text-[clamp(3.2rem,7vw,6rem)] font-medium leading-none m-0">{book.title}</h1>
          <p className="mb-5 text-muted text-[1.15rem] m-0">by {book.author}</p>
          <div className="flex flex-wrap gap-2.5">
            <span className="px-3 py-2 border border-line rounded-full text-muted text-[0.76rem] font-bold">{book.note_count} {book.note_count === 1 ? "note" : "notes"}</span>
            <span className="px-3 py-2 border border-line rounded-full text-muted text-[0.76rem] font-bold">Last activity {formatRelativeDate(book.last_activity_at)}</span>
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

      <section className="grid grid-cols-1 md:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)] gap-[clamp(2rem,6vw,5rem)] items-start pt-16 border-t border-line">
        <NoteComposer bookId={book.id} onCreated={() => void loadData()} />
        <div className="min-w-0">
          <div className="flex items-end justify-between gap-8 mb-5">
            <div>
              <h2 className="m-0 font-serif text-4xl font-medium tracking-tight">Notes</h2>
            </div>
          </div>

          {notes === null ? <LoadingMessage label="Loading notes…" /> : null}
          {notes?.length === 0 ? (
            <div className="grid min-h-[12rem] place-items-center content-center border border-dashed border-line rounded-2xl text-muted text-center">
              <h3 className="mb-1.5 text-ink font-serif text-[1.75rem] font-medium m-0">No notes yet</h3>
              <p className="m-0">Capture the first idea from this book.</p>
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

  const inputClass = "w-full border border-line rounded-lg text-ink bg-surface-strong px-4 py-3 text-[0.95rem] font-medium leading-relaxed focus-ring placeholder:text-muted/50";
  const labelClass = "grid gap-2 text-ink/80 text-[0.78rem] font-extrabold tracking-wide";
  const primaryButtonClass = "inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold cursor-pointer text-paper bg-forest disabled:opacity-60 disabled:cursor-wait focus-ring";
  const quietButtonClass = "inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold cursor-pointer border border-line text-ink bg-transparent focus-ring";
  const dangerButtonClass = "inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold cursor-pointer border border-[rgb(168_77_50/0.3)] text-rust bg-transparent focus-ring disabled:opacity-60 disabled:cursor-wait";

  if (isEditing) {
    return (
      <form className="grid gap-4 p-5 w-full md:w-[22rem] border border-line rounded-2xl bg-surface shadow-custom" onSubmit={handleSubmit}>
        <label className={labelClass}>
          Title
          <input className={inputClass} required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className={labelClass}>
          Author
          <input className={inputClass} required maxLength={255} value={author} onChange={(event) => setAuthor(event.target.value)} />
        </label>
        {error === null ? null : <p className="text-rust text-[0.8rem] font-bold m-0" role="alert">{error}</p>}
        <div className="flex flex-wrap gap-2.5">
          <button className={primaryButtonClass} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button className={quietButtonClass} type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      <button className={quietButtonClass} type="button" onClick={() => setIsEditing(true)}>
        Edit book
      </button>
      <button className={dangerButtonClass} type="button" disabled={isDeleting} onClick={onDelete}>
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

  const inputClass = "w-full border border-line rounded-lg text-ink bg-surface-strong px-4 py-3 text-[0.95rem] font-medium leading-relaxed focus-ring placeholder:text-muted/50";
  const labelClass = "grid gap-2 text-ink/80 text-[0.78rem] font-extrabold tracking-wide";
  const primaryButtonClass = "inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold cursor-pointer text-paper bg-forest disabled:opacity-60 disabled:cursor-wait focus-ring";

  return (
    <form className="grid gap-4 p-5 md:sticky md:top-6 border border-line rounded-2xl bg-surface shadow-custom" onSubmit={handleSubmit}>
      <div>
        <h2 className="m-0 font-serif text-[2rem] font-medium">New {kind}</h2>
      </div>
      <EntryKindSwitch kind={kind} onChange={setKind} />
      <label className={labelClass}>
        <span>Heading <span className="text-muted font-medium">optional</span></span>
        <input className={inputClass} maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What is this idea about?" />
      </label>
      <label className={labelClass}>
        {kind === "quote" ? "Quote" : "Your note"}
        <textarea className={inputClass} required maxLength={100000} rows={9} value={body} onChange={(event) => setBody(event.target.value)} placeholder={kind === "quote" ? "Copy the passage exactly…" : "Write the idea in your own words…"} />
      </label>
      <label className={labelClass}>
        <span>Source <span className="text-muted font-medium">optional</span></span>
        <input className={inputClass} maxLength={100} value={sourceLocation} onChange={(event) => setSourceLocation(event.target.value)} placeholder="Page 42 or Chapter 3" />
      </label>
      {error === null ? null : <p className="text-rust text-[0.8rem] font-bold m-0" role="alert">{error}</p>}
      <button className={primaryButtonClass} disabled={isSaving}>
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

  const inputClass = "w-full border border-line rounded-lg text-ink bg-surface-strong px-4 py-3 text-[0.95rem] font-medium leading-relaxed focus-ring placeholder:text-muted/50";
  const labelClass = "grid gap-2 text-ink/80 text-[0.78rem] font-extrabold tracking-wide";
  const primaryButtonClass = "inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold cursor-pointer text-paper bg-forest disabled:opacity-60 disabled:cursor-wait focus-ring";
  const quietButtonClass = "inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold cursor-pointer border border-line text-ink bg-transparent focus-ring";

  if (isEditing) {
    return (
      <form className="grid gap-4 p-6 border border-line rounded-2xl bg-surface" onSubmit={handleUpdate}>
        <label className={labelClass}>
          Heading
          <input className={inputClass} maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className={labelClass}>
          {kind === "quote" ? "Quote" : "Note"}
          <textarea className={inputClass} required maxLength={100000} rows={7} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <EntryKindSwitch kind={kind} onChange={setKind} />
        <label className={labelClass}>
          Source
          <input className={inputClass} maxLength={100} value={sourceLocation} onChange={(event) => setSourceLocation(event.target.value)} />
        </label>
        {error === null ? null : <p className="text-rust text-[0.8rem] font-bold m-0" role="alert">{error}</p>}
        <div className="flex flex-wrap gap-2.5">
          <button className={primaryButtonClass} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </button>
          <button className={quietButtonClass} type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  const baseCardClass = "grid gap-4 py-6 border-t border-line first:border-t-0";
  const quoteCardClass = "grid gap-4 p-6 border border-accent-border rounded-2xl bg-accent-soft mt-4 first:mt-0";

  return (
    <article className={note.kind === 'quote' ? quoteCardClass : baseCardClass}>
      <div className="flex justify-between gap-4 text-muted text-[0.73rem] font-bold uppercase tracking-[0.07em]">
        <time dateTime={note.updated_at}>{formatDate(note.updated_at)}</time>
        <span>{note.source_location ?? ""}</span>
      </div>
      {note.title === null ? null : <h3 className="m-0 font-serif text-[1.55rem] font-medium">{note.title}</h3>}
      {note.kind === "quote" ? (
        <blockquote className="m-0 pl-[1.15rem] border-l-[3px] border-quote-border text-quote-ink font-serif text-[1.15rem] italic leading-[1.65] break-words whitespace-pre-wrap">{note.body}</blockquote>
      ) : (
        <p className="m-0 text-ink leading-relaxed break-words whitespace-pre-wrap">{note.body}</p>
      )}
      {error === null ? null : <p className="text-rust text-[0.8rem] font-bold m-0" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <button className="min-h-0 px-3 py-1.5 text-[0.7rem] inline-flex items-center justify-center rounded-full font-extrabold cursor-pointer border border-line text-ink bg-transparent focus-ring hover:bg-surface" type="button" onClick={() => setIsEditing(true)}>Edit</button>
        <button className="min-h-0 px-3 py-1.5 text-[0.7rem] inline-flex items-center justify-center rounded-full font-extrabold cursor-pointer border border-line text-ink bg-transparent focus-ring hover:bg-surface" type="button" onClick={() => void handleDelete()}>Delete</button>
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
  const baseOptionClass = "border-0 rounded-full px-[0.9rem] py-[0.4rem] bg-transparent text-muted text-[0.72rem] font-extrabold cursor-pointer focus-ring";
  const selectedOptionClass = "text-ink bg-surface shadow-[0_0.1rem_0.25rem_var(--shadow-color)]";

  return (
    <div className="inline-flex w-fit p-[0.2rem] border border-line rounded-full bg-surface-strong" role="group" aria-label="Entry type">
      <button
        className={`${baseOptionClass} ${kind === 'note' ? selectedOptionClass : ''}`}
        type="button"
        aria-pressed={kind === "note"}
        onClick={() => onChange("note")}
      >
        Note
      </button>
      <button
        className={`${baseOptionClass} ${kind === 'quote' ? selectedOptionClass : ''}`}
        type="button"
        aria-pressed={kind === "quote"}
        onClick={() => onChange("quote")}
      >
        Quote
      </button>
    </div>
  );
}
