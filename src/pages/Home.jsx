import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import ProductCard from "./ProductCard";
import { User, RefreshCw, Search } from "lucide-react";
import InstallButton from "../componnents/InstallButton";
import "./Home.css";

export default function Home({ user }) {
  const navigate = useNavigate();

  const [userLoaded, setUserLoaded] = useState(false);
  const [vendorApproved, setVendorApproved] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    if (user !== undefined) setUserLoaded(true);
  }, [user]);

  const fetchVendorStatus = useCallback(async () => {
    if (!user || user.role !== "customer") {
      setVendorApproved(false);
      return;
    }
    setStatusLoading(true);
    try {
      const userId = user.id || user._id || user.userId;
      if (!userId) return setVendorApproved(false);
      const res = await StoreAPI.getVendorStatus(userId);
      setVendorApproved(res.status?.toLowerCase() === "approved");
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

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductsError("");
    
    try {
      console.log("🔄 Fetching products...");
      const data = await StoreAPI.listProducts();
      console.log("📦 API Response:", data);
      
      // Handle different response formats
      let productsArray = [];
      
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && Array.isArray(data.products)) {
        productsArray = data.products;
      } else if (data && data.data && Array.isArray(data.data)) {
        productsArray = data.data;
      } else {
        console.warn("⚠️ Unexpected API response format:", data);
        productsArray = [];
      }
      
      console.log("✅ Processed products:", productsArray);
      setProducts(productsArray);
      setFilteredProducts(productsArray);
      
    } catch (error) {
      console.error("❌ Failed to load products:", error);
      setProductsError("Failed to load products. Please try again.");
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredProducts(
      products.filter((p) => 
        p.name?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, products]);

  const handleRefresh = () => {
    if (user?.role === "customer") fetchVendorStatus();
    fetchProducts();
  };

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

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between sticky-header">
        <h1 className="logo mb-2 mb-md-0">VStore</h1>

        {/* Search Box */}
        <div className="search-box mb-2 mb-md-0">
          <Search size={18} className="me-2 text-muted" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="header-buttons d-flex flex-wrap gap-2">
          {!user && (
            <button className="btn-primary" onClick={() => navigate("/auth")}>
              Sign Up / Login
            </button>
          )}

          {user?.role === "customer" && !vendorApproved && (
            <button className="btn-secondary" onClick={() => navigate("/apply-vendor")}>
              {statusLoading ? "Checking..." : "Apply as Vendor"}
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
            <button className="btn-admin" onClick={() => navigate("/admin")}>
              Admin Panel
            </button>
          )}

          {user && (
            <button className="btn-account" onClick={() => navigate("/account")} title="Account">
              <User size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Products Section */}
      <main className="home-content mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="section-title mb-0">Products</h2>
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={fetchProducts}
            disabled={loadingProducts}
          >
            {loadingProducts ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {productsError && (
          <div className="alert alert-danger">
            {productsError}
            <button 
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={fetchProducts}
            >
              Retry
            </button>
          </div>
        )}

        {loadingProducts ? (
          <div className="text-center p-4">
            <div className="spinner-border text-primary"></div>
            <p className="mt-2">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center p-4">
            <p className="text-muted">
              {searchQuery ? "No products match your search." : "No products available."}
            </p>
            {!searchQuery && (
              <button className="btn btn-primary" onClick={fetchProducts}>
                Try Again
              </button>
            )}
          </div>
        ) : (
          <div className="row g-3">
            {filteredProducts.map((p) => (
              <div key={p.id || p._id} className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                <ProductCard product={p} square />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Install Button */}
      <InstallButton />
    </div>
  );
}