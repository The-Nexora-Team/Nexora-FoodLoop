/* WasteReport — prevention analytics, historical sales forecast, and waste reduction audit */

import { useState } from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext.jsx';
import { forecastPrepQuantity } from '../../utils/wasteStrategy.js';
import { formatLKR } from '../../utils/format.js';
import StatCard from '../../components/StatCard.jsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function WasteReport() {
  const { state } = useFoodLoop();
  const restaurant = state.restaurants.find((r) => r.id === state.currentUser?.id) || state.restaurants[0];

  const [selectedDay, setSelectedDay] = useState(5); // Default to Friday

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Calculate forecast for key menu items
  const menuItems = ['Chicken Biryani', 'Kottu Roti', 'Vegetable Curry', 'Roast Bread'];
  const forecastData = menuItems.map((item) => {
    const forecast = forecastPrepQuantity(restaurant.salesHistory, item, selectedDay);
    return {
      item,
      ...forecast,
    };
  });

  // Monthly waste vs recovery simulated metrics
  const monthlyData = [
    { month: 'Oct', surplus: 120, recovered: 98, wasted: 22 },
    { month: 'Nov', surplus: 110, recovered: 95, wasted: 15 },
    { month: 'Dec', surplus: 145, recovered: 132, wasted: 13 },
    { month: 'Jan', surplus: 95, recovered: 89, wasted: 6 },
  ];

  return (
    <div className="fl-container page-animate" style={{ padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fl-teal)', letterSpacing: '0.05em' }}>PREVENTION & AUDITING</p>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--fl-text-heading)', margin: '4px 0' }}>Waste Prevention & Analytics</h1>
          <p style={{ color: 'var(--fl-text-muted)' }}>AI prep recommendations and monthly recovery diversion breakdown for {restaurant.name}.</p>
        </div>

        <button className="fl-btn fl-btn-ghost" onClick={() => window.print()}>
          🖨️ Export Audit Report
        </button>
      </div>

      {/* Top Stat Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Diversion Rate" value="94.2%" sub="+14% since FoodLoop launch" icon="📈" variant="success" />
        <StatCard label="Financial Recaptured" value="LKR 384,500" sub="Prevented inventory write-down" icon="💰" />
        <StatCard label="Prep Over-Production" value="-18.5%" sub="Forecast optimization model" icon="🎯" />
      </div>

      {/* Prevention Engine Section */}
      <div className="fl-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Smart Kitchen Prep Forecast</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)' }}>
              Avoid over-prep before it happens with past sales data & safe safety factor (1.10x).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {daysOfWeek.map((day, idx) => (
              <button
                key={day}
                className={`fl-btn fl-btn-sm ${selectedDay === idx ? 'fl-btn-primary' : 'fl-btn-ghost'}`}
                onClick={() => setSelectedDay(idx)}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--fl-border)', color: 'var(--fl-text-muted)' }}>
                <th style={{ padding: '8px' }}>Menu Item</th>
                <th style={{ padding: '8px' }}>Historical Avg Sold</th>
                <th style={{ padding: '8px' }}>Safety Margin (Floor)</th>
                <th style={{ padding: '8px' }}>Recommended Prep Qty</th>
                <th style={{ padding: '8px' }}>Estimated Waste Reduction</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map((f) => (
                <tr key={f.item} style={{ borderBottom: '1px solid var(--fl-border-light)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{f.item}</td>
                  <td style={{ padding: '10px 8px' }}>{f.baselineAverage} portions</td>
                  <td style={{ padding: '10px 8px', color: 'var(--fl-text-muted)' }}>{f.safetyFloor} portions</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className="fl-badge fl-badge-safe">{f.recommendedPrep} portions</span>
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--fl-green)' }}>-4.2 portions surplus</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Recovery Chart */}
      <div className="fl-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Monthly Surplus Diversion Breakdown (Kg)</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--fl-text-muted)', marginBottom: '1.5rem' }}>
          Comparing surplus generation vs successful recovery (Sold + Donated + Recycled).
        </p>

        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" stroke="var(--fl-text-muted)" fontSize={12} />
              <YAxis stroke="var(--fl-text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: '#fff', borderRadius: '8px', border: '1px solid var(--fl-border)' }} />
              <Legend />
              <Bar dataKey="recovered" name="Diverted & Recovered (kg)" fill="#1f8a5b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="wasted" name="Landfill Waste (kg)" fill="#d6452f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
