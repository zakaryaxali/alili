import { useState, useEffect, useRef } from 'react';
import CameraCapture from './CameraCapture';
import PoseOverlay from './PoseOverlay';
import PoseFeedback from './PoseFeedback';
import PoseTransition from './PoseTransition';
import { PoseWebSocketService } from '../services/websocket';
import { speechService } from '../services/speechService';
import { getApiUrl } from '../services/api';
import type { PoseDetectionResult } from '../types/pose';
import type { YogaSession } from '../types/session';
import { getPoseImage } from '../utils/poseImages';
import './ActiveSession.css';

interface ActiveSessionProps {
  session: YogaSession;
  onComplete: (completedPoses: number, totalTime: number) => void;
  onExit: () => void;
}

// Mobile alternating view timings (in seconds)
const MOBILE_POSE_INITIAL = 5;  // Show pose first for 5s
const MOBILE_CAMERA_DURATION = 10;  // Then camera for 10s
const MOBILE_POSE_DURATION = 3;  // Then pose for 3s, repeat

const ActiveSession: React.FC<ActiveSessionProps> = ({ session, onComplete, onExit }) => {
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(session.poses[0].duration);
  const [isPaused, setIsPaused] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [poseResult, setPoseResult] = useState<PoseDetectionResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isWebSocketReady, setIsWebSocketReady] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [videoDimensions, setVideoDimensions] = useState({ width: 1280, height: 720 });
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [mobileShowPose, setMobileShowPose] = useState(true); // Start showing pose

  const wsServiceRef = useRef<PoseWebSocketService | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenFeedbackRef = useRef<string>('');
  const mobileViewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPose = session.poses[currentPoseIndex];
  const totalPoses = session.poses.length;

  useEffect(() => {
    // Initialize WebSocket
    const wsService = new PoseWebSocketService(getApiUrl());
    wsServiceRef.current = wsService;

    // Connect with event-driven connection state tracking
    wsService.connect(
      (result) => {
        setPoseResult(result);
      },
      (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      },
      (connected) => {
        // Event-driven connection state updates (no polling!)
        setIsConnected(connected);
      }
    ).then(() => {
      // WebSocket is fully ready (backend confirmed)
      console.log('WebSocket ready, enabling camera streaming');
      setIsWebSocketReady(true);
    }).catch((error) => {
      console.error('Failed to establish WebSocket connection:', error);
    });

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

  // Voice: Announce session start
  useEffect(() => {
    if (voiceEnabled && speechService.isSupported()) {
      speechService.speakSessionStart(totalPoses);
    }

    return () => {
      speechService.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount - intentionally not re-running on dependency changes

  // Voice: Announce pose changes
  useEffect(() => {
    if (voiceEnabled && speechService.isSupported() && !showTransition) {
      speechService.speakPoseTransition(currentPose.pose_name, currentPose.duration);
    }
  }, [currentPoseIndex, voiceEnabled, showTransition, currentPose.pose_name, currentPose.duration]);

  // Voice: Speak feedback when confidence is low
  useEffect(() => {
    if (!voiceEnabled || !speechService.isSupported()) return;
    if (!poseResult?.feedback?.length) return;
    if (poseResult.confidence >= 0.7) return; // Only speak corrections when needed

    const firstFeedback = poseResult.feedback[0];
    if (firstFeedback && firstFeedback !== lastSpokenFeedbackRef.current) {
      speechService.speakFeedback(firstFeedback);
      lastSpokenFeedbackRef.current = firstFeedback;
    }
  }, [poseResult?.feedback, poseResult?.confidence, voiceEnabled]);

  // Mobile: Alternating pose/camera view
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile || isPaused || showTransition) {
      return;
    }

    const scheduleCameraView = (delay: number) => {
      mobileViewTimerRef.current = setTimeout(() => {
        setMobileShowPose(false);
        schedulePoseView();
      }, delay * 1000);
    };

    const schedulePoseView = () => {
      mobileViewTimerRef.current = setTimeout(() => {
        setMobileShowPose(true);
        scheduleCameraView(MOBILE_POSE_DURATION);
      }, MOBILE_CAMERA_DURATION * 1000);
    };

    // Start: show pose first, then switch to camera
    setMobileShowPose(true);
    scheduleCameraView(MOBILE_POSE_INITIAL);

    return () => {
      if (mobileViewTimerRef.current) {
        clearTimeout(mobileViewTimerRef.current);
      }
    };
  }, [currentPoseIndex, isPaused, showTransition]);

  const handleFrame = (imageData: string) => {
    if (wsServiceRef.current && isConnected) {
      wsServiceRef.current.sendFrame(imageData, currentPose.pose_name);
    }
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    const nextIndex = currentPoseIndex + 1;
    setCurrentPoseIndex(nextIndex);
    setTimeRemaining(session.poses[nextIndex].duration);
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
      <div className="session-content">
        <div className="left-section">
          <div className="session-controls">
            <button onClick={handlePause} className="control-btn pause-btn">
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleSkip}
              className="control-btn skip-btn"
              disabled={currentPoseIndex >= totalPoses - 1}
            >
              Skip
            </button>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`control-btn voice-btn ${voiceEnabled ? 'voice-on' : 'voice-off'}`}
              title={voiceEnabled ? 'Mute voice guidance' : 'Enable voice guidance'}
            >
              {voiceEnabled ? 'Voice' : 'Muted'}
            </button>
            <button onClick={onExit} className="control-btn exit-btn">
              Exit
            </button>
            {!isConnected && (
              <div className="connection-status disconnected">
                <div className="status-indicator disconnected" />
                <span>Disconnected</span>
              </div>
            )}
          </div>

          {/* Mobile-only pose header with thumbnail */}
          <div className="mobile-pose-header">
            <img
              src={getPoseImage(currentPose.pose_name)}
              alt={currentPose.pose_name}
              className="mobile-pose-thumbnail"
            />
            <div className="mobile-pose-info">
              <div className="mobile-pose-name">{currentPose.pose_name}</div>
              <div className="mobile-pose-progress">
                Pose {currentPoseIndex + 1} of {totalPoses} • {timeRemaining}s
              </div>
            </div>
          </div>
          <div className="info-card pose-name-card">
            <div className="info-main">
              ({currentPoseIndex + 1}/{totalPoses}) {currentPose.pose_name}
            </div>

            <div className="segmented-progress-bar">
              <div className="progress-fill" style={{ width: `${((session.poses.slice(0, currentPoseIndex).reduce((sum, p) => sum + p.duration, 0) + (currentPose.duration - timeRemaining)) / session.poses.reduce((sum, p) => sum + p.duration, 0)) * 100}%` }} />
              {session.poses.map((_, index) => {
                const segmentStart = session.poses.slice(0, index).reduce((sum, p) => sum + p.duration, 0);
                const totalDuration = session.poses.reduce((sum, p) => sum + p.duration, 0);
                const position = (segmentStart / totalDuration) * 100;
                return index > 0 ? (
                  <div
                    key={index}
                    className="segment-divider"
                    style={{ left: `${position}%` }}
                  />
                ) : null;
              })}
            </div>

            <div className="pose-tags">
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

          <img
            src={getPoseImage(currentPose.pose_name)}
            alt={currentPose.pose_name}
            className="reference-image"
          />
        </div>

        <div className="right-section">
          {/* Mobile: Full-screen pose reference (alternates with camera) */}
          <div className={`mobile-pose-view ${mobileShowPose ? 'visible' : 'hidden'}`}>
            <img
              src={getPoseImage(currentPose.pose_name)}
              alt={currentPose.pose_name}
              className="mobile-pose-fullscreen"
            />
            <div className="mobile-pose-label">{currentPose.pose_name}</div>
          </div>

          <div className={`video-wrapper ${mobileShowPose ? 'mobile-hidden' : ''}`} ref={videoContainerRef}>
            <CameraCapture onFrame={handleFrame} isStreaming={isWebSocketReady} />
            {poseResult && poseResult.landmarks && (
              <PoseOverlay
                landmarks={poseResult.landmarks}
                width={videoDimensions.width}
                height={videoDimensions.height}
              />
            )}
          </div>
          <div className="feedback-content">
            <PoseFeedback
              feedback={poseResult?.feedback || []}
              accuracy={poseResult ? Math.round(poseResult.confidence * 5) : null}
            />
          </div>

          {/* Mobile-only: Show warning when disconnected */}
          {!isConnected && (
            <div className="mobile-connection-status disconnected">
              <div className="status-indicator disconnected" />
              <span>Disconnected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveSession;
