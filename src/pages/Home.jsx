import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import AddProduct from "./AddProduct";
import "./Home.css";

export default function Home({ user, onLogout }) {
  const navigate = useNavigate();
  const SUPER_ADMIN_EMAIL = "your_email@example.com"; // Replace with your email

  const [vendorApproved, setVendorApproved] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  // Update vendorApproved if user is vendor
  useEffect(() => {
    if (user?.role === "vendor") {
      StoreAPI.getVendorStatus(user.id)
        .then((res) => setVendorApproved(res.status === "approved"))
        .catch(() => setVendorApproved(false));
    } else {
      setVendorApproved(false);
    }
  }, [user]);

  // Fetch all approved vendors
  useEffect(() => {
    setLoadingVendors(true);
    StoreAPI.listVendors()
      .then(setVendors)
      .catch((err) => console.error("Failed to load vendors:", err))
      .finally(() => setLoadingVendors(false));
  }, []);

  const handleVendorClick = (vendorId) => navigate(`/vendor/${vendorId}`);

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="logo">VStore</h1>
        <div className="header-buttons">
          {!user && <button onClick={() => navigate("/auth")}>Sign Up / Login</button>}

          {user?.role === "customer" && !vendorApproved && (
            <button onClick={() => navigate("/apply-vendor")}>Apply as Vendor</button>
          )}

          {user?.role === "vendor" && vendorApproved && (
            <button
              onClick={() =>
                document.querySelector(".add-product-container")?.scrollIntoView({ behavior: "smooth" })
              }
            >
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
              <div className="add-product-container">
                <AddProduct onProductAdded={() => alert("Product added successfully!")} />
              </div>
            )}

            <h2>Available Stores</h2>
            {loadingVendors ? (
              <p>Loading stores...</p>
            ) : vendors.length === 0 ? (
              <p>No stores available.</p>
            ) : (
              <ul className="vendor-list">
                {vendors.map((v) => (
                  <li key={v.id} className="vendor-card" onClick={() => handleVendorClick(v.id)}>
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
