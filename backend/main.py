"""FastAPI entrypoint. Run:  uvicorn main:app --reload --port 8000"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import config
from routers import assistant, history, planning, vision
from services import storage

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    storage.init_db()
    yield


app = FastAPI(title="Multimodal Construction Intelligence Platform", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])

for r in (vision.router, planning.router, assistant.router, history.router):
    app.include_router(r)


@app.get("/api/health")
def health():
    return {"status": "ok", "model": config.LLM_MODEL, "mock_mode": config.MOCK_LLM}


# Every error uses one shape -> {"error": "message"} so the UI can always show it.
@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(p) for p in first.get("loc", []) if p != "body")
    return JSONResponse(status_code=422, content={"error": f"Invalid input{' for ' + field if field else ''}: {first.get('msg', 'bad value')}"})


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    logging.exception("Unhandled error")
    return JSONResponse(status_code=500, content={"error": "Unexpected server error."})


@app.exception_handler(HTTPException)
async def http_handler(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
