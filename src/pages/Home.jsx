import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import AddProduct from "./AddProduct";
import "./Home.css";

export default function Home({ user, onLogout }) {
  const navigate = useNavigate();

  const [userLoaded, setUserLoaded] = useState(false); // Tracks when user loading is done
  const [vendorApproved, setVendorApproved] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  // --------------------------
  // Set userLoaded flag once user is fetched (even if null)
  // --------------------------
  useEffect(() => {
    if (user !== undefined) {
      setUserLoaded(true);
    }
  }, [user]);

  // --------------------------
  // Fetch vendor approval status
  // --------------------------
  const fetchVendorStatus = useCallback(() => {
    if (user?.role === "vendor" && user.id) {
      StoreAPI.getVendorStatus(user.id)
        .then((res) => {
          const approved = res.status?.toLowerCase() === "approved";
          setVendorApproved(approved);
        })
        .catch((err) => {
          console.error("Failed to fetch vendor status:", err);
          setVendorApproved(false);
        });
    } else {
      setVendorApproved(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "vendor" && user.id) {
      fetchVendorStatus();
    }
  }, [user, fetchVendorStatus]);

  // Optional: Poll every 10 seconds to auto-update vendor status
  useEffect(() => {
    if (user?.role === "vendor") {
      const interval = setInterval(() => {
        fetchVendorStatus();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user, fetchVendorStatus]);

  // --------------------------
  // Fetch approved vendors
  // --------------------------
  const fetchVendors = useCallback(() => {
    setLoadingVendors(true);
    StoreAPI.listVendors()
      .then(setVendors)
      .catch((err) => console.error("Failed to load vendors:", err))
      .finally(() => setLoadingVendors(false));
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleVendorClick = (vendorId) => {
    navigate(`/vendor/${vendorId}`);
  };

  // --------------------------
  // Show loading screen until userLoaded
  // --------------------------
  if (!userLoaded) {
    return (
      <div className="home-container">
        <header className="home-header">
          <h1 className="logo">VStore</h1>
        </header>
        <main className="home-content">
          <p>Loading user information...</p>
        </main>
      </div>
    );
  }

  // --------------------------
  // Main UI
  // --------------------------
  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="logo">VStore</h1>
        <div className="header-buttons">
          {/* Guest */}
          {!user && <button onClick={() => navigate("/auth")}>Sign Up / Login</button>}

          {/* Customer */}
          {user?.role === "customer" && !vendorApproved && (
            <button onClick={() => navigate("/apply-vendor")}>Apply as Vendor</button>
          )}

          {/* Vendor Add Product */}
          {user?.role === "vendor" && vendorApproved && (
            <button onClick={() => setShowAddProduct(!showAddProduct)}>
              {showAddProduct ? "➖ Close Add Product" : "➕ Add Product"}
            </button>
          )}

          {/* Admin */}
          {user?.role === "admin" && <button onClick={() => navigate("/admin")}>🛠 Admin</button>}

          {/* Logout visible for all logged-in users */}
          {user && <button onClick={onLogout}>Logout</button>}
        </div>
      </header>

      <main className="home-content">
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
      </main>
    </div>
  );
}
