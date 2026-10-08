import bcrypt from 'bcryptjs';

// Precomputed bcrypt hash for 'password123' to make instant startup lightning fast
const DEMO_PASSWORD_HASH = bcrypt.hashSync('password123', 8);

export function createInitialData() {
  const now = Date.now();

  const users = [
    {
      id: 'usr-admin-001',
      name: 'Nexora Platform Admin',
      email: 'admin@foodloop.lk',
      password: DEMO_PASSWORD_HASH,
      role: 'admin',
      profileId: 'admin-001',
      status: 'active',
      isVerified: true,
      createdAt: new Date(now - 86400000 * 30).toISOString(),
    },
    // Restaurants
    {
      id: 'usr-rest-001',
      name: 'Colombo Kitchen',
      email: 'colombo.kitchen@foodloop.lk',
      password: DEMO_PASSWORD_HASH,
      role: 'restaurant',
      profileId: 'rest-001',
      status: 'active',
      isVerified: true,
      createdAt: new Date(now - 86400000 * 20).toISOString(),
    },
    {
      id: 'usr-rest-002',
      name: 'Malabe Bake House',
      email: 'malabe.bakehouse@foodloop.lk',
      password: DEMO_PASSWORD_HASH,
      role: 'restaurant',
      profileId: 'rest-002',
      status: 'active',
      isVerified: true,
      createdAt: new Date(now - 86400000 * 15).toISOString(),
    },
    {
      id: 'usr-rest-003',
      name: 'Kalutara Sea Breeze Café',
      email: 'seabreeze.cafe@foodloop.lk',
      password: DEMO_PASSWORD_HASH,
      role: 'restaurant',
      profileId: 'rest-003',
      status: 'active',
      isVerified: true,
      createdAt: new Date(now - 86400000 * 10).toISOString(),
    },
    // Receivers
    {
      id: 'usr-recv-001',
      name: "Sisu Diriya Children's Home",
      email: 'sisudiriya@foodloop.lk',
      password: DEMO_PASSWORD_HASH,
      role: 'receiver',
      profileId: 'recv-001',
      status: 'active',
      isVerified: true,
      createdAt: new Date(now - 86400000 * 25).toISOString(),
    },
    {
      id: 'usr-recv-002',
      name: "Senehasa Elders' Home",
      email: 'senehasa@foodloop.lk',
      password: DEMO_PASSWORD_HASH,
      role: 'receiver',
      profileId: 'recv-002',
      status: 'active',
      isVerified: true,
      createdAt: new Date(now - 86400000 * 18).toISOString(),
    },
    {
      id: 'usr-recv-003',
      name: 'Hadana Community Kitchen',
      email: 'hadana@foodloop.lk',
      password: DEMO_PASSWORD_HASH,
      role: 'receiver',
      profileId: 'recv-003',
      status: 'active',
      isVerified: true,
      createdAt: new Date(now - 86400000 * 12).toISOString(),
    },
    {
      id: 'usr-recv-004',
      name: 'GreenCycle Compost & Feed',
      email: 'greencycle@foodloop.lk',
      password: DEMO_PASSWORD_HASH,
      role: 'receiver',
      profileId: 'recv-004',
      status: 'active',
      isVerified: true,
      createdAt: new Date(now - 86400000 * 8).toISOString(),
    },
    // Volunteers
    {
      id: 'usr-vol-001',
      name: 'Kasun Perera',
      email: 'kasun@foodloop.lk',
      password: DEMO_PASSWORD_HASH,
      role: 'volunteer',
      profileId: 'vol-001',
      status: 'active',
      isVerified: true,
      createdAt: new Date(now - 86400000 * 22).toISOString(),
    },
    {
      id: 'usr-vol-002',
      name: 'Nimali Fernando',
      email: 'nimali@foodloop.lk',
      password: DEMO_PASSWORD_HASH,
      role: 'volunteer',
      profileId: 'vol-002',
      status: 'active',
      isVerified: true,
      createdAt: new Date(now - 86400000 * 14).toISOString(),
    },
    {
      id: 'usr-vol-003',
      name: 'Dinesh Jayawardena',
      email: 'dinesh@foodloop.lk',
      password: DEMO_PASSWORD_HASH,
      role: 'volunteer',
      profileId: 'vol-003',
      status: 'active',
      isVerified: true,
      createdAt: new Date(now - 86400000 * 11).toISOString(),
    },
    {
      id: 'usr-vol-004',
      name: 'Amaya Silva',
      email: 'amaya@foodloop.lk',
      password: DEMO_PASSWORD_HASH,
      role: 'volunteer',
      profileId: 'vol-004',
      status: 'active',
      isVerified: true,
      createdAt: new Date(now - 86400000 * 5).toISOString(),
    },
  ];

  const restaurants = [
    {
      id: 'rest-001',
      userId: 'usr-rest-001',
      name: 'Colombo Kitchen',
      area: 'Colombo 07',
      cuisine: 'Traditional Sri Lankan Buffet',
      lat: 6.9147,
      lng: 79.8624,
      templates: [
        { id: 'tpl-001', foodName: 'Rice & Curry Packets', category: 'cooked', quantity: 40, unit: 'portions', costPerUnit: 180, pricePerUnit: 350, notes: 'Usually 40 rice packets at 9 PM' },
        { id: 'tpl-002', foodName: 'Kottu Roti', category: 'cooked', quantity: 20, unit: 'portions', costPerUnit: 150, pricePerUnit: 400, notes: 'End of night kottu surplus' },
      ],
    },
    {
      id: 'rest-002',
      userId: 'usr-rest-002',
      name: 'Malabe Bake House',
      area: 'Malabe',
      cuisine: 'Artisan Bakes & Savouries',
      lat: 6.9023,
      lng: 79.9571,
      templates: [
        { id: 'tpl-003', foodName: 'Assorted Pastries', category: 'bakery', quantity: 30, unit: 'pieces', costPerUnit: 60, pricePerUnit: 120, notes: 'End of day pastry clearance' },
        { id: 'tpl-004', foodName: 'Bread Loaves', category: 'bakery', quantity: 15, unit: 'pieces', costPerUnit: 80, pricePerUnit: 150, notes: 'Unsold bread after 6 PM' },
      ],
    },
    {
      id: 'rest-003',
      userId: 'usr-rest-003',
      name: 'Kalutara Sea Breeze Café',
      area: 'Kalutara South',
      cuisine: 'Seafood & Western Short Eats',
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
      userId: 'usr-recv-001',
      name: "Sisu Diriya Children's Home",
      type: 'childrens_home',
      area: 'Dehiwala',
      lat: 6.8563,
      lng: 79.865,
      acceptedCategories: ['cooked', 'bakery', 'produce', 'dairy'],
      capacity: 50,
      currentNeed: 80,
      reliabilityRating: 4.5,
      isRecycler: false,
    },
    {
      id: 'recv-002',
      userId: 'usr-recv-002',
      name: "Senehasa Elders' Home",
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
      userId: 'usr-recv-003',
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
      userId: 'usr-recv-004',
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
      userId: 'usr-vol-001',
      name: 'Kasun Perera',
      vehicle: 'Motorbike / Courier Bag',
      area: 'Colombo 05',
      phone: '077 123 4567',
      lat: 6.893,
      lng: 79.8602,
      reliabilityRating: 4.7,
      hoursLogged: 48,
      totalEarnings: 3850,
      proBonoRescues: 6,
      available: true,
    },
    {
      id: 'vol-002',
      userId: 'usr-vol-002',
      name: 'Nimali Fernando',
      vehicle: 'Scooter / Insulated Box',
      area: 'Malabe',
      phone: '071 987 6543',
      lat: 6.9045,
      lng: 79.956,
      reliabilityRating: 4.3,
      hoursLogged: 32,
      totalEarnings: 2400,
      proBonoRescues: 4,
      available: true,
    },
    {
      id: 'vol-003',
      userId: 'usr-vol-003',
      name: 'Dinesh Jayawardena',
      vehicle: 'Three-Wheeler / Van',
      area: 'Nugegoda',
      phone: '075 555 4321',
      lat: 6.872,
      lng: 79.889,
      reliabilityRating: 4.9,
      hoursLogged: 96,
      totalEarnings: 7200,
      proBonoRescues: 12,
      available: true,
    },
    {
      id: 'vol-004',
      userId: 'usr-vol-004',
      name: 'Amaya Silva',
      vehicle: 'Bicycle / Backpack',
      area: 'Moratuwa',
      phone: '076 444 8888',
      lat: 6.775,
      lng: 79.881,
      reliabilityRating: 4.1,
      hoursLogged: 16,
      totalEarnings: 1200,
      proBonoRescues: 2,
      available: false,
    },
  ];

  return {
    users,
    restaurants,
    receivers,
    volunteers,
    listings: [],
    matches: [],
    handovers: [],
    clockSpeed: 1,
    simTime: now,
  };
}

