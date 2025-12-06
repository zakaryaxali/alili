import { useState, useEffect, useRef } from 'react';
import CameraCapture from './components/CameraCapture';
import PoseOverlay from './components/PoseOverlay';
import PoseFeedback from './components/PoseFeedback';
import { PoseWebSocketService } from './services/websocket';
import type { PoseDetectionResult } from './types/pose';
import './App.css';

function App() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [poseResult, setPoseResult] = useState<PoseDetectionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const wsServiceRef = useRef<PoseWebSocketService | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    // Initialize WebSocket service
    const wsService = new PoseWebSocketService(
      import.meta.env.VITE_API_URL || 'http://localhost:8000'
    );
    wsServiceRef.current = wsService;

    // Connect to WebSocket
    wsService.connect(
      (result) => {
        setPoseResult(result);
        setError('');
      },
      (error) => {
        setError(error);
        setIsConnected(false);
      }
    );

    // Check connection status
    const checkConnection = setInterval(() => {
      setIsConnected(wsService.isConnected());
    }, 1000);

    // Update video dimensions based on container size
    const updateDimensions = () => {
      if (videoContainerRef.current) {
        const { offsetWidth, offsetHeight } = videoContainerRef.current;
        setVideoDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => {
      wsService.disconnect();
      clearInterval(checkConnection);
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const handleFrame = (imageData: string) => {
    if (wsServiceRef.current && isConnected) {
      wsServiceRef.current.sendFrame(imageData);
    }
  };

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Alili - Yoga Pose Recognition</h1>
        <p>Improve your yoga practice with real-time AI feedback</p>
      </header>

      {error && (
        <div className="app-error">
          <p>{error}</p>
        </div>
      )}

      <div className="app-content">
        <div className="video-section">
          <div className="video-wrapper" ref={videoContainerRef}>
            <CameraCapture onFrame={handleFrame} isStreaming={isStreaming} />
            {poseResult && poseResult.landmarks && (
              <PoseOverlay
                landmarks={poseResult.landmarks}
                width={videoDimensions.width}
                height={videoDimensions.height}
              />
            )}
          </div>
          <div className="controls">
            <button
              onClick={toggleStreaming}
              className={`stream-button ${isStreaming ? 'streaming' : ''}`}
              disabled={!isConnected}
            >
              {isStreaming ? 'Stop Detection' : 'Start Detection'}
            </button>
          </div>
        </div>

        <div className="feedback-section">
          <PoseFeedback result={poseResult} isConnected={isConnected} />
        </div>
      </div>
    </div>
  );
}

export default App;
