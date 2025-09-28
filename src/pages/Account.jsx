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
            console.log("🔍 User is vendor, fetching products...");
            
            // TEMPORARY: Get all products until backend endpoint is ready
            const allProducts = await StoreAPI.listProducts();
            console.log("📦 Products loaded:", allProducts);
            
            // For now, show all products (or filter them if you can identify user's products)
            setVendorProducts(Array.isArray(allProducts) ? allProducts : []);
            
          } catch (error) {
            console.error("❌ Error loading products:", error);
            
            // If the endpoint doesn't exist, use a fallback
            if (error.message.includes("404") || error.message.includes("Not Found")) {
              setError("Vendor features coming soon. Backend update required.");
            } else {
              setError("Failed to load products: " + error.message);
            }
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

  // Function to handle update property navigation - FIXED ROUTE
  const handleUpdateProperty = (product) => {
    console.log("🔄 Navigating to update product:", product.id);
    
    // Use the correct route that matches App.js
    navigate(`/product/${product.id}/edit`, { 
      state: { product } 
    });
  };

  if (loading) return (
    <div className="account-container">
      <div className="loading-spinner">Loading account info...</div>
    </div>
  );
  
  if (!user) return (
    <div className="account-container">
      <div className="error-message">User not logged in</div>
    </div>
  );

  return (
    <div className="account-container">
      <header className="account-header">
        <h1 className="account-title">Account Details</h1>
        
        {/* Add Product Button - Only for Vendors */}
        {user.role === "vendor" && (
          <button 
            className="btn-add-product"
            onClick={() => navigate("/vendor/products")}
          >
            ➕ Add Product
          </button>
        )}
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Profile Info */}
      <section className="profile-section">
        <h2 className="section-title">Profile Information</h2>
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
            <span className="profile-info-value role-badge">{user.role}</span>
          </div>
        </div>
      </section>

      {/* Vendor Products Section */}
      {user.role === "vendor" && (
        <section className="vendor-products-section">
          <div className="section-header">
            <h2 className="section-title">Your Products</h2>
            <span className="products-count">({vendorProducts.length} products)</span>
          </div>
          
          {productsLoading ? (
            <div className="loading-spinner">Loading your products...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : vendorProducts.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No products uploaded yet.</p>
              <button 
                className="btn-add-product"
                onClick={() => navigate("/vendor/products")}
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {vendorProducts.map((product) => (
                <div key={product.id || product._id} className="product-card">
                  {product.image_url && (
                    <div className="product-image">
                      <img src={product.image_url} alt={product.name} />
                    </div>
                  )}
                  <div className="product-info">
                    <h3 className="product-title">{product.name}</h3>
                    <div className="product-details">
                      <div className="product-detail">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value">₹{product.price}</span>
                      </div>
                      <div className="product-detail">
                        <span className="detail-label">Stock:</span>
                        <span className="detail-value">{product.stock} kg</span>
                      </div>
                      {product.description && (
                        <div className="product-detail-full">
                          <span className="detail-label">Description:</span>
                          <span className="detail-value">{product.description}</span>
                        </div>
                      )}
                    </div>
                    <div className="product-actions">
                      <button
                        className="btn-update-property"
                        onClick={() => handleUpdateProperty(product)}
                      >
                        Update Property
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="action-buttons">
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
        
        {/* Enhanced debug button */}
        <button className="btn-debug" onClick={() => {
          console.log("=== DEBUG INFO ===");
          console.log("Token:", localStorage.getItem("token"));
          console.log("User:", user);
          console.log("Vendor Products:", vendorProducts);
          console.log("User ID:", user?.id);
          console.log("User Role:", user?.role);
        }}>
          Debug Info
        </button>
      </div>
    </div>
  );
}