/* ============================================
   FoodLoop Environmental & Financial Impact Calculations
   ============================================ */

import { KG_PER_MEAL, CO2E_PER_KG, LISTING_STATUS } from './constants.js';

/**
 * Convert quantity and unit into equivalent meals and kg.
 * @param {number} quantity
 * @param {'portions' | 'kg' | 'pieces' | 'litres'} unit
 * @returns {{ meals: number, kg: number }}
 */
export function normalizeFoodQuantity(quantity, unit) {
  const qty = Number(quantity) || 0;
  if (unit === 'kg' || unit === 'litres') {
    const meals = Math.round(qty / KG_PER_MEAL);
    return { meals, kg: qty };
  }
  // Default to portions/pieces
  const kg = Number((qty * KG_PER_MEAL).toFixed(2));
  return { meals: Math.round(qty), kg };
}

/**
 * Calculate CO2 equivalent avoided for a given weight in kg.
 * @param {number} kg
 * @returns {number}
 */
export function calculateCO2e(kg) {
  return Number((kg * CO2E_PER_KG).toFixed(2));
}

/**
 * Calculate impact metrics for a single listing.
 * @param {object} listing
 * @returns {object}
 */
export function calculateListingImpact(listing) {
  const { meals, kg } = normalizeFoodQuantity(listing.quantity, listing.unit);
  const co2e = calculateCO2e(kg);

  let moneyRecovered = 0;
  const isResolved =
    listing.status === LISTING_STATUS.SOLD ||
    listing.status === LISTING_STATUS.DONATED ||
    listing.status === LISTING_STATUS.RECYCLED;

  if (listing.status === LISTING_STATUS.SOLD) {
    const discount = listing.discountPercent || 0.4;
    moneyRecovered = listing.quantity * listing.pricePerUnit * (1 - discount);
  } else if (listing.status === LISTING_STATUS.DONATED) {
    // Tax benefit / raw cost recovered
    moneyRecovered = listing.quantity * listing.costPerUnit;
  }

  return {
    meals: isResolved ? meals : 0,
    kg: isResolved ? kg : 0,
    co2e: isResolved ? co2e : 0,
    moneyRecovered: Math.round(moneyRecovered),
  };
}

/**
 * Calculate system-wide impact summary across all listings and handovers.
 * @param {Array<object>} listings
 * @param {Array<object>} handovers
 * @param {Array<object>} volunteers
 * @returns {object}
 */
export function calculateTotalImpact(listings = [], handovers = [], volunteers = []) {
  let totalMeals = 0;
  let totalKg = 0;
  let totalCO2e = 0;
  let totalMoneyRecovered = 0;
  let totalSoldMeals = 0;
  let totalDonatedMeals = 0;
  let totalRecycledMeals = 0;

  for (const listing of listings) {
    const { meals, kg } = normalizeFoodQuantity(listing.quantity, listing.unit);
    const co2e = calculateCO2e(kg);

    if (listing.status === LISTING_STATUS.SOLD) {
      totalMeals += meals;
      totalSoldMeals += meals;
      totalKg += kg;
      totalCO2e += co2e;
      const discount = listing.discountPercent || 0.4;
      totalMoneyRecovered += listing.quantity * listing.pricePerUnit * (1 - discount);
    } else if (listing.status === LISTING_STATUS.DONATED) {
      totalMeals += meals;
      totalDonatedMeals += meals;
      totalKg += kg;
      totalCO2e += co2e;
      totalMoneyRecovered += listing.quantity * listing.costPerUnit;
    } else if (listing.status === LISTING_STATUS.RECYCLED) {
      totalRecycledMeals += meals;
      totalKg += kg;
      totalCO2e += co2e * 0.7; // 70% emission reduction via composting/feed
    }
  }

  const completedHandovers = handovers.filter((h) => h.confirmed).length;
  const volunteerHours = volunteers.reduce((acc, v) => acc + (v.hoursLogged || 0), 0);

  return {
    totalMeals,
    totalSoldMeals,
    totalDonatedMeals,
    totalRecycledMeals,
    totalKg: Number(totalKg.toFixed(1)),
    totalCO2e: Number(totalCO2e.toFixed(1)),
    totalMoneyRecovered: Math.round(totalMoneyRecovered),
    completedHandovers,
    volunteerHours,
  };
}
