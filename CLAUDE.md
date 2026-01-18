# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alili is a real-time yoga pose detection webapp using computer vision. Users select body parts to target (pain relief or improvement), and the system generates personalized yoga sessions with live AI feedback on pose quality.

**Tech Stack:**
- Frontend: Vite + React 19 + TypeScript
- Backend: Python 3.12 + FastAPI + MediaPipe
- Communication: Socket.IO for real-time video streaming
- Package Manager: uv (backend), npm (frontend)

## Development Commands

### Backend
```bash
cd backend
uv sync                                               # Install dependencies
uv run uvicorn app.main:socket_app --reload --port 8000  # Run dev server
```

### Frontend
```bash
cd frontend
npm install     # Install dependencies
npm run dev     # Run dev server (port 5173)
npm run build   # Build for production
npm run lint    # Run ESLint
```

### Linting
```bash
# Backend (Python with ruff)
cd backend
uv run ruff check app/       # Check for issues
uv run ruff check app/ --fix # Auto-fix issues
uv run ruff format app/      # Format code

# Frontend (TypeScript with ESLint)
cd frontend
npm run lint                 # Check for issues
```

### Testing
```bash
cd backend
uv run pytest tests/ -v      # Run all tests with verbose output
uv run pytest tests/ -q      # Run all tests quietly
```

## Architecture

### Real-Time Pose Detection Pipeline

```
Camera → WebSocket → MediaPipe Detection → Pose Recognition → Quality Analysis → Frontend Overlay
```

1. **Frontend** (`CameraCapture.tsx`) captures frames, sends base64-encoded JPEG via Socket.IO
2. **Backend** (`websocket.py`) receives frames, orchestrates the detection pipeline
3. **PoseDetector** (`pose_detection.py`) uses MediaPipe to extract 33 body landmarks
4. **YogaPoseRecognizer** (`pose_recognition.py`) compares joint angles against reference poses
5. **PoseQualityAnalyzer** (`pose_analysis.py`) generates actionable feedback
6. Results stream back via Socket.IO `pose_result` event

### Session Flow

The app has 4 screens managed by `App.tsx`:
1. **BodyPartSelector** - User selects pain/improvement areas
2. **SessionConfig** - Configure session duration
3. **ActiveSession** - Live pose detection with timer, feedback, and skeleton overlay
4. **Complete** - Session summary

### Key Backend Modules

| Module | Purpose |
|--------|---------|
| `main.py` | FastAPI app with CORS, mounts Socket.IO |
| `websocket.py` | Socket.IO handlers for `video_frame` event |
| `pose_detection.py` | MediaPipe wrapper, base64 image decoding |
| `pose_recognition.py` | Angle-based pose matching with confidence scores |
| `pose_analysis.py` | Per-joint feedback generation |
| `session_generator.py` | Creates session with warmup→peak→cooldown ordering |
| `body_parts.py` | Pose metadata, body part mappings, asymmetric pose pairs |
| `utils/geometry.py` | Shared angle calculation utilities |
| `services/gemini_analyzer.py` | Optional Gemini AI feedback integration |

### Key Frontend Components

| Component | Purpose |
|-----------|---------|
| `ActiveSession/ActiveSession.tsx` | Main session wrapper, selects mobile/desktop layout |
| `ActiveSession/ActiveSessionMobile.tsx` | Mobile immersive layout with camera overlays |
| `ActiveSession/ActiveSessionDesktop.tsx` | Desktop layout with sidebar pose reference |
| `SessionComplete.tsx` | Session summary with pose scores |
| `SessionControls.tsx` | Pause, skip, voice toggle, exit buttons |
| `PoseInfoCard.tsx` | Current pose name, progress bar, tags |
| `CameraCapture.tsx` | Camera access, frame capture and streaming |
| `PoseOverlay.tsx` | SVG skeleton overlay on video |
| `PoseFeedback.tsx` | Displays real-time feedback and accuracy score |
| `PoseTransition.tsx` | Between-pose transition screen |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useActiveSession.ts` | Central hook managing all session state, WebSocket, and callbacks |
| `useSessionTimer.ts` | Timer countdown with pause/resume and callbacks |
| `usePoseScoring.ts` | Accumulates confidence scores per pose |
| `useMobileViewToggle.ts` | Alternates pose reference and camera on mobile |

### Utilities

| Utility | Purpose |
|---------|---------|
| `utils/formatting.ts` | Body part name formatting |
| `utils/scoreClassification.ts` | Score labels (Excellent, Good, Fair, Needs Work) |
| `utils/poseImages.ts` | Pose name to image path mapping |

### WebSocket Events

- `video_frame` (client→server): `{ image: base64, target_pose?: string }`
- `pose_result` (server→client): `{ landmarks, poseName, confidence, feedback, timestamp }`
- `connect_response`, `error`, `disconnect`

### REST Endpoints

- `POST /session/generate` - Create personalized session
- `POST /session/preview` - Preview session without creating
- `GET /session/{id}` - Retrieve session
- `POST /session/{id}/complete` - Mark session complete
- `GET /session/body-parts/list` - Available body parts

## Adding New Poses

1. Add reference angles to `YogaPoseRecognizer.reference_poses` in `pose_recognition.py`
2. Add pose metadata (duration, difficulty, targets) to `POSE_METADATA` in `body_parts.py`
3. Update `BODY_PART_POSES` mappings
4. For asymmetric poses, add pair to `ASYMMETRIC_POSE_PAIRS`
5. Categorize in `WARMUP_POSES`, `PEAK_POSES`, or `COOLDOWN_POSES`

## MediaPipe Landmarks

The system uses MediaPipe's 33-point body model. Key indices for pose recognition:
- Shoulders: 11 (left), 12 (right)
- Elbows: 13 (left), 14 (right)
- Wrists: 15 (left), 16 (right)
- Hips: 23 (left), 24 (right)
- Knees: 25 (left), 26 (right)
- Ankles: 27 (left), 28 (right)

## Git Conventions

- Do not add `Co-Authored-By` lines to commit messages
