# FoodLoop 🔄🇱🇰
> *"FoodLoop makes restaurants money by wasting less, and whatever is left still feeds people."*

FoodLoop is a time-critical surplus-food platform engineered for hotels, restaurants, cafes, bakeries, and caterers in Sri Lanka. It stops edible food from reaching landfills by guiding every surplus batch down a sequential **Income Ladder** before safety expires.

---

## 🌟 The Income Ladder

Surplus food degrades by the hour. FoodLoop maximizes economic value and social good at each stage:

1. **Prevent**: AI prep recommendation derived from historical sales data ($1.10\times$ multiplier with a $0.95\times$ safety floor) to prevent surplus before cooking.
2. **Dynamic Sell**: Last-hour flash sales with deepening discounts (20% $\to$ 40% $\to$ 55% $\to$ 70%) anchored above the restaurant's price floor ($30\%$).
3. **Smart Match**: Algorithmic matching to verified children's homes, elders' homes, and community kitchens based on time margin, travel distance, capacity, urgency, and reliability.
4. **Bio-Cycle (Recycle)**: When food is unconsumable for humans, it is automatically routed to livestock feed and composting partners.

---

## 👥 Personas & Roles

FoodLoop provides dedicated dashboards for every participant in the ecosystem:

- **🍽️ Restaurant / Caterer**: Post surplus batches in 30 seconds, view live dynamic countdown clocks, monitor money recovered, and generate print-ready tax deduction receipts.
- **🏠 Receiver (Shelters / Homes)**: Real-time alerts for matched hot food donations, capacity and urgency control, and one-click acceptance or decline.
- **🛵 Volunteer Courier**: Live pickup mission board, digital temperature verification at restaurant handover ($>60^\circ\text{C}$ / $<5^\circ\text{C}$), and safe delivery confirmation.
- **⚙️ Hackathon Admin**: Central simulation clock control ($1\times$, $10\times$, $60\times$) and one-click seed data reset.

---

## ⚡ Key Technical Features

- **Central Demo Clock (`clock.js`)**: Simulates accelerated time with $1\times$, $10\times$, and $60\times$ speed multipliers to demonstrate real-time ladder transitions.
- **Cross-Tab Real-Time Sync**: Synchronizes state instantly across multiple browser windows via `BroadcastChannel` (with fallback to `localStorage` storage events).
- **Matching Engine (`matching.js`)**: Multi-factor scoring ($0\text{--}100$) enforcing 3 hard filters (Time window, Category compatibility, Minimum capacity ratio) and 5 weighted scoring factors.
- **Comprehensive Impact Analytics (`impact.js`)**: Real-time calculations of meals rescued, CO₂e averted ($2.5\text{ kg CO}_2\text{e/kg}$), financial value recovered, and volunteer hours.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/The-Nexora-Team/Nexora-FoodLoop.git
cd Nexora-FoodLoop

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

### Running Tests
```bash
npm test
```
The test suite validates the matching engine, dynamic pricing floor, ladder transitions, escalation timeouts, and impact calculations.

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AppLayout.jsx    # Sticky navigation with role switcher & demo clock
│   ├── RoleSwitcher.jsx # Instant role switching modal
│   ├── ExpiryClock.jsx  # Green → Amber → Red urgency countdown badge
│   ├── LadderTimeline.jsx # Visual income ladder node progression
│   ├── ListingCard.jsx  # Surplus batch card with dynamic pricing
│   ├── MatchPanel.jsx   # Multi-factor score breakdown and escalation controls
│   ├── HandoverLog.jsx  # Chain-of-custody verification
│   ├── SafetyChecklist.jsx # Food safety and allergen checklist
│   ├── StatCard.jsx     # Reusable dashboard metric card
│   └── ImpactCounter.jsx# Smooth animated number counter
├── context/
│   ├── FoodLoopContext.jsx # Provider with BroadcastChannel sync
│   ├── reducer.js       # Pure state transitions
│   ├── seed.js          # Sri Lankan demo seed data (Colombo 01-07)
│   └── clock.js         # Central demo simulation clock
├── pages/
│   ├── Home.jsx         # Landing page with ladder graphic & impact counters
│   ├── Login.jsx        # One-click demo role selector
│   ├── restaurant/      # Dashboard, PostSurplus, ListingDetail, WasteReport, DonationReceipt
│   ├── receiver/        # Dashboard, IncomingOffers, AcceptedHistory
│   ├── volunteer/       # Dashboard, PickupBoard, DeliveryConfirm
│   ├── admin/           # DemoControl (speed multipliers & seed reset)
│   ├── ImpactDashboard.jsx # Environmental & financial metrics with Recharts
│   └── MapPage.jsx      # Geo rescue network map
├── utils/
│   ├── constants.js     # Exact constants and weights from spec
│   ├── matching.js      # Hard filters and weighted scoring engine
│   ├── wasteStrategy.js # Dynamic discount, price floor, ladder decision, prep forecast
│   ├── impact.js        # CO2e, meal conversion, and money recovery math
│   └── format.js        # Currency (LKR), duration, and distance formatters
└── styles/
    └── tokens.css       # FoodLoop design tokens & accessible dark mode
```

---

## 🏆 Hackathon Demo Resources

- **`DEMO_SCRIPT.md`**: Word-for-word 3-minute hackathon pitch script with exact multi-window walkthrough.
- **`BUSINESS_LOGIC.md`**: Mathematical breakdown of all algorithms and decision rules.

---
© 2026 The Nexora Team. Built for the University Hackathon Demo.
