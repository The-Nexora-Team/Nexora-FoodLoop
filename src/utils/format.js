/* ============================================
   Formatting utilities — currency, time, distance
   ============================================ */

/**
 * Format a number as Sri Lankan Rupees.
 * @param {number} amount
 * @returns {string} e.g. "LKR 1,250.00"
 */
export function formatLKR(amount) {
  if (amount == null || isNaN(amount)) return 'LKR 0.00';
  return `LKR ${Number(amount).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Short currency format without decimals for dashboard cards.
 * @param {number} amount
 * @returns {string} e.g. "LKR 1,250"
 */
export function formatLKRShort(amount) {
  if (amount == null || isNaN(amount)) return 'LKR 0';
  return `LKR ${Math.round(amount).toLocaleString('en-LK')}`;
}

import { BASE_DELIVERY_FEE_LKR, PER_KM_DELIVERY_FEE_LKR } from './constants.js';

/**
 * Format a duration in milliseconds as human-readable countdown with real-time ticking seconds.
 * @param {number} ms - Milliseconds remaining
 * @returns {string} e.g. "2h 15m 32s", "45m 09s", "20s", "Expired"
 */
export function formatCountdown(ms) {
  if (ms <= 0) return 'Expired';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${pad(seconds)}s`;
  }
  return `${seconds}s`;
}

export const formatTimeRemaining = formatCountdown;

/**
 * Calculate median fair delivery payout for a courier based on route distance in Colombo.
 * @param {number} distanceKm
 * @returns {number} Fair median price in LKR (rounded to nearest 10)
 */
export function calculateFairDeliveryFee(distanceKm) {
  const dist = Math.max(1, Number(distanceKm) || 2.5);
  const rawFee = BASE_DELIVERY_FEE_LKR + dist * PER_KM_DELIVERY_FEE_LKR;
  return Math.round(rawFee / 10) * 10;
}

/**
 * Format a timestamp as local time string.
 * @param {number} timestamp - Unix ms
 * @returns {string}
 */
export function formatTime(timestamp) {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleTimeString('en-LK', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a timestamp as local date + time.
 * @param {number} timestamp - Unix ms
 * @returns {string}
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString('en-LK', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format distance in km.
 * @param {number} km
 * @returns {string} e.g. "3.2 km"
 */
export function formatDistance(km) {
  if (km == null || isNaN(km)) return '—';
  return `${km.toFixed(1)} km`;
}

/**
 * Haversine distance between two lat/lng points.
 * @param {number} lat1 @param {number} lng1
 * @param {number} lat2 @param {number} lng2
 * @returns {number} distance in km
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Format a percentage.
 * @param {number} ratio - A value 0..1
 * @returns {string} e.g. "73%"
 */
export function formatPercent(ratio) {
  if (ratio == null || isNaN(ratio)) return '0%';
  return `${Math.round(ratio * 100)}%`;
}

/**
 * Get urgency level based on ratio of time remaining to total shelf life.
 * @param {number} ratio - 0 (expired) to 1 (just posted)
 * @returns {'safe' | 'warning' | 'critical'}
 */
export function getUrgencyLevel(ratio) {
  if (ratio > 0.5) return 'safe';
  if (ratio > 0.2) return 'warning';
  return 'critical';
}
