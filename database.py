"""
database.py
Connects Python to MySQL.
Your password Al@040404 is used here.
The @ symbol in the password is encoded so MySQL can read it.
"""

from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DB_USER = "root"
DB_PASSWORD = "Al@040404"
DB_HOST = "localhost"
DB_NAME = "familyhub"

# We encode the password because it has @ which is special in URLs
safe_password = quote_plus(DB_PASSWORD)
DATABASE_URL = "mysql+pymysql://{}:{}@{}/{}".format(
    DB_USER, safe_password, DB_HOST, DB_NAME
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    """Every database table inherits from this class."""
    pass


def get_db():
    """Gives each web request its own database connection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Creates all tables in MySQL if they do not exist."""
    import models  # This import tells SQLAlchemy about our tables
    Base.metadata.create_all(bind=engine)