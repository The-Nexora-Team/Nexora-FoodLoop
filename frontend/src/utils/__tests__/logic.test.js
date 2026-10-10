import { describe, it, expect } from 'vitest';
import {
  scoreReceiver,
  rankReceivers,
  estimateTravelTimeMin,
  estimateArrivalTime,
} from '../matching.js';
import {
  calculateDiscount,
  calculateDynamicPrice,
  decideSurplusAction,
  shouldEscalateOffer,
  shouldRouteToRecycling,
  forecastPrepQuantity,
} from '../wasteStrategy.js';
import {
  normalizeFoodQuantity,
  calculateCO2e,
  calculateTotalImpact,
} from '../impact.js';

describe('Matching Engine', () => {
  const now = 1700000000000;
  const listing = {
    id: 'l1',
    foodName: 'Fried Rice',
    category: 'cooked',
    quantity: 30,
    unit: 'portions',
    unsafeByTime: now + 3 * 3600 * 1000, // 3 hours from now
  };

  const receiver = {
    id: 'rec1',
    name: 'Colombo Shelter',
    acceptedCategories: ['cooked', 'bakery'],
    capacity: 50,
    currentNeed: 85,
    reliabilityRating: 4.8,
  };

  it('calculates travel time and arrival correctly', () => {
    // 5 km * 4 min/km + 20 min handling = 40 min
    const travelMin = estimateTravelTimeMin(5);
    expect(travelMin).toBe(40);

    const arrival = estimateArrivalTime(now, 5);
    expect(arrival).toBe(now + 40 * 60 * 1000);
  });

  it('rejects receivers that cannot arrive before unsafe time', () => {
    // 100 km * 4 min + 20 min = 420 min (7 hours), but unsafe in 3 hours
    const result = scoreReceiver(listing, receiver, 100, now);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('unsafe time');
  });

  it('rejects receivers that do not accept the food category', () => {
    const pickyReceiver = { ...receiver, acceptedCategories: ['produce'] };
    const result = scoreReceiver(listing, pickyReceiver, 2, now);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('category');
  });

  it('rejects receivers with insufficient capacity (< 50% of listing)', () => {
    const smallReceiver = { ...receiver, capacity: 10 }; // 10 < 30 * 0.5 (15)
    const result = scoreReceiver(listing, smallReceiver, 2, now);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Capacity');
  });

  it('scores eligible receivers with normalized weighted factors', () => {
    const result = scoreReceiver(listing, receiver, 3, now);
    expect(result.eligible).toBe(true);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.timeMargin).toBeGreaterThan(0);
    expect(result.breakdown.proximity).toBeGreaterThan(0);
  });

  it('ranks receivers with highest score first, excluded last', () => {
    const restaurant = { lat: 6.9271, lng: 79.8612 };
    const receivers = [
      { id: 'r_far', name: 'Far Center', lat: 7.5, lng: 80.5, acceptedCategories: ['cooked'], capacity: 100 },
      { id: 'r_close_high_need', name: 'Nearby Shelter', lat: 6.93, lng: 79.86, acceptedCategories: ['cooked'], capacity: 50, currentNeed: 95, reliabilityRating: 5 },
      { id: 'r_close_low_need', name: 'Nearby Home', lat: 6.93, lng: 79.86, acceptedCategories: ['cooked'], capacity: 50, currentNeed: 20, reliabilityRating: 3 },
    ];

    const ranked = rankReceivers(listing, restaurant, receivers, now);
    expect(ranked[0].receiverId).toBe('r_close_high_need');
    expect(ranked[ranked.length - 1].exclusionReason).not.toBeNull();
  });
});

