// src/pages/Products.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./Products.css";

export default function Products() {
  const { vendorId } = useParams(); // from route /vendor/:vendorId
  const [products, setProducts] = useState([]);
  const [expanded, setExpanded] = useState(null); // Track expanded product
  const [priceFilter, setPriceFilter] = useState([0, 1000]); // min-max filter

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
      if (quantity < 0.1) return; // minimum 100g

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

      setQuantity(0.1); // reset to 100g
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to place order");
    }
  };

  // Filter products by price
  const filteredProducts = products.filter(
    (p) => p.price >= priceFilter[0] && p.price <= priceFilter[1]
  );

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Products</h1>

      {/* Price Filter */}
      <div className="mb-4">
        <label className="block text-gray-700">Price Filter: ₹{priceFilter[0]} - ₹{priceFilter[1]}</label>
        <input
          type="range"
          min="0"
          max="1000"
          value={priceFilter[1]}
          onChange={(e) => setPriceFilter([priceFilter[0], Number(e.target.value)])}
          className="w-full"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white shadow rounded-lg">
              {/* Product heading */}
              <div
                className="p-4 cursor-pointer flex justify-between items-center"
                onClick={() =>
                  setExpanded(expanded === product.id ? null : product.id)
                }
              >
                <h2 className="font-semibold text-lg">{product.name}</h2>
                <span>{expanded === product.id ? "▲" : "▼"}</span>
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

// Product details component
function ProductDetails({ product, onOrder }) {
  const [quantity, setQuantity] = useState(0.1); // Start from 100g = 0.1kg

  const maxQuantity = product.stock > 0 ? product.stock : 0;

  return (
    <div className="p-4 border-t border-gray-200 space-y-2">
      {product.image && (
        <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded" />
      )}
      <p className="text-gray-600">{product.description}</p>
      <p className="text-gray-500">Price per kg: ₹{product.price}</p>
      <p className="text-gray-500">Stock: {product.stock} kg</p>

      {/* Quantity Slider */}
      <div>
        <label className="block text-gray-700">Quantity (kg): {quantity.toFixed(2)}</label>
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

      <p className="text-gray-700">Total: ₹{(product.price * quantity).toFixed(2)}</p>

      <button
        onClick={() => onOrder(product, quantity, setQuantity)}
        disabled={product.stock <= 0}
        className={`mt-2 px-4 py-2 w-full text-white rounded ${
          product.stock > 0 ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        🛒 {product.stock > 0 ? "Place Order" : "Out of Stock"}
      </button>
    </div>
  );
}
