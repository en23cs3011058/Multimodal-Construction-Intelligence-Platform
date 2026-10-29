from typing import Optional

from fastapi import APIRouter, HTTPException

from services import storage

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("")
def list_history(feature: Optional[str] = None, limit: int = 50):
    return {"items": storage.list_analyses(feature, limit)}


@router.get("/{rid}")
def get_history(rid: str):
    item = storage.get_analysis(rid)
    if not item:
        raise HTTPException(404, "Analysis not found.")
    return item
