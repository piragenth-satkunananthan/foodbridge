const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('foodbridge_token');
export const setAuthToken = (token) => localStorage.setItem('foodbridge_token', token);
export const removeAuthToken = () => {
  localStorage.removeItem('foodbridge_token');
  localStorage.removeItem('foodbridge_user');
};

export const getSavedUser = () => {
  try {
    const raw = localStorage.getItem('foodbridge_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveUser = (user) => {
  localStorage.setItem('foodbridge_user', JSON.stringify(user));
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
};

// ==========================================
// Authentication APIs
// ==========================================

export const loginUser = (email, password) => {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

export const registerUser = (userData) => {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

export const getMe = () => apiFetch('/auth/me');

// ==========================================
// Governance, Organization Verification & Impact APIs
// ==========================================

export const fetchAdminStats = () => apiFetch('/admin/stats');

export const fetchOrganizations = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/organizations${query ? '?' + query : ''}`);
};

export const fetchOrganizationDetails = (id) => apiFetch(`/admin/organizations/${id}`);

export const verifyOrganization = (id, verificationStatus, remarks) => {
  return apiFetch(`/admin/organizations/${id}/verify`, {
    method: 'PUT',
    body: JSON.stringify({ verificationStatus, remarks })
  });
};

export const fetchAllDonations = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/donations${query ? '?' + query : ''}`);
};

export const fetchAllWasteRequests = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/waste-requests${query ? '?' + query : ''}`);
};

export const fetchAllPickups = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/pickups${query ? '?' + query : ''}`);
};

export const fetchAllUsers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/users${query ? '?' + query : ''}`);
};

export const updateUserStatus = (id, status, reason) => {
  return apiFetch(`/admin/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason })
  });
};

export const deleteUser = (id) => {
  return apiFetch(`/admin/users/${id}`, {
    method: 'DELETE'
  });
};

export const fetchReports = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/reports${query ? '?' + query : ''}`);
};

// ==========================================
// Public Impact & Notification APIs
// ==========================================

export const fetchPublicImpact = () => apiFetch('/impact');

export const snapshotImpact = (period) => {
  return apiFetch('/admin/impact/snapshot', {
    method: 'POST',
    body: JSON.stringify({ period })
  });
};

export const fetchNotifications = () => apiFetch('/notifications');
export const markNotificationRead = (id) => apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
export const markAllNotificationsRead = () => apiFetch('/notifications/read-all', { method: 'PUT' });

// ==========================================
// Commercial Donor & Surplus Dispatch APIs
// ==========================================

export const fetchDonorStats = () => apiFetch('/donations/stats');

export const fetchDonations = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/donations${query ? '?' + query : ''}`);
};

export const fetchDonationById = (id) => apiFetch(`/donations/${id}`);

export const createDonation = (donationData) => {
  return apiFetch('/donations', {
    method: 'POST',
    body: JSON.stringify(donationData)
  });
};

export const updateDonation = (id, donationData) => {
  return apiFetch(`/donations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(donationData)
  });
};

export const cancelDonation = (id) => {
  return apiFetch(`/donations/${id}`, {
    method: 'DELETE'
  });
};

export const fetchWasteRequests = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/waste${query ? '?' + query : ''}`);
};

export const createWasteRequest = (wasteData) => {
  return apiFetch('/waste', {
    method: 'POST',
    body: JSON.stringify(wasteData)
  });
};

export const cancelWasteRequest = (id) => {
  return apiFetch(`/waste/${id}`, {
    method: 'DELETE'
  });
};



// ==========================================
// Volunteer Courier & Route Tracking APIs (Module 4)
// ==========================================

export const fetchOpenPickups = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/pickups/open${query ? '?' + query : ''}`);
};

export const fetchMyActivePickups = () => apiFetch('/pickups/my-active');

export const fetchPickupHistory = () => apiFetch('/pickups/history');

export const fetchVolunteerStats = () => apiFetch('/pickups/stats');

export const fetchPickupById = (id) => apiFetch(`/pickups/${id}`);

export const acceptPickupJob = (id) => {
  return apiFetch(`/pickups/${id}/accept`, {
    method: 'POST'
  });
};

export const updatePickupStatus = (id, statusData) => {
  return apiFetch(`/pickups/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(statusData)
  });
};

export const cancelPickupJob = (id, reason = '') => {
  return apiFetch(`/pickups/${id}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  });
};

export const updatePickupLocation = (id, coords) => {
  return apiFetch(`/pickups/${id}/location`, {
    method: 'PUT',
    body: JSON.stringify(coords)
  });
};
