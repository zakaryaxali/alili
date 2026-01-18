# Alili - Yoga Pose Recognition

Real-time yoga pose detection and quality analysis using computer vision. Get personalized yoga sessions with AI-powered pose recognition and instant feedback.

## Features

- **Personalized Sessions**: Select body parts for pain relief or improvement, get a customized yoga sequence
- **Real-time Pose Detection**: Detect human poses at 30+ FPS using MediaPipe
- **18 Yoga Poses**: Mountain, Warrior II, Tree, Downward Dog, Plank, and more
- **Quality Feedback**: Get actionable feedback on pose alignment and form
- **Smart Sequencing**: Sessions auto-organized into warmup → peak → cooldown flow
- **Asymmetric Pose Pairing**: Left/right variations automatically paired

## Tech Stack

- **Frontend**: Vite + React 19 + TypeScript
- **Backend**: Python 3.12 + FastAPI + MediaPipe
- **Package Manager**: uv (backend), npm (frontend)
- **Communication**: Socket.IO for real-time video streaming

## Prerequisites

- **Python 3.12** or higher
- **Node.js 18+** and npm
- **uv** package manager ([Installation](https://github.com/astral-sh/uv))
- Webcam access

## Installation

### Backend Setup

```bash
cd backend
uv sync
uv run uvicorn app.main:socket_app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. **Start both servers** (backend on port 8000, frontend on port 5173)
2. **Open your browser** at `http://localhost:5173`
3. **Select body parts** - Choose areas for pain relief or improvement
4. **Configure session** - Set your desired duration (10-90 minutes)
5. **Start session** - Allow camera access and follow the guided poses
6. **Get feedback** - See real-time skeleton overlay and pose quality feedback

## Running on Mobile

To use the app on your phone (same WiFi network):

### 1. Generate SSL certificates for the backend

```bash
cd backend
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
```

### 2. Start servers with network access

```bash
# Terminal 1 - Backend (HTTPS)
cd backend
uv run uvicorn app.main:socket_app --reload --port 8000 --host 0.0.0.0 --ssl-keyfile=key.pem --ssl-certfile=cert.pem

# Terminal 2 - Frontend (HTTPS via Vite plugin)
cd frontend
npm run dev -- --host
```

### 3. Get your computer's IP

```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

### 4. Access from phone

1. Connect your phone to the same WiFi network
2. Visit `https://<your-ip>:8000/` and accept the certificate warning
3. Visit `https://<your-ip>:5173/` and accept the certificate warning
4. The camera should now work with front-facing camera

**Note:** Self-signed certificates trigger browser warnings - this is expected for local development.

## Supported Yoga Poses

| Pose | Difficulty | Best For |
|------|------------|----------|
| Mountain Pose | Easy | Posture, alignment |
| Easy Seat | Easy | Hips, meditation |
| Downward Dog | Medium | Back, shoulders, hamstrings |
| Warrior II (L/R) | Medium | Legs, hips, balance |
| Tree Pose (L/R) | Medium | Balance, focus |
| Plank | Hard | Core, shoulders |
| Reverse Table Top | Hard | Core, chest, wrists |
| Supine Bound Angle | Easy | Hips, relaxation |
| Hug the Knees | Easy | Lower back, hips |
| Janu Sirsasana Twist (L/R) | Medium | Hamstrings, spine |
| Janu Sirsasana Revolved (L/R) | Medium | Hamstrings, spine |
| Gomukasana Legs Fold | Medium | Hips, flexibility |
| Supine Bent Knees | Easy | Lower back, relaxation |
| Seated Hands Behind Back Stretch | Easy | Shoulders, chest |

## Project Structure

```
alili/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ActiveSession.tsx    # Main session view with camera
│       │   ├── BodyPartSelector.tsx # Pain/improvement selection
│       │   ├── SessionConfig.tsx    # Duration configuration
│       │   ├── SessionComplete.tsx  # Session summary screen
│       │   ├── SessionControls.tsx  # Pause, skip, voice controls
│       │   ├── CameraCapture.tsx    # Webcam capture
│       │   ├── PoseOverlay.tsx      # Skeleton visualization
│       │   ├── PoseFeedback.tsx     # Real-time feedback display
│       │   ├── PoseInfoCard.tsx     # Current pose information
│       │   └── PoseTransition.tsx   # Between-pose transition
│       ├── hooks/
│       │   ├── useSessionTimer.ts   # Timer management
│       │   ├── usePoseScoring.ts    # Score tracking
│       │   └── useMobileViewToggle.ts # Mobile view switching
│       ├── services/
│       │   ├── websocket.ts         # Socket.IO client
│       │   ├── sessionService.ts    # REST API client
│       │   └── speechService.ts     # Voice feedback
│       ├── utils/
│       │   ├── formatting.ts        # Text formatting utilities
│       │   ├── scoreClassification.ts # Score label utilities
│       │   └── poseImages.ts        # Pose image mappings
│       └── types/                   # TypeScript definitions
├── backend/
│   └── app/
│       ├── main.py                  # FastAPI entry point
│       ├── websocket.py             # Socket.IO handlers
│       ├── pose_detection.py        # MediaPipe integration
│       ├── pose_recognition.py      # Angle-based pose matching
│       ├── pose_analysis.py         # Quality feedback generation
│       ├── session_generator.py     # Personalized session creation
│       ├── session_routes.py        # Session REST endpoints
│       ├── body_parts.py            # Pose metadata & mappings
│       ├── utils/
│       │   └── geometry.py          # Angle calculation utilities
│       └── services/
│           └── gemini_analyzer.py   # Optional Gemini AI feedback
└── CLAUDE.md                        # Development guidelines
```

## API

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| POST | `/session/generate` | Create personalized session |
| POST | `/session/preview` | Preview session before creating |
| GET | `/session/{id}` | Get session details |
| POST | `/session/{id}/complete` | Mark session complete |
| GET | `/session/body-parts/list` | List available body parts |

### WebSocket Events

**Client → Server**:
```json
{
  "event": "video_frame",
  "data": {
    "image": "base64_encoded_jpeg",
    "target_pose": "Warrior II Left"
  }
}
```

**Server → Client**:
```json
{
  "event": "pose_result",
  "data": {
    "landmarks": [...],
    "poseName": "Warrior II Left",
    "confidence": 0.85,
    "feedback": ["Great form!", "Keep knee over ankle"],
    "timestamp": 1234567890
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (React)                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Camera     │───>│   Socket.IO  │───>│   Pose       │                  │
│  │   Capture    │    │   Client     │    │   Overlay    │                  │
│  └──────────────┘    └──────┬───────┘    └──────────────┘                  │
│         │                   │                    ▲                          │
│         │            base64 frames          landmarks                       │
│         ▼                   │                    │                          │
│  ┌──────────────┐           │                    │                          │
│  │   Pose       │           │                    │                          │
│  │   Feedback   │<──────────┼────────────────────┘                          │
│  └──────────────┘           │                                               │
└─────────────────────────────┼───────────────────────────────────────────────┘
                              │
                    WebSocket │ (~15 FPS)
                              │
┌─────────────────────────────┼───────────────────────────────────────────────┐
│                             ▼           Backend (FastAPI)                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Socket.IO  │───>│   MediaPipe  │───>│    Pose      │                  │
│  │   Handler    │    │   Detector   │    │   Recognizer │                  │
│  └──────────────┘    └──────────────┘    └──────┬───────┘                  │
│         │                                       │                          │
│         │                              angle comparison                     │
│         │                                       │                          │
│         ▼                                       ▼                          │
│  ┌──────────────┐                       ┌──────────────┐                   │
│  │   Session    │                       │    Quality   │                   │
│  │   Generator  │                       │   Analyzer   │                   │
│  └──────────────┘                       └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Optional: Enable Gemini AI for enhanced pose feedback
GEMINI_API_KEY=your_gemini_api_key_here
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Google Gemini API key for AI-powered feedback. If not set, uses rule-based feedback. |

## Development

### Pre-commit Hooks

This project uses pre-commit hooks to ensure code quality before commits:

```bash
# Install pre-commit hooks (one-time setup)
cd backend
uv sync
uv run pre-commit install

# Run hooks manually on all files
uv run pre-commit run --all-files
```

The hooks run automatically on `git commit` and include:
- **ruff**: Python linting and formatting (backend)
- **eslint**: TypeScript/React linting (frontend)
- **pytest**: Run backend tests (backend)
- **trailing-whitespace**: Remove trailing whitespace
- **end-of-file-fixer**: Ensure files end with newline

### Manual Linting

**Backend (Python):**
```bash
cd backend
uv run ruff check app/       # Check for issues
uv run ruff check app/ --fix # Auto-fix issues
uv run ruff format app/      # Format code
```

**Frontend (TypeScript):**
```bash
cd frontend
npm run lint                 # Check for issues
```

### Testing

**Backend:**
```bash
cd backend
uv run pytest tests/ -v      # Run all tests with verbose output
uv run pytest tests/ -q      # Run all tests quietly
uv run pytest tests/test_geometry.py  # Run specific test file
```

### Code Style

- **Backend**: Ruff with Python 3.12 style (modern type hints, double quotes)
- **Frontend**: ESLint with React hooks rules, TypeScript strict mode

See [CLAUDE.md](./CLAUDE.md) for architecture details and development guidelines.

## License

This project uses permissive open-source libraries (Apache 2.0, MIT) compatible with commercial use.
