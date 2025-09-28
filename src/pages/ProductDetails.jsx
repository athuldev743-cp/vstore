import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./ProductDetails.css";

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

  // Fetch product & vendor info
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!productId) return;

        const data = await StoreAPI.getProductById(productId);
        setProduct(data);

        if (data.vendor_id) {
          const vendors = await StoreAPI.listVendors();
          const vendor = vendors.find(
            (v) => v.id === data.vendor_id || v._id === data.vendor_id
          );
          setVendorInfo(vendor || null);
        }

        if (user) {
          const currentUser = await StoreAPI.getCurrentUser();
          setForm({
            mobile: currentUser.mobile || "",
            address: currentUser.address || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, user]);

  if (loading) return <p>Loading...</p>;
  if (!product) return <p>Product not found</p>;

  const maxQty = product.stock ? Math.min(product.stock, 20) : 20;
  const incrementQuantity = () =>
    setQuantity(Math.min(product.stock, quantity + 0.1));
  const decrementQuantity = () =>
    setQuantity(Math.max(0.1, quantity - 0.1));

  const confirmOrder = async () => {
    setOrdering(true);
    try {
      const res = await StoreAPI.placeOrder({
        product_id: product.id ?? product._id?.toString(),
        quantity,
        mobile: form.mobile,
        address: form.address,
      });
      alert(`✅ Order placed!\nRemaining stock: ${res.remaining_stock} kg`);
      setShowOrderSummary(false);
      navigate("/"); // redirect home
    } catch (err) {
      alert(err.message || "Failed to place order");
    } finally {
      setOrdering(false);
    }
  };

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

        {vendorInfo && (
          <div className="vendor-info">
            <h4>
              Sold by: {vendorInfo.shop_name || vendorInfo.username || "Vendor"}
            </h4>
            {vendorInfo.address && <p>📍 {vendorInfo.address}</p>}
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
            <button onClick={incrementQuantity} disabled={quantity >= product.stock}>
              +
            </button>
          </div>
          <input
            type="range"
            min="0.1"
            max={maxQty}
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value))}
          />
          <div className="quantity-price">
            Total: <strong>₹{(product.price * quantity).toFixed(2)}</strong>
          </div>
        </div>

        {/* Order button */}
        {user && product.stock > 0 ? (
          <button
            className="order-btn"
            onClick={() => setShowOrderSummary(true)}
            disabled={ordering}
          >
            Order Now - ₹{(product.price * quantity).toFixed(2)}
          </button>
        ) : !user ? (
          <div className="login-prompt">
            <p>Please log in to order</p>
            <button className="login-btn" onClick={() => navigate("/auth")}>
              Login
            </button>
          </div>
        ) : (
          <button className="order-btn" disabled>
            Out of Stock
          </button>
        )}

        {/* Order summary popup */}
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
                <strong>Mobile:</strong>{" "}
                <input
                  type="text"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
              </p>
              <p>
                <strong>Address:</strong>{" "}
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </p>
              <div className="popup-buttons">
                <button onClick={() => setShowOrderSummary(false)} disabled={ordering}>
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
    </div>
  );
}
