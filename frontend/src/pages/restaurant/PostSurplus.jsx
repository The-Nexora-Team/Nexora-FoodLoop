/* PostSurplus — restaurant surplus intake form with live savings tracker, end-of-day remaining food lister & smart match */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFoodLoop, ACTION_TYPES } from '../../context/FoodLoopContext.jsx';
import { FOOD_CATEGORIES, UNITS } from '../../utils/constants.js';
import { rankReceivers } from '../../utils/matching.js';
import { formatLKR, formatTimeRemaining } from '../../utils/format.js';
import SafetyChecklist from '../../components/SafetyChecklist.jsx';

const END_OF_DAY_TEMPLATES = [
  {
    name: '🌙 End-of-Dinner Buffet: Chicken Biryani (25 Portions)',
    foodName: 'Dum Biryani with Boiled Eggs & Gravy',
    category: 'cooked',
    quantity: 25,
    unit: 'portions',
    costPerUnit: 450,
    pricePerUnit: 1200,
    hoursValid: 3,
    description: 'Hot buffet trays pulled from service at closing. Kept in thermal insulated pan.',
  },
  {
    name: '🥐 End-of-Day Bakery Leftovers: Savouries & Buns (35 pcs)',
    foodName: 'Fish Rolls, Sausage Pastries & Egg Roti',
    category: 'bakery',
    quantity: 35,
    unit: 'pieces',
    costPerUnit: 85,
    pricePerUnit: 220,
    hoursValid: 4,
    description: 'Fresh evening bakery counter batch. Crisp and sealed in bakery boxes.',
  },
  {
    name: '🍛 End-of-Shift Rice & Curry: 4 Curries & Rice (20 Portions)',
    foodName: 'Basmati Rice, Dhal, Chicken Curry, Pol Sambol',
    category: 'cooked',
    quantity: 20,
    unit: 'portions',
    costPerUnit: 280,
    pricePerUnit: 750,
    hoursValid: 2.5,
    description: 'Packed hot in foil containers with allergen labels.',
  },
  {
    name: '🥗 Salad Bar & Fresh Veg Trimmings (15 kg)',
    foodName: 'Crisp Garden Salad, Sliced Cucumbers & Tomatoes',
    category: 'produce',
    quantity: 15,
    unit: 'kg',
    costPerUnit: 160,
    pricePerUnit: 420,
    hoursValid: 5,
    description: 'Chilled produce trimmings from prep kitchen.',
  },
];

