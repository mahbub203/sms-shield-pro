import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database
from app.ml.detector import ml_detector
from app.scheduler.job_runner import job_scheduler

from app.routers import (
    auth, dashboard, detection, simulation,
    protection, threats, analytics, reports, settings as settings_router,
    automation, scheduler
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database Schema (creates new tables)
    Base.metadata.create_all(bind=engine)
    
    # Run Seeds
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Preload and verify ML Model
    ml_detector.get_metrics()
    
    # Start SMS Automation Scheduler Daemon
    job_scheduler.start()
    print("[SMS Shield Pro] Core defense engine, automation scheduler, and ML models initialized successfully.")
    
    yield
    job_scheduler.stop()
    print("[SMS Shield Pro] Shutting down cleanly.")

app = FastAPI(
    title=f"{settings.PROJECT_NAME} PRO",
    version=settings.VERSION,
    description="Intelligent SMS Security, Automation, Spam Detection & Threat Defense Platform",
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
app.include_router(automation.router, prefix=settings.API_V1_PREFIX)
app.include_router(scheduler.router, prefix=settings.API_V1_PREFIX)
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
        "service": f"{settings.PROJECT_NAME} PRO",
        "version": settings.VERSION,
        "mode": "ACTIVE_DEFENSE",
        "scheduler_status": job_scheduler.worker_status
    }

@app.get("/")
def root():
    return {
        "name": f"{settings.PROJECT_NAME} PRO",
        "status": "online",
        "docs_url": "/docs",
        "api_prefix": settings.API_V1_PREFIX
    }
