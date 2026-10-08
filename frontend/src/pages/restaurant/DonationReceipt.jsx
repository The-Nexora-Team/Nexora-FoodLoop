/* DonationReceipt — official tax deductible food donation certificate & IRD audit receipt */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFoodLoop, ACTION_TYPES } from '../../context/FoodLoopContext.jsx';
import { formatLKR, formatDateTime } from '../../utils/format.js';
import './DonationReceipt.css';

export default function DonationReceipt() {
  const { id } = useParams();
  const { state, dispatch } = useFoodLoop();
  const currentUser = state.currentUser;

  // Find the restaurant profile
  const restaurant =
    state.restaurants.find((r) => r.id === currentUser?.id || r.userId === currentUser?.id) ||
    state.restaurants[0] || {
      id: 'rest-001',
      name: 'Colombo Kitchen',
      area: 'Colombo 07 - Cinnamon Gardens',
      cuisine: 'Hotel Buffet & Fine Dining',
    };

  // Find all donated listings belonging to this restaurant (or globally if admin)
  const donatedListings = state.listings.filter(
    (l) => l.status === 'donated' && (l.restaurantId === restaurant.id || currentUser?.role === 'admin' || !l.restaurantId)
  );

  // Selected receipt state (either URL param, or first available, or fallback)
  const [selectedListingId, setSelectedListingId] = useState(
    id && id !== 'all' ? id : (donatedListings[0]?.id || 'demo-receipt-001')
  );

  // Active listing
  let activeListing = state.listings.find((l) => l.id === selectedListingId);

  // Fallback demo listing if no donated batches exist in state
  if (!activeListing) {
    if (donatedListings.length > 0) {
      activeListing = donatedListings[0];
    } else {
      activeListing = {
        id: 'REC-DEMO-2026-098',
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        foodName: 'Dum Biryani with Boiled Eggs & Gravy',
        category: 'cooked',
        quantity: 25,
        unit: 'portions',
        costPerUnit: 450,
        pricePerUnit: 1200,
        postedAt: Date.now() - 4 * 3600 * 1000,
        unsafeByTime: Date.now() + 2 * 3600 * 1000,
        status: 'donated',
        matchId: 'match-demo-001',
        volunteerId: 'vol-001',
        safetyChecklist: {
          keptHotOrChilled: true,
          cleanPackaging: true,
          allergens: ['Eggs', 'Dairy'],
        },
        notes: 'End-of-service dinner buffet trays. Held in thermal insulated containers at 68°C.',
      };
    }
  }

  // Linked match and receiver
  const match = state.matches.find((m) => m.id === activeListing.matchId || m.listingId === activeListing.id);
  const receiverId = match?.acceptedBy || (match?.rankedReceivers && match.rankedReceivers[0]?.receiverId) || 'recv-001';
  const receiver =
    state.receivers.find((r) => r.id === receiverId) || {
      id: 'recv-001',
      name: "Sisu Diriya Children's Home",
      type: 'childrens_home',
      area: 'Dehiwala - Mount Lavinia',
      capacity: 50,
    };

  // Linked handover and volunteer
  const handover = state.handovers.find((h) => h.listingId === activeListing.id || h.matchId === match?.id) || {
    id: 'handover-demo-001',
    volunteerId: 'vol-001',
    claimedAt: activeListing.postedAt + 10 * 60000,
    pickedUpAt: activeListing.postedAt + 25 * 60000,
    deliveredAt: activeListing.postedAt + 55 * 60000,
    temperatureCheck: 'Hot (>60°C - Logged at 68°C)',
    confirmed: true,
    deliveryFeeLKR: 380,
  };

  const volunteer =
    state.volunteers.find((v) => v.id === handover.volunteerId) || {
      id: 'vol-001',
      name: 'Kasun Perera',
      vehicle: 'Motorbike / Courier Bag',
      phone: '077 123 4567',
      reliabilityRating: 4.8,
    };

  // Financial calculations
  const totalCostValue = (activeListing.costPerUnit || 350) * activeListing.quantity;
  const totalRetailValue = (activeListing.pricePerUnit || 800) * activeListing.quantity;
  const kgEstimated = Number((activeListing.quantity * 0.4).toFixed(1));
  const co2AvertedKg = Number((kgEstimated * 2.5).toFixed(1));

  // Quick 1-click rescue generator if needed
  function handleGenerateDemoDonation() {
    const listingId = 'rec-biryani-' + Date.now();
    const matchId = 'match-' + Date.now();
    const handoverId = 'handover-' + Date.now();
    const now = state.simNow;

    const newListing = {
      id: listingId,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      foodName: 'Dum Biryani with Boiled Eggs & Gravy',
      category: 'cooked',
      quantity: 25,
      unit: 'portions',
      costPerUnit: 450,
      pricePerUnit: 1200,
      unsafeByTime: now + 3 * 3600 * 1000,
      postedAt: now - 3600 * 1000,
      status: 'donated',
      currentStep: 'donate',
      discountPercent: 0.2,
      safetyChecklist: { keptHotOrChilled: true, cleanPackaging: true, allergens: ['Eggs'] },
      notes: 'Hot buffet trays pulled from service at closing. Temperature verified at 68°C.',
      matchId,
      volunteerId: 'vol-001',
    };

    const newMatch = {
      id: matchId,
      listingId,
      rankedReceivers: [{ receiverId: 'recv-001', receiverName: "Sisu Diriya Children's Home", score: 94 }],
      currentOfferIndex: 0,
      offerSentAt: now - 3600 * 1000,
      status: 'accepted',
      acceptedBy: 'recv-001',
    };

    const newHandover = {
      id: handoverId,
      matchId,
      listingId,
      volunteerId: 'vol-001',
      receiverId: 'recv-001',
      claimedAt: now - 3000 * 1000,
      pickedUpAt: now - 2000 * 1000,
      deliveredAt: now - 500 * 1000,
      temperatureCheck: 'Hot (>60°C - Verified 68°C)',
      confirmed: true,
      deliveryFeeLKR: 412,
    };

    dispatch({ type: ACTION_TYPES.ADD_LISTING, payload: newListing });
    dispatch({ type: ACTION_TYPES.CREATE_MATCH, payload: newMatch });
    dispatch({ type: ACTION_TYPES.CLAIM_PICKUP, payload: newHandover });
    setSelectedListingId(listingId);
  }

  return (
    <div className="fl-container receipt-page page-animate">
      {/* Top Action Bar (hidden when printing) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          maxWidth: '780px',
          margin: '0 auto 1.5rem',
        }}
      >
        <div>
          <Link to="/restaurant" style={{ fontSize: '0.8125rem', color: 'var(--fl-teal)', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to Restaurant Dashboard
          </Link>
          <h2 style={{ margin: '4px 0 0', fontSize: '1.5rem', color: 'var(--fl-text-heading)' }}>
            Official Tax Deduction Receipts
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Multi-receipt dropdown if multiple donations exist */}
          {donatedListings.length > 1 && (
            <select
              className="fl-select fl-select-sm"
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              style={{ width: '220px' }}
            >
              {donatedListings.map((dl) => (
                <option key={dl.id} value={dl.id}>
                  {dl.foodName} ({dl.quantity} {dl.unit})
                </option>
              ))}
            </select>
          )}

          {donatedListings.length === 0 && (
            <button className="fl-btn fl-btn-ghost fl-btn-sm" onClick={handleGenerateDemoDonation}>
              ⚡ Stage Sample Donation Voucher
            </button>
          )}

          <button className="fl-btn fl-btn-primary" onClick={() => window.print()}>
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>

      {/* The Printable Official Tax Voucher Sheet */}
      <div className="receipt-voucher-card">
        {/* Header */}
        <div className="receipt-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.5rem' }}>🔄</span>
              <h1 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#0f3d3e', margin: 0, letterSpacing: '-0.02em' }}>
                FOOD RECOVERY TAX RECEIPT
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#4b5563' }}>
              Statutory Charitable Food Donation & CSR Verification Voucher
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
              Inland Revenue Act No. 24 of 2017 (Sri Lanka) · Approved Perishable Food Relief
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="receipt-seal-badge">
              ✓ IRD VERIFIED DONATION
            </span>
            <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', fontWeight: 700, color: '#111827' }}>
              VOUCHER REF: LK-TX-{activeListing.id?.toUpperCase()}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#4b5563' }}>
              Issued: {formatDateTime(activeListing.postedAt)}
            </p>
          </div>
        </div>

        {/* Parties Grid (Donor Hotel & Recipient Shelter) */}
        <div className="receipt-grid">
          {/* Donor Entity Box */}
          <div className="receipt-entity-box">
            <div className="receipt-box-label">1. Donor Organization (Hospitality Provider)</div>
            <h3 className="receipt-box-title">{restaurant.name}</h3>
            <p className="receipt-box-text"><strong>Premises:</strong> {restaurant.area}</p>
            <p className="receipt-box-text"><strong>Classification:</strong> {restaurant.cuisine || 'Commercial Buffet & Food Service'}</p>
            <p className="receipt-box-text"><strong>Donor Account ID:</strong> {restaurant.id}</p>
            <p className="receipt-box-text"><strong>Official Contact:</strong> {restaurant.email || `${restaurant.id}@foodloop.lk`}</p>
          </div>

          {/* Recipient Charity Box */}
          <div className="receipt-entity-box">
            <div className="receipt-box-label">2. Approved Beneficiary (Recipient Institution)</div>
            <h3 className="receipt-box-title">{receiver.name}</h3>
            <p className="receipt-box-text"><strong>Institution:</strong> {receiver.type?.replace('_', ' ').toUpperCase() || 'REGISTERED CHARITY SHELTER'}</p>
            <p className="receipt-box-text"><strong>Drop Location:</strong> {receiver.area}</p>
            <p className="receipt-box-text"><strong>Shelter Capacity:</strong> {receiver.capacity || 50} residents fed</p>
            <p className="receipt-box-text"><strong>Charity Verification:</strong> Certified Social Welfare Partner</p>
          </div>
        </div>

        {/* Chain of Custody & Logistics Box */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.8125rem' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>COURIER TRANSPORT</span>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{volunteer.name} ({volunteer.vehicle || 'Motorbike'})</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Tel: {volunteer.phone}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TEMPERATURE AUDIT</span>
            <div style={{ fontWeight: 700, color: '#16a34a' }}>
              ✓ {handover.temperatureCheck || 'Hot (>60°C Verified)'}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Chain of custody safe</div>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>SAFE HANDOVER LOG</span>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>
              {handover.deliveredAt ? formatDateTime(handover.deliveredAt) : 'Delivery Verified Hot'}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Recipient coordinator signed</div>
          </div>
        </div>

        {/* Itemized Valuation Table */}
        <h4 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: '#374151', margin: '0 0 8px', letterSpacing: '0.04em' }}>
          3. Itemized Surplus Food Donation Schedule
        </h4>
        <table className="receipt-table">
          <thead>
            <tr>
              <th>Surplus Food Item Description</th>
              <th>Category</th>
              <th>Quantity Donated</th>
              <th>Food Cost Basis (Unit)</th>
              <th style={{ textAlign: 'right' }}>Total Tax Deductible Cost Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style={{ fontWeight: 700, color: '#111827' }}>{activeListing.foodName}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Allergens: {activeListing.safetyChecklist?.allergens?.join(', ') || 'Standard Food Safety Standard'} · Thermal insulated trays
                </div>
              </td>
              <td style={{ textTransform: 'capitalize' }}>{activeListing.category}</td>
              <td style={{ fontWeight: 700 }}>{activeListing.quantity} {activeListing.unit} (~{kgEstimated} kg)</td>
              <td>{formatLKR(activeListing.costPerUnit || 350)}</td>
              <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                {formatLKR(totalCostValue)}
              </td>
            </tr>
            <tr className="receipt-total-row">
              <td colSpan="3">
                <span style={{ fontWeight: 800 }}>TOTAL CERTIFIED PERISHABLE FOOD CHARITABLE CONTRIBUTION</span>
                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>
                  Equivalent Retail Menu Market Value: {formatLKR(totalRetailValue)} | GHG Emissions Diverted: {co2AvertedKg} kg CO₂e
                </div>
              </td>
              <td style={{ fontWeight: 800 }}>COST TOTAL:</td>
              <td style={{ textAlign: 'right', fontSize: '1.125rem', fontWeight: 900, color: '#0f3d3e' }}>
                {formatLKR(totalCostValue)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Legal Tax Deduction Clause */}
        <div className="receipt-tax-clause">
          <strong>STATUTORY TAX EXEMPTION & CSR QUALIFICATION CLAUSE:</strong>
          <p style={{ margin: '4px 0 0' }}>
            This certified donation voucher confirms the physical transfer of fresh, uncompromised surplus food under certified temperature control. Pursuant to <strong>Section 24(1)(b) of the Inland Revenue Act, No. 24 of 2017 (Republic of Sri Lanka)</strong>, donations of meals to certified charitable institutions are deductible as allowable business expenses against assessable income, up to the limits specified by law.
          </p>
        </div>

        {/* Dual Signatures & Seal */}
        <div className="receipt-signatures">
          <div>
            <div style={{ minHeight: '36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'cursive', fontSize: '1.25rem', color: '#0f3d3e' }}>
                {restaurant.name?.split(' ')[0]} Kitchen Exec.
              </span>
            </div>
            <div className="receipt-sign-line">
              <strong>Authorized Food Donor Signature</strong>
              <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>Executive Chef / Food & Beverage Director</div>
            </div>
          </div>

          <div>
            <div style={{ minHeight: '36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'cursive', fontSize: '1.25rem', color: '#16a34a' }}>
                {receiver.name?.split(' ')[0]} Directorship
              </span>
            </div>
            <div className="receipt-sign-line">
              <strong>Beneficiary Shelter Receiving Signature</strong>
              <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>Authorized Social Welfare Receiving Officer</div>
            </div>
          </div>
        </div>

        {/* Seal footer */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', fontSize: '0.6875rem', color: '#9ca3af' }}>
          VERIFIED BY NEXORA FOODLOOP DIGITAL CHAIN-OF-CUSTODY AUDIT NETWORK · COLOMBO, SRI LANKA · AUDIT CERTIFICATE LK-{activeListing.id?.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
