from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
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
from routes.notifications import router as notifications_router

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
        print("  [ERROR] " + str(e))
        raise
    db = SessionLocal()
    try:
        if db.query(ExpenseCategory).count() == 0:
            for cat in DEFAULT_CATEGORIES:
                db.add(ExpenseCategory(**cat))
            db.commit()
    finally:
        db.close()
    os.makedirs(os.path.join("static", "uploads"), exist_ok=True)
    print("  [OK] Upload folder ready")
    print("  [OK] Default data loaded")
    print("  OPEN YOUR BROWSER AND GO TO:")
    print("  http://localhost:8000")
    print("  Press Ctrl+C to stop")
    print("=" * 50)
    yield

app = FastAPI(title="FamilyHub AI", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Include all routers FIRST (before static mount catches everything)
app.include_router(auth_router, prefix="/api")
app.include_router(families_router, prefix="/api")
app.include_router(expenses_router, prefix="/api")
app.include_router(shopping_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(medicines_router, prefix="/api")
app.include_router(goals_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(images_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve homepage
@app.get("/")
async def serve_homepage():
    return FileResponse("static/index.html")

# Serve manifest at root for PWA Builder
@app.get("/manifest.json")
async def serve_manifest():
    return FileResponse("static/manifest.json", media_type="application/json")

# Serve service worker at root
@app.get("/sw.js")
async def serve_sw():
    return FileResponse("static/sw.js", media_type="application/javascript")

# Serve icons at root
@app.get("/icon-192.png")
async def serve_icon_192():
    return FileResponse("static/icon-192.png", media_type="image/png")

@app.get("/icon-512.png")
async def serve_icon_512():
    return FileResponse("static/icon-512.png", media_type="image/png")

# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)