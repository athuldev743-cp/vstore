// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import ApplyVendor from "./pages/ApplyVendor";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AddProduct from "./pages/AddProduct";
import Products from "./pages/Products";
import * as StoreAPI from "./api/StoreAPI";

export default function App() {
  const [user, setUser] = useState(null);

  // Fetch current user on app load
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const currentUser = await StoreAPI.getCurrentUser();

        if (currentUser.role === "vendor") {
          const status = await StoreAPI.getVendorStatus(currentUser.id);
          currentUser.vendorApproved = status.status === "approved";
        }

        setUser(currentUser);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const handleLoginSuccess = async () => {
    // After login/signup, refetch user data
    try {
      const currentUser = await StoreAPI.getCurrentUser();

      if (currentUser.role === "vendor") {
        const status = await StoreAPI.getVendorStatus(currentUser.id);
        currentUser.vendorApproved = status.status === "approved";
      }

      setUser(currentUser);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={<Home user={user} onLogout={handleLogout} />}
        />

        {/* Apply Vendor */}
        <Route
          path="/apply-vendor"
          element={user?.role === "customer" ? <ApplyVendor /> : <Navigate to="/auth" />}
        />

        {/* Auth */}
        <Route
          path="/auth"
          element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/"} /> : <Auth onLoginSuccess={handleLoginSuccess} />}
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={user?.role === "admin" ? <Admin /> : <Navigate to="/" />}
        />

        {/* Vendor Add Product */}
        <Route
          path="/vendor/products"
          element={user?.role === "vendor" && user.vendorApproved ? <AddProduct /> : <Navigate to="/" />}
        />

        {/* Vendor Products */}
        <Route
          path="/vendor/:vendorId"
          element={<Products />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
