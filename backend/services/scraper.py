import os
import httpx
from sqlalchemy.orm import Session
from models.media import Media, MediaType
from config import TMDB_API_KEY, MUSICBRAINZ_USER_AGENT, POSTER_DIR
from services.nfo_generator import write_nfo


def download_poster(url: str, media_id: int) -> str:
    if not url:
        return ""
    ext = os.path.splitext(url.split("?")[0])[1] or ".jpg"
    filename = f"{media_id}{ext}"
    local_path = os.path.join(POSTER_DIR, filename)
    try:
        r = httpx.get(url, timeout=15)
        r.raise_for_status()
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(r.content)
        return filename
    except Exception:
        return ""


def scrape_tmdb(media: Media, db: Session):
    if not TMDB_API_KEY:
        return

    if media.media_type == MediaType.MOVIE:
        url = "https://api.themoviedb.org/3/search/movie"
    elif media.media_type == MediaType.TV:
        url = "https://api.themoviedb.org/3/search/tv"
    else:
        return

    params = {
        "api_key": TMDB_API_KEY,
        "query": media.title,
        "language": "fr-FR",
    }
    if media.year:
        params["year"] = media.year

    try:
        resp = httpx.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        if not data.get("results"):
            return
        result = data["results"][0]

        media.title = result.get("title") or result.get("name") or media.title
        media.original_title = result.get("original_title") or result.get("original_name")
        media.description = result.get("overview")
        media.rating = result.get("vote_average")
        media.tmdb_id = result.get("id")

        release_date = result.get("release_date") or result.get("first_air_date")
        if release_date and not media.year:
            media.year = int(release_date[:4])

        genres_list = result.get("genre_ids", [])
        if genres_list:
            genre_map = {28: "Action", 12: "Aventure", 16: "Animation", 35: "Comédie",
                         80: "Crime", 99: "Documentaire", 18: "Drame", 10751: "Familial",
                         14: "Fantastique", 36: "Histoire", 27: "Horreur", 10402: "Musique",
                         9648: "Mystère", 10749: "Romance", 878: "Science-Fiction",
                         10770: "Téléfilm", 53: "Thriller", 10752: "Guerre", 37: "Western"}
            media.genres = ", ".join(genre_map.get(g, "") for g in genres_list if g in genre_map)

        poster = result.get("poster_path")
        if poster:
            media.poster_path = download_poster(f"https://image.tmdb.org/t/p/w500{poster}", media.id)

        backdrop = result.get("backdrop_path")
        if backdrop:
            media.backdrop_path = download_poster(f"https://image.tmdb.org/t/p/w1280{backdrop}", media.id)

        tmdb_id = result.get("id")
        if tmdb_id:
            try:
                media_type_path = "movie" if media.media_type == MediaType.MOVIE else "tv"
                video_resp = httpx.get(
                    f"https://api.themoviedb.org/3/{media_type_path}/{tmdb_id}/videos",
                    params={"api_key": TMDB_API_KEY, "language": "fr-FR"},
                    timeout=10,
                )
                video_data = video_resp.json()
                for video in video_data.get("results", []):
                    if video.get("type") == "Trailer" and video.get("site") == "YouTube":
                        media.trailer_url = f"https://www.youtube.com/embed/{video['key']}"
                        break
                if not media.trailer_url:
                    for video in video_data.get("results", []):
                        if video.get("type") == "Teaser" and video.get("site") == "YouTube":
                            media.trailer_url = f"https://www.youtube.com/embed/{video['key']}"
                            break
            except Exception:
                pass

        db.commit()

        try:
            nfo_path = write_nfo(media)
            media.nfo_path = nfo_path
            db.commit()
        except Exception:
            pass
    except Exception:
        pass


def scrape_musicbrainz(media: Media, db: Session):
    try:
        url = "https://musicbrainz.org/ws/2/recording/"
        params = {
            "query": f'recording:{media.title}',
            "fmt": "json",
            "limit": 1,
        }
        headers = {"User-Agent": MUSICBRAINZ_USER_AGENT}
        resp = httpx.get(url, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        if data.get("recordings"):
            rec = data["recordings"][0]
            media.musicbrainz_id = rec.get("id")
            if not media.year and rec.get("first-release-date"):
                media.year = int(rec["first-release-date"][:4])
            db.commit()
    except Exception:
        pass


def scrape_metadata(media: Media, db: Session):
    if media.media_type in (MediaType.MOVIE, MediaType.TV):
        scrape_tmdb(media, db)
    elif media.media_type == MediaType.MUSIC:
        scrape_musicbrainz(media, db)


def rescrape_all(db: Session) -> int:
    media_list = db.query(Media).filter(
        Media.media_type.in_([MediaType.MOVIE, MediaType.TV, MediaType.MUSIC]),
    ).all()
    count = 0
    for media in media_list:
        try:
            scrape_metadata(media, db)
            count += 1
        except Exception:
            pass
    return count
