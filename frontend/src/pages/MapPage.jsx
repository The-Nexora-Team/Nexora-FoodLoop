/* MapPage — live map view of restaurants, receivers, and volunteers */

import { useFoodLoop } from '../context/FoodLoopContext.jsx';
import MapView from '../components/MapView.jsx';

export default function MapPage() {
  const { state } = useFoodLoop();

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-teal)', letterSpacing: '0.05em' }}>GEO RESCUE NETWORK</p>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>Colombo Food Recovery Network</h1>
        <p style={{ color: 'var(--fl-text-muted)' }}>
          Real-time location map connecting commercial food donors, verified recipient charities, and volunteer couriers across Colombo 01–07.
        </p>
      </div>

      <MapView height="550px" />
    </div>
  );
}
