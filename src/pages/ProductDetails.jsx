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
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        if (!productId) return;

        const productData = await StoreAPI.getProductById(productId);
        setProduct(productData);

        if (productData.vendor_id) {
          const vendors = await StoreAPI.listVendors();
          const vendor = vendors.find(v =>
            v.id === productData.vendor_id ||
            v._id === productData.vendor_id ||
            (v._id && v._id.toString() === productData.vendor_id)
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
        console.error(err);
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId, user]);

  const incrementQuantity = () => setQuantity(prev => Math.min(product.stock, +(prev + 0.1).toFixed(1)));
  const decrementQuantity = () => setQuantity(prev => Math.max(0.1, +(prev - 0.1).toFixed(1)));
  const handleQuantityInput = e => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setQuantity(Math.max(0.1, Math.min(val, product.stock || 20)));
  };

  const placeOrder = async () => {
    if (!product) return;
    setOrdering(true);
    try {
      const res = await StoreAPI.placeOrder({
        product_id: product.id || product._id,
        quantity,
        mobile: form.mobile,
        address: form.address,
      });
      alert(`Order placed! Remaining stock: ${res.remaining_stock} kg`);
      setShowOrderPopup(false);
      navigate("/");
    } catch (err) {
      alert(err.message || "Failed to place order");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!product) return <p>Product not found</p>;

  const maxQty = product.stock ? Math.min(product.stock, 20) : 20;

  return (
    <div className="product-page">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      <div className="product-main">
        <div className="image-card">
          <img src={product.image_url || "/default-product.jpg"} alt={product.name} />
        </div>

        <div className="info-card">
          <h2 className="product-title">{product.name}</h2>
          <p className="product-description">{product.description || "No description available"}</p>
          <div className="price-stock">
            <span className="price">₹{product.price}/kg</span>
            <span className={`stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>{product.stock} kg</span>
          </div>

          {vendorInfo && (
            <div className="vendor-info">
              <p className="vendor-name">{vendorInfo.shop_name}</p>
              {vendorInfo.description && <p className="vendor-desc">{vendorInfo.description}</p>}
            </div>
          )}

          <div className="quantity-selector">
            <button onClick={decrementQuantity} disabled={quantity <= 0.1}>−</button>
            <input type="number" value={quantity} step="0.1" min="0.1" max={maxQty} onChange={handleQuantityInput} />
            <button onClick={incrementQuantity} disabled={quantity >= maxQty}>+</button>
          </div>

          <button className="order-btn" onClick={() => setShowOrderPopup(true)} disabled={product.stock === 0}>
            {product.stock === 0 ? "Out of Stock" : `Order Now - ₹${(product.price * quantity).toFixed(2)}`}
          </button>
        </div>
      </div>

      {showOrderPopup && (
        <div className="popup-overlay" onClick={() => !ordering && setShowOrderPopup(false)}>
          <div className="popup-card" onClick={e => e.stopPropagation()}>
            <h3>Confirm Order</h3>
            <p>{product.name}</p>
            <div className="popup-quantity"><span>Quantity:</span> <strong>{quantity.toFixed(1)} kg</strong></div>
            <div className="popup-total"><span>Total:</span> <strong>₹{(product.price * quantity).toFixed(2)}</strong></div>
            <input type="tel" placeholder="Mobile" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} />
            <textarea placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}></textarea>
            <button className="btn-confirm" onClick={placeOrder} disabled={ordering || !form.mobile || !form.address}>
              {ordering ? "Placing..." : "Confirm Order"}
            </button>
            <button className="btn-cancel" onClick={() => setShowOrderPopup(false)} disabled={ordering}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
