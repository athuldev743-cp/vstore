// Products.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./Products.css";

export default function Products() {
  const { vendorId } = useParams();
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [user, setUser] = useState(null);
  const [popupProduct, setPopupProduct] = useState(null);

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

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="products-container flex flex-col md:flex-row max-w-md mx-auto p-4">
      {/* Titles List */}
      <div className="titles-list w-full md:w-1/3 border-r md:border-r-gray-300">
        {products.map((product) => (
          <div
            key={product.id}
            className={`product-title-item p-2 cursor-pointer border-b ${
              selectedProductId === product.id ? "bg-gray-200 font-bold" : ""
            }`}
            onClick={() => setSelectedProductId(product.id)}
          >
            {product.name}
          </div>
        ))}
      </div>

      {/* Product Details */}
      <div className="details-section w-full md:w-2/3 mt-4 md:mt-0 md:pl-4">
        {selectedProduct ? (
          <ProductDetails
            product={selectedProduct}
            onOpenPopup={() => setPopupProduct(selectedProduct)}
          />
        ) : (
          <p>Select a product to see details</p>
        )}
      </div>

      {/* Order Popup */}
      {popupProduct && user && (
        <OrderPopup
          product={popupProduct}
          user={user}
          onClose={() => setPopupProduct(null)}
          onConfirm={handleOrder}
        />
      )}
    </div>
  );
}

function ProductDetails({ product, onOpenPopup }) {
  return (
    <div className="product-details p-2 border rounded space-y-2">
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-40 object-cover rounded"
        />
      )}
      <p className="text-gray-600">{product.description}</p>
      <p className="text-gray-500">Price per kg: ₹{product.price}</p>
      <p className="text-gray-500">Stock: {product.stock} kg</p>

      <button
        onClick={onOpenPopup}
        disabled={product.stock <= 0}
        className={`mt-2 px-4 py-2 w-full text-white rounded ${
          product.stock > 0
            ? "bg-green-600 hover:bg-green-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        🛒 {product.stock > 0 ? "Place Order" : "Out of Stock"}
      </button>
    </div>
  );
}

function OrderPopup({ product, user, onClose, onConfirm }) {
  const [form, setForm] = useState({
    mobile: user.whatsapp || "",
    address: user.address || "",
    quantity: 0.1,
  });

  return (
    <div className="popup-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="popup-card bg-white p-4 rounded shadow w-11/12 max-w-sm space-y-2">
        <h2 className="text-lg font-bold">Order: {product.name}</h2>
        <p>Price: ₹{product.price} / kg</p>

        <label>
          Quantity (kg):
          <input
            type="number"
            min="0.1"
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

        <div className="popup-actions flex justify-between mt-2">
          <button
            className="bg-green-600 text-white px-3 py-1 rounded"
            onClick={() => onConfirm(product, form.quantity, form)}
          >
            Confirm Order
          </button>
          <button
            className="bg-gray-400 px-3 py-1 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
