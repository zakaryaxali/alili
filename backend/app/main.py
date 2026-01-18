import os

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .session_routes import router as session_router
from .websocket import sio

app = FastAPI(title="Alili - Yoga Pose Recognition API")

# Configure CORS - use CORS_ORIGINS env var in production
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    cors_origins = [origin.strip() for origin in cors_origins_env.split(",")]
    allow_credentials = True
else:
    cors_origins = ["*"]
    allow_credentials = False  # Must be False with wildcard origins per CORS spec

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(session_router)

# Mount Socket.IO app
socket_app = socketio.ASGIApp(sio, app)


@app.get("/")
async def root():
    return {"message": "Alili - Yoga Pose Recognition API", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
