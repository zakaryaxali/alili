# Alili - Yoga Pose Recognition

Real-time yoga pose detection and quality analysis using computer vision. Get instant feedback on your yoga practice with AI-powered pose recognition.

## Features

- **Real-time Pose Detection**: Detect human poses at 30+ FPS using MediaPipe
- **Yoga Pose Recognition**: Recognize 5+ common yoga poses (Mountain, Warrior II, Tree, Downward Dog, Plank)
- **Quality Feedback**: Get actionable feedback on pose alignment and form
- **Multi-person Support**: Detect and analyze multiple people simultaneously
- **Web-based Interface**: Access from any device with a webcam

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Python 3.12 + FastAPI + MediaPipe
- **Package Manager**: uv (fast Python package installer)
- **Communication**: WebSocket (Socket.IO) for real-time video streaming
- **License**: Apache 2.0 (SaaS-friendly)

## Prerequisites

- **Python 3.12** or higher
- **Node.js 18+** and npm
- **uv** package manager ([Installation](https://github.com/astral-sh/uv))
- Webcam access

## Installation

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies with uv
uv sync

# Run the server
uv run uvicorn app.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. **Start the backend server** (see Backend Setup above)
2. **Start the frontend dev server** (see Frontend Setup above)
3. **Open your browser** and navigate to `http://localhost:5173`
4. **Allow camera access** when prompted
5. **Click "Start Detection"** to begin real-time pose recognition
6. **Perform yoga poses** and receive instant feedback

## Supported Yoga Poses

- **Mountain Pose (Tadasana)**: Basic standing pose
- **Warrior II (Virabhadrasana II)**: Standing strength pose
- **Tree Pose (Vrksasana)**: Balance pose
- **Downward Dog (Adho Mukha Svanasana)**: Inverted V-shape pose
- **Plank Pose**: Core strengthening pose

## Project Structure

```
alili/
├── frontend/          # Vite React TypeScript app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # WebSocket service
│   │   ├── types/         # TypeScript definitions
│   │   └── App.tsx        # Main app component
│   └── package.json
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── websocket.py         # WebSocket handlers
│   │   ├── pose_detection.py   # MediaPipe integration
│   │   ├── pose_recognition.py # Yoga pose matching
│   │   └── pose_analysis.py    # Quality feedback
│   └── pyproject.toml
└── CLAUDE.md          # Development guidelines
```

## Development

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines, coding standards, and architecture documentation.

## API Endpoints

### HTTP Endpoints

- `GET /` - API information
- `GET /health` - Health check

### WebSocket Events

**Client → Server**:
- `video_frame`: Send video frame for pose detection
  ```json
  { "image": "base64_encoded_jpeg" }
  ```

**Server → Client**:
- `pose_result`: Pose detection results
  ```json
  {
    "landmarks": [...],
    "poseName": "Warrior II",
    "confidence": 0.85,
    "feedback": ["Great form!", "Keep knee over ankle"],
    "timestamp": 1234567890
  }
  ```

## License

This project uses the following open-source libraries:
- MediaPipe: Apache 2.0 License
- FastAPI: MIT License
- React: MIT License

All components are compatible with commercial SaaS use.

## Future Enhancements

- Session recording and playback
- Progress tracking over time
- Multiple camera angles support
- Mobile app version
- Additional yoga poses
- Integration with wearables

## Contributing

See [CLAUDE.md](./CLAUDE.md) for coding standards and contribution guidelines.

## Support

For issues or questions, please open an issue on the GitHub repository.