/* Login — role picker with Login or Register forms for Restaurant, Receiver, Volunteer, Admin */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFoodLoop, ACTION_TYPES } from '../context/FoodLoopContext.jsx';
import { DEMO_ACCOUNTS } from '../context/seed.js';
import { ROLES, FOOD_CATEGORIES } from '../utils/constants.js';
import { authApi } from '../services/api.js';
import './Login.css';

const ROLE_META = {
  [ROLES.RESTAURANT]: {
    label: 'Restaurant / Hotel',
    desc: 'List surplus batches, recover costs & track tax savings',
    color: 'var(--fl-gold)',
    icon: '🍽️',
    route: '/restaurant',
  },
  [ROLES.RECEIVER]: {
    label: 'Charity / Recipient Home',
    desc: 'Receive hot meals, children & elders food donations',
    color: 'var(--fl-green)',
    icon: '🏠',
    route: '/receiver',
  },
  [ROLES.VOLUNTEER]: {
    label: 'Volunteer Courier',
    desc: 'Transport meals safely with digital temperature logs',
    color: 'var(--fl-teal-light)',
    icon: '🚴',
    route: '/volunteer',
  },
  [ROLES.ADMIN]: {
    label: 'Platform Admin',
    desc: 'Simulate live demo clock, manage users & inspect sync',
    color: 'var(--fl-red)',
    icon: '⚙️',
    route: '/admin',
  },
};

const COLOMBO_AREAS = [
  'Colombo 01 - Fort',
  'Colombo 02 - Slave Island',
  'Colombo 03 - Kollupitiya',
  'Colombo 04 - Bambalapitiya',
  'Colombo 05 - Havelock Town',
  'Colombo 07 - Cinnamon Gardens',
  'Colombo 08 - Borella',
  'Dehiwala - Mount Lavinia',
  'Malabe',
  'Nugegoda',
  'Moratuwa',
  'Kalutara South',
];

