/* DemoControl — full admin platform management, user administration & hackathon demo controls */

import { useState, useEffect } from 'react';
import { useFoodLoop, ACTION_TYPES } from '../../context/FoodLoopContext.jsx';
import { generateSeedData } from '../../context/seed.js';
import { SPEED_OPTIONS } from '../../utils/constants.js';
import { adminApi } from '../../services/api.js';

export default function DemoControl() {
  const { state, dispatch } = useFoodLoop();
  const [demoTriggered, setDemoTriggered] = useState(false);
  const [backendStats, setBackendStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'controls'
  const [actionMessage, setActionMessage] = useState('');

  // Fetch backend data if online
  async function loadBackendData() {
    try {
      const statsRes = await adminApi.getStats();
      if (statsRes && statsRes.stats) {
        setBackendStats(statsRes.stats);
        setIsBackendOnline(true);
      }
      const usersRes = await adminApi.getUsers();
      if (usersRes && usersRes.users) {
        setUsersList(usersRes.users);
      }
    } catch {
      setIsBackendOnline(false);
    }
  }

  useEffect(() => {
    loadBackendData();
    const interval = setInterval(loadBackendData, 6000);
    return () => clearInterval(interval);
  }, []);

  async function handleReset() {
    try {
      await adminApi.resetDemoState();
    } catch {
      // offline fallback
    }
    const fresh = generateSeedData();
    dispatch({ type: ACTION_TYPES.RESET, payload: fresh });
    setDemoTriggered(false);
    showNotice('Platform state reset to initial Sri Lankan seed data.');
    loadBackendData();
  }

  async function handleSpeedChange(speed) {
    try {
      await adminApi.setClockSpeed(speed);
    } catch {
      // offline fallback
    }
    dispatch({ type: ACTION_TYPES.SET_SPEED, payload: speed });
    showNotice(`Clock simulation speed updated to ${speed}x.`);
  }

  async function handleTriggerBackupDemo() {
    try {
      await adminApi.triggerDemoScenario();
    } catch {
      // offline fallback
    }

    const listingId = 'demo-biryani-' + Date.now();
    const matchId = 'demo-match-' + Date.now();
    const handoverId = 'demo-handover-' + Date.now();
    const simNow = state.simNow;

    // 1. Stage listing
    const listing = {
      id: listingId,
      restaurantId: 'rest-001',
      restaurantName: 'Colombo Kitchen',
      foodName: 'Dum Biryani with Boiled Eggs & Gravy',
      category: 'cooked',
      quantity: 25,
      unit: 'portions',
      costPerUnit: 450,
      pricePerUnit: 1200,
      unsafeByTime: simNow + 3 * 3600 * 1000,
      postedAt: simNow,
      status: 'donated',
      currentStep: 'donate',
      discountPercent: 0.2,
      safetyChecklist: { keptHotOrChilled: true, cleanPackaging: true, allergens: ['Eggs'] },
      notes: 'Prepared in thermal containers. Temperature verified at 68°C.',
      matchId,
      volunteerId: 'vol-001',
    };

    // 2. Stage accepted match
    const match = {
      id: matchId,
      listingId,
      rankedReceivers: [
        {
          receiverId: 'recv-001',
          receiverName: "Sisu Diriya Children's Home",
          receiverType: 'childrens_home',
          score: 94,
          distanceKm: 3.2,
          estimatedTravelMin: 33,
          exclusionReason: null,
          breakdown: { timeMargin: 0.88, proximity: 0.92, capacityFit: 1.0, currentNeed: 0.85, reliability: 0.95 },
        },
      ],
      currentOfferIndex: 0,
      offerSentAt: simNow,
      status: 'accepted',
      acceptedBy: 'recv-001',
      declinedReasons: [],
    };

    // 3. Stage completed handover
    const handover = {
      id: handoverId,
      matchId,
      listingId,
      volunteerId: 'vol-001',
      receiverId: 'recv-001',
      claimedAt: simNow + 5 * 60000,
      pickedUpAt: simNow + 18 * 60000,
      deliveredAt: simNow + 38 * 60000,
      temperatureCheck: 'Hot (>60°C)',
      deliveryNotes: 'Delivered in thermal insulated containers.',
      confirmed: true,
      deliveryFeeLKR: 412,
    };

    dispatch({ type: ACTION_TYPES.ADD_LISTING, payload: listing });
    dispatch({ type: ACTION_TYPES.CREATE_MATCH, payload: match });
    dispatch({ type: ACTION_TYPES.CLAIM_PICKUP, payload: handover });
    dispatch({
      type: ACTION_TYPES.CONFIRM_PICKUP,
      payload: { handoverId, timestamp: handover.pickedUpAt, temperatureCheck: handover.temperatureCheck },
    });
    dispatch({
      type: ACTION_TYPES.CONFIRM_DELIVERY,
      payload: { handoverId, timestamp: handover.deliveredAt },
    });

    setDemoTriggered(true);
    showNotice('✓ Complete food recovery mission staged! Check Restaurant Dashboard or Receipts.');
    loadBackendData();
  }

  async function handleToggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await adminApi.updateUser(userId, { status: newStatus });
      showNotice(`User status updated to ${newStatus}.`);
      loadBackendData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminApi.deleteUser(userId);
      showNotice('User deleted successfully.');
      loadBackendData();
    } catch (err) {
      alert(err.message);
    }
  }

  function showNotice(msg) {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 4000);
  }

  const filteredUsers = usersList.filter((u) => {
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-danger)', letterSpacing: '0.05em' }}>
            NEXORA CENTRAL COMMAND
          </p>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>
            Platform Admin & Demo Controller
          </h1>
          <p style={{ color: 'var(--fl-text-muted)' }}>
            Real-time ecosystem administration, user control, accelerated simulation clock & pitch fail-safes.
          </p>
        </div>

        {/* Server Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px', background: isBackendOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)', border: `1px solid ${isBackendOnline ? 'var(--fl-green)' : 'var(--fl-gold)'}` }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: isBackendOnline ? 'var(--fl-green)' : 'var(--fl-gold)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: isBackendOnline ? 'var(--fl-green)' : 'var(--fl-gold)' }}>
            {isBackendOnline ? 'Express Backend Online (Port 5000)' : 'Browser Local Mode'}
          </span>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div style={{ padding: '10px 16px', background: 'var(--fl-card-bg)', borderLeft: '4px solid var(--fl-green)', borderRadius: '6px', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontWeight: 600, color: 'var(--fl-green)' }}>
          {actionMessage}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', borderBottom: '1px solid var(--fl-border)', paddingBottom: '8px' }}>
        <button
          className={`fl-btn ${activeTab === 'overview' ? 'fl-btn-primary' : 'fl-btn-ghost'}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview & Stats
        </button>
        <button
          className={`fl-btn ${activeTab === 'users' ? 'fl-btn-primary' : 'fl-btn-ghost'}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management ({usersList.length || state.restaurants.length + state.receivers.length + state.volunteers.length})
        </button>
        <button
          className={`fl-btn ${activeTab === 'controls' ? 'fl-btn-primary' : 'fl-btn-ghost'}`}
          onClick={() => setActiveTab('controls')}
        >
          ⚙️ Pitch & Demo Controls
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="fl-card">
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)', fontWeight: 600 }}>REGISTERED USERS</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0', color: 'var(--fl-text-heading)' }}>
                {backendStats?.users?.total ?? (state.restaurants?.length + state.receivers?.length + state.volunteers?.length + 1)}
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>
                {backendStats?.users?.restaurants ?? state.restaurants?.length} Restaurants · {backendStats?.users?.receivers ?? state.receivers?.length} Receivers · {backendStats?.users?.volunteers ?? state.volunteers?.length} Volunteers
              </span>
            </div>

            <div className="fl-card">
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)', fontWeight: 600 }}>SURPLUS RESCUE RUNS</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0', color: 'var(--fl-teal)' }}>
                {backendStats?.operations?.totalListings ?? state.listings?.length}
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>
                {state.listings?.filter((l) => l.status === 'selling').length} in Flash Sale · {state.listings?.filter((l) => l.status === 'donated').length} Donated
              </span>
            </div>

            <div className="fl-card">
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)', fontWeight: 600 }}>MEALS REDISTRIBUTED</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0', color: 'var(--fl-green)' }}>
                {backendStats?.impact?.mealsRescued ?? state.listings?.filter((l) => l.status === 'donated' || l.status === 'sold').reduce((sum, l) => sum + (l.quantity || 0), 0)}
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>
                Portions diverted from landfill
              </span>
            </div>

            <div className="fl-card">
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)', fontWeight: 600 }}>CO₂e PREVENTED</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0', color: 'var(--fl-gold)' }}>
                {backendStats?.impact?.co2SavedKg ?? Math.round((state.listings?.filter((l) => l.status === 'donated' || l.status === 'sold').reduce((sum, l) => sum + (l.quantity || 0), 0)) * 0.4 * 2.5)} kg
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>
                Based on 2.5 kg CO₂e / kg food
              </span>
            </div>
          </div>

          {/* Quick Inspection Box */}
          <div className="fl-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Ecosystem Live Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>ACTIVE RESTAURANTS</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{state.restaurants?.length}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>VERIFIED RECEIVERS</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{state.receivers?.length}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>AVAILABLE COURIERS</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  {state.volunteers?.filter((v) => v.available).length} of {state.volunteers?.length}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>DELIVERED HANDOVERS</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  {state.handovers?.filter((h) => h.confirmed).length}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>CROSS-TAB SYNC</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--fl-green)', margin: 0 }}>Active</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="fl-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h3>Registered Ecosystem Accounts</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search user or email..."
                className="fl-input"
                style={{ width: '220px' }}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <select className="fl-select" style={{ width: '150px' }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                <option value="restaurant">Restaurants</option>
                <option value="receiver">Receivers</option>
                <option value="volunteer">Volunteers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--fl-border)', color: 'var(--fl-text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>Name & Entity</th>
                  <th style={{ padding: '10px 12px' }}>Email</th>
                  <th style={{ padding: '10px 12px' }}>Role</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--fl-border)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>
                          {u.profile?.area || u.profileId || u.id}
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--fl-text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span className="fl-badge fl-badge-neutral" style={{ textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className={`fl-badge ${u.status === 'suspended' ? 'fl-badge-urgent' : 'fl-badge-safe'}`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {u.role !== 'admin' && (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              className="fl-btn fl-btn-ghost"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => handleToggleUserStatus(u.id, u.status)}
                            >
                              {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                            </button>
                            <button
                              className="fl-btn fl-btn-ghost"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--fl-danger)' }}
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--fl-text-muted)' }}>
                      {isBackendOnline ? 'No users matching filter criteria.' : 'Start backend server (node src/server.js in ./backend) to fetch full MongoDB / database accounts.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONTROLS */}
      {activeTab === 'controls' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Speed Controls */}
          <div className="fl-card">
            <h3 style={{ marginBottom: '0.75rem' }}>Clock Simulation Speed</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', marginBottom: '1rem' }}>
              Fast-forward simulation time to showcase automatic step degradation (Sell → Donate → Recycle).
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {SPEED_OPTIONS.map((speed) => (
                <button
                  key={speed}
                  className={`fl-btn ${state.speed === speed ? 'fl-btn-primary' : 'fl-btn-ghost'}`}
                  onClick={() => handleSpeedChange(speed)}
                >
                  {speed}x {speed === 1 ? '(Realtime)' : speed === 10 ? '(Fast)' : '(Turbo)'}
                </button>
              ))}
            </div>
          </div>

          {/* 1-Click Backup Demo Trigger */}
          <div className="fl-card" style={{ borderLeft: '4px solid var(--fl-green)' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Fail-Safe Backup Demo Mode</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', marginBottom: '1rem' }}>
              Instantly stages a complete end-to-end food rescue mission (Buffet Biryani → Sisu Diriya → Kasun Courier → Tax Receipt) if judging time is tight.
            </p>
            <button className="fl-btn fl-btn-secondary" onClick={handleTriggerBackupDemo}>
              ⚡ Run Instant Full Scenario
            </button>
            {demoTriggered && (
              <p style={{ color: 'var(--fl-green)', fontSize: '0.875rem', marginTop: '0.75rem', fontWeight: 600 }}>
                ✓ Complete food recovery mission staged! Check Restaurant Dashboard or Receipts.
              </p>
            )}
          </div>

          {/* Reset State */}
          <div className="fl-card">
            <h3 style={{ marginBottom: '0.75rem' }}>Reset Demo State</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', marginBottom: '1rem' }}>
              Restore fresh Sri Lankan seed data across all connected tabs and backend store (Colombo restaurants, receivers, listings).
            </p>
            <button className="fl-btn fl-btn-danger" onClick={handleReset}>
              🔄 Reset to Default Seed Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
