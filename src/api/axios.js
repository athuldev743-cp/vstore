// api/axios.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://virtual-store-backed.onrender.com/api", // backend URL
});

// Add token automatically to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
