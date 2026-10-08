# FoodLoop Backend API 🍽️🔄🇱🇰

Backend REST API for the **Nexora FoodLoop** surplus-food rescue platform. Built with **Node.js (ES Modules)**, **Express**, and **MongoDB / Mongoose** architecture.

> **💡 Zero-Setup Ready**: The backend operates in a **Hybrid Mode**. If MongoDB is not running or no URI is provided, it operates seamlessly using a high-performance **In-Memory Store** preloaded with realistic Sri Lankan demo accounts and scenarios. When you're ready to connect MongoDB, just add `MONGODB_URI` in `.env`!

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment (Optional)
A `.env` file is already created:
```env
PORT=5000
JWT_SECRET=foodloop_super_secret_jwt_key_2026_srilanka
# Optional MongoDB URI:
# MONGODB_URI=mongodb://localhost:27017/foodloop
```

### 3. Run the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Or Production start
npm start
```

The server will start on `http://localhost:5000`.

---

## 🔑 Pre-Configured Demo Accounts

All demo accounts have password: `password123`

| Role | Name | Email |
| :--- | :--- | :--- |
| **Admin** | Nexora Platform Admin | `admin@foodloop.lk` |
| **Restaurant** | Colombo Kitchen | `colombo.kitchen@foodloop.lk` |
| **Restaurant** | Malabe Bake House | `malabe.bakehouse@foodloop.lk` |
| **Restaurant** | Kalutara Sea Breeze Café | `seabreeze.cafe@foodloop.lk` |
| **Receiver** | Sisu Diriya Children's Home | `sisudiriya@foodloop.lk` |
| **Receiver** | Senehasa Elders' Home | `senehasa@foodloop.lk` |
| **Receiver** | Hadana Community Kitchen | `hadana@foodloop.lk` |
| **Receiver** | GreenCycle Compost & Feed | `greencycle@foodloop.lk` |
| **Volunteer** | Kasun Perera | `kasun@foodloop.lk` |
| **Volunteer** | Nimali Fernando | `nimali@foodloop.lk` |
| **Volunteer** | Dinesh Jayawardena | `dinesh@foodloop.lk` |

---

## 📚 API Endpoints Reference

### 🔐 1. Authentication (`/api/auth`)
* `POST /api/auth/register` - Register a new user (`restaurant`, `receiver`, or `volunteer`) with organization/vehicle details. Returns JWT token.
* `POST /api/auth/login` - Authenticate with email & password. Returns JWT token.
* `GET /api/auth/me` - Get profile and details of current authenticated user (Requires `Authorization: Bearer <token>`).
* `GET /api/auth/demo-accounts` - Get list of preloaded demo accounts.

### ⚙️ 2. Platform Administration (`/api/admin`)
*(All Admin endpoints require `Authorization: Bearer <token>` with `role: admin`)*
* `GET /api/admin/stats` - Platform-wide statistics (registered organizations, active listings, meals rescued, CO₂e saved, money saved).
* `GET /api/admin/users?role=&status=&search=` - Filter, search, and list all users.
* `PATCH /api/admin/users/:id` - Update user status (`active` / `suspended`), verification status, or name.
* `DELETE /api/admin/users/:id` - Delete user account (protected against deleting root admin).
* `POST /api/admin/clock/speed` - Change simulation clock speed (`{ speed: 1 | 10 | 60 }`).
* `POST /api/admin/demo/trigger-scenario` - 1-Click backup pitch demo scenario trigger.
* `POST /api/admin/demo/reset` - Reset state back to clean initial seed data.
* `GET /api/admin/inspection` - Raw inspection of all listings, matches, and handovers.

### 📋 3. Surplus Listings (`/api/listings`)
* `GET /api/listings` - List surplus batches (filtered by user role).
* `GET /api/listings/:id` - Get single listing with matched receiver details.
* `POST /api/listings` - Post surplus batch (Restaurant/Admin only). Automatically runs algorithmic smart matching.
* `POST /api/listings/:id/sell` - Record sold portion at dynamic discounted price.

### 🤝 4. Smart Matches (`/api/matches`)
* `GET /api/matches` - List matches for receivers or platform.
* `POST /api/matches/:id/accept` - Receiver accepts donation match (queues for volunteer pickup).
* `POST /api/matches/:id/decline` - Receiver declines donation match (escalates to next receiver or bio-cycle).

### 🛵 5. Volunteer Handovers (`/api/handovers`)
* `GET /api/handovers` - List delivery missions.
* `POST /api/handovers/claim` - Volunteer claims a pickup mission.
* `PATCH /api/handovers/:id/pickup` - Confirm food pickup with digital temperature log ($>60^\circ\text{C}$ or $<5^\circ\text{C}$).
* `PATCH /api/handovers/:id/deliver` - Confirm safe delivery to recipient.

