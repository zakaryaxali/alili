import { useState, useCallback } from 'react';
import BodyPartSelector from './components/BodyPartSelector';
import SessionConfig from './components/SessionConfig';
import ActiveSession, { type PoseScore } from './components/ActiveSession';
import SessionComplete from './components/SessionComplete';
import { SessionService } from './services/sessionService';
import type { YogaSession, SessionScreen } from './types/session';
import aliliLogo from './assets/alili-logo.png';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState<SessionScreen>('selector');
  const [painAreas, setPainAreas] = useState<string[]>([]);
  const [improvementAreas, setImprovementAreas] = useState<string[]>([]);
  const [currentSession, setCurrentSession] = useState<YogaSession | null>(null);
  const [sessionPoseScores, setSessionPoseScores] = useState<PoseScore[]>([]);

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

  return (
    <div className="app">
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
        />
      )}
    </div>
  );
}

export default App;
