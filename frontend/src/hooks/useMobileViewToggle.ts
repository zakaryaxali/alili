import { useState, useEffect, useRef } from 'react';

// Mobile alternating view timings (in seconds)
const MOBILE_POSE_INITIAL = 2;  // Show pose first for 2s
const MOBILE_CAMERA_DURATION = 10;  // Then camera for 10s
const MOBILE_POSE_DURATION = 2;  // Then pose for 2s, repeat

interface UseMobileViewToggleParams {
  isPaused: boolean;
  showTransition: boolean;
  currentPoseIndex: number;
}

export function useMobileViewToggle({
  isPaused,
  showTransition,
  currentPoseIndex,
}: UseMobileViewToggleParams) {
  const [mobileShowPose, setMobileShowPose] = useState(true);
  const mobileViewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPoseIndexRef = useRef(currentPoseIndex);

  // Reset to show pose when pose changes (intentional state reset on prop change)
  useEffect(() => {
    if (prevPoseIndexRef.current !== currentPoseIndex) {
      prevPoseIndexRef.current = currentPoseIndex;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMobileShowPose(true);
    }
  }, [currentPoseIndex]);

  // Alternating view timer
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile || isPaused || showTransition) {
      return;
    }

    let isFirstCycle = true;
    let showPose = true;

    const scheduleNext = () => {
      const duration = showPose
        ? (isFirstCycle ? MOBILE_POSE_INITIAL : MOBILE_POSE_DURATION)
        : MOBILE_CAMERA_DURATION;

      mobileViewTimerRef.current = setTimeout(() => {
        isFirstCycle = false;
        showPose = !showPose;
        setMobileShowPose(showPose);
        scheduleNext();
      }, duration * 1000);
    };

    scheduleNext();

    return () => {
      if (mobileViewTimerRef.current) {
        clearTimeout(mobileViewTimerRef.current);
      }
    };
  }, [currentPoseIndex, isPaused, showTransition]);

  return { mobileShowPose };
}
