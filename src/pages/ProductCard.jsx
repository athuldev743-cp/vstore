import React, { useState, useEffect } from "react";
import * as StoreAPI from "../api/StoreAPI";
import "./Products.css";

export default function ProductCard({ product, user }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [quantity, setQuantity] = useState(Math.min(0.5, product.stock));
  const [form, setForm] = useState({ mobile: "", address: "" });
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return setLoadingUser(false);
      try {
        const currentUser = await StoreAPI.getCurrentUser();
        setForm({
          mobile: currentUser.mobile || "",
          address: currentUser.address || "",
        });
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [user]);

  const handleOrder = async () => {
    if (quantity < 0.1) return alert("Minimum quantity is 0.1kg");

    try {
      const res = await StoreAPI.placeOrder({
        product_id: product.id,
        quantity,
        mobile: form.mobile,
        address: form.address,
      });
      alert(`Order placed! Remaining stock: ${res.remaining_stock} kg`);
      setShowOrder(false);
      setShowDetails(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to place order");
    }
  };

  return (
    <div className="product-card">
      <img
        src={product.image_url || "/default-product.jpg"}
        alt={product.name}
        onClick={() => setShowDetails(true)}
        onError={(e) => (e.target.src = "/default-product.jpg")}
      />
      <h3 onClick={() => setShowDetails(true)}>{product.name}</h3>
      <p className="price">₹{product.price} / kg</p>

      {showDetails && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p>Price: ₹{product.price} / kg</p>
            <p>Stock: {product.stock} kg</p>

            <button
              onClick={() => setShowOrder(true)}
              disabled={product.stock <= 0 || loadingUser}
            >
              {product.stock > 0 ? "🛒 View / Order" : "Out of Stock"}
            </button>
            <button onClick={() => setShowDetails(false)} className="btn-red">
              Close
            </button>

            {showOrder && (
              <div className="popup-overlay-inner">
                <div className="popup-card">
                  <h3>Order: {product.name}</h3>

                  <label>
                    Quantity (kg): {quantity.toFixed(1)}
                    <input
                      type="range"
                      min="0.1"
                      max={Math.min(product.stock, 20)}
                      step="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value))}
                    />
                  </label>

                  <p>Total Price: ₹{(product.price * quantity).toFixed(2)}</p>

                  <label>
                    Mobile:
                    <input
                      type="text"
                      value={form.mobile}
                      onChange={(e) =>
                        setForm({ ...form, mobile: e.target.value })
                      }
                    />
                  </label>

                  <label>
                    Address:
                    <textarea
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                    />
                  </label>

                  <div className="popup-actions">
                    <button onClick={handleOrder} className="btn-green">
                      Confirm Order
                    </button>
                    <button
                      onClick={() => setShowOrder(false)}
                      className="btn-red"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
