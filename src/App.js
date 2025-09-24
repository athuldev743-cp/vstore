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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ role: payload.role, email: payload.email, id: payload.sub });
    } catch {}
  }, []);

  useEffect(() => {
    if (user?.role === "vendor") {
      StoreAPI.getVendorStatus(user.id)
        .then((res) => setVendorApproved(res.status === "approved"))
        .catch(() => setVendorApproved(false));
    }
  }, [user]);

  const handleLoginSuccess = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ role: payload.role, email: payload.email, id: payload.sub });
    } catch {}
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
          element={
            user?.role === "customer" ? <ApplyVendor /> : <Navigate to="/auth" />
          }
        />
        {/* Auth */}
        <Route
          path="/auth"
          element={
            user ? <Navigate to={user.role === "admin" ? "/admin" : "/"} /> : <Auth onLoginSuccess={handleLoginSuccess} />
          }
        />
        {/* Admin */}
        <Route
          path="/admin"
          element={user?.role === "admin" ? <Admin /> : <Navigate to="/" />}
        />
        {/* Vendor Add Product */}
        <Route
          path="/vendor/products"
          element={
            user?.role === "vendor" && vendorApproved ? <AddProduct /> : <Navigate to="/" />
          }
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
