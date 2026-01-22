import { Target, ScanFace, MessageCircle } from 'lucide-react';
import aliliLogo from '../../assets/alili-logo.png';
import './Welcome.css';

interface WelcomeProps {
  onGetStarted: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
  // Note: Audio cannot play on Welcome screen due to browser autoplay policy
  // (no prior user interaction). Audio guidance starts on CameraSetup screen.

  return (
    <div className="welcome">
      <div className="welcome-content">
        <img src={aliliLogo} alt="Alili" className="welcome-logo" />
        <h1 className="welcome-title">AI-Powered Yoga</h1>
        <p className="welcome-subtitle">Real-time feedback to perfect your practice</p>

        <div className="welcome-features">
          <div className="feature-card">
            <div className="feature-icon">
              <Target size={48} color="rgba(255,255,255,0.9)" />
            </div>
            <h3>Target Body Areas</h3>
            <p>Select areas for pain relief or improvement</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <ScanFace size={48} color="rgba(255,255,255,0.9)" />
            </div>
            <h3>AI Pose Detection</h3>
            <p>Camera tracks your body in real-time</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <MessageCircle size={48} color="rgba(255,255,255,0.9)" />
            </div>
            <h3>Instant Feedback</h3>
            <p>Get tips to improve your alignment</p>
          </div>
        </div>

        <div className="welcome-demo">
          <div className="demo-placeholder">
            <div className="demo-figure">
              <div className="demo-head"></div>
              <div className="demo-body"></div>
              <div className="demo-arm demo-arm-left"></div>
              <div className="demo-arm demo-arm-right"></div>
              <div className="demo-leg demo-leg-left"></div>
              <div className="demo-leg demo-leg-right"></div>
              <div className="demo-skeleton"></div>
            </div>
            <div className="demo-feedback">
              <span className="demo-stars">★★★★☆</span>
              <span className="demo-tip">Great form!</span>
            </div>
          </div>
        </div>

        <button className="welcome-button" onClick={onGetStarted}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Welcome;
