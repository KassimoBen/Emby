from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Enum, BigInteger
from sqlalchemy.sql import func
import enum
from database import Base


class MediaType(str, enum.Enum):
    MOVIE = "movie"
    TV = "tv"
    MUSIC = "music"


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True)
    original_title = Column(String(255), nullable=True)
    year = Column(Integer, nullable=True)
    media_type = Column(Enum(MediaType), index=True)
    file_path = Column(String(1024), unique=True, index=True)
    file_size = Column(BigInteger, default=0)
    file_extension = Column(String(10))
    duration = Column(Integer, nullable=True)
    resolution = Column(String(20), nullable=True)
    codec = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    poster_path = Column(String(512), nullable=True)
    backdrop_path = Column(String(512), nullable=True)
    rating = Column(Float, nullable=True)
    genres = Column(Text, nullable=True)
    cast_str = Column(Text, nullable=True)
    director = Column(String(255), nullable=True)
    tmdb_id = Column(Integer, nullable=True)
    trailer_url = Column(String(512), nullable=True)
    musicbrainz_id = Column(String(36), nullable=True)
    nfo_path = Column(String(1024), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    scan_path = Column(String(1024))
    files_found = Column(Integer, default=0)
    files_identified = Column(Integer, default=0)
    files_scraped = Column(Integer, default=0)
    status = Column(String(20), default="running")
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
