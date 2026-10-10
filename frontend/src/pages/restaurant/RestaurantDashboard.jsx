/* Restaurant Dashboard — full metrics, savings tracking, active surplus cards, and recovery ladder links */

import { Link } from 'react-router-dom';
import { useFoodLoop } from '../../context/FoodLoopContext.jsx';
import { formatLKRShort } from '../../utils/format.js';
import StatCard from '../../components/StatCard.jsx';
import ListingCard from '../../components/ListingCard.jsx';

export default function RestaurantDashboard() {
  const { state } = useFoodLoop();
  const user = state.currentUser;
  const restaurant = state.restaurants.find((r) => r.id === user?.id) || state.restaurants[0];

  const myListings = state.listings.filter((l) => l.restaurantId === restaurant.id);
  const activeListings = myListings.filter((l) =>
    ['selling', 'donating', 'recycling'].includes(l.status)
  );
  const soldListings = myListings.filter((l) => l.status === 'sold');
  const donatedListings = myListings.filter((l) => l.status === 'donated');

  const cashRecoveredSales = soldListings.reduce((sum, l) => {
    if (l.saleAmount !== undefined) return sum + l.saleAmount;
    const discount = l.discountPercent || 0.4;
    return sum + (l.pricePerUnit * (1 - discount)) * l.quantity;
  }, 0);

  const netProfitSales = soldListings.reduce((sum, l) => {
    if (l.netProfit !== undefined) return sum + l.netProfit;
    const discount = l.discountPercent || 0.4;
    const salePrice = l.pricePerUnit * (1 - discount);
    return sum + (salePrice - l.costPerUnit) * l.quantity;
  }, 0);

  const taxWriteOffValue = donatedListings.reduce((sum, l) => {
    return sum + (l.costPerUnit * l.quantity);
  }, 0);

  const totalRecovered = cashRecoveredSales + taxWriteOffValue;
  const totalQuantity = myListings.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-gold-dark)', letterSpacing: '0.05em' }}>RESTAURANT PORTAL</p>
          <h1 style={{ fontSize: '2rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>
            {restaurant?.name || 'Restaurant Dashboard'}
          </h1>
          <p style={{ color: 'var(--fl-text-muted)' }}>
            Sell remaining food at discount for profit, post end-of-day batches, and monitor live rescues across Colombo.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link to="/restaurant/post" className="fl-btn fl-btn-primary fl-btn-lg">
            🌙 List Remaining Food (Sell / Donate)
          </Link>
          <Link to="/map" className="fl-btn fl-btn-secondary fl-btn-lg">
            🗺️ View on Live Map
          </Link>
          <Link to="/restaurant/report" className="fl-btn fl-btn-ghost fl-btn-lg">
            📊 Savings Audit
          </Link>
        </div>
      </div>

      {/* Primary Savings & Financial Recovery KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <StatCard
          label="Total Value Recovered"
          value={formatLKRShort(totalRecovered)}
          sub="Direct sales cash + Tax deductions"
          icon="💰"
          variant="gold"
        />
        <StatCard
          label="Cash from Flash Sales"
          value={formatLKRShort(cashRecoveredSales)}
          sub={`${soldListings.length} batches sold at discount`}
          icon="💵"
          variant="success"
        />
        <StatCard
          label="Net Profit Earned"
          value={netProfitSales >= 0 ? `+${formatLKRShort(netProfitSales)}` : formatLKRShort(netProfitSales)}
          sub="Profit above food prep cost"
          icon="📈"
          variant="success"
        />
        <StatCard
          label="Tax Write-Off Basis"
          value={formatLKRShort(taxWriteOffValue)}
          sub={`${donatedListings.length} charity donation receipts`}
          icon="📜"
          variant="success"
        />
        <StatCard
          label="Active Surplus Batches"
          value={activeListings.length}
          sub="Live on map & income ladder"
          icon="⚡"
          variant={activeListings.length > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* End-of-Day Remaining Food Action Banner */}
      <div className="fl-card" style={{
        background: 'linear-gradient(135deg, var(--fl-teal-dark) 0%, var(--fl-teal) 100%)',
        color: '#fff',
        padding: '0',
        marginBottom: '2.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        alignItems: 'stretch',
        overflow: 'hidden',
        borderRadius: 'var(--fl-radius-xl)',
        boxShadow: 'var(--fl-shadow-md)'
      }}>
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
              END-OF-SERVICE CLOSING CHECKLIST
            </span>
            <h3 style={{ color: '#fff', margin: '10px 0 6px', fontSize: '1.35rem' }}>
              Have remaining buffet trays or kitchen prep leftovers?
            </h3>
            <p style={{ color: '#d8e8e3', fontSize: '13px', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
              List remaining food now before expiration. It broadcasts instantly to the Colombo Map View, allowing buyers to purchase flash sale meals or verified shelters to claim the food hot.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link to="/restaurant/post" className="fl-btn fl-btn-accent fl-btn-lg">
                + Add Remaining Food Batch →
              </Link>
              <Link to="/map" className="fl-btn fl-btn-ghost fl-btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
                🗺️ Live Map
              </Link>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', minHeight: '180px' }}>
          <img
            src="/images/hero-buffet.jpg"
            alt="Commercial kitchen buffet catering service"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: 700
          }}>
            🍽️ Hot Holding Line
          </div>
        </div>
      </div>

      {/* Active Listings Grid */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--fl-text-heading)', margin: 0 }}>Active Surplus Batches</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)' }}>
              Items dynamically stepping down the ladder: Sell → Donate → Recycle. Visible live on Map.
            </p>
          </div>
          <Link to="/map" className="fl-btn fl-btn-sm fl-btn-ghost">
            🗺️ Inspect on Map
          </Link>
        </div>

        {activeListings.length === 0 ? (
          <div className="fl-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🍽️</span>
            <h3>No Active Surplus Batches</h3>
            <p style={{ color: 'var(--fl-text-muted)', margin: '0.5rem 0 1.5rem' }}>
              Kitchen running lean! When surplus is generated at closing, list the remaining food to start automated recovery.
            </p>
            <Link to="/restaurant/post" className="fl-btn fl-btn-primary">
              List Remaining Food
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {activeListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} isRestaurantView />
            ))}
          </div>
        )}
      </div>

      {/* History / Resolved Section */}
      {myListings.filter((l) => ['sold', 'donated', 'recycled'].includes(l.status)).length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--fl-text-heading)', marginBottom: '1rem' }}>
            Recently Resolved Batches & Tax Receipts
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {myListings
              .filter((l) => ['sold', 'donated', 'recycled'].includes(l.status))
              .map((listing) => (
                <ListingCard key={listing.id} listing={listing} isRestaurantView />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
