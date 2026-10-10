import { useState } from 'react';
import { Link } from 'react-router-dom';
import ExpiryClock from './ExpiryClock.jsx';
import { formatLKR, formatPercent } from '../utils/format.js';
import { calculateDiscount, calculateDynamicPrice } from '../utils/wasteStrategy.js';
import { useFoodLoop, ACTION_TYPES } from '../context/FoodLoopContext.jsx';
import './ListingCard.css';

export default function ListingCard({ listing, showActions = true, isRestaurantView = true }) {
  const { state, dispatch } = useFoodLoop();
  const simNow = state.simNow;

  const [sellQty, setSellQty] = useState(1);
  const [showSellPanel, setShowSellPanel] = useState(false);

  const discount = calculateDiscount(listing.unsafeByTime - simNow);
  const dynamicPrice = calculateDynamicPrice(listing.pricePerUnit, discount);
  const netUnitProfit = dynamicPrice - (listing.costPerUnit || 0);

  function handleSellPortions(qty) {
    const quantityToSell = qty || sellQty;
    dispatch({
      type: ACTION_TYPES.SELL_PORTIONS,
      payload: {
        listingId: listing.id,
        quantitySold: quantityToSell,
        salePricePerUnit: dynamicPrice,
        discountPercent: discount,
      },
    });
    setShowSellPanel(false);
  }

  const isSelling = listing.status === 'selling';
  const isDonating = listing.status === 'donating';
  const isRecycling = listing.status === 'recycling';
  const isSold = listing.status === 'sold';

  const foodThumb =
    listing.category === 'bakery' || listing.foodName?.toLowerCase().includes('pastr') || listing.foodName?.toLowerCase().includes('bread')
      ? '/images/bakery.jpg'
      : listing.foodName?.toLowerCase().includes('biryani') || listing.foodName?.toLowerCase().includes('rice') || listing.category === 'cooked'
      ? '/images/biryani.jpg'
      : '/images/hero-buffet.jpg';

  return (
    <div className={`fl-card listing-card status-${listing.status}`} style={{ overflow: 'hidden', padding: '1rem' }}>
      {/* Food Photography Preview */}
      <div style={{ position: 'relative', height: '125px', borderRadius: 'var(--fl-radius-md) var(--fl-radius-md) 0 0', overflow: 'hidden', margin: '-1rem -1rem 0.85rem -1rem' }}>
        <img
          src={foodThumb}
          alt={listing.foodName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
          <span className={`fl-badge ${
            listing.status === 'sold' || listing.status === 'donated' ? 'fl-badge-safe' :
            listing.status === 'selling' ? 'fl-badge-warning' :
            listing.status === 'recycling' ? 'fl-badge-neutral' : 'fl-badge-critical'
          }`}>
            {listing.status.toUpperCase()}
          </span>
          <span className="listing-category-pill" style={{ background: 'rgba(15,23,42,0.85)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            {listing.category}
          </span>
        </div>
        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
          <ExpiryClock unsafeByTime={listing.unsafeByTime} postedAt={listing.postedAt} compact />
        </div>
      </div>

      <div className="listing-card-body">
        <h3 className="listing-title">{listing.foodName}</h3>
        <p className="listing-quantity">
          <strong>{listing.quantity}</strong> {listing.unit}
        </p>

        {isSelling && (
          <div>
            <div className="listing-pricing">
              <span className="listing-current-price">{formatLKR(dynamicPrice)}</span>
              <span className="listing-original-price">{formatLKR(listing.pricePerUnit)}</span>
              <span className="listing-discount-tag">-{formatPercent(discount)}</span>
            </div>
            <div style={{ fontSize: '11px', color: netUnitProfit >= 0 ? 'var(--fl-green-dark)' : 'var(--fl-gold-dark)', fontWeight: 700, marginTop: '4px' }}>
              {netUnitProfit >= 0 ? `📈 Profit: +${formatLKR(netUnitProfit)} / unit above prep cost` : `🛡️ Mitigates waste loss (${formatLKR(listing.costPerUnit)} cost)`}
            </div>
          </div>
        )}

        {isSold && (
          <div style={{ padding: '8px', background: 'rgba(31, 138, 91, 0.08)', borderRadius: '6px', border: '1px solid var(--fl-green)', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--fl-green-dark)', display: 'block' }}>
              💰 Cash Recovered: {formatLKR(listing.saleAmount || Math.round(listing.pricePerUnit * 0.6 * listing.quantity))}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--fl-text-muted)' }}>
              Net Profit: <strong style={{ color: 'var(--fl-green)' }}>+{formatLKR(listing.netProfit || Math.round(listing.quantity * (listing.pricePerUnit * 0.6 - listing.costPerUnit)))}</strong>
            </span>
          </div>
        )}

        {isDonating && (
          <div className="listing-donation-note">
            🤝 Matched for community donation rescue
          </div>
        )}

        {isRecycling && (
          <div className="listing-recycle-note">
            🌱 Diverted to animal feed & compost partners
          </div>
        )}
      </div>

      {showActions && (
        <div className="listing-card-actions" style={{ flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
          {/* Quick Sell at Discount Panel */}
          {isRestaurantView && isSelling && (
            <div style={{ background: 'var(--fl-bg-sunken)', padding: '10px', borderRadius: '6px', border: '1px solid var(--fl-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fl-text-heading)' }}>
                  Sell for Profit at Discount:
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--fl-green-dark)' }}>
                  +{formatLKR(netUnitProfit * Math.min(listing.quantity, sellQty))} Profit
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max={listing.quantity}
                  value={sellQty}
                  onChange={(e) => setSellQty(Math.min(listing.quantity, Math.max(1, Number(e.target.value))))}
                  style={{ width: '60px', padding: '4px 6px', fontSize: '12px', fontWeight: 700, borderRadius: '4px', border: '1px solid var(--fl-border)' }}
                />
                <button
                  type="button"
                  className="fl-btn fl-btn-secondary fl-btn-sm"
                  style={{ flex: 1, fontSize: '11px' }}
                  onClick={() => handleSellPortions(sellQty)}
                >
                  💰 Sell {sellQty} (Earn {formatLKR(dynamicPrice * sellQty)})
                </button>
                {listing.quantity > 1 && (
                  <button
                    type="button"
                    className="fl-btn fl-btn-ghost fl-btn-sm"
                    style={{ fontSize: '10px', padding: '4px 6px' }}
                    onClick={() => handleSellPortions(listing.quantity)}
                    title="Sell entire remaining batch at discount"
                  >
                    All ({listing.quantity})
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            <Link to={`/restaurant/listing/${listing.id}`} className="fl-btn fl-btn-ghost fl-btn-sm">
              View Ladder →
            </Link>

            {listing.status === 'donated' && (
              <Link to={`/restaurant/receipt/${listing.id}`} className="fl-btn fl-btn-ghost fl-btn-sm">
                📄 Receipt
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
