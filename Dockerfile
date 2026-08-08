FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM python:3.12-slim AS backend-build

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app/backend

RUN pip install --no-cache-dir uv

COPY backend/ ./
# Copy root README.md because pyproject.toml references it as ../README.md
COPY README.md /app/README.md
RUN uv sync --frozen --no-dev

# Pre-download the HuggingFace AI model into the Docker image
ENV HF_HOME=/app/backend/.cache/huggingface
RUN uv run python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')" && \
    chmod -R 777 /app/backend/.cache

COPY --from=frontend-build /app/frontend/dist ./app/static

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]