function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  required = true,
  autoComplete = 'current-password',
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        type={show ? 'text' : 'password'}
        required={required}
        className="fl-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShow((prev) => !prev)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
      >
        {show ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function Login() {
  const { state, dispatch } = useFoodLoop();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Sign In inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Generic Registration credentials
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Restaurant Registration
  const [restName, setRestName] = useState('');
  const [restArea, setRestArea] = useState(COLOMBO_AREAS[5]);
  const [restCuisine, setRestCuisine] = useState('Hotel Buffet & Dining');

  // Receiver Registration
  const [recName, setRecName] = useState('');
  const [recType, setRecType] = useState('childrens_home');
  const [recArea, setRecArea] = useState(COLOMBO_AREAS[7]);
  const [recCapacity, setRecCapacity] = useState(60);
  const [recCategories, setRecCategories] = useState(['cooked', 'bakery']);

  // Volunteer Registration
  const [volName, setVolName] = useState('');
  const [volVehicle, setVolVehicle] = useState('Motorbike / Scooter');
  const [volArea, setVolArea] = useState(COLOMBO_AREAS[4]);
  const [volPhone, setVolPhone] = useState('077 123 4567');

  function handleSelectRole(role) {
    setSelectedRole(role);
    setAuthMode('login');
    setLoginEmail('');
    setLoginPassword('');
    setRegEmail('');
    setRegPassword('');
    setAuthError('');
    setAuthSuccess('');
  }

  // Quick Demo Autofill Helper
  async function handleQuickFillDemo(account) {
    const email = account.email || `${account.id}@foodloop.lk`;
    const password = 'password123';
    setLoginEmail(email);
    setLoginPassword(password);
    setAuthError('');

    try {
      const res = await authApi.login({ email, password, role: account.role });
      if (res && res.user) {
        dispatch({
          type: ACTION_TYPES.SET_USER,
          payload: { id: res.user.id, role: res.user.role, name: res.user.name },
        });
        navigate(ROLE_META[account.role].route);
        return;
      }
    } catch {
      // Offline fallback
    }

    dispatch({
      type: ACTION_TYPES.SET_USER,
      payload: { id: account.id, role: account.role, name: account.name },
    });
    navigate(ROLE_META[account.role].route);
  }

  // Handle Login submission
  async function handleLoginSubmit(e) {
    e.preventDefault();
    if (!selectedRole) return;
    setAuthError('');
    setLoading(true);

    const email = loginEmail.trim() || (selectedRole === ROLES.ADMIN ? 'admin@foodloop.lk' : `${selectedRole}@foodloop.lk`);
    const password = loginPassword || 'password123';

    try {
      const res = await authApi.login({ email, password, role: selectedRole });
      if (res && res.user) {
        dispatch({
          type: ACTION_TYPES.SET_USER,
          payload: { id: res.user.id, role: res.user.role, name: res.user.name },
        });
        navigate(ROLE_META[selectedRole].route);
        return;
      }
    } catch (err) {
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        setAuthError(err.message);
        setLoading(false);
        return;
      }
    }

    // Offline / Demo fallback
    if (selectedRole === ROLES.ADMIN) {
      dispatch({
        type: ACTION_TYPES.SET_USER,
        payload: { id: 'usr-admin-001', role: ROLES.ADMIN, name: 'Nexora Platform Admin' },
      });
      navigate('/admin');
      return;
    }

    const matchedAccount = DEMO_ACCOUNTS.find(
      (a) => a.role === selectedRole && (a.email === loginEmail || !loginEmail)
    ) || DEMO_ACCOUNTS.find((a) => a.role === selectedRole);

    const userName = loginEmail ? loginEmail.split('@')[0] : (matchedAccount?.name || 'Authorized User');
    const userId = matchedAccount?.id || `user-${Date.now()}`;

    dispatch({
      type: ACTION_TYPES.SET_USER,
      payload: { id: userId, role: selectedRole, name: matchedAccount?.name || userName },
    });
    navigate(ROLE_META[selectedRole].route);
  }

  // Handle Restaurant Register
  async function handleRegisterRestaurant(e) {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    const email = regEmail.trim();
    const password = regPassword;
    const name = restName.trim() || 'Premier Restaurant';

    try {
      const res = await authApi.register({
        name,
        email,
        password,
        role: ROLES.RESTAURANT,
        details: {
          name,
          area: restArea,
          cuisine: restCuisine,
        },
      });

      if (res && res.user) {
        dispatch({
          type: ACTION_TYPES.REGISTER_RESTAURANT,
          payload: {
            restaurant: res.profile || { id: res.user.profileId, name, area: restArea },
            user: { id: res.user.id, role: ROLES.RESTAURANT, name: res.user.name },
          },
        });
        navigate('/restaurant');
        return;
      }
    } catch (err) {
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        setAuthError(err.message);
        setLoading(false);
        return;
      }
    }

    // Local Fallback
    const id = 'rest-' + Date.now();
    const newRestaurant = {
      id,
      name,
      area: restArea,
      cuisine: restCuisine,
      lat: 6.9271 + (Math.random() - 0.5) * 0.02,
      lng: 79.8612 + (Math.random() - 0.5) * 0.02,
      salesHistory: [],
    };

    dispatch({
      type: ACTION_TYPES.REGISTER_RESTAURANT,
      payload: {
        restaurant: newRestaurant,
        user: { id, role: ROLES.RESTAURANT, name: newRestaurant.name },
      },
    });
    navigate('/restaurant');
  }

  // Handle Receiver Register
  async function handleRegisterReceiver(e) {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    const email = regEmail.trim();
    const password = regPassword;
    const name = recName.trim() || 'Community Recipient Organization';

    try {
      const res = await authApi.register({
        name,
        email,
        password,
        role: ROLES.RECEIVER,
        details: {
          name,
          type: recType,
          area: recArea,
          capacity: Number(recCapacity),
          acceptedCategories: recCategories,
        },
      });

      if (res && res.user) {
        dispatch({
          type: ACTION_TYPES.REGISTER_RECEIVER,
          payload: {
            receiver: res.profile || { id: res.user.profileId, name, type: recType },
            user: { id: res.user.id, role: ROLES.RECEIVER, name: res.user.name },
          },
        });
        navigate('/receiver');
        return;
      }
    } catch (err) {
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        setAuthError(err.message);
        setLoading(false);
        return;
      }
    }

    // Local Fallback
    const id = 'rec-' + Date.now();
    const newReceiver = {
      id,
      name,
      type: recType,
      area: recArea,
      lat: 6.92 + (Math.random() - 0.5) * 0.03,
      lng: 79.86 + (Math.random() - 0.5) * 0.03,
      acceptedCategories: recCategories,
      capacity: Number(recCapacity),
      currentNeed: 85,
      reliabilityRating: 5.0,
      isRecycler: recType === 'compost_feed',
    };

    dispatch({
      type: ACTION_TYPES.REGISTER_RECEIVER,
      payload: {
        receiver: newReceiver,
        user: { id, role: ROLES.RECEIVER, name: newReceiver.name },
      },
    });
    navigate('/receiver');
  }

  // Handle Volunteer Register
  async function handleRegisterVolunteer(e) {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    const email = regEmail.trim();
    const password = regPassword;
    const name = volName.trim() || 'Volunteer Courier';

    try {
      const res = await authApi.register({
        name,
        email,
        password,
        role: ROLES.VOLUNTEER,
        details: {
          name,
          vehicle: volVehicle,
          area: volArea,
          phone: volPhone,
        },
      });

      if (res && res.user) {
        dispatch({
          type: ACTION_TYPES.REGISTER_VOLUNTEER,
          payload: {
            volunteer: res.profile || { id: res.user.profileId, name, vehicle: volVehicle },
            user: { id: res.user.id, role: ROLES.VOLUNTEER, name: res.user.name },
          },
        });
        navigate('/volunteer');
        return;
      }
    } catch (err) {
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        setAuthError(err.message);
        setLoading(false);
        return;
      }
    }

    // Local Fallback
    const id = 'vol-' + Date.now();
    const newVolunteer = {
      id,
      name,
      vehicle: volVehicle,
      area: volArea,
      phone: volPhone,
      lat: 6.915 + (Math.random() - 0.5) * 0.02,
      lng: 79.865 + (Math.random() - 0.5) * 0.02,
      reliabilityRating: 5.0,
      hoursLogged: 0,
      available: true,
    };

    dispatch({
      type: ACTION_TYPES.REGISTER_VOLUNTEER,
      payload: {
        volunteer: newVolunteer,
        user: { id, role: ROLES.VOLUNTEER, name: newVolunteer.name },
      },
    });
    navigate('/volunteer');
  }

  const demoAccountsForRole = selectedRole
    ? DEMO_ACCOUNTS.filter((a) => a.role === selectedRole)
    : [];

  return (
    <div className="login-page">
      <div className="login-container">
        <Link to="/" className="login-logo">
          <img
            src="/images/logo-icon.png"
            alt="FoodLoop Logo"
            className="logo-icon"
          />
          <span className="login-logo-text">FoodLoop</span>
        </Link>

        <div className="login-header">
          <h1>Choose your portal</h1>
          <p>Sign in to your account or register your organization to join the network.</p>
        </div>

        {/* Role Selection Grid */}
        <div className="role-grid">
          {Object.entries(ROLE_META).map(([role, meta]) => (
            <button
              key={role}
              type="button"
              className={`role-card ${selectedRole === role ? 'selected' : ''}`}
              onClick={() => handleSelectRole(role)}
              style={{ '--role-color': meta.color }}
            >
              <span className="role-card-icon">{meta.icon}</span>
              <span className="role-card-label">{meta.label}</span>
              <span className="role-card-desc">{meta.desc}</span>
            </button>
          ))}
        </div>

        {/* Auth Box (Login or Register) */}
        {selectedRole && (
          <div className="account-section fl-animate-in">
            <div className="auth-card fl-card">
              {/* Tabs for Login / Register */}
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                >
                  Sign In
                </button>
                {selectedRole !== ROLES.ADMIN && (
                  <button
                    type="button"
                    className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError('');
                    }}
                  >
                    Create Account (Register)
                  </button>
                )}
              </div>

              {/* Feedback messages */}
              {authError && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--fl-danger)',
                  borderRadius: '6px',
                  color: 'var(--fl-danger)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚠️</span>
                  <span>{authError}</span>
                </div>
              )}

              {/* ===== SIGN IN FORM ===== */}
              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="auth-form">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      className="fl-input"
                      placeholder={
                        selectedRole === ROLES.RESTAURANT
                          ? 'e.g. colombo.kitchen@foodloop.lk'
                          : selectedRole === ROLES.RECEIVER
                          ? 'e.g. sisudiriya@foodloop.lk'
                          : selectedRole === ROLES.VOLUNTEER
                          ? 'e.g. kasun@foodloop.lk'
                          : 'admin@foodloop.lk'
                      }
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <PasswordInput
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="fl-btn fl-btn-primary fl-btn-lg"
                    style={{ width: '100%' }}
                    disabled={loading}
                  >
                    {loading ? 'Authenticating...' : `Sign In as ${ROLE_META[selectedRole].label} →`}
                  </button>

                  {/* Discreet Demo Autofill Option */}
                  {demoAccountsForRole.length > 0 && (
                    <div className="quick-demo-fill">
                      <span className="quick-demo-title">⚡ Or sign in instantly with demo credentials:</span>
                      <div className="quick-demo-pills">
                        {demoAccountsForRole.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            className="demo-pill-btn"
                            onClick={() => handleQuickFillDemo(acc)}
                          >
                            <span>{ROLE_META[acc.role].icon}</span>
                            <span>{acc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              )}

              {/* ===== REGISTER FORM: RESTAURANT ===== */}
              {authMode === 'register' && selectedRole === ROLES.RESTAURANT && (
                <form onSubmit={handleRegisterRestaurant} className="auth-form">
                  <div className="form-group">
                    <label>Restaurant / Hotel Name *</label>
                    <input
                      type="text"
                      required
                      className="fl-input"
                      placeholder="e.g. Galle Face Hotel, Upali’s by Nawaloka"
                      value={restName}
                      onChange={(e) => setRestName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Official Email *</label>
                    <input
                      type="email"
                      required
                      className="fl-input"
                      placeholder="manager@restaurant.lk"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Create Password *</label>
                    <PasswordInput
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="form-group">
                    <label>Location Area in Colombo</label>
                    <select className="fl-select" value={restArea} onChange={(e) => setRestArea(e.target.value)}>
                      {COLOMBO_AREAS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Cuisine & Business Profile</label>
                    <input
                      type="text"
                      className="fl-input"
                      placeholder="e.g. Sri Lankan Buffet, Bakery & Cafe, Fine Dining"
                      value={restCuisine}
                      onChange={(e) => setRestCuisine(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="fl-btn fl-btn-secondary fl-btn-lg"
                    style={{ width: '100%', marginTop: '1rem' }}
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register Restaurant & Access Dashboard →'}
                  </button>
                </form>
              )}

              {/* ===== REGISTER FORM: RECEIVER ===== */}
              {authMode === 'register' && selectedRole === ROLES.RECEIVER && (
                <form onSubmit={handleRegisterReceiver} className="auth-form">
                  <div className="form-group">
                    <label>Organization / Shelter Name *</label>
                    <input
                      type="text"
                      required
                      className="fl-input"
                      placeholder="e.g. St. John's Community Kitchen, Hope Child Care"
                      value={recName}
                      onChange={(e) => setRecName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Official Email *</label>
                    <input
                      type="email"
                      required
                      className="fl-input"
                      placeholder="coordinator@shelter.org"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Create Password *</label>
                    <PasswordInput
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="form-group">
                    <label>Organization Type</label>
                    <select className="fl-select" value={recType} onChange={(e) => setRecType(e.target.value)}>
                      <option value="childrens_home">Children’s Home / Development Center</option>
                      <option value="elders_home">Elders’ Home / Assisted Care</option>
                      <option value="community_kitchen">Community Soup Kitchen</option>
                      <option value="compost_feed">Livestock Feed & Bio-Compost Partner</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Area in Colombo</label>
                    <select className="fl-select" value={recArea} onChange={(e) => setRecArea(e.target.value)}>
                      {COLOMBO_AREAS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Typical Portions Capacity (per delivery)</label>
                    <input
                      type="number"
                      min="10"
                      className="fl-input"
                      value={recCapacity}
                      onChange={(e) => setRecCapacity(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Accepted Food Categories</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {FOOD_CATEGORIES.map((c) => {
                        const active = recCategories.includes(c.value);
                        return (
                          <button
                            key={c.value}
                            type="button"
                            className={`fl-badge ${active ? 'fl-badge-safe' : 'fl-badge-neutral'}`}
                            style={{ cursor: 'pointer', padding: '6px 10px' }}
                            onClick={() =>
                              setRecCategories((prev) =>
                                prev.includes(c.value) ? prev.filter((x) => x !== c.value) : [...prev, c.value]
                              )
                            }
                          >
                            {active ? '✓ ' : '+ '} {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="fl-btn fl-btn-secondary fl-btn-lg"
                    style={{ width: '100%', marginTop: '1rem' }}
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register Recipient Home & View Available Food →'}
                  </button>
                </form>
              )}

              {/* ===== REGISTER FORM: VOLUNTEER ===== */}
              {authMode === 'register' && selectedRole === ROLES.VOLUNTEER && (
                <form onSubmit={handleRegisterVolunteer} className="auth-form">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      className="fl-input"
                      placeholder="e.g. Nuwan Jayawardena"
                      value={volName}
                      onChange={(e) => setVolName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      className="fl-input"
                      placeholder="nuwan@courier.lk"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Create Password *</label>
                    <PasswordInput
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="form-group">
                    <label>Vehicle / Transport Mode</label>
                    <select className="fl-select" value={volVehicle} onChange={(e) => setVolVehicle(e.target.value)}>
                      <option value="Motorbike / Scooter">Motorbike / Scooter (Best for hot buffet deliveries)</option>
                      <option value="Bicycle">Bicycle (Eco courier)</option>
                      <option value="Three-Wheeler / Tuk">Three-Wheeler / Tuk-Tuk</option>
                      <option value="Car / Van">Car / Van (Large catering batches)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Primary Operating Area</label>
                    <select className="fl-select" value={volArea} onChange={(e) => setVolArea(e.target.value)}>
                      {COLOMBO_AREAS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Phone Number (for pickup SMS alerts)</label>
                    <input
                      type="tel"
                      required
                      className="fl-input"
                      value={volPhone}
                      onChange={(e) => setVolPhone(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="fl-btn fl-btn-secondary fl-btn-lg"
                    style={{ width: '100%', marginTop: '1rem' }}
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register Volunteer & Access Pickup Board →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}