import httpx2
import pytest

from app.main import app


@pytest.fixture
def anyio_backend() -> str:
    """Run asynchronous tests with Python's built-in asyncio backend."""
    return "asyncio"


@pytest.mark.anyio
async def test_health_check_reports_api_is_ready() -> None:
    transport = httpx2.ASGITransport(app=app)
    async with httpx2.AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "wisdom-api",
    }
