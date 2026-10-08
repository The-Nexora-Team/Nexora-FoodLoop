/* AcceptedHistory — receiver log of all accepted meals */

import { Link } from 'react-router-dom';
import { useFoodLoop } from '../../context/FoodLoopContext.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function AcceptedHistory() {
  const { state } = useFoodLoop();
  const receiverId = state.currentUser?.id;

  const acceptedMatches = state.matches.filter((m) => m.acceptedBy === receiverId);

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-secondary)', letterSpacing: '0.05em' }}>RECEIVER PORTAL</p>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>Donation Acceptance History</h1>
        <p style={{ color: 'var(--fl-text-muted)' }}>Complete audit log of all recovered food received by your organization.</p>
      </div>

      {acceptedMatches.length === 0 ? (
        <div className="fl-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ color: 'var(--fl-text-muted)' }}>No accepted donations in history yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {acceptedMatches.map((m) => {
            const listing = state.listings.find((l) => l.id === m.listingId);
            const handover = state.handovers.find((h) => h.matchId === m.id);
            return (
              <div key={m.id} className="fl-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '4px 0' }}>{listing?.foodName || 'Donation Item'}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)' }}>
                    Quantity: {listing?.quantity} {listing?.unit} • Status: {handover?.confirmed ? 'Delivered & Confirmed' : 'Pending Volunteer Delivery'}
                  </p>
                </div>
                <span className={`fl-badge ${handover?.confirmed ? 'fl-badge-safe' : 'fl-badge-warning'}`}>
                  {handover?.confirmed ? 'Received' : 'In Transit'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
