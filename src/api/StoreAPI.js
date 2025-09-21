const BASE_URL = "https://virtual-store-backed.onrender.com/api/store";

// Helper to get headers with token
function authHeaders(isJson = true) {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (isJson) headers["Content-Type"] = "application/json";
  return headers;
}

// -------------------------
// Products
// -------------------------
export async function listProducts() {
  const res = await fetch(`${BASE_URL}/products`, {
    headers: authHeaders(false), // GET, no JSON body
  });
  return res.ok ? res.json() : [];
}

export async function createProduct(data) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value != null) formData.append(key, value);
  });
  const res = await fetch(`${BASE_URL}/products`, {
    method: "POST",
    headers: authHeaders(false), // formData → don't set JSON
    body: formData,
  });
  return res.json();
}

export async function updateProduct(productId, data) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value != null) formData.append(key, value);
  });
  const res = await fetch(`${BASE_URL}/products/${productId}`, {
    method: "PUT",
    headers: authHeaders(false),
    body: formData,
  });
  return res.json();
}

export async function deleteProduct(productId) {
  const res = await fetch(`${BASE_URL}/products/${productId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
}

// -------------------------
// Orders
// -------------------------
export async function getOrders() {
  const res = await fetch(`${BASE_URL}/orders`, { headers: authHeaders() });
  return res.ok ? res.json() : [];
}

export async function placeOrder(productId, quantity = 1) {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  return res.json();
}

// -------------------------
// Vendors
// -------------------------
export async function listPendingVendors() {
  const res = await fetch(`${BASE_URL}/vendors/pending`, { headers: authHeaders() });
  return res.ok ? res.json() : [];
}

export async function applyVendor(data) {
  const res = await fetch(`${BASE_URL}/apply-vendor`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function approveVendor(vendorId) {
  const res = await fetch(`${BASE_URL}/vendors/${vendorId}/approve`, {
    method: "POST",
    headers: authHeaders(),
  });
  return res.json();
}

export async function rejectVendor(vendorId) {
  const res = await fetch(`${BASE_URL}/vendors/${vendorId}/reject`, {
    method: "POST",
    headers: authHeaders(),
  });
  return res.json();
}
