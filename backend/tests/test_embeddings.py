from app.application.search.embeddings import SentenceTransformerEmbeddingService


class FakeModel:
    def __init__(self) -> None:
        self.calls: list[tuple[list[str], dict[str, object]]] = []

    def encode(self, texts, **kwargs):
        self.calls.append((list(texts), kwargs))
        return [[0.1, 0.2, 0.3, 0.4]] * len(texts)


def test_embedding_service_uses_the_expected_model_name() -> None:
    model = FakeModel()
    service = SentenceTransformerEmbeddingService(model_loader=lambda _name: model)

    vectors = service.embed_texts(["A question for the model."])

    assert service.model_name == "sentence-transformers/all-MiniLM-L6-v2"
    assert vectors == [[0.1, 0.2, 0.3, 0.4]]
    assert model.calls[0][1]["normalize_embeddings"] is True