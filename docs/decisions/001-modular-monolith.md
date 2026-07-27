# ADR 001: Use a modular monolith

- Status: accepted
- Date: 2026-07-27

## Context

WisdomAI needs a web API, relational persistence, vector retrieval, embedding
inference, and local language-model inference. These responsibilities need clear
boundaries, but the application is operated by one person on one computer.

## Decision

The FastAPI backend will be a modular monolith. Its modules will separate API,
application, domain, and infrastructure concerns as those concerns are added.
PostgreSQL will store relational data, vectors, and full-text-search data.

The local language model will eventually run as a separate `llama.cpp` process
because it has a distinct runtime and resource profile.

## Consequences

- Local setup and debugging remain understandable.
- Database transactions can cover related application changes.
- We avoid network and deployment complexity between internal modules.
- Clear module boundaries leave room to extract a service later if measurements
  reveal a real need.

