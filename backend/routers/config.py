from fastapi import APIRouter, Depends
from models.user import User
from schemas.media import ConfigOut
from services.auth import require_role
from config import MEDIA_DIR, TMDB_API_KEY

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("/", response_model=ConfigOut)
def get_config(user: User = Depends(require_role("admin"))):
    return ConfigOut(media_dir=MEDIA_DIR, tmdb_api_key=TMDB_API_KEY[:8] + "..." if TMDB_API_KEY else "")
