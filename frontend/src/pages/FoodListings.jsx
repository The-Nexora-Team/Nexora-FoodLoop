/* FoodListings — full live marketplace view of all surplus batches */

import { Link } from 'react-router-dom';
import { useFoodLoop } from '../context/FoodLoopContext.jsx';
import ListingCard from '../components/ListingCard.jsx';

export default function FoodListings() {
  const { state } = useFoodLoop();
  const listings = state.listings || [];

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-gold-dark)', letterSpacing: '0.05em' }}>SURPLUS MARKETPLACE</p>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>All Surplus Food Listings</h1>
          <p style={{ color: 'var(--fl-text-muted)' }}>
            Real-time surplus batches stepping down the income ladder across Colombo.
          </p>
        </div>

        <Link to="/restaurant/post" className="fl-btn fl-btn-primary">
          + Post New Surplus
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="fl-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <p style={{ fontSize: '1.125rem', color: 'var(--fl-text-muted)', marginBottom: '1rem' }}>No listings in the network.</p>
          <Link to="/restaurant/post" className="fl-btn fl-btn-secondary">
            Post Surplus Food
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {listings.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}
    </div>
  );
}