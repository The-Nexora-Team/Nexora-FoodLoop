/* ============================================
   Seed Data — realistic Sri Lankan demo data
   ============================================ */

/**
 * Generates a complete seed state for FoodLoop demo.
 * All data is localized to Colombo / Malabe / Kalutara area.
 * Amounts are in LKR.
 */
export function generateSeedData() {
  const now = Date.now();

  const restaurants = [
    {
      id: 'rest-001',
      name: 'Colombo Kitchen',
      area: 'Colombo 07',
      lat: 6.9147,
      lng: 79.8624,
      templates: [
        { id: 'tpl-001', foodName: 'Rice & Curry Packets', category: 'cooked', quantity: 40, unit: 'portions', costPerUnit: 180, pricePerUnit: 350, notes: 'Usually 40 rice packets at 9 PM' },
        { id: 'tpl-002', foodName: 'Kottu Roti', category: 'cooked', quantity: 20, unit: 'portions', costPerUnit: 150, pricePerUnit: 400, notes: 'End of night kottu surplus' },
      ],
    },
    {
      id: 'rest-002',
      name: 'Malabe Bake House',
      area: 'Malabe',
      lat: 6.9023,
      lng: 79.9571,
      templates: [
        { id: 'tpl-003', foodName: 'Assorted Pastries', category: 'bakery', quantity: 30, unit: 'pieces', costPerUnit: 60, pricePerUnit: 120, notes: 'End of day pastry clearance' },
        { id: 'tpl-004', foodName: 'Bread Loaves', category: 'bakery', quantity: 15, unit: 'pieces', costPerUnit: 80, pricePerUnit: 150, notes: 'Unsold bread after 6 PM' },
      ],
    },
    {
      id: 'rest-003',
      name: 'Kalutara Sea Breeze Café',
      area: 'Kalutara South',
      lat: 6.5854,
      lng: 79.9607,
      templates: [
        { id: 'tpl-005', foodName: 'Seafood Platter', category: 'cooked', quantity: 10, unit: 'portions', costPerUnit: 300, pricePerUnit: 650, notes: 'Lunch service leftovers' },
        { id: 'tpl-006', foodName: 'Fresh Fruit Salad', category: 'produce', quantity: 12, unit: 'portions', costPerUnit: 100, pricePerUnit: 250, notes: 'Daily prepared fruits' },
      ],
    },
  ];

  const receivers = [
    {
      id: 'recv-001',
      name: 'Sisu Diriya Children\'s Home',
      type: 'childrens_home',
      area: 'Dehiwala',
      lat: 6.8563,
      lng: 79.8650,
      acceptedCategories: ['cooked', 'bakery', 'produce', 'dairy'],
      capacity: 50,
      currentNeed: 80,
      reliabilityRating: 4.5,
      isRecycler: false,
    },
    {
      id: 'recv-002',
      name: 'Senehasa Elders\' Home',
      type: 'elders_home',
      area: 'Nugegoda',
      lat: 6.8728,
      lng: 79.8882,
      acceptedCategories: ['cooked', 'bakery', 'dairy'],
      capacity: 35,
      currentNeed: 65,
      reliabilityRating: 4.2,
      isRecycler: false,
    },
    {
      id: 'recv-003',
      name: 'Hadana Community Kitchen',
      type: 'community_kitchen',
      area: 'Moratuwa',
      lat: 6.7736,
      lng: 79.8824,
      acceptedCategories: ['cooked', 'bakery', 'produce', 'dairy', 'dry_goods'],
      capacity: 80,
      currentNeed: 90,
      reliabilityRating: 4.8,
      isRecycler: false,
    },
    {
      id: 'recv-004',
      name: 'GreenCycle Compost & Feed',
      type: 'compost_feed',
      area: 'Kaduwela',
      lat: 6.9319,
      lng: 79.9833,
      acceptedCategories: ['cooked', 'bakery', 'produce', 'dairy', 'dry_goods'],
      capacity: 500,
      currentNeed: 40,
      reliabilityRating: 4.0,
      isRecycler: true,
    },
  ];

  const volunteers = [
    {
      id: 'vol-001',
      name: 'Kasun Perera',
      area: 'Colombo 05',
      lat: 6.8930,
      lng: 79.8602,
      reliabilityRating: 4.7,
      hoursLogged: 48,
      totalEarnings: 3850,
      proBonoRescues: 6,
      available: true,
    },
    {
      id: 'vol-002',
      name: 'Nimali Fernando',
      area: 'Malabe',
      lat: 6.9045,
      lng: 79.9560,
      reliabilityRating: 4.3,
      hoursLogged: 32,
      totalEarnings: 2400,
      proBonoRescues: 4,
      available: true,
    },
    {
      id: 'vol-003',
      name: 'Dinesh Jayawardena',
      area: 'Nugegoda',
      lat: 6.8720,
      lng: 79.8890,
      reliabilityRating: 4.9,
      hoursLogged: 96,
      totalEarnings: 7200,
      proBonoRescues: 12,
      available: true,
    },
    {
      id: 'vol-004',
      name: 'Amaya Silva',
      area: 'Moratuwa',
      lat: 6.7750,
      lng: 79.8810,
      reliabilityRating: 4.1,
      hoursLogged: 16,
      available: false,
    },
  ];

  // Generate 30 days of sales history for each restaurant
  const salesHistory = generateSalesHistory(restaurants, now);

  return {
    restaurants,
    receivers,
    volunteers,
    listings: [],
    matches: [],
    handovers: [],
    salesHistory,
    currentUser: null,
    simNow: now,
    speed: 1,
  };
}

