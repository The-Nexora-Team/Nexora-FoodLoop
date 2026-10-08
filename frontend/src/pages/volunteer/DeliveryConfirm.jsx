/* DeliveryConfirm — volunteer verification, temperature check, and payout confirmation */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFoodLoop, ACTION_TYPES } from '../../context/FoodLoopContext.jsx';
import { formatLKR } from '../../utils/format.js';

export default function DeliveryConfirm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useFoodLoop();

  const handover = state.handovers.find((h) => h.id === id);
  const listing = state.listings.find((l) => l.id === handover?.listingId);
  const restaurant = state.restaurants.find((r) => r.id === listing?.restaurantId);
  const receiver = state.receivers.find((r) => r.id === handover?.receiverId);

  const [tempCheck, setTempCheck] = useState('Hot (>60°C)');
  const [pickedUp, setPickedUp] = useState(Boolean(handover?.pickedUpAt));

  if (!handover) {
    return (
      <div className="fl-container page-animate" style={{ padding: '2rem' }}>
        <p>Handover mission not found.</p>
        <Link to="/volunteer" className="fl-btn fl-btn-ghost fl-btn-sm" style={{ marginTop: '1rem' }}>Back to Dashboard</Link>
      </div>
    );
  }

  function handleConfirmPickup() {
    dispatch({
      type: ACTION_TYPES.CONFIRM_PICKUP,
      payload: {
        handoverId: handover.id,
        timestamp: state.simNow,
        temperatureCheck: tempCheck,
      },
    });
    setPickedUp(true);
  }

  function handleConfirmDelivery() {
    dispatch({
      type: ACTION_TYPES.CONFIRM_DELIVERY,
      payload: {
        handoverId: handover.id,
        timestamp: state.simNow,
      },
    });
    navigate('/volunteer');
  }

  const isPaid = handover.payoutMode === 'paid';

  const foodThumb =
    listing?.category === 'bakery' || listing?.foodName?.toLowerCase().includes('pastr') || listing?.foodName?.toLowerCase().includes('bread')
      ? '/images/bakery.jpg'
      : listing?.foodName?.toLowerCase().includes('biryani') || listing?.foodName?.toLowerCase().includes('rice') || listing?.category === 'cooked'
      ? '/images/biryani.jpg'
      : '/images/hero-buffet.jpg';

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem', maxWidth: '680px' }}>
      <div className="fl-card" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--fl-border)', paddingBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: 'var(--fl-radius-md)', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--fl-shadow-sm)' }}>
              <img
                src={foodThumb}
                alt={listing?.foodName || 'Meal'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <span className="fl-badge fl-badge-safe">Step-by-Step Courier Handover</span>
              <h2 style={{ margin: '0.4rem 0 2px', fontSize: '1.4rem' }}>{listing?.foodName}</h2>
              <p style={{ color: 'var(--fl-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                From: <strong>{restaurant?.name}</strong> → To: <strong>{receiver?.name}</strong>
              </p>
            </div>
          </div>

          <Link to="/map" className="fl-btn fl-btn-ghost fl-btn-sm">
            🗺️ Track Route on Map
          </Link>
        </div>

        {/* Rider Payout Badge */}
        <div style={{
          background: isPaid ? 'rgba(31, 138, 91, 0.08)' : 'rgba(15, 61, 62, 0.08)',
          border: `1px solid ${isPaid ? 'var(--fl-green)' : 'var(--fl-teal)'}`,
          borderRadius: 'var(--fl-radius-md)',
          padding: '12px 16px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fl-text-muted)', textTransform: 'uppercase' }}>
              Courier Compensation:
            </span>
            <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '14px', color: 'var(--fl-text-heading)' }}>
              {isPaid ? `💰 Paid Courier Payout (${formatLKR(handover.earnedFee || 450)})` : '💚 Pro-Bono Community Volunteer Delivery'}
            </p>
          </div>
          <span className={`fl-badge ${isPaid ? 'fl-badge-safe' : 'fl-badge-neutral'}`}>
            {isPaid ? 'Credited on Delivery' : 'Service Karma Logged'}
          </span>
        </div>

        {/* Step 1: Pickup */}
        <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'var(--fl-bg-sunken)', borderRadius: 'var(--fl-radius-md)' }}>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{pickedUp ? '✅' : '1️⃣'}</span> Step 1: Restaurant Pickup & Temperature Check
          </h4>
          {!pickedUp ? (
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Food Temperature Condition at Handover:
              </label>
              <select
                className="fl-input"
                value={tempCheck}
                onChange={(e) => setTempCheck(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--fl-radius-sm)', border: '1px solid var(--fl-border)', marginBottom: '1rem' }}
              >
                <option value="Hot (>60°C)">Hot & Steaming (&gt;60°C) — Thermal Bag</option>
                <option value="Chilled (<5°C)">Chilled (&lt;5°C) — Cold Storage Box</option>
                <option value="Ambient Safe">Ambient Bakery/Dry Goods</option>
              </select>
              <button className="fl-btn fl-btn-secondary fl-btn-sm" onClick={handleConfirmPickup}>
                Confirm Restaurant Pickup & Start Route
              </button>
            </div>
          ) : (
            <p style={{ color: 'var(--fl-green)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              ✓ Picked up from restaurant ({handover.temperatureCheck || 'Verified Hot'}). En route to destination receiver.
            </p>
          )}
        </div>

        {/* Step 2: Delivery */}
        <div style={{ padding: '1.25rem', background: 'var(--fl-bg-sunken)', borderRadius: 'var(--fl-radius-md)', opacity: pickedUp ? 1 : 0.6 }}>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{handover.confirmed ? '✅' : '2️⃣'}</span> Step 2: Receiver Delivery Confirmation
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', margin: '0.5rem 0 1rem' }}>
            Deliver food package directly to staff at {receiver?.name}.
          </p>
          <button
            className="fl-btn fl-btn-primary fl-btn-lg"
            style={{ width: '100%' }}
            disabled={!pickedUp || handover.confirmed}
            onClick={handleConfirmDelivery}
          >
            {handover.confirmed ? 'Delivery Completed 🎉' : isPaid ? `Confirm Safe Handover & Claim ${formatLKR(handover.earnedFee || 450)}` : 'Confirm Safe Handover & Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
