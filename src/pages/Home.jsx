import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./Home.css";

export default function Home({ user: appUser, vendorApproved }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(appUser);
  const [products, setProducts] = useState([]);

  // Replace this with your super admin email
  const SUPER_ADMIN_EMAIL = "your_email@example.com";

  useEffect(() => {
    setUser(appUser);
    if (appUser?.role === "customer") {
      StoreAPI.listProducts()
        .then(setProducts)
        .catch(console.error);
    }
  }, [appUser]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

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
          {user && <button onClick={handleLogout}>Logout</button>}
        </div>
      </header>

      <main className="home-content">
        {user?.role === "customer" ? (
          <div>
            <h2>Products</h2>
            <ul className="product-list">
              {products.map((p) => (
                <li key={p.id} className="product-card">
                  <strong>{p.name}</strong>
                  <p>Price: {p.price}</p>
                  <button
                    onClick={() =>
                      StoreAPI.placeOrder(p.id, 1).then(() =>
                        alert("Order placed!")
                      )
                    }
                  >
                    Order
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="welcome">
            <h2>Welcome to VStore!</h2>
            <p>Sign up or login to see products and place orders.</p>
          </div>
        )}
      </main>
    </div>
  );
}
