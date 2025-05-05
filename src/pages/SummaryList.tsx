import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SummaryList.css';

interface SummaryItem {
  id: number;
  summary_text: string;
  original_text: string;
  created_at: string;
}

const SummaryList = () => {
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);
        const userJson = localStorage.getItem('user');
        if (!userJson) {
          navigate('/');
          return;
        }

        const user = JSON.parse(userJson);
        console.log("Fetching summaries for:", user.email);
        
        const response = await fetch(`/api/dashboard/summaries?email=${encodeURIComponent(user.email)}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Received summaries:", data);
          setSummaries(data.summaries || []);
        } else {
          console.error('Failed to fetch summaries:', await response.text());
          setSummaries([]);
        }
      } catch (error) {
        console.error('Error fetching summaries:', error);
        setSummaries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, [navigate]);

  const viewSummary = (summary: SummaryItem) => {
    navigate('/summary', {
      state: {
        summary: summary.summary_text,
        original: summary.original_text,
      },
    });
  };

  return (
    <div className="summary-list-container">
      <h1>Your Summarized Articles</h1>
      
      <button className="back-btn" onClick={() => navigate('/dashboard')}>
        ⬅ Back to Dashboard
      </button>
      
      {loading ? (
        <div className="loading">Loading your summaries...</div>
      ) : summaries.length === 0 ? (
        <div className="no-summaries">
          <p>You haven't summarized any articles yet.</p>
          <button 
            className="create-summary-btn" 
            onClick={() => navigate('/dashboard')}
          >
            Create Your First Summary
          </button>
        </div>
      ) : (
        <div className="summaries-grid">
          {summaries.map((summary) => (
            <div 
              key={summary.id} 
              className="summary-card"
              onClick={() => viewSummary(summary)}
            >
              <div className="summary-date">
                {new Date(summary.created_at).toLocaleDateString()}
              </div>
              <div className="summary-preview">
                {summary.summary_text.substring(0, 150)}...
              </div>
              <div className="view-details">View Details →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SummaryList;
