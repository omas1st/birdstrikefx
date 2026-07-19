import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import './Header.css';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const location = useLocation();

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="journal-name">
          BIRDSTRIKEFX
        </Link>
      </div>

      {/* Hamburger Menu Button */}
      <div className="header-center" ref={menuRef}>
        <button
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        {menuOpen && (
          <nav className="dropdown-nav">
            <Link to="/setup" className="nav-link" onClick={() => setMenuOpen(false)}>Setup Analysis</Link>
            <Link to="/record-trade" className="nav-link" onClick={() => setMenuOpen(false)}>Record Trade</Link>
            <Link to="/overview" className="nav-link" onClick={() => setMenuOpen(false)}>Overview</Link>
            <Link to="/trades-data" className="nav-link" onClick={() => setMenuOpen(false)}>Trades Data</Link>
            <Link to="/final-analysis" className="nav-link" onClick={() => setMenuOpen(false)}>Final Analysis</Link>
          </nav>
        )}
      </div>

      {/* Notification Bell */}
      <div className="header-right" ref={notifRef}>
        <button
          className="notification-bell"
          onClick={() => setNotifOpen((prev) => !prev)}
        >
          🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>

        {notifOpen && (
          <div className="notification-dropdown">
            <div className="dropdown-header">
              <h4>Notifications</h4>
              {notifications.length > 0 && (
                <button onClick={() => markAllAsRead()}>Mark all read</button>
              )}
            </div>
            <ul className="notification-list">
              {notifications.length === 0 ? (
                <li className="no-notifications">No notifications</li>
              ) : (
                notifications.map((notif) => (
                  <li
                    key={notif._id}
                    className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                    onClick={() => markAsRead(notif._id)}
                  >
                    <p>{notif.message}</p>
                    <small>{new Date(notif.createdAt).toLocaleString()}</small>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;