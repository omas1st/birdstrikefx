import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="home-container">
      <h2>Welcome to BIRDSTRIKEFX JOURNAL</h2>
      <div className="home-buttons">
        <button className="home-btn" onClick={() => navigate('/setup')}>
          Setup Analysis
        </button>
        <button className="home-btn" onClick={() => navigate('/record-trade')}>
          Record Trade
        </button>
        <button className="home-btn" onClick={() => navigate('/overview')}>
          Overview
        </button>
        <button className="home-btn" onClick={() => navigate('/trades-data')}>
          Trades Data
        </button>
        <button className="home-btn" onClick={() => navigate('/final-analysis')}>
          Final Analysis
        </button>
      </div>
    </div>
  );
};

export default Home;