/* ImpactCounter — animated number incrementer */

import { useState, useEffect } from 'react';

export default function ImpactCounter({ targetValue, prefix = '', suffix = '', durationMs = 800 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startVal = displayValue;
    const endVal = Number(targetValue) || 0;

    if (startVal === endVal) return;

    let frameId;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      const current = Math.floor(startVal + (endVal - startVal) * progress);
      setDisplayValue(current);
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [targetValue]);

  return (
    <span className="impact-counter-val">
      {prefix}{displayValue.toLocaleString('en-LK')}{suffix}
    </span>
  );
}
