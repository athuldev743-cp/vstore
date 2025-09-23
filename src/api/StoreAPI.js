// StoreAPI.js
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

  // Handle unauthorized
  if (res.status === 401) {
    clearToken();
    window.location.href = "/"; // redirect to login page
    throw new Error("Unauthorized: Session expired. Please login again.");
  }

  // Parse response safely
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || res.statusText || "Request failed");
  }

  return data;
};

// -------------------------
// Auth APIs
// -------------------------
export const signup = (data) =>
  request("/api/users/signup", { method: "POST", body: JSON.stringify(data) });

export const login = (data) =>
  request("/api/users/login", { method: "POST", body: JSON.stringify(data) });

// -------------------------
// Store APIs
// -------------------------
export const listProducts = () => request("/api/store/products");
export const getOrders = () => request("/api/store/orders");
export const placeOrder = (product_id, quantity) =>
  request("/api/store/orders", { method: "POST", body: JSON.stringify({ product_id, quantity }) });

// -------------------------
// Vendor APIs
// -------------------------
// Vendor APIs
export const applyVendor = (data) => {
  const token = localStorage.getItem("token");
  return fetch(`${API_BASE}/api/store/apply-vendor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`, // JWT
    },
    body: JSON.stringify(data),
  }).then(res => {
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    return res.json();
  });
};



export const listPendingVendors = () => request("/api/store/vendors/pending");
export const approveVendor = (vendor_id) =>
  request(`/api/store/vendors/${vendor_id}/approve`, { method: "POST" });
export const rejectVendor = (vendor_id) =>
  request(`/api/store/vendors/${vendor_id}/reject`, { method: "POST" });
