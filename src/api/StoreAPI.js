import axios from "axios";

const BASE_URL = "https://virtual-store-backed.onrender.com/api/store";

const API = axios.create({ baseURL: BASE_URL });

// Attach token from localStorage to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      alert("Session expired. Please login again.");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const signup = async (data) => {
  const res = await axios.post(
    "https://virtual-store-backed.onrender.com/api/users/signup",
    data
  );
  return res.data;
};

export const login = async (data) => {
  const res = await axios.post(
    "https://virtual-store-backed.onrender.com/api/users/login",
    data
  );
  return res.data;
};

// -------------------------
// Products & Orders
// -------------------------
export const listProducts = async () => (await API.get("/products")).data || [];
export const getOrders = async () => (await API.get("/orders")).data || [];
export const placeOrder = async (productId, quantity = 1) =>
  (await API.post("/orders", { product_id: productId, quantity })).data;

// -------------------------
// Vendors
// -------------------------
export const listPendingVendors = async () =>
  (await API.get("/vendors/pending")).data || [];

export const applyVendor = async (data) =>
  (await API.post("/apply-vendor", data)).data;

export const approveVendor = async (vendorId) =>
  (await API.post(`/vendors/${vendorId}/approve`)).data;

export const rejectVendor = async (vendorId) =>
  (await API.post(`/vendors/${vendorId}/reject`)).data;
