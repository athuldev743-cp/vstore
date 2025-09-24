// App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import ApplyVendor from "./pages/ApplyVendor";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AddProduct from "./pages/AddProduct";
import Products from "./pages/Products";
import * as StoreAPI from "./api/StoreAPI";

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Decode JWT token
  const decodeToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        id: payload.sub,
        role: payload.role,
        email: payload.email || "",
      };
    } catch {
      return null;
    }
  };

  // -------------------------
  // Fetch current user on app load
  // -------------------------
  useEffect(() => {
    const initUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const decoded = decodeToken(token);
      if (!decoded) {
        localStorage.removeItem("token");
        return;
      }

      let currentUser = { ...decoded };

      if (currentUser.role === "vendor") {
        try {
          const status = await StoreAPI.getVendorStatus(currentUser.id);
          currentUser.vendorApproved = status.status === "approved";
        } catch {
          currentUser.vendorApproved = false;
        }
      }

      setUser(currentUser);
    };

    initUser();
  }, [navigate]);

  // -------------------------
  // After login/signup
  // -------------------------
  const handleLoginSuccess = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const decoded = decodeToken(token);
    if (!decoded) return;

    let currentUser = { ...decoded };

    if (currentUser.role === "vendor") {
      try {
        const status = await StoreAPI.getVendorStatus(currentUser.id);
        currentUser.vendorApproved = status.status === "approved";
      } catch {
        currentUser.vendorApproved = false;
      }
    }

    setUser(currentUser);

    // Navigate after login based on role
    if (currentUser.role === "admin") navigate("/admin");
    else navigate("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/auth");
  };

  return (
    <Routes>
      <Route path="/" element={<Home user={user} onLogout={handleLogout} />} />

      <Route
        path="/apply-vendor"
        element={user?.role === "customer" ? <ApplyVendor /> : <Navigate to="/" />}
      />

      <Route
        path="/auth"
        element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/"} /> : <Auth onLoginSuccess={handleLoginSuccess} />}
      />

      <Route path="/admin" element={user?.role === "admin" ? <Admin /> : <Navigate to="/" />} />

      <Route
        path="/vendor/products"
        element={user?.role === "vendor" && user.vendorApproved ? <AddProduct /> : <Navigate to="/" />}
      />

      <Route path="/vendor/:vendorId" element={<Products />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
