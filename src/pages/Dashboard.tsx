import React, { useEffect, useState } from 'react';
import {
  faFileAlt,
  faNoteSticky,
  faClock,
  faLightbulb,
  faSignOutAlt,
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
      <div className={`feature-value ${feature.title === "Time Spent Reading" ? 'time-value' : ''}`}>
        {feature.title === "Time Spent Reading" && feature.value === "No time tracked yet" ? (
          <span className="no-time-message">Start reading to track time</span>
        ) : (
          feature.value
        )}
      </div>
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
  const features: Feature[] = [
    {
      icon: faFileAlt,
      title: "Articles Summarised",
      desc: "Track the number of articles you've read and summarized using ReadWise.",
      value: summaryCount,
    },
    {
      icon: faNoteSticky,
      title: "Notes Created",
      desc: "Capture takeaways, reflections, or ideas sparked by your reading. Convert summaries into personal knowledge.",
      value: 0,
    },
    {
      icon: faClock,
      title: "Time Spent Reading",
      desc: "See how much focused time you've invested in learning. Build a consistent reading habit at your own pace.",
      value: "No time tracked yet",
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
      
      // Try different approaches to connect to the backend
      let response;
      try {
        // First try with relative URL (relies on proxy)
        response = await fetch('/api/summarize/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content: input,
            user_email: userEmail
          }),
        });
      } catch (e) {
        console.log('Relative URL failed, trying absolute URL:', e);
        // If that fails, try with absolute URL
        response = await fetch('http://localhost:8000/api/summarize/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            content: input,
            user_email: userEmail
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Summarization successful:', data);
      
      // Close modal and clear input
      setShowModal(false);
      setInput('');

      // Increment summary count locally
      setSummaryCount(prevCount => prevCount + 1);

      // Navigate to summary display page with the data
      navigate('/summary', {
        state: {
          summary: data.summary,
          original: input,
        },
      });
    } catch (err) {
      console.error('Error submitting:', err);
      // Show more detailed error and close modal
      alert(`❌ Failed to summarize: ${err}`);
      setShowModal(false);
    }
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    
    // Redirect to login page
    navigate('/');
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

          <div className="dashboard-actions">
            <button className="upload-article-btn" onClick={() => setShowModal(true)}>
              + Add Article
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} /> Logout
            </button>
          </div>
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
