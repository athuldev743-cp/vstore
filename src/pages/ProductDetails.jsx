import React, { useState, useEffect } from "react";
import * as StoreAPI from "../api/StoreAPI";
import "./Products.css";

export default function ProductDetails({ product, user, onClose }) {
  const [quantity, setQuantity] = useState(0.5);
  const [form, setForm] = useState({ mobile: "", address: "" });
  const [vendorInfo, setVendorInfo] = useState(null);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [ordering, setOrdering] = useState(false);

  // Fetch user + vendor info
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const currentUser = await StoreAPI.getCurrentUser();
        setForm({
          mobile: currentUser.mobile || "",
          address: currentUser.address || "",
        });

        if (product.vendor_id) {
          const vendors = await StoreAPI.listVendors();
          const vendor = Array.isArray(vendors)
            ? vendors.find(
                (v) => v.id === product.vendor_id || v._id === product.vendor_id
              )
            : null;
          setVendorInfo(vendor);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, [user, product.vendor_id]);

  const incrementQuantity = () =>
    setQuantity(Math.min(product.stock, quantity + 0.1));
  const decrementQuantity = () =>
    setQuantity(Math.max(0.1, quantity - 0.1));

  const confirmOrder = async () => {
    setOrdering(true);
    try {
      const res = await StoreAPI.placeOrder({
        product_id: product.id,
        quantity,
        mobile: form.mobile,
        address: form.address,
      });
      alert(`✅ Order placed!\nRemaining stock: ${res.remaining_stock} kg`);
      setShowOrderSummary(false);
      onClose();
    } catch (err) {
      alert(err.message || "Failed to place order");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product.name}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <img
            src={product.image_url || "/default-product.jpg"}
            alt={product.name}
            className="product-image-large"
            onError={(e) => (e.target.src = "/default-product.jpg")}
          />

          <p className="product-description">
            {product.description || "No description available"}
          </p>

          {vendorInfo && (
            <div className="vendor-info">
              <h4>
                Sold by:{" "}
                {vendorInfo.business_name ||
                  vendorInfo.username ||
                  "Vendor"}
              </h4>
              {vendorInfo.address && <p>📍 {vendorInfo.address}</p>}
            </div>
          )}

          {/* Quantity */}
          <div className="quantity-section">
            <label>Select Quantity (kg)</label>
            <div className="quantity-controls">
              <button onClick={decrementQuantity} disabled={quantity <= 0.1}>
                −
              </button>
              <span>{quantity.toFixed(1)} kg</span>
              <button
                onClick={incrementQuantity}
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>
            <input
              type="range"
              min="0.1"
              max={Math.min(product.stock, 20)}
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
            />
            <div className="quantity-price">
              Total: <strong>₹{(product.price * quantity).toFixed(2)}</strong>
            </div>
          </div>

          {/* Order Button */}
          {user && product.stock > 0 ? (
            <button
              className="order-btn"
              onClick={() => setShowOrderSummary(true)}
            >
              Order Now - ₹{(product.price * quantity).toFixed(2)}
            </button>
          ) : !user ? (
            <div className="login-prompt">
              <p>Please log in to order</p>
              <button
                className="login-btn"
                onClick={() => (window.location.href = "/auth")}
              >
                Login
              </button>
            </div>
          ) : (
            <button className="order-btn" disabled>
              Out of Stock
            </button>
          )}
        </div>
      </div>

      {/* Order Summary Popup */}
      {showOrderSummary && (
        <div
          className="order-popup-overlay"
          onClick={() => !ordering && setShowOrderSummary(false)}
        >
          <div className="order-popup" onClick={(e) => e.stopPropagation()}>
            <h3>Order Summary</h3>
            <p>
              <strong>Product:</strong> {product.name}
            </p>
            <p>
              <strong>Quantity:</strong> {quantity.toFixed(1)} kg
            </p>
            <p>
              <strong>Total:</strong> ₹{(product.price * quantity).toFixed(2)}
            </p>
            <p>
              <strong>Mobile:</strong> {form.mobile}
            </p>
            <p>
              <strong>Address:</strong> {form.address}
            </p>
            <div className="popup-buttons">
              <button
                onClick={() => setShowOrderSummary(false)}
                disabled={ordering}
              >
                Cancel
              </button>
              <button onClick={confirmOrder} disabled={ordering}>
                {ordering ? "Processing..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
