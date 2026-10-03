/* LadderTimeline — Sell → Donate → Recycle ladder progression */

import { decideSurplusAction, calculateDiscount, calculateDynamicPrice } from '../utils/wasteStrategy.js';
import { formatLKR, formatPercent } from '../utils/format.js';
import { useFoodLoop } from '../context/FoodLoopContext.jsx';
import './LadderTimeline.css';

export default function LadderTimeline({ listing }) {
  const { state } = useFoodLoop();
  const simNow = state.simNow;

  const currentAction = listing.status === 'sold'
    ? 'sold'
    : listing.status === 'donated'
    ? 'donated'
    : listing.status === 'recycled'
    ? 'recycled'
    : listing.status === 'expired'
    ? 'expired'
    : decideSurplusAction(listing, simNow);

  const discountRatio = calculateDiscount(listing.unsafeByTime - simNow);
  const currentPrice = calculateDynamicPrice(listing.pricePerUnit, discountRatio);

  const steps = [
    {
      key: 'sell',
      label: '1. Dynamic Sell',
      sub: currentAction === 'sell' ? `${formatPercent(discountRatio)} off • ${formatLKR(currentPrice)}` : 'Last-hour discount',
      icon: '🏷️',
      color: 'var(--fl-gold)',
    },
    {
      key: 'donate',
      label: '2. Smart Match',
      sub: 'Matched children/elders home',
      icon: '🤝',
      color: 'var(--fl-green)',
    },
    {
      key: 'recycle',
      label: '3. Bio-Cycle',
      sub: 'Compost & livestock feed',
      icon: '🌱',
      color: 'var(--fl-teal)',
    },
  ];

  function getStepStatus(stepKey) {
    if (listing.status === 'sold') {
      return stepKey === 'sell' ? 'completed' : 'skipped';
    }
    if (listing.status === 'donated') {
      if (stepKey === 'sell') return 'passed';
      if (stepKey === 'donate') return 'completed';
      return 'skipped';
    }
    if (listing.status === 'recycled') {
      if (stepKey === 'recycle') return 'completed';
      return 'passed';
    }

    if (currentAction === 'sell') {
      return stepKey === 'sell' ? 'active' : 'upcoming';
    }
    if (currentAction === 'donate') {
      if (stepKey === 'sell') return 'passed';
      return stepKey === 'donate' ? 'active' : 'upcoming';
    }
    if (currentAction === 'recycle') {
      if (stepKey === 'recycle') return 'active';
      return 'passed';
    }
    return 'expired';
  }

  return (
    <div className="ladder-timeline">
      <div className="ladder-track">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.key);
          return (
            <div key={step.key} className={`ladder-node status-${status}`}>
              <div className="ladder-node-circle">
                <span className="ladder-icon">{step.icon}</span>
              </div>
              <div className="ladder-node-info">
                <span className="ladder-node-label">{step.label}</span>
                <span className="ladder-node-sub">{step.sub}</span>
              </div>
              {idx < steps.length - 1 && <div className="ladder-connector" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
