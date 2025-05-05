import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Summary.css';

const Summary = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { summary, original } = location.state || {};

  useEffect(() => {
    // Log what we received for debugging
    console.log("Summary page received state:", location.state);
    
    // If no data, redirect after a short delay
    if (!summary && !original) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [summary, original, navigate, location.state]);

  if (!summary || !original) {
    return (
      <div className="summary-container">
        <h2>⚠️ No data to display</h2>
        <p>Please return to the dashboard and submit an article first.</p>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ⬅ Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="summary-container">
      <h1>🧠 Article Summary</h1>

      <div className="summary-section">
        <h3>✨ Summary</h3>
        <p className="summary-text">{summary}</p>
      </div>

      <div className="original-section">
        <h3>📄 Original Content</h3>
        <pre className="original-text">{original}</pre>
      </div>

      <button className="back-btn" onClick={() => navigate('/dashboard')}>
        ⬅ Back to Dashboard
      </button>
    </div>
  );
};

export default Summary;
