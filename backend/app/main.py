from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from contextlib import asynccontextmanager
import asyncio
from app.application.search.embeddings import SentenceTransformerEmbeddingService
from app.api.router import api_router
from app.application.errors import ResourceNotFoundError
from app.config.settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.embedding_service = SentenceTransformerEmbeddingService()
    # Start loading in the background to prevent slow startup
    asyncio.create_task(asyncio.to_thread(app.state.embedding_service._load_model))
    yield

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    application = FastAPI(
        title=settings.api_title,
        version="0.1.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(api_router, prefix="/api/v1")

    static_dir = Path(__file__).resolve().parent / "static"

    if static_dir.is_dir():

        @application.get("/{requested_path:path}", include_in_schema=False)
        async def serve_frontend(requested_path: str) -> FileResponse:
            if requested_path.startswith("api/"):
                raise HTTPException(status_code=404)

            requested_file = static_dir / requested_path
            if requested_file.is_file():
                return FileResponse(requested_file)

            return FileResponse(static_dir / "index.html")

    @application.exception_handler(ResourceNotFoundError)
    async def handle_not_found(
        _request: Request,
        error: ResourceNotFoundError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(error)},
        )

    return application


app = create_app()
