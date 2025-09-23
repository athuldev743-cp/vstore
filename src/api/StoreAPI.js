import axios from "axios";

const BASE_URL = "https://virtual-store-backed.onrender.com/api/store";

// -------------------------
// Axios instance with token
// -------------------------
const API = axios.create({ baseURL: BASE_URL });

// Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      alert("Session expired. Please login again.");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// -------------------------
// Products
// -------------------------
export const listProducts = async () => {
  const res = await API.get("/products");
  return res.data || [];
};

export const createProduct = async (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => v != null && formData.append(k, v));
  const res = await API.post("/products", formData, { headers: { "Content-Type": "multipart/form-data" } });
  return res.data;
};

export const updateProduct = async (productId, data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => v != null && formData.append(k, v));
  const res = await API.put(`/products/${productId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
  return res.data;
};

export const deleteProduct = async (productId) => {
  const res = await API.delete(`/products/${productId}`);
  return res.data;
};

// -------------------------
// Orders
// -------------------------
export const getOrders = async () => {
  const res = await API.get("/orders");
  return res.data || [];
};

export const placeOrder = async (productId, quantity = 1) => {
  const res = await API.post("/orders", { product_id: productId, quantity });
  return res.data;
};

// -------------------------
// Vendors
// -------------------------
export const listPendingVendors = async () => {
  const res = await API.get("/vendors/pending");
  return res.data || [];
};

export const applyVendor = async (data) => {
  const res = await API.post("/apply-vendor", data);
  return res.data;
};

export const approveVendor = async (vendorId) => {
  const res = await API.post(`/vendors/${vendorId}/approve`);
  return res.data;
};

export const rejectVendor = async (vendorId) => {
  const res = await API.post(`/vendors/${vendorId}/reject`);
  return res.data;
};
