# FoodLoop — 3-Minute Live Hackathon Demo Script ⏱️🎤

> **Target Audience:** Hackathon Judges & Industry Panel  
> **Total Time:** 3 Minutes  
> **Key Hook:** *"FoodLoop makes restaurants money by wasting less, and whatever is left still feeds people."*

---

## 🛠️ Demo Setup (Before You Take the Stage)

Open two browser windows side-by-side:
- **Window 1 (Left):** `http://localhost:5173/restaurant` (Logged in as **The Cinnamon Grand**)
- **Window 2 (Right):** `http://localhost:5173/receiver` (Logged in as **Vajira Children's Home**)
- Optional Window 3 (or switch role): `/volunteer` (Logged in as **Kasun Perera - Courier**)

---

## 🎬 Minute-by-Minute Script

### Minute 0:00 – 0:45 | The Hook & The Restaurant Problem

**[Show Window 1 on Projector: Restaurant Dashboard]**

> *"Good afternoon judges. In Sri Lanka, commercial hotels and restaurants produce hundreds of tons of high-grade surplus buffet food daily. When the service ends at 10 PM, that food is in a race against the clock. If you rely on manual phone calls, by the time someone answers, the food has gone cold and unsafe for human consumption.*
>
> *Enter **FoodLoop**. FoodLoop stops food from reaching the landfill by guiding every batch down a sequential **Surplus Income Ladder**:*
> *1. Prevent via historical demand forecasts.*
> *2. Sell at a deepening last-hour discount above our price floor.*
> *3. Donate to matched charities.*
> *4. Recycle into compost or livestock feed if expired.*
>
> *Let's see this in action live right now."*

**[Action: Click "+ Post Surplus Batch" on Restaurant Dashboard]**
- Click the preset template: **"🍛 Dinner Buffet: Chicken Biryani (25 Portions)"**.
- Point out: Safe window is 3 hours; food safety checklist is verified.
- Click **"🚀 Post Surplus & Trigger Smart Match"**.

---

### Minute 0:45 – 1:45 | Smart Matching & Cross-Tab Automation

**[Show Listing Detail: The Income Ladder and Match Panel]**

> *"The moment I post, two things happen:*
> *First, it enters **Step 2: Dynamic Sell** — customers nearby see a flash sale, and the price drops as the countdown ticks.*
> *Second, our **Matching Engine** has already ranked nearby recipient homes based on travel time, category fit, capacity, hunger urgency, and reliability score.*
> *Notice that Rank #1 is **Vajira Children’s Home**, located 3.2 km away."*

**[Look over to Window 2 (Receiver Window)]**

> *"Watch Window 2 in real-time. Without refreshing the page, cross-tab synchronization triggers an urgent incoming donation notification for Vajira Children's Home!*
> *The matron sees the batch of 25 portions of Chicken Biryani with an active safety countdown.*
> *With one click, she clicks **'Accept Donation'**."*

**[Action: Click "Accept Donation" in Receiver Window]**
- Observe: Window 1 immediately updates status to **"Donating - Matched"**!

---

### Minute 1:45 – 2:30 | Volunteer Dispatch & Temperature Safety

**[Switch to /volunteer or use the Role Switcher in header to select Volunteer Courier]**

> *"Now that the donation is accepted, how does it get transported safely across Colombo?*
> *FoodLoop dispatches a mission to our registered volunteer couriers.*
> *Courier Kasun sees the pickup on his **Live Pickup Board** and claims the mission.*
> *When he arrives at Cinnamon Grand, FoodLoop enforces a digital chain of custody: he verifies the food is steaming hot above 60°C and taps **'Confirm Pickup'**.*
> *Upon arrival at the children's home, he taps **'Confirm Safe Handover'**."*

**[Action: Click Confirm Pickup $\to$ Confirm Safe Handover]**

---

### Minute 2:30 – 3:00 | Business Case, Tax Write-off & Grand Finale

**[Switch back to Restaurant Window $\to$ Click "📄 View Tax Deduction Receipt"]**

> *"Now back to the restaurant. Why do businesses adopt FoodLoop?*
> *Because every meal sold recovers cash, and every meal donated generates an **Official Tax Recovery Receipt** verifying the exact cost basis of food diverted for corporate tax deductions.*
> *Let's look at our **Live Impact Dashboard**.*
>
> *[Switch to `/impact`]*
>
> *Across Colombo today:*
> - **145+ meals rescued**,
> - **280+ kg of CO₂ emissions prevented** from rotting in Meethotamulla landfill,
> - and **over LKR 185,000 in economic value recaptured** for local businesses.
>
> *FoodLoop makes restaurants money by wasting less, and whatever is left still feeds people. Thank you!"*

---

## 💡 Judge Q&A Cheat Sheet

- **Q: What if the charity doesn't respond in time?**
  - **A:** FoodLoop's escalation algorithm automatically times out after 10 simulation minutes and cascades the offer to Rank #2. If the safe consumption window drops under 24 minutes, it automatically re-routes to bio-recycling partners for animal feed and compost so zero food ends in the garbage.
- **Q: How does FoodLoop prevent restaurants from selling spoiled food?**
  - **A:** Hard safety filters reject any match whose estimated courier transit time exceeds the `unsafeByTime` timestamp. Couriers must complete an on-site temperature verification (`>60°C` or `<5°C`) before custody transfer.
- **Q: What is the monetization model?**
  - **A:** FoodLoop takes a 10% commission on discounted flash sales (Step 2) and offers an enterprise B2B subscription for hotel chains for automated ESG & carbon reporting and food recovery tax certificates.
