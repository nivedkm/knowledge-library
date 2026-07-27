from fastapi import APIRouter

from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Report that the API process is ready to accept requests."""
    return HealthResponse(status="ok", service="wisdom-api")
