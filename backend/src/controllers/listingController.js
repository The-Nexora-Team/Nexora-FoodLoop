import store from '../data/store.js';
import { rankReceivers } from '../services/matchingService.js';

export async function createListing(req, res) {
  try {
    const user = req.user;
    const {
      foodName,
      category,
      quantity,
      unit = 'portions',
      costPerUnit,
      pricePerUnit,
      hoursValid = 3,
      safetyChecklist = { keptHotOrChilled: true, cleanPackaging: true, allergens: [] },
      notes = '',
      autoMatch = true,
    } = req.body;

    if (!foodName || !category || !quantity || !costPerUnit || !pricePerUnit) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: foodName, category, quantity, costPerUnit, pricePerUnit',
      });
    }

    const restaurant = store.getRestaurantById(user.profileId) || {
      id: user.profileId || 'rest-001',
      name: user.name,
      lat: 6.9271,
      lng: 79.8612,
    };

    const now = Date.now();
    const unsafeByTime = now + Number(hoursValid) * 3600 * 1000;
    const listingId = 'list-' + Date.now();
    const matchId = 'match-' + Date.now();

    const newListing = {
      id: listingId,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      foodName,
      category,
      quantity: Number(quantity),
      remainingQuantity: Number(quantity),
      unit,
      costPerUnit: Number(costPerUnit),
      pricePerUnit: Number(pricePerUnit),
      currentPrice: Math.round(Number(pricePerUnit) * 0.8), // initial 20% discount
      discountPercent: 0.2,
      unsafeByTime,
      postedAt: now,
      status: 'selling',
      currentStep: 'sell',
      safetyChecklist,
      notes,
      matchId: autoMatch ? matchId : null,
      volunteerId: null,
    };

    let newMatch = null;
    if (autoMatch) {
      const receivers = store.getReceivers();
      const ranked = rankReceivers(newListing, restaurant, receivers, now);

      newMatch = {
        id: matchId,
        listingId,
        rankedReceivers: ranked,
        currentOfferIndex: 0,
        offerSentAt: now,
        status: ranked.length > 0 && !ranked[0].exclusionReason ? 'pending' : 'escalated',
        acceptedBy: null,
        declinedReasons: [],
      };

      store.addMatch(newMatch);
    }

    store.addListing(newListing);

    return res.status(201).json({
      success: true,
      message: 'Surplus food batch listed successfully!',
      listing: newListing,
      match: newMatch,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getListings(req, res) {
  try {
    const { status, role } = req.query;
    let listings = store.getListings();

    if (req.user && req.user.role === 'restaurant') {
      listings = listings.filter((l) => l.restaurantId === req.user.profileId);
    }

    if (status) {
      listings = listings.filter((l) => l.status === status);
    }

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getListingById(req, res) {
  try {
    const { id } = req.params;
    const listing = store.getListingById(id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const match = listing.matchId ? store.getMatchById(listing.matchId) : null;
    const handover = store.getHandovers().find((h) => h.listingId === id) || null;

    return res.status(200).json({
      success: true,
      listing,
      match,
      handover,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function sellPortions(req, res) {
  try {
    const { id } = req.params;
    const { portionsSold } = req.body;

    const listing = store.getListingById(id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const qtyToSell = Math.min(Number(portionsSold || 1), listing.remainingQuantity);
    const newRemaining = Math.max(0, listing.remainingQuantity - qtyToSell);
    const newStatus = newRemaining === 0 ? 'sold' : listing.status;

    const updated = store.updateListing(id, {
      remainingQuantity: newRemaining,
      status: newStatus,
    });

    return res.status(200).json({
      success: true,
      message: `${qtyToSell} portions sold.`,
      listing: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

