/* DonationReceipt — print-friendly tax receipt */

import { useParams, Link } from 'react-router-dom';
import { useFoodLoop } from '../../context/FoodLoopContext.jsx';
import { formatLKR, formatDateTime } from '../../utils/format.js';

export default function DonationReceipt() {
  const { id } = useParams();
  const { state } = useFoodLoop();
  const listing = state.listings.find((l) => l.id === id);

  if (!listing) {
    return (
      <div className="fl-container page-animate" style={{ padding: '2rem' }}>
        <p>Receipt not found.</p>
        <Link to="/restaurant" className="fl-btn fl-btn-ghost fl-btn-sm" style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const estimatedValue = listing.costPerUnit * listing.quantity;

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem', maxWidth: '700px' }}>
      <div className="fl-card" style={{ padding: '2.5rem', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--fl-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--fl-teal)', margin: 0 }}>FOOD RECOVERY RECEIPT</h1>
            <p style={{ color: 'var(--fl-text-muted)', fontSize: '0.875rem' }}>Official Donation Verification & Tax Deductible Log</p>
          </div>
          <span className="fl-badge fl-badge-safe">Verified</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--fl-text-muted)', textTransform: 'uppercase' }}>Item Donated</strong>
            <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>{listing.foodName}</p>
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--fl-text-muted)', textTransform: 'uppercase' }}>Quantity</strong>
            <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>{listing.quantity} {listing.unit}</p>
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--fl-text-muted)', textTransform: 'uppercase' }}>Estimated Food Cost Value</strong>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--fl-green)' }}>{formatLKR(estimatedValue)}</p>
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--fl-text-muted)', textTransform: 'uppercase' }}>Date & Time</strong>
            <p style={{ fontSize: '1rem' }}>{formatDateTime(listing.postedAt)}</p>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed var(--fl-border)', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="fl-btn fl-btn-primary" onClick={() => window.print()}>
            🖨️ Print / Save PDF
          </button>
          <Link to="/restaurant" className="fl-btn fl-btn-ghost">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
