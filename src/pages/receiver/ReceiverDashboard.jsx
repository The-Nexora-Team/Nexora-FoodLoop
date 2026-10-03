import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFoodLoop, ACTION_TYPES } from '../../context/FoodLoopContext.jsx';
import StatCard from '../../components/StatCard.jsx';
import ExpiryClock from '../../components/ExpiryClock.jsx';
import { formatTimeRemaining } from '../../utils/format.js';

export default function ReceiverDashboard() {
  const { state, dispatch } = useFoodLoop();
  const user = state.currentUser;
  const receiver = state.receivers.find((r) => r.id === user?.id) ||
    state.receivers[0] || {
      id: user?.id || 'recv-001',
      name: user?.name || "Sisu Diriya Children's Home",
      area: 'Dehiwala - Mount Lavinia',
      acceptedCategories: ['cooked', 'bakery', 'dairy'],
      currentNeed: 80,
      capacity: 50,
    };

  const [requestedPortions, setRequestedPortions] = useState({});
  const [notification, setNotification] = useState(null);

  // Pending matches targeted to this receiver
  const pendingOffers = state.matches.filter((m) => {
    if (m.status !== 'pending') return false;
    const candidate = m.rankedReceivers?.[m.currentOfferIndex];
    return candidate?.receiverId === receiver.id;
  });

  // All active listings in the network posted by restaurants
  const activeListings = state.listings.filter((l) =>
    ['selling', 'donating'].includes(l.status)
  );

  const myAcceptedMatches = state.matches.filter((m) => m.acceptedBy === receiver.id);
  const myHandovers = state.handovers.filter((h) => h.receiverId === receiver.id);
  const inTransitHandovers = myHandovers.filter((h) => !h.confirmed);

  function handleUpdateNeed(newNeed) {
    dispatch({
      type: ACTION_TYPES.UPDATE_RECEIVER,
      payload: { id: receiver.id, currentNeed: newNeed },
    });
  }

  function handleAcceptFoodDirect(listing, currentQty) {
    const isExpired = listing.unsafeByTime <= (state.simNow || Date.now()) || listing.status === 'expired';
    if (isExpired) {
      setNotification(`⚠️ Cannot request ${listing.foodName}: This batch has passed its safety deadline and expired. It cannot be consumed.`);
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    const qty = currentQty || listing.quantity;
    let match = state.matches.find((m) => m.listingId === listing.id);
    let targetMatchId = match?.id;

    if (!targetMatchId) {
      targetMatchId = 'match-' + Date.now();
      dispatch({
        type: ACTION_TYPES.CREATE_MATCH,
        payload: {
          id: targetMatchId,
          listingId: listing.id,
          currentOfferIndex: 0,
          offerSentAt: state.simNow || Date.now(),
          status: 'pending',
          rankedReceivers: [{ receiverId: receiver.id, rank: 1, score: 100 }],
        },
      });
    }

    dispatch({
      type: ACTION_TYPES.ACCEPT_MATCH,
      payload: { matchId: targetMatchId, receiverId: receiver.id, requestedQuantity: qty },
    });

    setNotification(`✓ Requested ${qty} ${listing.unit} of ${listing.foodName}! Ready for volunteer pickup.`);
    setTimeout(() => setNotification(null), 5000);
  }

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-secondary)', letterSpacing: '0.05em' }}>RECEIVER PORTAL</p>
          <h1 style={{ fontSize: '2rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>
            {receiver.name}
          </h1>
          <p style={{ color: 'var(--fl-text-muted)' }}>
            📍 {receiver.area} • Category focus: {receiver.acceptedCategories?.join(', ')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link to="/map" className="fl-btn fl-btn-secondary fl-btn-lg">
            🗺️ View Available Food on Live Map
          </Link>
          <Link to="/receiver/offers" className="fl-btn fl-btn-primary fl-btn-lg">
            🔔 Incoming Offers ({pendingOffers.length})
          </Link>
          <Link to="/receiver/history" className="fl-btn fl-btn-ghost fl-btn-lg">
            📜 History
          </Link>
        </div>
      </div>

      {notification && (
        <div className="fl-card fl-animate-slide" style={{ background: 'var(--fl-green-light)', borderLeft: '5px solid var(--fl-green)', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, color: 'var(--fl-text-heading)' }}>{notification}</span>
          <button className="fl-btn fl-btn-ghost fl-btn-sm" onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      {/* Shelter Mission Banner */}
      <div className="fl-card" style={{
        background: 'linear-gradient(135deg, rgba(31, 138, 91, 0.08) 0%, rgba(15, 61, 62, 0.05) 100%)',
        border: '1px solid var(--fl-green)',
        padding: '1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <img
          src="/images/community-shelter.jpg"
          alt="Community Shelter Meals"
          style={{ width: '130px', height: '90px', objectFit: 'cover', borderRadius: 'var(--fl-radius-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <div style={{ flex: 1, minWidth: '240px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: 'var(--fl-text-heading)' }}>
            Nourishing Communities with Dignity & Safety
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--fl-text-muted)' }}>
            Verified surplus meals from Colombo hotels and caterers are temperature-logged (&gt;60°C hot holding) and couriered directly to your shelter. Request only the portion count your kitchen needs.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          label="Pending Offers"
          value={pendingOffers.length}
          sub="Requires decision before expiry"
          icon="🔔"
          variant={pendingOffers.length > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Available on Map"
          value={activeListings.length}
          sub="Surplus batches across Colombo"
          icon="🗺️"
          variant="gold"
        />
        <StatCard
          label="In-Transit Deliveries"
          value={inTransitHandovers.length}
          sub="Couriers on the road"
          icon="🛵"
          variant="success"
        />
        <StatCard
          label="Total Rescues Received"
          value={myAcceptedMatches.length}
          sub="Verified nutritious meals"
          icon="🍲"
          variant="success"
        />
      </div>

      {/* Live Urgency / Need Control Slider for Demo */}
      <div className="fl-card" style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 4px' }}>Live Hunger / Need Urgency Level: {receiver.currentNeed}%</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)' }}>
              Adjust urgency score to test how the matching engine recalculates weighted rank priority in real-time.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[30, 60, 85, 100].map((val) => (
              <button
                key={val}
                className={`fl-btn fl-btn-sm ${receiver.currentNeed === val ? 'fl-btn-primary' : 'fl-btn-ghost'}`}
                onClick={() => handleUpdateNeed(val)}
              >
                {val}% {val >= 85 ? '🚨 High' : val >= 60 ? '⚡ Mod' : 'Normal'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent Incoming Direct Matches Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--fl-text-heading)', marginBottom: '1rem' }}>
          Direct Matched Food Offers (Priority Target)
        </h2>

        {pendingOffers.length === 0 ? (
          <div className="fl-card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>✅</span>
            <p style={{ fontSize: '1rem', color: 'var(--fl-text-muted)' }}>
              No direct pending offers waiting for urgent approval right now.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--fl-text-muted)', marginTop: '4px' }}>
              Check the Live Map below to view all surplus batches posted across Colombo restaurants.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {pendingOffers.map((match) => {
              const listing = state.listings.find((l) => l.id === match.listingId);
              const restaurant = state.restaurants.find((r) => r.id === listing?.restaurantId);
              if (!listing) return null;

              const isExpired = listing.unsafeByTime <= (state.simNow || Date.now()) || listing.status === 'expired';

              return (
                <div key={match.id} className="fl-card fl-animate-slide" style={{ borderLeft: `4px solid ${isExpired ? 'var(--fl-danger)' : 'var(--fl-gold)'}`, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className={`fl-badge ${isExpired ? 'fl-badge-danger' : 'fl-badge-warning'}`}>
                        {isExpired ? '⛔ EXPIRED (FOOD UNSAFE)' : 'URGENT ACTION NEEDED'}
                      </span>
                      <ExpiryClock unsafeByTime={listing.unsafeByTime} compact />
                    </div>
                    <h3 style={{ margin: '4px 0' }}>{listing.foodName}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)' }}>
                      From: <strong>{restaurant?.name}</strong> • Quantity: <strong>{listing.quantity} {listing.unit}</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="fl-btn fl-btn-secondary fl-btn-lg"
                      disabled={isExpired}
                      style={isExpired ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--fl-border)', color: 'var(--fl-text-muted)' } : {}}
                      onClick={() => !isExpired && dispatch({ type: ACTION_TYPES.ACCEPT_MATCH, payload: { matchId: match.id, receiverId: receiver.id, requestedQuantity: listing.quantity } })}
                    >
                      {isExpired ? '⛔ Expired - Cannot Request' : '✓ Accept Donation'}
                    </button>
                    <button
                      className="fl-btn fl-btn-ghost fl-btn-lg"
                      onClick={() => dispatch({ type: ACTION_TYPES.DECLINE_MATCH, payload: { matchId: match.id, receiverId: receiver.id, reason: 'Declined' } })}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Surplus Food in Real-Time Across Colombo */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--fl-text-heading)', margin: 0 }}>
              Available Food Batches Across Colombo (Real-Time)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--fl-text-muted)' }}>
              Surplus food listed by hotels & restaurants before expiry. View live locations on map.
            </p>
          </div>
          <Link to="/map" className="fl-btn fl-btn-sm fl-btn-secondary">
            🗺️ Open Interactive Map View →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {activeListings.map((listing) => {
            const restaurant = state.restaurants.find((r) => r.id === listing.restaurantId);
            const currentQty = requestedPortions[listing.id] || Math.min(listing.quantity, 15);
            const isExpired = listing.unsafeByTime <= (state.simNow || Date.now()) || listing.status === 'expired';

            const foodThumb =
              listing.category === 'bakery'
                ? '/images/bakery.jpg'
                : listing.foodName?.toLowerCase().includes('biryani') || listing.foodName?.toLowerCase().includes('rice') || listing.category === 'cooked'
                ? '/images/biryani.jpg'
                : '/images/hero-buffet.jpg';

            return (
              <div key={listing.id} className="fl-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0', overflow: 'hidden', border: isExpired ? '1px solid var(--fl-danger)' : undefined }}>
                <div style={{ position: 'relative', height: '110px', background: 'var(--fl-bg-sunken)' }}>
                  <img src={foodThumb} alt={listing.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                    <span className={`fl-badge ${isExpired ? 'fl-badge-danger' : 'fl-badge-safe'}`}>
                      {isExpired ? '⛔ EXPIRED' : listing.category}
                    </span>
                  </div>
                  <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                    <ExpiryClock unsafeByTime={listing.unsafeByTime} compact />
                  </div>
                </div>

                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '15px' }}>{listing.foodName}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--fl-text-muted)', margin: '0 0 4px' }}>
                      📍 <strong>{restaurant?.name}</strong> ({restaurant?.area})
                    </p>
                    <p style={{ fontSize: '12px', margin: '0 0 6px' }}>
                      Total Available: <strong>{listing.quantity} {listing.unit}</strong>
                    </p>

                    {/* Quantity Request Selector */}
                    <div style={{ marginTop: '8px', padding: '8px', background: isExpired ? 'rgba(239, 68, 68, 0.08)' : 'var(--fl-bg-sunken)', borderRadius: '6px', border: `1px solid ${isExpired ? 'var(--fl-danger)' : 'var(--fl-border)'}` }}>
                    {isExpired ? (
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fl-danger)', padding: '4px 0' }}>
                        ⚠️ Safety deadline has expired. This batch cannot be requested for donation.
                      </div>
                    ) : (
                      <>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fl-text-heading)', display: 'block', marginBottom: '4px' }}>
                          Portions Needed by Your Shelter:
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            min="1"
                            max={listing.quantity}
                            className="fl-input"
                            style={{ width: '80px', padding: '4px 8px', fontSize: '12px', fontWeight: 700 }}
                            value={currentQty}
                            onChange={(e) =>
                              setRequestedPortions({
                                ...requestedPortions,
                                [listing.id]: Math.min(listing.quantity, Math.max(1, Number(e.target.value))),
                              })
                            }
                          />
                          <span style={{ fontSize: '12px', color: 'var(--fl-text-muted)' }}>
                            of {listing.quantity} {listing.unit}
                          </span>
                        </div>
                        {listing.quantity > currentQty && (
                          <p style={{ fontSize: '10px', color: 'var(--fl-green)', marginTop: '4px', margin: '4px 0 0' }}>
                            ✓ {listing.quantity - currentQty} {listing.unit} will remain active for other homes.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    className={`fl-btn ${isExpired ? 'fl-btn-ghost' : 'fl-btn-secondary'} fl-btn-sm`}
                    style={{
                      flex: 1,
                      ...(isExpired ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--fl-border)', color: 'var(--fl-text-muted)' } : {})
                    }}
                    disabled={isExpired}
                    onClick={() => !isExpired && handleAcceptFoodDirect(listing, currentQty)}
                  >
                    {isExpired ? '⛔ Expired - Cannot Request' : `✓ Request ${currentQty} ${listing.unit}`}
                  </button>
                  <Link to="/map" className="fl-btn fl-btn-ghost fl-btn-sm">
                    📍 Map
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* In-Transit Deliveries */}
      {inTransitHandovers.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--fl-text-heading)', marginBottom: '1rem' }}>
            Food Rescues In Transit
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {inTransitHandovers.map((h) => {
              const listing = state.listings.find((l) => l.id === h.listingId);
              return (
                <div key={h.id} className="fl-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '2px 0' }}>{listing?.foodName}</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)' }}>
                      Courier {h.volunteerId} • {h.pickedUpAt ? 'En route with temperature checked' : 'Claimed, heading to restaurant'}
                    </p>
                  </div>
                  <span className="fl-badge fl-badge-warning">In Transit</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
