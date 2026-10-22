from __future__ import annotations

from io import BytesIO
from typing import Any

from PIL import Image


def recipe_body(**overrides: Any) -> dict[str, Any]:
    body = {
        "name": "Lentil soup",
        "prep_minutes": 40,
        "tags": ["budget", "prep"],
        "ingredients": [
            {"name": "red lentils", "qty": 300, "unit": "g", "aisle": "pantry"},
            {"name": "carrots", "qty": 3, "unit": "pcs", "aisle": "veg"},
        ],
        "method": "Fry the onion, add lentils and water, simmer 30 minutes.",
    }
    body.update(overrides)
    return body


def image_bytes(fmt: str = "PNG", size=(40, 30), color=(200, 80, 40), exif: bytes | None = None) -> bytes:
    img = Image.new("RGB", size, color)
    out = BytesIO()
    kwargs = {"exif": exif} if exif else {}
    img.save(out, format=fmt, **kwargs)
    return out.getvalue()
