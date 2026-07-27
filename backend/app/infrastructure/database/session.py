from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config.settings import get_settings

settings = get_settings()

# The engine owns the database connection pool. It does not represent one
# individual connection.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)

# Each web request receives its own short-lived Session from this factory.
SessionFactory = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


def get_database_session() -> Generator[Session]:
    """Provide one SQLAlchemy session and always return its connection."""
    with SessionFactory() as session:
        yield session
