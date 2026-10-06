/* AppLayout — shared layout with nav + role switcher + dark mode */

import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useFoodLoop, ACTION_TYPES } from '../context/FoodLoopContext.jsx';
import { ROLES, SPEED_OPTIONS } from '../utils/constants.js';
import RoleSwitcher from './RoleSwitcher.jsx';
import './AppLayout.css';

const NAV_ITEMS = {
  [ROLES.RESTAURANT]: [
    { to: '/restaurant', label: 'Dashboard' },
    { to: '/restaurant/post', label: 'Post Surplus' },
    { to: '/restaurant/listings', label: 'Listings' },
    { to: '/restaurant/report', label: 'Report' },
  ],
  [ROLES.RECEIVER]: [
    { to: '/receiver', label: 'Dashboard' },
    { to: '/receiver/offers', label: 'Incoming' },
    { to: '/receiver/history', label: 'History' },
  ],
  [ROLES.VOLUNTEER]: [
    { to: '/volunteer', label: 'Dashboard' },
    { to: '/volunteer/pickups', label: 'Pickups' },
  ],
  [ROLES.ADMIN]: [
    { to: '/admin', label: 'Demo Control' },
  ],
};

export default function AppLayout() {
  const { state, dispatch } = useFoodLoop();
  const navigate = useNavigate();
  const user = state.currentUser;

  const [theme, setTheme] = useState(() => localStorage.getItem('foodloop_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('foodloop_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const navItems = [
    ...(NAV_ITEMS[user.role] || []),
    { to: '/impact', label: 'Impact' },
    { to: '/map', label: 'Map' },
  ];

  function handleLogout() {
    dispatch({ type: ACTION_TYPES.LOGOUT });
    navigate('/');
  }

  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header className="app-nav">
        <div className="app-nav-inner">
          <Link to="/" className="app-logo">
          <img
            src="/images/logo-icon.png"
            alt="FoodLoop Logo"
            className="logo-icon"
          />
          <span className="logo-text">FoodLoop</span>
        </Link>

          <nav className="app-nav-links" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="app-nav-right">
            {/* Speed Simulation Control */}
            <div className="speed-control" aria-label="Demo speed">
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  className={`speed-btn ${state.speed === s ? 'active' : ''}`}
                  onClick={() => dispatch({ type: ACTION_TYPES.SET_SPEED, payload: s })}
                  title={`${s}x simulation speed`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Dark Mode Toggle */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label="Toggle dark mode"
              style={{
                background: 'var(--fl-bg-sunken)',
                border: '1px solid var(--fl-border)',
                borderRadius: 'var(--fl-radius-md)',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px'
              }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Role Switcher */}
            <RoleSwitcher />

            {/* Sign out */}
            <button className="logout-btn" onClick={handleLogout} title="Sign out">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
