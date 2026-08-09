from __future__ import annotations

import threading
from importlib import import_module
from typing import Any, Callable, Protocol, Sequence

DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


class EmbeddingService(Protocol):
    model_name: str

    def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        """Turn each text into a dense vector."""


class SentenceTransformerEmbeddingService:
    """Embed text locally with sentence-transformers."""

    def __init__(
        self,
        model_name: str = DEFAULT_EMBEDDING_MODEL,
        model_loader: Callable[[str], Any] | None = None,
    ) -> None:
        self.model_name = model_name
        self._model_loader = model_loader
        self._model: Any | None = None
        self._lock = threading.Lock()

    def _load_model(self) -> Any:
        if self._model is not None:
            return self._model

        with self._lock:
            if self._model is not None:
                return self._model

            if self._model_loader is not None:
                self._model = self._model_loader(self.model_name)
                return self._model

            module = import_module("sentence_transformers")
            self._model = module.SentenceTransformer(self.model_name)
            return self._model

    def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        prepared_texts = list(texts)
        if not prepared_texts:
            return []

        model = self._load_model()
        embeddings = model.encode(
            prepared_texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        if hasattr(embeddings, "tolist"):
            return embeddings.tolist()

        return [[float(value) for value in embedding] for embedding in embeddings]