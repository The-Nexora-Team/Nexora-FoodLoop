import store from '../data/store.js';

export async function getHandovers(req, res) {
  try {
    const user = req.user;
    let handovers = store.getHandovers();

    if (user.role === 'volunteer') {
      handovers = handovers.filter(
        (h) => h.volunteerId === user.profileId || !h.volunteerId
      );
    }

    const enriched = handovers.map((h) => {
      const listing = store.getListingById(h.listingId);
      const receiver = store.getReceiverById(h.receiverId);
      const restaurant = listing ? store.getRestaurantById(listing.restaurantId) : null;
      return { ...h, listing, receiver, restaurant };
    });

    return res.status(200).json({
      success: true,
      count: enriched.length,
      handovers: enriched,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function claimPickup(req, res) {
  try {
    const { matchId } = req.body;
    const user = req.user;

    const match = store.getMatchById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const volunteerId = user.profileId || 'vol-001';
    const handoverId = 'handover-' + Date.now();

    const handover = {
      id: handoverId,
      matchId,
      listingId: match.listingId,
      volunteerId,
      receiverId: match.acceptedBy || (match.rankedReceivers[0] && match.rankedReceivers[0].receiverId),
      claimedAt: Date.now(),
      pickedUpAt: null,
      deliveredAt: null,
      temperatureCheck: null,
      deliveryNotes: '',
      confirmed: false,
      deliveryFeeLKR: 340, // Base LKR 220 + distance fee
    };

    store.addHandover(handover);
    store.updateListing(match.listingId, { volunteerId });

    return res.status(201).json({
      success: true,
      message: 'Rescue mission claimed! Please proceed to restaurant for pickup.',
      handover,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function confirmPickup(req, res) {
  try {
    const { id } = req.params;
    const { temperatureCheck = 'Hot (>60°C)' } = req.body;

    const handover = store.getHandoverById(id);
    if (!handover) {
      return res.status(404).json({ success: false, message: 'Handover record not found.' });
    }

    const updated = store.updateHandover(id, {
      pickedUpAt: Date.now(),
      temperatureCheck,
    });

    return res.status(200).json({
      success: true,
      message: `Pickup confirmed with safety temperature verification: ${temperatureCheck}`,
      handover: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function confirmDelivery(req, res) {
  try {
    const { id } = req.params;
    const { deliveryNotes = 'Delivered safely to shelter coordinator.' } = req.body;

    const handover = store.getHandoverById(id);
    if (!handover) {
      return res.status(404).json({ success: false, message: 'Handover record not found.' });
    }

    const updated = store.updateHandover(id, {
      deliveredAt: Date.now(),
      confirmed: true,
      deliveryNotes,
    });

    // Update volunteer stats
    const volunteer = store.getVolunteerById(handover.volunteerId);
    if (volunteer) {
      store.addVolunteer({
        ...volunteer,
        hoursLogged: (volunteer.hoursLogged || 0) + 1,
        totalEarnings: (volunteer.totalEarnings || 0) + (handover.deliveryFeeLKR || 340),
        proBonoRescues: (volunteer.proBonoRescues || 0) + 1,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Delivery confirmed! Meal successfully rescued and transferred.',
      handover: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

