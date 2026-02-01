import { useState, useCallback } from 'react';
import BodyPartSelector from './components/BodyPartSelector';
import SessionConfig from './components/SessionConfig';
import ActiveSession, { type PoseScore } from './components/ActiveSession';
import SessionComplete from './components/SessionComplete';
import Welcome from './components/Welcome/Welcome';
import CameraSetup from './components/CameraSetup/CameraSetup';
import Tutorial from './components/Tutorial/Tutorial';
import Settings from './components/Settings/Settings';
import SettingsButton from './components/Settings/SettingsButton';
import { useOnboarding } from './hooks/useOnboarding';
import { SessionService } from './services/sessionService';
import type { YogaSession, SessionScreen } from './types/session';
import aliliLogo from './assets/alili-logo.png';
import './App.css';

function App() {
  const { state: onboardingState, completeOnboarding, resetOnboarding, toggleTips, incrementSessions } = useOnboarding();
  const [currentScreen, setCurrentScreen] = useState<SessionScreen>(() =>
    onboardingState.isFirstTime ? 'welcome' : 'selector'
  );
  const [painAreas, setPainAreas] = useState<string[]>([]);
  const [improvementAreas, setImprovementAreas] = useState<string[]>([]);
  const [currentSession, setCurrentSession] = useState<YogaSession | null>(null);
  const [sessionPoseScores, setSessionPoseScores] = useState<PoseScore[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const handleBodyPartsSelected = useCallback((pain: string[], improvement: string[]) => {
    setPainAreas(pain);
    setImprovementAreas(improvement);
    setCurrentScreen('config');
  }, []);

  const handleSessionStart = useCallback((session: YogaSession) => {
    setCurrentSession(session);
    setCurrentScreen('active');
  }, []);

  const handleSessionComplete = useCallback(async (completedPoses: number, totalTime: number, poseScores: PoseScore[]) => {
    setSessionPoseScores(poseScores);
    if (currentSession) {
      try {
        await SessionService.completeSession(currentSession.id, {
          completed_poses: completedPoses,
          total_time: totalTime
        });
      } catch (error) {
        console.error('Failed to mark session as complete:', error);
      }
    }
    setCurrentScreen('complete');
  }, [currentSession]);

  const handleBackToSelector = useCallback(() => {
    setCurrentScreen('selector');
  }, []);

  const handleExitSession = useCallback(() => {
    setCurrentSession(null);
    setPainAreas([]);
    setImprovementAreas([]);
    setCurrentScreen('selector');
  }, []);

  const handleStartNewSession = useCallback(() => {
    setCurrentSession(null);
    setPainAreas([]);
    setImprovementAreas([]);
    setSessionPoseScores([]);
    setCurrentScreen('selector');
  }, []);

  const handleWelcomeComplete = useCallback(() => {
    setCurrentScreen('camera-setup');
  }, []);

  const handleCameraSetupComplete = useCallback(() => {
    setCurrentScreen('tutorial');
  }, []);

  const handleTutorialComplete = useCallback(() => {
    completeOnboarding();
    setCurrentScreen('selector');
  }, [completeOnboarding]);

  const handleRewatchTutorial = useCallback(() => {
    setShowSettings(false);
    setCurrentScreen('welcome');
  }, []);

  const handleResetOnboarding = useCallback(() => {
    resetOnboarding();
    setShowSettings(false);
    setCurrentScreen('welcome');
  }, [resetOnboarding]);

  const showSettingsButton = currentScreen !== 'active' && currentScreen !== 'complete';

  return (
    <div className="app">
      {showSettingsButton && (
        <SettingsButton onClick={() => setShowSettings(true)} />
      )}

      {showSettings && (
        <Settings
          showTips={onboardingState.showTips}
          sessionsCompleted={onboardingState.sessionsCompleted}
          onToggleTips={toggleTips}
          onRewatchTutorial={handleRewatchTutorial}
          onResetOnboarding={handleResetOnboarding}
          onClose={() => setShowSettings(false)}
        />
      )}

      {currentScreen === 'welcome' && (
        <Welcome onGetStarted={handleWelcomeComplete} />
      )}

      {currentScreen === 'camera-setup' && (
        <CameraSetup onContinue={handleCameraSetupComplete} />
      )}

      {currentScreen === 'tutorial' && (
        <Tutorial onComplete={handleTutorialComplete} />
      )}

      {currentScreen === 'selector' && (
        <>
          <header className="app-header">
            <img src={aliliLogo} alt="Alili" className="app-logo" />
            <p>Personalized yoga sessions with real-time AI feedback</p>
          </header>
          <BodyPartSelector onComplete={handleBodyPartsSelected} />
        </>
      )}

      {currentScreen === 'config' && (
        <>
          <header className="app-header">
            <img src={aliliLogo} alt="Alili" className="app-logo" />
          </header>
          <SessionConfig
            painAreas={painAreas}
            improvementAreas={improvementAreas}
            onStart={handleSessionStart}
            onBack={handleBackToSelector}
          />
        </>
      )}

      {currentScreen === 'active' && currentSession && (
        <ActiveSession
          session={currentSession}
          onComplete={handleSessionComplete}
          onExit={handleExitSession}
        />
      )}

      {currentScreen === 'complete' && (
        <SessionComplete
          session={currentSession}
          poseScores={sessionPoseScores}
          onNewSession={handleStartNewSession}
          onSessionComplete={incrementSessions}
        />
      )}
    </div>
  );
}

export default App;
