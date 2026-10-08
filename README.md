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
Nexora-FoodLoop/
├── frontend/                     # All Frontend React 19 + Vite code
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/                # Dashboards, Login (with eye toggle), Admin
│   │   ├── services/api.js       # Frontend API client
│   │   └── utils/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                      # Express + MongoDB/Hybrid Backend
│   ├── src/
│   │   ├── config/db.js          # Non-blocking MongoDB / In-memory connection
│   │   ├── controllers/          # Auth, Admin, Listings, Matches, Handovers
│   │   ├── data/store.js         # Preloaded Sri Lankan demo data store
│   │   ├── middleware/auth.js    # JWT & RBAC role guards
│   │   ├── models/               # Mongoose models (User, Listing, Match, etc.)
│   │   ├── routes/               # REST API endpoints
│   │   ├── services/             # Matching engine (haversine + weighted scoring)
│   │   └── server.js             # Server entry point (Port 5000)
│   ├── .env
│   ├── package.json
│   └── README.md
│
└── package.json                  # Root monorepo orchestrator
```

---

## 🏆 Hackathon Demo Resources

- **`DEMO_SCRIPT.md`**: Word-for-word 3-minute hackathon pitch script with exact multi-window walkthrough.
- **`BUSINESS_LOGIC.md`**: Mathematical breakdown of all algorithms and decision rules.

---
© 2026 The Nexora Team. Built for the University Hackathon Demo.
