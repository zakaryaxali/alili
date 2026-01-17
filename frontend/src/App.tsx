import { useState } from 'react';
import BodyPartSelector from './components/BodyPartSelector';
import SessionConfig from './components/SessionConfig';
import ActiveSession, { type PoseScore } from './components/ActiveSession';
import { SessionService } from './services/sessionService';
import type { YogaSession, SessionScreen } from './types/session';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState<SessionScreen>('selector');
  const [painAreas, setPainAreas] = useState<string[]>([]);
  const [improvementAreas, setImprovementAreas] = useState<string[]>([]);
  const [currentSession, setCurrentSession] = useState<YogaSession | null>(null);
  const [sessionPoseScores, setSessionPoseScores] = useState<PoseScore[]>([]);

  const handleBodyPartsSelected = (pain: string[], improvement: string[]) => {
    setPainAreas(pain);
    setImprovementAreas(improvement);
    setCurrentScreen('config');
  };

  const handleSessionStart = (session: YogaSession) => {
    setCurrentSession(session);
    setCurrentScreen('active');
  };

  const handleSessionComplete = async (completedPoses: number, totalTime: number, poseScores: PoseScore[]) => {
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
  };

  const handleBackToSelector = () => {
    setCurrentScreen('selector');
  };

  const handleExitSession = () => {
    setCurrentSession(null);
    setPainAreas([]);
    setImprovementAreas([]);
    setCurrentScreen('selector');
  };

  const handleStartNewSession = () => {
    setCurrentSession(null);
    setPainAreas([]);
    setImprovementAreas([]);
    setSessionPoseScores([]);
    setCurrentScreen('selector');
  };

  const getScoreLabel = (score: number): { label: string; className: string } => {
    const rounded = Math.round(score * 5);
    if (rounded >= 4) return { label: 'Excellent', className: 'excellent' };
    if (rounded >= 3) return { label: 'Good', className: 'good' };
    if (rounded >= 2) return { label: 'Fair', className: 'fair' };
    return { label: 'Needs Work', className: 'needs-work' };
  };

  const getOverallScore = (): number => {
    if (sessionPoseScores.length === 0) return 0;
    const total = sessionPoseScores.reduce((sum, p) => sum + p.averageScore, 0);
    return total / sessionPoseScores.length;
  };

  return (
    <div className="app">
      {currentScreen === 'selector' && (
        <>
          <header className="app-header">
            <h1>Alili</h1>
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
          onExit={handleExitSession}
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
                {sessionPoseScores.length > 0 && (
                  <div className="stat-card">
                    <div className={`stat-value score-${getScoreLabel(getOverallScore()).className}`}>
                      {Math.round(getOverallScore() * 100)}%
                    </div>
                    <div className="stat-label">Overall Score</div>
                  </div>
                )}
              </div>
            )}

            {sessionPoseScores.length > 0 && (
              <div className="pose-scores-section">
                <h2>Per-Pose Breakdown</h2>
                <div className="pose-scores-list">
                  {sessionPoseScores.map((poseScore, index) => {
                    const { label, className } = getScoreLabel(poseScore.averageScore);
                    return (
                      <div key={index} className={`pose-score-item score-${className}`}>
                        <span className="pose-score-name">{poseScore.poseName}</span>
                        <span className="pose-score-value">
                          {Math.round(poseScore.averageScore * 100)}% - {label}
                        </span>
                      </div>
                    );
                  })}
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
