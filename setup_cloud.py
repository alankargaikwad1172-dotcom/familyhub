import os
os.environ["DATABASE_TYPE"] = "sqlite"
print("  Cloud setup...")
from database import create_tables, SessionLocal
from models import ExpenseCategory
from auth import DEFAULT_CATEGORIES
create_tables()
db = SessionLocal()
try:
    if db.query(ExpenseCategory).count() == 0:
        for cat in DEFAULT_CATEGORIES:
            db.add(ExpenseCategory(**cat))
        db.commit()
finally:
    db.close()
print("  Done!")