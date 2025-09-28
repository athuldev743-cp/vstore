import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./ProductDetails.CSS";

export default function ProductDetails({ user }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [quantity, setQuantity] = useState(0.5);
  const [form, setForm] = useState({ mobile: "", address: "" });
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch product & vendor info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        if (!productId) return;

        const productData = await StoreAPI.getProductById(productId);
        setProduct(productData);

        if (productData.vendor_id) {
          try {
            const vendors = await StoreAPI.listVendors();
            const vendor = vendors.find(v => 
              v.id === productData.vendor_id || 
              v._id === productData.vendor_id ||
              (v._id && v._id.toString() === productData.vendor_id)
            );
            setVendorInfo(vendor || null);
          } catch (vendorErr) {
            console.warn("Could not fetch vendor info:", vendorErr);
            setVendorInfo(null);
          }
        }

        if (user) {
          try {
            const currentUser = await StoreAPI.getCurrentUser();
            setForm({
              mobile: currentUser.mobile || "",
              address: currentUser.address || "",
            });
          } catch (userErr) {
            console.warn("Could not fetch user details:", userErr);
          }
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError(err.message || "Failed to load product details");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, user]);

  const incrementQuantity = () => {
    if (product && product.stock) {
      setQuantity(prev => Math.min(product.stock, parseFloat((prev + 0.1).toFixed(1))));
    }
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(0.1, parseFloat((prev - 0.1).toFixed(1))));
  };

  const handleQuantityChange = (e) => {
    const value = parseFloat(e.target.value);
    if (product && product.stock) {
      setQuantity(Math.min(product.stock, Math.max(0.1, parseFloat(value.toFixed(1)))));
    }
  };

  const handleQuantityInput = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.1 && value <= (product?.stock || 20)) {
      setQuantity(parseFloat(value.toFixed(1)));
    }
  };

  const confirmOrder = async () => {
    if (!product) return;
    
    setOrdering(true);
    try {
      const productIdToUse = product.id || product._id;
      const res = await StoreAPI.placeOrder({
        product_id: productIdToUse,
        quantity: quantity,
        mobile: form.mobile,
        address: form.address,
      });
      
      alert(`✅ Order placed!\nRemaining stock: ${res.remaining_stock} kg\nVendor notified: ${res.vendor_notified ? 'Yes' : 'No'}`);
      setShowOrderSummary(false);
      navigate("/");
    } catch (err) {
      alert(err.message || "Failed to place order");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading product details...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p>Error: {error}</p>
      <button className="retry-btn" onClick={() => window.location.reload()}>
        Try Again
      </button>
    </div>
  );
  
  if (!product) return (
    <div className="error-container">
      <div className="error-icon">❌</div>
      <p>Product not found</p>
      <button className="back-btn" onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );

  const maxQty = product.stock ? Math.min(product.stock, 20) : 20;

  return (
    <div className="product-details-page">
      <div className="product-details-card">
        {/* Back Button */}
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* Product Image */}
        <div className="image-container">
          <img
            src={product.image_url || "/default-product.jpg"}
            alt={product.name}
            className="product-image-large"
            onError={(e) => (e.target.src = "/default-product.jpg")}
          />
        </div>

        {/* Product Info */}
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          <p className="product-description">
            {product.description || "No description available"}
          </p>

          <div className="product-meta">
            <div className="price-tag">₹{product.price}/kg</div>
            <div className="stock-info">
              <span className="stock-label">In Stock:</span>
              <span className="stock-value">{product.stock} kg</span>
            </div>
          </div>

          {vendorInfo && (
            <div className="vendor-info">
              <h3 className="vendor-title">Sold by</h3>
              <p className="vendor-name">{vendorInfo.shop_name || "Vendor"}</p>
              {vendorInfo.description && (
                <p className="vendor-description">{vendorInfo.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Quantity Selector */}
        <div className="quantity-section">
          <h3 className="quantity-title">Select Quantity (kg)</h3>
          
          <div className="quantity-input-container">
            <button 
              className="quantity-btn minus" 
              onClick={decrementQuantity} 
              disabled={quantity <= 0.1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            
            <div className="quantity-display">
              <input
                type="number"
                min="0.1"
                max={maxQty}
                step="0.1"
                value={quantity}
                onChange={handleQuantityInput}
                className="quantity-input"
                aria-label="Quantity in kilograms"
              />
              <span className="quantity-unit">kg</span>
            </div>
            
            <button 
              className="quantity-btn plus" 
              onClick={incrementQuantity} 
              disabled={quantity >= maxQty}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <input
            type="range"
            min="0.1"
            max={maxQty}
            step="0.1"
            value={quantity}
            onChange={handleQuantityChange}
            className="quantity-slider"
            aria-label="Adjust quantity slider"
          />

          <div className="quantity-price">
            <span className="total-label">Total:</span>
            <strong className="total-amount">₹{(product.price * quantity).toFixed(2)}</strong>
          </div>
        </div>

        {/* Order Button */}
        <div className="order-section">
          {user ? (
            product.stock > 0 ? (
              <button
                className="order-btn primary"
                onClick={() => setShowOrderSummary(true)}
                disabled={ordering}
              >
                {ordering ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  `Order Now - ₹${(product.price * quantity).toFixed(2)}`
                )}
              </button>
            ) : (
              <button className="order-btn out-of-stock" disabled>
                Out of Stock
              </button>
            )
          ) : (
            <div className="login-prompt">
              <p>Please log in to place an order</p>
              <button className="order-btn secondary" onClick={() => navigate("/auth")}>
                Login to Order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary Modal */}
      {showOrderSummary && (
        <div className="modal-overlay" onClick={() => !ordering && setShowOrderSummary(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Your Order</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowOrderSummary(false)}
                disabled={ordering}
              >
                ×
              </button>
            </div>

            <div className="order-summary">
              <div className="summary-item">
                <span>Product:</span>
                <span>{product.name}</span>
              </div>
              <div className="summary-item">
                <span>Quantity:</span>
                <span>{quantity.toFixed(1)} kg</span>
              </div>
              <div className="summary-item">
                <span>Price per kg:</span>
                <span>₹{product.price}</span>
              </div>
              <div className="summary-item total">
                <span>Total Amount:</span>
                <span>₹{(product.price * quantity).toFixed(2)}</span>
              </div>
            </div>

            <div className="contact-form">
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number *</label>
                <input
                  id="mobile"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Delivery Address *</label>
                <textarea
                  id="address"
                  placeholder="Enter your complete delivery address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows="3"
                  required
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowOrderSummary(false)} 
                disabled={ordering}
              >
                Cancel
              </button>
              <button 
                className="btn-confirm" 
                onClick={confirmOrder} 
                disabled={ordering || !form.mobile.trim() || !form.address.trim()}
              >
                {ordering ? (
                  <>
                    <span className="spinner"></span>
                    Placing Order...
                  </>
                ) : (
                  'Confirm Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}