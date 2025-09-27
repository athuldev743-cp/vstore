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
  const [statusLoading, setStatusLoading] = useState(false);

  // -------------------------
  // Mark user as loaded
  // -------------------------
  useEffect(() => {
    if (user !== undefined) setUserLoaded(true);
  }, [user]);

  // -------------------------
  // Fetch vendor approval status - FIXED VERSION
  // -------------------------
  const fetchVendorStatus = useCallback(async () => {
    // If no user or user is not a customer, don't check vendor status
    if (!user || user.role !== "customer") {
      setVendorApproved(false);
      return;
    }

    setStatusLoading(true);
    try {
      // Use the current user's ID - check different possible ID properties
      const userId = user.id || user._id || user.userId;
      
      if (!userId) {
        console.warn("No user ID found for vendor status check");
        setVendorApproved(false);
        return;
      }

      const res = await StoreAPI.getVendorStatus(userId);
      console.log("Vendor status response:", res); // Debug log
      
      const isApproved = res.status?.toLowerCase() === "approved";
      setVendorApproved(isApproved);
    } catch (error) {
      console.error("Error fetching vendor status:", error);
      setVendorApproved(false);
    } finally {
      setStatusLoading(false);
    }
  }, [user]);

  // Check vendor status when user changes
  useEffect(() => {
    fetchVendorStatus();
    
    // Only set up interval for customers who might become vendors
    if (user?.role === "customer") {
      const interval = setInterval(fetchVendorStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchVendorStatus]);

  // -------------------------
  // Fetch all products
  // -------------------------
  const fetchProducts = useCallback(() => {
    setLoadingProducts(true);
    StoreAPI.listProducts()
      .then((data) => {
        // Handle different response structures
        const productsArray = Array.isArray(data) ? data : data?.products || [];
        setProducts(productsArray);
      })
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
    if (user?.role === "customer") {
      fetchVendorStatus();
    }
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

  // Debug console log to see what's happening
  console.log("Current user:", user);
  console.log("Vendor approved:", vendorApproved);
  console.log("User role:", user?.role);

  // -------------------------
  // Render Home Page
  // -------------------------
  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="logo">VStore</h1>
        <div className="header-buttons">
          {/* Auth Button - Show only when NOT logged in */}
          {!user && (
            <button onClick={() => navigate("/auth")}>Sign Up / Login</button>
          )}

          {/* Apply Vendor Button - Show for customers who are NOT approved vendors */}
          {user?.role === "customer" && !vendorApproved && (
            <button onClick={() => navigate("/apply-vendor")}>
              {statusLoading ? "Checking..." : "Apply as Vendor"}
            </button>
          )}

          {/* Vendor Add Product - Show for approved vendors OR users with vendor role */}
          {(vendorApproved || user?.role === "vendor") && (
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
              disabled={statusLoading}
            >
              <RefreshCw size={16} className={statusLoading ? "spinning" : ""} />
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
              <ProductCard key={p.id || p._id} product={p} user={user} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}