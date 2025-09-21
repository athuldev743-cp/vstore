const BASE_URL = process.env.REACT_APP_API_URL;

// -------------------------
// Products
// -------------------------
export const listProducts = async () => {
  const res = await fetch(`${BASE_URL}/store/products`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

// -------------------------
// Orders
// -------------------------
export const getOrders = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
};

export const placeOrder = async (productId, quantity) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  if (!res.ok) throw new Error("Failed to place order");
  return res.json();
};

// -------------------------
// Vendor
// -------------------------
export const applyVendor = async (data) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/apply-vendor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to apply as vendor");
  return res.json();
};

// -------------------------
// Vendor Products
// -------------------------
export const createProduct = async (data) => {
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
  if (!res.ok) throw new Error("Failed to create product");
  return res.json();
};

export const updateProduct = async (productId, data) => {
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
  if (!res.ok) throw new Error("Failed to update product");
  return res.json();
};

export const deleteProduct = async (productId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/products/${productId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete product");
  return res.json();
};

// -------------------------
// Admin
// -------------------------
export const listPendingVendors = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/vendors/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch pending vendors");
  return res.json();
};

export const approveVendor = async (vendorId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/vendors/${vendorId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to approve vendor");
  return res.json();
};

export const rejectVendor = async (vendorId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/store/vendors/${vendorId}/reject`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to reject vendor");
  return res.json();
};
