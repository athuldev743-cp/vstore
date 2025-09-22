const BASE_URL = "https://virtual-store-backed.onrender.com/api/store";

// -------------------------
// Helper to get headers with token
// -------------------------
function authHeaders(isJson = true) {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (isJson) headers["Content-Type"] = "application/json";
  return headers;
}

// -------------------------
// Generic fetch wrapper
// -------------------------
async function apiFetch(url, options = {}, isJson = true) {
  try {
    const res = await fetch(url, { ...options });

    if (res.status === 401) {
      // Token expired / invalid
      localStorage.removeItem("token");
      alert("Session expired. Please login again.");
      window.location.reload();
      return null;
    }

    return isJson ? res.json() : res;
  } catch (err) {
    console.error("API fetch error:", err);
    alert("Server connection failed");
    return null;
  }
}

// -------------------------
// Products
// -------------------------
export async function listProducts() {
  return (await apiFetch(`${BASE_URL}/products`, { headers: authHeaders(false) }, true)) || [];
}

export async function createProduct(data) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => value != null && formData.append(key, value));
  return apiFetch(`${BASE_URL}/products`, { method: "POST", headers: authHeaders(false), body: formData }, true);
}

export async function updateProduct(productId, data) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => value != null && formData.append(key, value));
  return apiFetch(`${BASE_URL}/products/${productId}`, { method: "PUT", headers: authHeaders(false), body: formData }, true);
}

export async function deleteProduct(productId) {
  return apiFetch(`${BASE_URL}/products/${productId}`, { method: "DELETE", headers: authHeaders() }, true);
}

// -------------------------
// Orders
// -------------------------
export async function getOrders() {
  return (await apiFetch(`${BASE_URL}/orders`, { headers: authHeaders() }, true)) || [];
}

export async function placeOrder(productId, quantity = 1) {
  return apiFetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ product_id: productId, quantity }),
  }, true);
}

// -------------------------
// Vendors
// -------------------------
export async function listPendingVendors() {
  return (await apiFetch(`${BASE_URL}/vendors/pending`, { headers: authHeaders() }, true)) || [];
}

export async function applyVendor(data) {
  return apiFetch(`${BASE_URL}/apply-vendor`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  }, true);
}

export async function approveVendor(vendorId) {
  return apiFetch(`${BASE_URL}/vendors/${vendorId}/approve`, { method: "POST", headers: authHeaders() }, true);
}

export async function rejectVendor(vendorId) {
  return apiFetch(`${BASE_URL}/vendors/${vendorId}/reject`, { method: "POST", headers: authHeaders() }, true);
}
