/* ListingDetail — full income ladder progression, smart match panel, and volunteer tracking */

import { useParams, Link } from 'react-router-dom';
import { useFoodLoop, ACTION_TYPES } from '../../context/FoodLoopContext.jsx';
import ExpiryClock from '../../components/ExpiryClock.jsx';
import LadderTimeline from '../../components/LadderTimeline.jsx';
import MatchPanel from '../../components/MatchPanel.jsx';
import { formatLKR, formatPercent, formatDateTime } from '../../utils/format.js';
import { calculateDiscount, calculateDynamicPrice } from '../../utils/wasteStrategy.js';

export default function ListingDetail() {
  const { id } = useParams();
  const { state, dispatch } = useFoodLoop();

  const listing = state.listings.find((l) => l.id === id);
  const match = state.matches.find((m) => m.listingId === id);
  const handover = state.handovers.find((h) => h.listingId === id);

  if (!listing) {
    return (
      <div className="fl-container page-animate" style={{ padding: '2rem' }}>
        <p>Listing not found.</p>
        <Link to="/restaurant" className="fl-btn fl-btn-ghost fl-btn-sm" style={{ marginTop: '1rem' }}>
          Back to Restaurant Dashboard
        </Link>
      </div>
    );
  }

  const simNow = state.simNow;
  const discount = calculateDiscount(listing.unsafeByTime - simNow);
  const dynamicPrice = calculateDynamicPrice(listing.pricePerUnit, discount);

  function handleMarkSold() {
    dispatch({
      type: ACTION_TYPES.UPDATE_LISTING_STATUS,
      payload: { id: listing.id, status: 'sold', currentStep: 'sell' },
    });
  }

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem', maxWidth: '850px' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/restaurant" style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>{listing.foodName}</h1>
          <p style={{ color: 'var(--fl-text-muted)', fontSize: '0.875rem' }}>
            Posted: {formatDateTime(listing.postedAt)} • {listing.quantity} {listing.unit}
          </p>
        </div>

        <ExpiryClock unsafeByTime={listing.unsafeByTime} postedAt={listing.postedAt} />
      </div>

      {/* Ladder Timeline Visualizer */}
      <div className="fl-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--fl-teal)' }}>Food Recovery Income Ladder</h3>
        <LadderTimeline listing={listing} />
      </div>

      {/* Current Step Action Box */}
      <div className="fl-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="fl-badge fl-badge-safe" style={{ textTransform: 'uppercase' }}>
            Current Status: {listing.status}
          </span>
          {listing.status === 'selling' && (
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--fl-green-dark)' }}>
                Active Offer: {formatLKR(dynamicPrice)} / unit
                <span style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', textDecoration: 'line-through', marginLeft: '8px' }}>
                  {formatLKR(listing.pricePerUnit)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--fl-gold-dark)', marginLeft: '6px', fontWeight: 800 }}>
                  (-{formatPercent(discount)})
                </span>
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {listing.status === 'selling' && (
            <button className="fl-btn fl-btn-secondary" onClick={handleMarkSold}>
              ✓ Customer Purchased (Mark Sold)
            </button>
          )}

          {listing.status === 'donated' && (
            <Link to={`/restaurant/receipt/${listing.id}`} className="fl-btn fl-btn-primary">
              📄 View Tax Deduction Receipt
            </Link>
          )}
        </div>
      </div>

      {/* Handover & Volunteer Tracking */}
      {handover && (
        <div className="fl-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--fl-secondary)' }}>
          <h4 style={{ margin: '0 0 6px' }}>🛵 Volunteer Courier Dispatch</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)' }}>
            Volunteer Courier ID: <strong>{handover.volunteerId}</strong> •
            Status: <strong>{handover.confirmed ? 'Safely Delivered' : handover.pickedUpAt ? 'In Transit to Receiver' : 'Pickup Claimed'}</strong>
          </p>
        </div>
      )}

      {/* Smart Match Panel */}
      <MatchPanel match={match} listing={listing} />
    </div>
  );
}
