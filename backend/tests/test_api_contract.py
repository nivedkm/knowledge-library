from app.main import app


def test_openapi_exposes_catalog_operations() -> None:
    paths = app.openapi()["paths"]

    expected_operations = {
        "/api/v1/books": {"get", "post"},
        "/api/v1/books/{book_id}": {"get", "patch", "delete"},
        "/api/v1/books/{book_id}/notes": {"get", "post"},
        "/api/v1/notes/{note_id}": {"get", "patch", "delete"},
    }

    for path, methods in expected_operations.items():
        assert methods <= paths[path].keys()
