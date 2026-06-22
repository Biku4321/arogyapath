"""
ArogyaPath backend -- FastAPI application entrypoint.

Run with:
    uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import facilities, triage

app = FastAPI(
    title="ArogyaPath API",
    description="AI-powered multilingual health navigation assistant -- backend API.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(triage.router)
app.include_router(facilities.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "ArogyaPath API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
