import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import ApplyVendor from "./pages/ApplyVendor";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AddProduct from "./pages/AddProduct";
import ProductDetailsPage from "./pages/ProductDetails"; // Full-page product details
import Account from "./pages/Account";
import UpdatedProduct from "./pages/UpdateProduct";
import * as StoreAPI from "./api/StoreAPI";

export default function App() {
  const [user, setUser] = useState(null);
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
  }, []);

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
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
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
          user ? (
            <Navigate to={user.role === "admin" ? "/admin" : "/"} />
          ) : (
            <Auth onLoginSuccess={handleLoginSuccess} />
          )
        }
      />

      <Route
        path="/admin"
        element={user?.role === "admin" ? <Admin /> : <Navigate to="/" />}
      />

      <Route
  path="/vendor/products"
  element={user?.role === "vendor" ? <AddProduct /> : <Navigate to="/" />}
/>


      <Route
        path="/account"
        element={user ? <Account user={user} onLogout={handleLogout} /> : <Navigate to="/auth" />}
      />

      <Route
        path="/product/:productId/edit"
        element={user?.role === "vendor" ? <UpdatedProduct user={user} /> : <Navigate to="/" />}
      />

      {/* Mobile-friendly product details page */}
      <Route path="/products/:productId" element={<ProductDetailsPage user={user} />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
