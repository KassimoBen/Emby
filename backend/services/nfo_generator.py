import os
import xml.etree.ElementTree as ET
from xml.dom import minidom
from models.media import Media


def generate_nfo(media: Media) -> str:
    root = ET.Element("movie" if media.media_type.value == "movie" else "episodedetails")

    def add_text(tag, value):
        if value:
            ET.SubElement(root, tag).text = str(value)

    add_text("title", media.title)
    add_text("originaltitle", media.original_title)
    add_text("year", media.year)
    add_text("plot", media.description)
    add_text("rating", f"{media.rating:.1f}" if media.rating else None)
    add_text("director", media.director)
    add_text("tmdbid", media.tmdb_id)

    if media.genres:
        for genre in media.genres.split(", "):
            genre_elem = ET.SubElement(root, "genre")
            genre_elem.text = genre

    if media.cast_str:
        for actor_name in media.cast_str.split(", "):
            actor = ET.SubElement(root, "actor")
            ET.SubElement(actor, "name").text = actor_name

    rough_string = ET.tostring(root, encoding="unicode")
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")


def write_nfo(media: Media) -> str:
    nfo_content = generate_nfo(media)
    nfo_path = os.path.splitext(media.file_path)[0] + ".nfo"
    with open(nfo_path, "w", encoding="utf-8") as f:
        f.write(nfo_content)
    return nfo_path