class InMemoryDataStore {
  constructor() {
    this.data = createInitialData();
  }

  // --- Users ---
  findUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(userData) {
    const newUser = {
      id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      status: 'active',
      isVerified: true,
      createdAt: new Date().toISOString(),
      ...userData,
    };
    this.data.users.push(newUser);
    return newUser;
  }

  getAllUsers() {
    return this.data.users.map(({ password, ...safeUser }) => safeUser);
  }

  updateUser(id, updates) {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    const { password, ...safeUser } = this.data.users[index];
    return safeUser;
  }

  deleteUser(id) {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.data.users.splice(index, 1);
    return true;
  }

  // --- Restaurants ---
  getRestaurants() {
    return this.data.restaurants;
  }

  getRestaurantById(id) {
    return this.data.restaurants.find((r) => r.id === id || r.userId === id);
  }

  addRestaurant(restaurant) {
    this.data.restaurants.push(restaurant);
    return restaurant;
  }

  // --- Receivers ---
  getReceivers() {
    return this.data.receivers;
  }

  getReceiverById(id) {
    return this.data.receivers.find((r) => r.id === id || r.userId === id);
  }

  addReceiver(receiver) {
    this.data.receivers.push(receiver);
    return receiver;
  }

  // --- Volunteers ---
  getVolunteers() {
    return this.data.volunteers;
  }

