// src/pages/Products.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./Products.css";

export default function Products() {
  const { vendorId } = useParams();
  const [products, setProducts] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await StoreAPI.getVendorProducts(vendorId);
        setProducts(res);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    }
    fetchProducts();
  }, [vendorId]);

  const handleOrder = async (product, quantity, setQuantity) => {
    try {
      if (quantity < 0.1) return;

      const res = await StoreAPI.placeOrder({
        product_id: product.id,
        quantity,
      });

      alert(`Order placed! Remaining stock: ${res.remaining_stock} kg`);

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, stock: res.remaining_stock } : p
        )
      );

      setQuantity(0.1);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to place order");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Products</h1>

      {products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div key={product.id} className="bg-white shadow rounded-lg">
              {/* Collapsed heading: 100x100 image + title */}
              <div
                className="product-collapsed cursor-pointer"
                onClick={() =>
                  setExpanded(expanded === product.id ? null : product.id)
                }
              >
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="product-image"
                  />
                )}
                <h2 className="product-title">{product.name}</h2>
              </div>

              {/* Expanded details */}
              {expanded === product.id && (
                <ProductDetails product={product} onOrder={handleOrder} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductDetails({ product, onOrder }) {
  const [quantity, setQuantity] = useState(0.1);

  const maxQuantity = product.stock > 0 ? Math.min(product.stock, 20) : 0; // max 20kg

  return (
    <div className="p-4 border-t border-gray-200 space-y-2">
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

      <div>
        <label className="block text-gray-700">
          Quantity (kg): {quantity.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.1"
          max={maxQuantity}
          step="0.1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full"
          disabled={product.stock <= 0}
        />
      </div>

      <p className="text-gray-700">
        Total: ₹{(product.price * quantity).toFixed(2)}
      </p>

      <button
        onClick={() => onOrder(product, quantity, setQuantity)}
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
