from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from .websocket import sio
from .session_routes import router as session_router

app = FastAPI(title="Alili - Yoga Pose Recognition API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=False,  # Must be False with wildcard origins per CORS spec
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(session_router)

# Mount Socket.IO app
socket_app = socketio.ASGIApp(sio, app)

@app.get("/")
async def root():
    return {
        "message": "Alili - Yoga Pose Recognition API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
