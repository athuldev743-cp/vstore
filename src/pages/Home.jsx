import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import AddProduct from "./AddProduct";
import "./Home.css";

export default function Home({ user, onLogout }) {
  const navigate = useNavigate();

  const [vendorApproved, setVendorApproved] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  // Check vendor status
  useEffect(() => {
    if (user?.role === "vendor") {
      StoreAPI.getVendorStatus(user.id)
        .then((res) => setVendorApproved(res.status === "approved"))
        .catch(() => setVendorApproved(false));
    } else {
      setVendorApproved(false);
    }
  }, [user]);

  // Fetch approved vendors
  useEffect(() => {
    setLoadingVendors(true);
    StoreAPI.listVendors()
      .then(setVendors)
      .catch((err) => console.error("Failed to load vendors:", err))
      .finally(() => setLoadingVendors(false));
  }, []);

  const handleVendorClick = (vendorId) => {
    navigate(`/vendor/${vendorId}`); // only navigate, do NOT show add product
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="logo">VStore</h1>
        <div className="header-buttons">
          {!user && <button onClick={() => navigate("/auth")}>Sign Up / Login</button>}

          {/* Customer */}
          {user?.role === "customer" && !vendorApproved && (
            <button onClick={() => navigate("/apply-vendor")}>Apply as Vendor</button>
          )}

          {/* Vendor Add Product button (always visible if approved) */}
          {user?.role === "vendor" && vendorApproved && (
            <button onClick={() => setShowAddProduct(!showAddProduct)}>
              {showAddProduct ? "➖ Close Add Product" : "➕ Add Product"}
            </button>
          )}

          {/* Admin */}
          {user?.role === "admin" && <button onClick={() => navigate("/admin")}>🛠 Admin</button>}

          {/* Logout */}
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
            {/* Vendor Add Product Form */}
            {showAddProduct && (
              <div className="add-product-container">
                <AddProduct onProductAdded={() => alert("Product added successfully!")} />
              </div>
            )}

            {/* Stores */}
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
