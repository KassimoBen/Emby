from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.media import Media, MediaType
from models.user import User
from schemas.media import MediaOut
from services.auth import get_current_user, require_role
from services.nfo_generator import write_nfo
from typing import Optional

router = APIRouter(prefix="/api/media", tags=["media"])


@router.get("/", response_model=list[MediaOut])
def list_media(
    media_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    genre: Optional[str] = Query(None),
    sort: str = Query("title"),
    page: int = Query(1, ge=1),
    per_page: int = Query(48, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Media)
    if media_type:
        q = q.filter(Media.media_type == MediaType(media_type))
    if search:
        q = q.filter(Media.title.ilike(f"%{search}%"))
    if genre:
        q = q.filter(Media.genres.ilike(f"%{genre}%"))
    if sort == "year":
        q = q.order_by(Media.year.desc().nullslast())
    elif sort == "rating":
        q = q.order_by(Media.rating.desc().nullslast())
    elif sort == "recent":
        q = q.order_by(Media.created_at.desc())
    else:
        q = q.order_by(Media.title.asc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return items


@router.get("/types")
def get_types(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    types = db.query(Media.media_type).distinct().all()
    return [t[0].value for t in types]


@router.get("/genres")
def get_genres(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    results = db.query(Media.genres).filter(Media.genres.isnot(None)).all()
    genre_set = set()
    for (g,) in results:
        for genre in g.split(", "):
            if genre.strip():
                genre_set.add(genre.strip())
    return sorted(genre_set)


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    total = db.query(Media).count()
    movies = db.query(Media).filter(Media.media_type == MediaType.MOVIE).count()
    tv = db.query(Media).filter(Media.media_type == MediaType.TV).count()
    music = db.query(Media).filter(Media.media_type == MediaType.MUSIC).count()
    return {"total": total, "movies": movies, "tv": tv, "music": music}


@router.get("/{media_id}", response_model=MediaOut)
def get_media(media_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media


@router.post("/{media_id}/nfo")
def generate_nfo(media_id: int, db: Session = Depends(get_db), user: User = Depends(require_role("admin"))):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    nfo_path = write_nfo(media)
    media.nfo_path = nfo_path
    db.commit()
    return {"message": "NFO generated", "path": nfo_path}
