/* HandoverLog — timestamped audit log of food rescue mission */

import { formatDateTime } from '../utils/format.js';
import './HandoverLog.css';

export default function HandoverLog({ handover, listing }) {
  if (!handover) return null;

  const steps = [
    {
      title: 'Donation Match Accepted',
      time: handover.claimedAt,
      status: 'completed',
      detail: `Accepted for donation rescue (${listing?.quantity || ''} ${listing?.unit || ''})`,
    },
    {
      title: 'Volunteer Courier Claimed',
      time: handover.claimedAt,
      status: 'completed',
      detail: `Courier ${handover.volunteerId} dispatched`,
    },
    {
      title: 'Restaurant Handover & Temperature Verified',
      time: handover.pickedUpAt,
      status: handover.pickedUpAt ? 'completed' : 'pending',
      detail: handover.temperatureCheck ? `Verified: ${handover.temperatureCheck}` : 'Awaiting restaurant arrival',
    },
    {
      title: 'Safe Delivery Confirmed at Destination',
      time: handover.deliveredAt,
      status: handover.confirmed ? 'completed' : 'pending',
      detail: handover.confirmed ? 'Signed and received by destination staff' : 'Awaiting transit completion',
    },
  ];

  return (
    <div className="handover-log">
      <h4>📦 Chain of Custody & Handover Log</h4>
      <div className="log-timeline">
        {steps.map((st, i) => (
          <div key={i} className={`log-step ${st.status}`}>
            <div className="step-marker">
              {st.status === 'completed' ? '✓' : i + 1}
            </div>
            <div className="step-content">
              <div className="step-title-row">
                <span className="step-name">{st.title}</span>
                {st.time && <span className="step-timestamp">{formatDateTime(st.time)}</span>}
              </div>
              <p className="step-detail">{st.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
