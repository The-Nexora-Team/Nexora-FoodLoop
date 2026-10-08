/* ============================================
   FoodLoop Waste Strategy & Income Ladder Logic
   ============================================ */

import {
  DISCOUNT_STEPS,
  PRICE_FLOOR_RATIO,
  DONATION_BUFFER_MIN,
  OFFER_TIMEOUT_SIM_MIN,
  RECYCLE_THRESHOLD_RATIO,
  PREP_MULTIPLIER,
  PREP_SAFETY_MARGIN,
} from './constants.js';

/**
 * Calculate applicable discount percentage based on time remaining before unsafe deadline.
 * @param {number} timeRemainingMs
 * @returns {number} discount ratio, e.g. 0.40 for 40%
 */
export function calculateDiscount(timeRemainingMs) {
  const remainingMin = Math.max(0, timeRemainingMs / (60 * 1000));

  for (const step of DISCOUNT_STEPS) {
    if (remainingMin >= step.minMinutes) {
      return step.discount;
    }
  }

  // Fallback to highest discount step
  return DISCOUNT_STEPS[DISCOUNT_STEPS.length - 1].discount;
}

/**
 * Calculate discounted price respecting the hard price floor.
 * @param {number} originalPrice
 * @param {number} discountRatio
 * @returns {number}
 */
export function calculateDynamicPrice(originalPrice, discountRatio) {
  if (!originalPrice || originalPrice <= 0) return 0;
  const discounted = originalPrice * (1 - discountRatio);
  const floorPrice = originalPrice * PRICE_FLOOR_RATIO;
  return Math.round(Math.max(discounted, floorPrice) * 100) / 100;
}

/**
 * Decide the current income ladder stage for a surplus listing.
 * Income Ladder:
 *  1. SELL: While remaining time > DONATION_BUFFER_MIN (60 min)
 *  2. DONATE: When remaining time <= DONATION_BUFFER_MIN (60 min)
 *  3. RECYCLE: When remaining time <= DONATION_BUFFER_MIN * RECYCLE_THRESHOLD_RATIO (24 min)
 *  4. EXPIRED: When remaining time <= 0
 *
 * @param {object} listing
 * @param {number} simNow
 * @returns {'sell' | 'donate' | 'recycle' | 'expired'}
 */
export function decideSurplusAction(listing, simNow) {
  const remainingMs = listing.unsafeByTime - simNow;
  const remainingMin = remainingMs / (60 * 1000);

  if (remainingMin <= 0) {
    return 'expired';
  }

  const recycleThresholdMin = DONATION_BUFFER_MIN * RECYCLE_THRESHOLD_RATIO; // 24 min

  if (remainingMin <= recycleThresholdMin) {
    return 'recycle';
  }

  if (remainingMin <= DONATION_BUFFER_MIN) {
    return 'donate';
  }

  return 'sell';
}

/**
 * Check whether a pending donation offer has timed out and should escalate to the next candidate.
 * @param {number} offerSentAt - Unix ms
 * @param {number} simNow - Unix ms
 * @returns {boolean}
 */
export function shouldEscalateOffer(offerSentAt, simNow) {
  if (!offerSentAt) return false;
  const elapsedMinutes = (simNow - offerSentAt) / (60 * 1000);
  return elapsedMinutes >= OFFER_TIMEOUT_SIM_MIN;
}

/**
 * Check whether remaining time is too critical for human consumption and must route to compost/feed.
 * @param {number} unsafeByTime
 * @param {number} simNow
 * @returns {boolean}
 */
export function shouldRouteToRecycling(unsafeByTime, simNow) {
  const remainingMin = (unsafeByTime - simNow) / (60 * 1000);
  const recycleThresholdMin = DONATION_BUFFER_MIN * RECYCLE_THRESHOLD_RATIO;
  return remainingMin > 0 && remainingMin <= recycleThresholdMin;
}

/**
 * Prevention Algorithm:
 * Forecast recommended prep quantity for an item based on historical sales.
 * @param {Array<object>} salesHistory - Array of past daily records
 * @param {string} itemName - Food item name
 * @param {number} targetDayOfWeek - 0 (Sun) to 6 (Sat)
 * @returns {object} { recommendedPrep, baselineAverage, safetyFloor }
 */
export function forecastPrepQuantity(salesHistory, itemName, targetDayOfWeek) {
  if (!salesHistory || salesHistory.length === 0) {
    return { recommendedPrep: 25, baselineAverage: 25, safetyFloor: 23 };
  }

  // Filter matching days of week if available, or all records
  const matchingRecords = salesHistory.filter(
    (record) => record.dayOfWeek === targetDayOfWeek || record.dayOfWeek == null
  );

  const recordsToUse = matchingRecords.length > 0 ? matchingRecords : salesHistory;

  const soldNumbers = recordsToUse
    .map((record) => record.items?.[itemName]?.sold)
    .filter((n) => typeof n === 'number' && !isNaN(n));

  if (soldNumbers.length === 0) {
    return { recommendedPrep: 25, baselineAverage: 25, safetyFloor: 23 };
  }

  const sum = soldNumbers.reduce((acc, curr) => acc + curr, 0);
  const baselineAverage = Math.round(sum / soldNumbers.length);
  const recommendedPrep = Math.round(baselineAverage * PREP_MULTIPLIER);
  const safetyFloor = Math.round(baselineAverage * PREP_SAFETY_MARGIN);

  return {
    recommendedPrep,
    baselineAverage,
    safetyFloor,
  };
}
