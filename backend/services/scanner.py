import os
import re
import subprocess
from datetime import datetime, timezone
from typing import Tuple
from sqlalchemy.orm import Session
from models.media import Media, MediaType, ScanHistory
from services.identifier import identify_file
from services.scraper import scrape_metadata

VIDEO_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v", ".ts", ".mts"}
AUDIO_EXTENSIONS = {".mp3", ".flac", ".wav", ".aac", ".ogg", ".wma", ".m4a", ".opus", ".alac"}


TV_SHOW_PATTERN = re.compile(r"S\d{1,2}E\d{1,2}", re.IGNORECASE)


def classify_file(filename: str) -> MediaType:
    ext = os.path.splitext(filename)[1].lower()
    if ext in VIDEO_EXTENSIONS:
        if TV_SHOW_PATTERN.search(filename):
            return MediaType.TV
        return MediaType.MOVIE
    elif ext in AUDIO_EXTENSIONS:
        return MediaType.MUSIC
    return MediaType.MOVIE


def get_ffmpeg_path() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def extract_file_metadata(file_path: str) -> dict:
    meta = {"duration": None, "resolution": None, "codec": None}
    ffmpeg = get_ffmpeg_path()
    try:
        result = subprocess.run(
            [ffmpeg, "-i", file_path, "-f", "null", "-"],
            capture_output=True, text=True, stderr=subprocess.PIPE,
            timeout=30,
        )
        output = result.stderr

        m = re.search(r"Duration: (\d+):(\d+):(\d+)\.\d+", output)
        if m:
            h, min, s = int(m.group(1)), int(m.group(2)), int(m.group(3))
            meta["duration"] = h * 3600 + min * 60 + s

        m = re.search(r"Stream #0:\d+.*Video:\s*(\w+)", output)
        if m:
            meta["codec"] = m.group(1)

        m = re.search(r"(\d+)x(\d+)[,\s]", output)
        if m:
            meta["resolution"] = f"{m.group(1)}x{m.group(2)}"

        if not meta["codec"]:
            m = re.search(r"Stream #0:\d+.*Audio:\s*(\w+)", output)
            if m:
                meta["codec"] = m.group(1)
    except Exception:
        pass
    return meta


def scan_directory(path: str, db: Session) -> Tuple[int, int, int]:
    if not os.path.isdir(path):
        raise FileNotFoundError(f"Directory not found: {path}")

    scan = ScanHistory(scan_path=path, status="running")
    db.add(scan)
    db.commit()

    files_found = 0
    files_identified = 0
    files_scraped = 0

    try:
        for root, dirs, files in os.walk(path):
            for filename in files:
                ext = os.path.splitext(filename)[1].lower()
                if ext not in VIDEO_EXTENSIONS and ext not in AUDIO_EXTENSIONS:
                    continue

                files_found += 1
                file_path = os.path.join(root, filename)
                file_size = os.path.getsize(file_path)

                existing = db.query(Media).filter(Media.file_path == file_path).first()
                if existing:
                    continue

                title, year = identify_file(filename)

                media_type = classify_file(filename)
                media = Media(
                    title=title,
                    year=year,
                    media_type=media_type,
                    file_path=file_path,
                    file_size=file_size,
                    file_extension=ext.lstrip("."),
                )
                db.add(media)
                db.flush()
                files_identified += 1

                file_meta = extract_file_metadata(file_path)
                if file_meta["duration"]:
                    media.duration = file_meta["duration"]
                if file_meta["resolution"]:
                    media.resolution = file_meta["resolution"]
                if file_meta["codec"]:
                    media.codec = file_meta["codec"]

                try:
                    scrape_metadata(media, db)
                    files_scraped += 1
                except Exception:
                    pass

                db.commit()

        scan.status = "completed"
        scan.files_found = files_found
        scan.files_identified = files_identified
        scan.files_scraped = files_scraped
        scan.completed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as e:
        scan.status = "error"
        scan.error_message = str(e)
        db.commit()
        raise

    return files_found, files_identified, files_scraped
