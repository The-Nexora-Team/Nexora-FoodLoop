/**
 * FoodLoop Frontend API Client
 * Connects to the Express backend at http://localhost:5000/api
 * Gracefully handles offline fallback if the backend server is not active.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('foodloop_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('foodloop_token', token);
  } else {
    localStorage.removeItem('foodloop_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    // If backend is not running, log cleanly without breaking app
    console.warn(`[API] ${endpoint} error:`, err.message);
    throw err;
  }
}

// ---- Auth API ----
export const authApi = {
  login: async ({ email, password, role }) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    if (res.token) {
      setToken(res.token);
    }
    return res;
  },

  register: async ({ name, email, password, role, details }) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, details }),
    });
    if (res.token) {
      setToken(res.token);
    }
    return res;
  },

  getMe: async () => {
    return request('/auth/me');
  },

  getDemoAccounts: async () => {
    return request('/auth/demo-accounts');
  },

  logout: () => {
    setToken(null);
  },
};

// ---- Admin API ----
export const adminApi = {
  getStats: async () => {
    return request('/admin/stats');
  },

  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/users${query ? `?${query}` : ''}`);
  },

  updateUser: async (id, updates) => {
    return request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteUser: async (id) => {
    return request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  setClockSpeed: async (speed) => {
    return request('/admin/clock/speed', {
      method: 'POST',
      body: JSON.stringify({ speed }),
    });
  },

  triggerDemoScenario: async () => {
    return request('/admin/demo/trigger-scenario', {
      method: 'POST',
    });
  },

  resetDemoState: async () => {
    return request('/admin/demo/reset', {
      method: 'POST',
    });
  },

  getInspection: async () => {
    return request('/admin/inspection');
  },

  getClients: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/clients${query ? `?${query}` : ''}`);
  },

  createClient: async (clientData) => {
    return request('/admin/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  },

  updateClient: async (id, updates) => {
    return request(`/admin/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteClient: async (id, clientType) => {
    return request(`/admin/clients/${id}${clientType ? `?clientType=${clientType}` : ''}`, {
      method: 'DELETE',
    });
  },

  getAnalytics: async () => {
    return request('/admin/analytics');
  },
};

// ---- Listings API ----
export const listingApi = {
  create: async (listingData) => {
    return request('/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  },

  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/listings${query ? `?${query}` : ''}`);
  },

  getById: async (id) => {
    return request(`/listings/${id}`);
  },

  sellPortions: async (id, portionsSold) => {
    return request(`/listings/${id}/sell`, {
      method: 'POST',
      body: JSON.stringify({ portionsSold }),
    });
  },
};

// ---- Matches API ----
export const matchApi = {
  getAll: async () => {
    return request('/matches');
  },

  accept: async (id, receiverId) => {
    return request(`/matches/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
  },

  decline: async (id, reason) => {
    return request(`/matches/${id}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// ---- Handovers API ----
export const handoverApi = {
  getAll: async () => {
    return request('/handovers');
  },

  claim: async (matchId) => {
    return request('/handovers/claim', {
      method: 'POST',
      body: JSON.stringify({ matchId }),
    });
  },

  confirmPickup: async (id, temperatureCheck) => {
    return request(`/handovers/${id}/pickup`, {
      method: 'PATCH',
      body: JSON.stringify({ temperatureCheck }),
    });
  },

  confirmDelivery: async (id, deliveryNotes) => {
    return request(`/handovers/${id}/deliver`, {
      method: 'PATCH',
      body: JSON.stringify({ deliveryNotes }),
    });
  },
};

export default {
  auth: authApi,
  admin: adminApi,
  listings: listingApi,
  matches: matchApi,
  handovers: handoverApi,
};

