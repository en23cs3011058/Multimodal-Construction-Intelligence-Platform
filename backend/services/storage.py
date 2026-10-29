"""SQLite store for analysis history; uploaded images are kept on disk."""
import json
import sqlite3
import uuid
from contextlib import closing
from datetime import datetime, timezone
from typing import List, Optional

import config


def _conn():
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with closing(_conn()) as c, c:
        c.execute(
            """CREATE TABLE IF NOT EXISTS analyses (
                 id TEXT PRIMARY KEY, feature TEXT NOT NULL, created_at TEXT NOT NULL,
                 input_json TEXT NOT NULL, result_json TEXT NOT NULL, image_files TEXT NOT NULL DEFAULT '[]')"""
        )


def save_images(images) -> List[str]:
    names = []
    for img in images:
        ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}[img.media_type]
        name = f"{uuid.uuid4().hex}.{ext}"
        (config.UPLOAD_DIR / name).write_bytes(img.data)
        names.append(name)
    return names


def save_analysis(feature: str, inputs: dict, result: dict, image_files: Optional[List[str]] = None) -> str:
    rid = uuid.uuid4().hex[:12]
    with closing(_conn()) as c, c:
        c.execute(
            "INSERT INTO analyses VALUES (?,?,?,?,?,?)",
            (rid, feature, datetime.now(timezone.utc).isoformat(), json.dumps(inputs, default=str),
             json.dumps(result, default=str), json.dumps(image_files or [])),
        )
    return rid


def list_analyses(feature: Optional[str] = None, limit: int = 50) -> List[dict]:
    q, args = "SELECT id, feature, created_at, input_json, result_json FROM analyses", []
    if feature:
        q += " WHERE feature = ?"
        args.append(feature)
    q += " ORDER BY created_at DESC LIMIT ?"
    args.append(min(max(limit, 1), 200))
    with closing(_conn()) as c:
        rows = c.execute(q, args).fetchall()
    return [{"id": r["id"], "feature": r["feature"], "created_at": r["created_at"],
             "input": json.loads(r["input_json"]), "result": json.loads(r["result_json"])} for r in rows]


def get_analysis(rid: str) -> Optional[dict]:
    with closing(_conn()) as c:
        r = c.execute("SELECT * FROM analyses WHERE id = ?", (rid,)).fetchone()
    if not r:
        return None
    return {"id": r["id"], "feature": r["feature"], "created_at": r["created_at"],
            "input": json.loads(r["input_json"]), "result": json.loads(r["result_json"])}
