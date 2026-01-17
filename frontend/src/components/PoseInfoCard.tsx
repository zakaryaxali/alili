import { memo } from 'react';
import type { YogaSession } from '../types/session';

interface PoseInfoCardProps {
  currentPose: YogaSession['poses'][0];
  currentPoseIndex: number;
  totalPoses: number;
  timeRemaining: number;
  session: YogaSession;
}

const PoseInfoCard: React.FC<PoseInfoCardProps> = ({
  currentPose,
  currentPoseIndex,
  totalPoses,
  timeRemaining,
  session,
}) => {
  const totalDuration = session.poses.reduce((sum, p) => sum + p.duration, 0);
  const elapsedDuration = session.poses.slice(0, currentPoseIndex).reduce((sum, p) => sum + p.duration, 0) + (currentPose.duration - timeRemaining);
  const progressPercent = (elapsedDuration / totalDuration) * 100;

  return (
    <div className="info-card pose-name-card">
      <div className="info-main">
        ({currentPoseIndex + 1}/{totalPoses}) {currentPose.pose_name}
      </div>

      <div className="segmented-progress-bar">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        {session.poses.map((_, index) => {
          const segmentStart = session.poses.slice(0, index).reduce((sum, p) => sum + p.duration, 0);
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
  );
};

export default memo(PoseInfoCard);
