/* ============================================
   All named constants from the FoodLoop spec.
   Every number used in business logic lives here.
   ============================================ */

// ---- Matching (§4.1) ----
export const ARRIVAL_RATE_MIN_PER_KM = 4;
export const HANDLING_TIME_MIN = 20;
export const MIN_CAPACITY_RATIO = 0.5;

// ---- Scoring weights (§4.2, sum = 1.0) ----
export const WEIGHT_TIME_MARGIN = 0.30;
export const WEIGHT_PROXIMITY = 0.25;
export const WEIGHT_CAPACITY_FIT = 0.20;
export const WEIGHT_CURRENT_NEED = 0.15;
export const WEIGHT_RELIABILITY = 0.10;

// ---- Escalation (§4.3) ----
export const OFFER_TIMEOUT_SIM_MIN = 10;
export const RECYCLE_THRESHOLD_RATIO = 0.40;

// ---- Discount steps (§4.4) ----
// Sorted descending by minMinutes — first match wins.
export const DISCOUNT_STEPS = [
  { minMinutes: 180, discount: 0.20 },
  { minMinutes: 90,  discount: 0.40 },
  { minMinutes: 45,  discount: 0.55 },
  { minMinutes: 0,   discount: 0.70 },
];
export const PRICE_FLOOR_RATIO = 0.30;
export const DONATION_BUFFER_MIN = 60;

// ---- Prevention (§4.5) ----
export const PREP_MULTIPLIER = 1.10;
export const PREP_SAFETY_MARGIN = 0.95;

// ---- Impact (§4.7) ----
export const KG_PER_MEAL = 0.4;
export const CO2E_PER_KG = 2.5;

// ---- Demo clock (§3) ----
export const SPEED_OPTIONS = [1, 10, 60];
export const DEFAULT_SPEED = 1;
export const CLOCK_TICK_MS = 1000; // real-world interval between ticks

// ---- Food categories ----
export const FOOD_CATEGORIES = [
  { value: 'cooked',    label: 'Cooked Food' },
  { value: 'bakery',    label: 'Bakery' },
  { value: 'produce',   label: 'Fruits & Vegetables' },
  { value: 'dairy',     label: 'Dairy' },
  { value: 'dry_goods', label: 'Dry Goods' },
];

// ---- Units ----
export const UNITS = [
  { value: 'portions', label: 'Portions' },
  { value: 'kg',       label: 'KG' },
  { value: 'pieces',   label: 'Pieces' },
  { value: 'litres',   label: 'Litres' },
];

// ---- Roles ----
export const ROLES = {
  RESTAURANT: 'restaurant',
  RECEIVER:   'receiver',
  VOLUNTEER:  'volunteer',
  ADMIN:      'admin',
};

// ---- Listing statuses ----
export const LISTING_STATUS = {
  SELLING:   'selling',
  DONATING:  'donating',
  RECYCLING: 'recycling',
  SOLD:      'sold',
  DONATED:   'donated',
  RECYCLED:  'recycled',
  EXPIRED:   'expired',
};

// ---- Match statuses ----
export const MATCH_STATUS = {
  PENDING:             'pending',
  ACCEPTED:            'accepted',
  DECLINED:            'declined',
  ESCALATED:           'escalated',
  ROUTED_TO_RECYCLING: 'routed_to_recycling',
};

// ---- Max distance for scoring (km) ----
export const MAX_SCORE_DISTANCE_KM = 30;

// ---- Max reliability rating ----
export const MAX_RELIABILITY = 5;

// ---- Courier / Rider Compensation (Colombo Fair Median Market Rate) ----
export const BASE_DELIVERY_FEE_LKR = 220;
export const PER_KM_DELIVERY_FEE_LKR = 60;

