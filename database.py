import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

class Base(DeclarativeBase):
    pass

DATABASE_TYPE = os.environ.get("DATABASE_TYPE", "mysql")

if DATABASE_TYPE == "sqlite":
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "familyhub.db")
    DATABASE_URL = "sqlite:///" + db_path
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    try:
        from urllib.parse import quote_plus
        DB_USER = "root"
        DB_PASSWORD = "Al@040404"
        DB_HOST = "localhost"
        DB_NAME = "familyhub"
        safe_password = quote_plus(DB_PASSWORD)
        DATABASE_URL = "mysql+pymysql://{}:{}@{}/{}".format(DB_USER, safe_password, DB_HOST, DB_NAME)
        engine = create_engine(DATABASE_URL)
    except Exception:
        print("MySQL not found, switching to SQLite")
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "familyhub.db")
        DATABASE_URL = "sqlite:///" + db_path
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine, autoflush=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    import models
    Base.metadata.create_all(bind=engine)