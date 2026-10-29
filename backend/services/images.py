"""Validate uploaded images (type, size, count, magic bytes) before they reach the LLM."""
from typing import List

from fastapi import HTTPException, UploadFile

import config
from llm_client import ImageInput

_MAGIC = {
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/gif": (b"GIF87a", b"GIF89a"),
}


def _looks_valid(data: bytes, media_type: str) -> bool:
    if media_type == "image/webp":
        return data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    return any(data.startswith(m) for m in _MAGIC[media_type])


async def read_images(files: List[UploadFile], required: bool = True) -> List[ImageInput]:
    files = [f for f in (files or []) if f and f.filename]
    if not files:
        if required:
            raise HTTPException(400, "Upload at least one image.")
        return []
    if len(files) > config.MAX_IMAGES:
        raise HTTPException(400, f"Too many images: maximum is {config.MAX_IMAGES}.")
    out = []
    for f in files:
        if f.content_type not in config.ALLOWED_IMAGE_TYPES:
            raise HTTPException(415, f"'{f.filename}': unsupported type. Use JPEG, PNG, WebP or GIF.")
        data = await f.read(config.MAX_IMAGE_BYTES + 1)
        if not data:
            raise HTTPException(400, f"'{f.filename}' is empty.")
        if len(data) > config.MAX_IMAGE_BYTES:
            raise HTTPException(413, f"'{f.filename}' is larger than {config.MAX_IMAGE_BYTES // (1024 * 1024)} MB.")
        if not _looks_valid(data, f.content_type):
            raise HTTPException(400, f"'{f.filename}' is corrupted or not a real {f.content_type} image.")
        out.append(ImageInput(data=data, media_type=f.content_type))
    return out
