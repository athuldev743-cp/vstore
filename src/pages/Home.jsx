// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./Home.css";

export default function Home({ user, vendorApproved, onLogout }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const SUPER_ADMIN_EMAIL = "your_email@example.com"; // replace with your email

  // Load products for customers
  useEffect(() => {
    if (user?.role === "customer") {
      StoreAPI.listProducts()
        .then(setProducts)
        .catch((err) => console.error("Failed to load products:", err));
    }
  }, [user]);

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="logo">VStore</h1>
        <div className="header-buttons">
          {!user && (
            <button onClick={() => navigate("/auth")}>Sign Up / Login</button>
          )}

          {user?.role === "customer" && (
            <button onClick={() => navigate("/apply-vendor")}>
              Apply as Vendor
            </button>
          )}

          {user?.role === "vendor" && vendorApproved && (
            <button onClick={() => navigate("/vendor/products")}>
              ➕ Add Product
            </button>
          )}

          {user?.email === SUPER_ADMIN_EMAIL && (
            <button onClick={() => navigate("/admin")}>🛠 Admin</button>
          )}

          {user && <button onClick={onLogout}>Logout</button>}
        </div>
      </header>

      <main className="home-content">
        {!user ? (
          <div className="welcome">
            <h2>Welcome to VStore!</h2>
            <p>Sign up or login to see products and place orders.</p>
          </div>
        ) : user.role === "customer" ? (
          <div>
            <h2>Products</h2>
            {products.length === 0 ? (
              <p>No products available.</p>
            ) : (
              <ul className="product-list">
                {products.map((p) => (
                  <li key={p.id} className="product-card">
                    <strong>{p.name}</strong>
                    <p>Price: {p.price}</p>
                    <button
                      onClick={() =>
                        StoreAPI.placeOrder(p.id, 1)
                          .then(() => alert("Order placed!"))
                          .catch((err) =>
                            alert(err.message || "Failed to place order")
                          )
                      }
                    >
                      Order
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="welcome">
            <h2>Welcome, {user.role}!</h2>
            <p>
              {user.role === "vendor"
                ? vendorApproved
                  ? "You can now add products."
                  : "Your vendor application is pending approval."
                : "You are a super admin."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
