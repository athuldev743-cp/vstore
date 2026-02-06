// src/pages/Account.jsx
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
    if (onLogout && typeof onLogout === "function") {
      onLogout();
    } else {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  }, [onLogout]);

  useEffect(() => {
    let cancelled = false;

    async function fetchUserData() {
      try {
        setError("");

        const me = await StoreAPI.getCurrentUser();
        if (cancelled) return;

        setUser(me);

        if (me?.role === "vendor") {
          setProductsLoading(true);
          try {
            let myProducts = await StoreAPI.getMyProducts(); // /api/store/vendor/products
            if (!Array.isArray(myProducts)) myProducts = [];
            if (cancelled) return;
            setVendorProducts(myProducts);
          } catch (e) {
            if (cancelled) return;
            setVendorProducts([]);
            setError("Failed to load your products: " + (e?.message || "Unknown error"));
          } finally {
            if (!cancelled) setProductsLoading(false);
          }
        }
      } catch (err) {
        if (cancelled) return;
        setError("Failed to load account data. You may have been logged out.");
        if (String(err?.message || "").includes("Unauthorized") || String(err?.message || "").includes("401")) {
          handleLogout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchUserData();
    return () => {
      cancelled = true;
    };
  }, [handleLogout]);

  const handleUpdateProperty = (product) => {
    const pid = product?.id || product?._id;
    navigate(`/product/${pid}/edit`, { state: { product } });
  };

  const handleDeleteProduct = async (product) => {
    const pid = product?.id || product?._id;
    if (!pid) return;

    const ok = window.confirm("Delete this product? This cannot be undone.");
    if (!ok) return;

    try {
      await StoreAPI.deleteProduct(pid);
      setVendorProducts((prev) => prev.filter((p) => (p?.id || p?._id) !== pid));
    } catch (e) {
      alert(e?.message || "Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="account-container">
        <div className="loading-spinner">Loading account info...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="account-container">
        <div className="error-message">User not logged in</div>
      </div>
    );
  }

  return (
    <div className="account-container">
      <header className="account-header">
        <h1 className="account-title">Account Details</h1>

        {user.role === "vendor" && (
         <button
  className="btn-add-product"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("ADD PRODUCT CLICKED");
    navigate("/vendor/products");
  }}
>
  ➕ Add Product
</button>
        )}
      </header>

      {error && <div className="error-message">{error}</div>}

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

      {user.role === "vendor" && (
        <section className="vendor-products-section">
          <div className="section-header">
            <h2 className="section-title">Your Products</h2>
            <span className="products-count">({vendorProducts.length} products)</span>
          </div>

          {productsLoading ? (
            <div className="loading-spinner">Loading your products...</div>
          ) : vendorProducts.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No products uploaded yet.</p>
            </div>
          ) : (
            <div className="products-grid">
              {vendorProducts.map((product) => {
                const pid = product?.id || product?._id;

                return (
                  <div key={pid} className="product-card">
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
                        <button className="btn-update-property" onClick={() => handleUpdateProperty(product)}>
                          Update
                        </button>

                        <button className="btn-delete-product" onClick={() => handleDeleteProduct(product)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <div className="action-buttons">
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>

        <button
          className="btn-debug"
          onClick={() => {
            console.log("=== DEBUG INFO ===");
            console.log("Token:", localStorage.getItem("token"));
            console.log("User:", user);
            console.log("Vendor Products:", vendorProducts);
          }}
        >
          Debug Info
        </button>
      </div>
    </div>
  );
}
