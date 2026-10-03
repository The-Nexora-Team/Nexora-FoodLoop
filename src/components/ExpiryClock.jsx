/* ExpiryClock — countdown green→amber→red with real-time ticking seconds */

import { useState, useEffect } from 'react';
import { formatCountdown, getUrgencyLevel } from '../utils/format.js';
import { useFoodLoop } from '../context/FoodLoopContext.jsx';
import './ExpiryClock.css';

export default function ExpiryClock({ unsafeByTime, postedAt, compact = false }) {
  const { state } = useFoodLoop();
  const [, setTicker] = useState(0);

  // Live second ticker ensures countdown visibly updates every second in real time
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const simNow = state.simNow;
  const remainingMs = Math.max(0, unsafeByTime - simNow);
  const totalLifeMs = Math.max(1, unsafeByTime - (postedAt || (unsafeByTime - 4 * 3600 * 1000)));
  const ratio = Math.max(0, Math.min(1, remainingMs / totalLifeMs));
  const urgency = getUrgencyLevel(ratio);

  const formatted = formatCountdown(remainingMs);
  const isExpired = remainingMs <= 0;

  return (
    <div className={`expiry-clock-badge urgency-${urgency} ${compact ? 'compact' : ''} ${isExpired ? 'is-expired' : ''}`}>
      <span className="clock-pulse-dot" />
      <span className="clock-icon">⏳</span>
      <span className="clock-time">{formatted}</span>
    </div>
  );
}
