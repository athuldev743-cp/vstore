import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import ProductCard from "./ProductCard";
import { User, RefreshCw } from "lucide-react";
import "./Home.css";

export default function Home({ user }) {
  const navigate = useNavigate();

  // -------------------------
  // States
  // -------------------------
  const [userLoaded, setUserLoaded] = useState(false);
  const [vendorApproved, setVendorApproved] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // -------------------------
  // Mark user as loaded
  // -------------------------
  useEffect(() => {
    if (user !== undefined) setUserLoaded(true);
  }, [user]);

  // -------------------------
  // Fetch vendor approval status
  // -------------------------
  const fetchVendorStatus = useCallback(async () => {
    if (user?.id) {
      try {
        const res = await StoreAPI.getVendorStatus(user.id);
        const isApproved = res.status?.toLowerCase() === "approved";
        setVendorApproved(isApproved);
      } catch (error) {
        setVendorApproved(false);
      }
    } else {
      setVendorApproved(false);
    }
  }, [user]);

  // Check vendor status when user changes AND periodically
  useEffect(() => {
    if (user?.id) {
      fetchVendorStatus();
      
      // Check every 30 seconds for status updates
      const interval = setInterval(fetchVendorStatus, 30000);
      return () => clearInterval(interval);
    } else {
      setVendorApproved(false);
    }
  }, [user, fetchVendorStatus]);

  // -------------------------
  // Fetch all products
  // -------------------------
  const fetchProducts = useCallback(() => {
    setLoadingProducts(true);
    StoreAPI.listProducts()
      .then(setProducts)
      .catch((err) => console.error("Failed to load products:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // -------------------------
  // Manual refresh function
  // -------------------------
  const handleRefresh = () => {
    fetchVendorStatus();
    fetchProducts();
  };

  // -------------------------
  // Navigate to Add Product page
  // -------------------------
  const handleAddProduct = () => {
    navigate("/vendor/products");
  };

  // -------------------------
  // Render Loading State
  // -------------------------
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

  // -------------------------
  // Render Home Page
  // -------------------------
  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="logo">VStore</h1>
        <div className="header-buttons">
          {/* Auth Button */}
          {!user && (
            <button onClick={() => navigate("/auth")}>Sign Up / Login</button>
          )}

          {/* Apply Vendor Button */}
          {user?.role === "customer" && !vendorApproved && (
            <button onClick={() => navigate("/apply-vendor")}>
              Apply as Vendor
            </button>
          )}

          {/* Vendor Add Product - Navigate to AddProduct page */}
          {vendorApproved && (
            <button 
              onClick={handleAddProduct}
              className="add-product-btn"
            >
              ➕ Add Product
            </button>
          )}

          {/* Refresh Button */}
          {user && (
            <button 
              onClick={handleRefresh}
              className="refresh-btn"
              title="Refresh status"
            >
              <RefreshCw size={16} />
            </button>
          )}

          {/* Admin Panel */}
          {user?.role === "admin" && (
            <button onClick={() => navigate("/admin")}>🛠 Admin</button>
          )}

          {/* Account Button */}
          {user && (
            <button
              className="btn-account"
              onClick={() => navigate("/account")}
              title="Account"
            >
              <User size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="home-content">
        {/* Products Section */}
        <h2>Products</h2>
        {loadingProducts ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products available.</p>
        ) : (
          <div className="products-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} user={user} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}