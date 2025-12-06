import './PoseFeedback.css';

interface PoseFeedbackProps {
  feedback: string[];
}

const PoseFeedback: React.FC<PoseFeedbackProps> = ({ feedback }) => {
  return (
    <div className="pose-feedback">
      <h3>Feedback</h3>
      {feedback && feedback.length > 0 ? (
        <div className="feedback-list">
          <ul>
            {feedback.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="no-feedback">Great form! Maintain this position</p>
      )}
    </div>
  );
};

export default PoseFeedback;
