/* RoleSwitcher — quick role-change dropdown for demo */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFoodLoop, ACTION_TYPES } from '../context/FoodLoopContext.jsx';
import { DEMO_ACCOUNTS } from '../context/seed.js';
import { ROLES } from '../utils/constants.js';
import './RoleSwitcher.css';

const ROLE_COLORS = {
  [ROLES.RESTAURANT]: 'var(--fl-gold)',
  [ROLES.RECEIVER]: 'var(--fl-green)',
  [ROLES.VOLUNTEER]: 'var(--fl-teal-light)',
  [ROLES.ADMIN]: 'var(--fl-red)',
};

const ROLE_LABELS = {
  [ROLES.RESTAURANT]: 'Restaurant',
  [ROLES.RECEIVER]: 'Receiver',
  [ROLES.VOLUNTEER]: 'Volunteer',
  [ROLES.ADMIN]: 'Admin',
};

const ROLE_ROUTES = {
  [ROLES.RESTAURANT]: '/restaurant',
  [ROLES.RECEIVER]: '/receiver',
  [ROLES.VOLUNTEER]: '/volunteer',
  [ROLES.ADMIN]: '/admin',
};

export default function RoleSwitcher() {
  const { state, dispatch } = useFoodLoop();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentUser = state.currentUser;

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(account) {
    dispatch({
      type: ACTION_TYPES.SET_USER,
      payload: { id: account.id, role: account.role, name: account.name },
    });
    setOpen(false);
    navigate(ROLE_ROUTES[account.role]);
  }

  if (!currentUser) return null;

  const dotColor = ROLE_COLORS[currentUser.role] || 'var(--fl-text-muted)';

  return (
    <div className="role-switcher" ref={ref}>
      <button
        className="role-switcher-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        id="role-switcher-btn"
      >
        <span className="role-dot" style={{ background: dotColor }} />
        <span className="role-name">{currentUser.name}</span>
        <span className="role-badge">{ROLE_LABELS[currentUser.role]}</span>
        <svg className="role-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="role-switcher-menu" role="listbox" aria-labelledby="role-switcher-btn">
          {Object.values(ROLES).map((role) => (
            <li key={role} className="role-group-label">
              {ROLE_LABELS[role]}
            </li>
          )).length && Object.values(ROLES).map((role) => {
            const accounts = DEMO_ACCOUNTS.filter((a) => a.role === role);
            return (
              <li key={role}>
                <div className="role-group-label">{ROLE_LABELS[role]}</div>
                <ul>
                  {accounts.map((account) => (
                    <li key={account.id}>
                      <button
                        className={`role-option ${currentUser.id === account.id ? 'active' : ''}`}
                        onClick={() => handleSelect(account)}
                        role="option"
                        aria-selected={currentUser.id === account.id}
                      >
                        <span className="role-dot-sm" style={{ background: ROLE_COLORS[account.role] }} />
                        <div>
                          <div className="role-option-name">{account.name}</div>
                          <div className="role-option-sub">{account.subtitle}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
