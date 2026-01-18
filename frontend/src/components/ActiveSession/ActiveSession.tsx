import { useState, useEffect } from 'react';
import { useActiveSession } from '../../hooks/useActiveSession';
import { type PoseScore } from '../../hooks/usePoseScoring';
import ActiveSessionDesktop from './ActiveSessionDesktop';
import ActiveSessionMobile from './ActiveSessionMobile';
import type { YogaSession } from '../../types/session';

// Re-export PoseScore for consumers
export type { PoseScore };

interface ActiveSessionProps {
  session: YogaSession;
  onComplete: (completedPoses: number, totalTime: number, poseScores: PoseScore[]) => void;
  onExit: () => void;
}

const MOBILE_BREAKPOINT = 768;

const ActiveSession: React.FC<ActiveSessionProps> = ({ session, onComplete, onExit }) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sessionState = useActiveSession({ session, onComplete, onExit });

  if (isMobile) {
    return <ActiveSessionMobile sessionState={sessionState} />;
  }

  return <ActiveSessionDesktop sessionState={sessionState} session={session} />;
};

export default ActiveSession;
