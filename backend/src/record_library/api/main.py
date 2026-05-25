"""FastAPI application entrypoint."""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import router as auth_router
from .libraries import router as libraries_router
from .records import discogs_router, records_router

load_dotenv()

app = FastAPI(title="Record Library API", version="0.1.0")

# Allow the local Vite dev server to call us during development.
_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
_origins = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", _default_origins).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(libraries_router)
app.include_router(records_router)
app.include_router(discogs_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
