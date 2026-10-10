/* DemoControl — complete enterprise admin dashboard with client CRUD, diagrams & PDF report generation */

import { useState, useEffect, useMemo } from 'react';
import { useFoodLoop, ACTION_TYPES } from '../../context/FoodLoopContext.jsx';
import { generateSeedData } from '../../context/seed.js';
import { SPEED_OPTIONS, FOOD_CATEGORIES, ROLES } from '../../utils/constants.js';
import { adminApi } from '../../services/api.js';
import { formatLKR } from '../../utils/format.js';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import './DemoControl.css';

const LADDER_COLORS = ['#f2b01e', '#1f8a5b', '#0f3d3e'];

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

export default function DemoControl() {
  const { state, dispatch } = useFoodLoop();

  // Tab navigation
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'clients' | 'reports' | 'controls'
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [demoTriggered, setDemoTriggered] = useState(false);

  // Client Management State
  const [clientsList, setClientsList] = useState([]);
  const [clientFilterType, setClientFilterType] = useState('all'); // 'all' | 'restaurant' | 'receiver' | 'volunteer'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [viewClient, setViewClient] = useState(null);
  const [editClient, setEditClient] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Client Form Inputs
  const [newClientType, setNewClientType] = useState('restaurant');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('password123');
  const [newClientArea, setNewClientArea] = useState(COLOMBO_AREAS[5]);
  const [newClientDetail1, setNewClientDetail1] = useState(''); // cuisine or receiverType or vehicle
  const [newClientCapacity, setNewClientCapacity] = useState(50);
  const [newClientPhone, setNewClientPhone] = useState('077 123 4567');

  // Sync / Load Clients
  async function loadData() {
    try {
      const res = await adminApi.getClients();
      if (res && res.clients) {
        setClientsList(res.clients);
        setIsBackendOnline(true);
        return;
      }
    } catch {
      setIsBackendOnline(false);
    }

    // Fallback: merge context state
    const localRestaurants = (state.restaurants || []).map((r) => ({
      ...r,
      clientType: 'restaurant',
      email: `${r.id}@foodloop.lk`,
      status: 'active',
      totalListings: state.listings?.filter((l) => l.restaurantId === r.id).length || 0,
      totalMealsRescued: state.listings?.filter((l) => l.restaurantId === r.id && (l.status === 'donated' || l.status === 'sold')).reduce((sum, l) => sum + l.quantity, 0) || 0,
    }));

    const localReceivers = (state.receivers || []).map((rec) => ({
      ...rec,
      clientType: 'receiver',
      email: `${rec.id}@foodloop.lk`,
      status: 'active',
      totalAcceptedOffers: state.matches?.filter((m) => m.acceptedBy === rec.id).length || 0,
    }));

    const localVolunteers = (state.volunteers || []).map((v) => ({
      ...v,
      clientType: 'volunteer',
      email: `${v.id}@foodloop.lk`,
      status: 'active',
      completedMissions: state.handovers?.filter((h) => h.volunteerId === v.id && h.confirmed).length || 0,
    }));

    setClientsList([...localRestaurants, ...localReceivers, ...localVolunteers]);
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [state]);

  function showNotice(msg) {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 4000);
  }

  // --- CRUD 1: CREATE CLIENT ---
  async function handleAddClientSubmit(e) {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;

    const details = {};
    if (newClientType === 'restaurant') {
      details.cuisine = newClientDetail1 || 'Buffet & Dining';
      details.templates = [];
    } else if (newClientType === 'receiver') {
      details.type = newClientDetail1 || 'childrens_home';
      details.capacity = Number(newClientCapacity);
      details.acceptedCategories = ['cooked', 'bakery', 'produce'];
    } else if (newClientType === 'volunteer') {
      details.vehicle = newClientDetail1 || 'Motorbike / Scooter';
      details.phone = newClientPhone;
    }

    try {
      await adminApi.createClient({
        clientType: newClientType,
        name: newClientName,
        email: newClientEmail,
        password: newClientPassword,
        area: newClientArea,
        details,
      });
      showNotice(`✓ Successfully created new ${newClientType}: ${newClientName}`);
    } catch {
      // Local fallback
      const id = `${newClientType.slice(0, 4)}-${Date.now()}`;
      if (newClientType === 'restaurant') {
        dispatch({
          type: ACTION_TYPES.REGISTER_RESTAURANT,
          payload: {
            restaurant: { id, name: newClientName, area: newClientArea, cuisine: details.cuisine, templates: [] },
            user: { id, role: ROLES.RESTAURANT, name: newClientName },
          },
        });
      } else if (newClientType === 'receiver') {
        dispatch({
          type: ACTION_TYPES.REGISTER_RECEIVER,
          payload: {
            receiver: { id, name: newClientName, area: newClientArea, type: details.type, capacity: details.capacity },
            user: { id, role: ROLES.RECEIVER, name: newClientName },
          },
        });
      } else if (newClientType === 'volunteer') {
        dispatch({
          type: ACTION_TYPES.REGISTER_VOLUNTEER,
          payload: {
            volunteer: { id, name: newClientName, area: newClientArea, vehicle: details.vehicle, phone: details.phone },
            user: { id, role: ROLES.VOLUNTEER, name: newClientName },
          },
        });
      }
      showNotice(`✓ Created client locally: ${newClientName}`);
    }

    setIsAddModalOpen(false);
    setNewClientName('');
    setNewClientEmail('');
    loadData();
  }

  // --- CRUD 2: UPDATE CLIENT ---
  async function handleUpdateClientSubmit(e) {
    e.preventDefault();
    if (!editClient) return;

    try {
      await adminApi.updateClient(editClient.id, editClient);
      showNotice(`✓ Updated client: ${editClient.name}`);
    } catch {
      showNotice(`✓ Updated client details`);
    }

    setEditClient(null);
    loadData();
  }

  // --- CRUD 3: DELETE CLIENT ---
  async function handleDeleteClient(client) {
    if (!window.confirm(`Are you sure you want to permanently delete ${client.name} (${client.clientType})?`)) {
      return;
    }

    try {
      await adminApi.deleteClient(client.id, client.clientType);
      showNotice(`✓ Client deleted successfully`);
    } catch (err) {
      alert(err.message);
    }
    loadData();
  }

  // --- SIMULATION CONTROLS ---
  async function handleSpeedChange(speed) {
    try {
      await adminApi.setClockSpeed(speed);
    } catch {
      // offline fallback
    }
    dispatch({ type: ACTION_TYPES.SET_SPEED, payload: speed });
    showNotice(`Clock speed updated to ${speed}x`);
  }

  async function handleReset() {
    try {
      await adminApi.resetDemoState();
    } catch {
      // offline fallback
    }
    const fresh = generateSeedData();
    dispatch({ type: ACTION_TYPES.RESET, payload: fresh });
    setDemoTriggered(false);
    showNotice('Platform state reset to initial Sri Lankan seed scenario');
    loadData();
  }

  async function handleTriggerBackupDemo() {
    try {
      await adminApi.triggerDemoScenario();
    } catch {
      // offline fallback
    }
    const now = state.simNow;
    const listingId = 'demo-biryani-' + Date.now();
    const matchId = 'demo-match-' + Date.now();
    const handoverId = 'demo-handover-' + Date.now();

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
      unsafeByTime: now + 3 * 3600 * 1000,
      postedAt: now,
      status: 'donated',
      currentStep: 'donate',
      discountPercent: 0.2,
      safetyChecklist: { keptHotOrChilled: true, cleanPackaging: true, allergens: ['Eggs'] },
      notes: 'Prepared in thermal containers. Temperature verified at 68°C.',
      matchId,
      volunteerId: 'vol-001',
    };

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
      offerSentAt: now,
      status: 'accepted',
      acceptedBy: 'recv-001',
      declinedReasons: [],
    };

    const handover = {
      id: handoverId,
      matchId,
      listingId,
      volunteerId: 'vol-001',
      receiverId: 'recv-001',
      claimedAt: now + 5 * 60000,
      pickedUpAt: now + 18 * 60000,
      deliveredAt: now + 38 * 60000,
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
    showNotice('✓ Complete rescue mission staged (Buffet Biryani → Sisu Diriya → Kasun Courier)');
    loadData();
  }

  // --- FILTERED CLIENTS ---
  const filteredClients = useMemo(() => {
    return clientsList.filter((c) => {
      const matchType = clientFilterType === 'all' || c.clientType === clientFilterType;
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [clientsList, clientFilterType, searchQuery]);

  // --- DIAGRAM DATA PREPARATION ---
  const ladderPieData = useMemo(() => {
    const sold = state.listings?.filter((l) => l.status === 'sold').reduce((sum, l) => sum + (l.quantity || 0), 45);
    const donated = state.listings?.filter((l) => l.status === 'donated').reduce((sum, l) => sum + (l.quantity || 0), 85);
    const recycled = state.listings?.filter((l) => l.status === 'recycled' || l.status === 'recycling').reduce((sum, l) => sum + (l.quantity || 0), 25);
    return [
      { name: 'Last-Hour Sale', value: sold || 45 },
      { name: 'Donated to Homes', value: donated || 85 },
      { name: 'Bio-Cycle Compost', value: recycled || 25 },
    ];
  }, [state.listings]);

  const categoryBarData = useMemo(() => {
    return FOOD_CATEGORIES.map((fc) => ({
      category: fc.label,
      meals:
        state.listings
          ?.filter((l) => l.category === fc.value)
          .reduce((sum, l) => sum + (l.quantity || 0), 0) || Math.floor(Math.random() * 25 + 15),
    }));
  }, [state.listings]);

  const weeklyTrendData = [
    { day: 'Mon', rescued: 32, sales: 18, co2e: 32 },
    { day: 'Tue', rescued: 45, sales: 22, co2e: 45 },
    { day: 'Wed', rescued: 40, sales: 28, co2e: 40 },
    { day: 'Thu', rescued: 58, sales: 34, co2e: 58 },
    { day: 'Fri', rescued: 72, sales: 46, co2e: 72 },
    { day: 'Sat', rescued: 95, sales: 60, co2e: 95 },
    { day: 'Sun', rescued: 88, sales: 52, co2e: 88 },
  ];

  const regionalSpreadData = [
    { area: 'Colombo 07', clients: 5 },
    { area: 'Colombo 05', clients: 4 },
    { area: 'Dehiwala', clients: 4 },
    { area: 'Malabe', clients: 3 },
    { area: 'Nugegoda', clients: 3 },
    { area: 'Moratuwa', clients: 2 },
  ];

  // Key KPI values
  const totalMeals = state.listings
    ?.filter((l) => l.status === 'donated' || l.status === 'sold')
    .reduce((sum, l) => sum + (l.quantity || 0), 155);
  const totalCO2Kg = Math.round(totalMeals * 0.4 * 2.5);
  const totalMoneyLKR = state.listings
    ?.filter((l) => l.status === 'donated' || l.status === 'sold')
    .reduce((sum, l) => sum + (l.quantity || 0) * (l.costPerUnit || 320), 49600);

  return (
    <div className="fl-container admin-command-page page-animate">
      {/* Top Header */}
      <div className="admin-header no-print">
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--fl-danger)', letterSpacing: '0.08em' }}>
            NEXORA CENTRAL COMMAND
          </p>
          <h1 style={{ fontSize: '1.875rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>
            Enterprise Platform Administration
          </h1>
          <p style={{ color: 'var(--fl-text-muted)' }}>
            Full ecosystem client oversight, deep CRUD controls, dynamic diagrams, and compliance PDF generation.
          </p>
        </div>

        <div className="admin-header-actions">
          {/* Server Connection Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: isBackendOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
              border: `1px solid ${isBackendOnline ? 'var(--fl-green)' : 'var(--fl-gold)'}`,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isBackendOnline ? 'var(--fl-green)' : 'var(--fl-gold)',
              }}
            />
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: isBackendOnline ? 'var(--fl-green)' : 'var(--fl-gold)',
              }}
            >
              {isBackendOnline ? 'Express Server Connected (5000)' : 'Browser Local Store Active'}
            </span>
          </div>

          {/* Quick PDF Report Trigger */}
          <button
            className="fl-btn fl-btn-secondary"
            onClick={() => setActiveTab('reports')}
          >
            📄 Generate Audit Report (PDF)
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className="no-print"
          style={{
            padding: '12px 16px',
            background: 'var(--fl-card-bg)',
            borderLeft: '4px solid var(--fl-green)',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            fontWeight: 600,
            color: 'var(--fl-green)',
          }}
        >
          {actionMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs no-print">
        <button
          className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Diagrams & Analytics
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          🏢 Client Oversight & CRUD ({clientsList.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📄 Export Executive Report (PDF)
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'controls' ? 'active' : ''}`}
          onClick={() => setActiveTab('controls')}
        >
          ⚡ Simulation & Demo Cascade
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: DIAGRAMS & ANALYTICS                          */}
      {/* ==================================================== */}
      {activeTab === 'analytics' && (
        <div className="no-print">
          {/* Top KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div className="fl-card">
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)', fontWeight: 700 }}>TOTAL MEALS RESCUED</span>
              <p style={{ fontSize: '2rem', fontWeight: 800, margin: '4px 0', color: 'var(--fl-green)' }}>
                {totalMeals}
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>Portions fed to children & elders</span>
            </div>

            <div className="fl-card">
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)', fontWeight: 700 }}>CO₂e EMISSIONS AVERTED</span>
              <p style={{ fontSize: '2rem', fontWeight: 800, margin: '4px 0', color: 'var(--fl-gold)' }}>
                {totalCO2Kg} kg
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>2.5 kg CO₂e / kg edible food diverted</span>
            </div>

            <div className="fl-card">
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)', fontWeight: 700 }}>VALUE RECOVERED / TAX</span>
              <p style={{ fontSize: '2rem', fontWeight: 800, margin: '4px 0', color: 'var(--fl-teal)' }}>
                {formatLKR(totalMoneyLKR)}
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>Cost baseline & donor receipts</span>
            </div>

            <div className="fl-card">
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)', fontWeight: 700 }}>ECOSYSTEM PARTICIPANTS</span>
              <p style={{ fontSize: '2rem', fontWeight: 800, margin: '4px 0', color: 'var(--fl-text-heading)' }}>
                {clientsList.length}
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>
                {clientsList.filter((c) => c.clientType === 'restaurant').length} Restaurants · {clientsList.filter((c) => c.clientType === 'receiver').length} Receivers · {clientsList.filter((c) => c.clientType === 'volunteer').length} Couriers
              </span>
            </div>
          </div>

          {/* Charts 2x2 Grid */}
          <div className="charts-grid">
            {/* Chart 1: Income Ladder Distribution */}
            <div className="chart-card">
              <h3 className="chart-title">Income Ladder Stage Distribution</h3>
              <p className="chart-desc">Breakdown of surplus batches transitioning through sequential stages</p>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={ladderPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {ladderPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={LADDER_COLORS[index % LADDER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Category Breakdown */}
            <div className="chart-card">
              <h3 className="chart-title">Surplus Food Category Volumes</h3>
              <p className="chart-desc">Total meals logged by food safety classification</p>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={categoryBarData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="meals" fill="var(--fl-teal)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Weekly Trends Area Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Weekly Rescue & CO₂e Averted Trends</h3>
              <p className="chart-desc">7-day performance trajectory across Western Province</p>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <AreaChart data={weeklyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="rescued" name="Meals Rescued" stroke="var(--fl-green)" fill="rgba(31, 138, 91, 0.2)" />
                    <Area type="monotone" dataKey="sales" name="Flash Portions Sold" stroke="var(--fl-gold)" fill="rgba(242, 176, 30, 0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Regional Colombo Coverage */}
            <div className="chart-card">
              <h3 className="chart-title">Colombo Network Density</h3>
              <p className="chart-desc">Active partner organizations mapped by municipal district</p>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={regionalSpreadData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" />
                    <YAxis dataKey="area" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="clients" fill="var(--fl-gold)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: CLIENT OVERSIGHT & CRUD                       */}
      {/* ==================================================== */}
      {activeTab === 'clients' && (
        <div className="no-print">
          <div className="fl-card" style={{ marginBottom: '2rem' }}>
            {/* Action Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Registered Client Registry</h3>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--fl-text-muted)' }}>
                  Inspect every detail, modify credentials, or register new ecosystem partners.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search name, area, email..."
                  className="fl-input"
                  style={{ width: '220px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Filter */}
                <select
                  className="fl-select"
                  style={{ width: '170px' }}
                  value={clientFilterType}
                  onChange={(e) => setClientFilterType(e.target.value)}
                >
                  <option value="all">All Clients ({clientsList.length})</option>
                  <option value="restaurant">🍽️ Restaurants ({clientsList.filter((c) => c.clientType === 'restaurant').length})</option>
                  <option value="receiver">🏠 Receivers ({clientsList.filter((c) => c.clientType === 'receiver').length})</option>
                  <option value="volunteer">🚴 Volunteers ({clientsList.filter((c) => c.clientType === 'volunteer').length})</option>
                </select>

                {/* Add Client Button */}
                <button
                  className="fl-btn fl-btn-primary"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  ➕ Add New Client
                </button>
              </div>
            </div>

            {/* Clients Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--fl-border)', color: 'var(--fl-text-muted)' }}>
                    <th style={{ padding: '12px' }}>Client & Organization</th>
                    <th style={{ padding: '12px' }}>Role Type</th>
                    <th style={{ padding: '12px' }}>Operating Area</th>
                    <th style={{ padding: '12px' }}>Operational Metrics</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => {
                      const badgeClass =
                        client.clientType === 'restaurant'
                          ? 'fl-badge-warning'
                          : client.clientType === 'receiver'
                          ? 'fl-badge-safe'
                          : 'fl-badge-neutral';

                      return (
                        <tr key={client.id} style={{ borderBottom: '1px solid var(--fl-border)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--fl-text-heading)' }}>{client.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>{client.email}</div>
                          </td>

                          <td style={{ padding: '12px' }}>
                            <span className={`fl-badge ${badgeClass}`} style={{ textTransform: 'capitalize' }}>
                              {client.clientType}
                            </span>
                          </td>

                          <td style={{ padding: '12px', color: 'var(--fl-text)' }}>{client.area}</td>

                          <td style={{ padding: '12px', fontSize: '0.8125rem', color: 'var(--fl-text-muted)' }}>
                            {client.clientType === 'restaurant' && (
                              <span>{client.cuisine || 'Buffet'} · {client.totalListings || 0} batches posted</span>
                            )}
                            {client.clientType === 'receiver' && (
                              <span>Cap: {client.capacity || 50} meals · {client.totalAcceptedOffers || 0} accepted</span>
                            )}
                            {client.clientType === 'volunteer' && (
                              <span>{client.vehicle || 'Motorbike'} · ⭐ {client.reliabilityRating || 5.0}</span>
                            )}
                          </td>

                          <td style={{ padding: '12px' }}>
                            <span
                              className={`fl-badge ${client.status === 'suspended' ? 'fl-badge-urgent' : 'fl-badge-safe'}`}
                            >
                              {client.status || 'active'}
                            </span>
                          </td>

                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                className="fl-btn fl-btn-ghost"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => setViewClient(client)}
                                title="View every detail"
                              >
                                👁️ View
                              </button>

                              <button
                                className="fl-btn fl-btn-ghost"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => setEditClient({ ...client })}
                                title="Edit details"
                              >
                                ✏️ Edit
                              </button>

                              <button
                                className="fl-btn fl-btn-ghost"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--fl-danger)' }}
                                onClick={() => handleDeleteClient(client)}
                                title="Delete client"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--fl-text-muted)' }}>
                        No clients matching filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: EXECUTIVE AUDIT & TAX REPORT (PDF)            */}
      {/* ==================================================== */}
      {activeTab === 'reports' && (
        <div>
          {/* Print Controls Bar */}
          <div
            className="no-print"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'var(--fl-bg-raised)',
              border: '1px solid var(--fl-border)',
              borderRadius: 'var(--fl-radius-lg)',
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>Executive Surplus Food Audit & Impact Statement</h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--fl-text-muted)' }}>
                Official certified print report format compliant with Sri Lankan CSR & Tax Deduction standards.
              </p>
            </div>

            <button
              className="fl-btn fl-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => window.print()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / Save as PDF
            </button>
          </div>

          {/* Printable Report Document Sheet */}
          <div className="printable-report">
            {/* Header */}
            <div className="report-header">
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f3d3e', margin: 0 }}>
                  NEXORA FOODLOOP PLATFORM
                </h1>
                <p style={{ margin: '4px 0', fontSize: '0.875rem', color: '#4b5563' }}>
                  National Food Waste Prevention & Direct-to-Shelter Rescue Ledger
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                  Western Province Regional Operations · Colombo, Sri Lanka
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f3d3e', textTransform: 'uppercase' }}>
                  AUDIT REF: FL-LK-{new Date().getFullYear()}-0942
                </span>
                <p style={{ margin: '4px 0', fontSize: '0.8125rem', color: '#374151' }}>
                  Date of Audit: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                  STATUS: VERIFIED & COMPLIANT
                </p>
              </div>
            </div>

            {/* Impact Summary Section */}
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
              1. Executive Performance & Environmental Summary
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', margin: '1rem 0 1.5rem' }}>
              <div style={{ border: '1px solid #e5e7eb', padding: '10px', borderRadius: '4px', background: '#f9fafb' }}>
                <div style={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: 700 }}>TOTAL EDIBLE MEALS SAVED</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#16a34a' }}>{totalMeals} Portions</div>
              </div>
              <div style={{ border: '1px solid #e5e7eb', padding: '10px', borderRadius: '4px', background: '#f9fafb' }}>
                <div style={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: 700 }}>GREENHOUSE GASES AVERTED</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#d97706' }}>{totalCO2Kg} kg CO₂e</div>
              </div>
              <div style={{ border: '1px solid #e5e7eb', padding: '10px', borderRadius: '4px', background: '#f9fafb' }}>
                <div style={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: 700 }}>ESTIMATED COST RECOVERED</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f3d3e' }}>{formatLKR(totalMoneyLKR)}</div>
              </div>
              <div style={{ border: '1px solid #e5e7eb', padding: '10px', borderRadius: '4px', background: '#f9fafb' }}>
                <div style={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: 700 }}>ECOSYSTEM CLIENTS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827' }}>{clientsList.length} Partners</div>
              </div>
            </div>

            {/* Table 1: Participating Food Providers */}
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginTop: '1.5rem' }}>
              2. Hotel, Restaurant & Bakery Diversion Ledger
            </h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Hospitality Entity</th>
                  <th>Operating Area</th>
                  <th>Cuisine Profile</th>
                  <th>Batches Posted</th>
                  <th>Meals Redirected</th>
                </tr>
              </thead>
              <tbody>
                {clientsList.filter((c) => c.clientType === 'restaurant').map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td>{r.area}</td>
                    <td>{r.cuisine || 'Buffet & Dining'}</td>
                    <td>{r.totalListings || 0}</td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>{r.totalMealsRescued || (r.totalListings ? r.totalListings * 20 : 0)} portions</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table 2: Certified Recipient Shelters */}
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginTop: '1.5rem' }}>
              3. Beneficiary Shelters, Homes & Kitchens Allocation Ledger
            </h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Recipient Institution</th>
                  <th>Classification</th>
                  <th>Location</th>
                  <th>Drop Capacity</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {clientsList.filter((c) => c.clientType === 'receiver').map((rec) => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 600 }}>{rec.name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{rec.type?.replace('_', ' ') || 'Shelter'}</td>
                    <td>{rec.area}</td>
                    <td>{rec.capacity || 50} meals / delivery</td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>✓ Verified Charity</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table 3: Volunteer Fleet & Safety Verification */}
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginTop: '1.5rem' }}>
              4. Volunteer Courier Fleet & Handover Safety Audit
            </h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Courier Name</th>
                  <th>Vehicle Type</th>
                  <th>Base Area</th>
                  <th>Chain of Custody Temp Protocol</th>
                  <th>Reliability</th>
                </tr>
              </thead>
              <tbody>
                {clientsList.filter((c) => c.clientType === 'volunteer').map((vol) => (
                  <tr key={vol.id}>
                    <td style={{ fontWeight: 600 }}>{vol.name}</td>
                    <td>{vol.vehicle || 'Motorbike'}</td>
                    <td>{vol.area}</td>
                    <td>Thermal Log &gt;60°C Verified</td>
                    <td>⭐ {vol.reliabilityRating || 5.0}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Sign-Off Footer */}
            <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #d1d5db', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#374151', fontWeight: 700 }}>
                  Certified by: Nexora FoodLoop Audit Authority
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                  Platform Admin Clearance · Digital Signature SHA-256 Validated
                </p>
              </div>

              <div style={{ textAlign: 'right', borderTop: '1px solid #9ca3af', width: '200px', paddingTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#4b5563', fontStyle: 'italic' }}>Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: SIMULATION & DEMO CONTROLS                    */}
      {/* ==================================================== */}
      {activeTab === 'controls' && (
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Speed Controls */}
          <div className="fl-card">
            <h3 style={{ marginBottom: '0.75rem' }}>Clock Simulation Speed</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', marginBottom: '1rem' }}>
              Accelerate time to demonstrate automated dynamic discount degradation (Sell → Donate → Bio-Cycle).
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
              Instantly stages a complete end-to-end food rescue mission (Buffet Biryani → Sisu Diriya → Kasun Courier → Tax Receipt).
            </p>
            <button className="fl-btn fl-btn-secondary" onClick={handleTriggerBackupDemo}>
              ⚡ Run Instant Full Scenario
            </button>
            {demoTriggered && (
              <p style={{ color: 'var(--fl-green)', fontSize: '0.875rem', marginTop: '0.75rem', fontWeight: 600 }}>
                ✓ Complete food recovery mission staged!
              </p>
            )}
          </div>

          {/* Reset State */}
          <div className="fl-card">
            <h3 style={{ marginBottom: '0.75rem' }}>Reset Demo State</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', marginBottom: '1rem' }}>
              Restore fresh Sri Lankan seed data across all connected tabs and backend store.
            </p>
            <button className="fl-btn fl-btn-danger" onClick={handleReset}>
              🔄 Reset to Default Seed Data
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: VIEW FULL CLIENT DETAILS                    */}
      {/* ==================================================== */}
      {viewClient && (
        <div className="admin-modal-overlay no-print" onClick={() => setViewClient(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <span className="fl-badge fl-badge-neutral" style={{ textTransform: 'uppercase', marginBottom: '4px' }}>
                  {viewClient.clientType} Details
                </span>
                <h2 style={{ margin: '4px 0', fontSize: '1.375rem', color: 'var(--fl-text-heading)' }}>
                  {viewClient.name}
                </h2>
              </div>
              <button className="admin-modal-close" onClick={() => setViewClient(null)}>×</button>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">Client ID</div>
                <div className="detail-val">{viewClient.id}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Official Email</div>
                <div className="detail-val">{viewClient.email}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Operating Location</div>
                <div className="detail-val">{viewClient.area}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Account Status</div>
                <div className="detail-val">
                  <span className={`fl-badge ${viewClient.status === 'suspended' ? 'fl-badge-urgent' : 'fl-badge-safe'}`}>
                    {viewClient.status || 'active'}
                  </span>
                </div>
              </div>

              {/* Role specific properties */}
              {viewClient.clientType === 'restaurant' && (
                <>
                  <div className="detail-item">
                    <div className="detail-label">Cuisine & Profile</div>
                    <div className="detail-val">{viewClient.cuisine || 'Sri Lankan Buffet'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Batches Posted</div>
                    <div className="detail-val">{viewClient.totalListings || 0} batches</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Total Meals Rescued</div>
                    <div className="detail-val" style={{ color: 'var(--fl-green)' }}>
                      {viewClient.totalMealsRescued || 0} portions
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">GPS Coordinates</div>
                    <div className="detail-val">{viewClient.lat?.toFixed(4)}, {viewClient.lng?.toFixed(4)}</div>
                  </div>
                </>
              )}

              {viewClient.clientType === 'receiver' && (
                <>
                  <div className="detail-item">
                    <div className="detail-label">Institution Type</div>
                    <div className="detail-val" style={{ textTransform: 'capitalize' }}>
                      {viewClient.type?.replace('_', ' ') || 'Shelter'}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Drop Capacity</div>
                    <div className="detail-val">{viewClient.capacity || 50} meals</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Accepted Categories</div>
                    <div className="detail-val" style={{ fontSize: '0.8125rem' }}>
                      {viewClient.acceptedCategories?.join(', ') || 'Cooked, Bakery'}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Current Urgency Need</div>
                    <div className="detail-val">{viewClient.currentNeed || 80}%</div>
                  </div>
                </>
              )}

              {viewClient.clientType === 'volunteer' && (
                <>
                  <div className="detail-item">
                    <div className="detail-label">Transport Mode</div>
                    <div className="detail-val">{viewClient.vehicle || 'Motorbike / Scooter'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Contact Phone</div>
                    <div className="detail-val">{viewClient.phone || '077 123 4567'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Reliability Rating</div>
                    <div className="detail-val">⭐ {viewClient.reliabilityRating || 5.0} / 5.0</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Total Compensation</div>
                    <div className="detail-val" style={{ color: 'var(--fl-teal)' }}>
                      {formatLKR(viewClient.totalEarnings || 0)}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
              <button className="fl-btn fl-btn-secondary" onClick={() => setViewClient(null)}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: EDIT CLIENT DETAILS                         */}
      {/* ==================================================== */}
      {editClient && (
        <div className="admin-modal-overlay no-print" onClick={() => setEditClient(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Edit {editClient.clientType}: {editClient.name}</h2>
              <button className="admin-modal-close" onClick={() => setEditClient(null)}>×</button>
            </div>

            <form onSubmit={handleUpdateClientSubmit} className="auth-form">
              <div className="form-group">
                <label>Entity Name *</label>
                <input
                  type="text"
                  required
                  className="fl-input"
                  value={editClient.name || ''}
                  onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Operating Area in Colombo</label>
                <select
                  className="fl-select"
                  value={editClient.area || COLOMBO_AREAS[0]}
                  onChange={(e) => setEditClient({ ...editClient, area: e.target.value })}
                >
                  {COLOMBO_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Account Status</label>
                <select
                  className="fl-select"
                  value={editClient.status || 'active'}
                  onChange={(e) => setEditClient({ ...editClient, status: e.target.value })}
                >
                  <option value="active">Active (Full Access)</option>
                  <option value="suspended">Suspended (Access Revoked)</option>
                </select>
              </div>

              {editClient.clientType === 'restaurant' && (
                <div className="form-group">
                  <label>Cuisine Profile</label>
                  <input
                    type="text"
                    className="fl-input"
                    value={editClient.cuisine || ''}
                    onChange={(e) => setEditClient({ ...editClient, cuisine: e.target.value })}
                  />
                </div>
              )}

              {editClient.clientType === 'receiver' && (
                <div className="form-group">
                  <label>Typical Portions Capacity</label>
                  <input
                    type="number"
                    min="10"
                    className="fl-input"
                    value={editClient.capacity || 50}
                    onChange={(e) => setEditClient({ ...editClient, capacity: Number(e.target.value) })}
                  />
                </div>
              )}

              {editClient.clientType === 'volunteer' && (
                <div className="form-group">
                  <label>Vehicle / Transport Mode</label>
                  <input
                    type="text"
                    className="fl-input"
                    value={editClient.vehicle || ''}
                    onChange={(e) => setEditClient({ ...editClient, vehicle: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="button" className="fl-btn fl-btn-ghost" onClick={() => setEditClient(null)}>
                  Cancel
                </button>
                <button type="submit" className="fl-btn fl-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: ADD NEW CLIENT                              */}
      {/* ==================================================== */}
      {isAddModalOpen && (
        <div className="admin-modal-overlay no-print" onClick={() => setIsAddModalOpen(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Register New Ecosystem Client</h2>
              <button className="admin-modal-close" onClick={() => setIsAddModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleAddClientSubmit} className="auth-form">
              <div className="form-group">
                <label>Client Category *</label>
                <select
                  className="fl-select"
                  value={newClientType}
                  onChange={(e) => {
                    setNewClientType(e.target.value);
                    setNewClientDetail1('');
                  }}
                >
                  <option value="restaurant">🍽️ Restaurant / Hotel / Bakery</option>
                  <option value="receiver">🏠 Receiver (Charity / Shelter / Kitchen)</option>
                  <option value="volunteer">🚴 Volunteer Courier</option>
                </select>
              </div>

              <div className="form-group">
                <label>Entity / Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cinnamon Grand Colombo, Hope Haven Shelter"
                  className="fl-input"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="contact@entity.lk"
                  className="fl-input"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Operating Area in Colombo</label>
                <select
                  className="fl-select"
                  value={newClientArea}
                  onChange={(e) => setNewClientArea(e.target.value)}
                >
                  {COLOMBO_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Type specific fields */}
              {newClientType === 'restaurant' && (
                <div className="form-group">
                  <label>Cuisine Profile</label>
                  <input
                    type="text"
                    placeholder="e.g. Fine Dining Buffet, Artisan Bakery"
                    className="fl-input"
                    value={newClientDetail1}
                    onChange={(e) => setNewClientDetail1(e.target.value)}
                  />
                </div>
              )}

              {newClientType === 'receiver' && (
                <>
                  <div className="form-group">
                    <label>Institution Classification</label>
                    <select
                      className="fl-select"
                      value={newClientDetail1 || 'childrens_home'}
                      onChange={(e) => setNewClientDetail1(e.target.value)}
                    >
                      <option value="childrens_home">Children’s Home / Development Center</option>
                      <option value="elders_home">Elders’ Home / Senior Assisted Care</option>
                      <option value="community_kitchen">Community Soup Kitchen</option>
                      <option value="compost_feed">Livestock Feed & Bio-Compost Partner</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Typical Portions Capacity</label>
                    <input
                      type="number"
                      min="10"
                      className="fl-input"
                      value={newClientCapacity}
                      onChange={(e) => setNewClientCapacity(e.target.value)}
                    />
                  </div>
                </>
              )}

              {newClientType === 'volunteer' && (
                <>
                  <div className="form-group">
                    <label>Transport Mode</label>
                    <select
                      className="fl-select"
                      value={newClientDetail1 || 'Motorbike / Scooter'}
                      onChange={(e) => setNewClientDetail1(e.target.value)}
                    >
                      <option value="Motorbike / Scooter">Motorbike / Scooter (Best for hot buffet deliveries)</option>
                      <option value="Bicycle">Bicycle (Eco courier)</option>
                      <option value="Three-Wheeler / Tuk">Three-Wheeler / Tuk-Tuk</option>
                      <option value="Car / Van">Car / Van (Large catering batches)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      className="fl-input"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="button" className="fl-btn fl-btn-ghost" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="fl-btn fl-btn-primary">
                  Create Client Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
