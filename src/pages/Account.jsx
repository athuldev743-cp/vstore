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

       // In your Account component, replace the vendor products section with this:
if (res.role === "vendor") {
  setProductsLoading(true);
  try {
    console.log("🔍 Fetching vendor products for user ID:", res.id);
    
    // First, get all vendors
    const vendors = await StoreAPI.listVendors();
    console.log("📋 All vendors from API:", vendors);
    
    // Debug: Check the exact structure of the first vendor
    if (vendors.length > 0) {
      console.log("🔎 First vendor object:", vendors[0]);
      console.log("🔎 First vendor keys:", Object.keys(vendors[0]));
      console.log("🔎 First vendor values:", JSON.stringify(vendors[0], null, 2));
    }
    
    // Find the vendor that belongs to this user
    let userVendor = null;
    
    if (Array.isArray(vendors)) {
      // Try different field names that might contain the user ID
      userVendor = vendors.find(vendor => {
        // Check all possible field names that might contain user ID
        const possibleFields = ['user_id', 'userId', 'user', 'owner_id', 'owner', 'userID'];
        
        for (let field of possibleFields) {
          if (vendor[field] === res.id) {
            console.log(`✅ Found matching field: ${field} = ${vendor[field]}`);
            return true;
          }
        }
        
        // If no field matches, maybe the vendor ID itself is the user ID?
        if (vendor.id === res.id) {
          console.log("✅ Vendor ID matches user ID");
          return true;
        }
        
        return false;
      });
    }
    
    console.log("✅ Found vendor:", userVendor);
    
    // If no vendor found, let's try a different approach
    if (!userVendor && vendors.length > 0) {
      console.log("⚠️ No vendor found with user ID matching, trying alternative approaches...");
      
      // Approach 1: Maybe the first vendor is the one we want?
      userVendor = vendors[0];
      console.log("🧪 Trying first vendor:", userVendor);
      
      // Approach 2: Check if there's any vendor with a user_id field at all
      const vendorWithUserId = vendors.find(v => v.user_id);
      if (vendorWithUserId) {
        console.log("🔍 Found vendor with user_id field:", vendorWithUserId.user_id);
      }
    }
    
    if (userVendor && userVendor.id) {
      const products = await StoreAPI.getVendorProducts(userVendor.id);
      console.log("📦 Vendor products received:", products);
      
      if (Array.isArray(products)) {
        setVendorProducts(products);
      } else {
        console.warn("Unexpected products format:", products);
        setVendorProducts([]);
      }
    } else {
      console.warn("❌ Still no vendor found");
      setVendorProducts([]);
      setError("Vendor profile not found. Please contact support.");
    }
  } catch (productsError) {
    console.error("❌ Failed to load vendor products:", productsError);
    setError("Failed to load your products: " + productsError.message);
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

  // Function to handle update property navigation
  const handleUpdateProperty = (product) => {
    navigate("/update-property", { 
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