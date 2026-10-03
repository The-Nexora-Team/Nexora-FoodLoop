/* DemoControl — admin panel for live hackathon demo manipulation & backup demo mode */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFoodLoop, ACTION_TYPES } from '../../context/FoodLoopContext.jsx';
import { generateSeedData } from '../../context/seed.js';
import { SPEED_OPTIONS } from '../../utils/constants.js';

export default function DemoControl() {
  const { state, dispatch } = useFoodLoop();
  const [demoTriggered, setDemoTriggered] = useState(false);

  function handleReset() {
    const fresh = generateSeedData();
    dispatch({ type: ACTION_TYPES.RESET, payload: fresh });
    setDemoTriggered(false);
  }

  function handleSpeedChange(speed) {
    dispatch({ type: ACTION_TYPES.SET_SPEED, payload: speed });
  }

  function handleTriggerBackupDemo() {
    const listingId = 'demo-biryani-' + Date.now();
    const matchId = 'demo-match-' + Date.now();
    const handoverId = 'demo-handover-' + Date.now();
    const simNow = state.simNow;

    // 1. Stage a fresh listing
    const listing = {
      id: listingId,
      restaurantId: 'rest1', // Cinnamon Grand
      foodName: 'Dum Biryani with Boiled Eggs & Gravy',
      category: 'cooked',
      quantity: 25,
      unit: 'portions',
      costPerUnit: 450,
      pricePerUnit: 1200,
      unsafeByTime: simNow + 3 * 3600 * 1000,
      postedAt: simNow,
      status: 'donated',
      currentStep: 'donate',
      discountPercent: 0.2,
      safetyChecklist: { keptHotOrChilled: true, cleanPackaging: true, allergens: ['Eggs'] },
      notes: 'Prepared in thermal containers. Temperature verified at 68°C.',
      matchId,
      volunteerId: 'vol1',
    };

    // 2. Stage accepted match
    const match = {
      id: matchId,
      listingId,
      rankedReceivers: [
        {
          receiverId: 'rec1', // Vajira Children's Home
          receiverName: "Vajira Sri Children's Development Centre",
          receiverType: 'childrens_home',
          score: 92,
          distanceKm: 3.2,
          estimatedTravelMin: 33,
          exclusionReason: null,
          breakdown: { timeMargin: 0.85, proximity: 0.90, capacityFit: 1.0, currentNeed: 0.85, reliability: 0.96 },
        },
      ],
      currentOfferIndex: 0,
      offerSentAt: simNow,
      status: 'accepted',
      acceptedBy: 'rec1',
      declinedReasons: [],
    };

    // 3. Stage completed handover
    const handover = {
      id: handoverId,
      matchId,
      listingId,
      volunteerId: 'vol1', // Kasun Perera
      receiverId: 'rec1',
      claimedAt: simNow + 5 * 60000,
      pickedUpAt: simNow + 18 * 60000,
      deliveredAt: simNow + 38 * 60000,
      temperatureCheck: 'Hot (>60°C)',
      confirmed: true,
    };

    dispatch({ type: ACTION_TYPES.ADD_LISTING, payload: listing });
    dispatch({ type: ACTION_TYPES.CREATE_MATCH, payload: match });
    dispatch({ type: ACTION_TYPES.CLAIM_PICKUP, payload: handover });
    dispatch({
      type: ACTION_TYPES.CONFIRM_PICKUP,
      payload: { handoverId, timestamp: handover.pickedUpAt, temperatureCheck: handover.temperatureCheck },
    });
    dispatch({
      type: ACTION_TYPES.CONFIRM_DELIVERY,
      payload: { handoverId, timestamp: handover.deliveredAt },
    });

    setDemoTriggered(true);
  }

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-danger)', letterSpacing: '0.05em' }}>HACKATHON ADMIN</p>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>Live Demo Controller & Fail-Safe Mode</h1>
        <p style={{ color: 'var(--fl-text-muted)' }}>
          Manipulate simulation time, reset seed scenarios, or trigger automated cascades for live pitch judging.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Speed Controls */}
        <div className="fl-card">
          <h3 style={{ marginBottom: '0.75rem' }}>Clock Simulation Speed</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', marginBottom: '1rem' }}>
            Fast-forward simulation time to showcase automatic step degradation (Sell → Donate → Recycle).
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                className={`fl-btn ${state.speed === speed ? 'fl-btn-primary' : 'fl-btn-ghost'}`}
                onClick={() => handleSpeedChange(speed)}
              >
                {speed}x {speed === 1 ? '(Realtime)' : speed === 10 ? '(Fast)' : '(Turbo)'}
              </button>
            ))}
          </div>
        </div>

        {/* 1-Click Backup Demo Trigger */}
        <div className="fl-card" style={{ borderLeft: '4px solid var(--fl-green)' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Fail-Safe Backup Demo Mode</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', marginBottom: '1rem' }}>
            Instantly stages a complete end-to-end food rescue mission (Buffet Biryani $\to$ Vajira Home $\to$ Kasun Courier $\to$ Tax Receipt) if judging time is tight.
          </p>
          <button className="fl-btn fl-btn-secondary" onClick={handleTriggerBackupDemo}>
            ⚡ Run Instant Full Scenario
          </button>
          {demoTriggered && (
            <p style={{ color: 'var(--fl-green)', fontSize: '0.875rem', marginTop: '0.75rem', fontWeight: 600 }}>
              ✓ Complete food recovery mission staged! Check Restaurant Dashboard or Receipts.
            </p>
          )}
        </div>

        {/* Reset State */}
        <div className="fl-card">
          <h3 style={{ marginBottom: '0.75rem' }}>Reset Demo State</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', marginBottom: '1rem' }}>
            Restore fresh Sri Lankan seed data across all connected tabs (Colombo restaurants, receivers, listings).
          </p>
          <button className="fl-btn fl-btn-danger" onClick={handleReset}>
            🔄 Reset to Default Seed Data
          </button>
        </div>
      </div>

      {/* Diagnostics */}
      <div className="fl-card">
        <h3 style={{ marginBottom: '0.75rem' }}>System Health & Cross-Tab Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>CONNECTED RESTAURANTS</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{state.restaurants?.length}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>SURPLUS BATCHES</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{state.listings?.length}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>ACTIVE MATCHES</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{state.matches?.length}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>COMPLETED HANDOVERS</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {state.handovers?.filter((h) => h.confirmed).length}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--fl-text-muted)' }}>SYNC CHANNEL</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--fl-green)', margin: 0 }}>
              BroadcastChannel (Active)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
