/* IncomingOffers — live offers for receiver with partial quantity request */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFoodLoop, ACTION_TYPES } from '../../context/FoodLoopContext.jsx';
import { formatTimeRemaining } from '../../utils/format.js';
import ExpiryClock from '../../components/ExpiryClock.jsx';

export default function IncomingOffers() {
  const { state, dispatch } = useFoodLoop();
  const receiverId = state.currentUser?.id;
  const [quantities, setQuantities] = useState({});

  // Find matches where receiver is ranked or accepted
  const pendingOffers = state.matches.filter((m) => {
    if (m.status !== 'pending') return false;
    const currentCandidate = m.rankedReceivers?.[m.currentOfferIndex];
    return currentCandidate?.receiverId === receiverId;
  });

  function handleAccept(matchId, maxQty, isExpired) {
    if (isExpired) return;
    const requestedQuantity = quantities[matchId] || maxQty;
    dispatch({
      type: ACTION_TYPES.ACCEPT_MATCH,
      payload: { matchId, receiverId, requestedQuantity },
    });
  }

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-secondary)', letterSpacing: '0.05em' }}>RECEIVER PORTAL</p>
          <h1 style={{ fontSize: '1.875rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>Incoming Food Offers</h1>
          <p style={{ color: 'var(--fl-text-muted)' }}>
            Request the exact quantity your shelter needs. Any remaining portions stay available for other homes.
          </p>
        </div>

        <Link to="/map" className="fl-btn fl-btn-secondary">
          🗺️ View on Live Map
        </Link>
      </div>

      {pendingOffers.length === 0 ? (
        <div className="fl-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🍲</span>
          <p style={{ fontSize: '1.125rem', color: 'var(--fl-text-muted)', marginBottom: '0.5rem' }}>No pending direct offers right now.</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)' }}>
            Explore the live map to discover available food batches posted by Colombo restaurants.
          </p>
          <Link to="/map" className="fl-btn fl-btn-primary" style={{ marginTop: '1rem' }}>
            Explore Live Map →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {pendingOffers.map((match) => {
            const listing = state.listings.find((l) => l.id === match.listingId);
            const restaurant = state.restaurants.find((r) => r.id === listing?.restaurantId);
            if (!listing) return null;

            const selectedQty = quantities[match.id] || listing.quantity;
            const isExpired = listing.unsafeByTime <= (state.simNow || Date.now()) || listing.status === 'expired';

            const foodThumb =
              listing.category === 'bakery' || listing.foodName?.toLowerCase().includes('pastr') || listing.foodName?.toLowerCase().includes('bread')
                ? '/images/bakery.jpg'
                : listing.foodName?.toLowerCase().includes('biryani') || listing.foodName?.toLowerCase().includes('rice') || listing.category === 'cooked'
                ? '/images/biryani.jpg'
                : '/images/hero-buffet.jpg';

            return (
              <div key={match.id} className="fl-card fl-animate-slide" style={{ padding: '1.5rem', borderLeft: `4px solid ${isExpired ? 'var(--fl-danger)' : 'var(--fl-green)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '84px', height: '84px', borderRadius: 'var(--fl-radius-md)', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--fl-shadow-sm)' }}>
                      <img
                        src={foodThumb}
                        alt={listing.foodName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className={`fl-badge ${isExpired ? 'fl-badge-danger' : 'fl-badge-warning'}`}>
                          {isExpired ? '⛔ EXPIRED (FOOD UNSAFE)' : 'Offer Pending Acceptance'}
                        </span>
                        <ExpiryClock unsafeByTime={listing.unsafeByTime} compact />
                      </div>
                      <h3 style={{ margin: '4px 0', fontSize: '1.35rem' }}>{listing.foodName}</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', margin: 0 }}>
                        From: <strong>{restaurant?.name}</strong> ({restaurant?.area}) • Total batch available: <strong>{listing.quantity} {listing.unit}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Partial Quantity Request Selector */}
                <div style={{ background: isExpired ? 'rgba(239, 68, 68, 0.08)' : 'var(--fl-bg-sunken)', padding: '12px 16px', borderRadius: 'var(--fl-radius-md)', marginBottom: '1rem', border: `1px solid ${isExpired ? 'var(--fl-danger)' : 'var(--fl-border)'}` }}>
                  {isExpired ? (
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fl-danger)' }}>
                      ⚠️ Safety window has expired. This food batch is unsafe for human consumption and cannot be requested.
                    </div>
                  ) : (
                    <>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fl-text-heading)', display: 'block', marginBottom: '6px' }}>
                        Specify Portions Needed by Your Organization:
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="number"
                          min="1"
                          max={listing.quantity}
                          className="fl-input"
                          style={{ width: '100px', fontWeight: 700 }}
                          value={selectedQty}
                          onChange={(e) =>
                            setQuantities({
                              ...quantities,
                              [match.id]: Math.min(listing.quantity, Math.max(1, Number(e.target.value))),
                            })
                          }
                        />
                        <span style={{ fontSize: '13px', color: 'var(--fl-text-muted)' }}>
                          out of <strong>{listing.quantity} {listing.unit}</strong> available
                        </span>
                      </div>
                      {listing.quantity > selectedQty && (
                        <p style={{ fontSize: '11px', color: 'var(--fl-green)', marginTop: '6px' }}>
                          ✓ {listing.quantity - selectedQty} {listing.unit} will stay available on the network for other shelters.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className={`fl-btn ${isExpired ? 'fl-btn-ghost' : 'fl-btn-secondary'} fl-btn-lg`}
                    disabled={isExpired}
                    style={isExpired ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--fl-border)', color: 'var(--fl-text-muted)' } : {}}
                    onClick={() => handleAccept(match.id, listing.quantity, isExpired)}
                  >
                    {isExpired ? '⛔ Expired - Cannot Request' : `✓ Accept ${selectedQty} ${listing.unit} for Shelter →`}
                  </button>
                  <button
                    className="fl-btn fl-btn-ghost fl-btn-lg"
                    onClick={() => dispatch({ type: ACTION_TYPES.DECLINE_MATCH, payload: { matchId: match.id, receiverId, reason: isExpired ? 'Expired' : 'At capacity' } })}
                  >
                    {isExpired ? 'Dismiss' : 'Decline'}
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
