// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import AddProduct from "./AddProduct";
import "./Home.css";

export default function Home({ user, onLogout }) {
  const navigate = useNavigate();
  const SUPER_ADMIN_EMAIL = "your_email@example.com"; // replace with your email
  const [vendorApproved, setVendorApproved] = useState(false);
  const [vendors, setVendors] = useState([]);

  // Fetch vendor status for logged-in user
  useEffect(() => {
    if (user?.role === "vendor" || user?.role === "customer") {
      StoreAPI.getVendorStatus(user._id)
        .then((res) => setVendorApproved(res.status === "approved"))
        .catch((err) => console.error(err));
    }
  }, [user]);

  // Fetch all approved vendors to show on Home page
  useEffect(() => {
    if (user) {
      StoreAPI.listVendors()
        .then(setVendors)
        .catch((err) => console.error("Failed to load vendors:", err));
    }
  }, [user]);

  const handleVendorClick = (vendorId) => {
    navigate(`/vendor/${vendorId}`);
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="logo">VStore</h1>
        <div className="header-buttons">
          {!user && <button onClick={() => navigate("/auth")}>Sign Up / Login</button>}

          {user?.role === "customer" && (
            <button onClick={() => navigate("/apply-vendor")}>Apply as Vendor</button>
          )}

          {user?.role === "vendor" && vendorApproved && (
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
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
        ) : (
          <>
            {user.role === "vendor" && vendorApproved && (
              <div>
                <AddProduct onProductAdded={() => alert("Product added successfully!")} />
              </div>
            )}

            <h2>Available Stores</h2>
            {vendors.length === 0 ? (
              <p>No stores available.</p>
            ) : (
              <ul className="vendor-list">
                {vendors.map((v) => (
                  <li
                    key={v.id}
                    className="vendor-card"
                    onClick={() => handleVendorClick(v.id)}
                  >
                    <strong>{v.shop_name || "Unnamed Store"}</strong>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
 