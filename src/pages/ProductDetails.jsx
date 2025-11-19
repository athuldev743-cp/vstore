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
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showUPIPopup, setShowUPIPopup] = useState(false); // NEW: UPI popup state
  const [upiId, setUpiId] = useState(""); // NEW: UPI ID input
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("online"); // NEW: Track selected method

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

  // ---- STANDARD RAZORPAY PAYMENT (Cards, Net Banking, etc) ----
  const startRazorpayPayment = async () => {
    if (!product) return;

    setPlacingOrder(true);

    try {
      // Create order from backend
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

      // Razorpay modal options
      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "Your Store Name",
        description: `Purchase: ${product.name}`,
        order_id: order.id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: form.mobile,
        },
        handler: async function (response) {
          // Verify payment
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
            // Save order in database
            await StoreAPI.placeOrder({
              product_id: product.id || product._id,
              quantity,
              mobile: form.mobile,
              address: form.address,
              payment_method: "online",
              payment_status: "paid"
            });

            alert("Payment Successful! Order placed.");
            setShowPaymentPopup(false);
            setShowOrderPopup(false);
            navigate("/");
          } else {
            alert("Payment Verification Failed");
          }
        },
        modal: {
          ondismiss: function() {
            setPlacingOrder(false);
          }
        },
        theme: { color: "#3399cc" },
      };

      const razor = new window.Razorpay(options);
      razor.open();

    } catch (error) {
      console.error(error);
      alert("Unable to start payment");
      setPlacingOrder(false);
    }
  };

  // ---- TRUE UPI PAYMENT FLOW ----
  const startUPIPayment = async () => {
    if (!product || !upiId.trim()) {
      alert("Please enter your UPI ID");
      return;
    }

    // Basic UPI ID validation
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId.trim())) {
      alert("Please enter a valid UPI ID (e.g.: yourname@oksbi, yournumber@ybl)");
      return;
    }

    setPlacingOrder(true);

    try {
      // Create order from backend
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

      // UPI-specific Razorpay options
      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "Your Store Name",
        description: `Purchase: ${product.name}`,
        order_id: order.id,
        
        // 🔥 UPI-SPECIFIC CONFIGURATION
        method: "upi",
        prefill: {
          contact: form.mobile,
        },
        
        // UPI Intent Configuration
        "upi.intent": true,
        "upi.upi_id": upiId.trim(),
        
        handler: async function (response) {
          // Verify payment
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
            // Save order in database
            await StoreAPI.placeOrder({
              product_id: product.id || product._id,
              quantity,
              mobile: form.mobile,
              address: form.address,
              payment_method: "upi",
              payment_status: "paid",
              upi_id: upiId // Store UPI ID for reference
            });

            alert("UPI Payment Successful! Order placed.");
            setShowUPIPopup(false);
            setShowPaymentPopup(false);
            setShowOrderPopup(false);
            setUpiId("");
            navigate("/");
          } else {
            alert("UPI Payment Verification Failed");
          }
        },
        modal: {
          ondismiss: function() {
            setPlacingOrder(false);
          }
        },
        theme: { color: "#3399cc" },
      };

      const razor = new window.Razorpay(options);
      razor.open();

    } catch (error) {
      console.error("UPI Payment error:", error);
      alert("Unable to process UPI payment");
      setPlacingOrder(false);
    }
  };

  // ---- Cash on Delivery Handler ----
  const handleCashOnDelivery = async () => {
    if (!product) return;

    setPlacingOrder(true);
    try {
      await StoreAPI.placeOrder({
        product_id: product.id || product._id,
        quantity,
        mobile: form.mobile,
        address: form.address,
        payment_method: "cash_on_delivery",
        payment_status: "pending"
      });

      alert("Order placed successfully! You'll pay when your order arrives.");
      setShowPaymentPopup(false);
      setShowOrderPopup(false);
      navigate("/");
    } catch (error) {
      console.error("COD order failed:", error);
      alert("Failed to place order. Please try again.");
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

  const handleConfirmOrder = () => {
    if (!form.mobile || !form.address) {
      alert("Please fill in your mobile number and delivery address");
      return;
    }
    setShowPaymentPopup(true);
  };

  // NEW: Handle payment method selection
  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    
    if (method === "upi") {
      setShowUPIPopup(true);
    } else if (method === "online") {
      startRazorpayPayment();
    }
  };

  if (loading) return <div className="d-flex justify-content-center p-4"><div className="spinner-border"></div></div>;
  if (error) return <div className="alert alert-danger m-3">{error}</div>;
  if (!product) return <div className="alert alert-warning m-3">Product not found</div>;

  const maxQty = product.stock ? Math.min(product.stock, 20) : 20;
  const sliderPercentage = (quantity / maxQty) * 100;
  const totalAmount = product.price * quantity;

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
                  <span className="h5 text-primary">₹{totalAmount.toFixed(2)}</span>
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

      {/* ORDER CONFIRMATION POPUP */}
      {showOrderPopup && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Order Details</h5>
                <button className="btn-close" onClick={() => setShowOrderPopup(false)}></button>
              </div>

              <div className="modal-body">
                {/* Order Summary */}
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <strong>Order Summary</strong>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-8">
                        <strong>{product.name}</strong>
                        <p className="mb-1 text-muted">Quantity: {quantity} kg</p>
                      </div>
                      <div className="col-4 text-end">
                        <strong>₹{totalAmount.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mb-3">
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Enter your mobile number"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Delivery Address *</label>
                  <textarea
                    className="form-control"
                    placeholder="Enter your complete delivery address"
                    rows="3"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowOrderPopup(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleConfirmOrder}
                  disabled={!form.mobile || !form.address}
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT METHOD POPUP */}
      {showPaymentPopup && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Choose Payment Method</h5>
                <button className="btn-close" onClick={() => setShowPaymentPopup(false)}></button>
              </div>

              <div className="modal-body">
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <strong>Order Total: ₹{totalAmount.toFixed(2)}</strong>
                  </div>
                </div>

                {/* UPI Payment Option - NOW WITH DIRECT UPI FLOW */}
                <div className="payment-option card mb-3">
                  <div className="card-body">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="upiPayment"
                        checked={selectedPaymentMethod === "upi"}
                        onChange={() => setSelectedPaymentMethod("upi")}
                      />
                      <label className="form-check-label w-100" htmlFor="upiPayment">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>💳 UPI Payment</strong>
                            <p className="mb-0 text-muted">Pay directly with UPI ID - Fast & Secure</p>
                            <small className="text-info">Pay using PhonePe, Google Pay, Paytm, etc.</small>
                          </div>
                          <div className="text-success">
                            <small>Instant</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Online Payment Option (Cards, Net Banking) */}
                <div className="payment-option card mb-3">
                  <div className="card-body">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="onlinePayment"
                        checked={selectedPaymentMethod === "online"}
                        onChange={() => setSelectedPaymentMethod("online")}
                      />
                      <label className="form-check-label w-100" htmlFor="onlinePayment">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>💳 Credit/Debit Card & Net Banking</strong>
                            <p className="mb-0 text-muted">Pay with Card, Net Banking, or Wallet</p>
                          </div>
                          <div className="text-success">
                            <small>Secure</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Cash on Delivery Option */}
                <div className="payment-option card">
                  <div className="card-body">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="codPayment"
                        checked={selectedPaymentMethod === "cod"}
                        onChange={() => setSelectedPaymentMethod("cod")}
                      />
                      <label className="form-check-label w-100" htmlFor="codPayment">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>💰 Cash on Delivery</strong>
                            <p className="mb-0 text-muted">Pay when you receive your order</p>
                          </div>
                          <div className="text-warning">
                            <small>Pay later</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPaymentPopup(false)}>
                  Back
                </button>
                
                {/* Conditional buttons based on selection */}
                {selectedPaymentMethod === "upi" && (
                  <button 
                    className="btn btn-success" 
                    onClick={() => setShowUPIPopup(true)}
                    disabled={placingOrder}
                  >
                    {placingOrder ? "Processing..." : "Pay with UPI"}
                  </button>
                )}
                
                {selectedPaymentMethod === "online" && (
                  <button 
                    className="btn btn-primary" 
                    onClick={startRazorpayPayment}
                    disabled={placingOrder}
                  >
                    {placingOrder ? "Processing..." : "Pay Now"}
                  </button>
                )}
                
                {selectedPaymentMethod === "cod" && (
                  <button 
                    className="btn btn-warning" 
                    onClick={handleCashOnDelivery}
                    disabled={placingOrder}
                  >
                    {placingOrder ? "Placing Order..." : "Confirm COD"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPI ID ENTRY POPUP */}
      {showUPIPopup && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Enter UPI ID</h5>
                <button className="btn-close" onClick={() => setShowUPIPopup(false)}></button>
              </div>

              <div className="modal-body">
                <div className="alert alert-info">
                  <small>
                    <strong>How to find your UPI ID?</strong><br/>
                    • Open your UPI app (PhonePe, Google Pay, Paytm, etc.)<br/>
                    • Look for your UPI ID in profile section<br/>
                    • Format: yourname@oksbi, yournumber@ybl, etc.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Your UPI ID *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g.: yourname@oksbi, yournumber@ybl"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    autoFocus
                  />
                  <div className="form-text">
                    Enter your UPI ID to pay directly from your bank account
                  </div>
                </div>

                <div className="card">
                  <div className="card-body py-2">
                    <div className="d-flex justify-content-between">
                      <span>Order Amount:</span>
                      <strong>₹{totalAmount.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowUPIPopup(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={startUPIPayment}
                  disabled={placingOrder || !upiId.trim()}
                >
                  {placingOrder ? "Opening UPI..." : "Pay via UPI"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}