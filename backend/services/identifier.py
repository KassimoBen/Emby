import re
from typing import Tuple, Optional
import httpx
from config import LLM_API_URL, LLM_API_KEY, LLM_MODEL

PATTERNS = [
    re.compile(r"(.+?)[.\s_-]*[\(\[]?(\d{4})[\)\]]?", re.IGNORECASE),
    re.compile(r"(.+?)\s*S\d{1,2}E\d{1,2}", re.IGNORECASE),
    re.compile(r"(.+?)\s*[.](?:20|19)\d{2}", re.IGNORECASE),
]


def identify_with_regex(filename: str) -> Optional[Tuple[str, Optional[int]]]:
    name = filename.rsplit(".", 1)[0]
    name = name.replace("_", " ").replace(".", " ").strip()
    for pattern in PATTERNS:
        m = pattern.search(name)
        if m:
            title = m.group(1).strip().replace(".", " ").replace("_", " ").strip()
            year = int(m.group(2)) if len(m.groups()) > 1 and m.group(2) else None
            return title, year
    return None


def identify_with_llm(filename: str) -> Tuple[str, Optional[int]]:
    if not LLM_API_URL:
        return (filename.rsplit(".", 1)[0].replace("_", " ").replace(".", " ").strip(), None)
    try:
        prompt = (
            f"Extract the movie/TV show title and year from this filename: '{filename}'. "
            f"Return ONLY a JSON object with keys 'title' (string) and 'year' (int or null). "
            f"No other text."
        )
        resp = httpx.post(
            LLM_API_URL,
            headers={"Authorization": f"Bearer {LLM_API_KEY}"},
            json={"model": LLM_MODEL, "messages": [{"role": "user", "content": prompt}], "temperature": 0},
            timeout=15,
        )
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        import json
        result = json.loads(content)
        return (result.get("title", filename), result.get("year"))
    except Exception:
        return (filename.rsplit(".", 1)[0].replace("_", " ").replace(".", " ").strip(), None)


def identify_file(filename: str) -> Tuple[str, Optional[int]]:
    result = identify_with_regex(filename)
    if result:
        return result
    return identify_with_llm(filename)
