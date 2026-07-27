from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Response returned by the API health endpoint."""

    status: Literal["ok"]
    service: str


class ReadinessResponse(BaseModel):
    """Response returned when required infrastructure is available."""

    status: Literal["ready"]
    database: Literal["connected"]