/**
 * Generate 30 days of daily sales history for forecasting.
 * Each day: { date, dayOfWeek, restaurantId, items: { foodName: { prepared, sold } } }
 */
function generateSalesHistory(restaurants, now) {
  const history = [];
  const msPerDay = 86400000;

  for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
    const date = new Date(now - dayOffset * msPerDay);
    const dateStr = date.toISOString().slice(0, 10);
    const dayOfWeek = date.getDay(); // 0=Sun .. 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (const restaurant of restaurants) {
      const items = {};

      for (const tpl of restaurant.templates) {
        const basePrepared = tpl.quantity;
        // Vary by day: weekends are busier (+20%), weekdays are normal
        const dayMultiplier = isWeekend ? 1.2 : 1.0;
        // Add random variance ±15%
        const variance = 0.85 + Math.random() * 0.30;
        const prepared = Math.round(basePrepared * dayMultiplier * variance);
        // Sell 70-95% of what's prepared
        const sellRate = 0.70 + Math.random() * 0.25;
        const sold = Math.min(prepared, Math.round(prepared * sellRate));

        items[tpl.foodName] = { prepared, sold };
      }

      history.push({
        date: dateStr,
        dayOfWeek,
        restaurantId: restaurant.id,
        items,
      });
    }
  }

  return history;
}

/**
 * Demo accounts for role selection.
 */
export const DEMO_ACCOUNTS = [
  { id: 'rest-001', role: 'restaurant', name: 'Colombo Kitchen', subtitle: 'Restaurant · Colombo 07' },
  { id: 'rest-002', role: 'restaurant', name: 'Malabe Bake House', subtitle: 'Bakery · Malabe' },
  { id: 'rest-003', role: 'restaurant', name: 'Kalutara Sea Breeze Café', subtitle: 'Café · Kalutara South' },
  { id: 'recv-001', role: 'receiver', name: 'Sisu Diriya Children\'s Home', subtitle: 'Children\'s Home · Dehiwala' },
  { id: 'recv-002', role: 'receiver', name: 'Senehasa Elders\' Home', subtitle: 'Elders\' Home · Nugegoda' },
  { id: 'recv-003', role: 'receiver', name: 'Hadana Community Kitchen', subtitle: 'Community Kitchen · Moratuwa' },
  { id: 'recv-004', role: 'receiver', name: 'GreenCycle Compost & Feed', subtitle: 'Recycling · Kaduwela' },
  { id: 'vol-001', role: 'volunteer', name: 'Kasun Perera', subtitle: 'Volunteer · Colombo 05' },
  { id: 'vol-002', role: 'volunteer', name: 'Nimali Fernando', subtitle: 'Volunteer · Malabe' },
  { id: 'vol-003', role: 'volunteer', name: 'Dinesh Jayawardena', subtitle: 'Volunteer · Nugegoda' },
  { id: 'vol-004', role: 'volunteer', name: 'Amaya Silva', subtitle: 'Volunteer · Moratuwa' },
  { id: 'admin-001', role: 'admin', name: 'Demo Controller', subtitle: 'Admin · Full Access' },
];
