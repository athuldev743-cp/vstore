import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./Products.css";

export default function Products() {
  const { vendorId } = useParams();
  const [products, setProducts] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [user, setUser] = useState(null);
  const [popupProduct, setPopupProduct] = useState(null);
  const [popupQuantity, setPopupQuantity] = useState(0.5);
  const [popupPrice, setPopupPrice] = useState(0);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await StoreAPI.getVendorProducts(vendorId);
        setProducts(res);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    }

    async function fetchUser() {
      try {
        const res = await StoreAPI.getCurrentUser();
        setUser(res);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    }

    fetchProducts();
    fetchUser();
  }, [vendorId]);

  const handleOrder = async (product, quantity, form) => {
    try {
      if (quantity < 0.1) return;

      const res = await StoreAPI.placeOrder({
        product_id: product.id,
        quantity,
        mobile: form.mobile,
        address: form.address,
      });

      alert(`Order placed! Remaining stock: ${res.remaining_stock} kg`);

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, stock: res.remaining_stock } : p
        )
      );

      setPopupProduct(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to place order");
    }
  };

  const handleQuantityChange = (productId, value, price) => {
    setPopupQuantity(value);
    setPopupPrice(price * value);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-center text-2xl font-bold text-blue-700 mb-4">
        Products
      </h1>

      {products.length === 0 ? (
        <p className="text-center text-gray-500">No products available.</p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              {/* Image */}
              {product.image_url && (
                <img
                  src={`${product.image_url}?t=${Date.now()}`}
                  alt={product.name}
                  onClick={() =>
                    setExpanded(expanded === product.id ? null : product.id)
                  }
                />
              )}

              {/* Title */}
              <h2
                className="product-title"
                onClick={() =>
                  setExpanded(expanded === product.id ? null : product.id)
                }
              >
                {product.name}
              </h2>

              {/* Details */}
              {expanded === product.id && (
                <ProductDetails
                  product={product}
                  onQuantityChange={handleQuantityChange}
                  onOpenPopup={() => {
                    setPopupProduct(product);
                    setPopupQuantity(Math.min(product.stock, popupQuantity || 0.5));
                    setPopupPrice((popupQuantity || 0.5) * product.price);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {popupProduct && user && (
        <OrderPopup
          product={popupProduct}
          user={user}
          quantity={popupQuantity}
          totalPrice={popupPrice}
          onClose={() => setPopupProduct(null)}
          onConfirm={handleOrder}
        />
      )}
    </div>
  );
}

function ProductDetails({ product, onQuantityChange, onOpenPopup }) {
  const maxQuantity = product.stock > 0 ? Math.min(product.stock, 20) : 0;
  const [quantity, setQuantity] = useState(0.5);

  useEffect(() => {
    onQuantityChange(product.id, quantity, product.price);
  }, [quantity, product.price, product.id, onQuantityChange]);

  return (
    <div className="product-details expanded">
      <p>{product.description}</p>
      <p>Price per kg: ₹{product.price}</p>
      <p>Stock: {product.stock} kg</p>

      <div>
        <label>Quantity (kg): {quantity.toFixed(1)}</label>
        <input
          type="range"
          min="0.5"
          max={maxQuantity || 0.5}
          step="0.1"
          value={Number(quantity)}
          onChange={(e) => setQuantity(Number(e.target.value))}
          disabled={product.stock <= 0}
        />
      </div>

      <p>Total: ₹{(product.price * quantity).toFixed(2)}</p>

      <button
        onClick={onOpenPopup}
        disabled={product.stock <= 0}
        className={product.stock > 0 ? "btn-green" : "btn-disabled"}
      >
        🛒 {product.stock > 0 ? "Place Order" : "Out of Stock"}
      </button>
    </div>
  );
}

function OrderPopup({ product, user, quantity, totalPrice, onClose, onConfirm }) {
  const [form, setForm] = useState({
    mobile: user.whatsapp || "",
    address: user.address || "",
    quantity: quantity,
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, quantity }));
  }, [quantity]);

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <h2>Order: {product.name}</h2>
        <p>Price per kg: ₹{product.price}</p>
        <p>Total: ₹{(product.price * form.quantity).toFixed(2)}</p>

        <label>
          Quantity (kg):
          <input
            type="number"
            min="0.5"
            max={Math.min(product.stock, 20)}
            step="0.1"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: Number(e.target.value) })
            }
          />
        </label>

        <label>
          Mobile:
          <input
            type="text"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />
        </label>

        <label>
          Address:
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </label>

        <div className="popup-actions">
          <button onClick={() => onConfirm(product, form.quantity, form)} className="btn-green">
            Confirm Order
          </button>
          <button onClick={onClose} className="btn-red">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
