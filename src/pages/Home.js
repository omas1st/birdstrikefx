import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const VALID_PINS = ['6812', '5623', '0682'];
const CONTACT_EMAIL = 'birdstrikefx@gmail.com';

// Mapping of button label to route and lock state
const BUTTONS = [
  { label: 'Setup Analysis', route: '/setup', locked: true },
  { label: 'Record Trade', route: '/record-trade', locked: true },
  { label: 'Overview', route: '/overview', locked: true },
  { label: 'Trades Data', route: '/trades-data', locked: true },
  { label: 'Final Analysis', route: '/final-analysis', locked: true },
  { label: 'Performance', route: '/performance', locked: false },
  { label: 'Calendar', route: '/performance-calendar', locked: false },
];

const Home = () => {
  const navigate = useNavigate();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [pendingRoute, setPendingRoute] = useState(null);

  const handleButtonClick = (button) => {
    if (button.locked) {
      setPendingRoute(button.route);
      setPin('');
      setError('');
      setShowPinModal(true);
    } else {
      navigate(button.route);
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (VALID_PINS.includes(pin.trim())) {
      setShowPinModal(false);
      setPin('');
      setError('');
      if (pendingRoute) navigate(pendingRoute);
      setPendingRoute(null);
    } else {
      setError(`Incorrect PIN. Contact ${CONTACT_EMAIL} to access this page.`);
    }
  };

  const handleCloseModal = () => {
    setShowPinModal(false);
    setPin('');
    setError('');
    setPendingRoute(null);
  };

  return (
    <div className="home-container">
      <h2>Welcome to BIRDSTRIKEFX JOURNAL</h2>
      <div className="home-buttons">
        {BUTTONS.map((button) => (
          <button
            key={button.route}
            className={`home-btn ${button.locked ? 'locked' : ''}`}
            onClick={() => handleButtonClick(button)}
          >
            {button.label}
            {button.locked && <span className="lock-icon">🔒</span>}
          </button>
        ))}
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content pin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Enter PIN</h3>
            <p className="pin-hint">This page is protected. Enter your PIN to continue.</p>
            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                className="pin-input"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                maxLength={6}
                autoFocus
              />
              {error && <p className="pin-error">{error}</p>}
              <div className="pin-actions">
                <button type="submit" className="pin-submit-btn">Unlock</button>
                <button type="button" className="pin-cancel-btn" onClick={handleCloseModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;