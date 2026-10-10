/* VolunteerDashboard — volunteer metrics, courier payout earnings, live rescue missions, and real-time map */

import { Link } from 'react-router-dom';
import { useFoodLoop } from '../../context/FoodLoopContext.jsx';
import { formatLKR } from '../../utils/format.js';
import StatCard from '../../components/StatCard.jsx';

export default function VolunteerDashboard() {
  const { state } = useFoodLoop();
  const user = state.currentUser;

  const currentVolunteer = state.volunteers.find((v) => v.id === user?.id) || user;
  const myHandovers = state.handovers.filter((h) => h.volunteerId === user?.id);
  const activePickup = myHandovers.find((h) => !h.confirmed);

  const totalEarnings = currentVolunteer?.totalEarnings != null
    ? currentVolunteer.totalEarnings
    : myHandovers
        .filter((h) => h.confirmed && h.payoutMode === 'paid')
        .reduce((sum, h) => sum + (h.earnedFee || 450), 0);

  const proBonoCount = currentVolunteer?.proBonoRescues != null
    ? currentVolunteer.proBonoRescues
    : myHandovers.filter((h) => h.confirmed && h.payoutMode === 'volunteer').length;

  // Available missions waiting for a volunteer
  const availableMatches = state.matches.filter((m) => {
    if (m.status !== 'accepted') return false;
    const hasHandover = state.handovers.some((h) => h.matchId === m.id);
    return !hasHandover;
  });

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-accent)', letterSpacing: '0.05em' }}>COURIER RESCUE HUB</p>
          <h1 style={{ fontSize: '2rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>
            Welcome, {user?.name || 'Volunteer Courier'}
          </h1>
          <p style={{ color: 'var(--fl-text-muted)' }}>
            Deliver hot surplus meals across Colombo. Choose paid courier rates or deliver pro-bono for your community.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link to="/map" className="fl-btn fl-btn-secondary fl-btn-lg">
            🗺️ Live Rescue Map
          </Link>
          <Link to="/volunteer/pickups" className="fl-btn fl-btn-primary fl-btn-lg">
            📦 Pickup Board ({availableMatches.length})
          </Link>
        </div>
      </div>

      {/* Courier Community Banner */}
      <div className="fl-card" style={{
        background: 'linear-gradient(135deg, rgba(15, 61, 62, 0.06) 0%, rgba(31, 138, 91, 0.08) 100%)',
        border: '1px solid var(--fl-teal)',
        padding: '1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <img
          src="/images/courier-scooter.jpg"
          alt="FoodLoop Courier in Colombo"
          style={{ width: '130px', height: '90px', objectFit: 'cover', borderRadius: 'var(--fl-radius-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <div style={{ flex: 1, minWidth: '240px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: 'var(--fl-text-heading)' }}>
            Powering Colombo's Zero-Waste Food Transit
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--fl-text-muted)' }}>
            Each delivery guarantees safe hot holding (&gt;60°C) with GPS tracking from the restaurant kitchen straight to the recipient home. Choose paid median fair pricing or volunteer pro-bono for your community.
          </p>
        </div>
      </div>

      {/* KPI Stats with Delivery Earnings & Pro-Bono Rescues */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          label="Total Courier Earnings"
          value={formatLKR(totalEarnings)}
          sub="Fair median market rate payout"
          icon="💰"
          variant="gold"
        />
        <StatCard
          label="Pro-Bono Rescues"
          value={`${proBonoCount} free`}
          sub="Volunteer community missions"
          icon="💚"
          variant="success"
        />
        <StatCard
          label="Completed Deliveries"
          value={myHandovers.filter((h) => h.confirmed).length}
          sub="Safe temperature verified"
          icon="📦"
          variant="success"
        />
        <StatCard
          label="Available Missions"
          value={availableMatches.length}
          sub="Ready for courier dispatch"
          icon="⚡"
          variant={availableMatches.length > 0 ? 'warning' : 'default'}
        />
      </div>

      {activePickup ? (
        <div className="fl-card" style={{ borderLeft: '4px solid var(--fl-secondary)', marginBottom: '2rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="fl-badge fl-badge-warning">Active Rescue In Progress</span>
            <span className={`fl-badge ${activePickup.payoutMode === 'paid' ? 'fl-badge-safe' : 'fl-badge-neutral'}`}>
              {activePickup.payoutMode === 'paid' ? `💰 Paid Rate (${formatLKR(activePickup.earnedFee || 450)})` : '💚 Pro-Bono'}
            </span>
          </div>
          <h3 style={{ margin: '4px 0' }}>Current Delivery Route Active</h3>
          <p style={{ color: 'var(--fl-text-muted)', marginBottom: '1rem' }}>
            You have claimed a food rescue mission. Maintain hot storage in insulated bags and track your route live on the map.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to={`/volunteer/delivery/${activePickup.id}`} className="fl-btn fl-btn-secondary">
              View Delivery Checklist & Temperature →
            </Link>
            <Link to="/map" className="fl-btn fl-btn-ghost">
              🗺️ Open Route on Map
            </Link>
          </div>
        </div>
      ) : (
        <div className="fl-card" style={{ textAlign: 'center', padding: '3rem 1rem', marginBottom: '2rem' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🛵</span>
          <h3>Ready for a Rescue Mission?</h3>
          <p style={{ color: 'var(--fl-text-muted)', margin: '0.5rem 0 1.5rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            Check the live pickup board or inspect the Colombo Map View to see accepted restaurant food donations needing transport.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Link to="/volunteer/pickups" className="fl-btn fl-btn-primary fl-btn-lg">
              View Live Pickup Board ({availableMatches.length})
            </Link>
            <Link to="/map" className="fl-btn fl-btn-ghost fl-btn-lg">
              🗺️ View on Map
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
