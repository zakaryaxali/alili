# Alili - Yoga Pose Recognition Webapp

## Project Overview
Full-stack webapp for real-time yoga pose detection, recognition, and quality analysis using computer vision.

**Tech Stack:**
- Frontend: Vite + React + TypeScript
- Backend: Python 3.12 + FastAPI + MediaPipe
- Package Manager: uv (fast Python package installer)
- Communication: WebSocket for real-time video streaming
- License: Apache 2.0 (SaaS-friendly)

## Architecture Guidelines

### Project Structure
```
alili/
├── frontend/          # Vite React TypeScript app
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API/WebSocket services
│   │   ├── types/        # TypeScript definitions
│   │   └── utils/        # Helper functions
│   ├── package.json
│   └── vite.config.ts
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── websocket.py     # WebSocket handlers
│   │   ├── pose_detection.py   # MediaPipe integration
│   │   ├── pose_recognition.py # Yoga pose matching
│   │   └── pose_analysis.py    # Quality feedback
│   ├── pyproject.toml   # uv dependencies
│   └── uv.lock          # uv lock file
└── CLAUDE.md          # This file
```

### Data Flow
1. Frontend captures video from laptop camera
2. Video frames sent to backend via WebSocket
3. Backend processes frames with MediaPipe (33 body landmarks)
4. Yoga pose recognition compares landmarks with reference poses
5. Quality analysis provides real-time feedback
6. Results streamed back to frontend for visualization

## Coding Standards

### Frontend (React + TypeScript)
- Use functional components with hooks
- TypeScript strict mode enabled
- Component naming: PascalCase (e.g., `CameraCapture.tsx`)
- Use interfaces for all props and state types
- Error handling for camera permissions and WebSocket connections
- Responsive design for different screen sizes

### Backend (Python + FastAPI)
- Follow PEP 8 style guide
- Type hints for all functions
- Async/await for WebSocket handlers
- Error handling for video processing
- Modular design: separate pose detection, recognition, and analysis
- Use Pydantic models for data validation

### MediaPipe Integration
- Use MediaPipe Pose solution (Apache 2.0 license)
- Process at 30+ FPS for smooth real-time experience
- Support multi-person detection
- Return 33 landmark coordinates (x, y, z, visibility)

### Yoga Pose Recognition
- Store reference poses as joint angle configurations
- Common poses to implement:
  - Mountain Pose (Tadasana)
  - Downward Dog (Adho Mukha Svanasana)
  - Warrior I, II, III (Virabhadrasana)
  - Tree Pose (Vrksasana)
  - Child's Pose (Balasana)
  - Plank Pose
- Use cosine similarity or angle differences for matching
- Confidence threshold: 70%+

### Pose Quality Analysis
- Check key alignments:
  - Joint angles (knees, elbows, hips)
  - Body symmetry (left vs right side)
  - Balance and stability
  - Limb extension
- Provide actionable feedback:
  - "Straighten your left knee"
  - "Raise your arms higher"
  - "Align your hips"
  - "Keep your back straight"

## Development Workflow

### Running Locally
```bash
# Backend (using uv)
cd backend
uv sync  # Creates virtual environment and installs dependencies
uv run uvicorn app.main:app --reload --port 8000

# Or activate the venv manually:
# source .venv/bin/activate  # or .venv\Scripts\activate on Windows
# uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev  # Runs on port 5173 by default
```

### Backend Setup with uv
```bash
# Initialize uv project
cd backend
uv init --python 3.12

# Add dependencies
uv add fastapi uvicorn mediapipe opencv-python numpy python-socketio

# Run commands with uv
uv run <command>
```

### Environment Variables
- Frontend: `VITE_API_URL=http://localhost:8000`
- Backend: No env vars required for local development

## Best Practices

### Performance
- Limit video frame rate to 15-30 FPS for WebSocket streaming
- Compress frames before sending (JPEG quality: 80%)
- Use WebSocket binary frames for efficiency
- Debounce pose feedback to avoid UI flicker

### Security
- Validate all incoming video frames
- Rate limit WebSocket connections
- Add CORS configuration for production
- Never store or log video frames (privacy)

### Testing
- Frontend: Vitest for unit tests
- Backend: pytest for API and pose detection tests
- Manual testing with different yoga poses and lighting conditions

## Future Enhancements
- Session recording and playback
- Progress tracking over time
- Multiple camera angles support
- Mobile app version
- AI-powered pose correction suggestions
- Integration with wearables

## SaaS Considerations
- All dependencies use permissive licenses (Apache 2.0, MIT)
- Scalable WebSocket architecture (consider Redis pub/sub for multi-server)
- User authentication and session management
- Usage analytics and monitoring
- Pricing tiers based on session duration/pose complexity
