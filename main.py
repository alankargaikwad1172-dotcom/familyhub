"""
main.py
Run: python main.py
Open: http://localhost:8000
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os

from database import create_tables, SessionLocal
from auth import DEFAULT_CATEGORIES
from models import ExpenseCategory

from routes.auth_routes import router as auth_router
from routes.families import router as families_router
from routes.expenses import router as expenses_router
from routes.shopping import router as shopping_router
from routes.tasks import router as tasks_router
from routes.medicines import router as medicines_router
from routes.goals import router as goals_router
from routes.dashboard import router as dashboard_router
from routes.images import router as images_router
from routes.reminders import router as reminders_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("")
    print("=" * 50)
    print("  FamilyHub AI Starting...")
    print("=" * 50)
    try:
        create_tables()
        print("  [OK] MySQL tables created")
    except Exception as e:
        print("  [ERROR] Cannot connect to MySQL!")
        print("  Error: " + str(e))
        raise
    seed_default_data()
    os.makedirs(os.path.join("static", "uploads"), exist_ok=True)
    print("  [OK] Upload folder ready")
    print("  [OK] Default data loaded")
    print("")
    print("  OPEN YOUR BROWSER AND GO TO:")
    print("  http://localhost:8000")
    print("")
    print("  Press Ctrl+C to stop")
    print("=" * 50)
    print("")
    yield
    print("Server stopped.")


def seed_default_data():
    db = SessionLocal()
    try:
        if db.query(ExpenseCategory).count() == 0:
            for cat in DEFAULT_CATEGORIES:
                db.add(ExpenseCategory(**cat))
            db.commit()
    finally:
        db.close()


app = FastAPI(title="FamilyHub AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_router, prefix="/api")
app.include_router(families_router, prefix="/api")
app.include_router(expenses_router, prefix="/api")
app.include_router(shopping_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(medicines_router, prefix="/api")
app.include_router(goals_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(images_router, prefix="/api")
app.include_router(reminders_router, prefix="/api")


@app.get("/")
async def serve_homepage():
    return FileResponse("static/index.html")


@app.get("/sw.js")
async def serve_service_worker():
    return FileResponse("static/sw.js", media_type="application/javascript")


@app.get("/health")
async def health_check():
    return {"status": "ok", "app": "FamilyHub AI"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)