import { useEffect, useState } from 'react';
import './PoseTransition.css';

interface PoseTransitionProps {
  nextPoseName: string;
  nextPoseDuration: number;
  onComplete: () => void;
}

const TRANSITION_DURATION = 5; // seconds

const PoseTransition: React.FC<PoseTransitionProps> = ({
  nextPoseName,
  nextPoseDuration,
  onComplete
}) => {
  const [countdown, setCountdown] = useState(TRANSITION_DURATION);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  return (
    <div className="pose-transition">
      <div className="transition-content">
        <div className="countdown-circle">
          <svg className="countdown-svg" viewBox="0 0 120 120">
            <circle
              className="countdown-bg"
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="8"
            />
            <circle
              className="countdown-progress"
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#667eea"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - countdown / TRANSITION_DURATION)}`}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="countdown-number">{countdown}</div>
        </div>

        <h2 className="transition-title">Get Ready</h2>

        <div className="next-pose-info">
          <div className="next-label">Next Pose:</div>
          <div className="next-pose-name">{nextPoseName}</div>
          <div className="next-duration">Hold for {formatDuration(nextPoseDuration)}</div>
          <img
            src="/bear-yoga-pose.png"
            alt="Pose Reference"
            className="transition-reference-image"
          />
        </div>

        <div className="breathing-cue">
          <div className="breathing-circle" />
          <p>Take a deep breath</p>
        </div>
      </div>
    </div>
  );
};

export default PoseTransition;
