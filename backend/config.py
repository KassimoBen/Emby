import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./embydb.sqlite")
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
MUSICBRAINZ_USER_AGENT = os.getenv("MUSICBRAINZ_USER_AGENT", "EmbyServer/1.0")
MEDIA_DIR = os.getenv("MEDIA_DIR", "")
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
LLM_API_URL = os.getenv("LLM_API_URL", "")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
POSTER_DIR = os.getenv("POSTER_DIR", "./posters")
os.makedirs(POSTER_DIR, exist_ok=True)
