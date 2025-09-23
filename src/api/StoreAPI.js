const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const getToken = () => localStorage.getItem("token");

const request = async (endpoint, options = {}) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401) throw new Error("Unauthorized: Session expired. Please login again.");

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || res.statusText);
  return data;
};

// -------------------------
// Auth
// -------------------------
export const signup = (data) =>
  request("/signup", { method: "POST", body: JSON.stringify(data) });

export const login = (data) =>
  request("/login", { method: "POST", body: JSON.stringify(data) });

// -------------------------
// Store
// -------------------------
export const listProducts = () => request("/products");
export const getOrders = () => request("/orders");
export const placeOrder = (product_id, quantity) =>
  request("/orders", { method: "POST", body: JSON.stringify({ product_id, quantity }) });

// -------------------------
// Vendor
// -------------------------
export const applyVendor = (data) => request("/apply-vendor", { method: "POST", body: JSON.stringify(data) });
export const listPendingVendors = () => request("/vendors/pending");
export const approveVendor = (vendor_id) => request(`/vendors/${vendor_id}/approve`, { method: "POST" });
export const rejectVendor = (vendor_id) => request(`/vendors/${vendor_id}/reject`, { method: "POST" });
