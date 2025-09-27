import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import AddProduct from "./AddProduct";
import ProductCard from "./ProductCard";
import { User } from "lucide-react"; // account icon
import "./Home.css";

export default function Home({ user }) {
  const navigate = useNavigate();

  const [userLoaded, setUserLoaded] = useState(false);
  const [vendorApproved, setVendorApproved] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (user !== undefined) setUserLoaded(true);
  }, [user]);

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
