import CameraCapture from '../CameraCapture';
import PoseOverlay from '../PoseOverlay';
import PoseFeedback from '../PoseFeedback';
import PoseTransition from '../PoseTransition';
import SessionControls from '../SessionControls';
import OrientationBadge from '../OrientationBadge';
import type { UseActiveSessionReturn } from '../../hooks/useActiveSession';
import { getPoseImage } from '../../utils/poseImages';
import './ActiveSession.shared.css';
import './ActiveSessionMobile.css';

interface ActiveSessionMobileProps {
  sessionState: UseActiveSessionReturn;
}

const ActiveSessionMobile: React.FC<ActiveSessionMobileProps> = ({ sessionState }) => {
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
    mobileShowPose,
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

  return (
    <div className="active-session-mobile">
      <div className="mobile-camera-container">
        <div className="mobile-video-wrapper" ref={videoContainerRef}>
          <CameraCapture onFrame={handleFrame} isStreaming={isWebSocketReady} />
          {poseResult && poseResult.landmarks && (
            <PoseOverlay
              landmarks={poseResult.landmarks}
              width={videoDimensions.width}
              height={videoDimensions.height}
            />
          )}
        </div>

        {/* Header overlay with pose info and feedback */}
        <div className="mobile-pose-header">
          <div className="mobile-pose-info">
            <div className="mobile-pose-name-row">
              <div className="mobile-pose-name">{currentPose.pose_name}</div>
              <OrientationBadge
                poseName={currentPose.pose_name}
                isValid={poseResult?.orientationValid ?? true}
              />
            </div>
            <div className="mobile-pose-progress">
              Pose {currentPoseIndex + 1} of {totalPoses} • {timeRemaining}s
            </div>
          </div>
          <div className="mobile-feedback">
            <PoseFeedback
              feedback={poseResult?.feedback || []}
              accuracy={
                poseResult?.confidence !== null && poseResult?.confidence !== undefined
                  ? Math.round(poseResult.confidence * 5)
                  : null
              }
              orientationValid={poseResult?.orientationValid ?? true}
            />
          </div>
        </div>

        {/* Logo at bottom right */}
        <img src="/favicon.png" alt="Alili" className="mobile-logo" />

        {/* Pose reference overlay - expands from logo */}
        <div className={`mobile-pose-overlay ${mobileShowPose ? 'visible' : 'hidden'}`}>
          <img
            src={getPoseImage(currentPose.pose_name)}
            alt={currentPose.pose_name}
            className="mobile-pose-image"
          />
        </div>

        {/* Controls overlay at bottom */}
        <SessionControls
          isPaused={isPaused}
          voiceEnabled={voiceEnabled}
          canSkip={currentPoseIndex < totalPoses - 1}
          isConnected={isConnected}
          onPause={handlePause}
          onSkip={handleSkip}
          onVoiceToggle={handleVoiceToggle}
          onExit={handleExit}
          className="mobile-session-controls"
        />

        {/* Show warning when disconnected */}
        {!isConnected && (
          <div className="mobile-connection-status disconnected">
            <div className="status-indicator disconnected" />
            <span>Disconnected</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSessionMobile;
