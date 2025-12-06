import { useState, useEffect, useRef } from 'react';
import CameraCapture from './CameraCapture';
import PoseOverlay from './PoseOverlay';
import PoseFeedback from './PoseFeedback';
import PoseTransition from './PoseTransition';
import { PoseWebSocketService } from '../services/websocket';
import type { PoseDetectionResult } from '../types/pose';
import type { YogaSession } from '../types/session';
import './ActiveSession.css';

interface ActiveSessionProps {
  session: YogaSession;
  onComplete: (completedPoses: number, totalTime: number) => void;
  onExit: () => void;
}

const ActiveSession: React.FC<ActiveSessionProps> = ({ session, onComplete, onExit }) => {
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(session.poses[0].duration);
  const [isPaused, setIsPaused] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [poseResult, setPoseResult] = useState<PoseDetectionResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [videoDimensions, setVideoDimensions] = useState({ width: 1280, height: 720 });

  const wsServiceRef = useRef<PoseWebSocketService | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPose = session.poses[currentPoseIndex];
  const totalPoses = session.poses.length;

  useEffect(() => {
    // Initialize WebSocket
    const wsService = new PoseWebSocketService(
      import.meta.env.VITE_API_URL || 'http://localhost:8000'
    );
    wsServiceRef.current = wsService;

    wsService.connect(
      (result) => {
        setPoseResult(result);
      },
      (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      }
    );

    const checkConnection = setInterval(() => {
      setIsConnected(wsService.isConnected());
    }, 1000);

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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Start timer for current pose
    if (!isPaused && !showTransition) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Move to next pose or finish session
            if (currentPoseIndex < totalPoses - 1) {
              setShowTransition(true);
              return 0;
            } else {
              // Session complete
              const totalTime = Math.floor((Date.now() - sessionStartTime) / 1000);
              onComplete(totalPoses, totalTime);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentPoseIndex, isPaused, showTransition, totalPoses, sessionStartTime, onComplete]);

  const handleFrame = (imageData: string) => {
    if (wsServiceRef.current && isConnected) {
      wsServiceRef.current.sendFrame(imageData);
    }
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    setCurrentPoseIndex(prev => prev + 1);
    setTimeRemaining(session.poses[currentPoseIndex + 1].duration);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleSkip = () => {
    if (currentPoseIndex < totalPoses - 1) {
      setShowTransition(true);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateTotalRemaining = (): number => {
    let remaining = timeRemaining;
    for (let i = currentPoseIndex + 1; i < totalPoses; i++) {
      remaining += session.poses[i].duration;
    }
    return remaining;
  };

  if (showTransition) {
    const nextPose = session.poses[currentPoseIndex + 1];
    return (
      <PoseTransition
        nextPoseName={nextPose.pose_name}
        nextPoseDuration={nextPose.duration}
        onComplete={handleTransitionComplete}
      />
    );
  }

  return (
    <div className="active-session">
      <div className="session-header">
        <div className="progress-info">
          <div className="pose-counter">
            Pose {currentPoseIndex + 1} of {totalPoses}
          </div>
          <div className="total-time">
            {formatTime(calculateTotalRemaining())} remaining
          </div>
        </div>

        <div className="pose-timer">
          <div className="current-pose-name">{currentPose.pose_name}</div>
          <div className="timer-display">{formatTime(timeRemaining)}</div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((currentPoseIndex + (1 - timeRemaining / currentPose.duration)) / totalPoses) * 100}%`
            }}
          />
        </div>
      </div>

      <div className="session-content">
        <div className="video-section">
          <div className="video-wrapper" ref={videoContainerRef}>
            <CameraCapture onFrame={handleFrame} isStreaming={true} />
            {poseResult && poseResult.landmarks && (
              <PoseOverlay
                landmarks={poseResult.landmarks}
                width={videoDimensions.width}
                height={videoDimensions.height}
              />
            )}
          </div>

          <div className="session-controls">
            <button onClick={handlePause} className="control-btn pause-btn">
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleSkip}
              className="control-btn skip-btn"
              disabled={currentPoseIndex >= totalPoses - 1}
            >
              Skip Pose
            </button>
            <button onClick={onExit} className="control-btn exit-btn">
              Exit Session
            </button>
          </div>
        </div>

        <div className="feedback-section">
          <PoseFeedback result={poseResult} isConnected={isConnected} />

          {currentPose.is_pain_target && (
            <div className="pose-tag pain-tag">
              Pain Relief Pose
            </div>
          )}
          {currentPose.is_improvement_target && (
            <div className="pose-tag improvement-tag">
              Strengthening Pose
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveSession;
