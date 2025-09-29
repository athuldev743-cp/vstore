import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./ProductDetails.CSS"; // We'll still keep some custom CSS

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

  if (loading) return <div className="d-flex justify-content-center p-4"><div className="spinner-border"></div></div>;
  if (error) return <div className="alert alert-danger m-3">{error}</div>;
  if (!product) return <div className="alert alert-warning m-3">Product not found</div>;

  const maxQty = product.stock ? Math.min(product.stock, 20) : 20;

  return (
    <div className="container-fluid p-3">
      <button className="btn btn-link text-decoration-none p-0 mb-3" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="row g-4">
        {/* Product Image */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm">
            <div className="card-body d-flex justify-content-center align-items-center p-4">
              <img 
                src={product.image_url || "/default-product.jpg"} 
                alt={product.name}
                className="img-fluid rounded"
                style={{maxHeight: "400px", objectFit: "contain"}}
              />
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title h4 mb-3">{product.name}</h2>
              <p className="card-text text-muted mb-3">{product.description || "No description available"}</p>
              
              <div className="d-flex justify-content-between align-items-center py-3 border-top border-bottom">
                <span className="h5 text-primary mb-0">₹{product.price}/kg</span>
                <span className={`badge ${product.stock > 0 ? "bg-success" : "bg-danger"}`}>
                  {product.stock} kg {product.stock > 0 ? "in stock" : "out of stock"}
                </span>
              </div>

              {vendorInfo && (
                <div className="alert alert-light border mt-3">
                  <h6 className="alert-heading mb-2">{vendorInfo.shop_name}</h6>
                  {vendorInfo.description && <p className="mb-0 small text-muted">{vendorInfo.description}</p>}
                </div>
              )}

              <div className="quantity-section mt-4">
                <label className="form-label fw-semibold">Quantity (kg)</label>
                <div className="d-flex align-items-center justify-content-center gap-3 my-3">
                  <button 
                    className="btn btn-outline-primary rounded-circle"
                    style={{width: "45px", height: "45px"}}
                    onClick={decrementQuantity} 
                    disabled={quantity <= 0.1}
                  >
                    −
                  </button>
                  <input 
                    type="number" 
                    className="form-control text-center"
                    style={{width: "100px"}}
                    value={quantity} 
                    step="0.1" 
                    min="0.1" 
                    max={maxQty} 
                    onChange={handleQuantityInput} 
                  />
                  <button 
                    className="btn btn-outline-primary rounded-circle"
                    style={{width: "45px", height: "45px"}}
                    onClick={incrementQuantity} 
                    disabled={quantity >= maxQty}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-semibold">Total:</span>
                  <span className="h5 text-primary mb-0">₹{(product.price * quantity).toFixed(2)}</span>
                </div>
                <button 
                  className="btn btn-primary w-100 py-3 fw-semibold"
                  onClick={() => setShowOrderPopup(true)} 
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? "Out of Stock" : "Order Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Popup Modal */}
      {showOrderPopup && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Order</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowOrderPopup(false)}
                  disabled={ordering}
                ></button>
              </div>
              <div className="modal-body">
                <h6 className="mb-3">{product.name}</h6>
                
                <div className="d-flex justify-content-between mb-2">
                  <span>Quantity:</span>
                  <strong>{quantity.toFixed(1)} kg</strong>
                </div>
                
                <div className="d-flex justify-content-between mb-4 pb-2 border-bottom">
                  <span>Total Amount:</span>
                  <strong className="text-primary">₹{(product.price * quantity).toFixed(2)}</strong>
                </div>

                <div className="mb-3">
                  <label className="form-label">Mobile Number</label>
                  <input 
                    type="tel" 
                    className="form-control"
                    placeholder="Enter your mobile number"
                    value={form.mobile} 
                    onChange={e => setForm({ ...form, mobile: e.target.value })} 
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Delivery Address</label>
                  <textarea 
                    className="form-control"
                    placeholder="Enter your complete address"
                    rows="3"
                    value={form.address} 
                    onChange={e => setForm({ ...form, address: e.target.value })} 
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowOrderPopup(false)} 
                  disabled={ordering}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={placeOrder} 
                  disabled={ordering || !form.mobile || !form.address}
                >
                  {ordering ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Placing Order...
                    </>
                  ) : (
                    "Confirm Order"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}