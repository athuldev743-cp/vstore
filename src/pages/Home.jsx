import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  // -------------------------
  // States
  // -------------------------
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [products, setProducts] = useState([]);

  // -------------------------
  // Fetch products from backend if logged in
  // -------------------------
  useEffect(() => {
    if (userLoggedIn) {
      StoreAPI.listProducts()
        .then(setProducts)
        .catch((err) => console.error("Error fetching products:", err));
    }
  }, [userLoggedIn]);

  // -------------------------
  // Handlers
  // -------------------------
  const handleSignupLogin = () => {
    navigate("/auth", { state: { fromHome: true, setUserLoggedIn } });
  };

  const handleApplyVendor = () => {
    navigate("/apply-vendor");
  };

  const handlePlaceOrder = (productId) => {
    StoreAPI.placeOrder(productId, 1)
      .then(() => alert("Order placed!"))
      .catch((err) => alert("Order failed: " + err.message));
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="home-page">
      <header className="home-header">
        <h1 className="logo">VStore</h1>
        {!userLoggedIn && (
          <button className="signup-btn" onClick={handleSignupLogin}>
            Signup / Login
          </button>
        )}
      </header>

      <main className="home-content">
        {!userLoggedIn ? (
          <div className="welcome">
            <h2>Welcome to Virtual Store!</h2>
            <p>Discover amazing products at your fingertips.</p>
          </div>
        ) : (
          <div className="dashboard">
            <h2>Products</h2>
            {products.length === 0 ? (
              <p>No products available.</p>
            ) : (
              <ul className="product-list">
                {products.map((p) => (
                  <li key={p.id} className="product-item">
                    <span>{p.name}</span>
                    <span>${p.price}</span>
                    <button
                      className="order-btn"
                      onClick={() => handlePlaceOrder(p.id)}
                    >
                      Order
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button className="vendor-btn" onClick={handleApplyVendor}>
              Apply as Vendor
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
