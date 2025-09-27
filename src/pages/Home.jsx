import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import AddProduct from "./AddProduct";
import "./Home.css";
import ProductCard from "./ProductCard";

export default function Home({ user, onLogout }) {
  const navigate = useNavigate();

  const [userLoaded, setUserLoaded] = useState(false);
  const [vendorApproved, setVendorApproved] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (user !== undefined) {
      setUserLoaded(true);
    }
  }, [user]);

  const fetchVendorStatus = useCallback(() => {
    if (user?.role === "vendor" && user.id) {
      StoreAPI.getVendorStatus(user.id)
        .then((res) => {
          const approved = res.status?.toLowerCase() === "approved";
          setVendorApproved(approved);
        })
        .catch(() => setVendorApproved(false));
    } else {
      setVendorApproved(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "vendor" && user.id) {
      fetchVendorStatus();
    }
  }, [user, fetchVendorStatus]);

  // Fetch all products (instead of vendors)
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
      <header className="home-header">
        <h1 className="logo">VStore</h1>
        <div className="header-buttons">
          {!user && <button onClick={() => navigate("/auth")}>Sign Up / Login</button>}
          {user?.role === "customer" && !vendorApproved && (
            <button onClick={() => navigate("/apply-vendor")}>Apply as Vendor</button>
          )}
          {user?.role === "vendor" && vendorApproved && (
            <button onClick={() => setShowAddProduct(!showAddProduct)}>
              {showAddProduct ? "➖ Close Add Product" : "➕ Add Product"}
            </button>
          )}
          {user?.role === "admin" && <button onClick={() => navigate("/admin")}>🛠 Admin</button>}
          {user && <button onClick={onLogout}>Logout</button>}
        </div>
      </header>

      <main className="home-content">
        {showAddProduct && (
          <div className="add-product-container">
            <AddProduct onProductAdded={fetchProducts} />
          </div>
        )}

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
