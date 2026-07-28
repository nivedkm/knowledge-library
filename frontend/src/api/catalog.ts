import { apiRequest } from "./client";

export interface Book {
  id: string;
  title: string;
  author: string;
  created_at: string;
  updated_at: string;
  note_count: number;
  last_activity_at: string;
}

export interface Note {
  id: string;
  book_id: string;
  title: string | null;
  body: string;
  source_location: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookInput {
  title: string;
  author: string;
}

export interface NoteInput {
  title?: string | null;
  body: string;
  source_location?: string | null;
}

export type NoteUpdate = Partial<NoteInput>;

export function listBooks(signal?: AbortSignal): Promise<Book[]> {
  return apiRequest<Book[]>("/books?limit=100&offset=0", { signal });
}

export function getBook(bookId: string, signal?: AbortSignal): Promise<Book> {
  return apiRequest<Book>(`/books/${bookId}`, { signal });
}

export function createBook(input: BookInput): Promise<Book> {
  return apiRequest<Book>("/books", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateBook(bookId: string, input: BookInput): Promise<Book> {
  return apiRequest<Book>(`/books/${bookId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteBook(bookId: string): Promise<void> {
  return apiRequest<void>(`/books/${bookId}`, { method: "DELETE" });
}

export function listNotes(
  bookId: string,
  signal?: AbortSignal,
): Promise<Note[]> {
  return apiRequest<Note[]>(`/books/${bookId}/notes?limit=100&offset=0`, {
    signal,
  });
}

export function createNote(bookId: string, input: NoteInput): Promise<Note> {
  return apiRequest<Note>(`/books/${bookId}/notes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateNote(noteId: string, input: NoteUpdate): Promise<Note> {
  return apiRequest<Note>(`/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteNote(noteId: string): Promise<void> {
  return apiRequest<void>(`/notes/${noteId}`, { method: "DELETE" });
}

