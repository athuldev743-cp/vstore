const API_BASE = process.env.REACT_APP_API_URL || "https://virtual-store-backed.onrender.com";

// -------------------------
// Token helpers
// -------------------------
const getToken = () => localStorage.getItem("token");
const clearToken = () => localStorage.removeItem("token");
export const refreshToken = (newToken) => {
  localStorage.setItem("token", newToken); // Update token in storage
};

// -------------------------
// Centralized request
// -------------------------
const request = async (endpoint, options = {}) => {
  try {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      const msg = data.detail || res.statusText || `Request failed (${res.status})`;
      if (res.status === 401 || res.status === 403) {
        clearToken();
        window.location.href = "/";
        throw new Error("Unauthorized: Session expired or access denied.");
      }
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    console.error("API Request Error:", endpoint, err);
    throw err;
  }
};

// -------------------------
// Auth APIs
// -------------------------
export const signup = async (data) =>
  request("/api/users/signup", { method: "POST", body: JSON.stringify(data) });

export const login = async (data) =>
  request("/api/users/login", { method: "POST", body: JSON.stringify(data) });

export const getCurrentUser = async () => request("/api/users/me");

// -------------------------
// Store APIs
// -------------------------
export const listProducts = async () => request("/api/store/products");
export const getProductById = async (productId) => request(`/api/store/products/${productId}`);
export const getOrders = async () => request("/api/store/orders");
export const placeOrder = async (data) =>
  request("/api/store/orders", { method: "POST", body: JSON.stringify(data) });

// -------------------------
// Vendor APIs
// -------------------------
// ✅ Vendor: get ONLY my products (uses JWT + /vendor/products)
export const getMyProducts = async () => request("/api/store/vendor/products");

export const applyVendor = async (data) =>
  request("/api/store/vendors/apply", { method: "POST", body: JSON.stringify(data) });

export const getVendorStatus = async (userId) => request(`/api/store/vendors/status/${userId}`);
export const listVendors = async () => request("/api/store/vendors");
export const getVendorProducts = async (vendorId) =>
  request(`/api/store/vendors/${vendorId}/products`);

export const addProduct = async (formData) => {
  const token = getToken();
  if (!token) throw new Error("Not logged in");

  try {
    const res = await fetch(`${API_BASE}/api/store/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) throw new Error(data.detail || `Failed to add product (${res.status})`);
    return data;
  } catch (err) {
    console.error("Add Product Error:", err);
    throw err;
  }
};

export const updateProduct = async (productId, formData) => {
  const token = getToken();
  if (!token) throw new Error("Not logged in");

  try {
    const res = await fetch(`${API_BASE}/api/store/products/${productId}`, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`,
        // No Content-Type header for FormData
      },
      body: formData
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      throw new Error(data.detail || `Failed to update product (${res.status})`);
    }
    return data;
  } catch (err) {
    console.error("Update Product Error:", err);
    throw err;
  }
};
// Add this function to StoreAPI.js
export const getVendorByUserId = async (userId) => {
  const vendors = await listVendors();
  return Array.isArray(vendors) ? vendors.find(v => v.user_id === userId) : null;
};
export const getMyVendor = async () => {
  return request("/api/store/vendors/my-vendor");
};
// -------------------------
// Admin Vendor Management
// -------------------------
export const listPendingVendors = async () => {
  const token = getToken();
  if (!token) throw new Error("Not logged in as admin.");

  try {
    const res = await fetch(`${API_BASE}/api/store/vendors/pending`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = [];
    }

    if (!res.ok) throw new Error(data.detail || `Failed: ${res.status}`);
    return data;
  } catch (err) {
    console.error("List Pending Vendors Error:", err);
    throw err;
  }
};

export const approveVendor = async (vendorId) => {
  const response = await request(`/api/store/vendors/${vendorId}/approve`, { method: "POST" });
  if (response.new_token) refreshToken(response.new_token);
  return response;
};

export const rejectVendor = async (vendorId) =>
  request(`/api/store/vendors/${vendorId}/reject`, { method: "POST" });
// -------------------------
// Razorpay Payment APIs
// -------------------------
export const createRazorpayOrder = async (amount) =>
  request("/api/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });

export const verifyRazorpayPayment = async (data) =>
  request("/api/payments/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });