import React, { useEffect, useState, useCallback } from "react";
import * as StoreAPI from "../api/StoreAPI";
import { useNavigate } from "react-router-dom";
import "./Account.css";

export default function Account({ onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define handleLogout first so it can be used in useEffect
  const handleLogout = useCallback(() => {
    console.log("Logout button clicked");
    
    // If onLogout prop is provided, use it
    if (onLogout && typeof onLogout === "function") {
      onLogout();
    } else {
      // Fallback logout logic
      console.warn("onLogout prop not provided, using fallback");
      localStorage.removeItem("token");
      window.location.href = "/"; // Force redirect
    }
  }, [onLogout]); // Add onLogout as dependency

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await StoreAPI.getCurrentUser();
        setUser(res);

        if (res.role === "vendor") {
          const products = await StoreAPI.getVendorProducts(res.id);
          setVendorProducts(products);
        }
      } catch (err) {
        console.error("Failed to load account data:", err);
        alert("Failed to load account data. You may have been logged out.");
        // Auto-redirect if unauthorized
        if (err.message.includes("Unauthorized") || err.message.includes("401")) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [handleLogout]); // Add handleLogout to dependencies

  if (loading) return <p>Loading account info...</p>;
  if (!user) return <p>User not logged in</p>;

  return (
    <div className="account-container">
      <h1>Account Details</h1>

      {/* Profile Info */}
      <section className="profile-section">
        <h2>Profile</h2>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        {user.mobile && <p><strong>Mobile:</strong> {user.mobile}</p>}
        {user.address && <p><strong>Address:</strong> {user.address}</p>}
        <p><strong>Role:</strong> {user.role}</p>
      </section>

      {/* Vendor Products */}
      {user.role === "vendor" && (
        <section className="vendor-products-section">
          <h2>Your Uploaded Products</h2>
          {vendorProducts.length === 0 ? (
            <p>No products uploaded yet.</p>
          ) : (
            <ul className="product-list">
              {vendorProducts.map((product) => (
                <li key={product.id} className="product-card">
                  <p><strong>{product.name}</strong></p>
                  <p>Price: ₹{product.price}</p>
                  <p>Stock: {product.stock} kg</p>
                  <button
                    className="btn-update"
                    onClick={() => navigate(`/update-product/${product.id}`)}
                  >
                    Update Product
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <button 
        className="btn-logout" 
        onClick={handleLogout}
        style={{marginTop: '20px', padding: '10px 20px'}}
      >
        Logout
      </button>
      
      {/* Debug button */}
      <button 
        onClick={() => {
          console.log("Token:", localStorage.getItem("token"));
          console.log("onLogout function:", onLogout);
        }}
        style={{marginLeft: '10px', background: '#f0f0f0', color: '#333'}}
      >
        Debug
      </button>
    </div>
  );
}