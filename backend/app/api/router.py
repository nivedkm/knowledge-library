from fastapi import APIRouter

from app.api.routes.books import router as books_router
from app.api.routes.health import router as health_router
from app.api.routes.notes import router as notes_router
from app.api.routes.search import router as search_router
from app.api.routes.readiness import router as readiness_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(readiness_router)
api_router.include_router(books_router)
api_router.include_router(notes_router)
api_router.include_router(search_router)
