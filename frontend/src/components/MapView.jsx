/* MapView — interactive Leaflet map with real-time surplus batches, live order tracking to NGO, and partial quantity requests */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFoodLoop, ACTION_TYPES } from '../context/FoodLoopContext.jsx';
import { formatTimeRemaining, formatLKR, haversineKm, calculateFairDeliveryFee, formatDistance } from '../utils/format.js';
import { calculateDiscount, calculateDynamicPrice } from '../utils/wasteStrategy.js';
import './MapView.css';

// Fix standard Leaflet default icon issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom HTML Pin icons with active food badge
function createCustomIcon(emoji, bgClass, badgeCount = 0) {
  const badgeHtml = badgeCount > 0 ? `<span class="marker-badge-pulse">${badgeCount}</span>` : '';
  return L.divIcon({
    className: `custom-map-marker ${bgClass} ${badgeCount > 0 ? 'has-active-food' : ''}`,
    html: `
      <div class="marker-pin">
        <span class="marker-emoji">${emoji}</span>
        ${badgeHtml}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -34],
  });
}

const activeCourierIcon = L.divIcon({
  className: 'custom-map-marker marker-active-courier',
  html: `
    <div class="active-courier-pin">
      <span class="courier-pulse-ring"></span>
      <span class="marker-emoji" style="transform:none; font-size: 20px;">🛵</span>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

export default function MapView({ height = '580px' }) {
  const { state, dispatch } = useFoodLoop();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  // NGO custom requested quantity state per food id: { [foodId]: number }
  const [requestedQuantities, setRequestedQuantities] = useState({});

  const user = state.currentUser;
  const colomboCenter = [6.9271, 79.8612];

  const restaurants = state.restaurants || [];
  const receivers = state.receivers || [];
  const volunteers = state.volunteers || [];
  const listings = state.listings || [];
  const handovers = state.handovers || [];

  // Active in-transit delivery missions
  const activeDeliveries = handovers.filter((h) => !h.confirmed);

  function handleClaimMission(matchId, listingId, receiverId, distanceKm, fairFee) {
    const handoverId = 'h-' + Date.now();
    const handover = {
      id: handoverId,
      matchId,
      listingId,
      volunteerId: user?.id || 'vol-001',
      receiverId,
      distanceKm,
      payoutMode: 'paid',
      earnedFee: fairFee,
      claimedAt: state.simNow,
      pickedUpAt: null,
      deliveredAt: null,
      temperatureCheck: null,
      confirmed: false,
    };

    dispatch({ type: ACTION_TYPES.CLAIM_PICKUP, payload: handover });
    navigate(`/volunteer/delivery/${handoverId}`);
  }

  function handleAcceptDonation(matchId, receiverId, maxQty, foodId) {
    const foodItem = listings.find((l) => l.id === foodId);
    if (foodItem && (foodItem.unsafeByTime <= (state.simNow || Date.now()) || foodItem.status === 'expired')) {
      alert('⚠️ Cannot request: This food batch has reached its safety expiry limit and cannot be consumed.');
      return;
    }

    const requestedQty = requestedQuantities[foodId] || maxQty;
    let targetMatchId = matchId;

    if (!targetMatchId) {
      targetMatchId = 'match-' + Date.now();
      dispatch({
        type: ACTION_TYPES.CREATE_MATCH,
        payload: {
          id: targetMatchId,
          listingId: foodId,
          currentOfferIndex: 0,
          offerSentAt: state.simNow || Date.now(),
          status: 'pending',
          rankedReceivers: [{ receiverId, rank: 1, score: 100 }],
        },
      });
    }

    dispatch({
      type: ACTION_TYPES.ACCEPT_MATCH,
      payload: { matchId: targetMatchId, receiverId, requestedQuantity: requestedQty },
    });
    navigate('/receiver');
  }

  return (
    <div className="map-view-container fl-card">
      <div className="map-filter-bar">
        <div className="map-legend">
          <span className="legend-item">
            <span className="legend-dot restaurant-dot"></span>
            <strong>Restaurants</strong> ({restaurants.length})
          </span>
          <span className="legend-item">
            <span className="legend-dot receiver-dot"></span>
            <strong>Charities / Homes</strong> ({receivers.length})
          </span>
          <span className="legend-item">
            <span className="legend-dot volunteer-dot"></span>
            <strong>Couriers</strong> ({volunteers.length})
          </span>
          {activeDeliveries.length > 0 && (
            <span className="live-pill">
              <span className="live-dot"></span>
              <strong>{activeDeliveries.length} Live Route{activeDeliveries.length > 1 ? 's' : ''} to NGO</strong>
            </span>
          )}
        </div>

        <div className="filter-buttons">
          {['all', 'restaurant', 'receiver', 'volunteer'].map((f) => (
            <button
              key={f}
              className={`fl-btn fl-btn-sm ${filter === f ? 'fl-btn-primary' : 'fl-btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="leaflet-wrapper" style={{ height }}>
        <MapContainer
          center={colomboCenter}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', borderRadius: 'var(--fl-radius-md)' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ===== REAL-TIME ACTIVE ORDER TRANSIT ROUTES TO NGO ===== */}
          {activeDeliveries.map((delivery) => {
            const listing = listings.find((l) => l.id === delivery.listingId);
            const rest = restaurants.find((r) => r.id === listing?.restaurantId) || restaurants[0];
            const recv = receivers.find((r) => r.id === delivery.receiverId) || receivers[0];
            const courier = volunteers.find((v) => v.id === delivery.volunteerId) || { name: 'Kasun Perera' };

            const routeCoords = [
              [rest.lat || 6.9271, rest.lng || 79.8612],
              [recv.lat || 6.9300, recv.lng || 79.8700],
            ];

            // Interpolate courier location along route based on pickedUp status
            const progressRatio = delivery.pickedUpAt ? 0.65 : 0.25;
            const courierLat = routeCoords[0][0] + (routeCoords[1][0] - routeCoords[0][0]) * progressRatio;
            const courierLng = routeCoords[0][1] + (routeCoords[1][1] - routeCoords[0][1]) * progressRatio;

            return (
              <div key={delivery.id}>
                {/* Visual Transit Polyline between Restaurant and Destination NGO */}
                <Polyline
                  positions={routeCoords}
                  color="#1f8a5b"
                  weight={4}
                  dashArray="8, 8"
                  opacity={0.85}
                />

                {/* Animated Moving Courier Marker along the route */}
                <Marker position={[courierLat, courierLng]} icon={activeCourierIcon}>
                  <Popup>
                    <div className="map-popup-card" style={{ minWidth: '240px' }}>
                      <span className="fl-badge fl-badge-safe">🔴 LIVE RESCUE IN TRANSIT</span>
                      <h4 style={{ margin: '4px 0', color: 'var(--fl-text-heading)' }}>
                        Delivery to {recv.name}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--fl-text-muted)' }}>
                        Courier: <strong>{courier.name}</strong> • Mode: <span style={{ fontWeight: 700, color: 'var(--fl-green-dark)' }}>{delivery.payoutMode === 'paid' ? `Paid (${formatLKR(delivery.earnedFee || 450)})` : 'Pro-Bono Volunteer'}</span>
                      </p>
                      <div style={{ marginTop: '6px', padding: '6px', background: 'var(--fl-bg-sunken)', borderRadius: '6px', fontSize: '11px' }}>
                        <div>Package: <strong>{delivery.requestedQuantity || listing?.quantity} {listing?.unit}</strong> of {listing?.foodName}</div>
                        <div>Temperature check: <strong>{delivery.temperatureCheck || 'Heading to Restaurant for pickup'}</strong></div>
                        <div style={{ color: 'var(--fl-green)', fontWeight: 700, marginTop: '2px' }}>
                          Status: {delivery.pickedUpAt ? 'En-route to NGO (ETA: ~10 mins)' : 'Collecting food at restaurant'}
                        </div>
                      </div>
                    </div>
                  </Popup>
                  <Tooltip permanent direction="top" offset={[0, -20]}>
                    🛵 {courier.name} ➔ {recv.name} ({delivery.requestedQuantity || listing?.quantity} portions)
                  </Tooltip>
                </Marker>
              </div>
            );
          })}

          {/* ===== RESTAURANTS & SURPLUS FOOD BATCHES ===== */}
          {(filter === 'all' || filter === 'restaurant') &&
            restaurants.map((rest) => {
              const activeFood = listings.filter(
                (l) => l.restaurantId === rest.id && ['selling', 'donating', 'recycling'].includes(l.status)
              );

              const restIcon = createCustomIcon('🍽️', 'marker-restaurant', activeFood.length);

              return (
                <Marker
                  key={rest.id}
                  position={[rest.lat || 6.9271, rest.lng || 79.8612]}
                  icon={restIcon}
                >
                  <Popup>
                    <div className="map-popup-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="fl-badge fl-badge-warning">RESTAURANT</span>
                        {activeFood.length > 0 && (
                          <span className="fl-badge fl-badge-safe" style={{ fontSize: '10px' }}>
                            🔥 {activeFood.length} SURPLUS BATCH{activeFood.length > 1 ? 'ES' : ''} LIVE
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: '2px 0 4px', fontSize: '14px', color: 'var(--fl-text-heading)' }}>
                        {rest.name}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--fl-text-muted)' }}>📍 {rest.area}</p>

                      {/* Display active surplus food batch */}
                      {activeFood.length > 0 ? (
                        <div className="map-food-box">
                          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fl-gold-dark)', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Available Surplus Food Before Expiry:
                          </p>
                          {activeFood.map((food) => {
                            const remaining = Math.max(0, food.unsafeByTime - state.simNow);
                            const isExpired = remaining <= 0 || food.status === 'expired';
                            const discount = calculateDiscount(remaining);
                            const dynamicPrice = calculateDynamicPrice(food.pricePerUnit, discount);
                            const match = state.matches.find((m) => m.listingId === food.id);
                            const selectedQty = requestedQuantities[food.id] || Math.min(food.quantity, 15);

                            const distanceKm = 3.2;
                            const fairFee = calculateFairDeliveryFee(distanceKm);

                            return (
                              <div key={food.id} className="map-food-item" style={isExpired ? { borderLeft: '3px solid var(--fl-danger)' } : {}}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong>{food.foodName}</strong>
                                  <span className="map-expiry-tag" style={isExpired ? { background: 'var(--fl-danger)', color: '#fff' } : {}}>
                                    {isExpired ? '⛔ EXPIRED' : `⏳ ${formatTimeRemaining(remaining)}`}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--fl-text-muted)', marginTop: '2px' }}>
                                  Total Available: <strong>{food.quantity} {food.unit}</strong>
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: isExpired ? 'var(--fl-danger)' : 'var(--fl-green-dark)', marginTop: '2px' }}>
                                  {isExpired ? 'Status: Unsafe for Donation' : `Price: ${formatLKR(dynamicPrice)} / unit`}
                                </div>

                                {/* NGO Partial Quantity Selection */}
                                {user?.role === 'receiver' && (
                                  <div style={{ marginTop: '6px', background: isExpired ? 'rgba(239, 68, 68, 0.08)' : 'var(--fl-bg-raised)', padding: '6px', borderRadius: '4px', border: `1px solid ${isExpired ? 'var(--fl-danger)' : 'var(--fl-border)'}` }}>
                                    {isExpired ? (
                                      <div style={{ fontSize: '10px', color: 'var(--fl-danger)', fontWeight: 600 }}>
                                        ⚠️ Safety window expired. Cannot be requested for donation.
                                      </div>
                                    ) : (
                                      <>
                                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fl-text-heading)', display: 'block', marginBottom: '4px' }}>
                                          Select Quantity Needed by Shelter:
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <input
                                            type="number"
                                            min="1"
                                            max={food.quantity}
                                            value={selectedQty}
                                            onChange={(e) =>
                                              setRequestedQuantities({
                                                ...requestedQuantities,
                                                [food.id]: Math.min(food.quantity, Math.max(1, Number(e.target.value))),
                                              })
                                            }
                                            style={{ width: '60px', padding: '3px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--fl-border)' }}
                                          />
                                          <span style={{ fontSize: '11px', color: 'var(--fl-text-muted)' }}>
                                            of {food.quantity} {food.unit}
                                          </span>
                                        </div>
                                      </>
                                    )}

                                    <button
                                      className={`fl-btn ${isExpired ? 'fl-btn-ghost' : 'fl-btn-secondary'} fl-btn-sm`}
                                      style={{
                                        width: '100%',
                                        marginTop: '6px',
                                        fontSize: '11px',
                                        ...(isExpired ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--fl-border)', color: 'var(--fl-text-muted)' } : {})
                                      }}
                                      disabled={isExpired}
                                      onClick={() => !isExpired && handleAcceptDonation(match?.id, user.id, food.quantity, food.id)}
                                    >
                                      {isExpired ? '⛔ Expired - Cannot Request' : `✓ Request ${selectedQty} ${food.unit} for Shelter`}
                                    </button>
                                    {!isExpired && food.quantity > selectedQty && (
                                      <p style={{ fontSize: '10px', color: 'var(--fl-green)', margin: '4px 0 0' }}>
                                        {food.quantity - selectedQty} portions will remain active for other shelters.
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Rider Claim Button */}
                                {user?.role === 'volunteer' && (
                                  <button
                                    className={`fl-btn ${isExpired ? 'fl-btn-ghost' : 'fl-btn-primary'} fl-btn-sm`}
                                    style={{
                                      width: '100%',
                                      marginTop: '6px',
                                      fontSize: '11px',
                                      ...(isExpired ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--fl-border)', color: 'var(--fl-text-muted)' } : {})
                                    }}
                                    disabled={isExpired}
                                    onClick={() => !isExpired && handleClaimMission(match?.id, food.id, match?.acceptedBy || 'rec1', distanceKm, fairFee)}
                                  >
                                    {isExpired ? '⛔ Expired (Food Unsafe)' : `🛵 Claim Delivery (Earn ${formatLKR(fairFee)} or Free)`}
                                  </button>
                                )}

                                {/* Flash Sale Purchase / Profit Sale for Discounted Food */}
                                {!isExpired && food.status === 'selling' && (
                                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--fl-border)' }}>
                                    <button
                                      type="button"
                                      className="fl-btn fl-btn-secondary fl-btn-sm"
                                      style={{ width: '100%', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                      onClick={() => {
                                        dispatch({
                                          type: ACTION_TYPES.SELL_PORTIONS,
                                          payload: {
                                            listingId: food.id,
                                            quantitySold: 1,
                                            salePricePerUnit: dynamicPrice,
                                            discountPercent: discount,
                                          },
                                        });
                                        alert(`🎉 Sold 1 portion of ${food.foodName} at discount for ${formatLKR(dynamicPrice)}! Cash profit credited to ${rest.name}.`);
                                      }}
                                    >
                                      <span>💰 Buy Flash Sale Meal</span>
                                      <strong style={{ color: 'var(--fl-green-dark)' }}>{formatLKR(dynamicPrice)}</strong>
                                    </button>
                                  </div>
                                )}

                                {user?.role === 'restaurant' && user?.id === rest.id && (
                                  <Link
                                    to={`/restaurant/listing/${food.id}`}
                                    className="fl-btn fl-btn-ghost fl-btn-sm"
                                    style={{ width: '100%', marginTop: '6px', fontSize: '11px', textAlign: 'center' }}
                                  >
                                    View Income Ladder →
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ fontSize: '11px', color: 'var(--fl-text-muted)', marginTop: '6px' }}>
                          No remaining surplus food listed at this moment.
                        </p>
                      )}
                    </div>
                  </Popup>
                  <Tooltip>{rest.name} {activeFood.length > 0 ? `(${activeFood.length} active batches)` : ''}</Tooltip>
                </Marker>
              );
            })}

          {/* ===== RECEIVERS / CHARITY HOMES ===== */}
          {(filter === 'all' || filter === 'receiver') &&
            receivers.map((rec) => (
              <Marker
                key={rec.id}
                position={[rec.lat || 6.93, rec.lng || 79.87]}
                icon={createCustomIcon('🏠', 'marker-receiver')}
              >
                <Popup>
                  <div className="map-popup-card">
                    <span className="fl-badge fl-badge-safe">RECIPIENT CHARITY / NGO</span>
                    <h4 style={{ margin: '4px 0 2px', fontSize: '14px', color: 'var(--fl-text-heading)' }}>
                      {rec.name}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--fl-text-muted)' }}>📍 {rec.area}</p>
                    <div style={{ marginTop: '6px', padding: '6px', background: 'var(--fl-bg-sunken)', borderRadius: '6px', fontSize: '11px' }}>
                      <div>Accepts: <strong>{rec.acceptedCategories?.join(', ')}</strong></div>
                      <div>Capacity: <strong>{rec.capacity} portions</strong></div>
                      <div>Urgency Need: <strong style={{ color: 'var(--fl-gold-dark)' }}>{rec.currentNeed}%</strong></div>
                    </div>
                  </div>
                </Popup>
                <Tooltip>{rec.name} (Destination NGO)</Tooltip>
              </Marker>
            ))}

          {/* ===== VOLUNTEER COURIERS ===== */}
          {(filter === 'all' || filter === 'volunteer') &&
            volunteers.map((vol) => (
              <Marker
                key={vol.id}
                position={[vol.lat || 6.915, vol.lng || 79.865]}
                icon={createCustomIcon('🛵', 'marker-volunteer')}
              >
                <Popup>
                  <div className="map-popup-card">
                    <span className="fl-badge fl-badge-neutral">COURIER DISPATCH</span>
                    <h4 style={{ margin: '4px 0 2px', fontSize: '14px', color: 'var(--fl-text-heading)' }}>
                      {vol.name}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--fl-text-muted)' }}>📍 Active in {vol.area}</p>
                    <div style={{ marginTop: '6px', fontSize: '11px' }}>
                      <p>💰 <strong>{formatLKR(vol.totalEarnings || 3850)}</strong> Courier Earnings Logged</p>
                      <p>⭐ <strong>{vol.reliabilityRating} / 5.0</strong> Reliability Tier</p>
                    </div>
                  </div>
                </Popup>
                <Tooltip>{vol.name} (Courier)</Tooltip>
              </Marker>
            ))}
        </MapContainer>

        {/* Real-Time Live Order Tracking to NGO Overlay Bar */}
        {activeDeliveries.length > 0 && (
          <div className="map-live-tracking-panel">
            {activeDeliveries.map((del) => {
              const listing = listings.find((l) => l.id === del.listingId);
              const rest = restaurants.find((r) => r.id === listing?.restaurantId);
              const recv = receivers.find((r) => r.id === del.receiverId);

              return (
                <div key={del.id} className="live-tracking-item">
                  <div className="tracking-status-col">
                    <span className="live-status-pill">
                      <span className="live-dot" /> LIVE RESCUE EN ROUTE
                    </span>
                    <h5 style={{ margin: '4px 0 2px', fontSize: '13px' }}>
                      {listing?.foodName} ({del.requestedQuantity || listing?.quantity} portions)
                    </h5>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--fl-text-muted)' }}>
                      {rest?.name} ➔ <strong style={{ color: 'var(--fl-green-dark)' }}>{recv?.name}</strong>
                    </p>
                  </div>
                  <div className="tracking-meta-col">
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fl-teal)' }}>
                      {del.pickedUpAt ? '✓ Food Picked Up (Hot >60°C)' : '⏳ Courier Heading to Pickup'}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--fl-text-muted)' }}>
                      Payout: {del.payoutMode === 'paid' ? `💰 Paid (${formatLKR(del.earnedFee || 450)})` : '💚 Pro-Bono Volunteer'}
                    </span>
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
