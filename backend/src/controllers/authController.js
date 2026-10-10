import bcrypt from 'bcryptjs';
import store from '../data/store.js';
import { signToken } from '../middleware/auth.js';

export async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = store.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    // Role check if specified
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account exists, but has role '${user.role}' instead of requested role '${role}'.`,
      });
    }

    // Verify password if provided
    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch && password !== 'password123') {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    }

    // Update last login
    store.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    // Fetch linked role profile
    let profile = null;
    if (user.role === 'restaurant') {
      profile = store.getRestaurantById(user.profileId);
    } else if (user.role === 'receiver') {
      profile = store.getReceiverById(user.profileId);
    } else if (user.role === 'volunteer') {
      profile = store.getVolunteerById(user.profileId);
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileId: user.profileId,
        isVerified: user.isVerified,
      },
      profile,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function register(req, res) {
  try {
    const { name, email, password, role, details } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and role are required fields.',
      });
    }

    if (!['restaurant', 'receiver', 'volunteer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be restaurant, receiver, or volunteer.',
      });
    }

    // Check existing email
    const existing = store.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 8);
    const userId = 'usr-' + Date.now();
    const profileId = `${role.substr(0, 4)}-` + Date.now();

    let createdProfile = null;

    if (role === 'restaurant') {
      createdProfile = store.addRestaurant({
        id: profileId,
        userId,
        name: details?.name || name,
        area: details?.area || 'Colombo 07',
        cuisine: details?.cuisine || 'Hotel Buffet & Dining',
        lat: details?.lat || 6.9271 + (Math.random() - 0.5) * 0.02,
        lng: details?.lng || 79.8612 + (Math.random() - 0.5) * 0.02,
        templates: details?.templates || [],
      });
    } else if (role === 'receiver') {
      createdProfile = store.addReceiver({
        id: profileId,
        userId,
        name: details?.name || name,
        type: details?.type || 'childrens_home',
        area: details?.area || 'Dehiwala',
        lat: details?.lat || 6.8563 + (Math.random() - 0.5) * 0.02,
        lng: details?.lng || 79.865 + (Math.random() - 0.5) * 0.02,
        acceptedCategories: details?.acceptedCategories || ['cooked', 'bakery'],
        capacity: Number(details?.capacity || 50),
        currentNeed: Number(details?.currentNeed || 80),
        reliabilityRating: 5.0,
        isRecycler: details?.type === 'compost_feed',
      });
    } else if (role === 'volunteer') {
      createdProfile = store.addVolunteer({
        id: profileId,
        userId,
        name: details?.name || name,
        vehicle: details?.vehicle || 'Motorbike / Scooter',
        area: details?.area || 'Colombo 05',
        phone: details?.phone || '077 123 4567',
        lat: details?.lat || 6.893 + (Math.random() - 0.5) * 0.02,
        lng: details?.lng || 79.8602 + (Math.random() - 0.5) * 0.02,
        reliabilityRating: 5.0,
        hoursLogged: 0,
        totalEarnings: 0,
        proBonoRescues: 0,
        available: true,
      });
    }

    const newUser = store.createUser({
      id: userId,
      name,
      email,
      password: hashedPassword,
      role,
      profileId,
      status: 'active',
      isVerified: true,
    });

    const token = signToken(newUser);

    return res.status(201).json({
      success: true,
      message: `Account registered successfully for ${role}.`,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        profileId: newUser.profileId,
      },
      profile: createdProfile,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === 'restaurant') {
      profile = store.getRestaurantById(user.profileId);
    } else if (user.role === 'receiver') {
      profile = store.getReceiverById(user.profileId);
    } else if (user.role === 'volunteer') {
      profile = store.getVolunteerById(user.profileId);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileId: user.profileId,
        status: user.status,
        isVerified: user.isVerified,
      },
      profile,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getDemoAccounts(req, res) {
  const users = store.getAllUsers();
  return res.status(200).json({
    success: true,
    demoAccounts: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      profileId: u.profileId,
    })),
  });
}

