# FoodLoop — Build Plan

## 1. Repo Audit

### Existing files (branch: `shashira`)

| File | Status | Notes |
|------|--------|-------|
| `src/App.jsx` | **Extend** | Currently has flat routes + unused Vite boilerplate imports (`reactLogo`, `viteLogo`, `heroImg`). Will wrap in `FoodLoopProvider`, add role-protected routes. Remove unused imports. |
| `src/main.jsx` | **Keep** | Standard React entry. No changes needed. |
| `src/index.css` | **Extend** | Has Vite default tokens. Will import `tokens.css` and reset to FoodLoop design system. |
| `src/App.css` | **Replace** | Vite boilerplate styles. Replace with minimal app-layout CSS. |
| `src/pages/Home.jsx` | **Extend** | Has navbar, hero, how-it-works. Will add the income-ladder graphic, live counter, and three role entry buttons. Keep structure. |
| `src/pages/Home.css` | **Extend** | Add ladder section styles, counter styles, dark mode. |
| `src/pages/Login.jsx` | **Replace** | Placeholder only. Build role-picker with demo accounts. |
| `src/pages/RestaurantDashboard.jsx` | **Extend** | Has stat cards and food list from localStorage. Will integrate with FoodLoopContext, add money-recovered stats, ExpiryClock, ladder links. |
| `src/pages/Dashboard.css` | **Extend** | Keep existing styles, add new stat cards and urgency colors. |
| `src/pages/SurplusFood.jsx` | **Extend** | Has form with basic fields. Add: cost/price fields, unsafe-by time, templates, SafetyChecklist, integration with context. |
| `src/pages/SurplusFood.css` | **Extend** | Add checklist styles, template selector. |
| `src/pages/FoodListings.jsx` | **Extend** | Lists from localStorage. Integrate with context, add ExpiryClock and LadderTimeline per card. |
| `src/pages/FoodListings.css` | **Extend** | Add expiry/ladder styles. |
| `src/pages/ImpactDashboard.jsx` | **Replace** | Placeholder only. Build full dashboard with counters, charts, money-saved. |
| `src/assets/hero.png` | **Keep** | Used by original App.jsx (will be unused after cleanup). |
| `public/favicon.svg` | **Keep** | FoodLoop favicon. |
| `public/icons.svg` | **Keep** | SVG sprite. |

### Missing files (to create)

No `src/utils/`, `src/components/`, or `src/context/` directories exist.
No `matching.js`, `wasteStrategy.js`, or `MatchPanel.jsx` files exist — will implement from spec.

---

## 2. Data Model

### Listing
```js
{
  id: string,              // crypto.randomUUID()
  restaurantId: string,
  foodName: string,
  category: 'cooked' | 'bakery' | 'produce' | 'dairy' | 'dry_goods',
  quantity: number,
  unit: 'portions' | 'kg' | 'pieces' | 'litres',
  costPerUnit: number,     // LKR, what the restaurant paid
  pricePerUnit: number,    // LKR, original selling price
  unsafeByTime: number,    // timestamp (ms) — absolute expiry
  postedAt: number,        // timestamp (ms)
  status: 'selling' | 'donating' | 'recycling' | 'sold' | 'donated' | 'recycled' | 'expired',
  currentStep: 'sell' | 'donate' | 'recycle',
  discountPercent: number,
  safetyChecklist: {
    keptHotOrChilled: boolean,
    packedTime: string,
    allergens: string[],
    storageMethod: string
  },
  templateId: string | null,
  notes: string,
  matchId: string | null,
  volunteerId: string | null
}
```

### Restaurant
```js
{
  id: string,
  name: string,
  area: string,
  lat: number, lng: number,
  salesHistory: [ { date: string, dayOfWeek: number, items: { [foodName]: { prepared: number, sold: number } } } ]
}
```

### Receiver
```js
{
  id: string,
  name: string,
  type: 'childrens_home' | 'elders_home' | 'community_kitchen' | 'compost_feed',
  area: string,
  lat: number, lng: number,
  acceptedCategories: string[],
  capacity: number,        // max portions per pickup
  currentNeed: number,     // 0-100 urgency score
  reliabilityRating: number, // 0-5
  isRecycler: boolean
}
```

### Volunteer
```js
{
  id: string,
  name: string,
  area: string,
  lat: number, lng: number,
  reliabilityRating: number,
  hoursLogged: number,
  available: boolean
}
```

### Match
```js
{
  id: string,
  listingId: string,
  rankedReceivers: [
    { receiverId, score, breakdown: { timeMargin, proximity, capacityFit, currentNeed, reliability }, exclusionReason: null },
    { receiverId, score: null, breakdown: null, exclusionReason: 'Cannot arrive before unsafe time' }
  ],
  currentOfferIndex: number,
  offerSentAt: number,     // sim timestamp
  status: 'pending' | 'accepted' | 'declined' | 'escalated' | 'routed_to_recycling',
  acceptedBy: string | null,
  declinedReasons: [ { receiverId, reason } ]
}
```

