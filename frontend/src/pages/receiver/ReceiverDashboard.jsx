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
  const [expandedTrackerId, setExpandedTrackerId] = useState(null);

  // Pending matches targeted to this receiver
  const pendingOffers = state.matches.filter((m) => {
    if (m.status !== 'pending') return false;
    const candidate = m.rankedReceivers?.[m.currentOfferIndex];
    return candidate?.receiverId === receiver.id;
  });

  // Active surplus listings in the network that remain available for shelters to request
  const availableSurplusListings = state.listings.filter((l) =>
    !l.isClaimedBatch &&
    (!l.claimedByReceiverId || l.claimedByReceiverId !== receiver.id) &&
    (l.quantity > 0) &&
    ['selling', 'donating'].includes(l.status)
  );

  // Batches that have been requested by this receiver
  const myClaimedBatches = state.listings.filter((l) =>
    (l.isClaimedBatch || l.claimedByReceiverId === receiver.id) &&
    ['selling', 'donating', 'donated'].includes(l.status)
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
      setNotification(`⚠️ Cannot request ${listing.foodName}: This batch has passed its safety deadline and expired.`);
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    const qty = currentQty || Math.min(listing.quantity, 15);
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

    setExpandedTrackerId(targetMatchId);
    setNotification(`✓ Requested ${qty} ${listing.unit} of ${listing.foodName}! Live delivery tracker is active on your card.`);
    setTimeout(() => setNotification(null), 6000);
  }

  function handleSimulatePickup(handoverId) {
    if (!handoverId) return;
    dispatch({
      type: ACTION_TYPES.CONFIRM_PICKUP,
      payload: {
        handoverId,
        timestamp: Date.now(),
        temperatureCheck: 'Hot (>60°C)',
      },
    });
    setNotification('🛵 Volunteer courier confirmed pickup with food safety check: Hot (>60°C)!');
    setTimeout(() => setNotification(null), 5000);
  }

  function handleSimulateDeliver(handoverId) {
    if (!handoverId) return;
    dispatch({
      type: ACTION_TYPES.CONFIRM_DELIVERY,
      payload: {
        handoverId,
        timestamp: Date.now(),
        deliveryNotes: `Safely received by ${receiver.name} kitchen coordinator.`,
      },
    });
    setNotification(`🎉 Delivery confirmed! Safe meals handed over to ${receiver.name}.`);
    setTimeout(() => setNotification(null), 5000);
  }

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-secondary)', letterSpacing: '0.05em' }}>RECEIVER PORTAL</p>
          <h1 style={{ fontSize: '2rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>
            {receiver.name}
          </h1>
          <p style={{ color: 'var(--fl-text-muted)' }}>
            📍 {receiver.area} • Category focus: {receiver.acceptedCategories?.join(', ')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Live Real-Time Clock Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(31, 138, 91, 0.1)', border: '1px solid var(--fl-green)', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--fl-green)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--fl-green)', animation: 'pulse 1.5s infinite' }} />
            🕒 Real-Time Clock (1x Active)
          </div>

          <Link to="/map" className="fl-btn fl-btn-secondary fl-btn-md">
            🗺️ View on Live Map
          </Link>
          <Link to="/receiver/offers" className="fl-btn fl-btn-primary fl-btn-md">
            🔔 Incoming Offers ({pendingOffers.length})
          </Link>
          <Link to="/receiver/history" className="fl-btn fl-btn-ghost fl-btn-md">
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
          value={availableSurplusListings.length}
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
      <div className="fl-card" style={{ marginBottom: '2rem', padding: '1.25rem', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px' }}>Live Hunger / Shelter Need Level: {receiver.currentNeed}%</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--fl-text-muted)', margin: 0 }}>
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

      {/* SECTION 1: REQUESTED BATCHES & LIVE COURIER TRACKING */}
      {myClaimedBatches.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🚚</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--fl-text-heading)', margin: 0 }}>
                Your Requested Batches & Live Delivery Tracking
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--fl-text-muted)', margin: 0 }}>
                Track courier pickup status, temperature verification, and shelter arrival for portions requested by your organization.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {myClaimedBatches.map((listing) => {
              const restaurant = state.restaurants.find((r) => r.id === listing.restaurantId);
              const handover = state.handovers.find((h) => h.listingId === listing.id || h.matchId === listing.matchId);
              const volunteer = state.volunteers.find((v) => v.id === handover?.volunteerId) || state.volunteers[0] || {
                name: 'Kasun Perera',
                vehicle: 'Motorbike / Thermal Carrier',
                phone: '077 123 4567',
              };
              const isTrackingOpen = expandedTrackerId === listing.id || expandedTrackerId === listing.matchId;

              const foodThumb =
                listing.category === 'bakery'
                  ? '/images/bakery.jpg'
                  : listing.foodName?.toLowerCase().includes('biryani') || listing.foodName?.toLowerCase().includes('rice') || listing.category === 'cooked'
                  ? '/images/biryani.jpg'
                  : '/images/hero-buffet.jpg';

              return (
                <div
                  key={listing.id}
                  className="fl-card fl-animate-slide"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    border: '2px solid var(--fl-green)',
                    background: '#fff',
                    boxShadow: '0 6px 20px rgba(31, 138, 91, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Top Image Banner */}
                  <div style={{ position: 'relative', height: '115px', background: 'var(--fl-bg-sunken)' }}>
                    <img src={foodThumb} alt={listing.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                      <span className="fl-badge fl-badge-safe" style={{ background: 'var(--fl-green)', color: '#fff', fontWeight: 700 }}>
                        🎉 REQUESTED BY YOUR SHELTER
                      </span>
                    </div>
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      <ExpiryClock unsafeByTime={listing.unsafeByTime} compact />
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '16px', color: 'var(--fl-text-heading)' }}>{listing.foodName}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--fl-text-muted)', margin: '0 0 8px' }}>
                        📍 <strong>{restaurant?.name}</strong> ({restaurant?.area})
                      </p>

                      {/* Allocated Portion Summary */}
                      <div style={{ background: 'rgba(31, 138, 91, 0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(31, 138, 91, 0.2)', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: 'var(--fl-text-muted)' }}>Portions Allocated:</span>
                          <strong style={{ fontSize: '14px', color: 'var(--fl-green)' }}>
                            {listing.claimedPortions || listing.quantity} {listing.unit}
                          </strong>
                        </div>
                        <div style={{ marginTop: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontWeight: 700 }}>Status:</span>
                          {handover?.confirmed ? (
                            <span style={{ color: 'var(--fl-green)', fontWeight: 700 }}>✅ Delivered Safely to Kitchen</span>
                          ) : handover?.pickedUpAt ? (
                            <span style={{ color: 'var(--fl-teal)', fontWeight: 700 }}>🛵 Picked Up (&gt;60°C Verified) • En Route</span>
                          ) : (
                            <span style={{ color: 'var(--fl-gold)', fontWeight: 700 }}>⏳ Courier Dispatched to Restaurant</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Track Delivery Button in Exactly This Card */}
                    <div style={{ marginTop: '10px' }}>
                      <button
                        className={`fl-btn ${isTrackingOpen ? 'fl-btn-secondary' : 'fl-btn-primary'} fl-btn-sm`}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={() => setExpandedTrackerId(isTrackingOpen ? null : listing.id)}
                      >
                        <span>🚚</span>
                        {isTrackingOpen ? '▲ Hide Live Tracking' : '🚚 Track Delivery Status'}
                      </button>

                      {/* Expandable Live Tracking Panel Inside The Card */}
                      {isTrackingOpen && (
                        <div
                          className="fl-animate-slide"
                          style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: 'var(--fl-bg-sunken)',
                            borderRadius: '8px',
                            border: '1px solid var(--fl-border)',
                            fontSize: '12px',
                          }}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--fl-text-heading)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>📍 Live Courier Progress</span>
                            <span style={{ color: 'var(--fl-green)' }}>Real-Time</span>
                          </div>

                          {/* Stepper Progress */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: 'var(--fl-green)', fontWeight: 700 }}>✓</span>
                              <span style={{ color: 'var(--fl-text-heading)' }}>1. Shelter Request Confirmed</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: 'var(--fl-green)', fontWeight: 700 }}>✓</span>
                              <span>2. Courier Assigned: <strong>{volunteer.name}</strong> ({volunteer.vehicle})</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: handover?.pickedUpAt ? 'var(--fl-green)' : 'var(--fl-text-muted)', fontWeight: 700 }}>
                                {handover?.pickedUpAt ? '✓' : '○'}
                              </span>
                              <span>
                                3. Food Handover & Temp Check:
                                <strong style={{ color: handover?.pickedUpAt ? 'var(--fl-green)' : 'inherit' }}>
                                  {' '}{handover?.temperatureCheck || 'Pending Handover (>60°C)'}
                                </strong>
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: handover?.confirmed ? 'var(--fl-green)' : 'var(--fl-text-muted)', fontWeight: 700 }}>
                                {handover?.confirmed ? '✓' : '○'}
                              </span>
                              <span>
                                4. Safe Delivery at {receiver.name}:
                                <strong>{handover?.confirmed ? ' Completed' : ' In Transit'}</strong>
                              </span>
                            </div>
                          </div>

                          {/* Driver Contact Box */}
                          <div style={{ background: '#fff', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--fl-border)', marginBottom: '10px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--fl-text-muted)' }}>Assigned Courier Contact:</div>
                            <div style={{ fontWeight: 700 }}>📞 {volunteer.phone || '077 123 4567'} • {volunteer.name}</div>
                          </div>

                          {/* Interactive Simulation Controls */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {!handover?.pickedUpAt && (
                              <button
                                className="fl-btn fl-btn-secondary fl-btn-xs"
                                style={{ flex: 1 }}
                                onClick={() => handleSimulatePickup(handover?.id)}
                              >
                                🛵 Simulate Courier Pickup (&gt;60°C)
                              </button>
                            )}

                            {handover?.pickedUpAt && !handover?.confirmed && (
                              <button
                                className="fl-btn fl-btn-primary fl-btn-xs"
                                style={{ flex: 1 }}
                                onClick={() => handleSimulateDeliver(handover?.id)}
                              >
                                ✅ Simulate Safe Delivery to Shelter
                              </button>
                            )}

                            {handover?.confirmed && (
                              <div style={{ width: '100%', textAlign: 'center', color: 'var(--fl-green)', fontWeight: 700, padding: '4px' }}>
                                🎉 Food safely delivered and logged!
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: AVAILABLE SURPLUS FOOD BATCHES ACROSS COLOMBO */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--fl-text-heading)', margin: 0 }}>
              Available Food Batches Across Colombo (Remaining Portions Active)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--fl-text-muted)', margin: 0 }}>
              Surplus food listed by hotels & restaurants. Request only what your shelter needs — remaining portions stay active for other homes.
            </p>
          </div>
          <Link to="/map" className="fl-btn fl-btn-sm fl-btn-secondary">
            🗺️ Open Interactive Map View →
          </Link>
        </div>

        {availableSurplusListings.length === 0 ? (
          <div className="fl-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🍲</span>
            <p style={{ color: 'var(--fl-text-muted)', margin: 0 }}>
              All current surplus batches have been claimed! Check back soon or view the live map.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {availableSurplusListings.map((listing) => {
              const restaurant = state.restaurants.find((r) => r.id === listing.restaurantId);
              const currentQty = requestedPortions[listing.id] || Math.min(listing.quantity, 15);
              const isExpired = listing.unsafeByTime <= (state.simNow || Date.now()) || listing.status === 'expired';
              const isPartialRemaining = listing.originalTotalQuantity && listing.quantity < listing.originalTotalQuantity;

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
                      <span className={`fl-badge ${isExpired ? 'fl-badge-danger' : isPartialRemaining ? 'fl-badge-safe' : 'fl-badge-safe'}`}>
                        {isExpired ? '⛔ EXPIRED' : isPartialRemaining ? '🟢 REMAINING AVAILABLE' : listing.category}
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

                      <p style={{ fontSize: '13px', margin: '0 0 4px', fontWeight: 700, color: 'var(--fl-text-heading)' }}>
                        Total Available: <span style={{ color: 'var(--fl-green)' }}>{listing.quantity} {listing.unit}</span>
                      </p>

                      {isPartialRemaining && (
                        <p style={{ fontSize: '11px', color: 'var(--fl-green)', margin: '0 0 6px', fontWeight: 600 }}>
                          ✓ {listing.quantity} portions remain active for other homes ({listing.originalTotalQuantity - listing.quantity} previously claimed).
                        </p>
                      )}

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
        )}
      </div>
    </div>
  );
}
