# WisdomAI - Project Study Guide

Welcome to the **WisdomAI** study guide. This document is designed to help you thoroughly understand your project so you can confidently discuss it in interviews and answer any technical questions about its architecture, implementation, and design choices.

---

## 1. Project Elevator Pitch

**What is WisdomAI?**
WisdomAI is a local-first personal knowledge retrieval application. It allows users to organize books, reading notes, and quotes, and then retrieve relevant knowledge using natural language questions. It currently employs a hybrid search mechanism (semantic + keyword) powered by local embeddings to find grounded matches from your notes.

---

## 2. Tech Stack

### Frontend
- **React (v19) & TypeScript:** Modern, typed component-based UI.
- **Vite:** Extremely fast build tool and development server.
- **Native Fetch API:** Used for making requests to the backend (no heavy third-party query libraries).
- **Vitest & Testing Library:** For component testing.

### Backend
- **Python (3.12) & FastAPI:** High-performance asynchronous web framework for building the REST API.
- **Pydantic:** Used for robust data validation and schema definitions.
- **SQLAlchemy & Alembic:** ORM for database interactions and migration management.
- **PyTorch & sentence-transformers:** Used locally (CPU mode) to generate embeddings (`all-MiniLM-L6-v2`) for semantic search.

### Database & Deployment
- **PostgreSQL with `pgvector`:** Acts as a single source of truth for both relational data (books, notes) and vector embeddings (note chunks).
- **Docker:** Uses `docker-compose` for local development (spinning up the DB) and a unified `Dockerfile` to build and serve both the frontend and backend in a single container for production.

---

## 3. Architecture & Code Structure

The backend follows a **Modular Monolith** pattern. This means it runs as a single process but enforces strict internal boundaries, making the code highly maintainable and easy to reason about.

**Key Directories:**
- `app/api/`: Handles HTTP boundaries, routing, and dependency injection.
- `app/application/`: Contains business logic, orchestrates use cases (e.g., search logic, chunking, and embedding generation), and manages transaction boundaries.
- `app/infrastructure/`: Connects to external systems (PostgreSQL). It contains SQLAlchemy models and Repositories (handling raw queries).
- `app/schemas/`: Pydantic models for API request/response validation.

**Request Lifecycle Example (Creating a Book):**
1. React frontend submits a JSON payload.
2. FastAPI (`app/api/routes/books.py`) receives it and validates it using Pydantic.
3. The Catalog Service (`app/application/catalog/service.py`) handles the business logic.
4. The Catalog Repository (`app/infrastructure/repositories/catalog.py`) executes the SQLAlchemy `INSERT` query.
5. PostgreSQL enforces data integrity constraints.
6. The response bubbles back up to React, which updates its local state.

---

## 4. Data Model & Database Design

The database is heavily normalized and relies on PostgreSQL constraints for data integrity. 

- **Books:** Contains metadata (title, author). 
  - *Invariant:* Deleting a book automatically cascades and deletes all its notes.
- **Notes:** Stores the actual content. Can be of kind `note` or `quote`. Belongs to a Book.
- **NoteChunks:** Since searching across huge blocks of text is inefficient and yields poor semantic results, notes are split into "chunks".
  - *Fields include:* `content`, `chunk_index`, and `embedding` (a `vector(384)` type).
  - *Why 384?* The model `all-MiniLM-L6-v2` produces 384-dimensional vectors.

---

## 5. Core Feature Deep Dive: Hybrid Search

The crown jewel of this milestone is the hybrid search functionality, implemented in `app/application/search/service.py`.

**How it works:**
1. **Backfilling:** When a search is triggered, the system first checks if any notes lack chunks. If so, it splits the text, generates embeddings locally using `sentence-transformers`, and saves them to `note_chunks`.
2. **Embedding the Query:** The user's question is converted into a 384-dimensional vector.
3. **Semantic Candidate Search:** The DB is queried using `pgvector` (cosine distance) to find chunks that are semantically similar to the question.
4. **Keyword Candidate Search:** The DB is queried using standard PostgreSQL text search to find exact matches for the question tokens.
5. **Ranking:** The `rank_search_candidates` function combines semantic distance and keyword rank into a single `score`, grouping chunks back into their parent Notes/Books so the UI can display a clean, non-repetitive list of matched excerpts.

---

## 6. Common Interview Questions & Answers

**Q1: Why did you choose PostgreSQL with `pgvector` instead of a dedicated Vector DB like Pinecone or Milvus?**
*Answer:* Using `pgvector` keeps the architecture significantly simpler by maintaining a single source of truth. We avoid the "dual-write" problem (keeping relational data synced with a separate vector database). Since WisdomAI is a local-first application meant for personal libraries, Postgres easily scales to handle the data volume while preserving ACID compliance across books, notes, and embeddings.

**Q2: How do you handle database transactions in the backend?**
*Answer:* We handle transaction boundaries in the Application Layer. Repositories only use `.flush()` to push SQL statements to the DB without committing. This ensures that complex business operations (like updating a note and regenerating its chunks) remain all-or-nothing (atomic). The actual `.commit()` happens automatically at the end of the FastAPI request lifecycle if no errors occurred (managed via the `DatabaseSession` dependency).

**Q3: How does the application perform semantic search?**
*Answer:* When a note is saved, it is split into chunks, and we use a local, CPU-optimized model (`all-MiniLM-L6-v2` via `sentence-transformers`) to generate a 384-dimensional embedding for each chunk. When a user asks a question, we embed the question using the same model and query the `note_chunks` table using `pgvector`'s distance operators. We combine these semantic results with traditional keyword matches to provide a highly relevant "hybrid" ranking.

**Q4: How did you structure the React frontend? Are you using Redux?**
*Answer:* The frontend is kept intentionally lightweight. We rely on standard React `useState` and `useEffect` hooks for local state, alongside native `fetch` wrappers for API calls. For this scale, Redux or complex global state management wasn't necessary and would introduce boilerplate. We encapsulated API calls in specific service files (e.g., `api/catalog.ts`) to keep components clean.

**Q5: How do you ensure the integrity of the data?**
*Answer:* I relied heavily on database constraints rather than just application-level validation. For example, foreign keys with `ON DELETE CASCADE` ensure no orphaned notes exist if a book is deleted. We enforce NOT NULL constraints and unique constraints where applicable. The database is the final guardian of data integrity.

---
**Summary for your Resume:**
> "Engineered a local-first knowledge retrieval application using FastAPI, React, and PostgreSQL. Designed a modular monolith backend architecture with strict boundaries. Implemented a hybrid semantic and keyword search engine utilizing local CPU-based embedding models (`sentence-transformers`) and `pgvector`, ensuring data consistency and robust knowledge retrieval."
