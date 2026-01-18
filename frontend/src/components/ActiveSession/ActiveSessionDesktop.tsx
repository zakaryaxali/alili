import CameraCapture from '../CameraCapture';
import PoseOverlay from '../PoseOverlay';
import PoseFeedback from '../PoseFeedback';
import PoseTransition from '../PoseTransition';
import SessionControls from '../SessionControls';
import PoseInfoCard from '../PoseInfoCard';
import { getPoseImage } from '../../utils/poseImages';
import type { UseActiveSessionReturn } from '../../hooks/useActiveSession';
import type { YogaSession } from '../../types/session';
import './ActiveSession.shared.css';
import './ActiveSessionDesktop.css';

interface ActiveSessionDesktopProps {
  sessionState: UseActiveSessionReturn;
  session: YogaSession;
}

const ActiveSessionDesktop: React.FC<ActiveSessionDesktopProps> = ({ sessionState, session }) => {
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

  return (
    <div className="active-session-desktop">
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
          <div className="video-wrapper" ref={videoContainerRef}>
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
        </div>
      </div>
    </div>
  );
};

export default ActiveSessionDesktop;
