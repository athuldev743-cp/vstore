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

        // Fetch product
        const productData = await StoreAPI.getProductById(productId);
        setProduct(productData);

        // Fetch vendor info if vendor_id exists
        if (productData.vendor_id) {
          try {
            const vendors = await StoreAPI.listVendors();
            // FIX: Compare string IDs properly
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

        // Pre-fill user details
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

  // FIX: Better quantity controls
  const incrementQuantity = () => {
    if (product && product.stock) {
      setQuantity(prev => Math.min(product.stock, prev + 0.1));
    }
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(0.1, prev - 0.1));
  };

  const handleQuantityChange = (e) => {
    const value = parseFloat(e.target.value);
    if (product && product.stock) {
      setQuantity(Math.min(product.stock, Math.max(0.1, value)));
    }
  };

  const confirmOrder = async () => {
    if (!product) return;
    
    setOrdering(true);
    try {
      // FIX: Use consistent product ID
      const productIdToUse = product.id || product._id;
      
      const res = await StoreAPI.placeOrder({
        product_id: productIdToUse,
        quantity: quantity,
        mobile: form.mobile,
        address: form.address,
      });
      
      alert(`✅ Order placed!\nRemaining stock: ${res.remaining_stock} kg\nVendor notified: ${res.vendor_notified ? 'Yes' : 'No'}`);
      setShowOrderSummary(false);
      navigate("/"); // redirect home
    } catch (err) {
      alert(err.message || "Failed to place order");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div className="loading">Loading product details...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!product) return <div className="error">Product not found</div>;

  const maxQty = product.stock ? Math.min(product.stock, 20) : 20;

  return (
    <div className="product-details-page">
      <div className="product-details-card">
        <img
          src={product.image_url || "/default-product.jpg"}
          alt={product.name}
          className="product-image-large"
          onError={(e) => (e.target.src = "/default-product.jpg")}
        />

        <h2>{product.name}</h2>
        <p className="product-description">
          {product.description || "No description available"}
        </p>

        {/* Product price and stock */}
        <div className="product-meta">
          <p className="price">₹{product.price} per kg</p>
          <p className="stock">Stock: {product.stock} kg available</p>
        </div>

        {vendorInfo && (
          <div className="vendor-info">
            <h4>Sold by: {vendorInfo.shop_name || "Vendor"}</h4>
            {vendorInfo.description && <p>{vendorInfo.description}</p>}
          </div>
        )}

        {/* Quantity selector */}
        <div className="quantity-section">
          <label>Select Quantity (kg)</label>
          <div className="quantity-controls">
            <button onClick={decrementQuantity} disabled={quantity <= 0.1}>
              −
            </button>
            <span>{quantity.toFixed(1)} kg</span>
            <button onClick={incrementQuantity} disabled={quantity >= maxQty}>
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
          />
          <div className="quantity-price">
            Total: <strong>₹{(product.price * quantity).toFixed(2)}</strong>
          </div>
        </div>

        {/* Order button */}
        {user ? (
          product.stock > 0 ? (
            <button
              className="order-btn"
              onClick={() => setShowOrderSummary(true)}
              disabled={ordering}
            >
              {ordering ? "Processing..." : `Order Now - ₹${(product.price * quantity).toFixed(2)}`}
            </button>
          ) : (
            <button className="order-btn out-of-stock" disabled>
              Out of Stock
            </button>
          )
        ) : (
          <div className="login-prompt">
            <p>Please log in to place an order</p>
            <button className="login-btn" onClick={() => navigate("/auth")}>
              Login
            </button>
          </div>
        )}

        {/* Order summary popup */}
        {showOrderSummary && (
          <div className="order-popup-overlay" onClick={() => !ordering && setShowOrderSummary(false)}>
            <div className="order-popup" onClick={(e) => e.stopPropagation()}>
              <h3>Confirm Your Order</h3>
              
              <div className="order-details">
                <p><strong>Product:</strong> {product.name}</p>
                <p><strong>Quantity:</strong> {quantity.toFixed(1)} kg</p>
                <p><strong>Price per kg:</strong> ₹{product.price}</p>
                <p><strong>Total Amount:</strong> ₹{(product.price * quantity).toFixed(2)}</p>
              </div>

              <div className="contact-details">
                <label>
                  <strong>Mobile Number:</strong>
                  <input
                    type="text"
                    placeholder="Your mobile number"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  />
                </label>
                <label>
                  <strong>Delivery Address:</strong>
                  <textarea
                    placeholder="Your complete address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows="3"
                  />
                </label>
              </div>

              <div className="popup-buttons">
                <button 
                  className="cancel-btn" 
                  onClick={() => setShowOrderSummary(false)} 
                  disabled={ordering}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-btn" 
                  onClick={confirmOrder} 
                  disabled={ordering || !form.mobile || !form.address}
                >
                  {ordering ? "Placing Order..." : "Confirm Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}