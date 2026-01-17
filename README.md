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
│       │   ├── CameraCapture.tsx    # Webcam capture
│       │   ├── PoseOverlay.tsx      # Skeleton visualization
│       │   └── PoseFeedback.tsx     # Real-time feedback display
│       ├── services/
│       │   ├── websocket.ts         # Socket.IO client
│       │   └── sessionService.ts    # REST API client
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
│       └── body_parts.py            # Pose metadata & mappings
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

## Development

See [CLAUDE.md](./CLAUDE.md) for architecture details and development guidelines.

## License

This project uses permissive open-source libraries (Apache 2.0, MIT) compatible with commercial use.
