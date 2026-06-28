from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.media import MediaType


class MediaOut(BaseModel):
    id: int
    title: str
    original_title: Optional[str] = None
    year: Optional[int] = None
    media_type: MediaType
    file_path: str
    file_size: int
    file_extension: str
    duration: Optional[int] = None
    resolution: Optional[str] = None
    codec: Optional[str] = None
    description: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    rating: Optional[float] = None
    genres: Optional[str] = None
    cast_str: Optional[str] = None
    director: Optional[str] = None
    tmdb_id: Optional[int] = None
    trailer_url: Optional[str] = None
    musicbrainz_id: Optional[str] = None
    nfo_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ScanCreate(BaseModel):
    path: str


class ScanStatusOut(BaseModel):
    id: int
    scan_path: str
    files_found: int
    files_identified: int
    files_scraped: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "viewer"


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


class ConfigOut(BaseModel):
    media_dir: str
    tmdb_api_key: str


class ConfigUpdate(BaseModel):
    media_dir: Optional[str] = None
    tmdb_api_key: Optional[str] = None
