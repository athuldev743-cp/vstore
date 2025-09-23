// StoreAPI.js
const API_BASE = "https://virtual-store-backed.onrender.com/api";

const getToken = () => localStorage.getItem("token");

const request = async (endpoint, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: getToken() ? `Bearer ${getToken()}` : undefined,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    throw new Error("Unauthorized: Session expired. Please login again.");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || res.statusText);
  return data;
};

// -------------------------
// Auth
// -------------------------
export const signup = (data) => request("/users/signup", {
  method: "POST",
  body: JSON.stringify(data),
});

export const login = (data) => request("/users/login", {
  method: "POST",
  body: JSON.stringify(data),
});

// -------------------------
// Store
// -------------------------
export const listProducts = () => request("/store/products");

export const getOrders = () => request("/store/orders");

export const placeOrder = (product_id, quantity) =>
  request("/store/orders", {
    method: "POST",
    body: JSON.stringify({ product_id, quantity }),
  });

// -------------------------
// Vendor
// -------------------------
export const applyVendor = (data) =>
  request("/vendors/apply", { method: "POST", body: JSON.stringify(data) });

export const listPendingVendors = () => request("/vendors/pending");

export const approveVendor = (vendor_id) =>
  request(`/vendors/${vendor_id}/approve`, { method: "POST" });

export const rejectVendor = (vendor_id) =>
  request(`/vendors/${vendor_id}/reject`, { method: "POST" });
