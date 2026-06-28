from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import engine, Base, SessionLocal
from models.user import User
from services.auth import hash_password
from routers import auth, media, scan, download, config

Base.metadata.create_all(bind=engine)

# migrate existing database: add missing columns
import sqlalchemy as sa
inspector = sa.inspect(engine)
existing_columns = {c["name"] for c in inspector.get_columns("media")}
if "trailer_url" not in existing_columns:
    with engine.connect() as conn:
        conn.execute(sa.text("ALTER TABLE media ADD COLUMN trailer_url VARCHAR(512)"))
        conn.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_default_admin()
    yield

app = FastAPI(title="Emby Server", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(media.router)
app.include_router(scan.router)
app.include_router(download.router)
app.include_router(config.router)

poster_dir = os.path.join(os.path.dirname(__file__), "posters")
os.makedirs(poster_dir, exist_ok=True)
app.mount("/posters", StaticFiles(directory=poster_dir), name="posters")

def create_default_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                hashed_password=hash_password("admin"),
                role="admin",
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Emby Server"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
