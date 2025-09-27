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
  // Fetch vendor approval status
  // -------------------------
  const fetchVendorStatus = useCallback(async () => {
    if (!user) {
      setVendorApproved(false);
      return;
    }

    setStatusLoading(true);
    try {
      const userId = user.id || user._id || user.userId;
      if (!userId) {
        console.warn("No user ID found for vendor status check");
        setVendorApproved(false);
        return;
      }

      const res = await StoreAPI.getVendorStatus(userId);
      const isApproved = res.status?.toLowerCase() === "approved";
      setVendorApproved(isApproved);

      // Update user object to reflect approval
      if (user.role === "vendor") user.vendorApproved = isApproved;
    } catch (error) {
      console.error("Error fetching vendor status:", error);
      setVendorApproved(false);
    } finally {
      setStatusLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVendorStatus();
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
    fetchVendorStatus();
    fetchProducts();
  };

  // -------------------------
  // Navigate to Add Product page
  // -------------------------
  const handleAddProduct = () => navigate("/vendor/products");

  // -------------------------
  // Determine if Add Product should show
  // -------------------------
  const canAddProduct =
    (user?.role === "vendor" && user.vendorApproved) || vendorApproved;

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
          {!user && <button onClick={() => navigate("/auth")}>Sign Up / Login</button>}

          {user?.role === "customer" && !vendorApproved && (
            <button onClick={() => navigate("/apply-vendor")}>
              {statusLoading ? "Checking..." : "Apply as Vendor"}
            </button>
          )}

          {canAddProduct && (
            <button onClick={handleAddProduct} className="add-product-btn">
              ➕ Add Product
            </button>
          )}

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

          {user?.role === "admin" && (
            <button onClick={() => navigate("/admin")}>🛠 Admin</button>
          )}

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
