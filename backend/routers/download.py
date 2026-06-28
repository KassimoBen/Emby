import os
import mimetypes
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models.media import Media
from models.user import User
from services.auth import get_current_user_optional, get_user_from_token

router = APIRouter(prefix="/api/download", tags=["download"])

STREAM_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v", ".mp3", ".flac", ".wav", ".aac", ".ogg", ".wma", ".m4a", ".opus"}
STREAM_CHUNK_SIZE = 1024 * 1024


@router.get("/{media_id}")
def download_media(
    media_id: int,
    request: Request,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    if not user:
        user = get_user_from_token(token, db) if token else None
    if not user or user.role not in ("admin", "downloader", "viewer"):
        raise HTTPException(status_code=403, detail="Download not allowed for your role")

    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    file_path = media.file_path
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    file_size = os.path.getsize(file_path)
    ext = os.path.splitext(file_path)[1].lower()
    content_type, _ = mimetypes.guess_type(file_path)
    if not content_type:
        content_type = "application/octet-stream"

    is_streamable = ext in STREAM_EXTENSIONS
    filename = os.path.basename(file_path)
    disposition = "inline" if is_streamable else f'attachment; filename="{filename}"'
    range_header = request.headers.get("range")

    if range_header and is_streamable:
        start, end = 0, file_size - 1
        range_match = range_header.replace("bytes=", "").split("-")
        start = int(range_match[0]) if range_match[0] else 0
        end = int(range_match[1]) if len(range_match) > 1 and range_match[1] else file_size - 1

        if start >= file_size:
            raise HTTPException(status_code=416, detail="Range not satisfiable")

        content_length = end - start + 1

        def iter_range():
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = content_length
                while remaining > 0:
                    chunk_size = min(STREAM_CHUNK_SIZE, remaining)
                    data = f.read(chunk_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        return StreamingResponse(
            iter_range(),
            status_code=206,
            media_type=content_type,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Content-Length": str(content_length),
                "Content-Disposition": disposition,
                "Accept-Ranges": "bytes",
            },
        )

    def iterfile():
        with open(file_path, "rb") as f:
            while chunk := f.read(STREAM_CHUNK_SIZE):
                yield chunk

    return StreamingResponse(
        iterfile(),
        media_type=content_type,
        headers={
            "Content-Disposition": disposition,
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes",
        },
    )
