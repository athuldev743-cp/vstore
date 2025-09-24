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
  const [vendorApproved, setVendorApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // Fetch current user & vendor status
  // -------------------------
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await StoreAPI.getCurrentUser();
        setUser(currentUser);

        if (currentUser.role === "vendor") {
          const status = await StoreAPI.getVendorStatus(currentUser.id);
          setVendorApproved(status.status === "approved");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLoginSuccess = async () => {
    try {
      const currentUser = await StoreAPI.getCurrentUser();
      setUser(currentUser);

      if (currentUser.role === "vendor") {
        const status = await StoreAPI.getVendorStatus(currentUser.id);
        setVendorApproved(status.status === "approved");
      }
    } catch (err) {
      console.error("Login fetch user failed:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setVendorApproved(false);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            <Home
              user={user}
              vendorApproved={vendorApproved}
              onLogout={handleLogout}
            />
          }
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
          element={user?.role === "vendor" && vendorApproved ? <AddProduct /> : <Navigate to="/" />}
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
