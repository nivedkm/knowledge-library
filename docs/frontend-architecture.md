# Milestone 5: frontend architecture

## Page structure

```text
App
└── AppLayout
    ├── /                  → BooksPage
    └── /books/{book_id}  → BookDetailPage
```

`BooksPage` owns the list of books and the create-book form.
`BookDetailPage` owns one book, its notes, and their editing forms.

## State categories

The interface has two kinds of state:

- **Server state**: books and notes loaded from FastAPI.
- **UI state**: form text, editing mode, loading flags, and displayed errors.

PostgreSQL remains the source of truth. After a mutation succeeds, the page
reloads the affected server data instead of trying to maintain a second complex
client-side cache.

This costs a small local HTTP request but greatly reduces synchronization bugs.

## Typed API client

Components do not construct API URLs or parse HTTP errors. The `api/` directory
contains:

- TypeScript representations of book and note responses.
- Functions for each backend operation.
- Shared JSON headers and error handling.

```text
Component → catalog API function → shared request function → FastAPI
```

## Navigation

The app currently has only two route shapes, so it uses the browser History API
through a small local navigation module. This provides bookmarkable URLs and
back-button support without adding a routing framework.

A routing library can be introduced when nested routes, route-level data
loading, or more complex transitions justify it.

## User feedback

Every server interaction has an explicit state:

```text
idle → loading/saving → success
                 └────→ visible error → retry
```

Destructive actions require confirmation. Empty libraries and empty note lists
have dedicated guidance rather than appearing broken.

## Responsive design

Large screens use:

- A book-card grid.
- A side-by-side note composer and note list.

Smaller screens collapse both layouts to one column. Form controls and actions
remain keyboard accessible, and focus indicators are visible.

