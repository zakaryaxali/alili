import { useState, useEffect, useRef, useCallback } from 'react';
import CameraCapture from './CameraCapture';
import PoseOverlay from './PoseOverlay';
import PoseFeedback from './PoseFeedback';
import PoseTransition from './PoseTransition';
import SessionControls from './SessionControls';
import PoseInfoCard from './PoseInfoCard';
import { useMobileViewToggle } from '../hooks/useMobileViewToggle';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { usePoseScoring, type PoseScore } from '../hooks/usePoseScoring';
import { PoseWebSocketService } from '../services/websocket';
import { speechService } from '../services/speechService';
import { getWsUrl } from '../services/api';
import type { PoseDetectionResult } from '../types/pose';
import type { YogaSession } from '../types/session';
import { getPoseImage } from '../utils/poseImages';
import './ActiveSession.css';

// Re-export PoseScore for consumers
export type { PoseScore };

interface ActiveSessionProps {
  session: YogaSession;
  onComplete: (completedPoses: number, totalTime: number, poseScores: PoseScore[]) => void;
  onExit: () => void;
}

const ActiveSession: React.FC<ActiveSessionProps> = ({ session, onComplete, onExit }) => {
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [poseResult, setPoseResult] = useState<PoseDetectionResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isWebSocketReady, setIsWebSocketReady] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [videoDimensions, setVideoDimensions] = useState({ width: 1280, height: 720 });
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const wsServiceRef = useRef<PoseWebSocketService | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const lastSpokenFeedbackRef = useRef<string>('');

  const currentPose = session.poses[currentPoseIndex];
  const totalPoses = session.poses.length;

  // Use pose scoring hook
  const { addScore, resetCurrentScores, savePoseScore } = usePoseScoring();

  // Handle time up - transition to next pose or complete session
  const handleTimeUp = useCallback(() => {
    if (currentPoseIndex < totalPoses - 1) {
      setShowTransition(true);
    } else {
      // Session complete - save final pose scores and complete
      const finalScores = savePoseScore(currentPose.pose_name);
      const totalTime = Math.floor((Date.now() - sessionStartTime) / 1000);
      onComplete(totalPoses, totalTime, finalScores);
    }
  }, [currentPoseIndex, totalPoses, savePoseScore, currentPose.pose_name, sessionStartTime, onComplete]);

  // Use session timer hook
  const { timeRemaining, resetTimer } = useSessionTimer({
    initialTime: session.poses[0].duration,
    isPaused,
    isActive: !showTransition,
    onTimeUp: handleTimeUp,
  });

  // Use mobile view toggle hook
  const { mobileShowPose } = useMobileViewToggle({
    isPaused,
    showTransition,
    currentPoseIndex,
  });

  // WebSocket and dimension setup
  useEffect(() => {
    const wsService = new PoseWebSocketService(getWsUrl());
    wsServiceRef.current = wsService;

    wsService.connect(
      (result) => setPoseResult(result),
      (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      },
      (connected) => setIsConnected(connected)
    ).then(() => {
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
    };
  }, []);

  // Voice: Announce session start
  useEffect(() => {
    if (voiceEnabled && speechService.isSupported()) {
      speechService.speakSessionStart(totalPoses);
    }
    return () => speechService.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (poseResult.confidence >= 0.7) return;

    const firstFeedback = poseResult.feedback[0];
    if (firstFeedback && firstFeedback !== lastSpokenFeedbackRef.current) {
      speechService.speakFeedback(firstFeedback);
      lastSpokenFeedbackRef.current = firstFeedback;
    }
  }, [poseResult?.feedback, poseResult?.confidence, voiceEnabled]);

  // Track scores for current pose
  useEffect(() => {
    if (poseResult?.confidence !== undefined) {
      addScore(poseResult.confidence);
    }
  }, [poseResult?.confidence, addScore]);

  // Reset score accumulator when pose changes
  useEffect(() => {
    resetCurrentScores();
  }, [currentPoseIndex, resetCurrentScores]);

  const handleFrame = useCallback((imageData: string) => {
    if (wsServiceRef.current && isConnected) {
      wsServiceRef.current.sendFrame(imageData, currentPose.pose_name);
    }
  }, [isConnected, currentPose.pose_name]);

  const handleTransitionComplete = useCallback(() => {
    savePoseScore(currentPose.pose_name);
    setShowTransition(false);
    const nextIndex = currentPoseIndex + 1;
    setCurrentPoseIndex(nextIndex);
    resetTimer(session.poses[nextIndex].duration);
  }, [savePoseScore, currentPose.pose_name, currentPoseIndex, session.poses, resetTimer]);

  const handlePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleSkip = useCallback(() => {
    if (currentPoseIndex < totalPoses - 1) {
      setShowTransition(true);
    }
  }, [currentPoseIndex, totalPoses]);

  const handleVoiceToggle = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  const handleExit = useCallback(() => {
    const confirmed = window.confirm(
      'Are you sure you want to exit? Your session progress and scores will be lost.'
    );
    if (confirmed) {
      onExit();
    }
  }, [onExit]);

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
          <SessionControls
            isPaused={isPaused}
            voiceEnabled={voiceEnabled}
            canSkip={currentPoseIndex < totalPoses - 1}
            isConnected={isConnected}
            onPause={handlePause}
            onSkip={handleSkip}
            onVoiceToggle={handleVoiceToggle}
            onExit={handleExit}
          />

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

          <PoseInfoCard
            currentPose={currentPose}
            currentPoseIndex={currentPoseIndex}
            totalPoses={totalPoses}
            timeRemaining={timeRemaining}
            session={session}
          />

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
