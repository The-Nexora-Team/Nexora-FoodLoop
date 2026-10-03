/* StatCard — reusable dashboard stat display */

import './StatCard.css';

export default function StatCard({ label, value, sub, icon, variant = 'default' }) {
  return (
    <div className={`stat-card-fl stat-card-${variant}`}>
      {icon && <div className="stat-card-icon">{icon}</div>}
      <div className="stat-card-body">
        <span className="stat-card-label">{label}</span>
        <strong className="stat-card-value">{value}</strong>
        {sub && <small className="stat-card-sub">{sub}</small>}
      </div>
    </div>
  );
}