### Handover
```js
{
  id: string,
  matchId: string,
  listingId: string,
  volunteerId: string,
  receiverId: string,
  claimedAt: number,
  pickedUpAt: number | null,
  deliveredAt: number | null,
  temperatureCheck: string | null,
  confirmed: boolean
}
```

---

## 3. File Plan (new/modified)

```
src/
├── styles/
│   └── tokens.css                    # Design tokens, dark mode
├── context/
│   ├── FoodLoopContext.jsx           # Provider + useReducer + BroadcastChannel
│   ├── reducer.js                    # All state transitions
│   ├── seed.js                       # Sri Lankan seed data
│   └── clock.js                      # Central demo clock with speed multiplier
├── utils/
│   ├── constants.js                  # All named constants from spec §4
│   ├── matching.js                   # Hard filters + weighted scoring
│   ├── wasteStrategy.js              # decideSurplusAction, discount steps, escalation
│   ├── impact.js                     # Meals, kg, CO2e, volunteer hours
│   └── format.js                     # Currency (LKR), time, distance formatters
├── components/
│   ├── AppLayout.jsx + .css          # Shared nav, RoleSwitcher in header
│   ├── RoleSwitcher.jsx + .css       # Quick role-change for demo
│   ├── ExpiryClock.jsx + .css        # Countdown green→amber→red
│   ├── ListingCard.jsx + .css        # Listing preview with expiry bar
│   ├── MatchPanel.jsx + .css         # Ranked receivers with score bars
│   ├── LadderTimeline.jsx + .css     # Sell→Donate→Recycle visual
│   ├── ImpactCounter.jsx + .css      # Animated number counter
│   ├── HandoverLog.jsx + .css        # Timestamped handover steps
│   ├── SafetyChecklist.jsx + .css    # Food safety form
│   ├── MapView.jsx + .css            # react-leaflet with fallback
│   └── StatCard.jsx + .css           # Reusable stat display
├── pages/
│   ├── Home.jsx / .css               # EXTEND
│   ├── Login.jsx / .css              # REPLACE → role picker
│   ├── restaurant/
│   │   ├── RestaurantDashboard.jsx   # NEW (evolves existing)
│   │   ├── PostSurplus.jsx           # NEW (evolves SurplusFood)
│   │   ├── ListingDetail.jsx         # NEW — ladder + match detail
│   │   ├── WasteReport.jsx           # NEW
│   │   └── DonationReceipt.jsx       # NEW — print-friendly
│   ├── receiver/
│   │   ├── ReceiverDashboard.jsx     # NEW
│   │   ├── IncomingOffers.jsx        # NEW
│   │   └── AcceptedHistory.jsx       # NEW
│   ├── volunteer/
│   │   ├── VolunteerDashboard.jsx    # NEW
│   │   ├── PickupBoard.jsx           # NEW
│   │   └── DeliveryConfirm.jsx       # NEW
│   ├── admin/
│   │   └── DemoControl.jsx           # NEW
│   ├── ImpactDashboard.jsx / .css    # REPLACE
│   └── MapPage.jsx                   # NEW — full-screen map
```

---

## 4. Constants (from spec §4, all in `utils/constants.js`)

```js
// Matching
ARRIVAL_RATE_MIN_PER_KM = 4
HANDLING_TIME_MIN = 20
MIN_CAPACITY_RATIO = 0.5

// Scoring weights (sum = 1.0)
WEIGHT_TIME_MARGIN = 0.30
WEIGHT_PROXIMITY = 0.25
WEIGHT_CAPACITY_FIT = 0.20
WEIGHT_CURRENT_NEED = 0.15
WEIGHT_RELIABILITY = 0.10

// Escalation
OFFER_TIMEOUT_SIM_MIN = 10
RECYCLE_THRESHOLD_RATIO = 0.40

// Discount steps
DISCOUNT_STEPS = [
  { minMinutes: 180, discount: 0.20 },
  { minMinutes: 90,  discount: 0.40 },
  { minMinutes: 45,  discount: 0.55 },
  { minMinutes: 0,   discount: 0.70 },
]
PRICE_FLOOR_RATIO = 0.30
DONATION_BUFFER_MIN = 60

// Prevention
PREP_MULTIPLIER = 1.10
PREP_SAFETY_MARGIN = 0.95

// Impact
KG_PER_MEAL = 0.4
CO2E_PER_KG = 2.5

// Demo clock
SPEED_OPTIONS = [1, 10, 60]
```

---

## 5. Build Phases

