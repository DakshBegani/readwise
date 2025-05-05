import React, { useEffect, useState } from 'react';
import {
  faBookOpen,
  faQuestionCircle,
  faChartLine,
  faLightbulb,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { suggestions, ArticleSuggestion } from '../data/articleSuggestions';

interface Feature {
  icon: IconDefinition;
  title: string;
  desc: string;
  value?: number | string; // Add value property to display counts
}

interface FeatureItemProps {
  feature: Feature;
  onClick?: () => void;
}

interface UserData {
  name: string;
  email: string;
  picture: string;
}

const FeatureItem = ({ feature, onClick }: FeatureItemProps) => (
  <div className={`feature-item ${onClick ? 'clickable' : ''}`} onClick={onClick}>
    <div className="icon-container">
      <FontAwesomeIcon icon={feature.icon} size="lg" />
    </div>
    <h4 className="feature-title">{feature.title}</h4>
    <p className="feature-desc">{feature.desc}</p>
    {feature.value !== undefined && (
      <div className="feature-value">{feature.value}</div>
    )}
  </div>
);

const Dashboard = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [input, setInput] = useState('');
  const [randomSuggestion, setRandomSuggestion] = useState<ArticleSuggestion | null>(null);
  const [summaryCount, setSummaryCount] = useState(0);
  const navigate = useNavigate();

  // Define features with dynamic count for articles summarized
  const features: Feature[] = [
    {
      icon: faBookOpen,
      title: "Articles Summarised",
      desc: "Track the number of articles you've read and summarized using ReadWise.",
      value: summaryCount,
    },
    {
      icon: faQuestionCircle,
      title: "Quizzes Taken",
      desc: "Review your quiz activity and test your understanding over time.",
      value: 0,
    },
    {
      icon: faChartLine,
      title: "Weekly Streak",
      desc: "Maintain a consistent habit with our daily summaries and get rewarded.",
      value: 0,
    },
    {
      icon: faLightbulb,
      title: "Suggested Article",
      desc: "Here's something new to read today! Click to begin your journey of learning.",
    },
  ];

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      navigate('/');
      return;
    }

    try {
      const user = JSON.parse(userJson);
      setUserData(user);
      
      // Fetch summary count from backend
      fetchSummaryCount(user.email);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/');
    }

    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    setRandomSuggestion(suggestion);
  }, [navigate]);

  // Function to fetch summary count from backend
  const fetchSummaryCount = async (email: string) => {
    try {
      const response = await fetch(`/api/dashboard/metrics?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        setSummaryCount(data.total_summaries || 0);
      } else {
        console.error('Failed to fetch summary count');
        // Set a default value if fetch fails
        setSummaryCount(0);
      }
    } catch (error) {
      console.error('Error fetching summary count:', error);
      setSummaryCount(0);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      alert('Please enter some content to summarize');
      return;
    }

    try {
      console.log('Submitting content for summarization...');
      
      // Get user email from localStorage
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        navigate('/');
        return;
      }
      const user = JSON.parse(userJson);
      const userEmail = user.email;
      
      // Show loading state
      setShowModal(true);
      
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: input,
          user_email: userEmail
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error:', res.status, errorText);
        throw new Error(`Server responded with ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log('Summarization successful:', data);
      
      // Close modal and clear input
      setShowModal(false);
      setInput('');

      // Increment summary count locally
      setSummaryCount(prevCount => prevCount + 1);

      // Navigate to summary display page
      navigate('/summary', {
        state: {
          summary: data.summary,
          original: input,
        },
      });
    } catch (err) {
      console.error('Error submitting:', err);
      alert(`❌ Failed to summarize: ${err}`);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="color-panel">
        <div className="profile-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {userData?.picture ? (
              <img src={userData.picture} alt="Profile" className="profile-image" />
            ) : (
              <div className="profile-placeholder">
                {userData?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div className="user-info">
              <div className="user-name">{userData?.name || 'User'}</div>
              <div className="user-email">{userData?.email || ''}</div>
            </div>
          </div>

          <button className="upload-article-btn" onClick={() => setShowModal(true)}>
            + Add Article
          </button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="features-grid">
        {features.map((feature, index) => (
          <div className="feature-grid-item" key={index}>
            {index === 0 ? (
              // Make the first card (Articles Summarised) clickable
              <FeatureItem 
                feature={feature} 
                onClick={() => navigate('/summaries')} 
              />
            ) : (
              <FeatureItem feature={feature} />
            )}
            {index === 3 && randomSuggestion && (
              <div className="suggestion-box">
                <a href={randomSuggestion.link} target="_blank" rel="noopener noreferrer">
                  👉 {randomSuggestion.title}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📄 Submit an Article</h3>
            <textarea
              rows={6}
              placeholder="Paste article content or URL here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleSubmit} className="submit-btn">Summarize</button>
              <button onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
