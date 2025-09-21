const BASE_URL = "https://virtual-store-backed.onrender.com";

export async function listProducts() {
  const res = await fetch(`${BASE_URL}/store/products`);
  return res.ok ? res.json() : [];
}

export async function getOrders() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok ? res.json() : [];
}

export async function listPendingVendors() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/vendors/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok ? res.json() : [];
}

export async function placeOrder(productId, quantity = 1) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  return res.json();
}

export async function applyVendor(data) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/apply-vendor`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createProduct(data) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("description", data.description);
  formData.append("price", data.price);
  formData.append("stock", data.stock);
  formData.append("file", data.file);

  const res = await fetch(`${BASE_URL}/store/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
}

export async function updateProduct(productId, data) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("description", data.description);
  formData.append("price", data.price);
  formData.append("stock", data.stock);
  if (data.file) formData.append("file", data.file);

  const res = await fetch(`${BASE_URL}/store/products/${productId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
}

export async function deleteProduct(productId) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/products/${productId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function approveVendor(vendorId) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/vendors/${vendorId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function rejectVendor(vendorId) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/vendors/${vendorId}/reject`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
