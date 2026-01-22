import { useEffect, useRef, useState, useCallback } from 'react';
import { XCircle } from 'lucide-react';
import './CameraSetup.css';

interface CameraSetupProps {
  onContinue: () => void;
}

const CameraSetup: React.FC<CameraSetupProps> = ({ onContinue }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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

  // Initialize camera on mount - startCamera sets state which is intentional for this external API
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Callback ref to assign stream when video element mounts
  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    if (video && streamRef.current) {
      video.srcObject = streamRef.current;
    }
  }, []);

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
              <div className="positioning-guide">
                <div className="guide-silhouette">
                  <div className="guide-head"></div>
                  <div className="guide-body"></div>
                  <div className="guide-arm guide-arm-left"></div>
                  <div className="guide-arm guide-arm-right"></div>
                  <div className="guide-leg guide-leg-left"></div>
                  <div className="guide-leg guide-leg-right"></div>
                </div>
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
          <div className={`status-item ${hasPermission ? 'highlight' : ''}`}>
            <span className="status-indicator">○</span>
            <span>Position yourself in frame</span>
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
