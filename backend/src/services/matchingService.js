export const ARRIVAL_RATE_MIN_PER_KM = 4;
export const HANDLING_TIME_MIN = 20;
export const MIN_CAPACITY_RATIO = 0.5;

export const WEIGHT_TIME_MARGIN = 0.30;
export const WEIGHT_PROXIMITY = 0.25;
export const WEIGHT_CAPACITY_FIT = 0.20;
export const WEIGHT_CURRENT_NEED = 0.15;
export const WEIGHT_RELIABILITY = 0.10;

export const MAX_SCORE_DISTANCE_KM = 30;
export const MAX_RELIABILITY = 5;

/**
 * Haversine formula to calculate great-circle distance between two geo points in km.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimateTravelTimeMin(distanceKm) {
  return distanceKm * ARRIVAL_RATE_MIN_PER_KM + HANDLING_TIME_MIN;
}

export function estimateArrivalTime(simNow, distanceKm) {
  return simNow + estimateTravelTimeMin(distanceKm) * 60 * 1000;
}

export function scoreReceiver(listing, receiver, distanceKm, simNow) {
  const estimatedArrival = estimateArrivalTime(simNow, distanceKm);

  // Hard Filter 1: Safety / Time window
  if (estimatedArrival > listing.unsafeByTime) {
    return {
      eligible: false,
      reason: 'Cannot arrive before unsafe time',
      estimatedArrival,
    };
  }

  // Hard Filter 2: Category Acceptance
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

  // Hard Filter 3: Minimum Capacity Ratio
  const requiredCapacity = listing.quantity * MIN_CAPACITY_RATIO;
  if ((receiver.capacity || 0) < requiredCapacity) {
    return {
      eligible: false,
      reason: `Capacity (${receiver.capacity}) below minimum required (${Math.round(requiredCapacity)})`,
      estimatedArrival,
    };
  }

  // Weighted Scoring Factors (0.0 to 1.0)
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

export function rankReceivers(listing, restaurant, receivers, simNow) {
  if (!receivers || receivers.length === 0) return [];

  const results = receivers.map((receiver) => {
    const distanceKm = haversineKm(
      restaurant.lat || 6.9271,
      restaurant.lng || 79.8612,
      receiver.lat || 6.92,
      receiver.lng || 79.86
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