### Phase 1 — Foundation (context, seed, clock, routing, roles)
- [x] Create `styles/tokens.css` with FoodLoop design tokens + dark mode
- [x] Create `context/FoodLoopContext.jsx`, `reducer.js`, `seed.js`, `clock.js`
- [x] Create `utils/constants.js`, `utils/format.js`
- [x] Create `components/AppLayout.jsx`, `RoleSwitcher.jsx`
- [x] Rewrite `Login.jsx` as role picker
- [x] Update `App.jsx` with protected routes, context provider
- [x] Update `index.css` to import tokens
- [x] **Verify**: app loads, role selection works, seed data in context, clock ticking

### Phase 2 — Business Logic + Tests
- [x] Create `utils/matching.js` — hard filters + weighted scoring
- [x] Create `utils/wasteStrategy.js` — discount steps, decideSurplusAction, escalation
- [x] Create `utils/impact.js` — impact calculations
- [x] Install vitest, write tests for matching, discount, escalation, waste report
- [x] **Verify**: `npm test` passes (14/14 tests green)

### Phase 3 — Restaurant Screens
- [x] Create `ExpiryClock`, `ListingCard`, `LadderTimeline`, `SafetyChecklist`, `StatCard`
- [x] Create `pages/restaurant/RestaurantDashboard.jsx` (extends existing)
- [x] Create `pages/restaurant/PostSurplus.jsx` (extends existing SurplusFood)
- [x] Create `pages/restaurant/ListingDetail.jsx`, `WasteReport.jsx`, `DonationReceipt.jsx`
- [x] Wire up BroadcastChannel sync
- [x] **Verify**: post listing → dashboard → ladder animates

### Phase 4 — Receiver, Volunteer, Map
- [x] Create `MatchPanel`, `HandoverLog`, `MapView`
- [x] Create `pages/receiver/*`, `pages/volunteer/*`, `pages/MapPage.jsx`
- [x] Install `react-leaflet` and `leaflet`
- [x] **Verify**: multi-window demo works

### Phase 5 — Impact Dashboard, Admin, Backup Demo
- [x] Create full `ImpactDashboard.jsx` with animated counters + charts
- [x] Create `pages/admin/DemoControl.jsx`
- [x] Implement backup demo mode
- [x] **Verify**: full demo flow end-to-end

### Phase 6 — Polish
- [x] Accessibility audit (keyboard, focus, ARIA, contrast)
- [x] Responsive pass (mobile-first volunteer)
- [x] Dark mode polish
- [x] Write `README.md`, `DEMO_SCRIPT.md`, `BUSINESS_LOGIC.md`
- [x] Lint + build clean

### Phase 7 — User Production Requirements & Visual Beautification
- [x] **Real-Time Countdown**: Seconds visibly tick down every second across all cards, badges, and detail views.
- [x] **Courier Fair Payout & Choice Model**: Median market delivery fare calculation for Colombo routes; rider choice to earn cash payout or volunteer pro-bono.
- [x] **Live Order Tracking to NGO on Map**: Real-time animated courier scooter on polyline route with radar pulses and status overlays.
- [x] **Partial Quantity Requests**: NGO shelters can claim exact portion quantities needed; remaining units stay active on the network.
- [x] **Receiver Portal Stability**: Robust state handling and crash-proofing for receiver dashboard.
- [x] **Strict Food Safety Expiry**: Batches past unsafe deadline are automatically disabled and blocked from acceptance.
- [x] **Restaurant Profit via Discounted Flash Sales**: Direct selling with net profit computation (`+LKR profit`) above kitchen prep costs.
- [x] **Visual Beautification without Disturbing Clarity**: Embedded authentic food photography, community shelter dining, and electric courier imagery into Hero, Listing Cards, Impact Dashboard, Restaurant & Receiver Dashboards with glassmorphism and high-contrast typography.


---

## 6. Teammate Impact

| File | Change | Reason |
|------|--------|--------|
| `App.jsx` | Wrap in Provider, update routes | Required for context + role routing |
| `index.css` | Import tokens, remove Vite defaults | Design system alignment |
| `App.css` | Replace Vite boilerplate | No longer needed |
| `Home.jsx` | Add ladder section, counter, role buttons | Spec requirement |
| `RestaurantDashboard.jsx` | Integrate context (was localStorage) | Unified state |
| `SurplusFood.jsx` | Code evolves into PostSurplus.jsx, old file kept as redirect | Spec evolution |
| `FoodListings.jsx` | Integrate context, add expiry UI | Unified state |
| `ImpactDashboard.jsx` | Full rewrite | Was placeholder |
| `Login.jsx` | Full rewrite | Was placeholder |

Original page CSS files are extended, not replaced.

---

## 7. Dependencies to Install

```
react-leaflet leaflet recharts
vitest @testing-library/react @testing-library/jest-dom jsdom (dev)
```

No API keys. No external services. No backend.
