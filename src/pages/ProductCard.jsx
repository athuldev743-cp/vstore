import React, { useState, useEffect } from "react";
import * as StoreAPI from "../api/StoreAPI";
import "./Products.css";

export default function ProductCard({ product, user }) {
  const [showDetails, setShowDetails] = useState(false);
  const [quantity, setQuantity] = useState(0.5);
  const [form, setForm] = useState({ mobile: "", address: "" });
  const [ordering, setOrdering] = useState(false);
  const [vendorInfo, setVendorInfo] = useState(null);

  // Fetch user info and vendor details
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch current user for mobile/address
        const currentUser = await StoreAPI.getCurrentUser();
        setForm({
          mobile: currentUser.mobile || "",
          address: currentUser.address || "",
        });

        // Fetch vendor info for this product
        if (product.vendor_id) {
          try {
            const vendors = await StoreAPI.listVendors();
            const vendor = Array.isArray(vendors) 
              ? vendors.find(v => v.id === product.vendor_id || v._id === product.vendor_id)
              : null;
            setVendorInfo(vendor);
          } catch (err) {
            console.error("Failed to fetch vendor info:", err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };
    
    fetchData();
  }, [user, product.vendor_id]);

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

  // Fix image URL - handle relative paths and absolute URLs
  const getImageUrl = (url) => {
    if (!url) return "/default-product.jpg";
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return url;
    return `/${url}`;
  };

  return (
    <div className="product-card" onClick={() => setShowDetails(true)}>
      <div className="product-image-container">
        <img
          src={getImageUrl(product.image_url)}
          alt={product.name}
          onError={(e) => {
            e.target.src = "/default-product.jpg";
          }}
        />
      </div>
      
      <div className="product-info">
        <h3>{product.name}</h3>
        <div className="price-stock">
          <span className="price">₹{product.price}/kg</span>
          <span className={`stock ${product.stock <= 0 ? 'out-of-stock' : ''}`}>
            {product.stock > 0 ? `In stock` : "Out of stock"}
          </span>
        </div>
      </div>

      {/* Product Details Modal */}
      {showDetails && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Product Details</h2>
              <button 
                className="close-modal"
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {/* Product Image */}
              <div className="product-image-large">
                <img
                  src={getImageUrl(product.image_url)}
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = "/default-product.jpg";
                  }}
                />
              </div>

              {/* Product Info */}
              <div className="product-details">
                <h3>{product.name}</h3>
                <p className="product-description">{product.description || "No description available"}</p>
                
                {/* Vendor Info */}
                {vendorInfo && (
                  <div className="vendor-info">
                    <h4>Sold by: {vendorInfo.business_name || vendorInfo.username || "Vendor"}</h4>
                    {vendorInfo.address && <p>📍 {vendorInfo.address}</p>}
                  </div>
                )}

                {/* Pricing */}
                <div className="pricing-info">
                  <div className="price-large">₹{product.price}/kg</div>
                  <div className="stock-info">
                    {product.stock > 0 ? (
                      <span className="in-stock">✅ {product.stock} kg available</span>
                    ) : (
                      <span className="out-of-stock">❌ Out of stock</span>
                    )}
                  </div>
                </div>

                {/* Quantity Selector - Always visible */}
                <div className="quantity-section">
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
                  <div className="quantity-price">
                    Total: <span>₹{(product.price * quantity).toFixed(2)}</span>
                  </div>
                </div>

                {/* Order Button */}
                {user && product.stock > 0 ? (
                  <button 
                    onClick={handleOrder} 
                    className="order-btn-large"
                    disabled={ordering}
                  >
                    {ordering ? "Placing Order..." : `Order Now - ₹${(product.price * quantity).toFixed(2)}`}
                  </button>
                ) : !user ? (
                  <div className="login-prompt">
                    <p>Please log in to place an order</p>
                    <button 
                      className="login-btn"
                      onClick={() => window.location.href = "/auth"}
                    >
                      Login to Order
                    </button>
                  </div>
                ) : (
                  <button className="order-btn-large" disabled>
                    Out of Stock
                  </button>
                )}
              </div>

              {/* Order Summary Popup - Shows after clicking Order */}
              {ordering && (
                <div className="order-popup-overlay">
                  <div className="order-popup">
                    <h3>Order Summary</h3>
                    <div className="order-details">
                      <p><strong>Product:</strong> {product.name}</p>
                      <p><strong>Quantity:</strong> {quantity.toFixed(1)} kg</p>
                      <p><strong>Price per kg:</strong> ₹{product.price}</p>
                      <p><strong>Total:</strong> ₹{(product.price * quantity).toFixed(2)}</p>
                      <p><strong>Mobile:</strong> {form.mobile || "Not provided"}</p>
                      <p><strong>Address:</strong> {form.address || "Not provided"}</p>
                    </div>
                    <div className="popup-buttons">
                      <button onClick={() => setOrdering(false)}>Cancel</button>
                      <button onClick={handleOrder} disabled={ordering}>
                        {ordering ? "Processing..." : "Confirm Order"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}