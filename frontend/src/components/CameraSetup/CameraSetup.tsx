import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { XCircle } from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';
import { getWsUrl } from '../../services/api';
import './CameraSetup.css';

interface CameraSetupProps {
  onContinue: () => void;
}

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

// Landmark indices for full body visibility check
const REQUIRED_LANDMARKS = [
  0,   // nose (head)
  11, 12, // shoulders
  23, 24, // hips
  25, 26, // knees
  27, 28, // ankles
];
const VISIBILITY_THRESHOLD = 0.6;
const HOLD_DURATION = 3000; // 3 seconds

const CameraSetup: React.FC<CameraSetupProps> = ({ onContinue }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const [isPositionValid, setIsPositionValid] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const { speak, stop } = useSpeech();
  const hasSpokenRef = useRef(false);
  const hasSpokenHoldRef = useRef(false);
  const hasAutoAdvancedRef = useRef(false);

  // Validate if all required landmarks are visible
  const validatePosition = useCallback((landmarks: Landmark[] | null): boolean => {
    if (!landmarks || landmarks.length < 33) return false;

    return REQUIRED_LANDMARKS.every(
      (idx) => landmarks[idx]?.visibility > VISIBILITY_THRESHOLD
    );
  }, []);

  const stopFrameCapture = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    stopFrameCapture();
  }, [stopFrameCapture]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      setHasPermission(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      setHasPermission(false);
      console.error('Camera access error:', err);
    }
  }, []);

  // Capture and send frames for pose detection
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.7);
    socketRef.current.emit('video_frame', { image: imageData });
  }, []);

  const startFrameCapture = useCallback(() => {
    stopFrameCapture();
    intervalRef.current = window.setInterval(captureFrame, 200); // 5 FPS for validation
  }, [captureFrame, stopFrameCapture]);

  // Connect to socket and listen for pose results
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(getWsUrl(), {
      transports: ['websocket'],
      reconnection: true,
    });

    socket.on('connect', () => {
      console.log('CameraSetup: Socket connected');
    });

    socket.on('pose_result', (result: { landmarks: Landmark[] | null }) => {
      const isValid = validatePosition(result.landmarks);
      setIsPositionValid(isValid);
    });

    socketRef.current = socket;
  }, [validatePosition]);

  // Initialize camera on mount - startCamera sets state which is intentional for this external API
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera();
    return () => {
      stopCamera();
      disconnectSocket();
    };
  }, [startCamera, stopCamera, disconnectSocket]);

  // Start socket and frame capture when camera is ready
  useEffect(() => {
    if (hasPermission && streamRef.current) {
      connectSocket();
      // Small delay to ensure video is playing
      const timeout = setTimeout(() => {
        startFrameCapture();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [hasPermission, connectSocket, startFrameCapture]);

  // Hold timer - progress when position is valid
  useEffect(() => {
    if (isPositionValid && !hasAutoAdvancedRef.current) {
      // Speak encouragement once
      if (!hasSpokenHoldRef.current) {
        hasSpokenHoldRef.current = true;
        speak('Great position! Hold still for 3 seconds.');
      }

      holdTimerRef.current = window.setInterval(() => {
        setHoldProgress((prev) => {
          const next = prev + 100;
          if (next >= HOLD_DURATION) {
            hasAutoAdvancedRef.current = true;
            clearInterval(holdTimerRef.current!);
            stop();
            speak('Perfect! Moving to tutorial.');
            // Delay to let speech start
            setTimeout(() => {
              stopCamera();
              disconnectSocket();
              onContinue();
            }, 500);
          }
          return Math.min(next, HOLD_DURATION);
        });
      }, 100);

      return () => {
        if (holdTimerRef.current) {
          clearInterval(holdTimerRef.current);
        }
      };
    } else if (!isPositionValid) {
      // Reset progress if position lost - this is intentional to sync with external validation state
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHoldProgress(0);
      hasSpokenHoldRef.current = false;
    }
  }, [isPositionValid, onContinue, speak, stop, stopCamera, disconnectSocket]);

  // Callback ref to assign stream when video element mounts
  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    if (video && streamRef.current) {
      video.srcObject = streamRef.current;
    }
  }, []);

  // Speak instructions when camera is connected
  useEffect(() => {
    if (hasPermission && !hasSpokenRef.current) {
      hasSpokenRef.current = true;
      speak(
        'Camera connected. Please position yourself so your full body is visible in the frame. Stand about 6 to 8 feet away from the camera. When you are ready, tap Continue.'
      );
    }
    return () => {
      stop();
    };
  }, [hasPermission, speak, stop]);

  const handleContinue = () => {
    stopCamera();
    onContinue();
  };

  return (
    <div className="camera-setup">
      <div className="camera-setup-content">
        <h1>Camera Setup</h1>
        <p className="camera-setup-subtitle">
          Let's make sure your camera is ready for pose detection
        </p>

        <div className="camera-preview-container">
          {hasPermission === null && (
            <div className="camera-requesting">
              <div className="camera-spinner"></div>
              <p>Requesting camera access...</p>
            </div>
          )}

          {hasPermission === false && (
            <div className="camera-error">
              <div className="error-icon">
                <XCircle size={48} color="#ef4444" />
              </div>
              <p>{error || 'Camera permission denied'}</p>
              <button className="retry-button" onClick={startCamera}>
                Try Again
              </button>
            </div>
          )}

          {hasPermission && (
            <>
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                className="camera-preview-video"
                aria-label="Camera preview for positioning"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className={`positioning-guide ${isPositionValid ? 'valid' : ''}`}>
                <div className="guide-silhouette">
                  <div className="guide-head"></div>
                  <div className="guide-body"></div>
                  <div className="guide-arm guide-arm-left"></div>
                  <div className="guide-arm guide-arm-right"></div>
                  <div className="guide-leg guide-leg-left"></div>
                  <div className="guide-leg guide-leg-right"></div>
                </div>
                {isPositionValid && (
                  <div className="hold-progress-ring">
                    <svg viewBox="0 0 100 100">
                      <circle
                        className="progress-bg"
                        cx="50"
                        cy="50"
                        r="45"
                      />
                      <circle
                        className="progress-fill"
                        cx="50"
                        cy="50"
                        r="45"
                        style={{
                          strokeDashoffset: 283 - (283 * holdProgress) / HOLD_DURATION,
                        }}
                      />
                    </svg>
                    <span className="hold-countdown">
                      {Math.ceil((HOLD_DURATION - holdProgress) / 1000)}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="camera-status">
          <div className={`status-item ${hasPermission ? 'success' : ''}`}>
            <span className="status-indicator">
              {hasPermission ? '✓' : '○'}
            </span>
            <span>Camera connected</span>
          </div>
          <div className={`status-item ${isPositionValid ? 'success' : hasPermission ? 'highlight' : ''}`}>
            <span className="status-indicator">
              {isPositionValid ? '✓' : '○'}
            </span>
            <span>
              {isPositionValid
                ? `Hold still... ${Math.ceil((HOLD_DURATION - holdProgress) / 1000)}`
                : 'Position yourself in frame'}
            </span>
          </div>
        </div>

        <div className="camera-tips">
          <h3>Tips for best results</h3>
          <ul>
            <li>Stand 6-8 feet away from the camera</li>
            <li>Make sure your full body is visible</li>
            <li>Good lighting helps accuracy</li>
            <li>Wear fitted clothing for better detection</li>
          </ul>
        </div>

        <button
          className="camera-continue-button"
          onClick={handleContinue}
          disabled={!hasPermission}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default CameraSetup;
