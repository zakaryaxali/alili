import { useState } from 'react';
import BodyPartSelector from './components/BodyPartSelector';
import SessionConfig from './components/SessionConfig';
import ActiveSession from './components/ActiveSession';
import { SessionService } from './services/sessionService';
import type { YogaSession, SessionScreen } from './types/session';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState<SessionScreen>('selector');
  const [painAreas, setPainAreas] = useState<string[]>([]);
  const [improvementAreas, setImprovementAreas] = useState<string[]>([]);
  const [currentSession, setCurrentSession] = useState<YogaSession | null>(null);

  const handleBodyPartsSelected = (pain: string[], improvement: string[]) => {
    setPainAreas(pain);
    setImprovementAreas(improvement);
    setCurrentScreen('config');
  };

  const handleSessionStart = (session: YogaSession) => {
    setCurrentSession(session);
    setCurrentScreen('active');
  };

  const handleSessionComplete = async (completedPoses: number, totalTime: number) => {
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
  };

  const handleBackToSelector = () => {
    setCurrentScreen('selector');
  };

  const handleStartNewSession = () => {
    setCurrentSession(null);
    setPainAreas([]);
    setImprovementAreas([]);
    setCurrentScreen('selector');
  };

  return (
    <div className="app">
      {currentScreen === 'selector' && (
        <>
          <header className="app-header">
            <h1>Alili - Yoga Pose Recognition</h1>
            <p>Personalized yoga sessions with real-time AI feedback</p>
          </header>
          <BodyPartSelector onComplete={handleBodyPartsSelected} />
        </>
      )}

      {currentScreen === 'config' && (
        <>
          <header className="app-header">
            <h1>Alili</h1>
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
        />
      )}

      {currentScreen === 'complete' && (
        <div className="session-complete">
          <div className="complete-content">
            <h1>Session Complete!</h1>
            <p className="complete-message">Great work! You've completed your yoga session.</p>

            {currentSession && (
              <div className="complete-stats">
                <div className="stat-card">
                  <div className="stat-value">{currentSession.num_poses}</div>
                  <div className="stat-label">Poses Completed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{currentSession.total_duration}</div>
                  <div className="stat-label">Minutes</div>
                </div>
              </div>
            )}

            <button className="new-session-btn" onClick={handleStartNewSession}>
              Start New Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
