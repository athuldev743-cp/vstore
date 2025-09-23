// StoreAPI.js
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Helper: get token from localStorage
const getToken = () => localStorage.getItem("token");

// Generic request handler
const request = async (endpoint, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    throw new Error("Unauthorized: Session expired. Please login again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || res.statusText);
  return data;
};

// -------------------------
// Auth
// -------------------------
export const signup = (data) =>
  request("/api/users/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const login = (data) =>
  request("/api/users/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

// -------------------------
// Store
// -------------------------
export const listProducts = () => request("/api/store/products");

export const getOrders = () => request("/api/store/orders");

export const placeOrder = (product_id, quantity) =>
  request("/api/store/orders", {
    method: "POST",
    body: JSON.stringify({ product_id, quantity }),
  });

// -------------------------
// Vendor
// -------------------------
export const applyVendor = (data) =>
  request("/api/vendors/apply", { method: "POST", body: JSON.stringify(data) });

export const listPendingVendors = () => request("/api/vendors/pending");

export const approveVendor = (vendor_id) =>
  request(`/api/vendors/${vendor_id}/approve`, { method: "POST" });

export const rejectVendor = (vendor_id) =>
  request(`/api/vendors/${vendor_id}/reject`, { method: "POST" });
