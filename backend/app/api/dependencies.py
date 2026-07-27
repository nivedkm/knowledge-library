from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.infrastructure.database.session import get_database_session

DatabaseSession = Annotated[Session, Depends(get_database_session)]
