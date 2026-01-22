import { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getPoseImage } from '../../utils/poseImages';
import { useSpeech } from '../../hooks/useSpeech';
import PoseOverlay from '../PoseOverlay';
import './Tutorial.css';

interface TutorialProps {
  onComplete: () => void;
}

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface PoseResult {
  landmarks: Landmark[] | null;
  poseName: string | null;
  confidence: number;
  feedback: string[];
}

const TUTORIAL_STEPS = [
  {
    title: 'See Your Target Pose',
    description:
      'This shows the yoga pose you\'re aiming for. Match your body to this reference.',
    highlight: 'pose-reference',
    audio: 'Step 1. See your target pose. The image shows the yoga pose you are aiming for. Try to match your body to this reference.',
  },
  {
    title: 'Watch Your Skeleton',
    description:
      'The colored lines track your body position in real-time. Green means good alignment!',
    highlight: 'skeleton',
    audio: 'Step 2. Watch your skeleton. The colored lines track your body position in real-time. Green means good alignment.',
  },
  {
    title: 'Check Your Score',
    description:
      'Stars show how well you match the pose. More stars = better alignment!',
    highlight: 'score',
    audio: 'Step 3. Check your score. Stars show how well you match the pose. More stars means better alignment.',
  },
  {
    title: 'Follow the Tips',
    description:
      'Real-time suggestions help you improve your form. Follow them to get more stars!',
    highlight: 'feedback',
    audio: 'Step 4. Follow the tips. Real-time suggestions help you improve your form. Follow them to get more stars.',
  },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPracticing, setIsPracticing] = useState(false);
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });
  const { speak, stop: stopSpeech } = useSpeech();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<number | null>(null);
  const hasSpokenStepRef = useRef<number>(-1);

  const stopFrameCapture = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    stopFrameCapture();
  }, [stopFrameCapture]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const handleVideoLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoDimensions({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = handleVideoLoadedMetadata;
      }
    } catch (err) {
      console.error('Camera access error:', err);
    }
  }, [handleVideoLoadedMetadata]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    socketRef.current.emit('video_frame', {
      image: imageData,
      target_pose: 'Mountain Pose',
    });
  }, []);

  const startFrameCapture = useCallback(() => {
    stopFrameCapture();
    intervalRef.current = window.setInterval(captureFrame, 1000 / 15);
  }, [stopFrameCapture, captureFrame]);

  const connectSocket = useCallback(() => {
    const socket = io(API_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    socket.on('connect', () => {
      console.log('Tutorial: Socket connected');
    });

    socket.on('pose_result', (result: PoseResult) => {
      setLandmarks(result.landmarks);
      setConfidence(result.confidence);
      setFeedback(result.feedback || []);
    });

    socketRef.current = socket;
  }, []);

  const startPractice = useCallback(async () => {
    setIsPracticing(true);
    speak('Practice time! Try holding the Mountain Pose for a few seconds. Match your body to the reference image.');
    connectSocket();
    await startCamera();
  }, [connectSocket, startCamera, speak]);

  useEffect(() => {
    if (isPracticing && streamRef.current) {
      startFrameCapture();
    }
    return () => {
      stopFrameCapture();
    };
  }, [isPracticing, startFrameCapture, stopFrameCapture]);

  useEffect(() => {
    return () => {
      stopCamera();
      disconnectSocket();
      stopSpeech();
    };
  }, [stopCamera, disconnectSocket, stopSpeech]);

  // Speak current step audio
  useEffect(() => {
    if (!isPracticing && hasSpokenStepRef.current !== currentStep) {
      hasSpokenStepRef.current = currentStep;
      speak(TUTORIAL_STEPS[currentStep].audio);
    }
  }, [currentStep, isPracticing, speak]);

  const handleNextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      startPractice();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    stopCamera();
    disconnectSocket();
    onComplete();
  };

  const renderStars = (score: number) => {
    const starCount = Math.round(score * 5);
    return (
      <span className="tutorial-stars">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= starCount ? 'star-filled' : 'star-empty'}>
            ★
          </span>
        ))}
      </span>
    );
  };

  if (isPracticing) {
    return (
      <div className="tutorial tutorial-practice">
        <div className="tutorial-practice-content">
          <h2>Try Mountain Pose</h2>
          <p className="tutorial-practice-subtitle">
            Practice with real-time feedback - no timer, no pressure!
          </p>

          <div className="tutorial-practice-layout">
            <div className="tutorial-pose-reference">
              <h3>Target Pose</h3>
              <img
                src={getPoseImage('Mountain Pose')}
                alt="Mountain Pose"
                className="tutorial-pose-image"
              />
            </div>

            <div className="tutorial-camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="tutorial-video"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {landmarks && (
                <PoseOverlay
                  landmarks={landmarks}
                  width={videoDimensions.width}
                  height={videoDimensions.height}
                />
              )}
            </div>
          </div>

          <div className="tutorial-practice-feedback">
            <div className="tutorial-score">
              {renderStars(confidence)}
              <span className="tutorial-score-percent">
                {Math.round(confidence * 100)}%
              </span>
            </div>
            {feedback.length > 0 && (
              <p className="tutorial-feedback-text">{feedback[0]}</p>
            )}
          </div>

          <button className="tutorial-complete-button" onClick={handleComplete}>
            I'm Ready!
          </button>
        </div>
      </div>
    );
  }

  const step = TUTORIAL_STEPS[currentStep];

  return (
    <div className="tutorial">
      <div className="tutorial-content">
        <div className="tutorial-progress">
          {TUTORIAL_STEPS.map((_, index) => (
            <div
              key={index}
              className={`tutorial-progress-dot ${
                index === currentStep
                  ? 'active'
                  : index < currentStep
                    ? 'completed'
                    : ''
              }`}
            />
          ))}
        </div>

        <h1 className="tutorial-step-title">{step.title}</h1>
        <p className="tutorial-step-description">{step.description}</p>

        <div className="tutorial-demo">
          {step.highlight === 'pose-reference' && (
            <div className="demo-pose-reference">
              <img
                src={getPoseImage('Mountain Pose')}
                alt="Mountain Pose"
                className="demo-pose-image"
              />
              <div className="demo-highlight-ring"></div>
            </div>
          )}

          {step.highlight === 'skeleton' && (
            <div className="demo-skeleton-example">
              <div className="demo-figure-container">
                <svg viewBox="0 0 100 160" className="demo-skeleton-svg">
                  <circle cx="50" cy="15" r="10" fill="none" stroke="#22c55e" strokeWidth="2" />
                  <line x1="50" y1="25" x2="50" y2="70" stroke="#22c55e" strokeWidth="2" />
                  <line x1="50" y1="35" x2="25" y2="55" stroke="#22c55e" strokeWidth="2" />
                  <line x1="50" y1="35" x2="75" y2="55" stroke="#22c55e" strokeWidth="2" />
                  <line x1="50" y1="70" x2="35" y2="120" stroke="#22c55e" strokeWidth="2" />
                  <line x1="50" y1="70" x2="65" y2="120" stroke="#22c55e" strokeWidth="2" />
                  <circle cx="50" cy="15" r="4" fill="#22c55e" />
                  <circle cx="50" cy="35" r="3" fill="#22c55e" />
                  <circle cx="25" cy="55" r="3" fill="#22c55e" />
                  <circle cx="75" cy="55" r="3" fill="#22c55e" />
                  <circle cx="50" cy="70" r="3" fill="#22c55e" />
                  <circle cx="35" cy="120" r="3" fill="#22c55e" />
                  <circle cx="65" cy="120" r="3" fill="#22c55e" />
                </svg>
              </div>
              <p className="demo-skeleton-label">Skeleton overlay tracks your body</p>
            </div>
          )}

          {step.highlight === 'score' && (
            <div className="demo-score-example">
              <div className="demo-stars-row">
                <span className="demo-star star-filled">★</span>
                <span className="demo-star star-filled">★</span>
                <span className="demo-star star-filled">★</span>
                <span className="demo-star star-filled">★</span>
                <span className="demo-star star-empty">★</span>
              </div>
              <p className="demo-score-label">80% - Great alignment!</p>
            </div>
          )}

          {step.highlight === 'feedback' && (
            <div className="demo-feedback-example">
              <div className="demo-feedback-bubble">
                <span className="demo-feedback-icon">💡</span>
                <span>Lower your shoulders slightly</span>
              </div>
              <div className="demo-feedback-bubble secondary">
                <span className="demo-feedback-icon">✨</span>
                <span>Keep your spine straight</span>
              </div>
            </div>
          )}
        </div>

        <div className="tutorial-navigation">
          <button
            className="tutorial-nav-button prev"
            onClick={handlePrevStep}
            disabled={currentStep === 0}
          >
            Back
          </button>
          <button className="tutorial-nav-button next" onClick={handleNextStep}>
            {currentStep === TUTORIAL_STEPS.length - 1 ? 'Try It Out' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
