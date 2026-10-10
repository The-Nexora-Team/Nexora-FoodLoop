/* MatchPanel — ranked receivers breakdown, score breakdown bars, and escalation controls */

import { useFoodLoop, ACTION_TYPES } from '../context/FoodLoopContext.jsx';
import { formatTimeRemaining, formatDistance } from '../utils/format.js';
import './MatchPanel.css';

export default function MatchPanel({ match, listing }) {
  const { state, dispatch } = useFoodLoop();

  if (!match || !match.rankedReceivers) {
    return (
      <div className="fl-card match-panel">
        <p style={{ color: 'var(--fl-text-muted)' }}>No matches computed yet.</p>
      </div>
    );
  }

  const eligibleReceivers = match.rankedReceivers.filter((r) => !r.exclusionReason);
  const excludedReceivers = match.rankedReceivers.filter((r) => r.exclusionReason);
  const currentReceiver = eligibleReceivers[match.currentOfferIndex];

  function handleEscalate() {
    dispatch({
      type: ACTION_TYPES.ESCALATE_MATCH,
      payload: { matchId: match.id },
    });
  }

  function handleRouteRecycling() {
    dispatch({
      type: ACTION_TYPES.ROUTE_TO_RECYCLING,
      payload: { matchId: match.id },
    });
  }

  return (
    <div className="match-panel fl-card">
      <div className="match-panel-header">
        <div>
          <h3>Smart Donation Matching Engine</h3>
          <p className="match-sub">
            Ranked by multi-factor score: Time margin (30%), Proximity (25%), Capacity (20%), Need (15%), Reliability (10%)
          </p>
        </div>
        <span className={`fl-badge ${
          match.status === 'accepted' ? 'fl-badge-safe' :
          match.status === 'pending' ? 'fl-badge-warning' : 'fl-badge-critical'
        }`}>
          {match.status.toUpperCase()}
        </span>
      </div>

      {currentReceiver && match.status === 'pending' && (
        <div className="current-offer-box fl-animate-slide">
          <div className="offer-header">
            <div>
              <span className="offer-tag">CURRENT OFFER TARGET (Rank #{match.currentOfferIndex + 1})</span>
              <h4 className="receiver-name">{currentReceiver.receiverName}</h4>
              <p className="receiver-meta">
                📍 {formatDistance(currentReceiver.distanceKm)} away • Est. transit: {currentReceiver.estimatedTravelMin} mins
              </p>
            </div>
            <div className="match-score-badge">
              <span className="score-num">{currentReceiver.score}</span>
              <span className="score-label">MATCH SCORE</span>
            </div>
          </div>

          {currentReceiver.breakdown && (
            <div className="breakdown-grid">
              <div className="breakdown-item">
                <div className="breakdown-label">Time Window Margin</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.round(currentReceiver.breakdown.timeMargin * 100)}%` }} />
                </div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Proximity</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.round(currentReceiver.breakdown.proximity * 100)}%` }} />
                </div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Capacity Fit</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.round(currentReceiver.breakdown.capacityFit * 100)}%` }} />
                </div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Urgency / Need</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.round(currentReceiver.breakdown.currentNeed * 100)}%` }} />
                </div>
              </div>
            </div>
          )}

          <div className="offer-controls">
            <button className="fl-btn fl-btn-ghost fl-btn-sm" onClick={handleEscalate}>
              ⏩ Escalate to Next Ranked Receiver
            </button>
            <button className="fl-btn fl-btn-danger fl-btn-sm" onClick={handleRouteRecycling}>
              ♻️ Force Route to Bio-Recycling
            </button>
          </div>
        </div>
      )}

      {/* Full Candidates Ranking Table */}
      <div className="all-candidates-section">
        <h4 className="candidates-title">Evaluated Candidate Centers</h4>
        <div className="candidates-list">
          {match.rankedReceivers.map((rec, idx) => {
            const isTarget = idx === match.currentOfferIndex && match.status === 'pending';
            const isAccepted = match.acceptedBy === rec.receiverId;

            return (
              <div
                key={rec.receiverId}
                className={`candidate-row ${isTarget ? 'is-target' : ''} ${isAccepted ? 'is-accepted' : ''} ${rec.exclusionReason ? 'is-excluded' : ''}`}
              >
                <div className="candidate-info">
                  <span className="rank-indicator">
                    {rec.exclusionReason ? '✕' : isAccepted ? '✓' : `#${idx + 1}`}
                  </span>
                  <div>
                    <span className="candidate-name">{rec.receiverName}</span>
                    <span className="candidate-type">({rec.receiverType?.replace('_', ' ')})</span>
                  </div>
                </div>

                <div className="candidate-right">
                  {rec.exclusionReason ? (
                    <span className="exclusion-reason">Excluded: {rec.exclusionReason}</span>
                  ) : (
                    <span className="candidate-score">{rec.score} pts</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
