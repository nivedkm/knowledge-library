from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.dependencies import DatabaseSession
from app.schemas.health import ReadinessResponse

router = APIRouter(tags=["health"])


@router.get("/readiness", response_model=ReadinessResponse)
def readiness_check(session: DatabaseSession) -> ReadinessResponse:
    """Report whether the API can communicate with PostgreSQL."""
    try:
        session.execute(text("SELECT 1"))
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is unavailable.",
        ) from error

    return ReadinessResponse(status="ready", database="connected")
