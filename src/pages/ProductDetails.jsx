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
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");

  const BACKEND_URL = process.env.REACT_APP_API_URL;

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

  // Custom confirmation dialog function
  const showConfirmationDialog = (message) => {
    return window.confirm(message);
  };

  // ---- NEW UPI INTENT PAYMENT FLOW ----
  const startUPIPayment = async () => {
    if (!product) return;

    setPlacingOrder(true);

    try {
      console.log("Placing UPI order...");
      
      // Create order with UPI payment method
      const orderData = {
        product_id: product.id || product._id,
        quantity: quantity,
        payment_method: "upi",
        mobile: form.mobile,
        address: form.address
      };

      const response = await StoreAPI.placeOrder(orderData);
      
      if (response && response.id) {
        // Check if UPI payment data is available
        if (response.upi_payment && response.upi_payment.upi_link) {
          console.log("Opening UPI link:", response.upi_payment.upi_link);
          
          // Open UPI app
          window.location.href = response.upi_payment.upi_link;
          
          // Show confirmation dialog after 3 seconds
          setTimeout(() => {
            const confirmed = showConfirmationDialog(
              `Did you complete the payment of ₹${response.upi_payment.amount}?\n\n` +
              `If yes, click "OK" to confirm your payment.`
            );
            
            if (confirmed) {
              confirmUPIPayment(response.id, response.upi_payment.amount);
            } else {
              setPlacingOrder(false);
            }
          }, 3000);
        } else {
          throw new Error("UPI payment data not available");
        }
      } else {
        throw new Error("Failed to create order");
      }

    } catch (error) {
      console.error("UPI Payment failed:", error);
      alert(`Payment failed: ${error.message}`);
      setPlacingOrder(false);
    }
  };

  // ---- UPI PAYMENT CONFIRMATION ----
  const confirmUPIPayment = async (orderId, amount) => {
    try {
      const transactionId = window.prompt(
        'Payment completed! Please enter transaction ID (optional):\n\n' +
        'You can find this in your UPI app transaction history.'
      );

      const response = await fetch(`${BACKEND_URL}/api/store/orders/${orderId}/confirm-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: amount,
          transaction_id: transactionId || ''
        })
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Payment confirmed successfully! Your order is being processed.");
        setShowPaymentPopup(false);
        setShowOrderPopup(false);
        navigate("/orders");
      } else {
        alert("❌ Payment confirmation failed. Please contact support.");
      }
    } catch (error) {
      console.error("Payment confirmation error:", error);
      alert("❌ Payment confirmation failed. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  // ---- CASH ON DELIVERY HANDLER ----
  const handleCashOnDelivery = async () => {
    if (!product) return;

    setPlacingOrder(true);
    try {
      await StoreAPI.placeOrder({
        product_id: product.id || product._id,
        quantity: quantity,
        mobile: form.mobile,
        address: form.address,
        payment_method: "cod"
      });

      alert("✅ Order placed successfully! You'll pay when your order arrives.");
      setShowPaymentPopup(false);
      setShowOrderPopup(false);
      navigate("/orders");
    } catch (error) {
      console.error("COD order failed:", error);
      alert("❌ Failed to place order. Please try again.");
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

  if (loading) return <div className="d-flex justify-content-center p-4"><div className="spinner-border"></div></div>;
  if (error) return <div className="alert alert-danger m-3">{error}</div>;
  if (!product) return <div className="alert alert-warning m-3">Product not found</div>;

  const maxQty = product.stock ? Math.min(product.stock, 20) : 20;
  const sliderPercentage = (quantity / maxQty) * 100;
  const totalAmount = product.price * quantity;

  return (
    <div className="container-fluid p-3">
      <button className="btn btn-link text-decoration-none p-0 mb-3" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="row g-4">
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

                {/* UPI Payment Option */}
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
                            <p className="mb-0 text-muted">Pay directly with UPI - Fast & Secure</p>
                            <small className="text-info">Opens GPay, PhonePe, Paytm automatically</small>
                          </div>
                          <div className="text-success">
                            <small>Instant</small>
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
                
                {selectedPaymentMethod === "upi" && (
                  <button 
                    className="btn btn-success" 
                    onClick={startUPIPayment}
                    disabled={placingOrder}
                  >
                    {placingOrder ? "Opening UPI..." : "Pay with UPI"}
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
    </div>
  );
}