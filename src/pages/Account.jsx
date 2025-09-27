import React, { useEffect, useState } from "react";
import * as StoreAPI from "../api/StoreAPI";
import { useNavigate } from "react-router-dom";
import "./Account.css";

export default function Account({ onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await StoreAPI.getCurrentUser();
        setUser(res);

        if (res.role === "vendor") {
          const products = await StoreAPI.getVendorProducts(res.id);
          setVendorProducts(products);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load account data");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  if (loading) return <p>Loading account info...</p>;
  if (!user) return <p>User not logged in</p>;

  return (
    <div className="account-container">
      <h1>Account Details</h1>

      {/* Profile Info */}
      <section className="profile-section">
        <h2>Profile</h2>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        {user.mobile && <p><strong>Mobile:</strong> {user.mobile}</p>}
        {user.address && <p><strong>Address:</strong> {user.address}</p>}
        <p><strong>Role:</strong> {user.role}</p>
      </section>

      {/* Vendor Products */}
      {user.role === "vendor" && (
        <section className="vendor-products-section">
          <h2>Your Uploaded Products</h2>
          {vendorProducts.length === 0 ? (
            <p>No products uploaded yet.</p>
          ) : (
            <ul className="product-list">
              {vendorProducts.map((product) => (
                <li key={product.id} className="product-card">
                  <p><strong>{product.name}</strong></p>
                  <p>Price: ₹{product.price}</p>
                  <p>Stock: {product.stock} kg</p>
                  <button
                    className="btn-update"
                    onClick={() => navigate(`/update-product/${product.id}`)}
                  >
                    Update Product
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <button className="btn-logout" onClick={onLogout}>Logout</button>
    </div>
  );
}