describe('Waste Strategy & Income Ladder', () => {
  it('applies discount steps dynamically based on remaining minutes', () => {
    // > 180 min -> 20%
    expect(calculateDiscount(200 * 60 * 1000)).toBe(0.20);
    // 90 - 180 min -> 40%
    expect(calculateDiscount(120 * 60 * 1000)).toBe(0.40);
    // 45 - 90 min -> 55%
    expect(calculateDiscount(60 * 60 * 1000)).toBe(0.55);
    // < 45 min -> 70%
    expect(calculateDiscount(20 * 60 * 1000)).toBe(0.70);
  });

  it('enforces price floor when calculating dynamic price', () => {
    const originalPrice = 1000;
    // 70% discount -> 300, price floor is 30% = 300
    expect(calculateDynamicPrice(originalPrice, 0.70)).toBe(300);
    // Even if discount were 80%, price cannot drop below 300
    expect(calculateDynamicPrice(originalPrice, 0.80)).toBe(300);
  });

  it('transitions ladder actions from sell -> donate -> recycle -> expired', () => {
    const baseNow = 1700000000000;

    // Remaining > 60 min -> sell
    expect(decideSurplusAction({ unsafeByTime: baseNow + 90 * 60000 }, baseNow)).toBe('sell');

    // Remaining 25..60 min -> donate
    expect(decideSurplusAction({ unsafeByTime: baseNow + 40 * 60000 }, baseNow)).toBe('donate');

    // Remaining 1..24 min -> recycle
    expect(decideSurplusAction({ unsafeByTime: baseNow + 15 * 60000 }, baseNow)).toBe('recycle');

    // Remaining <= 0 -> expired
    expect(decideSurplusAction({ unsafeByTime: baseNow - 5 * 60000 }, baseNow)).toBe('expired');
  });

  it('escalates offer after timeout threshold', () => {
    const offerSent = 1700000000000;
    // 5 min elapsed -> no escalation
    expect(shouldEscalateOffer(offerSent, offerSent + 5 * 60000)).toBe(false);
    // 10 min elapsed -> escalate!
    expect(shouldEscalateOffer(offerSent, offerSent + 10 * 60000)).toBe(true);
  });

  it('forecasts prep quantity with safety margins', () => {
    const history = [
      { dayOfWeek: 5, items: { 'Lamprais': { sold: 30 } } },
      { dayOfWeek: 5, items: { 'Lamprais': { sold: 30 } } },
    ];
    const forecast = forecastPrepQuantity(history, 'Lamprais', 5);
    expect(forecast.baselineAverage).toBe(30);
    expect(forecast.recommendedPrep).toBe(33); // 30 * 1.10
    expect(forecast.safetyFloor).toBe(29);      // 30 * 0.95
  });
});

describe('Impact Engine', () => {
  it('converts portions and kg correctly', () => {
    const portionCheck = normalizeFoodQuantity(25, 'portions');
    expect(portionCheck.meals).toBe(25);
    expect(portionCheck.kg).toBe(10); // 25 * 0.4 kg

    const kgCheck = normalizeFoodQuantity(20, 'kg');
    expect(kgCheck.kg).toBe(20);
    expect(kgCheck.meals).toBe(50); // 20 / 0.4 kg
  });

  it('computes avoided emissions based on 2.5 kg CO2e per kg food', () => {
    expect(calculateCO2e(10)).toBe(25.0);
  });

  it('aggregates total impact accurately', () => {
    const listings = [
      { id: '1', quantity: 20, unit: 'portions', status: 'sold', pricePerUnit: 500, discountPercent: 0.4 },
      { id: '2', quantity: 30, unit: 'portions', status: 'donated', costPerUnit: 300 },
    ];
    const total = calculateTotalImpact(listings, [{ confirmed: true }], [{ hoursLogged: 5 }]);
    expect(total.totalMeals).toBe(50);
    expect(total.totalKg).toBe(20);
    expect(total.totalCO2e).toBe(50);
    expect(total.totalMoneyRecovered).toBe(20 * 500 * 0.6 + 30 * 300);
    expect(total.completedHandovers).toBe(1);
    expect(total.volunteerHours).toBe(5);
  });
});

import { foodLoopReducer, ACTION_TYPES } from '../../context/reducer.js';

describe('Safety Guard: Expired Food Requests', () => {
  it('blocks accepting an expired food match in the state reducer', () => {
    const now = Date.now();
    const initialState = {
      simNow: now,
      listings: [
        {
          id: 'l-expired',
          foodName: 'Expired Curry',
          quantity: 20,
          unsafeByTime: now - 1000, // already expired!
          status: 'selling',
        },
      ],
      matches: [
        {
          id: 'm-expired',
          listingId: 'l-expired',
          status: 'pending',
        },
      ],
    };

    const action = {
      type: ACTION_TYPES.ACCEPT_MATCH,
      payload: { matchId: 'm-expired', receiverId: 'rec1', requestedQuantity: 10 },
    };

    const nextState = foodLoopReducer(initialState, action);
    // State must remain unchanged because expired food cannot be requested/accepted
    expect(nextState.matches[0].status).toBe('pending');
    expect(nextState.listings[0].status).toBe('selling');
  });

  it('correctly sells portions at discount, splits batch, and computes profit', () => {
    const initialState = {
      simNow: Date.now(),
      listings: [
        {
          id: 'l-surplus',
          foodName: 'Chicken Biryani',
          quantity: 20,
          costPerUnit: 400,
          pricePerUnit: 1000,
          discountPercent: 0.4,
          status: 'selling',
        },
      ],
    };

    // Sell 5 portions at 40% discount (LKR 600 per portion)
    const action = {
      type: ACTION_TYPES.SELL_PORTIONS,
      payload: {
        listingId: 'l-surplus',
        quantitySold: 5,
        salePricePerUnit: 600,
        discountPercent: 0.4,
      },
    };

    const nextState = foodLoopReducer(initialState, action);
    const active = nextState.listings.find((l) => l.id === 'l-surplus');
    const sold = nextState.listings.find((l) => l.status === 'sold');

    expect(active.quantity).toBe(15);
    expect(sold.quantity).toBe(5);
    expect(sold.saleAmount).toBe(3000); // 5 * 600
    expect(sold.netProfit).toBe(1000);   // 5 * (600 - 400)
  });
});