  getVolunteerById(id) {
    return this.data.volunteers.find((v) => v.id === id || v.userId === id);
  }

  addVolunteer(volunteer) {
    this.data.volunteers.push(volunteer);
    return volunteer;
  }

  // --- Listings ---
  getListings() {
    return this.data.listings;
  }

  getListingById(id) {
    return this.data.listings.find((l) => l.id === id);
  }

  addListing(listing) {
    this.data.listings.unshift(listing);
    return listing;
  }

  updateListing(id, updates) {
    const index = this.data.listings.findIndex((l) => l.id === id);
    if (index === -1) return null;
    this.data.listings[index] = { ...this.data.listings[index], ...updates };
    return this.data.listings[index];
  }

  // --- Matches ---
  getMatches() {
    return this.data.matches;
  }

  getMatchById(id) {
    return this.data.matches.find((m) => m.id === id);
  }

  addMatch(match) {
    this.data.matches.unshift(match);
    return match;
  }

  updateMatch(id, updates) {
    const index = this.data.matches.findIndex((m) => m.id === id);
    if (index === -1) return null;
    this.data.matches[index] = { ...this.data.matches[index], ...updates };
    return this.data.matches[index];
  }

  // --- Handovers ---
  getHandovers() {
    return this.data.handovers;
  }

  getHandoverById(id) {
    return this.data.handovers.find((h) => h.id === id);
  }

  addHandover(handover) {
    this.data.handovers.unshift(handover);
    return handover;
  }

  updateHandover(id, updates) {
    const index = this.data.handovers.findIndex((h) => h.id === id);
    if (index === -1) return null;
    this.data.handovers[index] = { ...this.data.handovers[index], ...updates };
    return this.data.handovers[index];
  }

  // --- Admin & Simulation ---
  resetStore() {
    this.data = createInitialData();
    return true;
  }

  setClockSpeed(speed) {
    this.data.clockSpeed = Number(speed);
    return this.data.clockSpeed;
  }

