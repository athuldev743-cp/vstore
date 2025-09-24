// src/pages/Products.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";

export default function Products() {
  const { vendorId } = useParams(); // from route /vendor/:vendorId
  const [products, setProducts] = useState([]);

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
      if (quantity < 1) return;

      const res = await StoreAPI.placeOrder({
        product_id: product.id,
        quantity,
      });

      alert(`Order placed! Remaining stock: ${res.remaining_stock}`);

      // Update product stock locally
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, stock: res.remaining_stock } : p
        )
      );

      setQuantity(1); // Reset slider
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to place order");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Products</h1>
      {products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div className="space-y-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOrder={handleOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onOrder }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-lg font-semibold">{product.name}</h2>
      <p className="text-gray-600">{product.description}</p>
      <p className="text-gray-500">Price per unit: ₹{product.price}</p>
      <p className="text-gray-500">Stock: {product.stock}</p>

      {/* Quantity Slider */}
      <input
        type="range"
        min="1"
        max={product.stock > 0 ? product.stock : 1}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="w-full mt-2"
        disabled={product.stock <= 0}
      />
      <div className="flex justify-between mt-2">
        <span>Quantity: {quantity}</span>
        <span>Total: ₹{(product.price * quantity).toFixed(2)}</span>
      </div>

      <button
        onClick={() => onOrder(product, quantity, setQuantity)}
        disabled={product.stock <= 0}
        className={`mt-3 px-4 py-2 text-white rounded ${
          product.stock > 0 ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        🛒 {product.stock > 0 ? "Place Order" : "Out of Stock"}
      </button>
    </div>
  );
}
