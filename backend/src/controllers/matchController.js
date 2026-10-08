import store from '../data/store.js';

export async function getMatches(req, res) {
  try {
    const user = req.user;
    let matches = store.getMatches();

    if (user.role === 'receiver') {
      // Receivers see matches where they are ranked or matched
      matches = matches.filter((m) =>
        m.rankedReceivers.some((r) => r.receiverId === user.profileId)
      );
    }

    // Attach corresponding listing information
    const enriched = matches.map((m) => {
      const listing = store.getListingById(m.listingId);
      return { ...m, listing };
    });

    return res.status(200).json({
      success: true,
      count: enriched.length,
      matches: enriched,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function acceptMatch(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const match = store.getMatchById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    if (match.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'This donation offer has already been accepted.',
      });
    }

    const receiverId = user.profileId || req.body.receiverId;

    // Update match
    const updatedMatch = store.updateMatch(id, {
      status: 'accepted',
      acceptedBy: receiverId,
    });

    // Update listing step and status to 'donated' / 'donating'
    store.updateListing(match.listingId, {
      status: 'donated',
      currentStep: 'donate',
    });

    return res.status(200).json({
      success: true,
      message: 'Donation match accepted! It is now queued for volunteer pickup.',
      match: updatedMatch,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function declineMatch(req, res) {
  try {
    const { id } = req.params;
    const { reason = 'Capacity reached' } = req.body;
    const user = req.user;

    const match = store.getMatchById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const receiverId = user.profileId || 'unknown';
    const declinedReasons = [
      ...(match.declinedReasons || []),
      { receiverId, reason, timestamp: Date.now() },
    ];

    // Escalate to next eligible receiver if available
    const nextIndex = match.currentOfferIndex + 1;
    let nextStatus = 'escalated';

    if (nextIndex >= match.rankedReceivers.length) {
      nextStatus = 'routed_to_recycling';
      store.updateListing(match.listingId, {
        status: 'recycling',
        currentStep: 'recycle',
      });
    }

    const updatedMatch = store.updateMatch(id, {
      currentOfferIndex: nextIndex,
      declinedReasons,
      status: nextStatus,
      offerSentAt: Date.now(),
    });

    return res.status(200).json({
      success: true,
      message: 'Match declined and escalated to next recipient or bio-cycle.',
      match: updatedMatch,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