  getClockSpeed() {
    return this.data.clockSpeed;
  }

  triggerBackupDemoScenario() {
    const now = Date.now();
    const listingId = 'demo-biryani-' + now;
    const matchId = 'demo-match-' + now;
    const handoverId = 'demo-handover-' + now;

    const listing = {
      id: listingId,
      restaurantId: 'rest-001',
      restaurantName: 'Colombo Kitchen',
      foodName: 'Dum Biryani with Boiled Eggs & Gravy',
      category: 'cooked',
      quantity: 25,
      remainingQuantity: 0,
      unit: 'portions',
      costPerUnit: 450,
      pricePerUnit: 1200,
      currentPrice: 360,
      unsafeByTime: now + 3 * 3600 * 1000,
      postedAt: now,
      status: 'donated',
      currentStep: 'donate',
      discountPercent: 0.7,
      safetyChecklist: { keptHotOrChilled: true, cleanPackaging: true, allergens: ['Eggs'] },
      notes: 'Prepared in thermal containers. Handover temperature verified at 68°C.',
      matchId,
      volunteerId: 'vol-001',
    };

    const match = {
      id: matchId,
      listingId,
      rankedReceivers: [
        {
          receiverId: 'recv-001',
          receiverName: "Sisu Diriya Children's Home",
          receiverType: 'childrens_home',
          score: 94,
          distanceKm: 3.2,
          estimatedTravelMin: 33,
          exclusionReason: null,
          breakdown: { timeMargin: 0.88, proximity: 0.92, capacityFit: 1.0, currentNeed: 0.85, reliability: 0.95 },
        },
      ],
      currentOfferIndex: 0,
      offerSentAt: now,
      status: 'accepted',
      acceptedBy: 'recv-001',
      declinedReasons: [],
    };

    const handover = {
      id: handoverId,
      matchId,
      listingId,
      volunteerId: 'vol-001',
      receiverId: 'recv-001',
      claimedAt: now + 5 * 60000,
      pickedUpAt: now + 18 * 60000,
      deliveredAt: now + 38 * 60000,
      temperatureCheck: 'Hot (>60°C)',
      deliveryNotes: 'Safe handover completed. Thermal insulated bags used.',
      confirmed: true,
      deliveryFeeLKR: 412,
    };

    this.addListing(listing);
    this.addMatch(match);
    this.addHandover(handover);

    return { listing, match, handover };
  }

  getAdminStats() {
    const totalUsers = this.data.users.length;
    const totalRestaurants = this.data.restaurants.length;
    const totalReceivers = this.data.receivers.length;
    const totalVolunteers = this.data.volunteers.length;
    const totalListings = this.data.listings.length;
    const totalMatches = this.data.matches.length;
    const totalHandovers = this.data.handovers.length;

    // Calculate impact metrics
    const completedListings = this.data.listings.filter(
      (l) => l.status === 'donated' || l.status === 'sold'
    );
    const mealsRescued = completedListings.reduce((sum, l) => sum + (l.quantity || 0), 0);
    const co2SavedKg = Math.round(mealsRescued * 0.4 * 2.5);
    const moneySavedLKR = completedListings.reduce(
      (sum, l) => sum + (l.quantity || 0) * (l.costPerUnit || 200),
      0
    );

    return {
      users: {
        total: totalUsers,
        restaurants: totalRestaurants,
        receivers: totalReceivers,
        volunteers: totalVolunteers,
        admins: this.data.users.filter((u) => u.role === 'admin').length,
      },
      operations: {
        totalListings,
        activeListings: this.data.listings.filter((l) => l.status === 'selling' || l.status === 'donating').length,
        totalMatches,
        totalHandovers,
        completedDeliveries: this.data.handovers.filter((h) => h.confirmed).length,
      },
      impact: {
        mealsRescued,
        co2SavedKg,
        moneySavedLKR,
      },
      system: {
        clockSpeed: this.data.clockSpeed,
        serverTime: Date.now(),
        dbMode: 'hybrid_in_memory',
      },
    };
  }
}

export const store = new InMemoryDataStore();
export default store;

