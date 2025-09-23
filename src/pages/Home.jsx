// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import Auth from "./Auth";
import ApplyVendor from "./ApplyVendor";
import * as StoreAPI from "../api/StoreAPI";
import "./Home.css";

export default function Home() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showApplyVendor, setShowApplyVendor] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (userLoggedIn) {
      StoreAPI.listProducts()
        .then(setProducts)
        .catch(console.error);
    }
  }, [userLoggedIn]);

  // Called after successful login/signup
  const handleLoginSuccess = () => {
    setUserLoggedIn(true);
    setShowAuth(false);
  };

  if (showAuth) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  if (showApplyVendor) {
    return <ApplyVendor onBack={() => setShowApplyVendor(false)} />;
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>VStore</h1>
        {!userLoggedIn && (
          <button className="signup-btn" onClick={() => setShowAuth(true)}>
            Sign Up / Login
          </button>
        )}
      </header>

      {userLoggedIn && (
        <>
          <button
            className="apply-vendor-btn"
            onClick={() => setShowApplyVendor(true)}
          >
            Apply as Vendor
          </button>

          <main className="products-list">
            {products.map((p) => (
              <div key={p.id} className="product-card">
                <h3>{p.name}</h3>
                <p>Price: ₹{p.price}</p>
                <button
                  onClick={() =>
                    StoreAPI.placeOrder(p.id, 1).then(() =>
                      alert("Order placed!")
                    )
                  }
                >
                  Order
                </button>
              </div>
            ))}
          </main>
        </>
      )}
    </div>
  );
}