export default function PostSurplus() {
  const { state, dispatch } = useFoodLoop();
  const navigate = useNavigate();
  const restaurant = state.restaurants.find((r) => r.id === state.currentUser?.id) || state.restaurants[0];

  const [foodName, setFoodName] = useState('Dinner Buffet Chicken Biryani');
  const [category, setCategory] = useState('cooked');
  const [quantity, setQuantity] = useState(25);
  const [unit, setUnit] = useState('portions');
  const [costPerUnit, setCostPerUnit] = useState(450);
  const [pricePerUnit, setPricePerUnit] = useState(1200);
  const [hoursUntilUnsafe, setHoursUntilUnsafe] = useState(3);
  const [notes, setNotes] = useState('Packed hot in insulated catering boxes. Ready for immediate pickup.');
  const [safetyChecklist, setSafetyChecklist] = useState({
    keptHotOrChilled: true,
    cleanPackaging: true,
    allergens: ['Eggs'],
  });

  const [strategy, setStrategy] = useState('sell_discount'); // 'sell_discount', 'ladder', 'donate_direct'
  const [discountPercent, setDiscountPercent] = useState(0.4); // 40% OFF by default

  // Calculate live financial recovery & profit metrics
  const totalCost = (Number(quantity) || 0) * (Number(costPerUnit) || 0);
  const totalOriginalRevenue = (Number(quantity) || 0) * (Number(pricePerUnit) || 0);
  const discountedPrice = Math.round((Number(pricePerUnit) || 0) * (1 - discountPercent));
  const estimatedFlashSaleRevenue = Math.round((Number(quantity) || 0) * discountedPrice);
  const netProfitEarned = Math.round((Number(quantity) || 0) * (discountedPrice - (Number(costPerUnit) || 0)));
  const profitMarginPerPortion = discountedPrice - (Number(costPerUnit) || 0);
  const estimatedTaxSavings = Math.round(totalCost * 0.3); // 30% corporate tax offset
  const estimatedKg = (Number(quantity) || 0) * 0.4;
  const estimatedCO2e = Number((estimatedKg * 2.5).toFixed(1));

  function applyTemplate(tpl) {
    setFoodName(tpl.foodName);
    setCategory(tpl.category);
    setQuantity(tpl.quantity);
    setUnit(tpl.unit);
    setCostPerUnit(tpl.costPerUnit);
    setPricePerUnit(tpl.pricePerUnit);
    setHoursUntilUnsafe(tpl.hoursValid);
    setNotes(tpl.description || '');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const listingId = 'list-' + Date.now();
    const postedAt = state.simNow;
    const unsafeByTime = postedAt + hoursUntilUnsafe * 3600 * 1000;

    const newListing = {
      id: listingId,
      restaurantId: restaurant.id,
      foodName,
      category,
      quantity: Number(quantity),
      unit,
      costPerUnit: Number(costPerUnit),
      pricePerUnit: Number(pricePerUnit),
      unsafeByTime,
      postedAt,
      status: strategy === 'donate_direct' ? 'donating' : 'selling',
      currentStep: strategy === 'donate_direct' ? 'donate' : 'sell',
      strategy,
      discountPercent,
      safetyChecklist,
      notes,
      matchId: null,
      volunteerId: null,
    };

    // Calculate smart match rankings
    const rankedReceivers = rankReceivers(
      newListing,
      restaurant,
      state.receivers,
      state.simNow
    );

    const matchId = 'match-' + Date.now();
    const newMatch = {
      id: matchId,
      listingId,
      rankedReceivers,
      currentOfferIndex: 0,
      offerSentAt: state.simNow,
      status: 'pending',
      acceptedBy: null,
      declinedReasons: [],
    };

    newListing.matchId = matchId;

    dispatch({ type: ACTION_TYPES.ADD_LISTING, payload: newListing });
    dispatch({ type: ACTION_TYPES.CREATE_MATCH, payload: newMatch });

    navigate(`/restaurant/listing/${listingId}`);
  }

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem', maxWidth: '840px' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-gold-dark)', letterSpacing: '0.05em' }}>
            {restaurant.name?.toUpperCase()} • KITCHEN INVENTORY DISPATCH
          </p>
          <h1 style={{ fontSize: '1.875rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>
            List End-of-Day Remaining Food
          </h1>
          <p style={{ color: 'var(--fl-text-muted)' }}>
            Post surplus before expiration: automatically clear via flash sale, donate to children's/elders' homes, or bio-recycle.
          </p>
        </div>

        <Link to="/map" className="fl-btn fl-btn-ghost fl-btn-sm">
          🗺️ View Live Network Map
        </Link>
      </div>

      {/* Real-Time Savings Tracker (Calculated Live) */}
      <div className="fl-card" style={{
        background: 'linear-gradient(135deg, rgba(15, 61, 62, 0.05) 0%, rgba(31, 138, 91, 0.1) 100%)',
        border: '1px solid var(--fl-green)',
        marginBottom: '1.5rem',
        padding: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: 0, color: 'var(--fl-teal)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>💰</span> Real-Time Savings & Recovery Tracker
          </h4>
          <span className="fl-badge fl-badge-safe">Calculated on input</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--fl-text-muted)', textTransform: 'uppercase' }}>Batch Cost Basis</span>
            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--fl-text-heading)', margin: '2px 0' }}>
              {formatLKR(totalCost)}
            </p>
            <span style={{ fontSize: '10px', color: 'var(--fl-text-muted)' }}>Kitchen prep expenditure</span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--fl-green-dark)', textTransform: 'uppercase', fontWeight: 700 }}>Gross Cash Recovered</span>
            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--fl-green-dark)', margin: '2px 0' }}>
              {formatLKR(estimatedFlashSaleRevenue)}
            </p>
            <span style={{ fontSize: '10px', color: 'var(--fl-text-muted)' }}>At {Math.round(discountPercent * 100)}% discount</span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: netProfitEarned >= 0 ? 'var(--fl-green-dark)' : 'var(--fl-gold-dark)', textTransform: 'uppercase', fontWeight: 700 }}>
              {netProfitEarned >= 0 ? 'Net Cash Profit' : 'Loss Mitigated'}
            </span>
            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: netProfitEarned >= 0 ? 'var(--fl-green-dark)' : 'var(--fl-gold-dark)', margin: '2px 0' }}>
              {netProfitEarned >= 0 ? `+${formatLKR(netProfitEarned)}` : formatLKR(netProfitEarned)}
            </p>
            <span style={{ fontSize: '10px', color: 'var(--fl-text-muted)' }}>
              {profitMarginPerPortion >= 0 ? `+${formatLKR(profitMarginPerPortion)}/unit margin` : 'Recovered vs waste'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--fl-gold-dark)', textTransform: 'uppercase', fontWeight: 700 }}>Tax Deductible Value</span>
            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--fl-gold-dark)', margin: '2px 0' }}>
              {formatLKR(totalCost)}
            </p>
            <span style={{ fontSize: '10px', color: 'var(--fl-text-muted)' }}>100% tax receipt if donated</span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--fl-teal)', textTransform: 'uppercase' }}>Emissions Prevented</span>
            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--fl-teal)', margin: '2px 0' }}>
              {estimatedCO2e} kg CO₂e
            </p>
            <span style={{ fontSize: '10px', color: 'var(--fl-text-muted)' }}>{estimatedKg} kg food saved</span>
          </div>
        </div>
      </div>

      {/* End-of-Day Quick Presets */}
      <div className="fl-card" style={{ marginBottom: '1.5rem', background: '#fff' }}>
        <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--fl-teal)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🌙</span> End-of-Day Kitchen Surplus Presets (1-Click Fill):
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
          {END_OF_DAY_TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              type="button"
              className="fl-btn fl-btn-ghost fl-btn-sm"
              style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '10px', fontSize: '12px' }}
              onClick={() => applyTemplate(tpl)}
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Intake Form */}
      <form onSubmit={handleSubmit} className="fl-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div>
            <label className="section-title">Food Item Name *</label>
            <input
              type="text"
              required
              className="fl-input"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g. Seafood Fried Rice, Fresh Roast Bread"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="section-title">Food Category</label>
              <select className="fl-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {FOOD_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="section-title">Remaining Quantity & Unit</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  required
                  min="1"
                  className="fl-input"
                  style={{ width: '60%' }}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <select className="fl-select" style={{ width: '40%' }} value={unit} onChange={(e) => setUnit(e.target.value)}>
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="section-title">Cost per Unit (LKR) *</label>
              <input
                type="number"
                required
                min="0"
                className="fl-input"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--fl-text-muted)' }}>Raw ingredient & kitchen prep cost</span>
            </div>
            <div>
              <label className="section-title">Original Selling Price (LKR) *</label>
              <input
                type="number"
                required
                min="0"
                className="fl-input"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--fl-text-muted)' }}>Regular customer menu price</span>
            </div>
          </div>

          {/* Recovery Strategy: Profit Flash Sale vs Ladder vs Direct Donation */}
          <div style={{ background: 'var(--fl-bg-sunken)', padding: '14px', borderRadius: '8px', border: '1px solid var(--fl-border)' }}>
            <label className="section-title" style={{ marginBottom: '8px' }}>
              Surplus Recovery Strategy:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              <button
                type="button"
                className={`fl-btn ${strategy === 'sell_discount' ? 'fl-btn-primary' : 'fl-btn-ghost'}`}
                style={{ textAlign: 'left', padding: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}
                onClick={() => setStrategy('sell_discount')}
              >
                <span style={{ fontWeight: 700 }}>⚡ Sell at Discount (Profit)</span>
                <span style={{ fontSize: '11px', opacity: 0.85 }}>Direct flash sale to make cash profit before waste</span>
              </button>
              <button
                type="button"
                className={`fl-btn ${strategy === 'ladder' ? 'fl-btn-primary' : 'fl-btn-ghost'}`}
                style={{ textAlign: 'left', padding: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}
                onClick={() => setStrategy('ladder')}
              >
                <span style={{ fontWeight: 700 }}>🔄 Smart Income Ladder</span>
                <span style={{ fontSize: '11px', opacity: 0.85 }}>Sell at discount first, then donate unsold portions</span>
              </button>
              <button
                type="button"
                className={`fl-btn ${strategy === 'donate_direct' ? 'fl-btn-primary' : 'fl-btn-ghost'}`}
                style={{ textAlign: 'left', padding: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}
                onClick={() => setStrategy('donate_direct')}
              >
                <span style={{ fontWeight: 700 }}>🤝 Direct Charity Donation</span>
                <span style={{ fontSize: '11px', opacity: 0.85 }}>100% tax deduction receipt & community aid</span>
              </button>
            </div>

            {strategy !== 'donate_direct' && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--fl-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fl-text-heading)' }}>
                    Set Flash Sale Discount Rate:
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--fl-green-dark)' }}>
                    Customer Pays: {formatLKR(discountedPrice)} / portion ({Math.round(discountPercent * 100)}% OFF)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[0.2, 0.3, 0.4, 0.5, 0.6, 0.7].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      className={`fl-btn fl-btn-sm ${discountPercent === pct ? 'fl-btn-secondary' : 'fl-btn-ghost'}`}
                      onClick={() => setDiscountPercent(pct)}
                    >
                      {Math.round(pct * 100)}% OFF ({formatLKR(Math.round(pricePerUnit * (1 - pct)))})
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--fl-text-muted)', marginTop: '6px', margin: '6px 0 0' }}>
                  💡 Kitchen prep cost is {formatLKR(costPerUnit)}. Selling at {formatLKR(discountedPrice)} yields <strong style={{ color: 'var(--fl-green-dark)' }}>+{formatLKR(profitMarginPerPortion)} net cash profit per portion</strong> ({formatLKR(netProfitEarned)} total batch profit).
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="section-title">Safe Window Before Expiry (Food Safety Threshold)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {[1.5, 2, 3, 4, 6].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  className={`fl-btn fl-btn-sm ${hoursUntilUnsafe === hrs ? 'fl-btn-primary' : 'fl-btn-ghost'}`}
                  onClick={() => setHoursUntilUnsafe(hrs)}
                >
                  +{hrs} Hours
                </button>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--fl-text-muted)', marginTop: '4px' }}>
              Countdown starts immediately. If unsold after buffer, automatically matches to nearby charity before safety expiry.
            </p>
          </div>

          <SafetyChecklist values={safetyChecklist} onChange={setSafetyChecklist} />

          <div>
            <label className="section-title">Packaging & Dispatch Notes</label>
            <textarea
              className="fl-textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. In thermal container, requires refrigeration on delivery."
            />
          </div>

          <button type="submit" className="fl-btn fl-btn-primary fl-btn-lg" style={{ marginTop: '1rem' }}>
            🚀 List Remaining Food & Broadcast to Map Network
          </button>
        </div>
      </form>
    </div>
  );
}
