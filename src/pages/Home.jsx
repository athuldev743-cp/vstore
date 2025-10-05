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

  const fetchProducts = useCallback(() => {
    setLoadingProducts(true);
    StoreAPI.listProducts()
      .then((data) => {
        const productsArray = Array.isArray(data) ? data : data?.products || [];
        setProducts(productsArray);
        setFilteredProducts(productsArray);
      })
      .catch((err) => console.error("Failed to load products:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredProducts(products.filter((p) => p.name?.toLowerCase().includes(q)));
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

      {/* Products */}
      <main className="home-content mt-3">
        <h2 className="section-title mb-3">Products</h2>
        {loadingProducts ? (
          <p className="loading-text">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="no-products">No products found.</p>
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
