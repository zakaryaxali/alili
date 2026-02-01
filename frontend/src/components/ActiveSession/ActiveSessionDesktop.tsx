import CameraCapture from '../CameraCapture';
import PoseOverlay from '../PoseOverlay';
import PoseFeedback from '../PoseFeedback';
import PoseTransition from '../PoseTransition';
import SessionControls from '../SessionControls';
import OrientationBadge from '../OrientationBadge';
import { getPoseImage } from '../../utils/poseImages';
import type { UseActiveSessionReturn } from '../../hooks/useActiveSession';
import type { YogaSession } from '../../types/session';
import './ActiveSession.shared.css';
import './ActiveSessionDesktop.css';

interface ActiveSessionDesktopProps {
  sessionState: UseActiveSessionReturn;
  session: YogaSession;
}

const ActiveSessionDesktop: React.FC<ActiveSessionDesktopProps> = ({ sessionState }) => {
  const {
    currentPoseIndex,
    isPaused,
    showTransition,
    poseResult,
    isConnected,
    isWebSocketReady,
    videoDimensions,
    voiceEnabled,
    timeRemaining,
    currentPose,
    totalPoses,
    nextPose,
    videoContainerRef,
    handleFrame,
    handleTransitionComplete,
    handlePause,
    handleSkip,
    handleVoiceToggle,
    handleExit,
  } = sessionState;

  if (showTransition && nextPose) {
    return (
      <PoseTransition
        nextPoseName={nextPose.pose_name}
        nextPoseDuration={nextPose.duration}
        onComplete={handleTransitionComplete}
      />
    );
  }

  const feedback = poseResult?.feedback || [];
  const accuracy =
    poseResult?.confidence !== null && poseResult?.confidence !== undefined
      ? Math.round(poseResult.confidence * 5)
      : null;
  const orientationValid = poseResult?.orientationValid ?? true;

  return (
    <div className="active-session-desktop">
      {/* Left Sidebar - Always visible pose reference */}
      <aside className="desktop-sidebar">
        <img
          src={getPoseImage(currentPose.pose_name)}
          alt={currentPose.pose_name}
          className="desktop-pose-reference"
        />
      </aside>

      {/* Camera Container with overlays */}
      <div className="desktop-camera-container">
        <div className="desktop-video-wrapper" ref={videoContainerRef}>
          <CameraCapture onFrame={handleFrame} isStreaming={isWebSocketReady} />
          {poseResult && poseResult.landmarks && (
            <PoseOverlay
              landmarks={poseResult.landmarks}
              width={videoDimensions.width}
              height={videoDimensions.height}
            />
          )}
        </div>

        {/* Header overlay - pose info */}
        <div className="desktop-header-overlay">
          <div className="desktop-pose-info">
            <div className="desktop-pose-name-row">
              <span className="desktop-pose-name">{currentPose.pose_name}</span>
              <OrientationBadge poseName={currentPose.pose_name} isValid={orientationValid} />
            </div>
            <span className="desktop-pose-progress">
              {currentPoseIndex + 1}/{totalPoses} • {timeRemaining}s
            </span>
          </div>
          <PoseFeedback
            feedback={feedback}
            accuracy={accuracy}
            orientationValid={orientationValid}
          />
        </div>

        {/* Controls overlay */}
        <SessionControls
          isPaused={isPaused}
          voiceEnabled={voiceEnabled}
          canSkip={currentPoseIndex < totalPoses - 1}
          isConnected={isConnected}
          onPause={handlePause}
          onSkip={handleSkip}
          onVoiceToggle={handleVoiceToggle}
          onExit={handleExit}
          className="desktop-controls-overlay"
        />

        {/* Connection warning */}
        {!isConnected && (
          <div className="desktop-connection-status">
            <div className="status-indicator disconnected" />
            <span>Disconnected</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSessionDesktop;
