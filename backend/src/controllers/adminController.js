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

