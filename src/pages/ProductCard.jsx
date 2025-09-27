import React, { useState, useEffect } from "react";
import * as StoreAPI from "../api/StoreAPI";
import "./Products.css";

export default function ProductCard({ product, user }) {
  const [showPopup, setShowPopup] = useState(false);
  const [quantity, setQuantity] = useState(0.5);
  const [form, setForm] = useState({
    mobile: user?.mobile || "",
    address: user?.address || "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        mobile: user.mobile || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleOrder = async () => {
    try {
      if (quantity < 0.1) return alert("Minimum quantity is 0.1kg");

      const res = await StoreAPI.placeOrder({
        product_id: product.id,
        quantity,
        mobile: form.mobile,
        address: form.address,
      });

      alert(`Order placed! Remaining stock: ${res.remaining_stock} kg`);
      setShowPopup(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to place order");
    }
  };

  return (
    <div className="product-card">
      {product.image_url && <img src={product.image_url} alt={product.name} />}
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p>₹{product.price} / kg</p>
      <p>Stock: {product.stock} kg</p>

      <button
        disabled={product.stock <= 0}
        onClick={() => setShowPopup(true)}
      >
        {product.stock > 0 ? "🛒 Order Now" : "Out of Stock"}
      </button>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h2>Order: {product.name}</h2>
            <p>Price per kg: ₹{product.price}</p>

            <label>
              Quantity (kg):
              <input
                type="number"
                min="0.5"
                max={Math.min(product.stock, 20)}
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>

            <label>
              Mobile:
              <input
                type="text"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </label>

            <label>
              Address:
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>

            <p>Total: ₹{(product.price * quantity).toFixed(2)}</p>

            <div className="popup-actions">
              <button onClick={handleOrder} className="btn-green">
                Confirm Order
              </button>
              <button onClick={() => setShowPopup(false)} className="btn-red">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
