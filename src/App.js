import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import ApplyVendor from "./pages/ApplyVendor";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AddProduct from "./pages/AddProduct";
import ProductDetailsPage from "./pages/ProductDetails";
import Account from "./pages/Account";
import UpdatedProduct from "./pages/UpdateProduct";
import * as StoreAPI from "./api/StoreAPI";

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true); // ✅ important
  const navigate = useNavigate();

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

  useEffect(() => {
    const initUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setUser(null);
          return;
        }

        const decoded = decodeToken(token);
        if (!decoded) {
          localStorage.removeItem("token");
          setUser(null);
          return;
        }

        // ✅ set user immediately so routes don't redirect on slow devices
        let currentUser = { ...decoded };
        setUser(currentUser);

        if (currentUser.role === "vendor") {
          try {
            const status = await StoreAPI.getVendorStatus(currentUser.id);
            currentUser = { ...currentUser, vendorApproved: status.status === "approved" };
          } catch {
            currentUser = { ...currentUser, vendorApproved: false };
          }
          setUser(currentUser);
        }
      } finally {
        setBooting(false);
      }
    };

    initUser();
  }, []);

  const handleLoginSuccess = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const decoded = decodeToken(token);
    if (!decoded) return;

    let currentUser = { ...decoded };
    setUser(currentUser);

    if (currentUser.role === "vendor") {
      try {
        const status = await StoreAPI.getVendorStatus(currentUser.id);
        currentUser = { ...currentUser, vendorApproved: status.status === "approved" };
      } catch {
        currentUser = { ...currentUser, vendorApproved: false };
      }
      setUser(currentUser);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  // ✅ small guards
  const RequireAuth = ({ children }) => {
    if (booting) return <div style={{ padding: 16 }}>Loading...</div>;
    return user ? children : <Navigate to="/auth" />;
  };

  const RequireVendor = ({ children }) => {
    if (booting) return <div style={{ padding: 16 }}>Loading...</div>;
    return user?.role === "vendor" ? children : <Navigate to="/" />;
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
        element={
          user ? <Navigate to={user.role === "admin" ? "/admin" : "/"} /> : <Auth onLoginSuccess={handleLoginSuccess} />
        }
      />

      <Route path="/admin" element={user?.role === "admin" ? <Admin /> : <Navigate to="/" />} />

      {/* ✅ FIXED: no redirect while booting */}
      <Route
        path="/vendor/products"
        element={
          <RequireVendor>
            <AddProduct />
          </RequireVendor>
        }
      />

      <Route
        path="/account"
        element={
          <RequireAuth>
            <Account user={user} onLogout={handleLogout} />
          </RequireAuth>
        }
      />

      <Route
        path="/product/:productId/edit"
        element={user?.role === "vendor" ? <UpdatedProduct user={user} /> : <Navigate to="/" />}
      />

      <Route path="/products/:productId" element={<ProductDetailsPage user={user} />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}