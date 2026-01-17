import { useEffect, useRef, useState } from 'react';
import './CameraCapture.css';

interface CameraCaptureProps {
  onFrame: (imageData: string) => void;
  isStreaming: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onFrame, isStreaming }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isStreaming && hasPermission) {
      startFrameCapture();
    } else {
      stopFrameCapture();
    }
  }, [isStreaming, hasPermission]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setError('');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      setHasPermission(false);
      console.error('Camera access error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    stopFrameCapture();
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to JPEG with 80% quality for efficient transmission
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    onFrame(imageData);
  };

  const startFrameCapture = () => {
    stopFrameCapture();
    // Capture frames at ~15 FPS
    intervalRef.current = window.setInterval(captureFrame, 1000 / 15);
  };

  const stopFrameCapture = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <div className="camera-capture">
      <div className="video-container">
        {error && (
          <div className="error-message">
            <p>Camera Error: {error}</p>
            <button onClick={startCamera}>Retry</button>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={error ? 'hidden' : ''}
          aria-label="Live camera feed for pose detection"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default CameraCapture;
