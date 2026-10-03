/* PickupBoard — open donation missions for riders with fair median compensation and volunteer choice */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFoodLoop, ACTION_TYPES } from '../../context/FoodLoopContext.jsx';
import { formatTimeRemaining, formatLKR, formatDistance, haversineKm, calculateFairDeliveryFee } from '../../utils/format.js';

export default function PickupBoard() {
  const { state, dispatch } = useFoodLoop();
  const navigate = useNavigate();
  const volunteer = state.currentUser;

  // Selected payout mode per mission id: 'paid' or 'volunteer'
  const [payoutModes, setPayoutModes] = useState({});

  // Find accepted matches that don't have a handover yet
  const availableMatches = state.matches.filter((m) => {
    if (m.status !== 'accepted') return false;
    const hasHandover = state.handovers.some((h) => h.matchId === m.id);
    return !hasHandover;
  });

  function handleClaim(match, distanceKm, fairFee) {
    const selectedMode = payoutModes[match.id] || 'paid'; // default to fair paid fee
    const handoverId = 'h-' + Date.now();
    const handover = {
      id: handoverId,
      matchId: match.id,
      listingId: match.listingId,
      volunteerId: volunteer?.id || 'vol-001',
      receiverId: match.acceptedBy,
      distanceKm,
      payoutMode: selectedMode,
      earnedFee: selectedMode === 'paid' ? fairFee : 0,
      claimedAt: state.simNow,
      pickedUpAt: null,
      deliveredAt: null,
      temperatureCheck: null,
      confirmed: false,
    };

    dispatch({ type: ACTION_TYPES.CLAIM_PICKUP, payload: handover });
    navigate(`/volunteer/delivery/${handoverId}`);
  }

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-accent)', letterSpacing: '0.05em' }}>COURIER RESCUE BOARD</p>
          <h1 style={{ fontSize: '1.875rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>Available Pickup Missions</h1>
          <p style={{ color: 'var(--fl-text-muted)' }}>
            Choose paid courier delivery at median fair market rates, or deliver pro-bono as a community volunteer.
          </p>
        </div>
        <Link to="/map" className="fl-btn fl-btn-secondary">
          🗺️ View Missions on Live Map
        </Link>
      </div>

      {availableMatches.length === 0 ? (
        <div className="fl-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🛵</span>
          <p style={{ fontSize: '1.125rem', color: 'var(--fl-text-muted)', marginBottom: '0.5rem' }}>No open pickups right now.</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)' }}>
            When a recipient home accepts a restaurant surplus batch, it appears here instantly for courier dispatch.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {availableMatches.map((m) => {
            const listing = state.listings.find((l) => l.id === m.listingId);
            const restaurant = state.restaurants.find((r) => r.id === listing?.restaurantId);
            const receiver = state.receivers.find((r) => r.id === m.acceptedBy);

            const distanceKm = haversineKm(
              restaurant?.lat || 6.9271,
              restaurant?.lng || 79.8612,
              receiver?.lat || 6.93,
              receiver?.lng || 79.87
            );
            const fairFee = calculateFairDeliveryFee(distanceKm);
            const currentMode = payoutModes[m.id] || 'paid';

            const isExpired = (listing?.unsafeByTime || 0) <= state.simNow;
            const foodThumb =
              listing?.category === 'bakery'
                ? '/images/bakery.jpg'
                : listing?.foodName?.toLowerCase().includes('biryani') || listing?.foodName?.toLowerCase().includes('rice') || listing?.category === 'cooked'
                ? '/images/biryani.jpg'
                : '/images/hero-buffet.jpg';

            return (
              <div key={m.id} className="fl-card" style={{ padding: '1.25rem', borderLeft: `4px solid ${isExpired ? 'var(--fl-danger)' : 'var(--fl-green)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <img
                      src={foodThumb}
                      alt={listing?.foodName || 'Meal'}
                      style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: 'var(--fl-radius-md)', flexShrink: 0 }}
                    />
                    <div>
                      <span className={`fl-badge ${isExpired ? 'fl-badge-danger' : 'fl-badge-safe'}`} style={{ marginBottom: '0.4rem' }}>
                        {isExpired ? '⛔ EXPIRED (UNSAFE)' : `⚡ Ready for Pickup (${formatDistance(distanceKm)})`}
                      </span>
                      <h3 style={{ margin: '2px 0 4px', fontSize: '1.2rem' }}>
                        {listing?.foodName} — <strong>{m.requestedQuantity || listing?.quantity} {listing?.unit}</strong>
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--fl-text-muted)', margin: '0 0 4px' }}>
                        Pickup: <strong>{restaurant?.name || 'Restaurant'}</strong> ({restaurant?.area})
                        {' ➔ '}
                        Dropoff: <strong>{receiver?.name || 'Charity'}</strong> ({receiver?.area})
                      </p>
                      <p style={{ fontSize: '0.75rem', color: isExpired ? 'var(--fl-danger)' : 'var(--fl-text-muted)', margin: 0, fontWeight: 600 }}>
                        {isExpired ? '🚨 Safety deadline expired: Food is unsafe for consumption.' : `🚨 Must deliver before deadline: ${formatTimeRemaining((listing?.unsafeByTime || 0) - state.simNow)}`}
                      </p>
                    </div>
                  </div>

                  {/* Median Fair Price Payout Box */}
                  <div style={{ background: 'var(--fl-bg-sunken)', padding: '10px 16px', borderRadius: 'var(--fl-radius-md)', textAlign: 'right', border: '1px solid var(--fl-border)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--fl-text-muted)', textTransform: 'uppercase' }}>Median Fair Courier Fee</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--fl-green-dark)' }}>
                      {formatLKR(fairFee)}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--fl-text-muted)' }}>Benchmarked for {formatDistance(distanceKm)} route</span>
                  </div>
                </div>

                {/* Courier Compensation Choice: Paid vs Volunteer */}
                <div style={{ borderTop: '1px dashed var(--fl-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fl-text-heading)' }}>Rider Compensation:</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`payout-${m.id}`}
                        disabled={isExpired}
                        checked={currentMode === 'paid'}
                        onChange={() => setPayoutModes((prev) => ({ ...prev, [m.id]: 'paid' }))}
                      />
                      <span>💰 Paid Delivery (+{formatLKR(fairFee)})</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`payout-${m.id}`}
                        disabled={isExpired}
                        checked={currentMode === 'volunteer'}
                        onChange={() => setPayoutModes((prev) => ({ ...prev, [m.id]: 'volunteer' }))}
                      />
                      <span>💚 Deliver for Free (Pro-Bono Community Volunteer)</span>
                    </label>
                  </div>

                  <button
                    className={`fl-btn ${isExpired ? 'fl-btn-ghost' : currentMode === 'paid' ? 'fl-btn-primary' : 'fl-btn-secondary'}`}
                    disabled={isExpired}
                    style={isExpired ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--fl-border)', color: 'var(--fl-text-muted)' } : {}}
                    onClick={() => !isExpired && handleClaim(m, distanceKm, fairFee)}
                  >
                    {isExpired ? '⛔ Expired (Food Unsafe - Cannot Dispatch)' : currentMode === 'paid' ? `Claim Mission & Earn ${formatLKR(fairFee)} →` : 'Claim as Pro-Bono Volunteer →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
