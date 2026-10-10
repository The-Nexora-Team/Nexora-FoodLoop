/* ============================================
   FoodLoop Matching Engine — Hard filters + Weighted scoring
   ============================================ */

import {
  ARRIVAL_RATE_MIN_PER_KM,
  HANDLING_TIME_MIN,
  MIN_CAPACITY_RATIO,
  WEIGHT_TIME_MARGIN,
  WEIGHT_PROXIMITY,
  WEIGHT_CAPACITY_FIT,
  WEIGHT_CURRENT_NEED,
  WEIGHT_RELIABILITY,
  MAX_SCORE_DISTANCE_KM,
  MAX_RELIABILITY,
} from './constants.js';
import { haversineKm } from './format.js';

/**
 * Estimate travel + handling duration in minutes.
 * @param {number} distanceKm
 * @returns {number}
 */
export function estimateTravelTimeMin(distanceKm) {
  return distanceKm * ARRIVAL_RATE_MIN_PER_KM + HANDLING_TIME_MIN;
}

/**
 * Estimate arrival timestamp in ms.
 * @param {number} simNow
 * @param {number} distanceKm
 * @returns {number}
 */
export function estimateArrivalTime(simNow, distanceKm) {
  return simNow + estimateTravelTimeMin(distanceKm) * 60 * 1000;
}

/**
 * Evaluate and score a single receiver against a surplus listing.
 * Applies hard filters first; if passed, calculates weighted score.
 *
 * @param {object} listing
 * @param {object} receiver
 * @param {number} distanceKm
 * @param {number} simNow
 * @returns {object} { eligible: boolean, reason?: string, score?: number, breakdown?: object }
 */
export function scoreReceiver(listing, receiver, distanceKm, simNow) {
  const estimatedArrival = estimateArrivalTime(simNow, distanceKm);

  // ---- Hard Filter 1: Safety / Time window ----
  if (estimatedArrival > listing.unsafeByTime) {
    return {
      eligible: false,
      reason: 'Cannot arrive before unsafe time',
      estimatedArrival,
    };
  }

  // ---- Hard Filter 2: Category Acceptance ----
  if (
    receiver.acceptedCategories &&
    !receiver.acceptedCategories.includes(listing.category)
  ) {
    return {
      eligible: false,
      reason: `Does not accept category: ${listing.category}`,
      estimatedArrival,
    };
  }

  // ---- Hard Filter 3: Minimum Capacity Ratio ----
  const requiredCapacity = listing.quantity * MIN_CAPACITY_RATIO;
  if ((receiver.capacity || 0) < requiredCapacity) {
    return {
      eligible: false,
      reason: `Capacity (${receiver.capacity}) below minimum required (${Math.round(requiredCapacity)})`,
      estimatedArrival,
    };
  }

  // ---- Weighted Scoring Factors (0.0 to 1.0) ----
  const remainingLifeMs = listing.unsafeByTime - simNow;
  const timeMarginMs = listing.unsafeByTime - estimatedArrival;
  const timeMargin = Math.max(0, Math.min(1, timeMarginMs / Math.max(1, remainingLifeMs)));

  const proximity = Math.max(0, Math.min(1, 1 - distanceKm / MAX_SCORE_DISTANCE_KM));
  const capacityFit = Math.min(1, (receiver.capacity || 0) / Math.max(1, listing.quantity));
  const currentNeed = Math.max(0, Math.min(1, (receiver.currentNeed || 0) / 100));
  const reliability = Math.max(0, Math.min(1, (receiver.reliabilityRating || 0) / MAX_RELIABILITY));

  const rawScore =
    timeMargin * WEIGHT_TIME_MARGIN +
    proximity * WEIGHT_PROXIMITY +
    capacityFit * WEIGHT_CAPACITY_FIT +
    currentNeed * WEIGHT_CURRENT_NEED +
    reliability * WEIGHT_RELIABILITY;

  const score = Math.round(rawScore * 100);

  return {
    eligible: true,
    score,
    breakdown: {
      timeMargin: Number(timeMargin.toFixed(3)),
      proximity: Number(proximity.toFixed(3)),
      capacityFit: Number(capacityFit.toFixed(3)),
      currentNeed: Number(currentNeed.toFixed(3)),
      reliability: Number(reliability.toFixed(3)),
    },
    distanceKm: Number(distanceKm.toFixed(2)),
    estimatedTravelMin: Math.round(estimateTravelTimeMin(distanceKm)),
  };
}

/**
 * Rank all receivers for a listing.
 * Eligible receivers are sorted descending by score.
 * Ineligible receivers are placed at the end with exclusionReason.
 *
 * @param {object} listing
 * @param {object} restaurant
 * @param {Array<object>} receivers
 * @param {number} simNow
 * @returns {Array<object>}
 */
export function rankReceivers(listing, restaurant, receivers, simNow) {
  if (!receivers || receivers.length === 0) return [];

  const results = receivers.map((receiver) => {
    const distanceKm = haversineKm(
      restaurant.lat,
      restaurant.lng,
      receiver.lat,
      receiver.lng
    );

    const evalResult = scoreReceiver(listing, receiver, distanceKm, simNow);

    if (evalResult.eligible) {
      return {
        receiverId: receiver.id,
        receiverName: receiver.name,
        receiverType: receiver.type,
        score: evalResult.score,
        breakdown: evalResult.breakdown,
        distanceKm: evalResult.distanceKm,
        estimatedTravelMin: evalResult.estimatedTravelMin,
        exclusionReason: null,
      };
    }

    return {
      receiverId: receiver.id,
      receiverName: receiver.name,
      receiverType: receiver.type,
      score: null,
      breakdown: null,
      distanceKm: Number(distanceKm.toFixed(2)),
      estimatedTravelMin: Math.round(estimateTravelTimeMin(distanceKm)),
      exclusionReason: evalResult.reason,
    };
  });

  const eligible = results
    .filter((r) => r.exclusionReason === null)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const excluded = results.filter((r) => r.exclusionReason !== null);

  return [...eligible, ...excluded];
}
