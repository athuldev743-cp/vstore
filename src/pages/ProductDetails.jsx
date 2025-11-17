import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./ProductDetails.CSS";

export default function ProductDetails({ user }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(0.5);
  const [form, setForm] = useState({ mobile: "", address: "" });
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const BACKEND_URL = process.env.REACT_APP_API_URL;
  const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        if (!productId) return;

        const productData = await StoreAPI.getProductById(productId);
        setProduct(productData);

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

  // ---- Razorpay Payment Handler ----
  const startRazorpayPayment = async () => {
    if (!product) return;

    setPlacingOrder(true);

    try {
      // (1) Create order from backend
      const res = await fetch(`${BACKEND_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_in_rupees: product.price * quantity,
        }),
      });

      const order = await res.json();

      if (!order.id) {
        alert("Failed to create Razorpay order");
        return;
      }

      // (2) Razorpay modal options
      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: product.name,
        description: "Product Purchase",
        order_id: order.id,

        handler: async function (response) {
          // (3) Verify payment
          const verify = await fetch(`${BACKEND_URL}/api/payments/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });

          const result = await verify.json();

          if (result.success) {
            // (4) Save order in database
            await StoreAPI.placeOrder({
              product_id: product.id || product._id,
              quantity,
              mobile: form.mobile,
              address: form.address,
            });

            alert("Payment Successful! Order placed.");
            setShowOrderPopup(false);
            navigate("/");
          } else {
            alert("Payment Verification Failed");
          }
        },

        theme: { color: "#3399cc" },
      };

      const razor = new window.Razorpay(options);
      razor.open();

    } catch (error) {
      console.error(error);
      alert("Unable to start payment");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      const maxQty = product ? Math.min(product.stock || 20, 20) : 20;
      const clampedValue = Math.max(0.1, Math.min(val, maxQty));
      setQuantity(parseFloat(clampedValue.toFixed(1)));
    }
  };

  const handleQuickQuantity = (qty) => {
    if (!product) return;
    const maxQty = Math.min(product.stock || 20, 20);
    const clampedValue = Math.max(0.1, Math.min(qty, maxQty));
    setQuantity(parseFloat(clampedValue.toFixed(1)));
  };

  if (loading) return <div className="d-flex justify-content-center p-4"><div className="spinner-border"></div></div>;
  if (error) return <div className="alert alert-danger m-3">{error}</div>;
  if (!product) return <div className="alert alert-warning m-3">Product not found</div>;

  const maxQty = product.stock ? Math.min(product.stock, 20) : 20;
  const sliderPercentage = (quantity / maxQty) * 100;

  return (
    <div className="container-fluid p-3">

      {/* BACK BUTTON */}
      <button className="btn btn-link text-decoration-none p-0 mb-3" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="row g-4">
        
        {/* PRODUCT IMAGE */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm">
            <div className="card-body d-flex justify-content-center align-items-center p-4">
              <img
                src={product.image_url || "/default-product.jpg"}
                alt={product.name}
                className="img-fluid rounded product-image"
              />
            </div>
          </div>
        </div>

        {/* PRODUCT INFO */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title h4 mb-3">{product.name}</h2>
              <p className="card-text text-muted mb-3">{product.description}</p>

              <div className="d-flex justify-content-between align-items-center py-3 border-top border-bottom">
                <span className="h5 text-primary mb-0">₹{product.price}/kg</span>
                <span className={`badge ${product.stock > 0 ? "bg-success" : "bg-danger"}`}>
                  {product.stock} kg {product.stock > 0 ? "in stock" : "out of stock"}
                </span>
              </div>

              {/* QUANTITY SLIDER */}
              <div className="quantity-section mt-4">
                
                <label className="form-label fw-semibold d-flex justify-content-between">
                  <span>Quantity: <strong className="text-primary">{quantity.toFixed(1)} kg</strong></span>
                  <span className="text-muted">Max: {maxQty} kg</span>
                </label>

                <input
                  type="range"
                  className="form-range custom-slider"
                  min="0.1"
                  max={maxQty}
                  step="0.1"
                  value={quantity}
                  onChange={handleSliderChange}
                  style={{
                    background: `linear-gradient(to right, #007bff 0%, #007bff ${sliderPercentage}%, #dee2e6 ${sliderPercentage}%)`
                  }}
                />

                <div className="d-flex justify-content-center gap-2 mt-2">
                  {[0.5, 1, 2, 5].map((qty) => (
                    qty <= maxQty && (
                      <button
                        key={qty}
                        className={`btn btn-sm ${Math.abs(quantity - qty) < 0.05 ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => handleQuickQuantity(qty)}
                      >
                        {qty} kg
                      </button>
                    )
                  ))}
                </div>
              </div>

              {/* TOTAL & BUTTON */}
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between mb-2">
                  <span>Total:</span>
                  <span className="h5 text-primary">₹{(product.price * quantity).toFixed(2)}</span>
                </div>

                <button
                  className="btn btn-primary w-100 py-3"
                  onClick={() => setShowOrderPopup(true)}
                >
                  Order Now
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ORDER POPUP */}
      {showOrderPopup && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">

              <div className="modal-header">
                <h5 className="modal-title">Confirm Order</h5>
                <button className="btn-close" onClick={() => setShowOrderPopup(false)}></button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Mobile Number</label>
                  <input
                    className="form-control"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Delivery Address</label>
                  <textarea
                    className="form-control"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowOrderPopup(false)}>
                  Cancel
                </button>

                <button className="btn btn-primary" disabled={placingOrder} onClick={startRazorpayPayment}>
                  {placingOrder ? "Processing..." : "Pay & Confirm"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
