import store from '../data/store.js';

/**
 * Platform-wide statistics and metrics
 */
export async function getPlatformStats(req, res) {
  try {
    const stats = store.getAdminStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * List all users with role and verification details
 */
export async function getAllUsers(req, res) {
  try {
    const { role, status, search } = req.query;
    let users = store.getAllUsers();

    if (role) {
      users = users.filter((u) => u.role === role);
    }

    if (status) {
      users = users.filter((u) => u.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }

    // Attach profile information
    const enrichedUsers = users.map((u) => {
      let profile = null;
      if (u.role === 'restaurant') {
        profile = store.getRestaurantById(u.profileId);
      } else if (u.role === 'receiver') {
        profile = store.getReceiverById(u.profileId);
      } else if (u.role === 'volunteer') {
        profile = store.getVolunteerById(u.profileId);
      }
      return { ...u, profile };
    });

    return res.status(200).json({
      success: true,
      count: enrichedUsers.length,
      users: enrichedUsers,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Update user status or verification
 */
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { status, isVerified, name } = req.body;

    const existing = store.findUserById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (isVerified !== undefined) updates.isVerified = isVerified;
    if (name !== undefined) updates.name = name;

    const updatedUser = store.updateUser(id, updates);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Delete a user
 */
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (id === 'usr-admin-001') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the primary system administrator account.',
      });
    }

    const success = store.deleteUser(id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Adjust demo clock simulation speed (1x, 10x, 60x)
 */
export async function setClockSpeed(req, res) {
  try {
    const { speed } = req.body;
    const validSpeeds = [1, 10, 60];

    if (!validSpeeds.includes(Number(speed))) {
      return res.status(400).json({
        success: false,
        message: 'Speed must be one of: 1, 10, 60',
      });
    }

    const updatedSpeed = store.setClockSpeed(speed);
    return res.status(200).json({
      success: true,
      message: `Simulation clock speed set to ${updatedSpeed}x`,
      speed: updatedSpeed,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * 1-Click trigger for fail-safe backup pitch demo scenario
 */
export async function triggerDemoScenario(req, res) {
  try {
    const scenario = store.triggerBackupDemoScenario();
    return res.status(200).json({
      success: true,
      message: 'Backup food rescue scenario staged successfully!',
      scenario,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Reset demo state back to clean initial seed data
 */
export async function resetDemoState(req, res) {
  try {
    store.resetStore();
    return res.status(200).json({
      success: true,
      message: 'Platform state reset to initial seed data.',
      stats: store.getAdminStats(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Inspect raw platform state (listings, matches, handovers)
 */
export async function getSystemInspection(req, res) {
  try {
    return res.status(200).json({
      success: true,
      listings: store.getListings(),
      matches: store.getMatches(),
      handovers: store.getHandovers(),
      restaurants: store.getRestaurants(),
      receivers: store.getReceivers(),
      volunteers: store.getVolunteers(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get all ecosystem clients (Restaurants, Receivers, Volunteers) with full metrics
 */
export async function getAllClients(req, res) {
  try {
    const { clientType, search } = req.query;
    let clients = store.getAllClients();

    if (clientType) {
      clients = clients.filter((c) => c.clientType === clientType);
    }

    if (search) {
      const q = search.toLowerCase();
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.area?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      count: clients.length,
      clients,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Create a new client (Restaurant, Receiver, or Volunteer)
 */
export async function createClient(req, res) {
  try {
    const { clientType, name, email, password, area, details = {} } = req.body;

    if (!clientType || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'clientType, name, and email are required.',
      });
    }

    const userId = 'usr-' + Date.now();
    const profileId = `${clientType.substr(0, 4)}-` + Date.now();

    let createdProfile = null;
    if (clientType === 'restaurant') {
      createdProfile = store.addRestaurant({
        id: profileId,
        userId,
        name,
        area: area || 'Colombo 07',
        cuisine: details.cuisine || 'Restaurant & Dining',
        lat: details.lat || 6.9271,
        lng: details.lng || 79.8612,
        templates: details.templates || [],
      });
    } else if (clientType === 'receiver') {
      createdProfile = store.addReceiver({
        id: profileId,
        userId,
        name,
        type: details.type || 'childrens_home',
        area: area || 'Dehiwala',
        lat: details.lat || 6.8563,
        lng: details.lng || 79.865,
        acceptedCategories: details.acceptedCategories || ['cooked', 'bakery'],
        capacity: Number(details.capacity || 50),
        currentNeed: Number(details.currentNeed || 80),
        reliabilityRating: 5.0,
        isRecycler: details.type === 'compost_feed',
      });
    } else if (clientType === 'volunteer') {
      createdProfile = store.addVolunteer({
        id: profileId,
        userId,
        name,
        vehicle: details.vehicle || 'Motorbike / Scooter',
        area: area || 'Colombo 05',
        phone: details.phone || '077 123 4567',
        lat: details.lat || 6.893,
        lng: details.lng || 79.8602,
        reliabilityRating: 5.0,
        hoursLogged: 0,
        totalEarnings: 0,
        available: true,
      });
    }

    const newUser = store.createUser({
      id: userId,
      name,
      email,
      password: password || 'password123',
      role: clientType,
      profileId,
      status: 'active',
      isVerified: true,
    });

    return res.status(201).json({
      success: true,
      message: `${clientType} client registered successfully.`,
      client: { ...createdProfile, clientType, email: newUser.email, status: newUser.status },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Update client details
 */
export async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const { clientType, name, area, status, ...otherUpdates } = req.body;

    let updated = null;
    if (clientType === 'restaurant' || id.startsWith('rest-')) {
      updated = store.updateRestaurant(id, { ...(name && { name }), ...(area && { area }), ...otherUpdates });
    } else if (clientType === 'receiver' || id.startsWith('recv-')) {
      updated = store.updateReceiver(id, { ...(name && { name }), ...(area && { area }), ...otherUpdates });
    } else if (clientType === 'volunteer' || id.startsWith('vol-')) {
      updated = store.updateVolunteer(id, { ...(name && { name }), ...(area && { area }), ...otherUpdates });
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Client profile not found.' });
    }

    // Update associated user status if provided
    if (updated.userId && status) {
      store.updateUser(updated.userId, { status });
    }

    return res.status(200).json({
      success: true,
      message: 'Client updated successfully.',
      client: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Delete a client
 */
export async function deleteClient(req, res) {
  try {
    const { id } = req.params;
    const { clientType } = req.query;

    let deleted = false;
    if (clientType === 'restaurant' || id.startsWith('rest-')) {
      deleted = store.deleteRestaurant(id);
    } else if (clientType === 'receiver' || id.startsWith('recv-')) {
      deleted = store.deleteReceiver(id);
    } else if (clientType === 'volunteer' || id.startsWith('vol-')) {
      deleted = store.deleteVolunteer(id);
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Client not found or already deleted.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Client deleted successfully.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get aggregated analytics for charts & diagrams
 */
export async function getAnalytics(req, res) {
  try {
    const analytics = store.getAnalytics();
    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

