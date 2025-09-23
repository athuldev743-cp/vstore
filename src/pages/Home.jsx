import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);

  // Replace this with your email for super admin
  const SUPER_ADMIN_EMAIL = "your_email@example.com";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        role: payload.role,
        id: payload.sub,
        email: payload.email,
        isSuperAdmin: payload.email === SUPER_ADMIN_EMAIL,
      });

      if (payload.role === "customer") {
        StoreAPI.listProducts().then(setProducts).catch(console.error);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

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
          {user?.isSuperAdmin && (
            <button className="admin-icon" onClick={() => navigate("/admin")}>
              🛠 Admin
            </button>
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
