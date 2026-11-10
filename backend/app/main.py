import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database
from app.ml.detector import ml_detector

from app.routers import (
    auth, dashboard, detection, simulation,
    protection, threats, analytics, reports, settings as settings_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database Schema
    Base.metadata.create_all(bind=engine)
    
    # Run Seeds
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Preload and verify ML Model
    ml_detector.get_metrics()
    print("[SMS Shield] Core defense engine and ML models initialized successfully.")
    
    yield
    print("[SMS Shield] Shutting down cleanly.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade Intelligent SMS Security, Spam Detection & Protection Platform",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API V1 Router Inclusions
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(detection.router, prefix=settings.API_V1_PREFIX)
app.include_router(simulation.router, prefix=settings.API_V1_PREFIX)
app.include_router(protection.router, prefix=settings.API_V1_PREFIX)
app.include_router(threats.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(settings_router.router, prefix=settings.API_V1_PREFIX)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "ACTIVE_DEFENSE"
    }

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "api_prefix": settings.API_V1_PREFIX
    }
