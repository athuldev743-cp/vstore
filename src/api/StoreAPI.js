const API_BASE = process.env.REACT_APP_API_URL || "https://virtual-store-backed.onrender.com";

// -------------------------
// Token helpers
// -------------------------
const getToken = () => localStorage.getItem("token");
const clearToken = () => localStorage.removeItem("token");

// -------------------------
// Centralized request
// -------------------------
const request = async (endpoint, options = {}) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    clearToken();
    window.location.href = "/";
    throw new Error("Unauthorized: Session expired or access denied.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || res.statusText || "Request failed");

  return data;
};

// -------------------------
// Auth APIs
// -------------------------
export const signup = (data) =>
  request("/api/users/signup", { method: "POST", body: JSON.stringify(data) });

export const login = (data) =>
  request("/api/users/login", { method: "POST", body: JSON.stringify(data) });

export const getCurrentUser = () => request("/api/users/me");

// -------------------------
// Store APIs
// -------------------------
export const listProducts = () => request("/api/store/products");
export const getOrders = () => request("/api/store/orders");
export const placeOrder = (data) =>
  request("/api/store/orders", { method: "POST", body: JSON.stringify(data) });

// -------------------------
// Vendor APIs
// -------------------------
export const applyVendor = (data) =>
  request("/api/store/vendors/apply", { method: "POST", body: JSON.stringify(data) });

export const getVendorStatus = (userId) =>
  request(`/api/store/vendors/status/${userId}`);

export const listVendors = () => request("/api/store/vendors");
export const getVendorProducts = (vendorId) =>
  request(`/api/store/vendors/${vendorId}/products`);

export const addProduct = (formData) => {
  const token = getToken();
  return fetch(`${API_BASE}/api/store/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `Failed: ${res.status}`);
    return data;
  });
};

// -------------------------
// Admin Vendor Management
// -------------------------
export const listPendingVendors = async () => {
  const token = getToken();
  if (!token) throw new Error("Not logged in as admin.");

  const res = await fetch(`${API_BASE}/api/store/vendors/pending`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("Unauthorized: Admin access required.");
  }

  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(data.detail || `Failed: ${res.status}`);
  return data;
};

export const approveVendor = async (vendorId) =>
  request(`/api/store/vendors/${vendorId}/approve`, { method: "POST" });

export const rejectVendor = async (vendorId) =>
  request(`/api/store/vendors/${vendorId}/reject`, { method: "POST" });
