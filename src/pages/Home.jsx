import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import AddProduct from "./AddProduct";
import ProductCard from "./ProductCard";
import { User } from "lucide-react"; // account icon
import "./Home.css";

export default function Home({ user }) {
  const navigate = useNavigate();

  // -------------------------
  // States
  // -------------------------
  const [userLoaded, setUserLoaded] = useState(false);
  const [vendorApproved, setVendorApproved] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
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
  const fetchVendorStatus = useCallback(() => {
    if (user?.role === "vendor" && user.id) {
      StoreAPI.getVendorStatus(user.id)
        .then((res) => {
          setVendorApproved(res.status?.toLowerCase() === "approved");
        })
        .catch(() => setVendorApproved(false));
    } else setVendorApproved(false);
  }, [user]);

  useEffect(() => {
    if (user?.role === "vendor" && user.id) fetchVendorStatus();
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

          {/* Vendor Add Product */}
          {user?.role === "vendor" && vendorApproved && (
            <button onClick={() => setShowAddProduct(!showAddProduct)}>
              {showAddProduct ? "➖ Close Add Product" : "➕ Add Product"}
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
        {/* Add Product Component */}
        {showAddProduct && (
          <div className="add-product-container">
            <AddProduct onProductAdded={fetchProducts} />
          </div>
        )}

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
