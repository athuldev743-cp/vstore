// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./Home.css";

export default function Home({ user, vendorApproved, onLogout }) {
  const navigate = useNavigate();
  const SUPER_ADMIN_EMAIL = "your_email@example.com"; // replace with your email

  function VendorList() {
    const [vendors, setVendors] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
      StoreAPI.listVendors()
        .then(setVendors)
        .catch((err) => console.error("Failed to load vendors:", err));
    }, []);

    if (vendors.length === 0) return <p>No stores available.</p>;

    return (
      <ul className="vendor-list">
        {vendors.map((v) => (
          <li
            key={v.id}
            className="vendor-card"
            onClick={() => navigate(`/vendor/${v.id}`)}
          >
            <strong>{v.store_name || "Unnamed Store"}</strong>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="logo">VStore</h1>
        <div className="header-buttons">
          {!user && (
            <button onClick={() => navigate("/auth")}>Sign Up / Login</button>
          )}

          {user?.role === "customer" && (
            <button onClick={() => navigate("/apply-vendor")}>
              Apply as Vendor
            </button>
          )}

          {user?.role === "vendor" && vendorApproved && (
            <button onClick={() => navigate("/vendor/products")}>
              ➕ Add Product
            </button>
          )}

          {user?.email === SUPER_ADMIN_EMAIL && (
            <button onClick={() => navigate("/admin")}>🛠 Admin</button>
          )}

          {user && <button onClick={onLogout}>Logout</button>}
        </div>
      </header>

      <main className="home-content">
        {!user ? (
          <div className="welcome">
            <h2>Welcome to VStore!</h2>
            <p>Sign up or login to see products and place orders.</p>
          </div>
        ) : user.role === "customer" ? (
          <div>
            <h2>Stores</h2>
            <VendorList />
          </div>
        ) : (
          <div className="welcome">
            <h2>Welcome, {user.role}!</h2>
            <p>
              {user.role === "vendor"
                ? vendorApproved
                  ? "You can now add products."
                  : "Your vendor application is pending approval."
                : "You are a super admin."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
