# FoodLoop — Business Logic & Algorithm Specification 📐

This document specifies the exact mathematical formulas, thresholds, and state transition rules implemented in FoodLoop.

---

## 1. The Income Ladder State Machine

Every surplus listing is governed by its remaining safe shelf-life:

$$\Delta t = t_{\text{unsafe}} - t_{\text{now}}$$

Where:
- $t_{\text{unsafe}}$ is the absolute epoch timestamp (in milliseconds) after which food is legally and biologically unsafe for consumption.
- $t_{\text{now}}$ is the current simulation clock timestamp.

### 1.1 Decision Hierarchy (`decideSurplusAction`)

1. **EXPIRED** ($\Delta t \le 0$ minutes): Food is spoiled. No human consumption or animal feed permitted.
2. **RECYCLE** ($0 < \Delta t \le 24$ minutes):
   $$\text{Threshold} = \text{DONATION\_BUFFER\_MIN} \times \text{RECYCLE\_THRESHOLD\_RATIO} = 60 \times 0.40 = 24\text{ mins}$$
   Food cannot be reliably transported and distributed for human consumption in under 24 minutes; it is immediately directed to composting or animal feed.
3. **DONATE** ($24 < \Delta t \le 60$ minutes):
   Safe human consumption is possible, but commercial sales window has closed. Matched to recipient charity.
4. **SELL** ($\Delta t > 60$ minutes):
   Open for commercial last-hour discounted sales.

---

## 2. Dynamic Discount & Price Floor Math

During the **SELL** stage, the discount increases as the window shrinks to ensure inventory clearance before the 60-minute donation buffer is reached.

### 2.1 Discount Steps (`calculateDiscount`)
$$\text{Discount} = \begin{cases}
20\%, & \text{if } \Delta t \ge 180 \text{ mins} \\
40\%, & \text{if } 90 \le \Delta t < 180 \text{ mins} \\
55\%, & \text{if } 45 \le \Delta t < 90 \text{ mins} \\
70\%, & \text{if } \Delta t < 45 \text{ mins}
\end{cases}$$

### 2.2 Hard Price Floor Protection (`calculateDynamicPrice`)
To prevent predatory undercutting and protect brand equity, the platform enforces a 30% price floor:

$$\text{Price}_{\text{dynamic}} = \max\left(P_{\text{original}} \times (1 - \text{Discount}),\ P_{\text{original}} \times 0.30\right)$$

---

## 3. Matching Engine & Multi-Factor Scoring

### 3.1 Hard Safety & Eligibility Filters
A candidate receiver $R$ is immediately excluded with a recorded reason if any of the following fail:

1. **Time Margin Filter:**
   $$t_{\text{arrival}} = t_{\text{now}} + (d \times 4\text{ min/km} + 20\text{ min handling}) \times 60000$$
   $$\text{If } t_{\text{arrival}} > t_{\text{unsafe}} \implies \text{REJECT ("Cannot arrive before unsafe time")}$$
2. **Category Filter:**
   $$\text{If } \text{category} \notin R.\text{acceptedCategories} \implies \text{REJECT ("Category mismatch")}$$
3. **Capacity Filter:**
   $$\text{If } R.\text{capacity} < \text{Quantity} \times 0.50 \implies \text{REJECT ("Insufficient capacity")}$$

### 3.2 Normalized Scoring Formula (`scoreReceiver`)
For eligible receivers, each factor is normalized to the $[0, 1]$ interval:

- **Time Margin ($w = 0.30$):**
  $$\text{Margin} = \frac{t_{\text{unsafe}} - t_{\text{arrival}}}{t_{\text{unsafe}} - t_{\text{now}}}$$
- **Proximity ($w = 0.25$):**
  $$\text{Proximity} = \max\left(0,\ 1 - \frac{d}{30\text{ km}}\right)$$
- **Capacity Fit ($w = 0.20$):**
  $$\text{Fit} = \min\left(1,\ \frac{R.\text{capacity}}{\text{Quantity}}\right)$$
- **Current Need Urgency ($w = 0.15$):**
  $$\text{Need} = \frac{R.\text{currentNeed}}{100}$$
- **Reliability Rating ($w = 0.10$):**
  $$\text{Reliability} = \frac{R.\text{reliabilityRating}}{5.0}$$

**Composite Score ($0 \text{ to } 100$):**
$$\text{Score} = \text{round}\left(100 \times \sum_{i} w_i \cdot f_i\right)$$

---

## 4. Prevention Forecasting Model (`forecastPrepQuantity`)

$$\text{RecommendedPrep} = \text{round}(\text{AvgDailySold} \times 1.10)$$
$$\text{SafetyFloor} = \text{round}(\text{AvgDailySold} \times 0.95)$$

Where:
- $\text{AvgDailySold}$ is the historical average sales for the identical day-of-week.
- $1.10\times$ provides an adequate buffer for walk-ins without creating massive end-of-night waste.
- $0.95\times$ acts as the conservative safety threshold for low-traffic days.

---

## 5. Environmental & Social Impact Formulas (`impact.js`)

- **Meal Conversion:**
  - If unit is `kg`: $\text{Meals} = \text{round}(\text{kg} / 0.40)$
  - If unit is `portions` or `pieces`: $\text{Meals} = \text{Quantity}$, $\text{kg} = \text{Quantity} \times 0.40$
- **Avoided Carbon Emissions:**
  $$\text{CO}_2\text{e Avoided (kg)} = \text{kg Saved} \times 2.5\text{ kg CO}_2\text{e / kg}$$
  *(For bio-recycled compost/feed, an emission reduction factor of $70\%$ is applied).*
- **Financial Recovery:**
  - Sold items: $\text{Quantity} \times P_{\text{dynamic}}$
  - Donated items: $\text{Quantity} \times \text{CostPerUnit}$ (official tax deductible value basis).
