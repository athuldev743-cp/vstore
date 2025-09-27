import React, { useEffect, useState, useCallback } from "react";
import * as StoreAPI from "../api/StoreAPI";
import { useNavigate } from "react-router-dom";
import "./Account.css";

export default function Account({ onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = useCallback(() => {
    console.log("Logout button clicked");
    
    if (onLogout && typeof onLogout === "function") {
      onLogout();
    } else {
      console.warn("onLogout prop not provided, using fallback");
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  }, [onLogout]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        setError("");
        const res = await StoreAPI.getCurrentUser();
        setUser(res);

        if (res.role === "vendor") {
          setProductsLoading(true);
          try {
            const products = await StoreAPI.getVendorProducts(res.id);
            console.log("Vendor products received:", products);
            
            // Handle different possible response structures
            if (Array.isArray(products)) {
              setVendorProducts(products);
            } else if (products && Array.isArray(products.data)) {
              setVendorProducts(products.data);
            } else if (products && products.products) {
              setVendorProducts(products.products);
            } else {
              console.warn("Unexpected products format:", products);
              setVendorProducts([]);
            }
          } catch (productsError) {
            console.error("Failed to load vendor products:", productsError);
            setError("Failed to load your products");
            setVendorProducts([]);
          } finally {
            setProductsLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to load account data:", err);
        setError("Failed to load account data. You may have been logged out.");
        
        if (err.message.includes("Unauthorized") || err.message.includes("401")) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [handleLogout]);

  if (loading) return <p>Loading account info...</p>;
  if (!user) return <p>User not logged in</p>;

  return (
    <div className="account-container">
      <h1>Account Details</h1>

      {error && (
        <div className="error-message" style={{color: 'red', marginBottom: '20px'}}>
          {error}
        </div>
      )}

      {/* Profile Info */}
      <section className="profile-section">
        <h2>Profile</h2>
        <div className="profile-info">
          <div className="profile-info-item">
            <span className="profile-info-label">Username</span>
            <span className="profile-info-value">{user.username}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Email</span>
            <span className="profile-info-value">{user.email}</span>
          </div>
          {user.mobile && (
            <div className="profile-info-item">
              <span className="profile-info-label">Mobile</span>
              <span className="profile-info-value">{user.mobile}</span>
            </div>
          )}
          {user.address && (
            <div className="profile-info-item">
              <span className="profile-info-label">Address</span>
              <span className="profile-info-value">{user.address}</span>
            </div>
          )}
          <div className="profile-info-item">
            <span className="profile-info-label">Role</span>
            <span className="profile-info-value">{user.role}</span>
          </div>
        </div>
      </section>

      {/* Vendor Products */}
      {user.role === "vendor" && (
        <section className="vendor-products-section">
          <h2>Your Uploaded Products</h2>
          
          {productsLoading ? (
            <p>Loading your products...</p>
          ) : error ? (
            <p style={{color: 'red'}}>{error}</p>
          ) : vendorProducts.length === 0 ? (
            <div>
              <p>No products uploaded yet.</p>
              <button 
                className="btn-add-product"
                onClick={() => navigate("/add-product")}
                style={{marginTop: '10px', padding: '8px 16px'}}
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div>
              <p><strong>Total Products: {vendorProducts.length}</strong></p>
              <ul className="product-list">
                {vendorProducts.map((product) => (
                  <li key={product.id || product._id} className="product-card">
                    <div className="product-card-header">
                      <h3 className="product-card-title">{product.name}</h3>
                    </div>
                    <div className="product-card-details">
                      <div className="product-card-detail">
                        <span className="product-card-label">Price</span>
                        <span className="product-card-value">₹{product.price}</span>
                      </div>
                      <div className="product-card-detail">
                        <span className="product-card-label">Stock</span>
                        <span className="product-card-value">{product.stock} kg</span>
                      </div>
                    </div>
                    <button
                      className="btn-update"
                      onClick={() => navigate(`/update-product/${product.id || product._id}`)}
                    >
                      Update Product
                    </button>
                  </li>
                ))}
              </ul>
            </div>
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
      
      {/* Enhanced debug button */}
      <button 
        onClick={() => {
          console.log("=== DEBUG INFO ===");
          console.log("Token:", localStorage.getItem("token"));
          console.log("User:", user);
          console.log("Vendor Products:", vendorProducts);
          console.log("User ID:", user?.id);
          console.log("User Role:", user?.role);
        }}
        style={{marginLeft: '10px', background: '#f0f0f0', color: '#333'}}
      >
        Debug Info
      </button>
    </div>
  );
}