import React, { useState, useEffect } from "react";
import * as StoreAPI from "../api/StoreAPI";
import "./ProductCard.css";

export default function ProductCard({ product, user }) {
  const [showDetails, setShowDetails] = useState(false);
  const [quantity, setQuantity] = useState(Math.min(0.5, product.stock));
  const [form, setForm] = useState({ mobile: "", address: "" });
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;
      try {
        const currentUser = await StoreAPI.getCurrentUser();
        setForm({
          mobile: currentUser.mobile || "",
          address: currentUser.address || "",
        });
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };
    fetchUser();
  }, [user]);

  const handleOrder = async () => {
    if (quantity < 0.1) return alert("Minimum quantity is 0.1kg");
    
    setOrdering(true);
    try {
      const res = await StoreAPI.placeOrder({
        product_id: product.id,
        quantity,
        mobile: form.mobile,
        address: form.address,
      });
      alert(`✅ Order placed successfully!\nRemaining stock: ${res.remaining_stock} kg`);
      setShowDetails(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to place order");
    } finally {
      setOrdering(false);
    }
  };

  const incrementQuantity = () => setQuantity(Math.min(product.stock, quantity + 0.1));
  const decrementQuantity = () => setQuantity(Math.max(0.1, quantity - 0.1));

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={product.image_url || "/default-product.jpg"}
          alt={product.name}
          onClick={() => setShowDetails(true)}
          onError={(e) => (e.target.src = "/default-product.jpg")}
        />
        <div className="product-overlay">
          <button 
            className="view-details-btn"
            onClick={() => setShowDetails(true)}
          >
            Quick View
          </button>
        </div>
      </div>
      
      <div className="product-info">
        <h3 onClick={() => setShowDetails(true)}>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="price-stock">
          <span className="price">₹{product.price}/kg</span>
          <span className={`stock ${product.stock <= 0 ? 'out-of-stock' : ''}`}>
            {product.stock > 0 ? `${product.stock} kg available` : "Out of stock"}
          </span>
        </div>
        <button 
          className="order-now-btn"
          onClick={() => setShowDetails(true)}
          disabled={product.stock <= 0}
        >
          {product.stock > 0 ? "🛒 Order Now" : "Out of Stock"}
        </button>
      </div>

      {/* Modern Popup Modal */}
      {showDetails && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{product.name}</h2>
              <button 
                className="close-modal"
                onClick={() => setShowDetails(false)}
              >
                <span>×</span>
              </button>
            </div>

            <div className="modal-content">
              <div className="product-hero">
                <img
                  src={product.image_url || "/default-product.jpg"}
                  alt={product.name}
                  onError={(e) => (e.target.src = "/default-product.jpg")}
                />
                <div className="hero-info">
                  <p className="description">{product.description || "No description available"}</p>
                  <div className="pricing">
                    <div className="price-tag">₹{product.price}/kg</div>
                    <div className="stock-badge">
                      {product.stock > 0 ? (
                        <span className="in-stock">✅ {product.stock} kg in stock</span>
                      ) : (
                        <span className="out-of-stock">❌ Out of stock</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Section */}
              {user && product.stock > 0 && (
                <div className="order-section">
                  <div className="section-title">
                    <h3>Place Your Order</h3>
                    <div className="total-display">
                      Total: <span>₹{(product.price * quantity).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="quantity-selector">
                    <label>Select Quantity (kg)</label>
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={decrementQuantity}
                        disabled={quantity <= 0.1}
                      >
                        −
                      </button>
                      <span className="quantity-value">{quantity.toFixed(1)} kg</span>
                      <button 
                        className="quantity-btn"
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
                      className="quantity-slider"
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Mobile Number</label>
                      <input
                        type="tel"
                        value={form.mobile}
                        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                        placeholder="Enter your mobile number"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Delivery Address</label>
                      <textarea
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Enter complete delivery address"
                        rows="3"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleOrder} 
                    className="confirm-order-btn"
                    disabled={ordering || quantity < 0.1}
                  >
                    {ordering ? (
                      <>
                        <div className="spinner"></div>
                        Placing Order...
                      </>
                    ) : (
                      `Confirm Order - ₹${(product.price * quantity).toFixed(2)}`
                    )}
                  </button>
                </div>
              )}

              {!user && (
                <div className="login-prompt">
                  <div className="prompt-icon">🔒</div>
                  <p>Please log in to place an order</p>
                  <button 
                    className="login-btn"
                    onClick={() => window.location.href = "/auth"}
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}