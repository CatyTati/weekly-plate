"""Server-side photo checks.

The app already checks photos, but anything can be sent to an API, so the
server checks again: real image content (not just the file name), size,
and pixel count. It then removes metadata such as the GPS location the
phone stored in the photo, fixes rotation and shrinks it.
"""
from __future__ import annotations

from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError

from app.errors import InvalidPhoto

MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 40_000_000          # protects the server from "decompression bomb" files
MAX_SIDE = 1600                  # long side after resizing, in pixels
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}


def process_photo(data: bytes) -> bytes:
    """Validate an uploaded image and return a clean, resized JPEG."""
    if not data:
        raise InvalidPhoto("photo_empty", "The file is empty", field="photo")
    if len(data) > MAX_BYTES:
        raise InvalidPhoto("photo_too_large", "The photo is larger than 10 MB", field="photo",
                           params={"limit": MAX_BYTES // (1024 * 1024)})
    try:
        with Image.open(BytesIO(data)) as probe:
            fmt = probe.format
            width, height = probe.size
            probe.verify()
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, Image.DecompressionBombError):
        raise InvalidPhoto("photo_unreadable", "The file is not a readable image", field="photo") from None

    if fmt not in ALLOWED_FORMATS:
        raise InvalidPhoto("photo_type", "Use JPG, PNG, WEBP or GIF", field="photo",
                           params={"expected": "jpg, png, webp, gif"})
    if width * height > MAX_PIXELS:
        raise InvalidPhoto("photo_too_large", "The photo has too many pixels", field="photo",
                           params={"limit": MAX_PIXELS})

    with Image.open(BytesIO(data)) as img:
        img = ImageOps.exif_transpose(img)          # keep the orientation the phone intended
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGBA")
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.getchannel("A"))
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")
        img.thumbnail((MAX_SIDE, MAX_SIDE))
        out = BytesIO()
        img.save(out, format="JPEG", quality=82, optimize=True)  # no exif passed = metadata dropped
        return out.getvalue()
