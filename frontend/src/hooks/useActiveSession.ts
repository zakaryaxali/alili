import { useState, useEffect, useRef, useCallback } from 'react';
import { useMobileViewToggle } from './useMobileViewToggle';
import { useSessionTimer } from './useSessionTimer';
import { usePoseScoring, type PoseScore } from './usePoseScoring';
import { PoseWebSocketService } from '../services/websocket';
import { speechService } from '../services/speechService';
import { getWsUrl } from '../services/api';
import type { PoseDetectionResult } from '../types/pose';
import type { YogaSession, SessionPose } from '../types/session';

export interface UseActiveSessionParams {
  session: YogaSession;
  onComplete: (completedPoses: number, totalTime: number, poseScores: PoseScore[]) => void;
  onExit: () => void;
}

export interface UseActiveSessionReturn {
  // State
  currentPoseIndex: number;
  isPaused: boolean;
  showTransition: boolean;
  poseResult: PoseDetectionResult | null;
  isConnected: boolean;
  isWebSocketReady: boolean;
  videoDimensions: { width: number; height: number };
  voiceEnabled: boolean;
  timeRemaining: number;
  mobileShowPose: boolean;

  // Computed
  currentPose: SessionPose;
  totalPoses: number;
  nextPose: SessionPose | null;

  // Refs
  videoContainerRef: React.RefObject<HTMLDivElement | null>;

  // Callbacks
  handleFrame: (imageData: string) => void;
  handleTransitionComplete: () => void;
  handlePause: () => void;
  handleSkip: () => void;
  handleVoiceToggle: () => void;
  handleExit: () => void;
  setVideoDimensions: (dimensions: { width: number; height: number }) => void;
}

export function useActiveSession({
  session,
  onComplete,
  onExit,
}: UseActiveSessionParams): UseActiveSessionReturn {
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
  const nextPose = currentPoseIndex < totalPoses - 1 ? session.poses[currentPoseIndex + 1] : null;

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

  // Voice: Announce first pose on session start (after session start message)
  useEffect(() => {
    if (voiceEnabled && speechService.isSupported() && currentPoseIndex === 0) {
      // Delay slightly so it plays after "Starting your yoga session..." message
      const timer = setTimeout(() => {
        speechService.speakPoseTransition(currentPose.pose_name, currentPose.duration);
      }, 3000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Voice: Announce next pose when transition starts
  useEffect(() => {
    if (voiceEnabled && speechService.isSupported() && showTransition && nextPose) {
      speechService.speakPoseTransition(nextPose.pose_name, nextPose.duration);
    }
  }, [showTransition, voiceEnabled, nextPose]);

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

  return {
    // State
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

    // Computed
    currentPose,
    totalPoses,
    nextPose,

    // Refs
    videoContainerRef,

    // Callbacks
    handleFrame,
    handleTransitionComplete,
    handlePause,
    handleSkip,
    handleVoiceToggle,
    handleExit,
    setVideoDimensions,
  };
}
